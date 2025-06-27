<template>
    <div style="width: 100%">
    <vip ref="vipContent" :class="{'vip0': !vipOp, 'vip1': vipOp}"> </vip>
    <div class="top-bar">

        <div style="height: 100%; display: flex; flex-direction: row;
         align-items: center; justify-content: left; margin-left: 20px">
            <div class="left-topbar">
                <img src="@/asset/home/logo-black.png" alt="Logo" class="logo" />

                <div class="nav-title" @click="navPage('/home')">
                    ACADEMATE PLATFORM 2025
                </div>

            </div>

            <!-- <div class="search-container">

                <el-input v-model="searchInput" style="width: 350px"
                          :suffix-icon="Search" placeholder="Search by Academate!"
                          @keydown.enter="callSearchPage">
                    <template #prepend>
                        <el-select v-model="select" placeholder="Select" style="width: 100px;">
                            <el-option label="学术论文" value="0" />
                            <el-option label="专利" value="1" />
                            <el-option label="科研项目" value="2" />
                            <el-option label="奖项" value="3" />
                        </el-select>
                    </template>
                </el-input>

            </div> -->

        </div>

        <div style="height: 100%; display: flex; flex-direction: row;
         align-items: center; justify-content:right; margin-right: 20px">

            <nav-button v-if="1" buttonName="首页" dest="/home"/>
            <nav-button v-if="1" buttonName="人员检索" dest="/researcher-search"/>
            <nav-button v-if="1" buttonName="提问大厅" dest="/question-hall"/>
            <nav-button v-if="1" buttonName="PDF阅读器" dest="/pdf-reader"/>

<!--            <button @click="showvip" class="showButton"><p class="customFont">增值服务</p></button>-->
            <!-- <div @click="showvip">
            <nav-button  buttonName="会员服务" dest="null">
            </nav-button>
            </div>

            <nav-button buttonName="学者搜索" dest="/scholarAccess"/>
            <nav-button v-if="1" buttonName="热点分析" dest="/analyze"/>
            <nav-button v-if="store.getters.getIsAdmin" buttonName="管理界面" dest="/administrator"/> -->
            <nav-button v-if="!store.getters.getToken" buttonName="登录" dest="/login" />
            <!-- <nav-button v-if="store.getters.getToken" buttonName="学者认证" dest="/auth" /> -->
            <nav-button v-if="store.getters.getToken" buttonName="个人资料" :dest="`/profile/${store.getters.getId}`" />
            <nav-button v-if="store.getters.getToken" buttonName="登出" dest="/logout" />

            <div style="margin-left: 10px; border-radius: 270px;
            width: 37px;
            height: 37px;
            background-color: rgba(142,142,142,0.15)" @click="callPersonal">
                <img
                    :src="avatarUrl"
                    @error="altImg"
                    class="button-image"
                />
            </div>

        </div>

    </div>
    </div>
</template>

<script setup>
import { useStore } from "vuex";
import { register, resetPassword, sendEmail } from "@/api/example";
import {computed, onMounted, provide, ref, watch, onUnmounted} from "vue";
import { callSuccess, callError, callInfo, callWarning } from "@/call";
import { Search } from '@element-plus/icons-vue'
import store from "@/store";
import router from "@/router"
import NavButton from "@/nav/navButton/index.vue";
import { get_user_detail } from "@/api/profile";

const searchInput = ref('');
const select = ref('0')
const avatarUrl = ref('');
const avatarCnt = ref(0);

const altImg = () => {
    avatarUrl.value = require("@/asset/home/user.png");
}

// 监听头像更新事件
const handleAvatarUpdate = (event) => {
    const { avatarUrl: newAvatarUrl } = event.detail;
    if (newAvatarUrl) {
        avatarUrl.value = newAvatarUrl + '?t=' + new Date().getTime();
    }
};

