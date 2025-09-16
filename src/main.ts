import { createApp } from 'vue'
import App from './App.vue'
import './tailwind.css'
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ru from './locales/ru.json'
import uk from './locales/uk.json'
import de from './locales/de.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import pl from './locales/pl.json'
import enUS from './locales/en-US.json'
import es from './locales/es.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import ptBR from './locales/pt-BR.json'
import pt from './locales/pt.json'

const messages = { 
  en, 
  ru, 
  uk, 
  de, 
  'zh-CN': zhCN, 
  'zh-TW': zhTW, 
  pl, 
  'en-US': enUS, 
  es, 
  ja, 
  ko, 
  'pt-BR': ptBR, 
  pt 
}
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages
})

createApp(App).use(i18n).mount('#app')

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/xmcl-log-viewer/sw.js').catch(e => console.error('SW registration failed', e))
	})
}
