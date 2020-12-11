<template>
  <div id="app">
    <div class="wrapper">
      <router-view />
    </div>
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