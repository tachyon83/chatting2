import Vue from 'vue'
import Vuex from 'vuex'
// import socket from '@/src/plugins/socketio.js'
import socket from './modules/socket'

Vue.use(Vuex)

export default new Vuex.Store({
  // state: {
  //   showModal: false,
  //   isRoom: false,
  //   userDTO: {
  //     name: 'right here',
  //     img: ''
  //   },
  //   // 그룹 속 유저리스트를 어떤 방식으로 받아올지?
  //   // 그룹 > 그룹명 | 유저리스트 => prop 공유해야함
  //   // this.$parent 방식 고려해보기 || this.emit
  //   groupDTO: {
  //     groupList: [
  //       {
  //         name: 'groupA',
  //         userList: [
  //           { name: 'name A' },
  //           { name: 'name B' },
  //           { name: 'name C' },
  //           { name: 'name D' },
  //           { name: 'name E' },
  //           { name: 'name A' },
  //           { name: 'name B' },
  //           { name: 'name C' },
  //           { name: 'name D' },
  //           { name: 'name E' },
  //           { name: 'name A' },
  //           { name: 'name B' },
  //           { name: 'name C' },
  //           { name: 'name D' },
  //           { name: 'name E' },
  //         ]
  //       },
  //       {
  //         name: 'groupB',
  //         userList: [
  //           { name: 'name D' },
  //           { name: 'name E' },
  //         ]
  //       },
  //       {
  //         name: 'groupC',
  //         userList: [
  //           { name: 'name A' }
  //         ]
  //       }
  //     ]
  //   },
  //   groupUserDTO: [
  //     { name: '유저1' },
  //     { name: 'asdfghjkl' },
  //     { name: '바닷가' },

  //   ],
  //   roomDTO: [
  //     {
  //       num: 1,
  //       tit: '제목입니다',
  //       own: '방방장장',
  //       userNowNum: 3,
  //       userNum: 5
  //     },
  //     {
  //       num: 2,
  //       tit: '제목입니sasdsafasfasfsaf다',
  //       own: '방장',
  //       userNowNum: 43,
  //       userNum: 50
  //     },
  //     {
  //       num: 3,
  //       tit: '제입니다',
  //       own: '방장장',
  //       userNowNum: 1,
  //       userNum: 3
  //     }
  //   ]
  // },
  modules: {
    socket,
  },
  // mutations: {
  // },
  // actions: {
  // },
})
