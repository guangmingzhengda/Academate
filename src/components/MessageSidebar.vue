<template>
    <div class="sidebar-overlay" :class="{ 'show': visible }" @click="closeSidebar">
        <div class="sidebar" :class="{ 'open': visible }" @click.stop>
            <div class="sidebar-header">
                <div class="header-left">
                    <h3>消息中心</h3>
                    <div class="connection-status">
                        <span class="status-dot" :class="{'dot-connected': wsConnected, 'dot-disconnected': !wsConnected}"></span>
                    </div>
                </div>
                <button class="close-btn" @click="closeSidebar">
                    <el-icon><Close /></el-icon>
                </button>
            </div>
            
            <div class="sidebar-content">
                <div class="message-list">
                    <div 
                        v-for="message in messages" 
                        :key="message.id" 
                        class="message-item"
                        :class="{ 'unread': !message.read }"
                    >
                        <div class="message-avatar">
                            <img :src="message.avatar" :alt="message.sender" />
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="sender-name">{{ message.sender }}</span>
                            </div>
                            <div class="message-text">{{ message.content }}</div>
                            
                            <!-- 时间和操作按钮的底部区域 -->
                            <div class="message-bottom">
                                <div class="message-time">{{ formatTime(message.time) }}</div>
                                
                                <!-- 项目邀请操作按钮/状态 -->
                                <div v-if="message.type === 'project_invite'">
                                    <div v-if="message.status === null" class="message-actions">
                                        <el-button type="default" size="small" @click="handleProjectInvite(message.id, true)">
                                            同意
                                        </el-button>
                                        <el-button type="default" size="small" @click="handleProjectInvite(message.id, false)">
                                            拒绝
                                        </el-button>
                                    </div>
                                    <div v-else class="message-status" :class="message.status">
                                        {{ message.status === 'accepted' ? '已同意' : '已拒绝' }}
                                    </div>
                                </div>
                                
                                <!-- 项目申请操作按钮/状态 -->
                                <div v-if="message.type === 'project_apply'">
                                    <div v-if="message.status === null" class="message-actions">
                                        <el-button type="default" size="small" @click="handleProjectApply(message.id, true)">
                                            同意
                                        </el-button>
                                        <el-button type="default" size="small" @click="handleProjectApply(message.id, false)">
                                            拒绝
                                        </el-button>
                                    </div>
                                    <div v-else class="message-status" :class="message.status">
                                        {{ message.status === 'accepted' ? '已同意' : '已拒绝' }}
                                    </div>
                                </div>
                                
                                <!-- 数据请求操作按钮/状态 -->
                                <div v-if="message.type === 'data_request'">
                                    <div v-if="message.status === null" class="message-actions">
                                        <el-button type="default" size="small" @click="handleDataRequest(message.id, true)">
                                            同意
                                        </el-button>
                                        <el-button type="default" size="small" @click="handleDataRequest(message.id, false)">
                                            拒绝
                                        </el-button>
                                    </div>
                                    <div v-else class="message-status" :class="message.status">
                                        {{ message.status === 'accepted' ? '已同意' : '已拒绝' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="!message.read" class="unread-dot"></div>
                    </div>
                </div>
                
                <div v-if="messages.length === 0" class="no-messages">
                    暂无消息
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { agree_project_invite } from '@/api/project'
import { callSuccess, callError } from '@/call'
import store from '@/store'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close', 'unread-count-update'])

// WebSocket相关状态
const ws = ref(null)
const wsConnected = ref(false)
const reconnectTimer = ref(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5

// 消息数据改为响应式数组，初始为空
const messages = ref([])

const closeSidebar = () => {
    emit('close')
}

const formatTime = (time) => {
    // 如果传入的是字符串，转换为Date对象
    const messageTime = typeof time === 'string' ? new Date(time) : time
    const now = new Date()
    const diff = now - messageTime
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes <= 0) {
        return '刚刚'
    } else if (minutes < 60) {
        return `${minutes}分钟前`
    } else if (hours < 24) {
        return `${hours}小时前`
    } else {
        return `${days}天前`
    }
}

// WebSocket连接函数
const connectWebSocket = () => {
    const userId = store.getters.getId
    if (!userId) {
        console.error('用户ID未找到，无法建立WebSocket连接')
        return
    }

    const wsUrl = `ws://123.56.50.152:8081/api/websocket/${userId}`
    console.log('正在连接WebSocket:', wsUrl)

    try {
        ws.value = new WebSocket(wsUrl)

        ws.value.onopen = () => {
            console.log('WebSocket连接成功')
            wsConnected.value = true
            reconnectAttempts.value = 0
        }

        ws.value.onmessage = (event) => {
            console.log('收到WebSocket消息:', event.data)
            
            try {
                const messageData = JSON.parse(event.data)
                console.log('解析后的消息数据:', messageData)
                
                // 处理接收到的消息
                handleIncomingMessage(messageData)
                
            } catch (error) {
                // console.log('解析WebSocket消息失败，不是JSON:', error)
                console.log('解析WebSocket消息失败，不是JSON: ', event.data)
            }
        }

        ws.value.onclose = (event) => {
            console.log('WebSocket连接关闭:', event.code, event.reason)
            wsConnected.value = false
            
            // 非正常关闭时尝试重连
            if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
                console.log(`尝试重连 (${reconnectAttempts.value + 1}/${maxReconnectAttempts})`)
                reconnectAttempts.value++
                reconnectTimer.value = setTimeout(() => {
                    connectWebSocket()
                }, 3000 * reconnectAttempts.value) // 递增延迟重连
            }
        }

        ws.value.onerror = (error) => {
            console.error('WebSocket连接错误:', error)
            wsConnected.value = false
        }

    } catch (error) {
        console.error('创建WebSocket连接失败:', error)
    }
}

// 处理接收到的消息
const handleIncomingMessage = (messageData) => {
    console.log('=== WebSocket消息调试信息 ===')
    console.log('消息类型:', typeof messageData)
    console.log('消息内容:', messageData)
    console.log('消息的所有属性:')
    for (let key in messageData) {
        console.log(`  ${key}:`, messageData[key], `(类型: ${typeof messageData[key]})`)
    }
    console.log('=== 消息调试信息结束 ===')
    
    // 根据WebSocket消息格式适配到显示格式
    if (messageData.message && messageData.messageId) {
        // 判断消息类型 - 如果包含"邀请"关键词，则认为是项目邀请
        let messageType = 'unknown'
        let senderName = '未知发送者'
        
        if (messageData.message.includes('邀请')) {
            messageType = 'project_invite'
            // 从消息内容中提取发送者信息
            const match = messageData.message.match(/用户(\w+)向您发送/)
            if (match) {
                senderName = `用户${match[1]}`
            }
        }
        
        // 创建适配的消息对象
        const newMessage = {
            id: messageData.messageId,
            type: messageType,
            sender: senderName,
            content: messageData.message,
            time: new Date(messageData.sentAt || Date.now()),
            avatar: require('@/asset/home/user.png'),
            read: false,
            projectId: messageData.projectId || null,
            status: null // 新消息默认未处理
        }
        
        console.log('创建的新消息对象:', newMessage)
        
        // 添加到消息列表开头（最新消息在上面）
        messages.value.unshift(newMessage)
        
        // 限制消息数量，避免内存占用过多
        if (messages.value.length > 100) {
            messages.value = messages.value.slice(0, 100)
        }
        
        console.log('当前消息列表长度:', messages.value.length)
    } else {
        console.log('消息格式不符合预期，跳过处理')
    }
}

// 断开WebSocket连接
const disconnectWebSocket = () => {
    if (reconnectTimer.value) {
        clearTimeout(reconnectTimer.value)
        reconnectTimer.value = null
    }
    
    if (ws.value) {
        console.log('断开WebSocket连接')
        ws.value.close(1000, '组件卸载')
        ws.value = null
    }
    wsConnected.value = false
}

// 处理项目邀请
const handleProjectInvite = async (messageId, accepted) => {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return
    
    if (accepted) {
        // 调用后端接口同意项目邀请
        try {
            const success = await agree_project_invite({
                projectId: message.projectId,
                messageId: messageId
            })
            
            if (success) {
                message.status = 'accepted'
                message.read = true
                callSuccess('已同意项目邀请')
            } else {
                // 接口调用失败的错误信息已在API中处理
                return
            }
        } catch (error) {
            callError('处理项目邀请时发生错误')
            return
        }
    } else {
        // 拒绝邀请，只更新本地状态（后端接口暂未实现）
        message.status = 'rejected'
        message.read = true
        callSuccess('已拒绝项目邀请')
    }
}

// 处理项目申请
const handleProjectApply = async (messageId, accepted) => {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return
    
    if (accepted) {
        // 调用后端接口同意项目申请
        try {
            const success = await agree_project_invite({
                projectId: message.projectId,
                messageId: messageId
            })
            
            if (success) {
                message.status = 'accepted'
                message.read = true
                callSuccess('已同意项目申请')
            } else {
                // 接口调用失败的错误信息已在API中处理
                return
            }
        } catch (error) {
            callError('处理项目申请时发生错误')
            return
        }
    } else {
        // 拒绝申请，只更新本地状态（后端接口暂未实现）
        message.status = 'rejected'
        message.read = true
        callSuccess('已拒绝项目申请')
    }
}

// 处理数据请求
const handleDataRequest = (messageId, accepted) => {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
        console.log(`数据请求 ${accepted ? '已同意' : '已拒绝'}:`, message.paperId)
        message.status = accepted ? 'accepted' : 'rejected'
        message.read = true
        // TODO: 发送请求到后端
    }
}

