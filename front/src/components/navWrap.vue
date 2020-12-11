<template>
    <nav class="nav-wrap">
        <ul class="menu-list">
            <li v-for="(menuItem, i) in menuItems" :key="i" class="menu-item">
                <router-link :to="menuItem.to">
                    <h2>{{menuItem.name}}</h2>
                </router-link>
            </li>
            <li v-show="$store.state.isRoom" @click="exitRoom" class="menu-item menu-back"><router-link to="/main/chat" class="back"><h2>뒤로가기</h2></router-link></li>
        </ul>
    </nav>
</template>

<script>
export default {
    name: 'navWrap',
    data() {
        return {
            menuItems: [
                {
                    name: 'home',
                    to: '/main'
                },
                {
                    name: 'board',
                    to: '/main/board'
                },
                {
                    name: 'chat',
                    to: '/main/chat'
                },
                {
                    name: 'setting',
                    to: '/main/setting'
                }
            ]
        }
    },
    methods: {
        exitRoom() {
            this.$store.state.isRoom = false;
        }
    }
}
</script>