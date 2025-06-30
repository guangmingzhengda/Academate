<template>
    <div 
        v-if="visible"
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
                            <img :src="conversation.avatar" :alt="conversation.name" @error="handleAvatarError" />
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
                            <img :src="friend.avatar" :alt="friend.name" @error="handleAvatarError" />
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
                        <!-- 加载动画 -->
                        <div v-if="isLoadingMessages" class="loading-container">
                            <div class="loading-spinner">
                                <el-icon class="loading-icon"><Loading /></el-icon>
                                <span class="loading-text">加载聊天记录中...</span>
                            </div>
                        </div>
                        
                        <!-- 消息列表 -->
                        <div v-else>
                            <div 
                                v-for="message in currentConversation.messages" 
                                :key="message.id"
                                class="message-item"
                                :class="{ 'message-mine': message.isMine }"
                            >
                                <!-- 对方的消息：头像在左，内容在右 -->
                                <template v-if="!message.isMine">
                                    <div class="message-avatar">
                                        <img 
                                            :src="message.avatar || currentConversation.avatar" 
                                            :alt="currentConversation.name"
                                            @error="handleAvatarError"
                                        />
                                    </div>
                                    <div class="message-content">
                                        <div class="message-bubble">
                                            {{ message.content }}
                                            <div v-if="message.status === 'failed'" style="font-size: 10px; color: #f56c6c;">发送失败</div>
                                        </div>
                                        <div class="message-time">{{ message.time }}</div>
                                    </div>
                                </template>
                                
                                <!-- 自己的消息：内容在左，头像在右 -->
                                <template v-else>
                                    <div class="message-content">
                                        <div class="message-bubble">
                                            {{ message.content }}
                                            <div v-if="message.status === 'failed'" style="font-size: 10px; color: #f56c6c;">发送失败</div>
                                        </div>
                                        <div class="message-time">{{ message.time }}</div>
                                    </div>
                                    <div class="message-avatar">
                                        <img 
                                            :src="myAvatar" 
                                            :alt="'我'"
                                            @error="handleAvatarError"
                                        />
                                    </div>
                                </template>
                            </div>
                            
                            <!-- 状态变化提示 -->
                            <div v-if="showStatusChangeTip" class="status-change-tip">
                                <div class="tip-content">
                                    <el-icon class="tip-icon"><ChatDotRound /></el-icon>
                                    <span>现在你们可以畅聊了</span>
                                </div>
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
    User,
    Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import store from '@/store'
import { listConversations } from '@/api/chat'
import { listChatMessages, createConversation, sendChatMessage } from '@/api/chat'
import { getFollowedUsers } from '@/api/follow'
import { markAsRead } from '@/api/msg'
import websocketManager from '@/utils/websocketManager'

// 定义props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

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
const isLoadingMessages = ref(false) // 消息加载状态

// WebSocket连接状态（从全局管理器获取）
const wsConnected = computed(() => websocketManager.isConnected())

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

// 获取当前用户头像
const myAvatar = computed(() => {
    const storeData = store.getters.getData
    if (storeData && storeData.avatar) {
        return storeData.avatar
    }
    return 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
})

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

// 获取聊天记录
const fetchChatMessages = async (conversationId) => {
    try {
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
                type: msg.type,
                read: msg.status === 'read' || msg.status === 'processed' // 根据status字段判断是否已读
            }))
            
            // 按时间正序排列（最早的消息在前）
            convertedMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
            
            return convertedMessages
        } else {
            return []
        }
    } catch (error) {
        console.error('获取聊天记录错误:', error)
        return []
    }
}