// 计算未读消息数量
const unreadCount = computed(() => {
    return messages.value.filter(message => !message.read).length
})

// 监听未读数量变化，通知父组件
watch(unreadCount, (newCount) => {
    emit('unread-count-update', newCount)
}, { immediate: true })

// 监听用户ID变化，自动连接/断开WebSocket
watch(() => store.getters.getId, (newUserId, oldUserId) => {
    console.log('用户ID变化:', { oldUserId, newUserId })
    
    if (newUserId && newUserId !== null && !wsConnected.value) {
        // 用户已登录且没有建立连接，重新连接
        console.log('用户已登录，建立WebSocket连接')
        connectWebSocket()
    } else if (!newUserId || newUserId === null) {
        // 用户退出登录，断开连接
        console.log('用户已退出，断开WebSocket连接')
        disconnectWebSocket()
    }
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
    console.log('MessageSidebar组件挂载')
    emit('unread-count-update', unreadCount.value)
    // WebSocket连接由watch监听用户ID变化自动处理
})

// 组件卸载时断开WebSocket连接
onUnmounted(() => {
    console.log('MessageSidebar组件卸载，断开WebSocket连接')
    disconnectWebSocket()
})
</script>

<style scoped>
.sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.sidebar-overlay.show {
    opacity: 1;
    visibility: visible;
}

