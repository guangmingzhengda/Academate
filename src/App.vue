<template>
    <div id="app">

        <!-- <test-a-i></test-a-i> -->

        <div style="width: 100%; height: 100%; position: relative">

            <div v-if="!tokenSet" style="width: 100px; height: 100px;position: fixed; bottom: 0;
             right: 0; z-index: 21; opacity: 0;" @click="tokenInfo">
            </div>

            <div v-if="padSet && !vipSet" style="width: 100px; height: 100px;position: fixed; bottom: 0;
             right: 0; z-index: 20; opacity: 0;"
            @click="countEvent">
            </div>

            <navigator :class="{'nav-open': navOpen, 'nav-close': !navOpen}"/>

            <router-view style="width: 100%; height: 100%; z-index: 0; position: absolute"/>

        </div>

        <!-- 消息侧边栏触发按钮 -->
        <div class="message-trigger-btn" @click="openMessageSidebar">
            <el-icon><ChatLineRound /></el-icon>
            <div v-if="unreadCount > 0" class="message-badge">{{ unreadCount }}</div>
        </div>

        <!-- 消息侧边栏 -->
        <message-sidebar :visible="sidebarVisible" @close="closeSidebar" />

<!--        <router-view/>-->

    </div>
</template>

<script>

import navigator from "@/nav/index.vue";
import {computed, ref} from "vue";
import store from "@/store";
import {callError, callInfo} from "@/call";
import {canUseAI} from "@/api/ai";
import TestAI from "@/page/achievement-detail/testAI/index.vue";
import MessageSidebar from "@/components/MessageSidebar.vue";
import { ChatLineRound } from '@element-plus/icons-vue';

export default {
    name: 'App',
    components: {TestAI, navigator, MessageSidebar},
    setup() {
        const navOpen = computed(() => store.state.navOpen);
        const tokenSet = computed(() => store.state.token);
        const vipSet = computed(() => store.state.vipSet);
        const padSet = ref(true);
        const sidebarVisible = ref(false);
        const unreadCount = ref(2); // 模拟未读消息数量

        const tokenInfo = () => {
            callInfo('使用人工智能前请先登录');
        }

        const countEvent = async () => {

            padSet.value = false;
            setTimeout(() => {
                padSet.value = true;
            }, 500);

            // 计数事件
            const ok = await canUseAI();
            if (!ok) {
                padSet.value = true;
                if (!store.getters.getVipState)
                    callInfo("非vip每24h至多使用10次");
                else
                    callInfo("vip每24h至多使用50次");
                // setTimeout(() => {
                //     location.reload();
                // }, 3000)
            }

        }

        const openMessageSidebar = () => {
            sidebarVisible.value = true;
        }

        const closeSidebar = () => {
            sidebarVisible.value = false;
        }

        return {
            navOpen,
            tokenSet,
            vipSet,
            padSet,
            sidebarVisible,
            unreadCount,
            tokenInfo,
            countEvent,
            openMessageSidebar,
            closeSidebar
        }
    }
}

</script>

<style>
/*@import "asset/fonts/index.css";*/
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
::-webkit-scrollbar-thumb {
    background-color: #0fb2ff;
    opacity: 0.7;
    border-radius: 5px;
}

.nav-open{
    z-index: 10;
    position: fixed;
    top: 0;
    transition: top 0.5s;
}

.nav-close{
    z-index: 10;
    position: fixed;
    top: -80px;
    transition: top 0.5s;
}

/* 消息侧边栏触发按钮样式 */
.message-trigger-btn {
    position: fixed;
    right: 30px;
    bottom: 30px;
    width: 56px;
    height: 56px;
    background-color: #409eff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    transition: all 0.3s ease;
    z-index: 999;
}

.message-trigger-btn:hover {
    background-color: #337ecc;
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.6);
}

.message-trigger-btn .el-icon {
    font-size: 24px;
    color: white;
}

.message-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #f56c6c;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    border: 2px solid white;
}

</style>
