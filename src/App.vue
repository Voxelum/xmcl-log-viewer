<template>
  <div class="app font-sans text-white bg-gray-900 min-h-screen flex flex-col transition-colors duration-300">
    <header>
      <h1>{{ $t('title') }}</h1>
      <div class="actions">
        <button @click="triggerFolderInput" class="action-btn">{{ $t('chooseFolder') }}</button>
        <input ref="folderInput" type="file" multiple webkitdirectory directory hidden @change="onFolderChange" />
        <button @click="triggerZipInput" class="action-btn">{{ $t('chooseZipFiles') }}</button>
        <input ref="zipInput" type="file" multiple accept=".zip" hidden @change="onFilesPicked" />
        <button @click="pickDirectory" class="action-btn">{{ $t('openFolder') }}</button>
      </div>
      <div class="languages relative">
  <button @click="toggleDropdown($event)" class="language-toggle-btn flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm font-medium text-white hover:bg-gray-700 transition-colors">
    {{ currentLanguageName }}
    <svg class="language-icon w-4 h-4 transition-transform" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </button>
  <transition name="dropdown">
    <div v-if="showDropdown" class="language-dropdown absolute right-0 w-72 bg-gray-800 rounded-lg shadow-xl py-2 z-10 max-h-[80vh] overflow-y-auto border border-gray-700"
         :class="dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'">
      <button 
        v-for="(name, code) in languages" 
        :key="code" 
        @click="selectLanguage(code)" 
        class="language-option block w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-all duration-200 border-l-2 border-transparent hover:border-blue-400"
        :class="{ 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md border-l-2 border-blue-300': code === locale }"
      >
        {{ name }}
      </button>
    </div>
  </transition>
</div>
    </header>

    <main>
      <aside>
        <ReportList :reports="sortedReports" v-model="selectedReportId" />
        <DeviceInfoPanel :device="currentReport?.device" />
        <LogFileTree v-if="currentReport" :log-files="currentReport.logs" v-model="selectedLogPath" />
      </aside>
      <section class="viewer" v-if="currentLog">
        <h3>{{ currentLog.path }}</h3>
        <LogViewer :content="currentLog.content" :path="currentLog.path" />
      </section>
      <section v-else class="empty flex-1 flex items-center justify-center text-gray-500 animate-pulse">
        <p>{{ $t('selectLog') }}</p>
      </section>
    </main>
    
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import ReportList from './components/ReportList.vue'
import DeviceInfoPanel from './components/DeviceInfoPanel.vue'
import LogFileTree from './components/LogFileTree.vue'
import LogViewer from './components/LogViewer.vue'
import { parseMultipleReports, parseReportZip } from './logic/zip'
import type { ReportBundle } from './types'

const { locale } = useI18n()
const showDropdown = ref(false)
const loading = ref(false)
const folderInput = ref<HTMLInputElement | null>(null)
const zipInput = ref<HTMLInputElement | null>(null)

const languages = {
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  uk: '🇺🇦 Українська',
  de: '🇩🇪 Deutsch',
  'zh-CN': '🇨🇳 简体中文',
  'zh-TW': '🇹🇼 繁體中文',
  pl: '🇵🇱 Polski',
  'en-US': '🇺🇸 American English',
  es: '🇪🇸 Español',
  ja: '🇯🇵 日本語',
  ko: '🇰🇷 한국어',
  'pt-BR': '🇧🇷 Português (Brasil)',
  pt: '🇵🇹 Português'
}
const currentLanguageName = computed(() => languages[locale.value] || 'English')

const dropdownPosition = ref('bottom')

function toggleDropdown(event: MouseEvent) {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    nextTick(() => {
      const button = event.target as HTMLElement
      const dropdown = button.nextElementSibling as HTMLElement
      const buttonRect = button.getBoundingClientRect()
      const dropdownHeight = dropdown.offsetHeight
      const spaceBelow = window.innerHeight - buttonRect.bottom
      dropdownPosition.value = spaceBelow < dropdownHeight ? 'top' : 'bottom'
    })
  }
}
function selectLanguage(lang: string) {
  locale.value = lang
  showDropdown.value = false
}

