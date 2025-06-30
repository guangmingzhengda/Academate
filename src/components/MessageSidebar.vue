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
                <div class="header-right">
                    <el-button 
                        v-if="unreadNonProjectMessages.length > 0"
                        type="text" 
                        size="small" 
                        @click="handleMarkAllAsRead"
                        :loading="markingAllAsRead"
                        class="mark-all-read-btn"
                    >
                        全部已读
                    </el-button>
                    <button class="close-btn" @click="closeSidebar">
                        <el-icon><Close /></el-icon>
                    </button>
                </div>
            </div>
            
            <div class="sidebar-content">
                <div class="message-list">
                    <div 
                        v-for="message in filteredMessages" 
                        :key="message.id" 
                        class="message-item"
                        :class="{ 'unread': !message.read }"
                    >
                                        <div class="message-avatar" @click.stop="navigateToUserProfile(message.senderId)">
                    <img :src="message.avatar" :alt="message.sender" @error="handleAvatarError" />
                </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="sender-name" @click.stop="navigateToUserProfile(message.senderId)">{{ message.sender }}</span>
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
                                
                                <!-- 数据请求的同意/拒绝按钮/状态 -->
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
                                
                                <!-- 成果版权确认的同意/拒绝按钮/状态 -->
                                <div v-if="message.type === 'agree_url'">
                                    <div v-if="message.status === null" class="message-actions">
                                        <el-button type="default" size="small" @click="handleCopyrightConfirm(message.id, true)">
                                            同意
                                        </el-button>
                                        <el-button type="default" size="small" @click="handleCopyrightConfirm(message.id, false)">
                                            拒绝
                                        </el-button>
                                    </div>
                                    <div v-else class="message-status" :class="message.status">
                                        {{ message.status === 'accepted' ? '已同意' : '已拒绝' }}
                                    </div>
                                </div>
                                
                                <!-- 研究人员更新的入库/标记已读按钮 -->
                                <div v-if="message.type === 'researcher_update'">
                                    <div class="message-actions">
                                        <!-- 入库按钮/状态 -->
                                        <el-button 
                                            v-if="!message.isLibraryAdded" 
                                            type="primary" 
                                            size="small" 
                                            @click="handleResearcherUpdate(message.id, true)"
                                        >
                                            入库
                                        </el-button>
                                        <span v-else class="message-status accepted">已入库</span>
                                        
                                        <!-- 标记已读按钮/状态 -->
                                        <el-button 
                                            v-if="message.status !== 'processed'" 
                                            type="default" 
                                            size="small" 
                                            @click="handleResearcherUpdate(message.id, false)"
                                        >
                                            标记已读
                                        </el-button>
                                        <span v-else class="message-status processed">已阅</span>
                                    </div>
                                </div>
                                
                                <!-- 问题回复的标记已读按钮/状态 -->
                                <div v-if="message.type === 'question_reply'">
                                    <div v-if="message.status === 'pending'" class="message-actions">
                                        <el-button type="default" size="small" @click="handleMarkAsRead(message.id)">
                                            标记已读
                                        </el-button>
                                    </div>
                                    <div v-else-if="message.status === 'processed'" class="message-status processed">
                                        已阅
                                    </div>
                                </div>
                                
                                <!-- 其他类型消息的标记已读按钮/状态 -->
                                <div v-if="!['project_invite', 'project_apply', 'data_request', 'agree_url', 'researcher_update', 'question_reply'].includes(message.type)">
                                    <div v-if="!message.read" class="message-actions">
                                        <el-button type="default" size="small" @click="handleMarkAsRead(message.id)">
                                            标记已读
                                        </el-button>
                                    </div>
                                    <div v-else class="message-status processed">
                                        已阅
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="!message.read" class="unread-dot"></div>
                    </div>
                </div>
                
                <div v-if="filteredMessages.length === 0" class="no-messages">
                    暂无消息
                </div>
            </div>
        </div>
    </div>
    
    <!-- 文件上传对话框 -->
    <el-dialog
        v-model="uploadDialogVisible"
        title="上传全文资料"
        width="500px"
        :close-on-click-modal="false"
    >
        <div class="upload-content">
            <p>请上传PDF格式的全文资料：</p>
            <el-upload
                ref="uploadRef"
                class="upload-demo"
                drag
                :auto-upload="false"
                :limit="1"
                accept=".pdf"
                :on-change="handleFileChange"
                :file-list="fileList"
            >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                    将PDF文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                    <div class="el-upload__tip">
                        只能上传PDF文件，且不超过50MB
                    </div>
                </template>
            </el-upload>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="uploadDialogVisible = false">取消</el-button>
                <el-button 
                    type="primary" 
                    @click="handleUploadConfirm"
                    :loading="uploadLoading"
                    :disabled="!selectedFile"
                >
                    确认上传
                </el-button>
            </span>
        </template>
    </el-dialog>
    
    <!-- 收藏夹对话框 -->
    <el-dialog
        v-model="favoriteDialogVisible"
        title="选择收藏夹"
        width="800px"
        :close-on-click-modal="false"
    >
        <div class="favorite-dialog-content">
            <!-- 面包屑导航 -->
            <div class="breadcrumb-container">
                <div class="breadcrumb-title">文献库目录</div>
                <div class="breadcrumb-list">
                    <span 
                        v-for="(item, index) in breadcrumbList" 
                        :key="index"
                        class="breadcrumb-item"
                        :class="{ 'active': index === breadcrumbList.length - 1 }"
                        @click="navigateToBreadcrumb(index)"
                    >
                        {{ item.name }}
                        <span v-if="index < breadcrumbList.length - 1" class="breadcrumb-separator">/</span>
                    </span>
                </div>
                <el-button 
                    v-if="breadcrumbList.length > 1"
                    type="text" 
                    @click="backToParentFolder"
                    class="back-button"
                >
                    ← 返回上一级
                </el-button>
            </div>
            
            <!-- 新建收藏夹按钮 -->
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <el-tooltip :content="createFolderTooltip" placement="right">
                    <el-button type="primary" @click="showCreateFolderDialog = true">
                        新建收藏夹
                    </el-button>
                </el-tooltip>
            </div>
            
            <!-- 收藏夹列表 -->
            <div class="folders-container" v-loading="loadingFolders">
                <div v-if="!loadingFolders && folders.length === 0" class="empty-folders">
                    <el-empty description="当前目录下暂无收藏夹"></el-empty>
                </div>
                
                <div v-else class="folders-grid">
                    <div 
                        v-for="folder in folders" 
                        :key="folder.favoriteId"
                        class="folder-item"
                        :class="{ 'selected': selectedFolders.some(f => f.favoriteId === folder.favoriteId) }"
                        @click="toggleFolderSelection(folder)"
                    >
                        <div class="folder-icon">📁</div>
                        <div class="folder-name">{{ folder.name }}</div>
                        <div class="folder-actions">
                            <el-button
                                @click.stop="openFolder(folder)"
                                class="open-folder-btn"
                            >
                                打开
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 分页 -->
            <div class="pagination-container" v-if="total > folderPageSize">
                <el-pagination
                    v-model:current-page="folderCurrentPage"
                    :page-size="folderPageSize"
                    :total="total"
                    layout="prev, pager, next"
                    @current-change="handleFolderPageChange"
                />
            </div>
            
            <!-- 已选择的收藏夹 -->
            <div class="selected-folders" v-if="selectedFolders.length > 0">
                <div class="selected-title">已选择的收藏夹：</div>
                <div class="selected-list">
                    <el-tag 
                        v-for="folder in selectedFolders" 
                        :key="folder.favoriteId"
                        closable
                        @close="toggleFolderSelection(folder)"
                        class="selected-tag"
                    >
                        {{ folder.name }}
                    </el-tag>
                </div>
            </div>
        </div>
        
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="favoriteDialogVisible = false">取消</el-button>
                <el-button 
                    type="primary" 
                    @click="confirmFavorite"
                    :disabled="selectedFolders.length === 0"
                >
                    确认入库
                </el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 新建收藏夹对话框 -->
    <el-dialog
        v-model="showCreateFolderDialog"
        title="新建收藏夹"
        width="400px"
        :close-on-click-modal="false"
    >
        <el-input v-model="newFolderName" placeholder="请输入收藏夹名称" maxlength="50" show-word-limit />
        <template #footer>
            <el-button @click="showCreateFolderDialog = false">取消</el-button>
            <el-button type="primary" @click="handleCreateFolder" :loading="creatingFolder">创建</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Close, UploadFilled } from '@element-plus/icons-vue'
