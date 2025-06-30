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
                            <!-- 加载状态显示 -->
                            <div v-if="message.isLoading" class="ai-loading-content">
                                <span>{{ message.content }}</span>
                                <span class="loading-dots">
                                    <span>.</span>
                                    <span>.</span>
                                    <span>.</span>
                                </span>
                            </div>
                            <!-- 正常内容显示 -->
                            <div v-else style="text-align: left;" v-html="formatMessage(message.content, message.type)"></div>
                            <span class="ai-message-time">{{ message.timestamp }}</span>
                        </div>
                        <div class="ai-avatar user-avatar" v-if="message.type === 'user'">
                            <img :src="userAvatarUrl" alt="用户" class="avatar-img" @error="handleUserAvatarError"/>
                        </div>
                    </div>
                    
                    <!-- 加载中消息（只在没有AI消息正在生成时显示） -->
                    <div v-if="loading && !hasEmptyAiMessage" class="ai-message assistant">
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
import { generateChatStream } from '@/api/pdf'
import MarkdownIt from 'markdown-it'

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

        // 检查是否有AI消息正在生成（用于避免重复显示loading动画）
        const hasEmptyAiMessage = computed(() => {
            if (messages.value.length === 0) return false
            const lastMessage = messages.value[messages.value.length - 1]
            return lastMessage.type === 'assistant' && 
                   (lastMessage.isLoading || lastMessage.content === '')
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

        // 创建markdown解析器实例
        const md = new MarkdownIt({
            html: false,        // 禁用HTML标签以确保安全
            breaks: true,       // 支持换行转换为<br>
            linkify: true,      // 自动将URL转换为链接
            typographer: true   // 启用排版优化
        })

        // 格式化消息内容（AI消息支持markdown，用户消息保持简单格式）
        const formatMessage = (content, messageType = 'user') => {
            if (messageType === 'assistant') {
                // AI消息使用完整的markdown渲染
                return md.render(content)
            } else {
                // 用户消息保持简单的文本格式
            return content
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
            }
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
        const addMessage = (content, type = 'user', isLoading = false) => {
            const message = {
                id: messageIdCounter++,
                content,
                type,
                isLoading,
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
            if (type === 'summary') {
                // 检查是否有文档ID
                if (!props.documentInfo?.id) {
                    emit('error', '无法获取文档ID，请刷新页面重试')
                    return
                }

                const question = '📄 生成文章摘要'
                
                // 添加用户消息
                addMessage(question, 'user')

                // 发送AI流式摘要请求
                await sendAiSummaryRequest()
            } else if (type === 'current-page') {
                const question = `📖 总结第${props.currentPage}页的内容`
                const context = props.currentPageText

                if (!context.trim()) {
                    emit('error', '当前页面暂无可提取的文字内容')
                    return
            }

            // 添加用户消息
            addMessage(question, 'user')

                // 构建完整的问题，包含页面内容
                const fullMessage = `当前页面内容：\n${context}\n\n请总结第${props.currentPage}页的内容，包括主要观点、关键信息和核心结论。`

                // 发送流式对话请求
                await sendAiChatRequest(fullMessage)
            }
        }

        // 发送消息
        const sendMessage = async () => {
            const message = inputText.value.trim()
            if (!message || loading.value) return

            // 添加用户消息（显示原始问题）
            addMessage(message, 'user')

            // 清空输入框
            inputText.value = ''

            // 获取当前页面文字作为上下文
            const context = props.currentPageText || ''

            // 构建完整的问题，将当前页面内容拼接到问题前面
            let fullMessage = message
            if (context.trim()) {
                fullMessage = `当前页面内容：\n${context}\n\n用户问题：${message}`
            }

            // 发送AI对话请求（使用拼接后的完整消息）
            await sendAiChatRequest(fullMessage)
        }

        // 发送AI流式摘要请求
        const sendAiSummaryRequest = async () => {
            loading.value = true
            let aiMessage = null

            try {
                // 获取文章前五页的内容
                const firstFivePages = []
                for (let i = 1; i <= Math.min(5, props.totalPages); i++) {
                    const pageText = props.allTexts[i]
                    if (pageText && pageText.trim()) {
                        firstFivePages.push(`第${i}页：\n${pageText}`)
                    }
                }

                if (firstFivePages.length === 0) {
                    emit('error', '无法获取文档前五页内容，请等待PDF加载完成')
                    return
                }

                // 构建摘要请求的完整消息
                const pagesContent = firstFivePages.join('\n\n')
                const fullMessage = `请为以下学术文献的前五页内容生成详细的摘要，包括研究背景、目的、方法、主要发现和结论：

${pagesContent}

请生成一个结构化的摘要，包含以下方面：
1. 研究背景和问题
2. 研究目的和假设  
3. 研究方法和数据
4. 主要发现和结果
5. 结论和意义`

                console.log('发送AI摘要请求:', { 
                    documentTitle: props.documentInfo?.title,
                    pagesIncluded: firstFivePages.length,
                    contentLength: fullMessage.length 
                })

                // 创建一个AI消息并显示加载状态
                aiMessage = addMessage('🤔 正在分析文档内容', 'assistant', true)

                // 使用火山方舟对话API发起流式请求
                const success = await generateChatStream(
                    fullMessage,
                    // onData 回调：处理流式数据
                    (data) => {
                        appendStreamContent(aiMessage, data)
                    },
                    // onError 回调：处理错误
                    (error) => {
                        console.error('AI摘要生成错误:', error)
                        if (aiMessage) {
                            const messageIndex = messages.value.findIndex(m => m.id === aiMessage.id)
                            if (messageIndex > -1) {
                                messages.value[messageIndex].content = '抱歉，AI摘要生成失败，请稍后再试。\n\n' + 
                                    (error.includes('API密钥') ? '提示：API密钥配置可能有问题。' : '')
                            }
                        }
                        emit('error', 'AI摘要生成失败')
                    },
                    // onComplete 回调：处理完成
                    () => {
                        console.log('AI摘要生成完成')
                        // 确保滚动到底部
                        scrollToBottom()
                    }
                )

                if (!success) {
                    // 如果接口调用失败且没有创建消息，创建错误消息
                    if (!aiMessage) {
                        addMessage('抱歉，AI摘要生成失败，请稍后再试。', 'assistant')
                    }
                }

            } catch (error) {
                console.error('AI摘要请求失败:', error)
                
                // 如果已经创建了消息，更新其内容
                if (aiMessage) {
                    const messageIndex = messages.value.findIndex(m => m.id === aiMessage.id)
                    if (messageIndex > -1) {
                        messages.value[messageIndex].content = '抱歉，AI摘要生成失败，请稍后再试。'
                    }
                } else {
                    addMessage('抱歉，AI摘要生成失败，请稍后再试。', 'assistant')
                }
                
                emit('error', 'AI摘要生成失败')
            } finally {
                loading.value = false
            }
        }

        // 发送AI对话请求
        const sendAiChatRequest = async (message) => {
            loading.value = true
            let aiMessage = null

            try {
                console.log('发送AI对话请求:', { messageLength: message.length })

                // 创建一个AI消息并显示加载状态
                aiMessage = addMessage('🤔 正在思考您的问题', 'assistant', true)

                // 使用pdf.ts中的接口函数发起流式请求
                const success = await generateChatStream(
                    message,
                    // onData 回调：处理流式数据
                    (data) => {
                        appendStreamContent(aiMessage, data)
                    },
                    // onError 回调：处理错误
                    (error) => {
                        console.error('AI对话生成错误:', error)
                        if (aiMessage) {
                            const messageIndex = messages.value.findIndex(m => m.id === aiMessage.id)
                            if (messageIndex > -1) {
                                messages.value[messageIndex].content = '抱歉，AI对话失败，请稍后再试。\n\n' + 
                                    (error.includes('API密钥') ? '提示：API密钥未配置，请联系管理员设置。' : '')
                            }
                        }
                        emit('error', 'AI对话失败')
                    },
                    // onComplete 回调：处理完成
                    () => {
                        console.log('AI对话生成完成')
                        // 确保滚动到底部
                        scrollToBottom()
                    }
                )

                if (!success) {
                    // 如果接口调用失败且没有创建消息，创建错误消息
                    if (!aiMessage) {
                        addMessage('抱歉，AI对话失败，请稍后再试。', 'assistant')
                    }
                }

            } catch (error) {
                console.error('AI对话请求失败:', error)
                
                // 如果已经创建了消息，更新其内容
                if (aiMessage) {
                    const messageIndex = messages.value.findIndex(m => m.id === aiMessage.id)
                    if (messageIndex > -1) {
                        messages.value[messageIndex].content = '抱歉，AI对话失败，请稍后再试。'
                    }
                } else {
                    addMessage('抱歉，AI对话失败，请稍后再试。', 'assistant')
                }
                
                emit('error', 'AI对话失败')
            } finally {
                loading.value = false
            }
        }

        // 直接添加流式内容（修复单词顺序问题）
        const appendStreamContent = (messageObj, newContent) => {
            const messageIndex = messages.value.findIndex(m => m.id === messageObj.id)
            if (messageIndex === -1) return

            const currentMessage = messages.value[messageIndex]
            
            // 如果是第一次接收数据（处于加载状态），切换到正常状态并清空内容
            if (currentMessage.isLoading) {
                currentMessage.isLoading = false
                currentMessage.content = ''
            }

            // 直接追加流式内容
            currentMessage.content += newContent
            
            // 滚动到底部
            scrollToBottom()
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
            hasEmptyAiMessage,
            handleUserAvatarError,
            formatMessage,
            scrollToBottom,
            addMessage,
            handlePresetQuestion,
            sendMessage,
            sendAiSummaryRequest,
            sendAiChatRequest,
            appendStreamContent,
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

/* AI消息的markdown内容样式 */
.ai-message.assistant .ai-message-content div {
    line-height: 1.6;
    word-wrap: break-word;
    color: #000;
}

.ai-message.assistant .ai-message-content div p {
    margin: 0 0 12px 0;
}

.ai-message.assistant .ai-message-content div p:last-child {
    margin-bottom: 0;
}

.ai-message.assistant .ai-message-content div h1,
.ai-message.assistant .ai-message-content div h2,
.ai-message.assistant .ai-message-content div h3,
.ai-message.assistant .ai-message-content div h4,
.ai-message.assistant .ai-message-content div h5,
.ai-message.assistant .ai-message-content div h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;
    color: #2c3e50;
}

.ai-message.assistant .ai-message-content div h1 { font-size: 1.5em; }
.ai-message.assistant .ai-message-content div h2 { font-size: 1.3em; }
.ai-message.assistant .ai-message-content div h3 { font-size: 1.2em; }
.ai-message.assistant .ai-message-content div h4 { font-size: 1.1em; }
.ai-message.assistant .ai-message-content div h5 { font-size: 1.05em; }
.ai-message.assistant .ai-message-content div h6 { font-size: 1em; }

.ai-message.assistant .ai-message-content div ul,
.ai-message.assistant .ai-message-content div ol {
    margin: 8px 0;
    padding-left: 20px;
}

.ai-message.assistant .ai-message-content div li {
    margin: 4px 0;
    line-height: 1.5;
}

.ai-message.assistant .ai-message-content div blockquote {
    margin: 12px 0;
    padding: 8px 16px;
    border-left: 4px solid #3498db;
    background: rgba(52, 152, 219, 0.05);
    font-style: italic;
}

.ai-message.assistant .ai-message-content div code {
    background: rgba(52, 152, 219, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    color: #e74c3c;
}

.ai-message.assistant .ai-message-content div pre {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;
    margin: 12px 0;
    overflow-x: auto;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    line-height: 1.4;
}

.ai-message.assistant .ai-message-content div pre code {
    background: none;
    padding: 0;
    color: #333;
}

.ai-message.assistant .ai-message-content div strong {
    font-weight: 600;
    color: #2c3e50;
}

.ai-message.assistant .ai-message-content div em {
    font-style: italic;
    color: #666;
}

.ai-message.assistant .ai-message-content div a {
    color: #3498db;
    text-decoration: none;
}

.ai-message.assistant .ai-message-content div a:hover {
    text-decoration: underline;
}

.ai-message.assistant .ai-message-content div table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 0.9em;
}

.ai-message.assistant .ai-message-content div th,
.ai-message.assistant .ai-message-content div td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
}

.ai-message.assistant .ai-message-content div th {
    background: #f8f9fa;
    font-weight: 600;
}

/* AI加载状态样式 */
.ai-loading-content {
    color: #666 !important;
    font-style: italic;
    display: flex;
    align-items: center;
    gap: 2px;
}

.ai-loading-content span:first-child {
    color: #666;
}

/* 加载点动画 */
.loading-dots {
    display: inline-flex;
    margin-left: 2px;
}

.loading-dots span {
    color: #666;
    animation: loadingDot 1.4s infinite;
    animation-fill-mode: both;
}

.loading-dots span:nth-child(1) {
    animation-delay: 0s;
}

.loading-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes loadingDot {
    0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
    }
    40% {
        opacity: 1;
        transform: scale(1);
    }
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