.sidebar {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    background-color: white;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
}

.sidebar.open {
    right: 0;
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
    background-color: #f8f9fa;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.sidebar-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
}

.connection-status {
    display: flex;
    align-items: center;
}

.status-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.status-dot.dot-connected {
    background-color: #67c23a;
}

.status-dot.dot-disconnected {
    background-color: #f56c6c;
}

.close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
    padding: 5px;
    border-radius: 4px;
    transition: color 0.2s, background-color 0.2s;
}

.close-btn:hover {
    color: #333;
    background-color: #e9ecef;
}

.sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.message-list {
    display: flex;
    flex-direction: column;
}

.message-item {
    display: flex;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;
}

.message-item:hover {
    background-color: #f8f9fa;
}

.message-item.unread {
    background-color: #f0f8ff;
}

.message-avatar {
    flex-shrink: 0;
    margin-right: 12px;
}

.message-avatar img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.message-content {
    flex: 1;
    min-width: 0;
}

.message-header {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
}

.sender-name {
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.message-text {
    color: #666;
    font-size: 13px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-align: left;
    margin-bottom: 8px;
}

.message-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
}

.message-time {
    font-size: 13px;
    color: #999;
    text-align: left;
}

.message-actions {
    display: flex;
    gap: 8px;
}

.message-actions .el-button {
    padding: 4px 12px;
    font-size: 12px;
}

.message-status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 4px;
    text-align: center;
    min-width: 60px;
}

.message-status.accepted {
    color: #409eff;
    background-color: rgba(64, 158, 255, 0.1);
}

.message-status.rejected {
    color: #333;
    background-color: rgba(0, 0, 0, 0.1);
}

.unread-dot {
    position: absolute;
    top: 20px;
    right: 12px;
    width: 8px;
    height: 8px;
    background-color: #409eff;
    border-radius: 50%;
}

.no-messages {
    text-align: center;
    color: #999;
    padding: 40px 20px;
    font-size: 14px;
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
    width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.sidebar-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style> 