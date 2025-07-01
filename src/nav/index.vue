<template>
    <div style="width: 100%">
    <div class="top-bar" :class="{ 'top-bar-compact': isCompactMode }" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">

        <div style="height: 100%; display: flex; flex-direction: row;
         align-items: center; justify-content: left; margin-left: 20px">
            <div class="left-topbar">
                <img src="@/asset/home/logo-black.png" alt="Logo" class="logo" />

                <div class="nav-title" @click="navPage('/home')" :class="{ 'title-compact': isCompactMode }">
                    Academate Platform 2025
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

            <nav-button v-if="1" buttonName="首页" dest="/home" iconName="House" :isCompact="isCompactMode"/>
            <nav-button v-if="1" buttonName="人员检索" dest="/researcher-search" iconName="Search" :isCompact="isCompactMode"/>
            <nav-button v-if="1" buttonName="提问大厅" dest="/question-hall" iconName="ChatDotRound" :isCompact="isCompactMode"/>
            <!-- <nav-button v-if="1" buttonName="PDF阅读器" dest="/pdf-reader"/> -->
            <nav-button v-if="1" buttonName="知识图谱" dest="/graph" iconName="Share" :isCompact="isCompactMode"/>

<!--            <button @click="showvip" class="showButton"><p class="customFont">增值服务</p></button>-->
            <!-- <div @click="showvip">
            <nav-button  buttonName="会员服务" dest="null">
            </nav-button>
            </div>

            <nav-button buttonName="学者搜索" dest="/scholarAccess"/>
            <nav-button v-if="1" buttonName="热点分析" dest="/analyze"/>
            <nav-button v-if="store.getters.getIsAdmin" buttonName="管理界面" dest="/administrator"/> -->
            <nav-button v-if="!store.getters.getToken" buttonName="登录" dest="/login" iconName="User" :isCompact="isCompactMode"/>
            <!-- <nav-button v-if="store.getters.getToken" buttonName="学者认证" dest="/auth" /> -->
            <nav-button v-if="store.getters.getToken" buttonName="个人资料" :dest="`/profile/${store.getters.getId}`" iconName="UserFilled" :isCompact="isCompactMode"/>
            <nav-button v-if="store.getters.getToken" buttonName="登出" dest="/logout" iconName="SwitchButton" :isCompact="isCompactMode"/>

            <div class="avatar-container" :class="{ 'avatar-compact': isCompactMode }" @click="callPersonal">
                <img
                    :src="avatarUrl"
                    @error="altImg"
                    class="button-image"
                />
                <div class="avatar-ring"></div>
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

// 导航条状态控制
const isCompactMode = ref(false);
const isMouseOverNav = ref(false);
const lastScrollY = ref(0);
const scrollDirection = ref('up');

const altImg = () => {
    avatarUrl.value = require("@/asset/home/user.png");
}

// 滚动监听
const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY.value && currentScrollY > 100) {
        // 向下滚动且滚动距离超过100px
        scrollDirection.value = 'down';
    } else {
        // 向上滚动或滚动距离小于100px
        scrollDirection.value = 'up';
    }
    
    lastScrollY.value = currentScrollY;
    updateCompactMode();
};

// 更新紧凑模式状态
const updateCompactMode = () => {
    // 向下滚动且鼠标不在导航条上时显示紧凑模式
    isCompactMode.value = scrollDirection.value === 'down' && !isMouseOverNav.value;
};

// 鼠标进入导航条
const handleMouseEnter = () => {
    isMouseOverNav.value = true;
    updateCompactMode();
};

// 鼠标离开导航条
const handleMouseLeave = () => {
    isMouseOverNav.value = false;
    updateCompactMode();
};

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
    window.addEventListener('scroll', handleScroll);
    lastScrollY.value = window.scrollY;
    
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
    window.removeEventListener('scroll', handleScroll);
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
</script>

<style scoped>
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

.avatar-container {
    position: relative;
    margin-left: 15px;
    border-radius: 50%;
    width: 42px;
    height: 42px;
    background-color: rgba(142,142,142,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
}

.avatar-container:hover {
    transform: scale(1.15);
    background-color: rgba(64, 158, 255, 0.1);
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.avatar-container:hover .avatar-ring {
    opacity: 1;
    transform: scale(1);
}

.avatar-ring {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid #409eff;
    border-radius: 50%;
    opacity: 0;
    transform: scale(1.2);
    transition: all 0.3s ease;
}

.button-image {
    width: 36px;
    height: 36px;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.3s ease;
    object-fit: cover;
}

.avatar-container:hover .button-image {
    transform: scale(1.05);
}

.avatar-container.avatar-compact {
    width: 36px;
    height: 36px;
    margin-left: 10px;
}

.avatar-container.avatar-compact .button-image {
    width: 30px;
    height: 30px;
}

.avatar-container.avatar-compact .avatar-ring {
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-width: 1px;
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
    background-color: rgba(255, 255, 255, 0.92);
    height: 70px;
    width: 100%;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.top-bar.top-bar-compact {
    height: 60px;
    background-color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

.nav-title{
    font-family: 'Brush Script MT', cursive;
    font-size: 25px;
    margin-left: 5px;
    /* font-weight: bold; */
    cursor: pointer;
    transition: all 0.3s ease;
}

.nav-title:hover {
    color: #409eff;
}

.nav-title.title-compact {
    font-size: 20px;
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