function triggerFolderInput() {
  if (folderInput.value) folderInput.value.click()
}

function triggerZipInput() {
  if (zipInput.value) zipInput.value.click()
}

const reports = ref<ReportBundle[]>([])
const sortedReports = computed(() => {
  return [...reports.value].sort((a, b) => {
    const ta = a.lastModified ?? 0
    const tb = b.lastModified ?? 0
    if (tb !== ta) return tb - ta // newest first
    return a.id.localeCompare(b.id)
  })
})
const selectedReportId = ref<string | undefined>()
const selectedLogPath = ref<string | undefined>()

const currentReport = computed(() => reports.value.find((r: ReportBundle) => r.id === selectedReportId.value))
const currentLog = computed(() => currentReport.value?.logs.find((l: any) => l.path === selectedLogPath.value))

async function onFilesPicked(e: Event) {
  loading.value = true
  try {
    const input = e.target as HTMLInputElement
    if (!input.files) return
    const parsed = await parseMultipleReports(input.files)
    addReports(parsed)
  } finally {
    loading.value = false
  }
}

function addReports(newReports: ReportBundle[]) {
  for (const r of newReports) {
    const existingIndex = reports.value.findIndex((i: ReportBundle) => i.id === r.id)
    if (existingIndex >= 0) reports.value.splice(existingIndex, 1, r)
    else reports.value.push(r)
  }
  if (!selectedReportId.value && sortedReports.value.length) selectedReportId.value = sortedReports.value[0].id
}

async function onFolderChange(e: Event) {
  loading.value = true
  try {
    const input = e.target as HTMLInputElement
    if (!input.files) return
    await handleZipFileList(input.files)
  } finally {
    loading.value = false
  }
}

async function handleZipFileList(files: FileList | File[]) {
  loading.value = true
  try {
    const onlyZips = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.zip'))
    for (const f of onlyZips) {
      try { addReports([await parseReportZip(f)]) } catch (e) { console.error(e) }
    }
  } finally {
    loading.value = false
  }
}

async function pickDirectory() {
  loading.value = true
  try {
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
  } finally {
    loading.value = false
  }
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
  align-items: flex-start;
  justify-content: space-between;
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

.languages {
  position: relative;
  margin-left: 16px;
  margin-right: 16px;
}

.language-toggle-btn {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
  color: white;
  font-weight: 500;
  border: 1px solid #444;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-toggle-btn::before {
  content: '🌐';
  font-size: 16px;
}

.language-dropdown {
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  background: #1a1a1a;
  border: 1px solid #333;
  width: 280px;
  max-height: 400px;
  overflow-y: auto;
}

.language-option {
  border-radius: 8px;
  margin: 4px;
  padding: 10px 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.language-option:hover {
  background-color: #2a2a2a;
  transform: translateX(2px);
}

.language-option.bg-gradient-to-r {
  box-shadow: 0 2px 8px rgba(59,130,246,0.4);
  border-left: 2px solid #4d8bf8;
}
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}
.language-option {
  transition: all 0.3s ease-in-out;
}
.language-option:hover {
  transform: scale(1.03);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.language-option:active {
  transform: scale(0.97);
  transition: transform 0.1s ease-in-out;
}
.language-toggle-btn {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
  color: white;
  font-weight: 500;
  border: 1px solid #444;
}

.language-dropdown {
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  background: #1a1a1a;
  border: 1px solid #333;
}

.language-option {
  border-radius: 8px;
  margin: 4px;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.language-option:hover {
  background-color: #2a2a2a;
  transform: translateX(2px);
}

.language-option.bg-gradient-to-r {
  box-shadow: 0 2px 8px rgba(59,130,246,0.4);
  border-left: 2px solid #4d8bf8;
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