import { agree_project_invite, reject_project_invite } from '@/api/project'
import { pullAllMessages, MessageVO, markAsRead, handleApplyAgree, ApplyAgreeRequest, confirmCopyright, markAsConsumed, MessageMarkConsumedRequest } from '@/api/msg'
import { get_user_detail } from '@/api/profile'
import { getFavoritePage, addOutcomeToFavorite, Favorite, createFavorite } from '@/api/favorite'
import { callSuccess, callError } from '@/call'
import store from '@/store'
import { useRouter } from 'vue-router'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close', 'unread-count-update'])

// 路由实例
const router = useRouter()

// WebSocket相关状态
const ws = ref(null)
const wsConnected = ref(false)
const reconnectTimer = ref(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5

// 消息数据改为响应式数组，初始为空
const messages = ref([])

// 用户名缓存，避免重复请求
const userNameCache = ref(new Map())

// 标记全部已读的加载状态
const markingAllAsRead = ref(false)

// 文件上传相关状态
const uploadDialogVisible = ref(false)
const selectedFile = ref(null)
const fileList = ref([])
const uploadLoading = ref(false)
const currentDataRequestMessage = ref(null) // 当前处理的数据请求消息

// 收藏夹相关状态（用于入库功能）
const favoriteDialogVisible = ref(false)
const folders = ref([])
const selectedFolders = ref([])
const loadingFolders = ref(false)
const currentParentId = ref(0)
const breadcrumbList = ref([{ favoriteId: 0, name: '文献库' }])
const folderCurrentPage = ref(1)
const folderPageSize = ref(6)
const total = ref(0)
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)
const currentResearcherUpdateMessage = ref(null) // 当前处理的研究更新消息

// 过滤消息，只显示别人发给我的消息
const filteredMessages = computed(() => {
    const currentUserId = store.getters.getId
    if (!currentUserId) return []
    
    return messages.value.filter(message => {
        // 只显示别人发给我的消息（发送者不是当前用户）
        if (!message.senderId || message.senderId === currentUserId) {
            return false
        }
        
        // 过滤掉聊天消息类型，不在消息侧边栏中显示
        if (message.type === 'chat_message') {
            return false
        }
        
        return true
    })
})

