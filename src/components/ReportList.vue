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
  max-height: 240px; /* give its own scroll area */
  overflow: auto;
  position: relative;
  padding-top: 0;
  border: 1px solid #242424;
  border-radius: 6px;
  background: #161616;
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

li {
  padding: 4px 6px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  font-size: 12px;
}

li.active { background: #333; }

li:hover {
  background: #222;
}
</style>
