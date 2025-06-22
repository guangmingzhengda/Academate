<template>
    <div class="bg-container"/>
    
    <div style="display: flex; justify-content: center; width: 100%; height: 100%;">
        <div class="question-hall-container">
            <div class="question-hall-content">
                
                <!-- 页面标题和操作区域 -->
                <div class="header-section">
                    <!-- 页面标题 -->
                    <div class="page-header">
                        <h2>提问大厅</h2>
                        <p>在这里提出您的问题，与学术社区一起探讨</p>
                    </div>

                    <!-- 搜索和新建问题区域 -->
                    <div class="search-create-section">
                        <div class="search-area">
                            <el-input
                                v-model="searchKeyword"
                                placeholder="搜索问题..."
                                style="width: 100%;"
                                clearable
                                @input="handleSearch"
                                size="large"
                            >
                                <template #prefix>
                                    <el-icon><Search /></el-icon>
                                </template>
                            </el-input>
                        </div>
                        
                        <div class="create-area">
                            <el-button 
                                type="primary" 
                                size="large"
                                @click="openCreateDialog"
                            >
                                <el-icon><Plus /></el-icon>
                                新建问题
                            </el-button>
                        </div>
                    </div>
                </div>

                <!-- 问题列表 -->
                <div class="questions-section">
                    <div v-if="filteredQuestions.length === 0" class="empty-state">
                        <el-empty description="暂无问题，快来提出第一个问题吧！" />
                    </div>
                    
                    <div v-else class="questions-list">
                        <div 
                            v-for="question in currentPageQuestions" 
                            :key="question.id" 
                            class="question-item"
                            @click="viewQuestion(question)"
                        >
                            <div class="question-content">
                                <div class="question-title">{{ question.title }}</div>
                                <div class="question-description">{{ question.content }}</div>
                                <div class="question-meta">
                                    <div class="meta-left">
                                        <div class="question-author">
                                            <div class="author-avatar" :style="{ backgroundColor: getAuthorColor(question.authorId) }">
                                                {{ question.author.charAt(0) }}
                                            </div>
                                            <span class="author-name">{{ question.author }}</span>
                                        </div>
                                        <div class="question-date">{{ formatDate(question.createTime) }}</div>
                                    </div>
                                    <div class="meta-right">
                                        <div class="question-stats">
                                            <span class="stat-item">
                                                <el-icon><ChatDotRound /></el-icon>
                                                {{ question.answerCount || 0 }} 回答
                                            </span>
                                            <span class="stat-item">
                                                <el-icon><View /></el-icon>
                                                {{ question.viewCount || 0 }} 浏览
                                            </span>
                                        </div>
                                        <div class="follow-section">
                                            <el-button
                                                :type="question.isFollowed ? 'primary' : 'default'"
                                                size="small"
                                                @click.stop="toggleFollow(question)"
                                                class="follow-btn"
                                            >
                                                <el-icon v-if="question.isFollowed"><StarFilled /></el-icon>
                                                <el-icon v-else><Star /></el-icon>
                                                {{ question.isFollowed ? '已关注' : '关注' }}
                                            </el-button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 分页 -->
                    <el-pagination
                        v-if="filteredQuestions.length > pageSize"
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="filteredQuestions.length"
                        layout="prev, pager, next, jumper, total"
                        class="pagination"
                        @current-change="handlePageChange"
                    />
                </div>

            </div>
        </div>
    </div>

    <!-- 新建问题对话框 -->
    <el-dialog 
        v-model="createDialogVisible" 
        title=""
        width="700px"
        @close="closeCreateDialog"
    >
        <div class="create-question-section">
            <h3>提出新问题</h3>
            
            <el-form :model="questionForm" :rules="questionRules" ref="questionFormRef" label-width="80px">
                <el-form-item label="问题标题" prop="title">
                    <el-input 
                        v-model="questionForm.title" 
                        placeholder="请输入问题标题，简洁明了地描述您的问题"
                        maxlength="100"
                        show-word-limit
                    />
                </el-form-item>
                
                <el-form-item label="问题描述" prop="content">
                    <el-input 
                        v-model="questionForm.content" 
                        type="textarea"
                        :rows="8"
                        placeholder="请详细描述您的问题，包括背景信息、具体困难等，这将帮助其他人更好地理解和回答您的问题"
                        maxlength="2000"
                        show-word-limit
                    />
                </el-form-item>
                
                <el-form-item label="问题标签" prop="tags">
                    <el-input 
                        v-model="questionForm.tagsInput" 
                        placeholder="请输入相关标签，用逗号分隔，如：机器学习,深度学习,Python"
                        maxlength="200"
                    />
                    <div class="tags-tip">标签有助于其他用户快速找到您的问题</div>
                </el-form-item>
            </el-form>
        </div>
        
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="closeCreateDialog">取消</el-button>
                <el-button type="primary" @click="submitQuestion">发布问题</el-button>
            </div>
        </template>
    </el-dialog>

