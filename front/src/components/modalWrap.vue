<template>
    <div 
        v-if="$store.state.showModal"
        @click.self="modalOff()"
        class="modal-wrap"
    >   
        <!-- <modalAlert v-show="nameNull"/> -->
        <modalNewRoom/>
    </div>
</template>

<script>
import modalNewRoom from '@/components/modalNewRoom.vue'
// import modalAlert from '@/components/modalAlert.vue'

export default {
    name: 'modalWrap',
    components: {
        modalNewRoom,
        // modalAlert
    },
    data() {
        return {
            showModal: this.$store.state.showModal,
            nameNull: false
        }
    },
    methods: {
        modalOff() {
            this.$store.state.showModal = false
        }
    }
}
</script>