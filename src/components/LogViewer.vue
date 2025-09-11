<template>
  <div class="log-viewer">
    <div class="toolbar">
      <label>
        Filter:
        <input v-model="filter" placeholder="Regex or text" />
      </label>
      <span v-if="stats" class="info">{{ stats.visible }} / {{ stats.total }} lines</span>
      <span v-if="isLarge" class="warn">Large file</span>
    </div>
    <div ref="editorEl" class="editor"></div>
    <div v-if="filtering" class="overlay">Filtering...</div>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { onMounted, ref, watch, onBeforeUnmount, computed } from 'vue'
import { ensureLogLanguage } from '../monaco/logLanguage'

const props = defineProps<{ content: string, path: string }>()

const editorEl = ref<HTMLElement | null>(null)
let originalModel: monaco.editor.ITextModel | undefined
let filteredModel: monaco.editor.ITextModel | undefined
let editor: monaco.editor.IStandaloneCodeEditor | undefined
const filter = ref('')
const filtering = ref(false)
const stats = ref<{ total: number; visible: number } | null>(null)
const isLarge = computed(() => props.content.length > 5_000_000)
let debounceHandle: number | undefined

function disposeFiltered() { if (filteredModel) { filteredModel.dispose(); filteredModel = undefined } }
function disposeOriginal() { if (originalModel) { originalModel.dispose(); originalModel = undefined } }

function recreateOriginalModel() {
  disposeFiltered(); disposeOriginal()
  originalModel = monaco.editor.createModel(props.content, 'xmcl-log', monaco.Uri.parse(`inmemory://model/${props.path}`))
  stats.value = { total: originalModel.getLineCount(), visible: originalModel.getLineCount() }
  if (editor) editor.setModel(originalModel)
  if (filter.value.trim()) setTimeout(() => applyFilterNow(), 0)
}

function applyFilterNow() {
  if (!originalModel) return
  const query = filter.value.trim()
  if (!query) {
    disposeFiltered(); stats.value = { total: originalModel.getLineCount(), visible: originalModel.getLineCount() }
    if (editor && originalModel) editor.setModel(originalModel)
    filtering.value = false; return
  }
  filtering.value = true
  window.setTimeout(() => {
    const raw = originalModel!.getValue()
    const lines = raw.split(/\r?\n/)
    let matcher: (l: string) => boolean
    try { const r = new RegExp(query, 'i'); matcher = (l: string) => r.test(l) } catch { matcher = (l: string) => l.includes(query) }
    const out: string[] = []
    for (let i = 0; i < lines.length; i++) { const line = lines[i]; if (matcher(line)) out.push(line) }
    const text = out.join('\n')
    disposeFiltered(); filteredModel = monaco.editor.createModel(text, 'xmcl-log')
    if (editor) editor.setModel(filteredModel)
    stats.value = { total: lines.length, visible: out.length }
    filtering.value = false
  }, 0)
}

watch(filter, () => { if (debounceHandle) window.clearTimeout(debounceHandle); debounceHandle = window.setTimeout(applyFilterNow, 200) })
watch(() => [props.path, props.content], () => { if (editor) recreateOriginalModel() })

onMounted(() => {
  if (!editorEl.value) return
  ensureLogLanguage()
  originalModel = monaco.editor.createModel(props.content, 'xmcl-log', monaco.Uri.parse(`inmemory://model/${props.path}`))
  stats.value = { total: originalModel.getLineCount(), visible: originalModel.getLineCount() }
  editor = monaco.editor.create(editorEl.value, {
    model: originalModel,
    language: 'xmcl-log',
    readOnly: true,
    theme: 'xmcl-log-dark',
    wordWrap: 'on',
    minimap: { enabled: false }
  })
})

onBeforeUnmount(() => { disposeFiltered(); disposeOriginal(); if (debounceHandle) window.clearTimeout(debounceHandle) })
</script>

<style scoped>
.log-viewer { display:flex; flex-direction:column; height:100%; position:relative; }
.toolbar { display:flex; gap:16px; align-items:center; font-size:12px; padding:4px 0 6px; }
.toolbar label { display:flex; align-items:center; gap:6px; font-weight:500; letter-spacing:.3px; }
.toolbar input {
  background:#1c1c1c;
  border:1px solid #333;
  color:#ddd;
  padding:6px 10px;
  font-size:12px;
  border-radius:6px;
  min-width:220px;
  line-height:1.2;
  transition:border-color .15s, background .15s, box-shadow .15s;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.toolbar input:hover { border-color:#3d3d3d; }
.toolbar input:focus-visible { outline:none; border-color:#4b7dff; box-shadow:0 0 0 2px #2d72ff55; }
.toolbar .info { opacity:.7; }
.editor { flex:1; min-height:300px; border:1px solid #2c2c2c; border-radius:8px; overflow:hidden; box-shadow:0 0 0 1px #000; }
.overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.45); font-size:14px; backdrop-filter: blur(2px); }
.warn { color:#d0a800; font-size:11px; background:#2e2500; padding:2px 6px; border-radius:4px; }
</style>
