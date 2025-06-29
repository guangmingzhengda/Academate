<template>
    <div id="app">

        <!-- <test-a-i></test-a-i> -->

        <div style="width: 100%; height: 100%; position: relative">

            <div v-if="!tokenSet" style="width: 100px; height: 100px;position: fixed; bottom: 0;
             right: 0; z-index: 21; opacity: 0;" @click="tokenInfo">
            </div>


            <navigator :class="{'nav-open': navOpen, 'nav-close': !navOpen}"/>

            <router-view style="width: 100%; height: 100%; z-index: 0; position: absolute"/>

        </div>

        <!-- 消息侧边栏触发按钮 -->
        <div v-if="tokenSet" class="message-trigger-btn" @click="openMessageSidebar">
            <el-icon><ChatLineRound /></el-icon>
            <div v-if="unreadCount > 0" class="message-badge">{{ unreadCount }}</div>
        </div>

        <!-- 聊天功能触发按钮 -->
        <div v-if="tokenSet" class="chat-trigger-btn" @click="openChat">
            <el-icon><ChatDotRound /></el-icon>
            <div v-if="chatUnreadCount > 0" class="chat-badge">{{ chatUnreadCount }}</div>
        </div>

        <!-- 消息侧边栏 -->
        <message-sidebar :visible="sidebarVisible" @close="closeSidebar" @unread-count-update="updateUnreadCount" />

        <!-- 聊天窗口 -->
        <chat-window v-if="chatVisible" @close="closeChat" @unread-count-update="updateChatUnreadCountFromChild" />

<!--        <router-view/>-->

    </div>
</template>

<script>

import navigator from "@/nav/index.vue";
import {computed, ref, onMounted, onUnmounted, watch} from "vue";
import store from "@/store";
import {callError, callInfo} from "@/call";
import TestAI from "@/page/achievement-detail/testAI/index.vue";
import MessageSidebar from "@/components/MessageSidebar.vue";
import ChatWindow from "@/page/chat/index.vue";
import { ChatLineRound, ChatDotRound } from '@element-plus/icons-vue';
import websocketManager from '@/utils/websocketManager';
import { listConversations } from '@/api/chat';

