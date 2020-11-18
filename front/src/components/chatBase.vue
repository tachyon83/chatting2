<template>
  <div class="wrapper">
        <h1 class="skip">Chat Lobby</h1>
        <div class="app-wrap">
            <div 
                v-if="showModal"
                @click.self="closeModal()"
                class="modal-wrap"
            >
                <div class="modal-basic">
                    <h4 class="modal-tit">NEW ROOM</h4>
                    <form method="post" action="" name="modal-frm" class="modal-frm">
                        <input 
                            type="text" 
                            placeholder="방 이름을 입력해주세요" 
                            v-model="roomName"
                            title="방 이름 입력" 
                            class="modal-room-name-input"
                        >
                        <div class="modal-room-member-wrap">
                            <input 
                                type="number" 
                                @keyup="checkNum"
                                v-model="roomUserCount"
                                min="2" 
                                max="99" 
                                title="방 인원 입력" 
                                class="modal-room-user-input"
                            >
                            <div class="modal-bnt-wrap">
                                <button 
                                    @click.stop.prevent="roomUserCount--"
                                    class="btn-basic btn-count"
                                >-</button>
                                <button  
                                    @click.stop.prevent="roomUserCount++"
                                    class="btn-basic btn-count"
                                >+</button>
                            </div>
                        </div>
                        <div class="modal-bnt-wrap">
                            <button 
                                @click.stop.prevent="createRoom"
                                class="btn-basic bg-purple"
                            >CREATE</button>
                            <button 
                                @click.stop.prevent="resetNewRoomModal"
                                class="btn-basic bg-grey"
                            >CANCEL</button>
                        </div>
                    </form>
                </div>
            </div>

            <nav class="nav-wrap">
                <ul class="menu-list">
                    <li class="menu-item"><a href="#" class="home"><h2>홈</h2></a></li>
                    <li class="menu-item"><a href="#" class="board"><h2>게시판</h2></a></li>
                    <li class="menu-item"><a href="#" class="chat on"><h2>채팅</h2></a></li>
                    <li class="menu-item"><a href="#" class="set"><h2>설정</h2></a></li>
                </ul>
            </nav>
            <section class="info-wrap">
                <h3 class="info-tab">
                    Online
                    <span class="info-user-num">99</span>
                </h3>
                <div class="group-list">
                    <!-- <userlist v-for="n in 3"></userlist> -->
                </div>
                <div class="info-tab user-tit user-owner">
                    <span class="user-profile"></span>
                    <span class="user-name">right here</span>
                </div>
            </section>
            <section class="content-wrap">
                <div class="room-wrap">
                    <h3>LIVE CHAT</h3>
                    <button 
                        @click="openModal()"
                        class="btn-basic"
                    >NEW ROOM</button>
                    <ul class="room-list">
                        <!-- <li v-for="roomitem in roomItems" class="room-item">
                            <a href="#">
                                <span class="room-num">{{roomitem.num | formatRoomNum}}</span>
                                <span class="room-tit">{{roomitem.tit}}</span>
                                <span class="room-own">{{roomitem.own}}</span>
                                <span class="room-user">
                                    <span class="room-user-num">{{roomitem.userNowNum}}</span>/{{roomitem.userNum}}
                                </span>
                            </a>
                        </li> -->
                    </ul>
                </div>
            </section>
        </div>
    </div>
</template>

<script>

//  let menulist = {
//     data() {
//         return {

//         }
//     },
//     template:`
//     <li class="menu-item"><a href="#" class="home"><h2>홈</h2></a></li>
//     `
// }

// let roomlist = {
//     data() {
//         return  {
//             full: false,
//         }
//     },
//     template:`
//        <li></li>
//        `
// }

// let userlist = {
//     props: [
//         'title'
//     ],
//     data() {
//         return {
//             active: false
//         }
//     },
//     template: `
//     <div>
//         <h4 class="group-tit" :class="{off : !active}">
//             <a href="#" @click.prevent="active = !active">User</a>
//         </h4>
//         <ul class="user-list" v-show="active">
//             <li class="user-item user-owner">
//                 <a href="#">
//                     <span class="user-profile"></span>
//                     <span class="user-name">닉네임</span>
//                 </a>
//             </li>
//             <li class="user-item">
//                 <a href="#">
//                     <span class="user-profile"></span>
//                     <span class="user-name">닉네임</span>
//                 </a>
//             </li>
//             <li class="user-item">
//                 <a href="#">
//                     <span class="user-profile"></span>
//                     <span class="user-name">닉네임</span>
//                 </a>
//             </li>
//         </ul>
//     </div>
//     `
// }

export default {
    name: 'HelloWorld',    
    created() {
        
    },
    components: {
        // roomlist,
        // userlist,
        // menulist
    },
    data() {
      return {
        showModal: false,
        roomName : null,
        roomUserCount: 1,
        roomItems: [
            {num : 1,
                tit : '제목입니다',
                own : '방방장장',
                userNowNum : 3,
                userNum : 5},
            {num : 2,
                tit : '제목입니sasdsafasfasfsaf다',
                own : '방장',
                userNowNum : 43,
                userNum : 50},
            {num : 3,
                tit : '제입니다',
                own : '방장장',
                userNowNum : 1,
                userNum : 3}
        ]
      }
    },
    methods: {
        openModal() {
            this.showModal = true
        },
        closeModal() {
            this.showModal = false
        },
        checkNum() {
            console.log(this.userCount)
            // userCount < 2 ? userCount = 2 : userCount > 99 ? userCount = 99 : userCount 
        },
        createRoom() {
            const newRoom = {
                num : this.roomItems.length + 1,
                tit : this.roomName,
                own : 'test',
                userNowNum : 0,
                userNum : this.roomUserCount
            }
            this.roomItems.push(newRoom)
            this.resetNewRoomModal()
        },
        resetNewRoomModal() {
            this.roomName = null
            this.roomUserCount = 1

            this.closeModal()
        }
    },
    filters: {
        formatRoomNum(num) {
            return String(num).padStart(3, 0)
        }
    }
}

</script>
