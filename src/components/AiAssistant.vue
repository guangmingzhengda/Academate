<template>
    <div>
        <!-- AI对话侧边栏 -->
        <div class="ai-sidebar" :class="{ 'ai-sidebar-open': visible }">
            <div class="ai-sidebar-header">
                <div class="ai-header-content">
                    <img src="@/asset/pdf-reader/logo.png" alt="Logo" class="ai-header-logo"/>
                    <h3>ACADEMATE AI</h3>
                </div>
                <button class="ai-close-btn" @click="$emit('close')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- 对话区域 -->
            <div class="ai-chat-area">
                <div class="ai-messages" ref="aiMessagesContainer">
                    <div v-if="messages.length === 0" class="ai-welcome">
                        <div class="ai-avatar">
                            <img :src="aiAvatarUrl" alt="AI助手" class="avatar-img"/>
                        </div>
                        <div class="ai-welcome-text">
                            <p>您好！我是AI助手，可以帮您：</p>
                            <ul>
                                <li>生成文章摘要</li>
                                <li>总结当页内容</li>
                                <li>回答关于文档的问题</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div v-for="message in messages" :key="message.id" class="ai-message" :class="message.type">
                        <div class="ai-avatar" v-if="message.type === 'assistant'">
                            <img :src="aiAvatarUrl" alt="AI助手" class="avatar-img"/>
                        </div>
                        <div class="ai-message-content">
                            <p style="text-align: left;" v-html="formatMessage(message.content)"></p>
                            <span class="ai-message-time">{{ message.timestamp }}</span>
                        </div>
                        <div class="ai-avatar user-avatar" v-if="message.type === 'user'">
                            <img :src="userAvatarUrl" alt="用户" class="avatar-img" @error="handleUserAvatarError"/>
                        </div>
                    </div>
                    
                    <!-- 加载中消息 -->
                    <div v-if="loading" class="ai-message assistant">
                        <div class="ai-avatar">
                            <img :src="aiAvatarUrl" alt="AI助手" class="avatar-img"/>
                        </div>
                        <div class="ai-message-content">
                            <div class="ai-typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 预设问题 -->
                <div class="ai-preset-questions" v-if="!loading">
                    <button 
                        class="ai-preset-btn" 
                        @click="handlePresetQuestion('summary')"
                        :disabled="!pdfReady || loading"
                    >
                        📄 生成文章摘要
                    </button>
                    <button 
                        class="ai-preset-btn" 
                        @click="handlePresetQuestion('current-page')"
                        :disabled="!pdfReady || loading"
                    >
                        📖 总结当页内容
                    </button>
                </div>
                
                <!-- 输入区域 -->
                <div class="ai-input-area">
                    <div class="ai-input-wrapper">
                        <textarea
                            v-model="inputText"
                            ref="aiInputRef"
                            class="ai-input"
                            placeholder="输入您的问题..."
                            rows="2"
                            @keydown="handleInputKeydown"
                            :disabled="loading"
                        ></textarea>
                        <button 
                            class="ai-send-btn" 
                            @click="sendMessage"
                            :disabled="!inputText.trim() || loading"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- AI切换按钮 -->
        <button class="ai-toggle-btn" @click="$emit('toggle')" :class="{ 'ai-toggle-active': visible }">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>AI助手</span>
        </button>
    </div>
</template>

