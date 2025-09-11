<template>
  <div class="report-list">
    <h3>Reports</h3>
    <ul>
      <li v-for="r in reports" :key="r.id" :class="{ active: r.id === modelValue }"
        @click="$emit('update:modelValue', r.id)">
        <strong>{{ r.id }}</strong>
        <span v-if="r.device"> - {{ r.device.platform }} {{ r.device.arch }}</span>
        <small> ({{ r.logs.length }} logs)</small>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import type { ReportBundle } from '../types'

defineProps<{ reports: ReportBundle[], modelValue?: string }>()
</script>
<style scoped>
.report-list {
  max-height: 300px;
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
</style>
