<template>
  <div class="login-wrap">
    <h1 class="h1-tit">Hello</h1>
    <div class="input-box">
      <input
        type="text"
        id="userID"
        class="userID"
        autocomplete="off"
        placeholder="Username"
        v-model="userID"
      />
      <label for="userID">UserID</label>
    </div>
    <div class="input-box">
      <input
        type="password"
        id="userPW"
        class="userPW"
        placeholder="Password"
        v-model="userPW"
      />
      <label for="userPW">UserPW</label>
    </div>
    <div class="menu-box">
      <input type="checkbox" id="userChk" class="userChk" />
      <label for="userChk">Remember Me</label>
      <a href="#" class="link-text">Forgot Password?</a>
    </div>
    <div class="btn-box">
      <a @click.prevent="logIn" href="/main" class="btn-primary">Sign in</a>
      <a href="#" class="btn-secondary">Sign up</a>
    </div>
  </div>
</template>
 
<script>
export default {
  name: "login",
  methods: {
    toMain() {
      this.$router.push({
        name: "main",
      });
    },
    logIn(e) {
      this.$http
        .post(
          `${this.$envSettings.back}user/signin`,
          {
            username: this.userID,
            password: this.userPW,
          },
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          console.log(res);
          if (res.data.response) this.toMain();
          else console.log("failed");
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
  data() {
    return {
      userID: null,
      userPW: null,
    };
  },
};
</script>

<style scoped>
.login-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 370px;
  transform: translate(-50%, -50%);
}
.h1-tit {
  margin-bottom: 60px;
  font-size: 88px;
  font-weight: 900;
  text-align: center;
  color: #fff;
}

.input-box {
  margin-top: 20px;
}
.input-box input {
  width: 100%;
  height: 55px;
  padding: 0 40px;
  background-color: #3d24ad;
  border-radius: 50px;
  font-size: 24px;
  line-height: 55px;
  color: #fff;
  box-shadow: 0px 5px 0px #2b1a9f inset;
  box-sizing: border-box;
}
.input-box label {
  position: absolute;
  clip: rect(0 0 0 0);
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
}

.menu-box {
  margin: 15px 0 40px;
  padding: 0 10px;
}
.menu-box input + label,
.menu-box .link-text {
  position: relative;
  padding-left: 25px;
  font-size: 16px;
  font-weight: 600;
  color: #b698d8;
  cursor: pointer;
}
.menu-box input + label:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 18px;
  height: 18px;
  background-color: #b698d8;
  border-radius: 50%;
}
.menu-box input + label:before {
  content: "";
  position: absolute;
  top: 5px;
  left: 5px;
  width: 6px;
  height: 4px;
  border: none;
  z-index: 1;
  transform: rotate(-45deg);
}
.menu-box input:checked + label:before {
  border-left: 2px solid #6d30b2;
  border-bottom: 2px solid #6d30b2;
}
.menu-box .link-text {
  float: right;
}

.btn-box {
  width: 100%;
}
.btn-box a {
  position: relative;
  display: block;
  width: 100%;
  height: 55px;
  margin-bottom: 20px;
  border-radius: 50px;
  text-align: center;
  font-size: 20px;
  line-height: 55px;
  color: #fff;
  overflow: hidden;
}
.btn-box a:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50px;
  background-color: #fff;
  opacity: 0;
}
.btn-box .btn-primary:hover:after {
  width: 0%;
  opacity: 0.5;
  transition: all 0.5s ease;
}
.btn-box .btn-primary {
  background-color: #ff209a;
}
.btn-box .btn-secondary {
  background-color: #221673;
  color: rgba(255, 255, 255, 0.5);
}
</style>


