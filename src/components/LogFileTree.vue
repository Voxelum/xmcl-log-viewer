<template>
  <div class="log-tree">
    <h3>Log Files</h3>
    <ul>
      <li v-for="l in logFiles" :key="l.path" :class="{ active: l.path === modelValue }" @click="$emit('update:modelValue', l.path)">
        <template v-if="l.container">
          <span class="container" :title="l.containerTime ? new Date(l.containerTime).toLocaleString() : ''">{{ l.container }}</span>/<span>{{ subPath(l) }}</span>
        </template>
        <template v-else>{{ l.path }}</template>
        <small> ({{ formatSize(l.size) }})</small>
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
  max-height: 400px;
  overflow: auto;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 4px 6px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  font-size: 12px;
}

li.active {
  background: #333;
}

li:hover {
  background: #222;
}
.container { color: #6fa8ff; }
</style>
