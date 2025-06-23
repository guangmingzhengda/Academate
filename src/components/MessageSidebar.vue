<template>
    <div class="sidebar-overlay" :class="{ 'show': visible }" @click="closeSidebar">
        <div class="sidebar" :class="{ 'open': visible }" @click.stop>
            <div class="sidebar-header">
                <h3>消息中心</h3>
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
import { ref, computed, watch, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { agree_project_invite } from '@/api/project'
import { callSuccess, callError } from '@/call'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close', 'unread-count-update'])

// 五种消息类型的示例数据
const messages = ref([
    {
        id: 1,
        type: 'project_invite', // 项目邀请
        sender: '张教授',
        content: '邀请您加入"基于深度学习的智能推荐系统"项目，该项目将持续12个月，主要研究推荐算法优化。',
        time: new Date(Date.now() - 15 * 60 * 1000), // 15分钟前
        avatar: require('@/asset/home/user.png'),
        read: false,
        projectId: 101,
        status: null // null: 未处理, 'accepted': 已同意, 'rejected': 已拒绝
    },
    {
        id: 2,
        type: 'project_apply', // 项目申请
        sender: '李研究员',
        content: '申请加入您负责的"人工智能在教育领域的应用研究"项目，我在机器学习和教育技术方面有丰富经验。',
        time: new Date(Date.now() - 45 * 60 * 1000), // 45分钟前
        avatar: require('@/asset/home/user.png'),
        read: false,
        projectId: 102,
        status: null
    },
    {
        id: 3,
        type: 'researcher_update', // 研究人员状态更新
        sender: '王博士',
        content: '更新了个人研究状态：刚刚完成了关于"量子计算在密码学中的应用"的最新研究论文，正在寻求合作伙伴进行进一步验证。',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        avatar: require('@/asset/home/user.png'),
        read: true
    },
    {
        id: 4,
        type: 'data_request', // 数据/全文请求
        sender: '陈院士',
        content: '希望获取您论文《深度学习算法优化研究》的完整数据集和实验代码，用于我们团队的相关研究对比分析。',
        time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
        avatar: require('@/asset/home/user.png'),
        read: false,
        paperId: 203,
        status: null
    },
    {
        id: 5,
        type: 'question_reply', // 问题回复提醒
        sender: '刘教授',
        content: '回复了您关注的问题"如何提高神经网络的训练效率？"：建议使用批量归一化和学习率调度策略，具体可以参考我最近的研究成果...',
        time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
        avatar: require('@/asset/home/user.png'),
        read: true,
        questionId: 304
    }
])

const closeSidebar = () => {
    emit('close')
}

const formatTime = (time) => {
    const now = new Date()
    const diff = now - time
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
        return `${minutes}分钟前`
    } else if (hours < 24) {
        return `${hours}小时前`
    } else {
        return `${days}天前`
    }
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

// 组件挂载时立即发送未读数量
onMounted(() => {
    emit('unread-count-update', unreadCount.value)
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

.sidebar-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
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