<template>
  <div class="chat">
    <chatLobby/>
  </div>
</template>

<script>
// @ is an alias to /src
import chatLobby from '@/components/chatLobby.vue'

export default {
  name: 'chat',
  components: {
    chatLobby
  }
}
</script>