// 在组件挂载时添加事件监听器
onMounted(() => {
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    // 初始化时立即从store中获取头像
    if (store.getters.getToken) {
        const storeData = store.getters.getData;
        if (storeData && storeData.avatar) {
            avatarUrl.value = storeData.avatar;
        } else {
            avatarUrl.value = require("@/asset/home/user.png");
        }
    } else {
        avatarUrl.value = require("@/asset/home/user.png");
    }
});

// 在组件卸载时移除事件监听器
onUnmounted(() => {
    window.removeEventListener('avatarUpdated', handleAvatarUpdate);
});

setInterval(async() =>{
    // 尝试显示头像
    avatarCnt.value += 1;
    // console.log('token: '+store.getters.getToken)
    if (store.getters.getToken) {
        // 优先使用store中的头像信息
        const storeData = store.getters.getData;
        if (storeData && storeData.avatar) {
            avatarUrl.value = storeData.avatar;
        } else {
            // 如果store中没有，则尝试从API获取
            const res = await get_user_detail({ userId: store.getters.getId });
            if (res && res.avatar) {
                avatarUrl.value = res.avatar;
                
                // 将获取到的头像URL保存到store中
                const currentData = store.getters.getData;
                store.commit('setData', {
                    ...currentData,
                    avatar: res.avatar
                });
                
                if (avatarCnt.value % 6 === 0) {
                    avatarUrl.value += '?t=' + new Date().getTime();
                }
            } else {
                avatarUrl.value = require("@/asset/home/user.png");
            }
        }
    }else{
        avatarUrl.value = require("@/asset/home/user.png");
    }
    // console.log('头像：'+avatarUrl.value);
}, 1000);

const callPersonal = () => {
    router.push(`/profile/${store.getters.getId}`);
}

const callSearchPage = () => {
    if (searchInput.value.length > 100){
        callInfo('搜索内容过长');
        return;
    }
    if (searchInput.value.length === 0){
        callInfo('搜索内容不得为空');
        return;
    }
    // router.push(`/search/${searchInput.value}`);
    router.push(`/blank/`);
    setTimeout(()=>{
        router.push(`/search/${searchInput.value}/${select.value}/null`);
    }, 100);
}

const navPage = (dest) => {
    router.push(dest)
}
const vipContent=ref(null);
const isVip=ref(false);
const vipOp = ref(false);
const showvip = () =>{

    if (store.getters.getToken){
        if (store.getters.getVipState){
            callInfo('您已开通增值服务');
        }else {
            vipOp.value = false;
            vipContent.value.openModal();
            vipOp.value = true;
        }
    }else {
        callInfo('开通增值服务前请先登录');
    }
}
// handleDataUpdate=(data)=> {
//     isVip.value = data;
// }
</script>

<style scoped>

.vip0{
    opacity: 0;
    transition: opacity 0.6s;
}

.vip1{
    opacity: 1;
    transition: opacity 0.6s;
}

.left-topbar {
    display: flex;
    align-items: center;
    flex-direction: row;
}

.logo {
    height: 30px;
}

.search-container {
    display: flex;
    align-items: center;
    margin-left: 15px;
}

.button-image {
    width: 36px; /* Adjust the size as needed */
    height: 36px;
    cursor: pointer;
    border-radius: 100px;
}

.title b,
.authors b,
.submitted b {
    font-weight: bold;
}

.submitted b{
    font-weight: bold;
    text-align: left;
}

.open .abstract-content {
    text-overflow: initial;
    white-space: normal;
    overflow: visible;
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /*padding: 1% 2% 1% 2%;*/
    background-color: rgba(255, 255, 255, 0.96);
    height: 70px;
    width: 100%;
}

.nav-title{
    font-family: 'Meiryo', sans-serif;
    font-size: 18px;
    margin-left: 5px;
    font-weight: bold;
    cursor: pointer;
}
.showButton {
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    outline: none;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
}
.customFont {
    font-family: '微软雅黑', 'Microsoft YaHei', sans-serif;
    font-size: 16px;
    color: #353535;
}
.item {
  margin-top: 10px;
  margin-right: 30px;
}
</style>
