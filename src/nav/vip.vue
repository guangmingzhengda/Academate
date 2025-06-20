<template>
    <div class="modal-background" v-if="isVisible">
        <div class="modal-container">
            <div class="title">
                <div style="font-weight:bold;color:#4b4b4b;font-size:larger; margin-top: 10px">SSSR 增值服务</div>
            </div>
            <div class="content">
<!--                <div class="service">-->
<!--&lt;!&ndash;                    <el-icon size="250%"><Collection /></el-icon>&ndash;&gt;-->
<!--                    <img src="@/asset/vip/archive-research.png" style="width: 50%">-->
<!--                    <p>高级搜索</p>-->
<!--                </div>-->
<!--                <div class="service">-->
<!--&lt;!&ndash;                    <el-icon size="250%"><Download /></el-icon>&ndash;&gt;-->
<!--                    <img src="@/asset/vip/cloud-download.png" style="width: 50%">-->
<!--                    <p>成果下载</p>-->
<!--                </div>-->
                <div class="service">
<!--                    <el-icon size="250%"><Setting /></el-icon>-->
                    <img src="@/asset/vip/power-generator.png" style="width: 50%">
                    <p>AI分析</p>
                </div>

                <div style="font-size: 14px; width: 60%; text-align: left">
                    我们的增值AI服务专注于学术成果相关的智能对话。用户可以就学术话题进行深入探讨。无论是答疑解惑还是寻求学术灵感，我们的AI服务都能提供切实可行的意见。
                </div>

<!--                <div class="service">-->
<!--&lt;!&ndash;                    <el-icon size="250%"><Histogram /></el-icon>&ndash;&gt;-->
<!--                    <img src="@/asset/vip/progression.png" style="width: 50%">-->
<!--                    <p>热点统计</p>-->
<!--                </div>-->
            </div>

            <el-input v-model="code" style="width: 70%; height: 40px; margin-top: 10px;margin-bottom:15px;" placeholder="请输入认证码">
            </el-input>

            <div class="button">
                <el-button type="primary" plain round style="margin-right:5%" @click="closeModal(true)">开通服务</el-button>
                <el-button type="primary" plain round @click="closeModal(false)">关闭界面</el-button>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import router from "@/router/index.js";

import { ref, computed, onMounted, watch } from "vue";
import {callSuccess, callError, callInfo, callWarning} from "@/call";
import {useStore} from "vuex";
import {becomeVip} from "@/api/vip";
export default {
  setup() {
      const code = ref('');
      const store = useStore();
    const isVisible=ref(false);
    const openModal=()=>{
        isVisible.value=true;
        document.body.style.overflow = 'hidden';
    }
    const closeModal= async(isOpen)=>{
        isVisible.value = false;
        document.body.style.overflow = '';
        if(isOpen){
            if (code.value === '2177'){
                callSuccess('开通增值服务成功');
                // store.commit('setVipState', true);
                await becomeVip();
            }else{
                callError('验证码错误');
            }
        }
    }
    return {
        isVisible,
        openModal,
        closeModal,
        code
    };
  },
};
</script>
<style scoped>
.modal-background {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 8;
}
.modal-container {
  width: 500px;
  height: 300px;
  background-color: #ffffff;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.title{
    width:100%;
    height:20%;
    /* background-color:antiquewhite; */
    display:flex;
    align-items: center;
    justify-content: center;
}
.content{
    margin-top:4%;
    width:100%;
    height:35%;
    display:flex;
    flex-direction: row;
    justify-content: center;
    /* background-color: aqua; */
}
.button{
    width:100%;
    flex:1;
    /* background-color: aquamarine; */
    display:flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-bottom:15px;
}
.service{
    height:100%;
    width:20%;
    display:flex;
    flex-direction: column;
    align-items: center;
}
.service p{
    margin-top:20%;
}
</style>
