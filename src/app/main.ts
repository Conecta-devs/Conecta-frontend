import { createApp } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import router from '../router'
import './styles/tailwind.css'
import App from './App.vue'

createApp(App).component('font-awesome-icon', FontAwesomeIcon).use(router).mount('#app')
