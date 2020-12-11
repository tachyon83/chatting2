<template>
  <ul class="room-list" ref="roomList">
        <li v-for="(roomitem, i) in roomItems" :key="i" class="room-item">
            <router-link @click="enterRoom" to="/main/chat/room">
                <span class="room-num">{{roomitem.num | formatRoomNum}}</span>
                <span class="room-tit">{{roomitem.tit}}</span>
                <span class="room-own">{{roomitem.own}}</span>
                <span class="room-user">
                    <span class="room-user-num">{{roomitem.userNowNum}}</span>/{{roomitem.userNum}}
                </span>
            </router-link>
        </li>
    </ul>  
</template>

<script>
export default {
    name: 'roomList',
    data() {
        return {
            roomItems: this.$store.state.roomDTO,
            sidForScroll: null
        }
    },
    methods: {
        roomListScroll() {
            if(this.$refs.roomList.scrollTop <= this.$refs.roomList.scrollHeight - 235) {
                this.$refs.roomList.scrollTop += 10
            }else {
                clearInterval(this.sidForScroll)
            }
        },
        enterRoom() {
            this.$store.state.isRoom = true;
        }
    },
    filters: {
        formatRoomNum(num) {
            return String(num).padStart(3, 0)
        }
    },
    watch: {
        roomItems: function() {
            this.$refs.roomList.scrollTop = this.$refs.roomList.scrollHeight
            this.sidForScroll = setInterval(this.roomListScroll, 50)
        }
    }
}
</script>