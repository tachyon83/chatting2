<template>
  <div class="wrapper">
    <h1 class="skip">Chat Lobby</h1>
    <div class="app-wrap">
      <modalWrap />
      <navWrap />
      <infoWrap />
      <content-wrap />
    </div>
  </div>
</template>

<script>
import navWrap from "@/components/navWrap.vue";
import infoWrap from "@/components/infoWrap.vue";
import contentWrap from "@/components/contentWrap.vue";
import modalWrap from "@/components/modalWrap.vue";

export default {
  name: "chatLobby",
  components: {
    navWrap,
    infoWrap,
    contentWrap,
    modalWrap,
  },
};
</script>
