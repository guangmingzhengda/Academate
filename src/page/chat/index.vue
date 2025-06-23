<template>
    <div 
        class="chat-container" 
        :class="{ 'chat-fullscreen': isFullscreen }"
        :style="chatPosition"
        ref="chatContainer"
        @mousedown="startDrag"
    >
        <!-- 聊天窗口头部 -->
        <div class="chat-header" ref="dragHandle">
            <div class="header-left">
                <span class="chat-title">{{ currentView === 'chat' ? '聊天' : '选择好友' }}</span>
            </div>
            <div class="header-right">
                <el-button 
                    v-if="currentView === 'friends'"
                    type="text" 
                    @click="backToChat"
                    class="back-btn"
                >
                    <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button 
                    type="text" 
                    @click="toggleFullscreen"
                    class="fullscreen-btn"
                >
                    <el-icon>
                        <FullScreen v-if="!isFullscreen" />
                        <Aim v-else />
                    </el-icon>
                </el-button>
                <el-button 
                    type="text" 
                    @click="closeChat"
                    class="close-btn"
                >
                    <el-icon><Close /></el-icon>
                </el-button>
            </div>
        </div>

        <!-- 聊天主体内容 -->
        <div class="chat-main">
            <!-- 左侧对话列表 -->
            <div class="conversation-list" v-if="currentView === 'chat'">
                <div class="list-header">
                    <h3>对话列表</h3>
                    <el-button type="primary" size="small" @click="showFriendsList">
                        <el-icon><Plus /></el-icon>
                        新建对话
                    </el-button>
                </div>
                
                <div class="conversation-items">
                    <div 
                        v-for="conversation in conversations" 
                        :key="conversation.id"
                        class="conversation-item"
                        :class="{ 'active': currentConversation?.id === conversation.id }"
                        @click="selectConversation(conversation)"
                    >
                        <div class="avatar">
                            <img :src="conversation.avatar" :alt="conversation.name" />
                        </div>
                        <div class="conversation-info">
                            <div class="name">{{ conversation.name }}</div>
                            <div class="last-message">{{ conversation.lastMessage }}</div>
                        </div>
                        <div class="conversation-meta">
                            <div class="time">{{ conversation.lastTime }}</div>
                            <div v-if="conversation.unreadCount > 0" class="unread-count">
                                {{ conversation.unreadCount }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 好友列表 -->
            <div class="friends-list" v-if="currentView === 'friends'">
                <div class="list-header">
                    <h3>好友列表</h3>
                    <el-input
                        v-model="searchKeyword"
                        placeholder="搜索好友..."
                        size="small"
                        style="width: 150px;"
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                </div>
                
                <div class="friends-items">
                    <div 
                        v-for="friend in filteredFriends" 
                        :key="friend.id"
                        class="friend-item"
                        @click="selectFriend(friend)"
                    >
                        <div class="avatar">
                            <img :src="friend.avatar" :alt="friend.name" />
                        </div>
                        <div class="friend-info">
                            <div class="name">{{ friend.name }}</div>
                            <div class="status">{{ friend.status }}</div>
                        </div>
                        <div class="friend-meta">
                            <div class="online-status" :class="{ 'online': friend.isOnline }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧聊天窗口 -->
            <div class="chat-window">
                <div v-if="currentConversation && currentView === 'chat'" class="chat-content">
                    <!-- 聊天记录区域 -->
                    <div class="messages-container" ref="messagesContainer">
                        <div 
                            v-for="message in currentConversation.messages" 
                            :key="message.id"
                            class="message-item"
                            :class="{ 'message-mine': message.isMine }"
                        >
                            <div class="message-avatar">
                                <img 
                                    :src="message.isMine ? myAvatar : currentConversation.avatar" 
                                    :alt="message.isMine ? '我' : currentConversation.name" 
                                />
                            </div>
                            <div class="message-content">
                                <div class="message-bubble">
                                    {{ message.content }}
                                </div>
                                <div class="message-time">{{ message.time }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 输入区域 -->
                    <div class="input-area">
                        <div class="input-container">
                            <el-input
                                v-model="messageInput"
                                type="textarea"
                                :rows="3"
                                placeholder="输入消息..."
                                @keydown.enter.prevent="sendMessage"
                                resize="none"
                            />
                            <div class="input-actions">
                                <el-button 
                                    type="primary" 
                                    @click="sendMessage"
                                    :disabled="!messageInput.trim()"
                                >
                                    发送
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 未选择对话时的提示 -->
                <div v-else-if="currentView === 'chat'" class="no-conversation">
                    <div class="empty-state">
                        <el-icon class="empty-icon"><ChatDotRound /></el-icon>
                        <p>选择一个对话开始聊天</p>
                    </div>
                </div>

                <!-- 好友列表时的提示 -->
                <div v-else-if="currentView === 'friends'" class="friends-hint">
                    <div class="empty-state">
                        <el-icon class="empty-icon"><User /></el-icon>
                        <p>选择一个好友开始聊天</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { 
    FullScreen, 
    Aim, 
    Close, 
    Plus, 
    ChatDotRound,
    ArrowLeft,
    Search,
    User
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 定义emit事件
const emit = defineEmits(['close'])

// 响应式数据
const isFullscreen = ref(false)
const messageInput = ref('')
const messagesContainer = ref(null)
const currentConversation = ref(null)
const chatContainer = ref(null)
const dragHandle = ref(null)
const currentView = ref('chat') // 'chat' 或 'friends'
const searchKeyword = ref('')

// 拖动相关状态
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const chatStartX = ref(0)
const chatStartY = ref(0)
const chatX = ref(20)
const chatY = ref(20)

// 计算聊天窗口位置
const chatPosition = computed(() => {
    if (isFullscreen.value) {
        return {
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100vw',
            height: '100vh',
            borderRadius: '0'
        }
    }
    return {
        left: `${chatX.value}px`,
        top: `${chatY.value}px`,
        right: 'auto',
        bottom: 'auto',
        width: '800px',
        height: '600px'
    }
})

// 模拟数据
const myAvatar = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')

// 好友列表数据
const friends = ref([
    {
        id: 1,
        name: '张三',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        status: '在线',
        isOnline: true
    },
    {
        id: 2,
        name: '李四',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        status: '忙碌中',
        isOnline: true
    },
    {
        id: 3,
        name: '王五',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        status: '离线',
        isOnline: false
    },
    {
        id: 4,
        name: '赵六',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        status: '在线',
        isOnline: true
    },
    {
        id: 5,
        name: '孙七',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        status: '离开',
        isOnline: false
    }
])

// 过滤后的好友列表
const filteredFriends = computed(() => {
    if (!searchKeyword.value) return friends.value
    return friends.value.filter(friend => 
        friend.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
})

const conversations = ref([
    {
        id: 1,
        name: '张三',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        lastMessage: '你好，关于那个项目的事情...',
        lastTime: '14:30',
        unreadCount: 2,
        messages: [
            {
                id: 1,
                content: '你好！',
                time: '14:25',
                isMine: false
            },
            {
                id: 2,
                content: '你好，关于那个项目的事情想和你讨论一下',
                time: '14:30',
                isMine: false
            }
        ]
    },
    {
        id: 2,
        name: '李四',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        lastMessage: '好的，我明白了',
        lastTime: '13:45',
        unreadCount: 0,
        messages: [
            {
                id: 1,
                content: '李四，那个文档你看过了吗？',
                time: '13:40',
                isMine: true
            },
            {
                id: 2,
                content: '好的，我明白了',
                time: '13:45',
                isMine: false
            }
        ]
    },
    {
        id: 3,
        name: '王五',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        lastMessage: '明天开会讨论一下',
        lastTime: '12:20',
        unreadCount: 1,
        messages: [
            {
                id: 1,
                content: '王五，明天有空吗？',
                time: '12:15',
                isMine: true
            },
            {
                id: 2,
                content: '明天开会讨论一下',
                time: '12:20',
                isMine: false
            }
        ]
    }
])

// 拖动相关方法
const startDrag = (e) => {
    // 只有在非全屏模式下才能拖动
    if (isFullscreen.value) return
    
    // 检查是否点击的是头部区域
    const target = e.target
    if (!dragHandle.value || !dragHandle.value.contains(target)) return
    
    // 阻止默认行为
    e.preventDefault()
    e.stopPropagation()
    
    isDragging.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    chatStartX.value = chatX.value
    chatStartY.value = chatY.value
    
    // 添加拖动时的样式
    if (chatContainer.value) {
        chatContainer.value.style.cursor = 'grabbing'
        chatContainer.value.style.userSelect = 'none'
        chatContainer.value.style.transition = 'none' // 禁用过渡动画
        chatContainer.value.classList.add('dragging')
    }
    
    // 添加全局事件监听
    document.addEventListener('mousemove', onDrag, { passive: false })
    document.addEventListener('mouseup', stopDrag, { passive: false })
}

const onDrag = (e) => {
    if (!isDragging.value) return
    
    // 阻止默认行为
    e.preventDefault()
    
    // 使用 requestAnimationFrame 优化性能
    requestAnimationFrame(() => {
        const deltaX = e.clientX - dragStartX.value
        const deltaY = e.clientY - dragStartY.value
        
        // 计算新位置
        let newX = chatStartX.value + deltaX
        let newY = chatStartY.value + deltaY
        
        // 边界检查，确保窗口不会完全移出屏幕
        const maxX = window.innerWidth - 800
        const maxY = window.innerHeight - 600
        
        newX = Math.max(0, Math.min(newX, maxX))
        newY = Math.max(0, Math.min(newY, maxY))
        
        // 直接更新DOM样式，避免Vue的响应式更新延迟
        if (chatContainer.value) {
            chatContainer.value.style.left = `${newX}px`
            chatContainer.value.style.top = `${newY}px`
        }
        
        // 同步更新响应式数据
        chatX.value = newX
        chatY.value = newY
    })
}

const stopDrag = (e) => {
    if (!isDragging.value) return
    
    // 阻止默认行为
    e.preventDefault()
    e.stopPropagation()
    
    isDragging.value = false
    
    // 恢复样式
    if (chatContainer.value) {
        chatContainer.value.style.cursor = ''
        chatContainer.value.style.userSelect = ''
        chatContainer.value.style.transition = 'all 0.3s ease' // 恢复过渡动画
        chatContainer.value.classList.remove('dragging')
    }
    
    // 移除全局事件监听
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
}

// 方法
const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    
    // 如果退出全屏，重置位置到屏幕中央
    if (!isFullscreen.value) {
        const maxX = window.innerWidth - 800
        const maxY = window.innerHeight - 600
        chatX.value = Math.max(0, maxX / 2)
        chatY.value = Math.max(0, maxY / 2)
    }
}

const closeChat = () => {
    // 触发关闭事件
    emit('close')
    ElMessage.success('聊天窗口已关闭')
}

const showFriendsList = () => {
    currentView.value = 'friends'
    searchKeyword.value = ''
}

const backToChat = () => {
    currentView.value = 'chat'
    searchKeyword.value = ''
}

const selectFriend = (friend) => {
    // 检查是否已有与该好友的对话
    const existingConversation = conversations.value.find(conv => conv.name === friend.name)
    
    if (existingConversation) {
        // 如果已有对话，跳转到该对话
        selectConversation(existingConversation)
        ElMessage.success(`已跳转到与 ${friend.name} 的对话`)
    } else {
        // 如果没有对话，创建新对话
        const newConversation = {
            id: Date.now(),
            name: friend.name,
            avatar: friend.avatar,
            lastMessage: '',
            lastTime: new Date().toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            unreadCount: 0,
            messages: []
        }
        
        conversations.value.unshift(newConversation)
        selectConversation(newConversation)
        ElMessage.success(`已创建与 ${friend.name} 的新对话`)
    }
    
    // 返回聊天界面
    currentView.value = 'chat'
}

const selectConversation = (conversation) => {
    currentConversation.value = conversation
    // 清除未读消息
    conversation.unreadCount = 0
    // 滚动到底部
    nextTick(() => {
        scrollToBottom()
    })
}

const sendMessage = () => {
    if (!messageInput.value.trim() || !currentConversation.value) return

    const newMessage = {
        id: Date.now(),
        content: messageInput.value,
        time: new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        isMine: true
    }

    currentConversation.value.messages.push(newMessage)
    currentConversation.value.lastMessage = messageInput.value
    currentConversation.value.lastTime = newMessage.time

    messageInput.value = ''

    // 滚动到底部
    nextTick(() => {
        scrollToBottom()
    })
}

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

// 生命周期
onMounted(() => {
    // 默认选择第一个对话
    if (conversations.value.length > 0) {
        selectConversation(conversations.value[0])
    }
    
    // 初始化位置到屏幕中央
    const maxX = window.innerWidth - 800
    const maxY = window.innerHeight - 600
    chatX.value = Math.max(0, maxX / 2)
    chatY.value = Math.max(0, maxY / 2)
})

onUnmounted(() => {
    // 清理事件监听
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.chat-container {
    position: fixed;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    transition: all 0.3s ease;
    border: 1px solid #e4e7ed;
    /* 硬件加速优化 */
    transform: translateZ(0);
    will-change: transform;
}

.chat-container.chat-fullscreen {
    border-radius: 0;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    border-radius: 12px 12px 0 0;
    cursor: grab;
    user-select: none;
    /* 防止拖拽时的文本选择 */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.chat-header:active {
    cursor: grabbing;
}

.chat-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.header-right {
    display: flex;
    gap: 8px;
}

.back-btn,
.fullscreen-btn,
.close-btn {
    padding: 4px;
    color: #606266;
}

.back-btn:hover,
.fullscreen-btn:hover,
.close-btn:hover {
    color: #409eff;
}

.chat-main {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.conversation-list,
.friends-list {
    width: 280px;
    border-right: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
}

.list-header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.list-header h3 {
    margin: 0;
    font-size: 14px;
    color: #303133;
}

.conversation-items,
.friends-items {
    flex: 1;
    overflow-y: auto;
}

.conversation-item,
.friend-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f5f7fa;
}

.conversation-item:hover,
.friend-item:hover {
    background-color: #f5f7fa;
}

.conversation-item.active {
    background-color: #ecf5ff;
    border-right: 3px solid #409eff;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 12px;
    flex-shrink: 0;
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.conversation-info,
.friend-info {
    flex: 1;
    min-width: 0;
}

.name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.last-message,
.status {
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.conversation-meta,
.friend-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.time {
    font-size: 11px;
    color: #c0c4cc;
}

.unread-count {
    background: #f56c6c;
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 11px;
    min-width: 16px;
    text-align: center;
}

.online-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #c0c4cc;
}

.online-status.online {
    background-color: #67c23a;
}

.chat-window {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.messages-container {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #fafafa;
}

.message-item {
    display: flex;
    margin-bottom: 16px;
    align-items: flex-start;
}

.message-item.message-mine {
    flex-direction: row-reverse;
}

.message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 8px;
    flex-shrink: 0;
}

.message-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.message-content {
    max-width: 60%;
    display: flex;
    flex-direction: column;
}

.message-mine .message-content {
    align-items: flex-end;
}

.message-bubble {
    background: white;
    padding: 12px 16px;
    border-radius: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    word-wrap: break-word;
    line-height: 1.4;
    font-size: 14px;
    color: #303133;
}

.message-mine .message-bubble {
    background: #409eff;
    color: white;
}

.message-time {
    font-size: 11px;
    color: #c0c4cc;
    margin-top: 4px;
    padding: 0 4px;
    align-self: flex-start;
}

.message-mine .message-time {
    align-self: flex-end;
}

.input-area {
    padding: 16px 20px;
    border-top: 1px solid #e4e7ed;
    background: white;
}

.input-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.input-actions {
    display: flex;
    justify-content: flex-end;
}

.no-conversation,
.friends-hint {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
}

.empty-state {
    text-align: center;
    color: #909399;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #c0c4cc;
}

/* 滚动条样式 */
.conversation-items::-webkit-scrollbar,
.friends-items::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
    width: 6px;
}

.conversation-items::-webkit-scrollbar-track,
.friends-items::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.conversation-items::-webkit-scrollbar-thumb,
.friends-items::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.conversation-items::-webkit-scrollbar-thumb:hover,
.friends-items::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 拖拽时的样式优化 */
.chat-container.dragging {
    transition: none !important;
    cursor: grabbing;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .chat-container {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
    }
    
    .conversation-list,
    .friends-list {
        width: 200px;
    }
}
</style> 