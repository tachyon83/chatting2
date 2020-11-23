import Vue from 'vue'
// import socketio from '../src/plugins/socketio'
import VueSocketIO from 'vue-socket.io'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

Vue.use(new VueSocketIO({
  debug: true,
  connection: 'http://localhost:3000',
  vuex: {
    store,
    actionPrefix: 'SOCKET_',
    mutationPrefix: 'SOCKET_'
  },
  // options: { path: "/my-app/" } //Optional options
}))

new Vue({
  methods: {
    testFromClient() {
      this.$socket.emit('from.client2', 'ping!')
    }
  },
  router,
  store,
  render: h => h(App)
}).$mount('#app')