// 计算非项目类型的未读消息（用于全部已读功能）
const unreadNonProjectMessages = computed(() => {
    return filteredMessages.value.filter(message => {
        // 项目类型、数据请求和版权确认的消息不包括在内（它们有自己的同意/拒绝逻辑）
        if (['project_invite', 'project_apply', 'data_request', 'agree_url'].includes(message.type)) {
            return false
        }
        
        // 对于研究人员更新消息，只要没有标记已读就包括在内
        if (message.type === 'researcher_update') {
            return message.status !== 'processed' && !message.read
        }
        
        // 对于问题回复消息，检查status是否为pending
        if (message.type === 'question_reply') {
            return message.status === 'pending' && !message.read
        }
        
        // 对于其他未知类型，只要是未读就包括在内
        return !message.read
    })
})

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
const handleIncomingMessage = async (messageData) => {
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
        // 直接使用消息对象中的type字段
        const messageType = messageData.type || 'unknown'
        
        // 获取发送者真实姓名
        const senderName = await getUserRealName(messageData.senderId)
        
        // 根据消息类型设置状态
        let messageStatus = null
        if (messageType === 'project_invite' || messageType === 'project_apply') {
            // 项目相关消息使用isAccepted字段，新消息默认为null
            messageStatus = messageData.isAccepted === 'agree' ? 'accepted' : 
                           messageData.isAccepted === 'reject' ? 'rejected' : null
        } else if (messageType === 'data_request' || messageType === 'agree_url') {
            // 数据请求和版权确认都使用isAccepted字段，类似项目邀请
            messageStatus = messageData.isAccepted === 'agree' ? 'accepted' : 
                           messageData.isAccepted === 'reject' ? 'rejected' : null
        } else if (messageType === 'researcher_update') {
            // 研究人员更新消息：状态只管理已读状态
            messageStatus = messageData.status === 'processed' ? 'processed' : 'pending'
        } else if (messageType === 'question_reply') {
            // 问题回复消息：使用status字段，如果WebSocket消息有status字段则使用，否则默认pending
            messageStatus = messageData.status || 'pending'
        }
        
        // 创建适配的消息对象
        const newMessage = {
            id: messageData.messageId,
            type: messageType,
            sender: senderName,
            content: messageData.message,
            time: new Date(messageData.sentAt || Date.now()),
            avatar: getValidAvatarUrl(messageData.avatar),
            read: messageData.status === 'processed' || messageData.isAccepted === 'agree' || messageData.isAccepted === 'reject' || messageData.isAccepted === 'consumed',
            projectId: messageData.projectId || null,
            senderId: messageData.senderId || null, // 添加发送者ID，用于拒绝接口
            outcomeId: messageData.outcomeId || null, // 添加成果ID，用于数据请求处理
            status: messageStatus,
            isLibraryAdded: messageType === 'researcher_update' && messageData.isAccepted === 'consumed' // 入库状态
        }
        
        console.log('创建的新消息对象:', newMessage)
        console.log(`WebSocket消息头像: 原始="${messageData.avatar}", 处理后="${newMessage.avatar}"`)
        console.log(`WebSocket消息类型识别: 直接使用type字段="${messageType}", 消息内容="${messageData.message}", 发送者="${senderName}"`)
        
        // 检查消息是否已存在（避免重复添加）
        const existingMessage = messages.value.find(m => m.id === newMessage.id)
        if (!existingMessage) {
            // 添加到消息列表开头（最新消息在上面）
            messages.value.unshift(newMessage)
            
            // 限制消息数量，避免内存占用过多
            if (messages.value.length > 100) {
                messages.value = messages.value.slice(0, 100)
            }
            
            console.log('新消息已添加，当前消息列表长度:', messages.value.length)
        } else {
            console.log('消息已存在，跳过添加:', newMessage.id)
        }
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

// 将API返回的MessageVO转换为前端消息格式
const convertMessageVOToMessage = async (messageVO) => {
    console.log('=== 历史消息VO调试信息 ===')
    console.log('MessageVO结构:', messageVO)
    console.log('MessageVO的所有属性:')
    for (let key in messageVO) {
        console.log(`  ${key}:`, messageVO[key], `(类型: ${typeof messageVO[key]})`)
    }
    console.log('=== 历史消息VO调试信息结束 ===')
    // 判断消息类型 - 优先使用type字段，否则通过消息内容推断
    let messageType = 'unknown'
    
    if (messageVO.type) {
        // 如果MessageVO有type字段，直接使用
        messageType = messageVO.type
        console.log(`历史消息直接使用type字段: ${messageType}`)
    } else {
        // 否则通过消息内容推断
        if (messageVO.message.includes('邀请')) {
            messageType = 'project_invite'
        } else if (messageVO.message.includes('申请')) {
            messageType = 'project_apply'
        } else if (messageVO.message.includes('发布了新的成果') || messageVO.message.includes('更新了个人研究状态') || messageVO.message.includes('研究状态更新') || messageVO.message.includes('更新了研究状态')) {
            messageType = 'researcher_update'
        } else if (messageVO.message.includes('希望获取') || messageVO.message.includes('数据集') || messageVO.message.includes('全文') || messageVO.message.includes('请求数据')) {
            messageType = 'data_request'
        } else if (messageVO.message.includes('回复了您关注的问题') || messageVO.message.includes('问题回复') || messageVO.message.includes('回复了问题')) {
            messageType = 'question_reply'
        } else if (messageVO.message.includes('版权确认') || messageVO.message.includes('确认版权') || messageVO.message.includes('版权授权')) {
            messageType = 'agree_url'
        }
        console.log(`历史消息通过内容推断类型: ${messageType}, 消息内容: "${messageVO.message}"`)
    }
    
    // 获取发送者真实姓名
    const senderName = await getUserRealName(messageVO.senderId)
    
    // 判断消息是否已读：明确标记为已读 或 已经操作过的消息
    const isRead = messageVO.status === 'read' || 
                   messageVO.isAccepted === 'agree' || 
                   messageVO.isAccepted === 'reject' ||
                   messageVO.isAccepted === 'consumed' ||
                   messageVO.status === 'processed'
    
    // 根据消息类型设置status
    let messageStatus = null
    if (messageType === 'project_invite' || messageType === 'project_apply') {
        // 项目邀请和申请使用 isAccepted 字段
        messageStatus = messageVO.isAccepted === 'agree' ? 'accepted' : 
                       messageVO.isAccepted === 'reject' ? 'rejected' : null
    } else if (messageType === 'data_request' || messageType === 'agree_url') {
        // 数据请求和版权确认都使用 isAccepted 字段，类似项目邀请
        messageStatus = messageVO.isAccepted === 'agree' ? 'accepted' : 
                       messageVO.isAccepted === 'reject' ? 'rejected' : null
    } else if (messageType === 'researcher_update') {
        // 研究人员更新消息：状态只管理已读状态
        messageStatus = messageVO.status === 'processed' ? 'processed' : 'pending'
    } else if (messageType === 'question_reply') {
        // 问题回复消息：使用 status 字段，默认为 pending
        messageStatus = messageVO.status === 'processed' ? 'processed' : 'pending'
    }
    
    const convertedMessage = {
        id: messageVO.messageId,
        type: messageType,
        sender: senderName,
        content: messageVO.message,
        time: new Date(messageVO.sentAt),
        avatar: getValidAvatarUrl(messageVO.avatar),
        read: isRead,
        projectId: messageVO.projectId || null,
        senderId: messageVO.senderId || null,
        outcomeId: messageVO.outcomeId || null, // 添加成果ID，用于数据请求处理
        status: messageStatus,
        isLibraryAdded: messageType === 'researcher_update' && messageVO.isAccepted === 'consumed' // 入库状态
    }
        
        console.log(`历史消息转换: ID=${messageVO.messageId}, 消息内容="${messageVO.message}", 推断类型="${messageType}", 发送者="${senderName}", 原始头像="${messageVO.avatar}", 处理后头像="${convertedMessage.avatar}", status="${messageVO.status}", isAccepted="${messageVO.isAccepted}" → read=${isRead}, status="${convertedMessage.status}"`)
        
        return convertedMessage
}

// 拉取所有历史消息
const pullHistoryMessages = async () => {
    console.log('开始拉取历史消息')
    const messageVOs = await pullAllMessages()
    
    if (messageVOs && messageVOs.length > 0) {
        console.log(`拉取到 ${messageVOs.length} 条历史消息`)
        
        // 转换为前端消息格式 - 使用Promise.all处理异步转换
        const convertedMessages = await Promise.all(
            messageVOs.map(messageVO => convertMessageVOToMessage(messageVO))
        )
        
        // 按时间排序（最新的在前面）
        convertedMessages.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        
        // 更新消息列表
        messages.value = convertedMessages
        
        console.log('历史消息已加载:', messages.value.length)
    } else {
        console.log('没有历史消息或拉取失败')
        messages.value = []
    }
}

// 清空消息列表（用户切换时）
const clearMessages = () => {
    messages.value = []
    userNameCache.value.clear() // 清空用户名缓存
    console.log('消息列表和用户名缓存已清空')
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
                console.log(`消息ID ${message.id} 已设置为同意状态，未读数量将更新`)
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
        // 拒绝邀请，调用后端接口
        try {
            const success = await reject_project_invite({
                messageId: messageId,
                senderId: message.senderId
            })
            
            if (success) {
                message.status = 'rejected'
                message.read = true
                console.log(`消息ID ${message.id} 已设置为拒绝状态，未读数量将更新`)
                callSuccess('已拒绝项目邀请')
            } else {
                // 接口调用失败的错误信息已在API中处理
                return
            }
        } catch (error) {
            callError('处理项目邀请时发生错误')
            return
        }
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
                console.log(`消息ID ${message.id} 已设置为同意状态，未读数量将更新`)
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
        // 拒绝申请，调用后端接口
        try {
            const success = await reject_project_invite({
                messageId: messageId,
                senderId: message.senderId
            })
            
            if (success) {
                message.status = 'rejected'
                message.read = true
                console.log(`消息ID ${message.id} 已设置为拒绝状态，未读数量将更新`)
                callSuccess('已拒绝项目申请')
            } else {
                // 接口调用失败的错误信息已在API中处理
                return
            }
        } catch (error) {
            callError('处理项目申请时发生错误')
            return
        }
    }
}

