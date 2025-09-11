export interface DeviceInfo {
  sessionId: string
  platform: string
  arch: string
  version: string
  release: string
  type: string
  [k: string]: any
}

export interface LogFileEntry {
  path: string // logical path like logs/main.log
  content: string
  size: number
  reportId: string // which report zip it belongs to (root folder name or file name)
  container?: string // nested zip (timestamp label or zip name)
  containerTime?: number // parsed time (ms) if container name is timestamp
  mtime?: number // original file modified time from zip entry (ms)
}

export interface ReportBundle {
  id: string // derived from zip filename (without ext)
  device?: DeviceInfo
  logs: LogFileEntry[]
  rawFiles: { [path: string]: Uint8Array }
  lastModified?: number // original zip file lastModified timestamp (ms)
}