<script>
import { ref, nextTick, watch, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { get_user_detail } from '@/api/profile'

export default {
    name: 'AiAssistant',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        pdfReady: {
            type: Boolean,
            default: false
        },
        currentPageText: {
            type: String,
            default: ''
        },
        allTexts: {
            type: Object,
            default: () => ({})
        },
        documentInfo: {
            type: Object,
            default: () => ({})
        },
        currentPage: {
            type: Number,
            default: 1
        },
        totalPages: {
            type: Number,
            default: 0
        }
    },
    emits: ['toggle', 'close', 'error', 'info'],
    setup(props, { emit }) {
        const store = useStore()
        
        // 响应式数据
        const inputText = ref('')
        const loading = ref(false)
        const aiInputRef = ref(null)
        const aiMessagesContainer = ref(null)
        const messages = ref([])
        let messageIdCounter = 1
        
        // 头像相关
        const userAvatarUrl = ref('')
        const aiAvatarUrl = ref(require('@/asset/pdf-reader/ai.png'))
        
        // 获取用户头像
        const getUserAvatar = async () => {
            try {
                if (store.getters.getToken) {
                    // 优先使用store中的头像信息
                    const storeData = store.getters.getData;
                    if (storeData && storeData.avatar) {
                        userAvatarUrl.value = storeData.avatar;
                    } else {
                        // 如果store中没有，则尝试从API获取
                        const res = await get_user_detail({ userId: store.getters.getId });
                        if (res && res.avatar) {
                            userAvatarUrl.value = res.avatar;
                        } else {
                            userAvatarUrl.value = require("@/asset/home/user.png");
                        }
                    }
                } else {
                    userAvatarUrl.value = require("@/asset/home/user.png");
                }
            } catch (error) {
                userAvatarUrl.value = require("@/asset/home/user.png");
            }
        }
        
        // 用户头像加载失败处理
        const handleUserAvatarError = () => {
            userAvatarUrl.value = require("@/asset/home/user.png");
        }

        // 组件挂载时获取用户头像
        onMounted(() => {
            getUserAvatar()
        })

        // 监听侧边栏显示状态，自动聚焦输入框
        watch(() => props.visible, (newVal) => {
            if (newVal) {
                nextTick(() => {
                    if (aiInputRef.value) {
                        aiInputRef.value.focus()
                    }
                })
            }
        })

        // 格式化消息内容（支持基本的HTML格式）
        const formatMessage = (content) => {
            return content
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
        }

        // 滚动到消息底部
        const scrollToBottom = () => {
            nextTick(() => {
                if (aiMessagesContainer.value) {
                    aiMessagesContainer.value.scrollTop = aiMessagesContainer.value.scrollHeight
                }
            })
        }

        // 添加消息到对话列表
        const addMessage = (content, type = 'user') => {
            const message = {
                id: messageIdCounter++,
                content,
                type,
                timestamp: new Date().toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            }

            messages.value.push(message)
            scrollToBottom()
            return message
        }

        // 处理预设问题
        const handlePresetQuestion = async (type) => {
            let question = ''
            let context = ''

            if (type === 'summary') {
                question = '请生成这篇文章的摘要'
                const textArray = Object.values(props.allTexts)
                context = textArray.join('\n\n')

                if (!context.trim()) {
                    emit('error', '请等待PDF文档加载完成后再试')
                    return
                }
            } else if (type === 'current-page') {
                question = `请总结第${props.currentPage}页的内容`
                context = props.currentPageText

                if (!context.trim()) {
                    emit('error', '当前页面暂无可提取的文字内容')
                    return
                }
            }

            // 添加用户消息
            addMessage(question, 'user')

            // 发送AI请求
            await sendAiRequest(question, context)
        }

        // 发送消息
        const sendMessage = async () => {
            const message = inputText.value.trim()
            if (!message || loading.value) return

            // 添加用户消息
            addMessage(message, 'user')

            // 清空输入框
            inputText.value = ''

            // 获取当前页面文字作为上下文
            const context = props.currentPageText

            // 发送AI请求
            await sendAiRequest(message, context)
        }

        // 发送AI请求
        const sendAiRequest = async (question, context = '') => {
            loading.value = true

            try {
                // 构建请求数据
                const requestData = {
                    question,
                    context: context || '暂无上下文内容',
                    documentTitle: props.documentInfo?.title || '未知文档',
                    currentPage: props.currentPage,
                    totalPages: props.totalPages
                }

                // 这里应该调用实际的AI API
                // 暂时使用模拟响应
                const response = await simulateAiResponse(requestData)

                // 添加AI回复消息
                addMessage(response, 'assistant')

            } catch (error) {
                console.error('AI请求失败:', error)
                addMessage('抱歉，AI服务暂时不可用，请稍后再试。', 'assistant')
                emit('error', 'AI请求失败')
            } finally {
                loading.value = false
            }
        }

        // 模拟AI响应（实际项目中应该替换为真实的AI API调用）
        const simulateAiResponse = async (requestData) => {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

            const { question, context, documentTitle, currentPage, totalPages } = requestData

            // 根据问题类型生成不同的模拟响应
            if (question.includes('摘要') || question.includes('总结')) {
                if (question.includes('当页') || question.includes(`第${currentPage}页`)) {
                    return `**第${currentPage}页内容总结：**

基于当前页面的文字内容，我为您总结如下要点：

• **主要内容**：这一页主要讨论了相关的研究方法和理论基础
• **关键概念**：涉及的核心概念包括研究设计、数据分析等
• **重要结论**：提出了几个重要的研究发现

*注：这是基于第${currentPage}页/${totalPages}页内容的AI分析总结*`
                } else {
                    return `**《${documentTitle}》文章摘要：**

基于整篇文档的内容分析，我为您生成以下摘要：

• **研究背景**：文档探讨了相关领域的重要问题和挑战
• **研究方法**：采用了系统性的研究方法和分析框架  
• **主要发现**：得出了几个关键性的研究结论
• **实际意义**：为相关领域的理论和实践提供了有价值的参考

*注：这是基于${totalPages}页完整文档的AI智能摘要*`
                }
            } else if (question.includes('解释') || question.includes('什么是')) {
                return `**概念解释：**

根据文档内容，我为您解释相关概念：

这个概念在学术研究中具有重要意义，通常指的是...

**相关要点：**
• 定义和特征
• 应用场景  
• 重要性分析

*如需更详细的解释，请提供具体的概念名称*`
            } else {
                return `**AI助手回复：**

感谢您的提问！基于当前文档内容，我理解您想了解的是：

${question}

**我的分析：**
• 这个问题涉及文档中的重要内容
• 结合上下文来看，相关信息显示...
• 建议您可以重点关注相关章节

*如需更具体的回答，请提供更详细的问题描述*`
            }
        }

        // 处理输入框键盘事件
        const handleInputKeydown = (event) => {
            // Enter 发送消息，Shift+Enter 换行
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage()
            }
        }

        return {
            inputText,
            loading,
            aiInputRef,
            aiMessagesContainer,
            messages,
            userAvatarUrl,
            aiAvatarUrl,
            handleUserAvatarError,
            formatMessage,
            scrollToBottom,
            addMessage,
            handlePresetQuestion,
            sendMessage,
            sendAiRequest,
            simulateAiResponse,
            handleInputKeydown
        }
    }
}
</script>

