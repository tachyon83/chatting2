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
  .home-wrap {position: relative; width: 100%; height: 100%; padding: 480px 0 0 400px; background-color: #E9ECEE;}
  .home-wrap:after {content: ''; position: absolute; top: 5%; right: -10%; width: 900px; height: 900px; background-color: #fff; border-radius: 50%; transform: scale(0); opacity: 0; animation: homeAni 1s ease forwards;}

  @keyframes homeAni {
    0% {transform: scale(0); opacity: 0;}
    100% {transform: scale(1); opacity: 1;}
  }

  .home-msg {font-size: 46px; font-weight: 600; z-index: 5; position: relative;}
  .home-msg .user-name {display: inline-block; margin-right: 10px; padding: 10px 15px; background-color: #A42FD6; color: #fff;}
</style>
