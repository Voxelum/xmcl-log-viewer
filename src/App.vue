<template>
  <div class="app">
    <header>
      <h1>XMCL Log Viewer</h1>
      <div class="actions">
        <input type="file" multiple webkitdirectory directory @change="onFolderChange" />
        <input type="file" multiple accept=".zip" @change="onFilesPicked" />
        <button @click="pickDirectory">Open Folder (FS API)</button>
      </div>
    </header>

  <main>
      <aside>
        <ReportList :reports="reports" v-model="selectedReportId" />
        <DeviceInfoPanel :device="currentReport?.device" />
        <LogFileTree v-if="currentReport" :log-files="currentReport.logs" v-model="selectedLogPath" />
      </aside>
      <section class="viewer" v-if="currentLog">
        <h3>{{ currentLog.path }}</h3>
        <LogViewer :content="currentLog.content" :path="currentLog.path" />
      </section>
      <section v-else class="empty">
        <p>Select a log file to view.</p>
      </section>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import ReportList from './components/ReportList.vue'
import DeviceInfoPanel from './components/DeviceInfoPanel.vue'
import LogFileTree from './components/LogFileTree.vue'
import LogViewer from './components/LogViewer.vue'
import { parseMultipleReports, parseReportZip } from './logic/zip'
import type { ReportBundle } from './types'

const reports = ref<ReportBundle[]>([])
const selectedReportId = ref<string | undefined>()
const selectedLogPath = ref<string | undefined>()

const currentReport = computed(() => reports.value.find((r: ReportBundle) => r.id === selectedReportId.value))
const currentLog = computed(() => currentReport.value?.logs.find((l: any) => l.path === selectedLogPath.value))

async function onFilesPicked(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const parsed = await parseMultipleReports(input.files)
  addReports(parsed)
  input.value = ''
}

function addReports(newReports: ReportBundle[]) {
  for (const r of newReports) {
    const existingIndex = reports.value.findIndex((i: ReportBundle) => i.id === r.id)
    if (existingIndex >= 0) reports.value.splice(existingIndex, 1, r)
    else reports.value.push(r)
  }
  if (!selectedReportId.value && reports.value.length) selectedReportId.value = reports.value[0].id
}

async function onFolderChange(e: Event) {
  // Fallback input with webkitdirectory attribute
  const input = e.target as HTMLInputElement
  if (!input.files) return
  await handleZipFileList(input.files)
  input.value = ''
}

async function handleZipFileList(files: FileList | File[]) {
  const onlyZips = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.zip'))
  for (const f of onlyZips) {
    try { addReports([await parseReportZip(f)]) } catch (e) { console.error(e) }
  }
}

async function pickDirectory() {
  if (!('showDirectoryPicker' in window)) {
    alert('File System Access API not supported in this browser.')
    return
  }
  // @ts-ignore
  const dirHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker()
  const zips: File[] = []
  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.zip')) {
      const file = await entry.getFile()
      zips.push(file)
    }
  }
  await handleZipFileList(zips)
}
</script>
<style scoped>
.app {
  font-family: system-ui, sans-serif;
  color: #eee;
  background: #111;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  padding: 10px 16px;
  background: #1d1d1d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h1 {
  font-size: 18px;
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

main {
  display: flex;
  gap: 12px;
  padding: 12px;
  flex: 1;
  min-height: 0; /* allow children overflow */
  overflow: hidden;
}

aside {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
}

.viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

input[type=file] {
  max-width: 170px;
}
/* Enhanced file input styling */
.actions input[type=file] {
  padding: 4px 8px;
  font-size: 12px;
  background: #1a1a1a;
  border: 1px solid #2c2c2c;
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.actions input[type=file]:hover {
  border-color: #3d3d3d;
  background: #202020;
}
.actions input[type=file]:focus-visible {
  outline: 2px solid #3a7afe;
  outline-offset: 2px;
}
/* Chrome / Edge button */
.actions input[type=file]::-webkit-file-upload-button {
  background: #2c2c2c;
  border: none;
  border-radius: 4px;
  color: #ddd;
  padding: 4px 10px;
  margin-right: 6px;
  cursor: pointer;
  transition: background .15s;
  font-weight: 500;
}
.actions input[type=file]::-webkit-file-upload-button:hover {
  background: #3a3a3a;
}
.actions input[type=file]::-webkit-file-upload-button:active {
  background: #454545;
}
.actions button {
  background: #2658d8;
  border: none;
  color: #fff;
  padding: 6px 14px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  letter-spacing: .3px;
  transition: background .15s, transform .15s;
}
.actions button:hover { background: #2f68f0; }
.actions button:active { background: #244fb4; transform: translateY(1px); }
.actions button:focus-visible { outline: 2px solid #6ea8ff; outline-offset: 2px; }
</style>
<!-- Global (unscoped) styles for scrollbars and shared variables -->
<style>
:root {
  --bg-root: #111;
  --bg-elevated: #1a1a1a;
  --border-color: #2a2a2a;
  --scroll-thumb: #2f2f2f;
  --scroll-thumb-hover: #3a3a3a;
  --scroll-thumb-active: #4a4a4a;
}

/* Modern scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) transparent;
}
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 12px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:hover { background: var(--scroll-thumb-hover); }
*::-webkit-scrollbar-thumb:active { background: var(--scroll-thumb-active); }
*::-webkit-scrollbar-corner { background: transparent; }

/* Smooth scrolling for a nicer feel */
html { scroll-behavior: smooth; }

/* Selection color */
::selection { background: #2d72ff55; color: #fff; }
</style>
