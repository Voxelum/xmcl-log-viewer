import JSZip from 'jszip'
import type { ReportBundle, DeviceInfo, LogFileEntry } from '../types'

const LOG_EXT = '.log'

interface ContainerInfo { label: string; time?: number }

function parseTimestampLabel(name: string): ContainerInfo {
  // name without .zip, may contain '!' instead of ':'
  const base = name.replace(/\.zip$/i, '')
  const candidate = base.replace(/!/g, ':')
  const t = Date.parse(candidate)
  if (!isNaN(t)) return { label: candidate, time: t }
  return { label: base }
}

async function unzipNested(
  zip: JSZip,
  baseReportId: string,
  collector: LogFileEntry[],
  raw: Record<string, Uint8Array>,
  containerStack: ContainerInfo[] = []
) {
  const tasks: Promise<void>[] = []
  zip.forEach((relativePath: string, entry: JSZip.JSZipObject) => {
    const task = (async () => {
      if (entry.dir) return
      const lower = relativePath.toLowerCase()
      if (lower.endsWith('.zip')) {
        const data = await entry.async('uint8array')
        raw[relativePath] = data
        const nested = await JSZip.loadAsync(data)
        const fileName = relativePath.split(/[/\\]/).pop() || relativePath
        const container = parseTimestampLabel(fileName)
        await unzipNested(nested, baseReportId, collector, raw, [...containerStack, container])
      } else if (lower.endsWith(LOG_EXT)) {
        const data = await entry.async('string')
        const container = containerStack[containerStack.length - 1]
        const logicalPath = relativePath.replace(/\\/g, '/')
        const prefixedPath = container ? `${container.label}/${logicalPath}` : logicalPath
        collector.push({
          path: prefixedPath,
          content: data,
          size: data.length,
          reportId: baseReportId,
          container: container?.label,
          containerTime: container?.time,
        })
      } else if (lower.endsWith('device.json')) {
        const text = await entry.async('string')
        try {
          const json: DeviceInfo = JSON.parse(text)
          raw['device.json'] = new TextEncoder().encode(text)
          ;(collector as any).__device = json
        } catch (e) {
          console.warn('Failed parse device.json', e)
        }
      } else {
        const data = await entry.async('uint8array')
        raw[relativePath] = data
      }
    })()
    tasks.push(task)
  })
  await Promise.all(tasks)
}

export async function parseReportZip(file: File): Promise<ReportBundle> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)
  const logs: LogFileEntry[] = []
  const raw: Record<string, Uint8Array> = {}
  await unzipNested(zip, file.name.replace(/\.zip$/i, ''), logs, raw)
  const device: DeviceInfo | undefined = (logs as any).__device
  delete (logs as any).__device
  // Sort logs: first by containerTime (ascending), undefined last; then by path
  logs.sort((a, b) => {
    if (a.containerTime !== b.containerTime) {
      if (a.containerTime == null) return 1
      if (b.containerTime == null) return -1
      return (a.containerTime as number) - (b.containerTime as number)
    }
    return a.path.localeCompare(b.path)
  })
  return {
    id: file.name.replace(/\.zip$/i, ''),
    device,
    logs,
    rawFiles: raw,
  }
}

export async function parseMultipleReports(files: FileList | File[]): Promise<ReportBundle[]> {
  const zips = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.zip'))
  const results: ReportBundle[] = []
  for (const f of zips) {
    try {
      results.push(await parseReportZip(f))
    } catch (e) {
      console.error('Failed parse zip', f.name, e)
    }
  }
  return results
}