// 处理数据请求
const handleDataRequest = async (messageId, accepted) => {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) {
        callError('消息不存在')
        return
    }
    
    if (!message.outcomeId) {
        callError('消息中缺少成果ID，无法处理')
        return
    }
    
    if (accepted) {
        // 同意：弹出文件上传对话框
        currentDataRequestMessage.value = message
        uploadDialogVisible.value = true
        resetUploadDialog()
    } else {
        // 拒绝：直接调用后端接口
        try {
            const success = await handleApplyAgree({
                agree: false,
                outcomeId: message.outcomeId,
                messageId: messageId
            })
            
            if (success) {
                message.status = 'rejected'
                message.read = true
                console.log(`消息ID ${message.id} 已设置为拒绝状态，未读数量将更新`)
                callSuccess('已拒绝数据请求')
            }
        } catch (error) {
            console.error('拒绝数据请求失败:', error)
            callError('拒绝数据请求失败')
        }
    }
}

// 处理成果版权确认
const handleCopyrightConfirm = async (messageId, accepted) => {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) {
        callError('消息不存在')
        return
    }
    
    if (!message.outcomeId) {
        callError('消息中缺少成果ID，无法处理')
        return
    }
    
    try {
        const success = await confirmCopyright({
            outcomeId: message.outcomeId,
            agreeUrl: accepted
        })
        
        if (success) {
            message.status = accepted ? 'accepted' : 'rejected'
            message.read = true
            console.log(`消息ID ${message.id} 已设置为${accepted ? '同意' : '拒绝'}状态，未读数量将更新`)
            callSuccess(accepted ? '已同意版权确认' : '已拒绝版权确认')
        }
    } catch (error) {
        console.error('版权确认处理失败:', error)
        callError('版权确认处理失败')
    }
}