// 处理接收到的聊天消息
const handleIncomingChatMessage = async (messageData) => {
    // - 收到消息后，先判断type字段是否为"chat_message"，如果是的话进行下一步，不是则结束方法
    if (messageData.type !== 'chat_message') {
        return
    }
    console.log('🔍===jinru')
    // -- 判断当前是否开启聊天区，如果开启
    if (props.visible && currentConversation.value) {
        console.log('🔍 ChatWindow: 当前会话状态检查', {
            chatWindowVisible: props.visible,
            currentConversationId: currentConversation.value?.id,
            currentConversationName: currentConversation.value?.name,
            currentConversationUserId: currentConversation.value?.chatUserVO?.userId,
            currentUserId: currentUserId.value,
            messageData: {
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                messageId: messageData.messageId
            }
        })
        
        // --- 提取字段，并检查是否与当前会话相关，如果相关则创建新消息对象并渲染，并设置为已读
        const senderId = Number(messageData.senderId)
        const receiverId = Number(messageData.receiverId)
        const content = messageData.message
        const messageId = messageData.messageId
        const sentAt = messageData.sentAt
        const avatar = messageData.avatar
        const currentUserIdNum = Number(currentUserId.value)
        
        // 检查消息是否与当前会话相关
        const isRelatedToCurrentConversation = 
            (senderId === currentUserIdNum && receiverId === currentConversation.value.chatUserVO.userId) ||
            (receiverId === currentUserIdNum && senderId === currentConversation.value.chatUserVO.userId)
        
        console.log('🔍 ChatWindow: 消息相关性判断', {
            senderId,
            receiverId,
            currentUserIdNum,
            currentConversationUserId: currentConversation.value.chatUserVO.userId,
            condition1: senderId === currentUserIdNum && receiverId === currentConversation.value.chatUserVO.userId,
            condition2: receiverId === currentUserIdNum && senderId === currentConversation.value.chatUserVO.userId,
            isRelatedToCurrentConversation
        })
        
        if (isRelatedToCurrentConversation) {
            // 创建新消息对象
            const newMessage = {
                id: messageId,
                content: content,
                senderId: senderId,
                receiverId: receiverId,
                sentAt: sentAt,
                time: formatMessageTime(sentAt),
                avatar: avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
                isMine: senderId === currentUserIdNum,
                read: false
            }
            
            // 添加到当前会话的消息列表
            currentConversation.value.messages.push(newMessage)
            
            // 更新会话的最后消息
            currentConversation.value.lastMessage = content
            currentConversation.value.lastTime = formatMessageTime(sentAt)
            
            // 调用API标记为已读
            if (typeof messageId === 'number' && !newMessage.isMine) {
                console.log('🔍 ChatWindow: 开始标记单条消息为已读——处理当前会话时（对方发送）', {
                    messageId,
                    senderId,
                    receiverId,
                    content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    currentConversationId: currentConversation.value?.id,
                    currentConversationName: currentConversation.value?.name,
                    isMine: newMessage.isMine
                })
                
                try {
                    const markSuccess = await markAsRead({ messageIds: [messageId] })
                    console.log('✅ ChatWindow: 标记单条消息为已读结果', {
                        messageId,
                        success: markSuccess,
                        timestamp: new Date().toISOString()
                    })
                    
                    if (markSuccess) {
                        console.log('🔄 ChatWindow: 标记成功，开始重新获取会话列表')
                        // 标记已读成功后，重新获取会话列表（会自动发送未读数量更新）
                        await fetchConversations()
                        console.log('✅ ChatWindow: 会话列表重新获取完成')
                    } else {
                        console.error('❌ ChatWindow: 标记单条消息为已读失败', {
                            messageId,
                            timestamp: new Date().toISOString()
                        })
                    }
                } catch (error) {
                    console.error('💥 ChatWindow: 标记单条消息为已读时出错', {
                        messageId,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    })
                }
            } else if (typeof messageId === 'number' && newMessage.isMine) {
                console.log('ℹ️ ChatWindow: 跳过标记已读，这是自己发送的消息', {
                    messageId,
                    isMine: newMessage.isMine
                })
            } else {
                console.log('⚠️ ChatWindow: 跳过标记已读，消息ID不是数字类型', {
                    messageId,
                    messageIdType: typeof messageId
                })
            }
            
            // 滚动到底部
            nextTick(() => {
                scrollToBottom()
            })
        } else {
            // 消息与当前会话无关，只更新会话列表以显示新消息
            try {
                console.log('🔍 ChatWindow: 消息与当前会话无关，更新会话列表以显示新消息')
                await fetchConversations()
                console.log('✅ ChatWindow: 消息与当前会话无关，会话列表已更新')
            } catch (error) {
                console.error('❌ ChatWindow: 更新会话列表信息失败:', error)
            }
        }
        
        // --- 调用获取会话列表接口，渲染会话列表（无论消息是否相关都要更新）
        try {
            console.log('🔄 ChatWindow: 开始重新获取会话列表')
            await fetchConversations()
            
            // 如果当前有选中的会话，更新其引用（保持消息列表不变）
            if (currentConversation.value) {
                console.log('🔍 ChatWindow: 开始更新当前会话引用', {
                    currentConversationId: currentConversation.value.id,
                    currentConversationName: currentConversation.value.name,
                    currentMessagesCount: currentConversation.value.messages.length
                })
                
                const updatedConversation = conversations.value.find(conv => conv.id === currentConversation.value.id)
                if (updatedConversation) {
                    console.log('✅ ChatWindow: 找到更新的会话', {
                        updatedConversationId: updatedConversation.id,
                        updatedConversationName: updatedConversation.name,
                        updatedUnreadCount: updatedConversation.unreadCount
                    })
                    
                    // 只更新会话的基本信息，保留当前的消息列表
                    const currentMessages = currentConversation.value.messages
                    currentConversation.value = {
                        ...updatedConversation,
                        messages: currentMessages // 保持当前的消息列表不变
                    }
                    
                    console.log('✅ ChatWindow: 当前会话已更新', {
                        finalConversationId: currentConversation.value.id,
                        finalConversationName: currentConversation.value.name,
                        finalMessagesCount: currentConversation.value.messages.length,
                        finalUnreadCount: currentConversation.value.unreadCount
                    })
                    
                    // 同时更新会话列表中的对应会话
                    const conversationIndex = conversations.value.findIndex(conv => conv.id === currentConversation.value.id)
                    if (conversationIndex !== -1) {
                        conversations.value[conversationIndex] = { ...currentConversation.value }
                        console.log('✅ ChatWindow: 会话列表中的对应会话已更新', {
                            conversationIndex,
                            updatedInList: true
                        })
                    }
                } else {
                    console.warn('⚠️ ChatWindow: 未找到对应的更新会话', {
                        currentConversationId: currentConversation.value.id
                    })
                }
            } else {
                console.log('ℹ️ ChatWindow: 当前没有选中的会话，跳过更新')
            }
        } catch (error) {
            console.error('❌ ChatWindow: 更新会话列表信息失败:', error)
        }
    } else {
        // -- 如果聊天窗口未开启或没有选中会话，则调用会话列表接口，计算未读消息总和，发送到父组件
        try {
            await fetchConversations()
        } catch (error) {
            console.error('❌ ChatWindow: 聊天窗口关闭状态下获取会话列表失败:', error)
        }
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
    
    const success = websocketManager.sendMessage(messageData)
    if (success) {
        return true
    } else {
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
    // 清空当前会话
    currentConversation.value = null
    console.log('🔍 ChatWindow: 关闭聊天窗口，清空当前会话')
    
    // 触发关闭事件
    emit('close')
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
                
                // 发送更新后的总未读数量
                const currentUnreadCount = conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
                emit('unread-count-update', currentUnreadCount)
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
    console.log('🔍 ChatWindow: 开始选择会话', {
        conversationId: conversation.id,
        conversationName: conversation.name,
        conversationUserId: conversation.chatUserVO?.userId,
        currentUserId: currentUserId.value,
        previousConversationId: currentConversation.value?.id,
        previousConversationName: currentConversation.value?.name
    })
    
    currentConversation.value = conversation
    
    console.log('✅ ChatWindow: 当前会话已设置', {
        newConversationId: currentConversation.value.id,
        newConversationName: currentConversation.value.name,
        newConversationUserId: currentConversation.value.chatUserVO?.userId
    })
    
    // 初始化状态记录
    previousConversationStatus.value = conversation.status
    showStatusChangeTip.value = false
    
    // 获取该会话的聊天记录
    if (conversation.id) {
        // 显示加载动画
        isLoadingMessages.value = true
        
        try {
            const messages = await fetchChatMessages(conversation.id)
            conversation.messages = messages
            
            // 更新最后消息和时间（如果有消息的话）
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1]
                conversation.lastMessage = lastMessage.content
                conversation.lastTime = formatMessageTime(lastMessage.sentAt)
                
                // 检查是否有未读消息需要标记为已读
                const unreadMessages = messages.filter(msg => !msg.read && typeof msg.id === 'number' && !msg.isMine)
                if (unreadMessages.length > 0) {
                    const messageIds = unreadMessages.map(msg => msg.id)
                    console.log('🔍 ChatWindow: 开始批量标记消息为已读——打开会话时（对方发送）', {
                        conversationId: conversation.id,
                        conversationName: conversation.name,
                        messageIds,
                        unreadCount: unreadMessages.length,
                        messages: unreadMessages.map(msg => ({
                            id: msg.id,
                            content: msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : ''),
                            isMine: msg.isMine
                        }))
                    })
                    
                    const markSuccess = await markAsRead({ messageIds })
                    console.log('✅ ChatWindow: 批量标记消息为已读结果', {
                        conversationId: conversation.id,
                        messageIds,
                        success: markSuccess,
                        timestamp: new Date().toISOString()
                    })
                    
                    if (markSuccess) {
                        console.log('🔄 ChatWindow: 批量标记成功，开始重新获取会话列表')
                        // 重新获取会话列表以更新未读计数（会自动发送未读数量更新）
                        await fetchConversations()
                        console.log('✅ ChatWindow: 会话列表重新获取完成')
                        
                        // 更新当前会话的未读计数
                        const refreshedConversation = conversations.value.find(conv => conv.id === conversation.id)
                        if (refreshedConversation) {
                            conversation.unreadCount = refreshedConversation.unreadCount
                            console.log('📊 ChatWindow: 更新当前会话未读计数', {
                                conversationId: conversation.id,
                                oldUnreadCount: unreadMessages.length,
                                newUnreadCount: conversation.unreadCount
                            })
                        }
                    } else {
                        console.error('❌ ChatWindow: 批量标记消息为已读失败', {
                            conversationId: conversation.id,
                            messageIds,
                            timestamp: new Date().toISOString()
                        })
                    }
                } else {
                    console.log('ℹ️ ChatWindow: 会话内没有对方发送的未读消息，无需标记', {
                        conversationId: conversation.id,
                        conversationName: conversation.name,
                        totalMessages: messages.length,
                        totalUnreadMessages: messages.filter(msg => !msg.read && typeof msg.id === 'number').length,
                        unreadMessagesFromOthers: messages.filter(msg => !msg.read && typeof msg.id === 'number' && !msg.isMine).length
                    })
                }
            }
        } catch (error) {
            console.error('获取聊天记录失败:', error)
            ElMessage.error('获取聊天记录失败')
        } finally {
            // 隐藏加载动画
            isLoadingMessages.value = false
        }
    }
    
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
        const userId = currentUserId.value
        if (!userId) {
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
        } else {
            friends.value = []
        }
    } catch (error) {
        console.error('获取关注用户列表错误:', error)
        friends.value = []
    }
}

