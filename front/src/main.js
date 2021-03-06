import Vue from 'vue'
// import socketio from '../src/plugins/socketio'
import VueSocketIO from 'vue-socket.io'
import App from './App.vue'
import router from './router'
import store from './store'
import envSettings from './envSettings'
import axios from 'axios'
Vue.prototype.$http = axios
Vue.prototype.$envSettings = envSettings
Vue.config.productionTip = false

Vue.use(new VueSocketIO({
  debug: true,
  connection: envSettings.back,
  vuex: {
    store,
    actionPrefix: 'SOCKET123_',
    mutationPrefix: 'SOCKET_'
  },
  // options: { path: "/my-app/" } //Optional options
  options: {
    withCredentials: true,
  }
}))

new Vue({
  // methods: {
  //   testFromClient() {
  //     this.$socket.emit('from.client2', 'ping!')
  //   }
  // },
  router,
  store,
  render: h => h(App)
}).$mount('#app')