// 处理研究人员更新消息（入库或标记已读）
const handleResearcherUpdate = async (messageId, isLibrary) => {
    console.log('handleResearcherUpdate 被调用:', { messageId, isLibrary })
    
    const message = messages.value.find(m => m.id === messageId)
    if (!message) {
        console.error('未找到消息:', messageId)
        callError('未找到消息')
        return
    }
    
    console.log('找到消息:', message)
    
    if (isLibrary) {
        // 入库操作：显示收藏夹选择对话框
        console.log('开始入库操作')
        
        if (!message.outcomeId) {
            console.error('消息中缺少成果ID:', message)
            callError('消息中缺少成果ID，无法入库')
            return
        }
        
        console.log('设置当前研究更新消息:', message)
        currentResearcherUpdateMessage.value = message
        
        console.log('调用 showFavoriteDialog')
        try {
            await showFavoriteDialog()
            console.log('showFavoriteDialog 调用完成')
        } catch (error) {
            console.error('showFavoriteDialog 调用失败:', error)
            callError('显示收藏夹对话框失败')
        }
    } else {
        // 标记已读操作
        console.log('开始标记已读操作')
        await handleMarkAsRead(messageId)
    }
}

// 处理标记已读
const handleMarkAsRead = async (messageId) => {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) {
        console.error('未找到消息:', messageId)
        return
    }
    
    try {
        console.log(`开始标记消息为已读:`, messageId, `消息类型: ${message.type}`)
        
        // 调用后端接口标记消息为已读
        const success = await markAsRead({
            messageIds: [messageId]
        })
        
        if (success) {
            // 更新前端状态
            // 对于已知的三种类型，设置status为processed
            if (['data_request', 'researcher_update', 'question_reply'].includes(message.type)) {
                message.status = 'processed'
            }
            // 对于所有类型，都设置read为true
            message.read = true
            
            console.log(`消息ID ${messageId} 已标记为已读，消息类型: ${message.type}，未读数量将更新`)
            callSuccess('消息已标记为已读')
        } else {
            // 接口调用失败的错误信息已在API中处理
            console.error('标记已读失败')
        }
    } catch (error) {
        console.error('标记已读时发生错误:', error)
        callError('标记已读时发生错误')
    }
}

// 处理全部已读
const handleMarkAllAsRead = async () => {
    const unreadMessages = unreadNonProjectMessages.value
    if (unreadMessages.length === 0) {
        console.log('没有未读的非项目类型消息')
        return
    }
    
    markingAllAsRead.value = true
    
    try {
        console.log(`开始标记 ${unreadMessages.length} 条消息为已读`)
        
        // 提取所有未读消息的ID
        const messageIds = unreadMessages.map(message => message.id)
        
        // 调用后端接口批量标记消息为已读
        const success = await markAsRead({
            messageIds: messageIds
        })
        
        if (success) {
            // 更新前端状态
            unreadMessages.forEach(message => {
                // 对于已知的三种类型，设置status为processed
                if (['data_request', 'researcher_update', 'question_reply'].includes(message.type)) {
                    message.status = 'processed'
                }
                // 对于所有类型，都设置read为true
                message.read = true
            })
            
            console.log(`成功标记 ${unreadMessages.length} 条消息为已读，未读数量将更新`)
            callSuccess(`已标记 ${unreadMessages.length} 条消息为已读`)
        } else {
            // 接口调用失败的错误信息已在API中处理
            console.error('批量标记已读失败')
        }
    } catch (error) {
        console.error('批量标记已读时发生错误:', error)
        callError('批量标记已读时发生错误')
    } finally {
        markingAllAsRead.value = false
    }
}

