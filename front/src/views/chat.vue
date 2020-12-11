<template>
  <div class="view-wrap">
    <modalWrap />
    <infoWrap />
    <router-view/>
  </div>
</template>

<script>
import infoWrap from "@/components/infoWrap.vue";
import modalWrap from "@/components/modalWrap.vue";

export default {
  name: 'chat',
  components: {
    infoWrap,
    modalWrap,
  },
  data() {
    
  }
}
</script>

<style scoped>
  .view-wrap {display: flex; width: 100%;}
</style>