</template>

<script>
import { ref, computed } from 'vue'
import { Search, Plus, ChatDotRound, View, Star, StarFilled } from '@element-plus/icons-vue'
import { callSuccess, callInfo } from '@/call'

export default {
    name: 'questionHall',
    setup() {
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(10)
        
        // 搜索相关
        const searchKeyword = ref('')
        
        // 对话框相关
        const createDialogVisible = ref(false)
        const questionFormRef = ref()
        
        // 表单数据
        const questionForm = ref({
            title: '',
            content: '',
            tagsInput: ''
        })
        
        // 表单验证规则
        const questionRules = {
            title: [
                { required: true, message: '请输入问题标题', trigger: 'blur' },
                { min: 5, max: 100, message: '标题长度应在5-100个字符之间', trigger: 'blur' }
            ],
            content: [
                { required: true, message: '请输入问题描述', trigger: 'blur' },
                { min: 10, max: 2000, message: '描述长度应在10-2000个字符之间', trigger: 'blur' }
            ]
        }
        
        // 问题数据（模拟数据）
        const questions = ref([
            {
                id: 1,
                title: '如何在深度学习中处理过拟合问题？',
                content: '我在训练一个图像分类模型时遇到了严重的过拟合问题，训练集准确率很高但验证集准确率很低。我已经尝试了dropout和数据增强，但效果不太明显。请问还有什么其他的方法可以缓解过拟合？',
                author: '张同学',
                authorId: 1,
                createTime: '2024-01-15 14:30:00',
                tags: ['深度学习', '过拟合', '机器学习'],
                answerCount: 12,
                viewCount: 156,
                isFollowed: false
            },
            {
                id: 2,
                title: 'Transformer模型中的注意力机制是如何工作的？',
                content: '我正在学习Transformer架构，但对其中的自注意力机制还不是很理解。能否详细解释一下Query、Key、Value是如何计算的，以及多头注意力的作用是什么？',
                author: '李研究员',
                authorId: 2,
                createTime: '2024-01-14 09:15:00',
                tags: ['Transformer', '注意力机制', 'NLP'],
                answerCount: 8,
                viewCount: 203,
                isFollowed: false
            },
            {
                id: 3,
                title: '联邦学习在医疗数据隐私保护中的应用前景如何？',
                content: '最近在研究联邦学习，想了解它在医疗领域的应用。医疗数据涉及隐私问题，传统的集中式机器学习方法不太适用。联邦学习能否有效解决这个问题？有哪些挑战和限制？',
                author: '王医生',
                authorId: 3,
                createTime: '2024-01-13 16:45:00',
                tags: ['联邦学习', '医疗数据', '隐私保护'],
                answerCount: 5,
                viewCount: 89,
                isFollowed: false
            },
            {
                id: 4,
                title: 'GraphQL相比REST API有什么优势？',
                content: '我们团队正在考虑从REST API迁移到GraphQL。听说GraphQL可以减少网络请求次数，提高数据获取效率。但也担心学习成本和迁移成本。请问有经验的开发者能分享一下实际使用感受吗？',
                author: '陈工程师',
                authorId: 4,
                createTime: '2024-01-12 11:20:00',
                tags: ['GraphQL', 'REST API', 'Web开发'],
                answerCount: 15,
                viewCount: 267,
                isFollowed: false
            },
            {
                id: 5,
                title: '量子计算对传统密码学会产生什么影响？',
                content: '随着量子计算技术的发展，我很担心现有的加密算法会被破解。RSA、AES等传统加密算法在量子计算面前还安全吗？有什么应对措施？量子密码学是解决方案吗？',
                author: '赵教授',
                authorId: 5,
                createTime: '2024-01-11 13:10:00',
                tags: ['量子计算', '密码学', '信息安全'],
                answerCount: 7,
                viewCount: 134,
                isFollowed: false
            },
            {
                id: 6,
                title: 'Docker容器化部署时如何优化镜像大小？',
                content: '我们的应用Docker镜像越来越大，已经超过2GB了，部署速度很慢。请问有什么方法可以优化镜像大小？多阶段构建、Alpine Linux这些方法的效果如何？',
                author: '孙运维',
                authorId: 6,
                createTime: '2024-01-10 08:30:00',
                tags: ['Docker', '容器化', '运维'],
                answerCount: 11,
                viewCount: 178,
                isFollowed: false
            },
            {
                id: 7,
                title: '如何评估机器学习模型的公平性？',
                content: '在开发AI系统时，我们需要确保模型不会产生歧视性结果。请问有什么指标和方法可以评估模型的公平性？如何在准确性和公平性之间找到平衡？',
                author: '刘博士',
                authorId: 7,
                createTime: '2024-01-09 15:45:00',
                tags: ['机器学习', '算法公平性', 'AI伦理'],
                answerCount: 6,
                viewCount: 112,
                isFollowed: false
            },
            {
                id: 8,
                title: 'Vue 3的Composition API相比Options API有什么优势？',
                content: '正在学习Vue 3，发现有Composition API这个新特性。相比传统的Options API，它有什么优势？什么时候应该使用Composition API？学习曲线如何？',
                author: '马前端',
                authorId: 8,
                createTime: '2024-01-08 10:15:00',
                tags: ['Vue 3', 'Composition API', '前端开发'],
                answerCount: 9,
                viewCount: 145,
                isFollowed: false
            },
            {
                id: 9,
                title: '边缘计算在物联网中的应用场景有哪些？',
                content: '最近在研究边缘计算技术，想了解它在物联网领域的具体应用。相比云计算，边缘计算在IoT场景下有什么独特优势？有哪些成功的应用案例？',
                author: '周架构师',
                authorId: 9,
                createTime: '2024-01-07 14:20:00',
                tags: ['边缘计算', '物联网', 'IoT'],
                answerCount: 4,
                viewCount: 87,
                isFollowed: false
            },
            {
                id: 10,
                title: '强化学习在游戏AI中的应用原理是什么？',
                content: '看到AlphaGo、OpenAI Five等游戏AI都使用了强化学习技术。想了解强化学习是如何让AI学会玩游戏的？Q-learning、策略梯度这些算法在游戏中是如何应用的？',
                author: '吴学生',
                authorId: 10,
                createTime: '2024-01-06 09:30:00',
                tags: ['强化学习', '游戏AI', '人工智能'],
                answerCount: 13,
                viewCount: 234,
                isFollowed: false
            },
            {
                id: 11,
                title: '微服务架构中如何处理分布式事务？',
                content: '我们正在将单体应用拆分为微服务，但遇到了分布式事务的问题。SAGA模式、两阶段提交、事件溯源这些方案各有什么优缺点？在实际项目中应该如何选择？',
                author: '郑架构师',
                authorId: 11,
                createTime: '2024-01-05 16:10:00',
                tags: ['微服务', '分布式事务', '系统架构'],
                answerCount: 8,
                viewCount: 167,
                isFollowed: false
            },
            {
                id: 12,
                title: 'WebAssembly的性能优势在哪些场景下最明显？',
                content: '听说WebAssembly可以在浏览器中运行接近原生性能的代码。想了解它适用于哪些具体场景？相比JavaScript，性能提升有多大？开发成本如何？',
                author: '韩开发者',
                authorId: 12,
                createTime: '2024-01-04 12:45:00',
                tags: ['WebAssembly', 'Web性能', '浏览器技术'],
                answerCount: 6,
                viewCount: 98,
                isFollowed: false
            }
        ])
        
        // 头像颜色数组
        const avatarColors = [
            '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
            '#9c27b0', '#ff9800', '#4caf50', '#2196f3', '#ff5722',
            '#795548', '#607d8b', '#e91e63', '#00bcd4', '#8bc34a'
        ]
        
        // 过滤后的问题列表
        const filteredQuestions = computed(() => {
            if (!searchKeyword.value) {
                return questions.value
            }
            
            const keyword = searchKeyword.value.toLowerCase()
            return questions.value.filter(question =>
                question.title.toLowerCase().includes(keyword) ||
                question.content.toLowerCase().includes(keyword) ||
                question.author.toLowerCase().includes(keyword) ||
                question.tags.some(tag => tag.toLowerCase().includes(keyword))
            )
        })
        
        // 当前页问题数据
        const currentPageQuestions = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return filteredQuestions.value.slice(start, end)
        })
        
        // 搜索处理
        const handleSearch = () => {
            currentPage.value = 1
        }
        
        // 分页处理
        const handlePageChange = (page) => {
            currentPage.value = page
        }
        
        // 获取作者头像颜色
        const getAuthorColor = (authorId) => {
            return avatarColors[authorId % avatarColors.length]
        }
        
        // 格式化日期
        const formatDate = (dateString) => {
            const date = new Date(dateString)
            const now = new Date()
            const diff = now - date
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            
            if (days === 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60))
                if (hours === 0) {
                    const minutes = Math.floor(diff / (1000 * 60))
                    return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
                }
                return `${hours}小时前`
            } else if (days === 1) {
                return '昨天'
            } else if (days < 7) {
                return `${days}天前`
            } else {
                return date.toLocaleDateString('zh-CN')
            }
        }
        
        // 打开新建问题对话框
        const openCreateDialog = () => {
            questionForm.value = {
                title: '',
                content: '',
                tagsInput: ''
            }
            createDialogVisible.value = true
        }
        
        // 关闭新建问题对话框
        const closeCreateDialog = () => {
            createDialogVisible.value = false
            questionFormRef.value?.clearValidate()
        }
        
        // 提交问题
        const submitQuestion = async () => {
            try {
                await questionFormRef.value.validate()
                
                const newQuestion = {
                    id: Date.now(),
                    title: questionForm.value.title,
                    content: questionForm.value.content,
                    author: 'HHH', // 当前用户
                    authorId: 999, // 当前用户ID
                    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    tags: questionForm.value.tagsInput ? questionForm.value.tagsInput.split(',').map(tag => tag.trim()) : [],
                    answerCount: 0,
                    viewCount: 0,
                    isFollowed: false
                }
                
                questions.value.unshift(newQuestion)
                callSuccess('问题发布成功！')
                closeCreateDialog()
                
            } catch (error) {
                console.error('表单验证失败:', error)
            }
        }
        
        // 查看问题详情
        const viewQuestion = (question) => {
            // 增加浏览量
            question.viewCount++
            // 这里可以跳转到问题详情页面
            callInfo(`查看问题: ${question.title}`)
        }
        
        // 关注和取消关注逻辑
        const toggleFollow = (question) => {
            question.isFollowed = !question.isFollowed
            if (question.isFollowed) {
                callSuccess(`已关注问题: ${question.title}`)
            } else {
                callInfo(`已取消关注问题: ${question.title}`)
            }
        }
        
        return {
            currentPage,
            pageSize,
            searchKeyword,
            createDialogVisible,
            questionFormRef,
            questionForm,
            questionRules,
            questions,
            filteredQuestions,
            currentPageQuestions,
            handleSearch,
            handlePageChange,
            getAuthorColor,
            formatDate,
            openCreateDialog,
            closeCreateDialog,
            submitQuestion,
            viewQuestion,
            toggleFollow
        }
    }
}
</script>

