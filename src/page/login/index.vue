<template>
  <div class="bg-container" ></div>
<!--  <div class="bg-container-2"></div>-->
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw;">
  <div class="login-area">
      <fade-box>
    <div class="login-content">

      <div class="select-area">

        <img src="@/asset/login-enhance/logo-blue.png" style="width: 100%">
        <div class="select-set">
          <div :class="{notSelectedButton: situation!==1, selectedButton: situation === 1}"
               @click="setSituation(1)">
            帐号登录
          </div>
          <div :class="{notSelectedButton: situation!==2, selectedButton: situation === 2}"
               @click="setSituation(2)">
            邮箱登录
          </div>
          <div :class="{notSelectedButton: situation!==3, selectedButton: situation === 3}"
               @click="setSituation(3)">
            注册
          </div>
          <div :class="{notSelectedButton: situation!==4, selectedButton: situation === 4}"
               @click="setSituation(4)">
            修改密码
          </div>
        </div>

        <div class="input-frame" v-if="situation===1||situation===3">
          <el-input v-model="account" style="width: 100%; height: 40px" placeholder="请输入帐号">
            <template #prepend>帐&nbsp;&nbsp;&nbsp;&nbsp;号</template>
          </el-input>
        </div>

        <div class="input-frame" v-if="situation!=1">
          <el-input v-model="email" style="width: 100%; height: 40px" placeholder="请输入邮箱">
            <template #prepend>邮&nbsp;&nbsp;&nbsp;&nbsp;箱</template>
          </el-input>
        </div>
        <div class="input-frame" v-if="situation!=4">
          <el-input v-model="password" style="width: 100%; height: 40px" type="password" placeholder="请输入密码" show-password>
            <template #prepend>密&nbsp;&nbsp;&nbsp;&nbsp;码</template>
          </el-input>
        </div>

        <div class="input-frame" v-if="situation===4">
          <el-input v-model="newPassword" style="width: 100%; height: 40px" type="password" placeholder="请输入新密码" show-password>
            <template #prepend>新密码</template>
          </el-input>
        </div>

        <div class="input-frame">
          <el-input  v-if="situation!=1&&situation!=2"  v-model="validationCode" style="width: 100%; height: 40px" type="password" placeholder="验证码" show-password>
            <template #prepend >验证码</template>
          </el-input>
        </div>

         <div/>
        <div/>
        <el-button v-if="situation!=2&&situation!=1&&!isCool" class="button-set" type="primary" plain @click="sendEmailFunc(this.email)">{{"发送验证"}}</el-button>
        <el-button v-if="situation!=2&&situation!=1&&isCool" class="button-set" type="primary" plain disabled>{{coolCount}}秒后可重发</el-button>
        <el-button class="button-set" type="primary" plain @click="transit()">{{buttonName}}</el-button>
          <div style="font-size: 15px; font-family: 'meriyo', 'sans-serif'; font-weight: bold;
          margin-top: 20px; color: #8e8e8e">
              Academate 2025
          </div>

          <div style="font-size: 15px; font-family: 'meriyo', 'sans-serif'; font-weight: bold;
           color: #8e8e8e">
               School of Software, BUAA
          </div>

      </div>
    </div>
    </fade-box>
  </div>
  </div>

</template>