// 获取用户真实姓名（带缓存）
const getUserRealName = async (senderId) => {
    if (!senderId || senderId === null) {
        return '未知用户'
    }
    
    // 先从缓存中查找
    if (userNameCache.value.has(senderId)) {
        console.log(`从缓存获取用户${senderId}姓名:`, userNameCache.value.get(senderId))
        return userNameCache.value.get(senderId)
    }
    
    try {
        const userDetail = await get_user_detail({ userId: senderId })
        if (userDetail && userDetail.name) {
            // 缓存用户名
            userNameCache.value.set(senderId, userDetail.name)
            console.log(`获取并缓存用户${senderId}姓名:`, userDetail.name)
            return userDetail.name
        } else {
            console.log(`无法获取用户${senderId}的姓名信息`)
            const fallbackName = `用户${senderId}`
            // 也缓存失败的情况，避免重复请求
            userNameCache.value.set(senderId, fallbackName)
            return fallbackName
        }
    } catch (error) {
        console.error(`获取用户${senderId}姓名失败:`, error)
        const fallbackName = `用户${senderId}`
        // 缓存失败的情况
        userNameCache.value.set(senderId, fallbackName)
        return fallbackName
    }
}

// 头像处理函数
const getValidAvatarUrl = (avatarUrl) => {
    // 如果有有效的头像URL，返回它
    if (avatarUrl && avatarUrl.trim() !== '') {
        // 如果是相对路径，需要补全URL
        if (avatarUrl.startsWith('/')) {
            return avatarUrl
        }
        // 如果是完整URL，直接返回
        if (avatarUrl.startsWith('http')) {
            return avatarUrl
        }
        // 如果是其他格式，也直接返回尝试加载
        return avatarUrl
    }
    // 否则返回默认头像
    return require('@/asset/home/user.png')
}

// 头像加载失败处理
const handleAvatarError = (event) => {
    // 头像加载失败时，设置为默认头像
    event.target.src = require('@/asset/home/user.png')
}

// 导航到用户个人资料页面
const navigateToUserProfile = (senderId) => {
    if (!senderId || senderId === null) {
        console.warn('发送者ID为空，无法跳转到用户资料页面')
        callError('无法获取用户信息')
        return
    }
    
    console.log(`跳转到用户${senderId}的个人资料页面`)
    
    // 关闭消息侧边栏
    emit('close')
    
    // 跳转到用户个人资料页面
    router.push({
        name: 'profile',
        params: { id: senderId.toString() }
    }).catch(error => {
        console.error('页面跳转失败:', error)
        callError('页面跳转失败')
    })
}

// 重置文件上传对话框
const resetUploadDialog = () => {
    selectedFile.value = null
    fileList.value = []
    uploadLoading.value = false
}

// 处理文件选择变化
const handleFileChange = (file, fileList) => {
    console.log('文件选择变化:', file, fileList)
    
    // 检查文件类型
    if (file.raw && file.raw.type !== 'application/pdf') {
        callError('只能上传PDF格式的文件')
        fileList.splice(fileList.indexOf(file), 1)
        return
    }
    
    // 检查文件大小（50MB）
    if (file.raw && file.raw.size > 50 * 1024 * 1024) {
        callError('文件大小不能超过50MB')
        fileList.splice(fileList.indexOf(file), 1)
        return
    }
    
    selectedFile.value = file.raw
}

// 处理上传确认
const handleUploadConfirm = async () => {
    if (!selectedFile.value) {
        callError('请选择要上传的PDF文件')
        return
    }
    
    if (!currentDataRequestMessage.value) {
        callError('找不到对应的消息')
        return
    }
    
    const message = currentDataRequestMessage.value
    uploadLoading.value = true
    
    try {
        const success = await handleApplyAgree({
            agree: true,
            outcomeId: message.outcomeId,
            messageId: message.id,
            multipartFile: selectedFile.value
        })
        
        if (success) {
            message.status = 'accepted'
            message.read = true
            console.log(`消息ID ${message.id} 已设置为同意状态，未读数量将更新`)
            callSuccess('文件上传成功，已同意数据请求')
            uploadDialogVisible.value = false
            resetUploadDialog()
        }
    } catch (error) {
        console.error('上传文件失败:', error)
        callError('上传文件失败')
    } finally {
        uploadLoading.value = false
    }
}

// 显示收藏夹对话框
const showFavoriteDialog = async () => {
    console.log('showFavoriteDialog 开始执行')
    
    const currentUserId = store.getters.getId
    console.log('当前用户ID:', currentUserId)
    
    if (!currentUserId) {
        console.error('用户未登录')
        callError('请先登录')
        return
    }
    
    console.log('设置收藏夹对话框状态')
    favoriteDialogVisible.value = true
    selectedFolders.value = []
    currentParentId.value = 0
    breadcrumbList.value = [{ favoriteId: 0, name: '文献库' }]
    folderCurrentPage.value = 1
    
    console.log('收藏夹对话框状态设置完成，开始加载文件夹')
    // 加载收藏夹列表
    try {
        await loadFolders()
        console.log('收藏夹列表加载完成')
    } catch (error) {
        console.error('加载收藏夹列表失败:', error)
        callError('加载收藏夹列表失败')
    }
}