export default {
    name: 'App',
    components: {TestAI, navigator, MessageSidebar, ChatWindow},
    setup() {
        const navOpen = computed(() => store.state.navOpen);
        const tokenSet = computed(() => store.state.token);
        const vipSet = computed(() => store.state.vipSet);
        const padSet = ref(true);
        const sidebarVisible = ref(false);
        const chatVisible = ref(false);
        const unreadCount = ref(2); // 模拟未读消息数量
        const chatUnreadCount = ref(0); // 聊天未读消息数量

        // 获取会话列表并计算聊天未读数量
        const updateChatUnreadCount = async () => {
            try {
                console.log('🔄 App.vue: 开始更新聊天未读数量...')
                const conversationList = await listConversations();
                if (conversationList && conversationList.length > 0) {
                    const unread = conversationList.reduce((total, conv) => total + (conv.unreadMessageCount || 0), 0);
                    console.log(`🔢 App.vue: 计算得到聊天未读数量: ${unread}`)
                    console.log('📋 App.vue: 会话详情:', conversationList.map(conv => ({
                        id: conv.id,
                        name: conv.chatUserVO.name,
                        unreadCount: conv.unreadMessageCount
                    })))
                    chatUnreadCount.value = unread;
                    console.log('✅ App.vue: 聊天未读数量已更新')
                } else {
                    console.log('🔢 App.vue: 没有会话，设置聊天未读数量为0')
                    chatUnreadCount.value = 0;
                }
            } catch (error) {
                console.error('❌ App.vue: 获取会话列表失败:', error);
                chatUnreadCount.value = 0;
            }
        };

        const tokenInfo = () => {
            callInfo('使用人工智能前请先登录');
        }

        const openMessageSidebar = () => {
            sidebarVisible.value = true;
        }

        const closeSidebar = () => {
            sidebarVisible.value = false;
        }


        const openChat = () => {
            chatVisible.value = true;
        }

        const closeChat = () => {
            chatVisible.value = false;
        }

        const updateUnreadCount = (count) => {
            unreadCount.value = count;
        }

        const updateChatUnreadCountFromChild = (count) => {
            // 当聊天组件通知未读数量变化时，直接更新ref
            chatUnreadCount.value = count;
        }

        onMounted(() => {
            // 检查用户是否已登录，如果已登录则连接WebSocket
            if (store.getters.getToken && store.getters.getId) {
                console.log('检测到用户已登录，自动连接WebSocket')
                websocketManager.connect()
            }
            
            // 监听用户登录状态变化
            watch(() => store.getters.getToken, async (newToken, oldToken) => {
                if (newToken && !oldToken) {
                    // 用户登录
                    console.log('检测到用户登录，连接WebSocket')
                    websocketManager.connect()
                } else if (!newToken && oldToken) {
                    // 用户登出
                    console.log('检测到用户登出，断开WebSocket')
                    websocketManager.disconnect()
                    // 用户登出时清空聊天未读数
                    chatUnreadCount.value = 0;
                }
            })
            
            // 监听用户ID变化，确保在用户切换时更新聊天未读数
            watch(() => store.getters.getId, async (newUserId, oldUserId) => {
                if (newUserId && newUserId !== oldUserId) {
                    // 用户ID变化（登录或切换用户），如果WebSocket已连接则更新聊天未读数
                    if (websocketManager.isConnected()) {
                        await updateChatUnreadCount();
                    }
                }
            })
            
            // 全局注册聊天消息处理器，确保无论是否打开聊天窗口都能处理消息
            websocketManager.registerMessageHandler('chat_message', async (msg) => {
                console.log('📨 App.vue: 收到聊天消息，开始更新未读数量')
                // 每次收到聊天消息时，重新获取会话列表并计算未读数
                await updateChatUnreadCount();
                
                // 通过自定义事件将聊天消息传递给聊天组件
                window.dispatchEvent(new CustomEvent('chatMessageReceived', { detail: msg }))
            });
            
            websocketManager.registerMessageHandler('send_success', () => {
                // 通过自定义事件将发送成功消息传递给聊天组件
                window.dispatchEvent(new CustomEvent('chatMessageSent', { detail: {} }))
            });
            
            // 全局注册通用消息处理器，将所有非聊天消息传递给消息中心组件
            websocketManager.registerMessageHandler('*', (msg) => {
                // 检查消息类型，如果不是聊天相关消息，则转发给消息中心
                if (msg.type && msg.type !== 'chat_message' && msg.type !== 'send_success') {
                    console.log('App.vue: 将非聊天消息转发给消息中心:', msg.type, msg)
                    // 通过自定义事件将消息传递给消息中心组件
                    window.dispatchEvent(new CustomEvent('systemMessageReceived', { detail: msg }))
                }
            });
            
            // 注册WebSocket连接状态处理器
            websocketManager.registerConnectionHandler('app', async (connected) => {
                console.log(`🔌 App.vue: WebSocket连接状态变化: ${connected}`)
                // 通过自定义事件将连接状态变化传递给所有组件
                window.dispatchEvent(new CustomEvent('websocketConnectionChanged', { detail: { connected } }))
                
                // 连接成功后，获取会话列表并计算未读数
                if (connected) {
                    console.log('🔌 App.vue: WebSocket连接成功，开始更新未读数量')
                    await updateChatUnreadCount();
                }
            });
        });
        onUnmounted(() => {
            websocketManager.unregisterMessageHandler('chat_message');
            websocketManager.unregisterMessageHandler('send_success');
            websocketManager.unregisterMessageHandler('*');
            websocketManager.unregisterConnectionHandler('app');
        });

        return {
            navOpen,
            tokenSet,
            vipSet,
            padSet,
            sidebarVisible,
            chatVisible,
            unreadCount,
            chatUnreadCount,
            tokenInfo,
            openMessageSidebar,
            closeSidebar,
            openChat,
            closeChat,
            updateUnreadCount,
            updateChatUnreadCountFromChild
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
    bottom: 100px;
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

/* 聊天功能触发按钮样式 */
.chat-trigger-btn {
    position: fixed;
    right: 30px;
    bottom: 30px;
    width: 56px;
    height: 56px;
    background-color: #67c23a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
    transition: all 0.3s ease;
    z-index: 999;
}

.chat-trigger-btn:hover {
    background-color: #5daf34;
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(103, 194, 58, 0.6);
}

.chat-trigger-btn .el-icon {
    font-size: 24px;
    color: white;
}

.chat-badge {
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