<script>
import {register, resetPassword, sendEmail} from "@/api/login";
import store from "@/store";
import fadeBox from "@/page/home/component/fadeBox/index.vue";
import {callInfo} from "@/call";
export default {
  name: "login",
    components:{fadeBox},
  data()
  {
    return{
      email:"",
      isCool:false,
      buttonName:"登录",
      userName:"",
      account:"",
      password:"",
      newPassword:"",
      validationCode:"",
      situation: 1, // 默认情况
      coolCount:0,
    };
  },

  methods: {

    // 普通登录
    async login()
    {

        if (this.account.length === 0){
            callInfo('账号不可为空');
            return;
        }

        if (this.password.length === 0){
            callInfo('密码不可为空');
            return;
        }

      const credential={"userAccount": this.account,"userPassword":this.password};
      await store.dispatch('login',credential);

    },

    // 邮箱登录
    async elogin()
    {

        if (this.email.length === 0){
            callInfo('邮箱不可为空');
            return;
        }

        if (!this.email.includes('@')){
            callInfo('邮箱格式错误');
            return;
        }

        if (this.password.length === 0){
            callInfo('密码不可为空');
            return;
        }

      const credential={"userEmail":this.email,"userPassword":this.password};
      await store.dispatch('eLogin',credential);
    },

    // 不同情况设置
    setSituation(newSituation)
    {
      this.situation = newSituation;

      if (newSituation == 4)
      {
        this.buttonName = '设置新密码';
      }
      else if(newSituation==3)
      {
        this.buttonName = '注册';
      }
      else
      {
        this.buttonName='登录';
      }
    },

    // 发送邮箱验证码
    sendEmailFunc(email)
    {

        if (email.length === 0){
            callInfo('邮箱不可为空');
            return;
        }

        if (!email.includes('@')){
            callInfo('邮箱格式错误');
            return;
        }

      sendEmail(email);
      this.handleCool();
    },

    handleCool()
    {
      if(this.isCool==false) {
        this.isCool = true;
        this.coolCount = 30;
        const interval = setInterval(() => {
          if (this.coolCount > 0) {
            this.coolCount -= 1;
          } else {
            clearInterval(interval);
            this.isCool = false;
          }
        }, 1000); // 每1000毫秒（1秒）执行一次
      }
    },

    async transit() {
      if (this.situation == 1) {
        this.login()
        // console.log("log in successfully")
      } else if (this.situation == 2) {
        this.elogin()
        // console.log("eLogin successfully");
      } else if (this.situation == 3) {

          // 注册

          if (this.account.length === 0){
              callInfo('账号不可为空');
              return;
          }

          if (this.password.length === 0){
              callInfo('密码不可为空');
              return;
          }

          if (this.validationCode.length === 0){
              callInfo('验证码不可为空');
              return;
          }

          if (this.email.length === 0){
              callInfo('邮箱不可为空');
              return;
          }


        const credient = {
          userAccount: this.account,

          userPassword: this.password,
          checkPassword: this.password,
          code: this.validationCode,
          emailAddress: this.email,
        }

        const outcome = await register(credient)

        if (outcome == true) {
          this.setSituation(1);
          this.password="";
        }

      } else {

          if (this.email.length === 0){
              callInfo('邮箱不可为空');
              return;
          }

          if (this.validationCode.length === 0){
              callInfo('验证码不可为空');
              return;
          }

          if (this.newPassword.length === 0){
              callInfo('新密码不可为空');
              return;
          }

        const credient = {
          email: this.email,
          verificationCode: this.validationCode,
          password: this.newPassword,
        }
        const outcome = await resetPassword(credient);
        if (outcome == true) {
          this.setSituation(1);
          this.password="";
        }
      }
    }
  },
};
</script>

<style scoped>

.bg-container {
  background: url('@/asset/login-enhance/new_bg.png');
  background-size: cover;
  position: fixed;
  height: 100vh;
  width: 100vw;
  z-index: -2;
  top: 0;
  left: 0;
}

.login-area
{
  width: 400px;
  height: 100%;
    display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* margin-left: auto; 让元素靠右 */
    /* margin-right: 200px; */
}

.login-content
{
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 10px;
  width: 100%;
  /*这个带文字的登录部分之后得手动调一下的*/
  height: 600px;
  /*margin-top: 40%;*/
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.sosSet
{
  width: 100px;
  height: 100px;
  display: flex;
}

.select-set
{
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 5%;
}
.select-area {
  width: 80%;
    display: flex;
  flex-direction: column;
    transition: height, 1s;
}

.notSelectedButton
{
  width: 33.3%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  cursor: pointer;
  border-bottom: 1px solid #d2d2d2;
}
.selectedButton
{
  width: 33.3%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2px solid #00bbff;
  font-weight: bold;
  font-size: 15px;
  background-color: rgba(22, 22, 22, 0.05);
  cursor: pointer;
  transition: border-bottom 0.2s, background-color 0.2s;
}
.color-block
{
  width: 100%;
  height: 25%;
  background-color: #3271ae;
  border: 1px solid #3271ae;
  border-radius: 4px;
}

.login-frame{
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  border-left: 1px solid rgba(22, 22, 22, 0.2);
}
.spaceBlock
{
  height:20%;
}

.button-set{
  width: 100%;
  height: 40px;
  margin-top: 10px;
  margin-left: auto;
}

</style>
