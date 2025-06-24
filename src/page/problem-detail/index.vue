<template>
    <div class="bg-container"/>
    <div class="bg-strong-container"/>
    <div style="width: 100%; height: 100%; display: flex; justify-content: center; margin-top: 70px">
        <div style="width: 1400px">
            <el-container class="el-main" style="display: flex;">
                <el-row style="width: 100%; display: flex;" :gutter="24">
                    <el-col :span="17">
                        <div class="main-container" style="width: 100%;">
                            <div v-if="loading" class="loading-container">
                                <el-skeleton :rows="10" animated />
                            </div>
                            <div v-else-if="questionData">
                                <div class="header-container">
                                    <div class="header-title">{{ questionData.questionTitle }}</div>
                                    <div class="info-container">
                                        <div class="detail-info">
                                            <span class="info-label">提问者：</span>
                                            <span>{{ questionData.userName }}</span>
                                        </div>
                                        <div class="detail-info" v-if="questionData.askedAt">
                                            <span class="info-label">提问时间：</span>
                                            <span>{{ formatDate(questionData.askedAt) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="down-container">
                                    <div class="abstract-title">问题描述</div>
                                    <div class="abstract-content">
                                        {{ questionData.questionDescription || '该问题暂无详细描述' }}
                                    </div>
                                </div>
                                
                                <!-- 回答列表 -->
                                <div class="down-container" v-if="questionData.answers && questionData.answers.length > 0">
                                    <div class="answers-title">全部回答 ({{ questionData.answerCount }})</div>
                                    <div class="answers-list">
                                        <div v-for="(answer, index) in questionData.answers" :key="index" class="answer-item">
                                            <div class="answer-header">
                                                <div class="user-info">
                                                    <img :src="answer.userAvatar || defaultAvatar" class="avatar" alt="用户头像">
                                                    <div>
                                                        <div class="username">{{ answer.userName }}</div>
                                                        <div class="timestamp">{{ formatDate(answer.answeredAt) }}</div>
                                                    </div>
                                                </div>
                                                <div class="answer-actions">
                                                    <el-button 
                                                        size="small" 
                                                        :type="answer.isLiked ? 'primary' : 'default'"
                                                        icon="el-icon-thumb"
                                                        @click="handleLike(answer)"
                                                        :loading="answer.likeLoading"
                                                    >
                                                        {{ answer.likeCount }}
                                                    </el-button>
                                                    <el-button size="small" icon="el-icon-chat-dot-round" @click="replyToAnswer(answer.answerId)">回复</el-button>
                                                </div>
                                            </div>
                                            <div class="answer-content">{{ answer.answerText }}</div>
                                            
                                            <!-- 嵌套回复 -->
                                            <div v-if="answer.children && answer.children.length > 0" class="nested-answers">
                                                <div v-for="(childAnswer, childIndex) in answer.children" 
                                                     :key="childIndex" 
                                                     class="nested-answer-item">
                                                    <div class="answer-header">
                                                        <div class="user-info">
                                                            <img :src="childAnswer.userAvatar || defaultAvatar" class="avatar small-avatar" alt="用户头像">
                                                            <div>
                                                                <div class="username">{{ childAnswer.userName }}</div>
                                                                <div class="timestamp">{{ formatDate(childAnswer.answeredAt) }}</div>
                                                            </div>
                                                        </div>
                                                        <div class="answer-actions">
                                                            <el-button 
                                                                size="small" 
                                                                :type="childAnswer.isLiked ? 'primary' : 'default'"
                                                                icon="el-icon-thumb"
                                                                @click="handleLike(childAnswer)"
                                                                :loading="childAnswer.likeLoading"
                                                            >
                                                                {{ childAnswer.likeCount }}
                                                            </el-button>
                                                        </div>
                                                    </div>
                                                    <div class="answer-content">{{ childAnswer.answerText }}</div>

                                                    <!-- 三级回复 (如果有) -->
                                                    <div v-if="childAnswer.children && childAnswer.children.length > 0" class="nested-answers deeper">
                                                        <div v-for="(grandChildAnswer, grandChildIndex) in childAnswer.children" 
                                                            :key="grandChildIndex" 
                                                            class="nested-answer-item">
                                                            <div class="answer-header">
                                                                <div class="user-info">
                                                                    <img :src="grandChildAnswer.userAvatar || defaultAvatar" class="avatar smaller-avatar" alt="用户头像">
                                                                    <div>
                                                                        <div class="username">{{ grandChildAnswer.userName }}</div>
                                                                        <div class="timestamp">{{ formatDate(grandChildAnswer.answeredAt) }}</div>
                                                                    </div>
                                                                </div>
                                                                <div class="answer-actions">
                                                                    <el-button 
                                                                        size="small" 
                                                                        :type="grandChildAnswer.isLiked ? 'primary' : 'default'"
                                                                        icon="el-icon-thumb"
                                                                        @click="handleLike(grandChildAnswer)"
                                                                        :loading="grandChildAnswer.likeLoading"
                                                                    >
                                                                        {{ grandChildAnswer.likeCount }}
                                                                    </el-button>
                                                                </div>
                                                            </div>
                                                            <div class="answer-content">{{ grandChildAnswer.answerText }}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="empty-answers">
                                    <div class="empty-text">暂无回答，快来成为第一个回答者吧！</div>
                                    <el-button type="primary" @click="showAnswerDialog">我来回答</el-button>
                                </div>
                                
                                <!-- 回答对话框 -->
                                <el-dialog
                                    v-model="answerDialogVisible"
                                    :title="currentParentId ? '回复回答' : '撰写回答'"
                                    width="600px"
                                >
                                    <el-input
                                        type="textarea"
                                        v-model="answerText"
                                        :rows="8"
                                        placeholder="请输入您的回答..."
                                    ></el-input>
                                    <template #footer>
                                        <span class="dialog-footer">
                                            <el-button @click="answerDialogVisible = false">取消</el-button>
                                            <el-button type="primary" @click="submitAnswer">提交回答</el-button>
                                        </span>
                                    </template>
                                </el-dialog>
                            </div>
                            <div v-else class="error-container">
                                <el-empty description="未找到该问题或加载失败"></el-empty>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="7">
                        <div class="side-container">
                            <problem-side-component :questionId="questionId" @answer-click="showAnswerDialog" />
                        </div>
                    </el-col>
                </el-row>
            </el-container>
        </div>
    </div>
</template>

<script lang="js">
import ProblemSideComponent from "./side-component/index.vue";
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { getQuestionDetail, createAnswer, likeAnswer, cancelLikeAnswer, getAnswerLikeCount } from "@/api/question";
import { ElMessage } from "element-plus";
import store from "@/store";

export default {
    name: "problem-detail",
    components: { ProblemSideComponent },
    setup() {
        const route = useRoute();
        const questionId = ref(Number(route.params.id) || null);
        const questionData = ref(null);
        const loading = ref(true);
        const defaultAvatar = '/src/asset/home/user.png';
        const answerText = ref('');
        const answerDialogVisible = ref(false);
        const currentParentId = ref(null);
        
        // 过滤一级回答（主回答）
        const mainAnswers = computed(() => {
            if (!questionData.value || !questionData.value.answers) return [];
            return questionData.value.answers.filter(answer => answer.layer === 1);
        });
        
        // 加载问题详情
        const loadQuestionDetail = async () => {
            loading.value = true;
            try {
                if (questionId.value) {
                    const data = await getQuestionDetail(questionId.value);
                                    if (data) {
                    // 为每个回答添加点赞加载状态属性
                    const processAnswers = (answers) => {
                        if (!answers) return [];
                        return answers.map(answer => {
                            const processed = { ...answer, likeLoading: false };
                            if (processed.children && processed.children.length > 0) {
                                processed.children = processAnswers(processed.children);
                            }
                            return processed;
                        });
                    };
                    
                    data.answers = processAnswers(data.answers);
                    questionData.value = data;
                } else {
                        ElMessage.error('获取问题详情失败');
                    }
                } else {
                    // 没有问题ID时使用静态数据
                    questionData.value = {
                                                                questionId: 1,
                                        questionTitle: "前端开发中如何优化性能？",
                                        questionDescription: "我正在开发一个复杂的单页应用，随着功能增加，页面加载变得越来越慢。请问有哪些有效的前端性能优化策略？",
                                        askedAt: "2024-07-02T15:30:00",
                                        userId: 10,
                                        userName: "技术爱好者",
                                        userAvatar: null,
                                        answers: [
                                            {
                                                answerId: 101,
                                                questionId: 1,
                                                answerText: "优化资源加载是关键，可以使用懒加载、代码分割、图片压缩等技术。此外，减少DOM操作、避免重排重绘也很重要。",
                                                answeredAt: "2024-07-02T16:15:00",
                                                userId: 15,
                                                userName: "前端专家",
                                                userAvatar: null,
                                                layer: 1,
                                                parentAnswer: null,
                                                likeCount: 12,
                                                isLiked: false,
                                                likeLoading: false
                                            },
                            {
                                answerId: 102,
                                questionId: 1,
                                answerText: "可以考虑使用Web Workers处理复杂计算，防止主线程阻塞。合理使用缓存策略也能大幅提升性能。",
                                answeredAt: "2024-07-02T17:20:00",
                                userId: 22,
                                userName: "性能优化达人",
                                userAvatar: null,
                                layer: 1,
                                                                                parentAnswer: null,
                                                likeCount: 8,
                                                isLiked: false,
                                                likeLoading: false
                            },
                            {
                                answerId: 103,
                                questionId: 1,
                                answerText: "完全同意，另外也可以考虑使用SSR或预渲染技术。",
                                answeredAt: "2024-07-02T18:05:00",
                                userId: 18,
                                userName: "Vue爱好者",
                                userAvatar: null,
                                layer: 2,
                                                                                parentAnswer: 101,
                                                likeCount: 5,
                                                isLiked: false,
                                                likeLoading: false
                            }
                        ],
                        answerCount: 3,
                        likeCount: 15,
                        isLiked: false
                    };
                }
            } catch (error) {
                console.error('获取问题详情失败:', error);
                ElMessage.error('获取问题详情失败');
            } finally {
                loading.value = false;
            }
        };
        
        // 显示回答对话框
        const showAnswerDialog = () => {
            // 清空父回答ID，表示这是对问题的直接回答
            currentParentId.value = null;
            answerDialogVisible.value = true;
        };
        
        // 回复特定回答
        const replyToAnswer = (answerId) => {
            currentParentId.value = answerId;
            answerText.value = '';
            answerDialogVisible.value = true;
        };
        
        // 提交回答
        const submitAnswer = async () => {
            if (!answerText.value.trim()) {
                ElMessage.warning('回答内容不能为空');
                return;
            }
            
            if (!questionId.value) {
                ElMessage.warning('问题ID不存在');
                return;
            }
            
            try {
                // 构建回答请求
                const answerRequest = {
                    questionId: questionId.value,
                    answerText: answerText.value.trim()
                };
                
                // 如果是回复其他回答，添加父回答ID
                if (currentParentId.value) {
                    answerRequest.parentAnswerId = currentParentId.value;
                }
                
                // 发送创建回答请求
                const answerId = await createAnswer(answerRequest);
                
                if (answerId !== null) {
                    ElMessage.success('回答已提交');
                    answerText.value = '';
                    answerDialogVisible.value = false;
                    
                    // 重新加载问题详情，显示新回答
                    await loadQuestionDetail();
                }
            } catch (error) {
                console.error('提交回答失败:', error);
                ElMessage.error('提交回答失败，请稍后重试');
            }
        };
        
        // 格式化日期
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };
        
        onMounted(loadQuestionDetail);
        
        // 处理点赞
        const handleLike = async (answer) => {
            // 防止重复点击
            if (answer.likeLoading) return;
            
            const userId = store.getters.getId;
            if (!userId) {
                ElMessage.warning('请先登录后再点赞');
                return;
            }
            
            try {
                answer.likeLoading = true;
                
                let success = false;
                
                if (answer.isLiked) {
                    // 如果已经点赞，则调用取消点赞API
                    success = await cancelLikeAnswer(userId, answer.answerId);
                    if (success) {
                        answer.isLiked = false;
                        ElMessage.success('取消点赞成功');
                    }
                } else {
                    // 如果未点赞，则调用点赞API
                    success = await likeAnswer(userId, answer.answerId);
                    if (success) {
                        answer.isLiked = true;
                        ElMessage.success('点赞成功');
                    }
                }
                
                if (success) {
                    // 获取最新点赞数
                    const newLikeCount = await getAnswerLikeCount(answer.answerId);
                    answer.likeCount = newLikeCount;
                }
            } catch (error) {
                console.error('点赞操作失败:', error);
                ElMessage.error('点赞操作失败，请稍后重试');
            } finally {
                answer.likeLoading = false;
            }
        };
        
        return {
            questionId,
            questionData,
            loading,
            mainAnswers,
            defaultAvatar,
            answerText,
            answerDialogVisible,
            currentParentId,
            showAnswerDialog,
            replyToAnswer,
            submitAnswer,
            formatDate,
            handleLike
        };
    }
}
</script>

<style scoped>
.bg-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: #f5f7fa;
    z-index: -2;
}
.bg-strong-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 300px;
    background: linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%);
    z-index: -1;
}
.main-container {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    padding: 32px 32px 24px 32px;
    margin-bottom: 24px;
}
.header-container {
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 16px;
    margin-bottom: 24px;
}
.header-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 12px;
}
.info-container {
    margin-bottom: 12px;
}
.detail-info {
    margin-bottom: 8px;
    font-size: 15px;
}
.info-label {
    color: #888;
    margin-right: 8px;
}
.down-container {
    margin-top: 24px;
}
.abstract-title, .answers-title, .editor-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
}
.abstract-content {
    font-size: 15px;
    color: #333;
    line-height: 1.7;
    background: #f8fafd;
    border-radius: 8px;
    padding: 16px;
    text-align: left;
}
.side-container {
    width: 100%;
}

