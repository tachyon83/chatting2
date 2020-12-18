import Vue from 'vue'
import VueRouter from 'vue-router'
import login from '../views/login.vue'
// import login from '../components/login.vue'
import main from '../views/main.vue'
import home from "..//views/home.vue";
import board from '../views/board.vue'
import chat from '../views/chat.vue'
import chatLobby from '../components/chatLobby.vue'
import chatRoom from '../components/chatRoom.vue'
import setting from '../views/setting.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'login',
    component: login
  },
  {
    path: '/main',
    name: 'main',
    component: main,
    children: [
      {
        path: '',
        name: 'home',
        component: home
      },
      {
        path: 'board',
        name: 'board',
        component: board
      },
      {
        path: 'chat',
        name: 'chat',
        component: chat,
        children: [
          {
            path: '',
            name: 'chatLobby',
            component: chatLobby
          },
          {
            path: 'room',
            name: 'chatRoom',
            component: chatRoom
          },
        ]
      },
      {
        path: 'setting',
        name: 'setting',
        component: setting
      },
    ]
  },

]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