// 获取所有会话列表
const fetchConversations = async () => {
    try {
        const conversationList = await listConversations()
        
        console.log('🔍 fetchConversations: 原始会话列表数据', conversationList)
        
        if (conversationList && conversationList.length > 0) {
            // 转换会话数据格式，使用接口返回的新字段
            const convertedConversations = conversationList.map(conv => ({
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
            
            console.log('🔍 fetchConversations: 转换后的会话数据', convertedConversations.map(conv => ({
                id: conv.id,
                name: conv.name,
                unreadCount: conv.unreadCount
            })))
            
            conversations.value = convertedConversations
            
            // 直接计算总未读数量，不依赖computed属性
            const calculatedUnreadCount = convertedConversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
            
            console.log('🔍 fetchConversations: 直接计算总未读数量', {
                conversationsLength: convertedConversations.length,
                conversationsUnreadCounts: convertedConversations.map(conv => conv.unreadCount),
                calculatedUnreadCount: calculatedUnreadCount
            })
            
            emit('unread-count-update', calculatedUnreadCount)
            console.log('已成功向父组件发送',calculatedUnreadCount)
        } else {
            conversations.value = []
            emit('unread-count-update', 0)
        }
        
    } catch (error) {
        console.error('❌ 获取会话列表错误:', error)
        conversations.value = []
        // 出错时也发送未读数量更新（应该为0）
        emit('unread-count-update', 0)
    }
}

// 监听visible属性变化，确保聊天窗口隐藏时清空当前会话
watch(() => props.visible, (newVisible, oldVisible) => {
    if (!newVisible && oldVisible) {
        // 聊天窗口从显示变为隐藏时，清空当前会话
        currentConversation.value = null
        console.log('🔍 ChatWindow: 聊天窗口隐藏，清空当前会话')
    }
})

// 生命周期
onMounted(async () => {
    console.log('ChatWindow组件挂载')
    
    // 监听聊天消息事件
    window.addEventListener('chatMessageReceived', (event) => {
        handleIncomingChatMessage(event.detail)
    })
    
    // 监听WebSocket连接状态变化事件
    window.addEventListener('websocketConnectionChanged', (event) => {
        // 强制更新连接状态
        // 由于wsConnected是computed，它会自动重新计算
    })
    
    // 监听头像更新事件
    window.addEventListener('avatarUpdated', handleAvatarUpdate)
    
    // 监听从profile页面传来的会话跳转请求
    window.addEventListener('openChatWithConversation', (event) => {
        handleOpenChatWithConversation(event.detail)
    })
    
    // 监听打开聊天窗口事件
    window.addEventListener('openChatWindow', () => {
        // 这个事件由App.vue处理，这里不需要做任何操作
    })
    
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
    
    // 如果用户已登录，获取会话列表
    if (currentUserId.value) {
        await fetchConversations()
        
        // 默认选择第一个对话
        if (conversations.value.length > 0) {
            // 确保加载状态正确
            isLoadingMessages.value = false
            selectConversation(conversations.value[0])
        }
    }
    
    // 组件挂载时发送初始未读数量更新
    const initialUnreadCount = conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
    emit('unread-count-update', initialUnreadCount)
})

onUnmounted(() => {
    console.log('ChatWindow组件卸载')
    
    // 清理事件监听
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    
    // 移除聊天消息事件监听
    window.removeEventListener('chatMessageReceived', handleIncomingChatMessage)
    
    // 移除WebSocket连接状态变化事件监听
    window.removeEventListener('websocketConnectionChanged', () => {})
    
    // 移除头像更新事件监听
    window.removeEventListener('avatarUpdated', handleAvatarUpdate)
    
    // 移除profile页面相关事件监听
    window.removeEventListener('openChatWithConversation', handleOpenChatWithConversation)
    window.removeEventListener('openChatWindow', () => {})

    if (messagesContainer.value) {
        messagesContainer.value.removeEventListener('wheel', handleChatWheel)
    }

    if (chatContainer.value) {
        chatContainer.value.removeEventListener('wheel', handleChatWheel)
    }
})

// 监听用户ID变化，自动处理会话列表
watch(currentUserId, async (newUserId, oldUserId) => {
    if (newUserId && newUserId !== null) {
        // 用户已登录
        if (oldUserId && oldUserId !== newUserId) {
            // 用户切换，重新获取会话列表
            await fetchConversations()
        } else if (!oldUserId) {
            // 首次登录，获取会话列表
            await fetchConversations()
        }
    } else {
        // 用户退出登录，清空会话
        conversations.value = []
        currentConversation.value = null
        isLoadingMessages.value = false // 重置加载状态
        // 发送用户退出后的总未读数量（应该为0）
        emit('unread-count-update', 0)
    }
}, { immediate: true })

// 手动重连WebSocket
const reconnectWebSocket = () => {
    if (wsConnected.value) {
        ElMessage.info('WebSocket已连接')
        return
    }
    
    console.log('用户手动点击重连WebSocket')
    
    // 检查是否已经有连接，避免重复连接
    if (websocketManager.isConnected()) {
        ElMessage.info('WebSocket已连接')
        return
    }
    
    websocketManager.connect()
    ElMessage.info('正在重新连接...')
}

// 处理头像更新事件
const handleAvatarUpdate = () => {
    fetchConversations()
}

// 处理从profile页面传来的会话跳转请求
const handleOpenChatWithConversation = async (detail) => {
    const { conversationId } = detail
    
    try {
        // 确保会话列表已加载
        if (conversations.value.length === 0) {
            await fetchConversations()
        }
        
        // 查找指定的会话
        const targetConversation = conversations.value.find(conv => conv.id === conversationId)
        
        if (targetConversation) {
            // 选择该会话
            selectConversation(targetConversation)
            // 切换到聊天界面
            currentView.value = 'chat'
        } else {
            ElMessage.error('未找到指定的会话')
        }
    } catch (error) {
        console.error('处理会话跳转请求失败:', error)
        ElMessage.error('跳转到会话失败')
    }
}

// 处理头像加载错误
const handleAvatarError = (event) => {
    event.target.src = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
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
    margin: 12px 0;
    align-items: flex-start;
}

.message-item.message-mine {
    justify-content: flex-end;
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

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 200px;
}

.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.loading-icon {
    font-size: 32px;
    color: #409eff;
    animation: spin 1s linear infinite;
}

.loading-text {
    font-size: 14px;
    color: #909399;
    font-weight: 500;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style> 