/* 答案样式 */
.answers-list {
    margin-top: 20px;
}
.answer-item {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #ebeef5;
}
.answer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.user-info {
    display: flex;
    align-items: center;
}
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
    object-fit: cover;
}
.small-avatar {
    width: 30px;
    height: 30px;
}
.smaller-avatar {
    width: 26px;
    height: 26px;
}
.username {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}
.timestamp {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
.answer-actions {
    display: flex;
    gap: 8px;
}
.answer-content {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
    margin-top: 12px;
    text-align: left;
}
.nested-answers {
    margin-top: 16px;
    padding-left: 24px;
    border-left: 2px solid #f0f0f0;
}
.nested-answers.deeper {
    margin-top: 12px;
    padding-left: 20px;
    border-left: 1px solid #f0f0f0;
}
.nested-answer-item {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
}
.nested-answers.deeper .nested-answer-item {
    background: #f5f7fa;
    padding: 12px;
    margin-bottom: 8px;
}
.empty-answers {
    text-align: center;
    padding: 40px 0;
}
.empty-text {
    font-size: 16px;
    color: #909399;
    margin-bottom: 16px;
}

/* 编辑器样式 */
.editor-container {
    margin-top: 16px;
}
.editor-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

/* 加载状态 */
.loading-container {
    padding: 20px;
}
.error-container {
    padding: 40px 0;
    text-align: center;
}
</style> 