<style scoped>
.bg-container {
    background: url('@/asset/home/homehead.png');
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -2;
    top: 0;
    left: 0;
    background-size: cover;
}

.question-hall-container {
    min-height: 100vh;
    margin-top: 100px;
    display: flex;
    justify-content: center;
    width: 1400px;
}

.question-hall-content {
    max-width: 1200px;
    width: 100%;
    padding: 0 20px;
}

/* 整个头部区域 */
.header-section {
    margin-bottom: 30px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    padding: 30px;
}

/* 页面标题 */
.page-header {
    text-align: left;
    margin-bottom: 30px;
}

.page-header h2 {
    font-family: 'Meiryo', sans-serif;
    font-size: 32px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0 0 10px 0;
}

.page-header p {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    color: #7f8c8d;
    margin: 0;
}

/* 搜索和新建区域 */
.search-create-section {
    display: flex;
    gap: 20px;
}

.search-area {
    flex: 1;
}

.create-area {
    flex-shrink: 0;
}

/* 问题列表区域 */
.questions-section {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    padding: 30px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
}

.questions-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.question-item {
    padding: 25px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #fff;
}

.question-item:hover {
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    transform: translateY(-2px);
}

.question-content {
    width: 100%;
}

.question-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 18px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 12px;
    line-height: 1.4;
    text-align: left;
}

