import { createApp } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import router from './router'
import './tailwind.css'
import './style.scss'
import App from './App.vue'

createApp(App).component('font-awesome-icon', FontAwesomeIcon).use(router).mount('#app')
