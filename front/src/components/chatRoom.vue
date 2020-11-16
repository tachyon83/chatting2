<template>
    <div class="wrapper">
        <h1 class="skip">Chat Lobby</h1>
        <div class="app-wrap">
            <navWrap/>
            <infoWrap/>
            <section class="content-wrap">
                <h3 class="skip">채팅</h3>
                <div class="chat-wrap" ref="chatWrap">
                    <div v-for="(msgItem, i) in msgList" class="chat-box" :key="i">
                        <span class="user-profile"></span>
                        <span class="user-name">{{msgItem.user}}</span>
                        <div class="chat-list">
                            <p class="chat-item" :class="msgItem.type">{{msgItem.text}}</p>
                        </div>
                    </div>
                    <!-- <p class="chat-system-msg">Bee님이 방에 접속하셨습니다</p> -->
                    <!-- <div class="chat-box">
                        <span class="user-profile"></span>
                        <span class="user-name">닉네임</span>
                        <div class="chat-list">
                            <p class="chat-item">Hi!</p>
                            <p class="chat-item">am I flying?</p>
                        </div>
                    </div>
                      
                    <div class="chat-box me">
                        <div class="chat-list">
                            <p class="chat-item">Yes. Don't be afraid.</p>
                        </div>
                    </div>

                    <div class="chat-box">
                        <span class="user-profile"></span>
                        <span class="user-name">닉네임</span>
                        <div class="chat-list">
                            <p class="chat-item group">Thanks!</p>
                        </div>
                    </div>
                  
                    <div class="chat-box me">
                        <div class="chat-list">
                            <p class="chat-item chat-img group">
                                <img src="src/img/chat-img-sample.png" alt="test">
                            </p>
                        </div>
                    </div>

                    <div class="chat-box">
                        <span class="user-profile"></span>
                        <span class="user-name">닉네임</span>
                        <div class="chat-list">
                            <p class="chat-item private">가나다라마바사가나다라가나다라마바사
                                가나다라가나다라마바사가나다라</p>
                        </div>
                    </div>

                    <div class="chat-box">
                        <span class="user-profile"></span>
                        <span class="user-name">닉네임</span>
                        <div class="chat-list">
                            <p class="chat-item private">가나다라마바사가나다라가나다라마바사
                                가나다라가나다라마바사가나다라</p>
                        </div>
                    </div> -->

                    <!-- <p class="chat-system-msg new">New Message</p> -->
                </div>
                <div class="chat-input-wrap">
                    <form method="POST" action="" name="chat-frm" class="chat-frm">
                        <span @click="changeType" class="chat-type" :class="chatType">{{chatType}}</span>
                        <textarea 
                            v-model="msg"
                            @keyup.13="submitMsg"
                            @keyup.9.prevent="changeType"
                            placeholder="Type your message..." 
                            title="메시지입력" 
                            class="chat-input">
                        </textarea>
                        <button
                            @click.prevent="submitMsg"
                            class="chat-send"
                            >send
                        </button>
                    </form>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import navWrap from '@/components/navWrap.vue'
import infoWrap from '@/components/infoWrap.vue'
import contentWrap from '@/components/contentWrap.vue'
import modalWrap from '@/components/modalWrap.vue'

export default {
    name: 'chatRoom',    
    components: {
        navWrap,
        infoWrap,
        contentWrap,
        modalWrap
    },
    data() {
        return {
            chatType: 'All',
            msgList: [],
            msg: null,
            sidForScroll: null
        }
    },
    methods: {
        chatWrapScroll() {
            if(this.$refs.chatWrap.scrollTop <= this.$refs.chatWrap.scrollHeight - 630) {
                this.$refs.chatWrap.scrollTop += 10
            }else {
                clearInterval(this.sidForScroll)
            }
        },
        submitMsg: function() {
            const newMsg = {
                user: this.$store.state.userDTO.name,
                text: this.msg,
                type: this.chatType,
            }
            this.msgList.push(newMsg)
            this.msg = null
        },
        changeType: function() {
            let chatType = this.chatType
            if( this.chatType == 'All') {
                this.chatType = 'Group'
            } else if( this.chatType == 'Group') {
                this.chatType = 'Whisper'
            } else {
                this.chatType = 'All'
            }
        }
    },
    watch: {
        msgList: function() {
            this.$refs.chatWrap.scrollTop = this.$refs.chatWrap.scrollHeight
            this.sidForScroll = setInterval(this.chatWrapScroll, 50)
        }
    }
}
</script>