<style scoped>
/* ==================== AI 侧边栏样式 ==================== */

/* AI切换按钮 */
.ai-toggle-btn {
    position: fixed;
    left: 20px;
    bottom: 30px;
    z-index: 998;
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(52, 152, 219, 0.4);
    transition: all 0.3s ease;
    user-select: none;
}

.ai-toggle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(52, 152, 219, 0.5);
}

.ai-toggle-btn.ai-toggle-active {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);
}

.ai-toggle-btn.ai-toggle-active:hover {
    box-shadow: 0 6px 25px rgba(231, 76, 60, 0.5);
}

/* AI侧边栏容器 */
.ai-sidebar {
    position: fixed;
    left: -380px;
    top: 0;
    width: 380px;
    height: 100vh;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(230, 230, 230, 0.8);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 999;
    display: flex;
    flex-direction: column;
}

.ai-sidebar-open {
    left: 0;
}

/* 侧边栏头部 */
.ai-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 15px;
    border-bottom: 1px solid rgba(230, 230, 230, 0.8);
    background: rgba(52, 152, 219, 0.08);
}

.ai-header-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.ai-header-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
}

.ai-sidebar-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
}

.ai-close-btn {
    background: none;
    border: none;
    color: #6c757d;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ai-close-btn:hover {
    background: rgba(108, 117, 125, 0.1);
    color: #495057;
}

/* 对话区域 */
.ai-chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 消息区域 */
.ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.ai-messages::-webkit-scrollbar {
    width: 6px;
}

.ai-messages::-webkit-scrollbar-track {
    background: rgba(240, 240, 240, 0.5);
    border-radius: 3px;
}

.ai-messages::-webkit-scrollbar-thumb {
    background: rgba(52, 152, 219, 0.3);
    border-radius: 3px;
}

