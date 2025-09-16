<template>
  <div class="log-tree">
    <h3>{{ $t('logFiles') }}</h3>
    <ul>
      <li v-for="l in logFiles" :key="l.path" :class="{ active: l.path === modelValue }" @click="$emit('update:modelValue', l.path)">
        <div class="row1">
          <template v-if="l.container">
            <span class="container" :title="l.containerTime ? new Date(l.containerTime).toLocaleString() : ''">{{ l.container }}</span>/<span>{{ subPath(l) }}</span>
          </template>
          <template v-else>{{ l.path }}</template>
        </div>
        <div class="row2">
          <small class="size">{{ formatSize(l.size) }}</small>
          <small v-if="l.mtime" class="mtime" :title="new Date(l.mtime).toLocaleString()">{{ new Date(l.mtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</small>
        </div>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import type { LogFileEntry } from '../types'

const props = defineProps<{ logFiles: LogFileEntry[], modelValue?: string }>()
defineEmits<{ 'update:modelValue': [string] }>()

function formatSize(s: number) {
  if (s < 1024) return s + ' B'
  if (s < 1024 * 1024) return (s / 1024).toFixed(1) + ' KB'
  return (s / 1024 / 1024).toFixed(2) + ' MB'
}

function subPath(l: LogFileEntry) {
  if (!l.container) return l.path
  return l.path.substring(l.container.length + 1)
}
</script>
<style scoped>
.log-tree {
  max-height: 340px;
  overflow: auto;
  position: relative;
  border: 1px solid #242424;
  border-radius: 6px;
  background: #161616;
  margin-top: 8px;
}

h3 {
  position: sticky;
  top: 0;
  background: #1d1d1d;
  z-index: 2;
  margin: 0;
  padding: 6px 8px 6px;
  font-size: 13px;
  letter-spacing: .5px;
  border-bottom: 1px solid #2a2a2a;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li { padding: 4px 6px 6px; cursor: pointer; border-bottom: 1px solid #333; font-size: 12px; display:flex; flex-direction:column; gap:2px; }
.row1 { display:flex; flex-wrap:wrap; gap:4px; }
.row2 { display:flex; justify-content:space-between; font-size:10px; opacity:.65; }
.row2 .mtime { font-variant-numeric: tabular-nums; }

li.active { background: #333; }

li:hover {
  background: #222;
}
.container { color: #6fa8ff; }
</style>
