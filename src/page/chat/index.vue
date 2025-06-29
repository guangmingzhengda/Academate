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
                            <div class="name">
                                {{ conversation.name }}
                                <span v-if="conversation.status === 'pending'" class="status-badge pending">待回复</span>
                            </div>
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
                                    :src="message.isMine ? myAvatar : (message.avatar || currentConversation.avatar)" 
                                    :alt="message.isMine ? '我' : currentConversation.name" 
                                />
                            </div>
                            <div class="message-content">
                                <div class="message-bubble">
                                    {{ message.content }}
                                    <div v-if="message.status === 'failed'" style="font-size: 10px; color: #f56c6c;">发送失败</div>
                                </div>
                                <div class="message-time">{{ message.time }}</div>
                            </div>
                        </div>
                        
                        <!-- 状态变化提示 -->
                        <div v-if="showStatusChangeTip" class="status-change-tip">
                            <div class="tip-content">
                                <el-icon class="tip-icon"><ChatDotRound /></el-icon>
                                <span>现在你们可以畅聊了</span>
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
                                :placeholder="(currentConversation?.status === 'pending' && currentConversation?.initiatorId === currentUserId) ? '待对方回复后即可畅聊。' : '输入消息...'"
                                @keydown.enter.prevent="sendMessage"
                                resize="none"
                                :disabled="currentConversation?.status === 'pending' && currentConversation?.initiatorId === currentUserId"
                            />
                            <div class="input-actions">
                                <el-button 
                                    type="primary" 
                                    @click="sendMessage"
                                    :disabled="!messageInput.trim() || (currentConversation?.status === 'pending' && currentConversation?.initiatorId === currentUserId)"
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
import { listChatMessages, createConversation, sendChatMessage } from '@/api/chat'
import { getFollowedUsers } from '@/api/follow'
import { markAsRead } from '@/api/msg'

// 定义emit事件
const emit = defineEmits(['close', 'unread-count-update'])

// 响应式数据
const isFullscreen = ref(false)
const messageInput = ref('')
const messagesContainer = ref(null)
const currentConversation = ref(null)
const chatContainer = ref(null)
const dragHandle = ref(null)
const currentView = ref('chat') // 'chat' 或 'friends'
const searchKeyword = ref('')
const showStatusChangeTip = ref(false) // 状态变化提示
const previousConversationStatus = ref(null) // 记录之前的会话状态

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