// 加载收藏夹列表
const loadFolders = async () => {
    loadingFolders.value = true
    try {
        const result = await getFavoritePage({
            pageSize: folderPageSize.value,
            pageNum: folderCurrentPage.value,
            parentId: currentParentId.value
        })
        
        if (result) {
            folders.value = result.list
            total.value = result.total
        } else {
            folders.value = []
            total.value = 0
        }
    } catch (error) {
        console.error('加载收藏夹失败:', error)
        folders.value = []
        total.value = 0
    } finally {
        loadingFolders.value = false
    }
}

// 导航到指定收藏夹
const navigateToFolder = async (parentId) => {
    currentParentId.value = parentId
    folderCurrentPage.value = 1
    await loadFolders()
    updateBreadcrumb(parentId)
}

// 更新面包屑导航
const updateBreadcrumb = (parentId) => {
    breadcrumbList.value = [{ favoriteId: 0, name: '文献库' }]
    if (parentId !== 0) {
        breadcrumbList.value.push({
            favoriteId: parentId,
            name: '收藏夹'
        })
    }
}

// 面包屑导航点击
const navigateToBreadcrumb = async (index) => {
    if (index < breadcrumbList.value.length - 1) {
        const targetItem = breadcrumbList.value[index]
        currentParentId.value = targetItem.favoriteId
        
        breadcrumbList.value = breadcrumbList.value.slice(0, index + 1)
        await loadFolders()
    }
}

// 返回上一级收藏夹
const backToParentFolder = async () => {
    if (breadcrumbList.value.length > 1) {
        breadcrumbList.value.pop()
        
        const newCurrentItem = breadcrumbList.value[breadcrumbList.value.length - 1]
        currentParentId.value = newCurrentItem.favoriteId
        
        await loadFolders()
    }
}

// 打开收藏夹
const openFolder = async (folder) => {
    breadcrumbList.value.push({
        favoriteId: folder.favoriteId,
        name: folder.name
    })
    
    currentParentId.value = folder.favoriteId
    await loadFolders()
}

// 选择/取消选择收藏夹
const toggleFolderSelection = (folder) => {
    const index = selectedFolders.value.findIndex(f => f.favoriteId === folder.favoriteId)
    if (index > -1) {
        selectedFolders.value.splice(index, 1)
    } else {
        selectedFolders.value.push(folder)
    }
}

// 确认收藏（入库）
const confirmFavorite = async () => {
    if (!currentResearcherUpdateMessage.value || !currentResearcherUpdateMessage.value.outcomeId) {
        callError('无法获取成果ID')
        return
    }
    
    if (selectedFolders.value.length === 0) {
        callError('请选择至少一个收藏夹')
        return
    }
    
    try {
        let successCount = 0
        let errorCount = 0
        
        // 添加到选中的收藏夹
        for (const folder of selectedFolders.value) {
            const success = await addOutcomeToFavorite({
                favoriteId: folder.favoriteId,
                outcomeId: currentResearcherUpdateMessage.value.outcomeId
            })
            if (success) {
                successCount++
            } else {
                errorCount++
            }
        }
        
        if (errorCount === 0) {
            // 入库成功，调用 markAsConsumed 接口
            const consumedSuccess = await markAsConsumed({
                messageIds: [currentResearcherUpdateMessage.value.id]
            })
            
            if (consumedSuccess) {
                // 更新入库状态
                currentResearcherUpdateMessage.value.isLibraryAdded = true
                
                // 如果还没有标记已读，同时标记已读
                if (currentResearcherUpdateMessage.value.status !== 'processed') {
                    const readSuccess = await markAsRead({
                        messageIds: [currentResearcherUpdateMessage.value.id]
                    })
                    
                    if (readSuccess) {
                        currentResearcherUpdateMessage.value.status = 'processed'
                        currentResearcherUpdateMessage.value.read = true
                    }
                }
                
                callSuccess(`成功入库到 ${successCount} 个收藏夹`)
                favoriteDialogVisible.value = false
                currentResearcherUpdateMessage.value = null
            } else {
                callError('入库成功但标记消费状态失败')
            }
        } else {
            callError(`部分操作失败，成功：${successCount}，失败：${errorCount}`)
        }
    } catch (error) {
        console.error('入库操作失败:', error)
        callError('入库操作失败')
    }
}

// 分页处理
const handleFolderPageChange = async (page) => {
    folderCurrentPage.value = page
    await loadFolders()
}

// 新建收藏夹
const handleCreateFolder = async () => {
    if (!newFolderName.value.trim()) {
        callError('请输入收藏夹名称')
        return
    }
    
    creatingFolder.value = true
    try {
        const result = await createFavorite({ 
            name: newFolderName.value.trim(), 
            parentId: currentParentId.value 
        })
        if (result) {
            callSuccess('创建成功')
            showCreateFolderDialog.value = false
            newFolderName.value = ''
            await loadFolders()
        } else {
            callError('创建失败')
        }
    } catch (e) {
        callError('创建失败')
    } finally {
        creatingFolder.value = false
    }
}

// 获取当前目录名称
const getCurrentFolderName = () => {
    if (breadcrumbList.value.length > 0) {
        return breadcrumbList.value[breadcrumbList.value.length - 1].name
    }
    return '文献库'
}

