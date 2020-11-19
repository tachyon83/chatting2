import Vue from 'vue';
// import App from '@/App.vue'
import io from 'socket.io-client';
// import server from '../const/server-host';
// import VueSocketIO from 'vue-socket.io'

const socket = io('http://localhost:3000');

const SocketPlugin = {
    install(vue) {
        vue.mixin({
        });

        // vue.prototype.$sendMessage = ($payload) => {
        //     socket.emit('chat', {
        //         msg: $payload.msg,
        //         name: $payload.name,
        //     });
        // };

        // vue.prototype.$loadRoomList = ($payload) => {

        // }

        // 인스턴스 메소드 추가
        vue.prototype.$socket = socket;
    },
};

Vue.use(SocketPlugin);


// const Socket = new VueSocketIO({
//     debug: true,
//     connection: 'http://localhost:3000',
//     vuex: {
//         store,
//         actionPrefix: 'SOCKET_',
//         mutationPrefix: 'SOCKET_'
//     }
// })
// Vue.use()


// const socket = io(`${server.ChatServer}`);

// const SocketPlugin = {
//     install(vue) {
//         vue.mixin({});

//         vue.prototype.$join = (payload) => {
//             socket.emit('join', payload);
//         };

//         vue.prototype.$leave = (payload) => {
//             socket.emit('leave', payload);
//         };

//         vue.prototype.$sendMessage = (payload) => {
//             socket.emit('chat', payload);
//         };

//         vue.prototype.$socket = socket;
//     }
// };

// Vue.use(SocketPlugin);

// new Vue({
//     router,
//     store,
//     render: h => h(App)
// }).$mount('#app')
