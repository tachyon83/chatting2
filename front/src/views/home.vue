<template>
  <div class="home-wrap">
    <p class="home-msg">
      <strong class="user-name">깨알같은포인트</strong>님<br>
      기다리고 있었어요!
    </p>
  </div>
</template>

<script>

export default {
  name: "home",
  components: {
  },
};
</script>

<style scoped>
  .home-wrap {width: 100%; height: 100%; padding: 480px 0 0 400px; background-color: #fff;}
  .home-msg {font-size: 46px; font-weight: 600;}
  .home-msg .user-name {display: inline-block; margin-right: 10px; padding: 10px 15px; background-color: #A42FD6; color: #fff;}
</style>