// 计算属性：新建收藏夹的tooltip内容
const createFolderTooltip = computed(() => {
    const currentName = getCurrentFolderName()
    return `在"${currentName}"下新建收藏夹`
})

// 计算未读消息数量
const unreadCount = computed(() => {
    return filteredMessages.value.filter(message => {
        // 已读的消息不计入未读数量
        if (message.read) return false
        
        // 已经操作过的消息不计入未读数量
        if (message.status === 'accepted' || message.status === 'rejected' || message.status === 'processed') {
            console.log(`消息ID ${message.id} 已操作过(${message.status})，不计入未读数量`)
            return false
        }
        
        // 未读且未操作的消息计入未读数量（包括status为null或pending的消息）
        return true
    }).length
})

// 监听未读数量变化，通知父组件
watch(unreadCount, (newCount) => {
    emit('unread-count-update', newCount)
}, { immediate: true })

// 监听用户ID变化，自动连接/断开WebSocket
watch(() => store.getters.getId, async (newUserId, oldUserId) => {
    console.log('用户ID变化:', { oldUserId, newUserId })
    
    if (newUserId && newUserId !== null) {
        // 用户已登录
        if (oldUserId && oldUserId !== newUserId) {
            // 用户切换，先清空消息列表
            console.log('用户切换，清空消息列表')
            clearMessages()
        }
        
        if (!wsConnected.value) {
            // 建立WebSocket连接
            console.log('用户已登录，建立WebSocket连接')
            connectWebSocket()
        }
        
        // 拉取历史消息
        console.log('拉取用户历史消息')
        await pullHistoryMessages()
        
    } else if (!newUserId || newUserId === null) {
        // 用户退出登录，断开连接并清空消息
        console.log('用户已退出，断开WebSocket连接并清空消息')
        disconnectWebSocket()
        clearMessages()
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

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
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

.mark-all-read-btn {
    color: #409eff !important;
    font-size: 12px;
    padding: 4px 8px !important;
    height: auto !important;
    min-height: auto !important;
}

.mark-all-read-btn:hover {
    color: #337ecc !important;
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
    cursor: pointer;
    transition: transform 0.2s ease;
}

.message-avatar:hover {
    transform: scale(1.05);
}

.message-avatar img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    background-color: #f0f0f0;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    cursor: pointer;
    transition: color 0.2s ease;
}

.sender-name:hover {
    color: #409eff;
    text-decoration: underline;
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

.message-status.processed {
    color: #67c23a;
    background-color: rgba(103, 194, 58, 0.1);
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

/* 文件上传对话框样式 */
.upload-content {
    padding: 20px 0;
}

.upload-content p {
    margin-bottom: 16px;
    color: #333;
    font-size: 14px;
}

.upload-demo {
    width: 100%;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.el-upload-dragger {
    width: 100% !important;
    height: 180px !important;
}

.el-icon--upload {
    font-size: 48px !important;
    color: #c0c4cc !important;
    margin-bottom: 16px !important;
}

.el-upload__text {
    color: #606266 !important;
    font-size: 14px !important;
}

.el-upload__tip {
    color: #909399 !important;
    font-size: 12px !important;
    margin-top: 8px !important;
}

/* 收藏夹对话框样式 */
.favorite-dialog-content {
    padding: 20px 0;
}

.breadcrumb-container {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.breadcrumb-title {
    font-weight: 600;
    color: #333;
    margin-right: 15px;
    font-size: 16px;
}

.breadcrumb-list {
    display: flex;
    align-items: center;
    flex: 1;
}

.breadcrumb-item {
    cursor: pointer;
    color: #409eff;
    font-size: 14px;
    transition: color 0.3s ease;
    display: flex;
    align-items: center;
}

.breadcrumb-item:hover {
    color: #66b1ff;
    text-decoration: underline;
}

.breadcrumb-item.active {
    color: #606266;
    cursor: default;
}

.breadcrumb-item.active:hover {
    color: #606266;
    text-decoration: none;
}

.breadcrumb-separator {
    margin: 0 8px;
    color: #c0c4cc;
}

.back-button {
    margin-left: auto;
    color: #409eff;
    font-size: 14px;
}

.back-button:hover {
    color: #66b1ff;
}

.folders-container {
    min-height: 300px;
    margin-bottom: 20px;
}

.empty-folders {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
}

.folders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.folder-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #fff;
    position: relative;
}

.folder-item:hover {
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    transform: translateY(-2px);
}

.folder-item.selected {
    border-color: #409eff;
    background-color: #ecf5ff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.folder-icon {
    font-size: 32px;
    margin-bottom: 10px;
}

.folder-name {
    font-size: 14px;
    color: #333;
    text-align: center;
    margin-bottom: 10px;
    font-weight: 500;
    word-break: break-word;
}

.folder-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.folder-item:hover .folder-actions {
    opacity: 1;
}

.open-folder-btn {
    padding: 2px 12px;
    font-size: 14px;
    font-weight: bold;
}

.open-folder-btn:hover {
    color: #007afc;
    background-color: #d7eaff;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
}

.selected-folders {
    margin-top: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.selected-title {
    font-weight: 600;
    color: #333;
    margin-bottom: 10px;
    font-size: 16px;
}

.selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.selected-tag {
    margin: 0;
    font-size: 13px;
}
</style> 