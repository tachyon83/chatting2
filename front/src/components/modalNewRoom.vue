<template>
    <div class="modal-basic">
            <h4 class="modal-tit">NEW ROOM</h4>
            <div class="modal-frm">
                <input 
                    type="text" 
                    placeholder="방 이름을 입력해주세요" 
                    maxlength="35"
                    v-model="roomName"
                    title="방 이름 입력" 
                    ref="roomName"
                    class="modal-room-name-input"
                    :class="nameAlert"
                >
                <div class="modal-room-member-wrap">
                    <input 
                        type="number"
                        v-model="roomUserCount"
                        @keyup="checkNum"
                        min="1"
                        max="99"
                        title="방 인원 입력" 
                        class="modal-room-user-input"
                    >
                    <div class="modal-bnt-wrap">
                        <button 
                            @click="roomUserCount--"
                            class="btn-basic btn-count"
                        >-</button>
                        <button  
                            @click="roomUserCount++"
                            class="btn-basic btn-count"
                        >+</button>
                    </div>
                </div>
                <modalBtnWrap/>
            </div>
        </div>
</template>

<script>
import modalBtnWrap from '@/components/modalBtnWrap'
export default {
    name: 'modalNewRoom',
    components: {
        modalBtnWrap
    },
    data() {
      return {
        roomName : null,
        roomUserCount: 1,
        roomItems: this.$store.state.roomDTO,
        showModal: this.$store.state.showModal,
        nameAlert: 'off'
      }
    },
    methods: {
        modalOff() {
            this.$store.state.showModal = false
        },
        nameAlertOff() {
            setTimeout(() => {
                this.nameAlert = 'off'
                this.$refs.roomName.focus()
            }, 300)
        },
        createRoom() {
            if(this.roomName === '' || this.roomName === null) {
                this.nameAlert = 'on'

                this.nameAlertOff()
                return
            }

            const newRoom = {
                num : this.roomItems.length + 1,
                tit : this.roomName,
                own : this.$store.state.userDTO.name,
                userNowNum : 0,
                userNum : this.roomUserCount
            }
            this.$store.state.roomDTO.push(newRoom)
            this.resetNewRoomModal()
        },
        resetNewRoomModal() {
            this.roomName = null
            this.roomUserCount = 1
            this.modalOff()
        }
    },
    computed: {
        checkNum() {
            let counter = this.roomUserCount
            if(counter < 1) counter = 1
            if(counter > 99) counter = 99
            this.roomUserCount = counter
            return counter
        },
    }
}
</script>

<style scoped>
    .modal-room-name-input.on {
        animation: shake .2s 3;
    }

    @keyframes shake {
        0% {transform: translateX(2px)}
        50% {transform: translateX(-2px)}
        100% {transform: translateX(0)}
    }
</style>