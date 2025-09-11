import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/xmcl-log-viewer/sw.js').catch(e => console.error('SW registration failed', e))
	})
}
