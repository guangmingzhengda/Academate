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
                            :key="question.questionId" 
                            class="question-item"
                            @click="viewQuestion(question)"
                        >
                            <div class="question-content">
                                <div class="question-title">{{ question.questionTitle }}</div>
                                <div class="question-description">{{ question.questionDescription || '暂无问题描述' }}</div>
                                <div class="question-meta">
                                    <div class="meta-left">
                                        <div class="question-author">
                                            <div class="author-avatar" :style="{ backgroundColor: getAuthorColor(question.userId) }">
                                                {{ question.userName.charAt(0) }}
                                            </div>
                                            <span class="author-name">{{ question.userName }}</span>
                                        </div>
                                        <div class="question-date">{{ formatDate(question.askedAt) }}</div>
                                    </div>
                                    <div class="meta-right">
                                        <div class="question-stats">
                                            <span class="stat-item">
                                                <el-icon><ChatDotRound /></el-icon>
                                                {{ question.answerCount || 0 }} 回答
                                            </span>
                                            <span class="stat-item">
                                                <el-icon><View /></el-icon>
                                                {{ question.likeCount || 0 }} 关注
                                            </span>

                                        </div>
                                        <div class="follow-section">
                                            <el-button
                                                :type="question.isLiked ? 'primary' : 'default'"
                                                size="small"
                                                @click.stop="toggleFollow(question)"
                                                class="follow-btn"
                                            >
                                                <el-icon v-if="question.isLiked"><StarFilled /></el-icon>
                                                <el-icon v-else><Star /></el-icon>
                                                {{ question.isLiked ? '已关注' : '关注' }}
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
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, ChatDotRound, View, Star, StarFilled } from '@element-plus/icons-vue'
import { callSuccess, callInfo } from '@/call'
import { getQuestionList, createQuestion } from '@/api/question'
import { useRouter } from 'vue-router'

export default {
    name: 'questionHall',
    setup() {
        const router = useRouter()
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(10)
        const total = ref(0)
        
        // 搜索相关
        const searchKeyword = ref('')
        
        // 对话框相关
        const createDialogVisible = ref(false)
        const questionFormRef = ref()
        
        // 表单数据
        const questionForm = ref({
            title: '',
            content: ''
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
        
        // 问题数据
        const questions = ref([])
        
        // 加载问题列表数据
        const loadQuestions = async () => {
            try {
                const data = await getQuestionList({
                    current: currentPage.value,
                    size: pageSize.value
                })
                questions.value = data
                total.value = data.length // 实际项目中这个值应该从后端获取
                console.log(questions.value);
            } catch (error) {
                console.error('加载问题列表失败:', error)
            }
        }

        // 在组件挂载时加载数据
        onMounted(() => {
            loadQuestions()
        })
        
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
                question.questionTitle.toLowerCase().includes(keyword) ||
                question.userName.toLowerCase().includes(keyword)
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
            loadQuestions()
        }
        
        // 分页处理
        const handlePageChange = (page) => {
            currentPage.value = page
            loadQuestions()
        }
        
        // 获取作者头像颜色
        const getAuthorColor = (userId) => {
            return avatarColors[userId % avatarColors.length]
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
                content: ''
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
                
                // 调用创建问题的API
                const response = await createQuestion({
                    questionTitle: questionForm.value.title,
                    questionDescription: questionForm.value.content
                })
                
                if (response.code === 0) {
                    await loadQuestions() // 重新加载问题列表
                    callSuccess('问题发布成功！')
                    closeCreateDialog()
                } else {
                    callInfo(response.message || '创建问题失败，请重试')
                }
                
            } catch (error) {
                console.error('创建问题失败:', error)
                callInfo('创建问题失败，请重试')
            }
        }
        
        // 查看问题详情
        const viewQuestion = (question) => {
            router.push(`/question/${question.questionId}`)
        }
        
        // 关注和取消关注逻辑
        const toggleFollow = (question) => {
            question.isLiked = !question.isLiked
            if (question.isLiked) {
                callSuccess(`已关注问题: ${question.questionTitle}`)
            } else {
                callInfo(`已取消关注问题: ${question.questionTitle}`)
            }
        }
        
        return {
            currentPage,
            pageSize,
            total,
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