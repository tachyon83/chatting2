<template>
  <div id="app">
    <button
      @click="testFromClient"
      style="width: 100%; height: 100%; position: relative; z-index: 999"
    >
      test
    </button>
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
    // console.log(1);
    // console.log("socket", this.$socket);
    console.log("socketId", this.$socket);
    this.$socket.emit("from.client", 123);
    // console.log("sessionId", this.$socket.request.session.id);
    // this.$socket.on("room.list.response", (rooms) => {
    //   console.log("rooms data received");
    // });
    // this.$socket.on("test", (data, fn) => {
    //   console.log("test received");
    //   fn("well received");
    // });
    // console.log("why not receiving!");
  },
  methods: {
    testFromClient() {
      this.$socket.emit("from.client2", "ping!");
    },
  },
};
</script>


<style>
@import "./css/main.css";
</style>