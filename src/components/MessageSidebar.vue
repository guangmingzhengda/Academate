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
                                <span class="message-time">{{ formatTime(message.time) }}</span>
                            </div>
                            <div class="message-text">{{ message.content }}</div>
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
import { ref, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close'])

// 模拟消息数据
const messages = ref([
    {
        id: 1,
        sender: '张教授',
        content: '您好，我对您发表的论文《人工智能在教育领域的应用》很感兴趣，希望能够进一步交流。',
        time: new Date(Date.now() - 30 * 60 * 1000), // 30分钟前
        avatar: require('@/asset/home/user.png'),
        read: false
    },
    {
        id: 2,
        sender: '李研究员',
        content: '感谢您在学术会议上的精彩分享，我想邀请您参加我们下个月的研讨会。',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        avatar: require('@/asset/home/user.png'),
        read: false
    },
    {
        id: 3,
        sender: '王博士',
        content: '您的研究方向和我们团队很匹配，是否考虑合作研究？',
        time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
        avatar: require('@/asset/home/user.png'),
        read: true
    },
    {
        id: 4,
        sender: '系统通知',
        content: '您的论文《深度学习算法优化研究》已通过初审，请及时查看审稿意见。',
        time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
        avatar: require('@/asset/home/user.png'),
        read: true
    },
    {
        id: 5,
        sender: '陈院士',
        content: '恭喜您获得本年度优秀学者奖，期待您的获奖感言。',
        time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
        avatar: require('@/asset/home/user.png'),
        read: true
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
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.sender-name {
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.message-time {
    font-size: 12px;
    color: #999;
}

.message-text {
    color: #666;
    font-size: 13px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-align: left;
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