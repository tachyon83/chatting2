import Vue from 'vue'
import VueRouter from 'vue-router'
import chat from '../views/chat.vue'
import chatLobby from '../components/chatLobby.vue'
import chatRoom from '../components/chatRoom.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'chat',
    component: chat
  },
  {
    path: '/lobby',
    name: 'chatLobby',
    component: chatLobby
  },
  {
    path: '/room',
    name: 'chatRoom',
    component: chatRoom
  },
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
