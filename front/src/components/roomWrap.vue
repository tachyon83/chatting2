<template>
    <div class="room-wrap">
        <h3>LIVE CHAT</h3>
        <button 
            @click="modalOn"
            class="btn-basic"
        >NEW ROOM</button>
        <roomList/>
    </div>
</template>

<script>
import roomList from '@/components/roomList.vue'

export default {
    name: 'roomWrap',
    components: {
        roomList
    },
    data() {
        return {
            showModal: this.$store.state.showModal
        }
    },
    methods: {
        modalOn() {
            this.$store.state.showModal = true
        }
    }
}
</script>