// 时间格式化函数
const formatMessageTime = (dateString) => {
    const messageDate = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
    
    if (messageDay.getTime() === today.getTime()) {
        // 今天的消息，只显示时间
        return messageDate.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    } else {
        // 非今天的消息，显示年月日和时间
        return messageDate.toLocaleString('zh-CN', { 
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }
}

// WebSocket连接函数（仅用于发送消息）
const connectWebSocket = () => {
    const userId = currentUserId.value
    if (!userId) {
        console.error('用户ID未找到，无法建立WebSocket连接')
        return
    }

    // 检查是否已经存在连接
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        console.log('WebSocket连接已存在且处于打开状态，跳过连接')
        return
    }

    // 如果存在旧连接，先关闭
    if (ws.value) {
        console.log('关闭现有WebSocket连接')
        ws.value.close(1000, '重新连接')
        ws.value = null
    }

    const wsUrl = `ws://123.56.50.152:8081/api/websocket/${userId}`
    console.log('正在连接聊天WebSocket:', wsUrl)

    try {
        ws.value = new WebSocket(wsUrl)

        ws.value.onopen = () => {
            console.log('聊天WebSocket连接成功，连接状态:', ws.value.readyState)
            wsConnected.value = true
            reconnectAttempts.value = 0
        }

        ws.value.onmessage = (event) => {
            console.log('收到WebSocket消息:', event.data)
            
            // 先检查是否是特殊字符串消息
            if (event.data === 'true') {
                console.log('收到发送成功确认消息')
                handleSendSuccess()
                return
            }
            
            if (event.data === 'conn_success') {
                console.log('收到连接成功确认消息')
                return
            }
            
            // 尝试解析JSON消息
            try {
                const messageData = JSON.parse(event.data)
                console.log('解析后的消息数据:', messageData)
                
                // 检查是否是聊天消息（有sid、rid、content字段）
                if (messageData.sid && messageData.rid && messageData.content) {
                    console.log('识别为聊天消息，调用聊天消息处理函数')
                    handleIncomingChatMessage(messageData)
                } else if (messageData.message && messageData.messageId && messageData.type === 'chat_message') {
                    console.log('识别为新的聊天消息格式，调用聊天消息处理函数')
                    handleIncomingChatMessage(messageData)
                } else if (messageData.message && messageData.messageId) {
                    console.log('识别为系统消息，跳过处理（聊天界面不处理系统消息）')
                } else {
                    console.log('未知消息格式，跳过处理')
                }
                
            } catch (error) {
                console.log('解析WebSocket消息失败，不是JSON:', event.data)
            }
        }

        ws.value.onclose = (event) => {
            console.log('=== WebSocket连接关闭调试信息 ===')
            console.log('关闭代码:', event.code)
            console.log('关闭原因:', event.reason)
            console.log('是否干净关闭:', event.wasClean)
            console.log('关闭时间:', new Date().toISOString())
            console.log('=== WebSocket连接关闭调试信息结束 ===')
            
            wsConnected.value = false
            
            // 非正常关闭时尝试重连
            if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
                console.log(`尝试重连聊天WebSocket (${reconnectAttempts.value + 1}/${maxReconnectAttempts})`)
                reconnectAttempts.value++
                reconnectTimer.value = setTimeout(() => {
                    connectWebSocket()
                }, 3000 * reconnectAttempts.value) // 递增延迟重连
            } else if (event.code === 1000) {
                console.log('WebSocket正常关闭，不进行重连')
            } else {
                console.log('已达到最大重连次数，停止重连')
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
            // 转换消息数据格式并按时间正序排列（最早的消息在前）
            const convertedMessages = messages.map(msg => ({
                id: msg.messageId,
                content: msg.message,
                time: formatMessageTime(msg.sentAt),
                isMine: msg.senderId === currentUserId.value,
                sentAt: msg.sentAt,
                status: msg.status,
                type: msg.type
            }))
            
            // 按时间正序排列（最早的消息在前）
            convertedMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
            
            return convertedMessages
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
            // 转换会话数据格式，使用接口返回的新字段
            conversations.value = conversationList.map(conv => ({
                id: conv.id,
                name: conv.chatUserVO.name || '未知用户',
                avatar: conv.chatUserVO.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
                lastMessage: conv.latestMessage || '', // 使用接口返回的latestMessage字段
                lastTime: formatMessageTime(conv.updatedAt),
                unreadCount: conv.unreadMessageCount || 0, // 使用接口返回的unreadMessageCount字段
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
    console.log('=== WebSocket发送消息调试信息 ===')
    console.log('WebSocket连接状态:', wsConnected.value)
    console.log('WebSocket对象:', ws.value)
    console.log('WebSocket readyState:', ws.value?.readyState)
    console.log('发送者ID:', currentUserId.value)
    console.log('接收者ID:', receiverId)
    console.log('消息内容:', content)
    console.log('=== WebSocket发送消息调试信息结束 ===')
    
    if (!wsConnected.value) {
        console.error('WebSocket连接已断开，无法发送消息')
        ElMessage.error('WebSocket连接已断开，无法发送消息')
        return false
    }
    
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
        console.error('WebSocket连接未就绪，无法发送消息')
        ElMessage.error('WebSocket连接未就绪，无法发送消息')
        return false
    }
    
    const messageData = {
        sid: currentUserId.value,
        rid: receiverId,
        content: content
    }
    
    console.log('准备发送的消息数据:', messageData)
    console.log('消息数据JSON:', JSON.stringify(messageData))
    
    try {
        ws.value.send(JSON.stringify(messageData))
        console.log('消息已通过WebSocket发送成功')
        return true
    } catch (error) {
        console.error('发送消息失败:', error)
        console.error('错误详情:', error.message)
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

const selectFriend = async (friend) => {
    // 检查是否已有与该好友的对话
    const existingConversation = conversations.value.find(conv => conv.chatUserVO.userId === friend.id)
    
    if (existingConversation) {
        // 如果已有对话，跳转到该对话
        selectConversation(existingConversation)
        ElMessage.success(`已跳转到与 ${friend.name} 的对话`)
    } else {
        // 如果没有对话，调用接口创建新对话
        try {
            console.log('开始创建与用户的新会话:', friend.id)
            const newConversationData = await createConversation(friend.id)
            
            if (newConversationData) {
                // 转换新会话数据格式
                const newConversation = {
                    id: newConversationData.id,
                    name: newConversationData.chatUserVO.name || friend.name,
                    avatar: newConversationData.chatUserVO.avatar || friend.avatar,
                    lastMessage: newConversationData.latestMessage || '', // 使用接口返回的latestMessage字段
                    lastTime: formatMessageTime(newConversationData.createdAt),
                    unreadCount: newConversationData.unreadMessageCount || 0, // 使用接口返回的unreadMessageCount字段
                    messages: [],
                    chatUserVO: newConversationData.chatUserVO,
                    initiatorId: newConversationData.initiatorId,
                    status: newConversationData.status,
                    createdAt: newConversationData.createdAt,
                    updatedAt: newConversationData.updatedAt
                }
                
                // 将会话添加到列表开头
                conversations.value.unshift(newConversation)
                
                // 选择新创建的会话
                selectConversation(newConversation)
                ElMessage.success(`已创建与 ${friend.name} 的新对话`)
            } else {
                ElMessage.error('创建会话失败')
                return
            }
        } catch (error) {
            console.error('创建会话失败:', error)
            ElMessage.error('创建会话失败，请重试')
            return
        }
    }
    
    // 返回聊天界面
    currentView.value = 'chat'
}

const selectConversation = async (conversation) => {
    currentConversation.value = conversation
    
    // 初始化状态记录
    previousConversationStatus.value = conversation.status
    showStatusChangeTip.value = false
    
    // 获取该会话的聊天记录
    if (conversation.id) {
        const messages = await fetchChatMessages(conversation.id)
        conversation.messages = messages
        
        // 更新最后消息和时间（如果有消息的话）
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            conversation.lastMessage = lastMessage.content
            conversation.lastTime = formatMessageTime(lastMessage.sentAt)
            
            // 标记所有消息为已读
            const messageIds = messages.map(msg => msg.id).filter(id => typeof id === 'number')
            if (messageIds.length > 0) {
                console.log('标记会话消息为已读，消息ID:', messageIds)
                const markSuccess = await markAsRead({ messageIds })
                if (markSuccess) {
                    console.log('成功标记消息为已读')
                    // 重新获取会话列表以更新未读计数
                    await fetchConversations()
                    // 更新当前会话的未读计数
                    const refreshedConversation = conversations.value.find(conv => conv.id === conversation.id)
                    if (refreshedConversation) {
                        conversation.unreadCount = refreshedConversation.unreadCount
                    }
                } else {
                    console.log('标记消息为已读失败')
                }
            }
        }
    }
    
    console.log('选择会话:', conversation.name)
    
    // 滚动到底部
    nextTick(() => {
        scrollToBottom()
    })
}

const sendMessage = async () => {
    if (!messageInput.value.trim() || !currentConversation.value) return
    
    // 检查会话状态，如果是pending状态且当前用户是发起者则不允许发送
    if (currentConversation.value.status === 'pending' && currentConversation.value.initiatorId === currentUserId.value) {
        ElMessage.warning('待对方回复后即可畅聊')
        return
    }

    const content = messageInput.value.trim()
    const receiverId = currentConversation.value.chatUserVO.userId

    // 清空输入框
    messageInput.value = ''

    // 通过WebSocket发送消息，等待后端返回消息后再显示
    const sendSuccess = sendMessageViaWebSocket(receiverId, content)
    
    if (!sendSuccess) {
        ElMessage.error('发送失败，请重试')
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

// 处理接收到的聊天消息
const handleIncomingChatMessage = async (messageData) => {
    console.log('=== 处理接收到的聊天消息 ===')
    console.log('消息数据:', messageData)
    
    // 检查是否是聊天消息（支持两种格式）
    const isOldFormat = messageData.sid && messageData.rid && messageData.content
    const isNewFormat = messageData.message && messageData.messageId && messageData.type === 'chat_message'
    
    if (isOldFormat || isNewFormat) {
        // 根据消息格式提取字段
        const senderId = Number(isOldFormat ? messageData.sid : messageData.senderId)
        const receiverId = Number(isOldFormat ? messageData.rid : messageData.receiverId)
        const content = isOldFormat ? messageData.content : messageData.message
        const messageId = isOldFormat ? (messageData.messageId || `temp_${Date.now()}_${Math.random()}`) : messageData.messageId
        const sentAt = isOldFormat ? (messageData.sentAt || Date.now()) : messageData.sentAt
        const avatar = isNewFormat ? messageData.avatar : null
        
        const currentUserIdNum = Number(currentUserId.value)
        
        console.log('发送者ID:', senderId, '接收者ID:', receiverId, '当前用户ID:', currentUserIdNum)
        console.log('消息内容:', content, '消息ID:', messageId)
        
        // 检查消息是否与当前会话相关
        if (currentConversation.value && 
            ((senderId === currentUserIdNum && receiverId === currentConversation.value.chatUserVO.userId) ||
             (receiverId === currentUserIdNum && senderId === currentConversation.value.chatUserVO.userId))) {
            
            console.log('消息与当前会话相关，添加到消息列表')
            
            // 创建新消息对象
            const newMessage = {
                id: messageId,
                content: content,
                time: formatMessageTime(sentAt),
                isMine: senderId === currentUserIdNum,
                sentAt: sentAt,
                status: 'sent',
                type: 'chat',
                senderId: senderId,
                receiverId: receiverId,
                read: false,
                avatar: avatar // 新格式包含头像信息
            }
            
            console.log('创建的新消息对象:', newMessage)
            
            // 检查消息是否已存在（避免重复添加）
            const existingMessage = currentConversation.value.messages.find(m => m.id === newMessage.id)
            if (existingMessage) {
                console.log('消息已存在，跳过添加:', newMessage.id)
                return
            }
            
            // 使用Vue的响应式更新方式添加消息
            currentConversation.value.messages = [...currentConversation.value.messages, newMessage]
            
            // 更新最后消息和时间
            currentConversation.value.lastMessage = newMessage.content
            currentConversation.value.lastTime = formatMessageTime(newMessage.sentAt)
            
            // 强制触发Vue的响应式更新
            await nextTick()
            
            // 滚动到底部
            scrollToBottom()
            
            // 如果是收到对方的消息，重新获取会话列表以更新状态
            if (!newMessage.isMine) {
                await fetchConversations()
                
                // 更新当前会话的状态
                const updatedConversation = conversations.value.find(conv => conv.id === currentConversation.value.id)
                if (updatedConversation) {
                    // 检查状态变化
                    checkStatusChange(updatedConversation.status)
                    
                    const currentMessages = currentConversation.value.messages
                    Object.assign(currentConversation.value, updatedConversation)
                    currentConversation.value.messages = currentMessages
                    console.log('收到对方消息，更新会话状态:', currentConversation.value.status)
                    
                    // 标记新收到的消息为已读
                    if (typeof newMessage.id === 'number') {
                        console.log('标记新消息为已读，消息ID:', newMessage.id)
                        const markSuccess = await markAsRead({ messageIds: [newMessage.id] })
                        if (markSuccess) {
                            console.log('成功标记新消息为已读')
                            // 重新获取会话列表以更新未读计数
                            await fetchConversations()
                            // 更新当前会话的未读计数
                            const refreshedConversation = conversations.value.find(conv => conv.id === currentConversation.value.id)
                            if (refreshedConversation) {
                                currentConversation.value.unreadCount = refreshedConversation.unreadCount
                            }
                        } else {
                            console.log('标记新消息为已读失败')
                        }
                    }
                }
            }
            
            console.log('新消息已添加到当前会话，当前消息数量:', currentConversation.value.messages.length)
        } else {
            // 消息与当前会话无关，但可能是其他会话的消息
            console.log('消息与当前会话无关，检查是否更新其他会话')
            updateOtherConversationMessage(senderId, receiverId, messageData, content, sentAt)
        }
    } else {
        console.log('不是聊天消息格式，跳过处理')
    }
}

// 更新其他会话的消息
const updateOtherConversationMessage = (senderId, receiverId, messageData, content, sentAt) => {
    const currentUserIdNum = Number(currentUserId.value)
    
    // 找到对应的会话
    const targetConversation = conversations.value.find(conv => {
        const convUserId = Number(conv.chatUserVO.userId)
        return ((senderId === currentUserIdNum && receiverId === convUserId) ||
                (receiverId === currentUserIdNum && senderId === convUserId))
    })
    
    if (targetConversation) {
        console.log('找到对应会话，更新最后消息:', targetConversation.name)
        
        // 根据消息格式提取字段
        const isOldFormat = messageData.sid && messageData.rid && messageData.content
        const messageId = isOldFormat ? (messageData.messageId || `temp_${Date.now()}_${Math.random()}`) : messageData.messageId
        const avatar = !isOldFormat ? messageData.avatar : null
        
        // 创建新消息对象
        const newMessage = {
            id: messageId,
            content: content,
            time: formatMessageTime(sentAt || Date.now()),
            isMine: senderId === currentUserIdNum,
            sentAt: sentAt || new Date().toISOString(),
            status: 'sent',
            type: 'chat',
            senderId: senderId,
            receiverId: receiverId,
            read: false,
            avatar: avatar
        }
        
        // 检查消息是否已存在
        const existingMessage = targetConversation.messages.find(m => m.id === newMessage.id)
        if (!existingMessage) {
            // 使用Vue的响应式更新方式添加消息
            targetConversation.messages = [...targetConversation.messages, newMessage]
        }
        
        // 更新最后消息和时间
        targetConversation.lastMessage = content
        targetConversation.lastTime = formatMessageTime(sentAt || Date.now())
        
        // 强制触发Vue的响应式更新
        conversations.value = [...conversations.value]
    }
}

// 计算总未读消息数量
const totalUnreadCount = computed(() => {
    return conversations.value.reduce((total, conv) => {
        return total + (conv.unreadCount || 0)
    }, 0)
})

// 监听总未读数量变化，通知父组件
watch(totalUnreadCount, (newCount) => {
    emit('unread-count-update', newCount)
}, { immediate: true })

// 生命周期
onMounted(async () => {
    console.log('聊天页面组件挂载')
    
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
    
    // 检查WebSocket连接状态
    console.log('=== WebSocket连接状态检查 ===')
    console.log('当前用户ID:', currentUserId.value)
    console.log('WebSocket连接状态:', wsConnected.value)
    console.log('WebSocket对象:', ws.value)
    console.log('WebSocket readyState:', ws.value?.readyState)
    console.log('=== WebSocket连接状态检查结束 ===')
    
    // 如果用户已登录，获取会话列表
    if (currentUserId.value) {
        console.log('用户已登录，获取会话列表')
        await fetchConversations()
        
        // 默认选择第一个对话
        if (conversations.value.length > 0) {
            selectConversation(conversations.value[0])
        }
    }
    
    // WebSocket连接由watch监听用户ID变化自动处理
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
watch(currentUserId, async (newUserId, oldUserId) => {
    console.log('聊天页面用户ID变化:', { oldUserId, newUserId })
    
    if (newUserId && newUserId !== null) {
        // 用户已登录
        if (oldUserId && oldUserId !== newUserId) {
            // 用户切换，重新获取会话列表
            console.log('用户切换，重新获取会话列表')
            await fetchConversations()
        } else if (!oldUserId) {
            // 首次登录，获取会话列表
            console.log('首次登录，获取会话列表')
            await fetchConversations()
        }
        
        if (!wsConnected.value) {
            // 建立WebSocket连接
            console.log('用户已登录，建立聊天WebSocket连接')
            connectWebSocket()
        } else {
            console.log('WebSocket已连接，无需重新连接')
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

// 处理发送成功确认
const handleSendSuccess = async () => {
    console.log('处理发送成功确认')
    
    // 重新获取会话列表
    await fetchConversations()
    
    // 更新当前会话的状态（如果会话列表中有对应的会话）
    if (currentConversation.value) {
        const updatedConversation = conversations.value.find(conv => conv.id === currentConversation.value.id)
        if (updatedConversation) {
            // 检查状态变化
            checkStatusChange(updatedConversation.status)
            
            // 保持当前会话的消息列表，但更新其他属性
            const currentMessages = currentConversation.value.messages
            Object.assign(currentConversation.value, updatedConversation)
            currentConversation.value.messages = currentMessages
            console.log('更新当前会话状态:', currentConversation.value.status)
        }
    }
    
    console.log('发送成功处理完成')
}

// 检查会话状态变化并显示提示
const checkStatusChange = (newStatus) => {
    if (previousConversationStatus.value === 'pending' && newStatus === 'active') {
        console.log('会话状态从pending变为active，显示提示')
        showStatusChangeTip.value = true
        
        // 3秒后自动隐藏提示
        setTimeout(() => {
            showStatusChangeTip.value = false
        }, 3000)
    }
    
    // 更新之前的状态
    previousConversationStatus.value = newStatus
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
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    font-weight: normal;
}

.status-badge.pending {
    background-color: #fdf6ec;
    color: #e6a23c;
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

.input-container .el-textarea.is-disabled .el-textarea__inner {
    background-color: #f5f7fa;
    color: #909399;
    cursor: not-allowed;
}

.input-container .el-textarea.is-disabled .el-textarea__inner::placeholder {
    color: #c0c4cc;
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

.status-change-tip {
    display: flex;
    justify-content: center;
    margin: 16px 0;
    animation: fadeInUp 0.3s ease;
}

.tip-content {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f0f9ff;
    color: #409eff;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    border: 1px solid #b3d8ff;
}

.tip-icon {
    font-size: 14px;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style> 