<template>
  <div v-if="device" class="device-info">
    <h3>{{ $t('deviceInfo') }}</h3>
    <table>
      <tbody>
        <tr v-for="(v, k) in device" :key="k">
          <th>{{ k }}</th>
          <td>{{ v }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="device-info-empty">{{ $t('noDevice') }}</div>
</template>

<script setup lang="ts">
import type { DeviceInfo } from '../types'

defineProps<{ device?: DeviceInfo | null }>()
</script>

<style scoped>
.device-info table {
  border-collapse: collapse;
}

.device-info th {
  text-align: left;
  padding: 2px 6px;
  /* background: #eee; */
}

.device-info td {
  padding: 2px 6px;
}

.device-info-empty {
  font-style: italic;
  color: #666;
}
</style>
