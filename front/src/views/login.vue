<template>
    <div class="login-wrap">
      <h1 class="h1-tit">Hello</h1>
      <div class="input-box">
        <input type="text" id="userID" class="userID" autocomplete="off" placeholder="Username">
        <label for="userID">UserID</label>
      </div>
      <div class="input-box">
        <input type="password" id="userPW" class="userPW" placeholder="Password">
        <label for="userPW">UserPW</label>
      </div>
      <div class="menu-box">
            <input type="checkbox" id="userChk" class="userChk">
            <label for="userChk">Remember Me</label>
            <a href="#" class="link-text">Forgot Password?</a>
      </div>
      <div class="btn-box">
          <a href="/main" class="btn-primary">Sign in</a>
          <a href="#" class="btn-secondary">Sign up</a>
      </div>
    </div>
</template>
 
<script>
export default {
  name: 'login',
  data() {
      return {

      }
  }
}
</script>

<style scoped>

.login-wrap {position: absolute; top: 50%; left: 50%; width: 370px; transform: translate(-50%, -50%);}
.h1-tit {margin-bottom: 60px; font-size: 88px; font-weight: 900; text-align: center; color: #fff; animation: h1Ani 3s ease infinite alternate-reverse;}

@keyframes h1Ani {
  0% {text-shadow: 0 0 0 #fff;}
  100% {text-shadow: 0 0 10px #fff;}
}

.input-box {margin-top: 20px;}
.input-box input {width: 100%; height: 55px; padding: 0 30px; background-color: #3D24AD; border: 2px solid transparent; border-radius: 50px; font-size: 24px; line-height: 55px; color: #fff; box-shadow: 0px 5px 0px #2B1A9F inset; box-sizing: border-box; transition: all .5s ease;}
.input-box input:focus {border-color: rgba(255, 255, 255, 0.3);}
.input-box label {position: absolute; clip: rect(0 0 0 0); width: 1px; height: 1px; margin: -1px; overflow: hidden;}

.menu-box {margin: 15px 0 40px; padding: 0 10px;}
.menu-box input + label, .menu-box .link-text {position: relative; padding-left: 25px; font-size: 16px; font-weight: 600; color: #B698D8; cursor: pointer;}
.menu-box input + label:after {content: ''; position: absolute; top: 0; left: 0; width: 18px; height: 18px; background-color: #B698D8; border-radius: 50%;}
.menu-box input + label:before {content: ''; position: absolute; top: 5px; left: 5px; width: 6px; height: 4px; border: none; z-index: 1; transform: rotate(-45deg);}
.menu-box input:checked + label:before {border-left: 2px solid #6D30B2; border-bottom: 2px solid #6D30B2;}
.menu-box .link-text {float: right;}

.btn-box {width: 100%;}
.btn-box a {position: relative; display: block; width: 100%; height: 55px; margin-bottom: 20px; border-radius: 50px; text-align: center; font-size: 20px; font-weight: 300; line-height: 55px; color: #fff; overflow: hidden; transition: all .5s ease;}
.btn-box a:after {content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50px; background-color: #fff; opacity: 0; transition: all .5s ease;}
.btn-box a:hover {font-weight: 600;}
.btn-box a:hover:after {width: 0%; opacity: .4;}
.btn-box .btn-secondary:hover:after {opacity: .2;}
.btn-box .btn-primary {background-color: #FF209A;}
.btn-box .btn-secondary {background-color: #221673; color: rgba(255, 255, 255, 0.5);}

</style>


