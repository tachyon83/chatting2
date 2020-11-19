<template>
  <div id="app">
    <!-- <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div> -->
    <router-view />
  </div>
</template>
<script>
export default {
  created() {
    console.log(1);
    console.log("socket", this.$socket);
    console.log("socketId", this.$socket.id);
    console.log("sessionId", this.$socket.request.session.id);
    // this.$socket.on("room.list.response", (rooms) => {
    //   console.log("rooms data received");
    // });
    this.$socket.on("test", (_) => {
      console.log("test received");
    });
  },
};
</script>


<style>
@import "./css/main.css";
</style>