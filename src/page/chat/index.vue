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
                <span class="chat-title">{{ currentView === 'chat' ? '聊天' : '选择关注用户' }}</span>
                <div class="connection-status" :class="{ 'connected': wsConnected, 'disconnected': !wsConnected }" @click="reconnectWebSocket">
                    <div class="status-dot"></div>
                    <span class="status-text">{{ wsConnected ? '已连接' : '连接中...' }}</span>
                </div>
            </div>
            <div class="header-right">
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

            <!-- 关注用户列表 -->
            <div class="friends-list" v-if="currentView === 'friends'">
                <div class="list-header">
                    <el-button 
                        type="text" 
                        @click="backToChat"
                        class="back-btn"
                        style="margin-right: 4px;"
                    >
                        <el-icon><ArrowLeft /></el-icon>
                    </el-button>
                    <h3 style="margin: 0;">关注列表</h3>
                    <el-input
                        v-model="searchKeyword"
                        placeholder="搜索关注用户..."
                        size="small"
                        style="width: 150px; margin-left: auto;"
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
                    <div 
                        class="messages-container"
                        :class="{ 'fullscreen-messages': isFullscreen }"
                        ref="messagesContainer"
                    >
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
                    <div 
                        class="input-area"
                        :class="{ 'fullscreen-input': isFullscreen }"
                    >
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

                <!-- 关注用户列表时的提示 -->
                <div v-else-if="currentView === 'friends'" class="friends-hint">
                    <div class="empty-state">
                        <el-icon class="empty-icon"><User /></el-icon>
                        <p>选择一个关注用户开始聊天</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
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
import axios from 'axios'
import store from '@/store'
import { listConversations } from '@/api/chat'
import { listChatMessages } from '@/api/chat'
import { getFollowedUsers } from '@/api/follow'

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

// WebSocket相关状态（仅用于发送消息）
const ws = ref(null)
const wsConnected = ref(false)
const reconnectTimer = ref(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5

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

// 会话列表数据
const conversations = ref([])

// 好友列表数据
const friends = ref([])

// 过滤后的好友列表
const filteredFriends = computed(() => {
    if (!searchKeyword.value) return friends.value
    return friends.value.filter(friend => 
        friend.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
})

// 获取当前用户ID
const currentUserId = computed(() => store.getters.getId)

// WebSocket连接函数（仅用于发送消息）
const connectWebSocket = () => {
    const userId = currentUserId.value
    if (!userId) {
        console.error('用户ID未找到，无法建立WebSocket连接')
        return
    }

    const wsUrl = `ws://123.56.50.152:8081/api/websocket/${userId}`
    console.log('正在连接聊天WebSocket:', wsUrl)

    try {
        ws.value = new WebSocket(wsUrl)

        ws.value.onopen = () => {
            console.log('聊天WebSocket连接成功')
            wsConnected.value = true
            reconnectAttempts.value = 0
        }

        ws.value.onmessage = (event) => {
            // 不处理接收到的消息，聊天记录通过API获取
            console.log('收到WebSocket消息（不处理）:', event.data)
        }

        ws.value.onclose = (event) => {
            console.log('聊天WebSocket连接关闭:', event.code, event.reason)
            wsConnected.value = false
            
            // 非正常关闭时尝试重连
            if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
                console.log(`尝试重连聊天WebSocket (${reconnectAttempts.value + 1}/${maxReconnectAttempts})`)
                reconnectAttempts.value++
                reconnectTimer.value = setTimeout(() => {
                    connectWebSocket()
                }, 3000 * reconnectAttempts.value) // 递增延迟重连
            }
        }

        ws.value.onerror = (error) => {
            console.error('聊天WebSocket连接错误:', error)
            wsConnected.value = false
        }

    } catch (error) {
        console.error('创建聊天WebSocket连接失败:', error)
    }
}

// 断开WebSocket连接
const disconnectWebSocket = () => {
    if (reconnectTimer.value) {
        clearTimeout(reconnectTimer.value)
        reconnectTimer.value = null
    }
    
    if (ws.value) {
        console.log('断开聊天WebSocket连接')
        ws.value.close(1000, '组件卸载')
        ws.value = null
    }
    wsConnected.value = false
}

// 获取聊天记录
const fetchChatMessages = async (conversationId) => {
    try {
        console.log('开始获取聊天记录，会话ID:', conversationId)
        
        const messages = await listChatMessages(conversationId)
        
        if (messages && messages.length > 0) {
            // 转换消息数据格式
            return messages.map(msg => ({
                id: msg.messageId,
                content: msg.message,
                time: new Date(msg.sentAt).toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                isMine: msg.senderId === currentUserId.value,
                sentAt: msg.sentAt,
                status: msg.status,
                type: msg.type
            }))
        } else {
            console.log('没有聊天记录或获取失败')
            return []
        }
    } catch (error) {
        console.error('获取聊天记录错误:', error)
        return []
    }
}

// 获取所有会话列表
const fetchConversations = async () => {
    try {
        console.log('开始获取会话列表')
        
        const conversationList = await listConversations()
        
        if (conversationList && conversationList.length > 0) {
            // 转换会话数据格式
            conversations.value = conversationList.map(conv => ({
                id: conv.id,
                name: conv.chatUserVO.name || '未知用户',
                avatar: conv.chatUserVO.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
                lastMessage: '',
                lastTime: new Date(conv.updatedAt).toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                unreadCount: 0,
                messages: [],
                chatUserVO: conv.chatUserVO,
                initiatorId: conv.initiatorId,
                status: conv.status,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt
            }))
            
            console.log(`成功获取 ${conversations.value.length} 个会话`)
        } else {
            console.log('没有会话或获取失败')
            conversations.value = []
        }
    } catch (error) {
        console.error('获取会话列表错误:', error)
        conversations.value = []
    }
}

// 通过WebSocket发送消息
const sendMessageViaWebSocket = (receiverId, content) => {
    if (!wsConnected.value) {
        ElMessage.error('WebSocket连接已断开，无法发送消息')
        return false
    }
    
    const messageData = {
        sid: currentUserId.value,
        rid: receiverId,
        content: content
    }
    
    try {
        ws.value.send(JSON.stringify(messageData))
        console.log('消息已通过WebSocket发送:', messageData)
        return true
    } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败')
        return false
    }
}

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
    // 获取关注用户列表
    fetchFollowedUsers()
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
            messages: [],
            chatUserVO: {
                userId: friend.id,
                name: friend.name,
                account: friend.account || friend.name,
                avatar: friend.avatar
            }
        }
        
        conversations.value.unshift(newConversation)
        selectConversation(newConversation)
        ElMessage.success(`已创建与 ${friend.name} 的新对话`)
    }
    
    // 返回聊天界面
    currentView.value = 'chat'
}