.ai-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(52, 152, 219, 0.5);
}

/* 欢迎消息 */
.ai-welcome {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 20px;
    background: rgba(52, 152, 219, 0.08);
    border-radius: 12px;
    border-left: 4px solid #3498db;
}

.ai-welcome .ai-avatar {
    font-size: 24px;
    flex-shrink: 0;
}

.ai-welcome-text p {
    margin: 0 0 12px 0;
    color: #2c3e50;
    font-weight: 500;
    text-align: left;
}

.ai-welcome-text ul {
    margin: 0;
    padding-left: 16px;
    color: #6c757d;
    text-align: left;
}

.ai-welcome-text li {
    margin-bottom: 4px;
    text-align: left;
}

/* 消息样式 */
.ai-message {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.ai-message.user {
    flex-direction: row-reverse;
}

.ai-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    background: #f5f5f5;
    overflow: hidden;
}

.ai-avatar .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.ai-message-content {
    flex: 1;
    max-width: calc(100% - 44px);
}

.ai-message.assistant .ai-message-content {
    background: transparent;
    border-radius: 12px 12px 12px 4px;
    padding: 12px 16px;
}

.ai-message.user .ai-message-content {
    background: #ebf6ff;
    color: rgb(0, 0, 0);
    border-radius: 12px 12px 4px 12px;
    padding: 12px 16px;
    text-align: left;
}

.ai-message-content p {
    margin: 0;
    line-height: 1.5;
    word-wrap: break-word;
    color: #000;
}

.ai-message-time {
    display: block;
    font-size: 11px;
    margin-top: 6px;
    opacity: 1;
    text-align: right;
    color: #666666;
}

.ai-message.user .ai-message-time {
    color: #666666;
    text-align: left;
}

.ai-message.assistant .ai-message-time {
    color: #666666;
}

/* 加载动画 */
.ai-typing {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 8px 0;
}

.ai-typing span {
    width: 6px;
    height: 6px;
    background: #3498db;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
}

.ai-typing span:nth-child(1) {
    animation-delay: -0.32s;
}

.ai-typing span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing {
    0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
    }
    40% {
        transform: scale(1);
        opacity: 1;
    }
}

/* 预设问题区域 */
.ai-preset-questions {
    padding: 15px 20px;
    border-top: 1px solid rgba(230, 230, 230, 0.8);
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(248, 249, 250, 0.5);
}

.ai-preset-btn {
    background: white;
    border: 1px solid rgba(230, 230, 230, 0.8);
    border-radius: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    color: #495057;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
}

.ai-preset-btn:hover:not(:disabled) {
    background: rgba(52, 152, 219, 0.05);
    border-color: rgba(52, 152, 219, 0.3);
    color: #3498db;
}

.ai-preset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 输入区域 */
.ai-input-area {
    padding: 20px;
    border-top: 1px solid rgba(230, 230, 230, 0.8);
    background: rgba(255, 255, 255, 0.8);
}

.ai-input-wrapper {
    position: relative;
    display: flex;
    align-items: flex-end;
}

.ai-input {
    flex: 1;
    border: 1px solid rgba(230, 230, 230, 0.8);
    border-radius: 12px;
    padding: 12px 50px 12px 16px;
    font-size: 14px;
    line-height: 1.4;
    resize: none;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
    background: white;
}

.ai-input:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.ai-input:disabled {
    background: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
}

.ai-send-btn {
    position: absolute;
    right: 8px;
    bottom: 8px;
    background: none;
    color: #9ca3af;
    border: none;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.ai-send-btn:hover:not(:disabled) {
    color: #3498db;
    background: rgba(52, 152, 219, 0.1);
}

.ai-send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .ai-sidebar {
        width: 100% !important;
        left: -100% !important;
        z-index: 1001;
    }
    
    .ai-sidebar-open {
        left: 0 !important;
    }
    
    .ai-toggle-btn {
        left: 15px !important;
        bottom: 20px !important;
        padding: 12px 16px !important;
        font-size: 14px !important;
    }
    
    .ai-toggle-btn svg {
        width: 18px !important;
        height: 18px !important;
    }
}
</style> 