.question-description {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 15px;
    text-align: left;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.question-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.meta-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.question-author {
    display: flex;
    align-items: center;
    gap: 8px;
}

.author-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 10px;
}

.author-name {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #409eff;
    font-weight: 500;
}

.question-date {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #999;
}

.meta-right {
    display: flex;
    align-items: center;
    gap: 15px;
}

.question-stats {
    display: flex;
    gap: 15px;
}

.follow-section {
    display: flex;
    align-items: center;
}

.follow-btn {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.follow-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #999;
}

.stat-item .el-icon {
    font-size: 14px;
}

/* 分页 */
.pagination {
    margin-top: 30px;
    display: flex;
    justify-content: center;
}

/* 新建问题对话框 */
.create-question-section {
    padding: 20px 0;
}

.create-question-section h3 {
    font-family: 'Meiryo', sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0 0 25px 0;
    text-align: center;
}

.tags-tip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .question-hall-container {
        width: 100%;
        margin-top: 80px;
    }
    
    .question-hall-content {
        padding: 0 15px;
    }
    
    .page-header {
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .page-header h2 {
        font-size: 24px;
    }
    
    .search-create-section {
        flex-direction: column;
        gap: 15px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .questions-section {
        padding: 20px;
    }
    
    .question-item {
        padding: 20px;
    }
    
    .question-title {
        font-size: 16px;
    }
    
    .question-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .meta-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .question-stats {
        gap: 10px;
    }
    
    .follow-section {
        margin-top: 10px;
    }
    
    .follow-btn {
        font-size: 11px;
        padding: 4px 8px;
    }
}
</style> 