const selectConversation = async (conversation) => {
    currentConversation.value = conversation
    
    // 获取该会话的聊天记录
    if (conversation.id) {
        const messages = await fetchChatMessages(conversation.id)
        conversation.messages = messages
        
        // 更新最后消息和时间（如果有消息的话）
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            conversation.lastMessage = lastMessage.content
            conversation.lastTime = lastMessage.time
        }
    }
    
    // 清除未读消息
    conversation.unreadCount = 0
    
    // 滚动到底部
    nextTick(() => {
        scrollToBottom()
    })
}

const sendMessage = async () => {
    if (!messageInput.value.trim() || !currentConversation.value) return

    const content = messageInput.value.trim()
    const receiverId = currentConversation.value.chatUserVO.userId

    // 通过WebSocket发送消息
    const sendSuccess = sendMessageViaWebSocket(receiverId, content)
    
    if (sendSuccess) {
        // 清空输入框
        messageInput.value = ''
        
        // 发送成功后，重新获取聊天记录
        if (currentConversation.value.id) {
            const messages = await fetchChatMessages(currentConversation.value.id)
            currentConversation.value.messages = messages
            
            // 更新最后消息和时间（如果有消息的话）
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1]
                currentConversation.value.lastMessage = lastMessage.content
                currentConversation.value.lastTime = lastMessage.time
            }
        }

        // 滚动到底部
        nextTick(() => {
            scrollToBottom()
        })
    }
}

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

// 聊天窗口整体拦截滚轮
const handleChatWheel = (e) => {
    // 判断是否在消息区
    const el = messagesContainer.value
    if (el && el.contains(e.target)) {
        // 在消息区，执行消息区滚动逻辑
        const { scrollTop, scrollHeight, clientHeight } = el
        const delta = e.deltaY
        if (
            (delta < 0 && scrollTop === 0) ||
            (delta > 0 && scrollTop + clientHeight >= scrollHeight)
        ) {
            // 已经到顶或到底，消息区不滚动
            e.preventDefault()
            e.stopPropagation()
            return
        }
        // 阻止主页面滚动，自己滚
        e.preventDefault()
        e.stopPropagation()
        el.scrollTop += delta
    } else {
        // 不在消息区，阻止主页面滚动，但不做任何滚动
        e.preventDefault()
        e.stopPropagation()
    }
}

// 获取关注用户列表
const fetchFollowedUsers = async () => {
    try {
        console.log('开始获取关注用户列表')
        
        const userId = currentUserId.value
        if (!userId) {
            console.log('用户未登录，无法获取关注列表')
            return
        }
        
        const result = await getFollowedUsers(userId, 1, 100) // 获取前100个关注用户
        
        if (result && result.records && result.records.length > 0) {
            // 转换关注用户数据格式
            friends.value = result.records.map(user => ({
                id: user.userId,
                name: user.name || '未知用户('+user.account+')',
                avatar: user.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
                status: '在线', // 默认状态，实际应该从在线状态接口获取
                isOnline: true, // 默认在线，实际应该从在线状态接口获取
                account: user.account
            }))
            
            console.log(`成功获取 ${friends.value.length} 个关注用户`)
        } else {
            console.log('没有关注用户或获取失败')
            friends.value = []
        }
    } catch (error) {
        console.error('获取关注用户列表错误:', error)
        friends.value = []
    }
}

// 生命周期
onMounted(async () => {
    // 获取会话列表
    await fetchConversations()
    
    // 默认选择第一个对话
    if (conversations.value.length > 0) {
        selectConversation(conversations.value[0])
    }
    
    // 初始化位置到屏幕中央
    const maxX = window.innerWidth - 800
    const maxY = window.innerHeight - 600
    chatX.value = Math.max(0, maxX / 2)
    chatY.value = Math.max(0, maxY / 2)

    if (messagesContainer.value) {
        messagesContainer.value.addEventListener('wheel', handleChatWheel, { passive: false })
    }

    if (chatContainer.value) {
        chatContainer.value.addEventListener('wheel', handleChatWheel, { passive: false })
    }
})

onUnmounted(() => {
    // 清理事件监听
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)

    // 断开WebSocket连接
    disconnectWebSocket()

    if (messagesContainer.value) {
        messagesContainer.value.removeEventListener('wheel', handleChatWheel)
    }

    if (chatContainer.value) {
        chatContainer.value.removeEventListener('wheel', handleChatWheel)
    }
})

// 监听用户ID变化，自动连接/断开WebSocket
watch(currentUserId, (newUserId, oldUserId) => {
    console.log('聊天页面用户ID变化:', { oldUserId, newUserId })
    
    if (newUserId && newUserId !== null) {
        // 用户已登录
        if (oldUserId && oldUserId !== newUserId) {
            // 用户切换，重新获取会话列表
            console.log('用户切换，重新获取会话列表')
            fetchConversations()
        }
        
        if (!wsConnected.value) {
            // 建立WebSocket连接
            console.log('用户已登录，建立聊天WebSocket连接')
            connectWebSocket()
        }
        
    } else if (!newUserId || newUserId === null) {
        // 用户退出登录，断开连接并清空会话
        console.log('用户已退出，断开聊天WebSocket连接并清空会话')
        disconnectWebSocket()
        conversations.value = []
        currentConversation.value = null
    }
}, { immediate: true })

// 手动重连WebSocket
const reconnectWebSocket = () => {
    if (wsConnected.value) {
        ElMessage.info('WebSocket已连接')
        return
    }
    
    console.log('手动重连WebSocket')
    disconnectWebSocket()
    reconnectAttempts.value = 0
    
    setTimeout(() => {
        if (currentUserId.value) {
            connectWebSocket()
        }
    }, 1000)
    
    ElMessage.info('正在重新连接...')
}
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

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.connection-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    background: #f5f7fa;
    cursor: pointer;
    transition: all 0.2s ease;
}

.connection-status:hover {
    transform: scale(1.05);
}

.connection-status.connected {
    background: #f0f9ff;
    color: #67c23a;
}

.connection-status.disconnected {
    background: #fef0f0;
    color: #f56c6c;
}

.connection-status.disconnected:hover {
    background: #fde2e2;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 2s infinite;
}

.connection-status.connected .status-dot {
    animation: none;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.status-text {
    font-size: 11px;
    font-weight: 500;
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
    text-align: left;
}

.last-message,
.status {
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
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
    height: 100%;
    min-width: 0;
}

.chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

.messages-container {
    flex: 1 1 0;
    min-height: 0;
    max-height: 350px;
    padding: 20px;
    overflow-y: auto;
    background: #fafafa;
    transition: max-height 0.3s;
}

.fullscreen-messages {
    max-height: 70vh;
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
    align-items: flex-start;
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
    text-align: left;
}

.message-mine .message-bubble {
    background: #409eff;
    color: white;
    text-align: left;
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
    flex-shrink: 0;
    transition: padding 0.3s;
}

.fullscreen-input {
    padding: 8px 20px;
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