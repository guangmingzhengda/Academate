<template>
    <div class="bg-container"/>
    <div class="bg-strong-container"/>
    <div style="width: 100%; height: 100%; display: flex; justify-content: center; margin-top: 100px">
        <div style="width: 1200px; margin-bottom: 40px">
            <el-container class="el-main">
                <el-row :gutter="20">
                    <el-col :span="17">
                        <div class="main-container">
                            <div v-if="loading" class="loading-container">
                                <el-skeleton :rows="10" animated />
                            </div>
                            <div v-else-if="questionData">
                                <div class="header-container">
                                    <div class="title-section">
                                        <div class="header-title">{{ questionData.questionTitle }}</div>
                                        <!-- 问题操作按钮区域 -->
                                        <div class="question-action-section">
                                            <!-- 关注问题按钮 -->
                                            <el-button 
                                                size="small" 
                                                :type="isFollowed ? 'success' : 'info'"
                                                @click="toggleFollow"
                                                :loading="followLoading"
                                                class="follow-button"
                                            >
                                                <i class="el-icon" v-if="isFollowed">
                                                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-029747aa="">
                                                        <path fill="currentColor" d="M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"></path>
                                                    </svg>
                                                </i>
                                                <i class="el-icon" v-else>
                                                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-029747aa="">
                                                        <path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm-38.4 409.6H326.4a38.4 38.4 0 1 0 0 76.8h147.2v147.2a38.4 38.4 0 0 0 76.8 0V550.4h147.2a38.4 38.4 0 0 0 0-76.8H550.4V326.4a38.4 38.4 0 1 0-76.8 0v147.2z"></path>
                                                    </svg>
                                                </i>
                                                {{ isFollowed ? '已关注' : '关注问题' }}
                                            </el-button>
                                            
                                            <!-- 问题点赞按钮 -->
                                            <el-button 
                                                size="small" 
                                                :type="questionLiked ? 'danger' : 'default'"
                                                @click="handleQuestionLike"
                                                :loading="questionLikeLoading"
                                                class="like-button"
                                            >
                                                {{ questionLiked ? '❤️ 已点赞' : '🤍 点赞' }} ({{ questionLikeCount }})
                                            </el-button>
                                        </div>
                                    </div>
                                    <div class="info-container">
                                        <div class="detail-info">
                                            <span class="info-label">提问者：</span>
                                            <span class="user-link" @click="goToUserProfile(questionData.userId)">{{ questionData.userName }}</span>
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
                                        <div v-for="(answer, index) in questionData.answers" 
                                             :key="index" 
                                             class="answer-item"
                                             :class="{'accepted': questionData.acceptAnswer === answer.answerId}">
                                            <div class="answer-header">
                                                <div class="user-info">
                                                    <img 
                                                        :src="answer.userAvatar || defaultAvatar" 
                                                        class="avatar" 
                                                        alt="用户头像"
                                                        @click="goToUserProfile(answer.userId)"
                                                    >
                                                    <div>
                                                        <div class="username user-link" @click="goToUserProfile(answer.userId)">{{ answer.userName }}</div>
                                                        <div class="timestamp">
                                                            发布于 {{ formatDateTime(answer.answeredAt) }}
                                                            <span v-if="isEdited(answer.answeredAt, answer.answeredEd)" class="edited-time">
                                                                (编辑于 {{ formatDateTime(answer.answeredEd) }})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="answer-actions">
                                                    <el-button 
                                                        size="small" 
                                                        :type="answer.isLiked ? 'danger' : 'default'"
                                                        @click="handleLike(answer)"
                                                        :loading="answer.likeLoading"
                                                    >
                                                        {{ answer.isLiked ? '❤️ 已点赞' : '🤍 点赞' }} ({{ answer.likeCount }})
                                                    </el-button>
                                                    <el-button 
                                                        size="small" 
                                                        @click="replyToAnswer(answer.answerId)"
                                                    >
                                                        💬 回复
                                                    </el-button>
                                                    
                                                    <!-- 编辑按钮（仅对自己的回答显示） -->
                                                    <el-button 
                                                        v-if="isCurrentUserAnswer(answer)" 
                                                        size="small" 
                                                        type="info" 
                                                        @click="editAnswer(answer)"
                                                    >
                                                        ✏️ 编辑
                                                    </el-button>
                                                    
                                                    <!-- 删除按钮（仅对自己的回答显示） -->
                                                    <el-button 
                                                        v-if="isCurrentUserAnswer(answer)" 
                                                        size="small" 
                                                        type="danger" 
                                                        @click="confirmDeleteAnswer(answer.answerId)"
                                                    >
                                                        🗑️ 删除
                                                    </el-button>
                                                    
                                                    <!-- 采纳按钮，仅在当前用户是问题所有者且没有采纳过回答时显示 -->
                                                    <el-button 
                                                        v-if="isQuestionOwner && !questionData.acceptAnswer && answer.layer === 1" 
                                                        type="success" 
                                                        size="small" 
                                                        @click="acceptAnswerAction(answer.answerId)"
                                                        :loading="acceptLoading === answer.answerId"
                                                    >
                                                        ✓ 采纳
                                                    </el-button>
                                                    
                                                    <!-- 已采纳状态按钮 -->
                                                    <el-button 
                                                        v-if="questionData.acceptAnswer === answer.answerId" 
                                                        type="success" 
                                                        size="small" 
                                                        disabled
                                                    >
                                                        ✓ 已采纳
                                                    </el-button>
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
                                                            <img 
                                                                :src="childAnswer.userAvatar || defaultAvatar" 
                                                                class="avatar small-avatar" 
                                                                alt="用户头像"
                                                                @click="goToUserProfile(childAnswer.userId)"
                                                            >
                                                            <div>
                                                                <div class="username user-link" @click="goToUserProfile(childAnswer.userId)">{{ childAnswer.userName }}</div>
                                                                <div class="timestamp">
                                                                    发布于 {{ formatDateTime(childAnswer.answeredAt) }}
                                                                    <span v-if="isEdited(childAnswer.answeredAt, childAnswer.answeredEd)" class="edited-time">
                                                                        (编辑于 {{ formatDateTime(childAnswer.answeredEd) }})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="answer-actions">
                                                            <el-button 
                                                                size="small" 
                                                                :type="childAnswer.isLiked ? 'danger' : 'default'"
                                                                @click="handleLike(childAnswer)"
                                                                :loading="childAnswer.likeLoading"
                                                            >
                                                                {{ childAnswer.isLiked ? '❤️ 已点赞' : '🤍 点赞' }} ({{ childAnswer.likeCount }})
                                                            </el-button>
                                                            
                                                            <!-- 编辑按钮（仅对自己的回答显示） -->
                                                            <el-button 
                                                                v-if="isCurrentUserAnswer(childAnswer)" 
                                                                size="small" 
                                                                type="info" 
                                                                @click="editAnswer(childAnswer)"
                                                            >
                                                                ✏️ 编辑
                                                            </el-button>
                                                            
                                                            <!-- 删除按钮（仅对自己的回答显示） -->
                                                            <el-button 
                                                                v-if="isCurrentUserAnswer(childAnswer)" 
                                                                size="small" 
                                                                type="danger" 
                                                                @click="confirmDeleteAnswer(childAnswer.answerId)"
                                                            >
                                                                🗑️ 删除
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
                                                                    <img 
                                                                        :src="grandChildAnswer.userAvatar || defaultAvatar" 
                                                                        class="avatar smaller-avatar" 
                                                                        alt="用户头像"
                                                                        @click="goToUserProfile(grandChildAnswer.userId)"
                                                                    >
                                                                    <div>
                                                                        <div class="username user-link" @click="goToUserProfile(grandChildAnswer.userId)">{{ grandChildAnswer.userName }}</div>
                                                                        <div class="timestamp">
                                                                            发布于 {{ formatDateTime(grandChildAnswer.answeredAt) }}
                                                                            <span v-if="isEdited(grandChildAnswer.answeredAt, grandChildAnswer.answeredEd)" class="edited-time">
                                                                                (编辑于 {{ formatDateTime(grandChildAnswer.answeredEd) }})
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="answer-actions">
                                                                    <el-button 
                                                                        size="small" 
                                                                        :type="grandChildAnswer.isLiked ? 'danger' : 'default'"
                                                                        @click="handleLike(grandChildAnswer)"
                                                                        :loading="grandChildAnswer.likeLoading"
                                                                    >
                                                                        {{ grandChildAnswer.isLiked ? '❤️ 已点赞' : '🤍 点赞' }} ({{ grandChildAnswer.likeCount }})
                                                                    </el-button>
                                                                    
                                                                    <!-- 编辑按钮（仅对自己的回答显示） -->
                                                                    <el-button 
                                                                        v-if="isCurrentUserAnswer(grandChildAnswer)" 
                                                                        size="small" 
                                                                        type="info" 
                                                                        @click="editAnswer(grandChildAnswer)"
                                                                    >
                                                                        ✏️ 编辑
                                                                    </el-button>
                                                                    
                                                                    <!-- 删除按钮（仅对自己的回答显示） -->
                                                                    <el-button 
                                                                        v-if="isCurrentUserAnswer(grandChildAnswer)" 
                                                                        size="small" 
                                                                        type="danger" 
                                                                        @click="confirmDeleteAnswer(grandChildAnswer.answerId)"
                                                                    >
                                                                        🗑️ 删除
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
                                    :append-to-body="true"
                                    :modal-append-to-body="true"
                                    :close-on-click-modal="false"
                                    center
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
                                
                                <!-- 编辑回答对话框 -->
                                <el-dialog
                                    v-model="editDialogVisible"
                                    title="编辑回答"
                                    width="600px"
                                    :append-to-body="true"
                                    :modal-append-to-body="true"
                                    :close-on-click-modal="false"
                                    center
                                >
                                    <el-input
                                        type="textarea"
                                        v-model="editingAnswerText"
                                        :rows="8"
                                        placeholder="请输入修改后的回答内容..."
                                    ></el-input>
                                    <template #footer>
                                        <span class="dialog-footer">
                                            <el-button @click="editDialogVisible = false">取消</el-button>
                                            <el-button type="primary" @click="submitEditAnswer">保存修改</el-button>
                                        </span>
                                    </template>
                                </el-dialog>
                            </div>
                            <div v-else class="error-container">
                                <el-empty description="问题不存在或已被删除"></el-empty>
                                <div class="error-actions">
                                    <p>将在3秒后自动跳转到首页...</p>
                                    <el-button type="primary" @click="goToHome">立即返回首页</el-button>
                                </div>
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
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getQuestionDetail, createAnswer, likeAnswer, cancelLikeAnswer, getAnswerLikeCount, acceptAnswer, deleteAnswer, updateAnswer, AnswerUpdateRequest, likeQuestion, cancelLikeQuestion, getQuestionLikeCount, isQuestionLiked, followQuestion, cancelFollowQuestion, isQuestionFollowed } from "@/api/question";
import { ElMessage, ElMessageBox } from "element-plus";
import { 
    Thumb, 
    ChatDotRound, 
    Edit, 
    Delete, 
    Check
} from '@element-plus/icons-vue';
import store from "@/store";

export default defineComponent({
    name: "problem-detail",
    components: { 
        ProblemSideComponent,
        Thumb,
        ChatDotRound,
        Edit,
        Delete,
        Check
    },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const questionId = ref(Number(route.params.id) || null);
        const questionData = ref(null);
        const loading = ref(true);
        const defaultAvatar = '/src/asset/home/user.png';
        const answerText = ref('');
        const answerDialogVisible = ref(false);
        const currentParentId = ref(null);
        const acceptLoading = ref(null);
        
        // 过滤一级回答（主回答）
        const mainAnswers = computed(() => {
            if (!questionData.value || !questionData.value.answers) return [];
            return questionData.value.answers.filter(answer => answer.layer === 1);
        });
        
        // 判断当前用户是否是问题所有者
        const isQuestionOwner = computed(() => {
            const currentUserId = store.getters.getId;
            return questionData.value && currentUserId && questionData.value.userId === currentUserId;
        });
        
        // 在setup函数中添加新的变量和方法
        const currentUserId = computed(() => store.getters.getId);
        const editDialogVisible = ref(false);
        const editingAnswerId = ref(null);
        const editingAnswerText = ref('');
        
        // 问题点赞相关
        const questionLiked = ref(false);
        const questionLikeCount = ref(0);
        const questionLikeLoading = ref(false);
        
        // 问题关注相关
        const isFollowed = ref(false);
        const followLoading = ref(false);
        
        // 判断是否是当前用户的回答
        const isCurrentUserAnswer = (answer) => {
            return currentUserId.value && answer.userId === currentUserId.value;
        };
        
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
                        
                        // 加载问题点赞状态
                        await loadQuestionLikeStatus();
                        
                        // 加载问题关注状态
                        await checkFollowStatus();
                    } else {
                        questionData.value = null;
                        // 不再显示弹窗提示，只保留页面内的提示
                        // 设置3秒后自动跳转到首页
                        setTimeout(() => {
                            goToHome();
                        }, 3000);
                    }
                } else {
                    questionData.value = null;
                    // 不再显示弹窗提示，只保留页面内的提示
                    // 设置3秒后自动跳转到首页
                    setTimeout(() => {
                        goToHome();
                    }, 3000);
                }
            } catch (error) {
                // console.error('获取问题详情失败:', error);
                questionData.value = null;
                // 不再显示弹窗提示，只保留页面内的提示
                // 设置3秒后自动跳转到首页
                setTimeout(() => {
                    goToHome();
                }, 3000);
            } finally {
                loading.value = false;
            }
        };
        
        // 检查关注状态
        const checkFollowStatus = async () => {
            const userId = store.getters.getId;
            if (!userId || !questionId.value) return;
            
            try {
                const followed = await isQuestionFollowed(userId, questionId.value);
                isFollowed.value = followed;
            } catch (error) {
                // console.error('获取关注状态失败:', error);
            }
        };
        
        // 切换关注状态
        const toggleFollow = async () => {
            const userId = store.getters.getId;
            if (!userId) {
                ElMessage.warning('请先登录后再关注问题');
                return;
            }
            
            if (!questionId.value) {
                ElMessage.warning('问题ID不存在');
                return;
            }
            
            try {
                followLoading.value = true;
                let success = false;
                
                if (isFollowed.value) {
                    // 取消关注
                    success = await cancelFollowQuestion(userId, questionId.value);
                    if (success) {
                        isFollowed.value = false;
                        ElMessage.success('已取消关注');
                    }
                } else {
                    // 关注问题
                    success = await followQuestion(userId, questionId.value);
                    if (success) {
                        isFollowed.value = true;
                        ElMessage.success('已关注问题');
                    }
                }
            } catch (error) {
                // console.error('关注操作失败:', error);
                ElMessage.error('操作失败，请稍后重试');
            } finally {
                followLoading.value = false;
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
                // console.error('提交回答失败:', error);
                ElMessage.error('提交回答失败，请稍后重试');
            }
        };
        
        // 格式化日期
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };
        
        // 格式化日期时间（精确到分钟）
        const formatDateTime = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        };
        
        // 判断回答是否被编辑过
        const isEdited = (answeredAt, answeredEd) => {
            if (!answeredAt || !answeredEd) return false;
            
            // 转换为Date对象进行比较
            const atDate = new Date(answeredAt);
            const edDate = new Date(answeredEd);
            
            // 比较两个时间是否相同
            return atDate.getTime() !== edDate.getTime();
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
                // console.error('点赞操作失败:', error);
                ElMessage.error('点赞操作失败，请稍后重试');
            } finally {
                answer.likeLoading = false;
            }
        };
        
        // 采纳回答
        const acceptAnswerAction = async (answerId) => {
            const userId = store.getters.getId;
            if (!userId) {
                ElMessage.warning('请先登录后再采纳回答');
                return;
            }
            
            try {
                acceptLoading.value = answerId;
                const success = await acceptAnswer(questionId.value, answerId);
                if (success) {
                    ElMessage.success('回答已采纳');
                    await loadQuestionDetail();
                }
            } catch (error) {
                // console.error('采纳回答失败:', error);
                ElMessage.error('采纳回答失败，请稍后重试');
            } finally {
                acceptLoading.value = null;
            }
        };
        
        // 编辑回答
        const editAnswer = (answer) => {
            editingAnswerId.value = answer.answerId;
            editingAnswerText.value = answer.answerText;
            editDialogVisible.value = true;
        };
        
        // 提交编辑
        const submitEditAnswer = async () => {
            if (!editingAnswerId.value) return;
            
            if (!editingAnswerText.value.trim()) {
                ElMessage.warning('回答内容不能为空');
                return;
            }
            
            try {
                const updateRequest = {
                    answerText: editingAnswerText.value.trim()
                };
                
                const success = await updateAnswer(editingAnswerId.value, updateRequest);
                if (success) {
                    ElMessage.success('回答已更新');
                    editDialogVisible.value = false;
                    await loadQuestionDetail(); // 重新加载数据
                }
            } catch (error) {
                // console.error('更新回答失败:', error);
                ElMessage.error('更新回答失败');
            }
        };
        
        // 确认删除回答
        const confirmDeleteAnswer = (answerId) => {
            ElMessageBox.confirm('确定要删除这个回答吗？此操作不可恢复', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                deleteAnswerAction(answerId);
            }).catch(() => {
                // 用户取消删除
            });
        };
        
        // 删除回答
        const deleteAnswerAction = async (answerId) => {
            try {
                const success = await deleteAnswer(answerId);
                if (success) {
                    ElMessage.success('回答已删除');
                    await loadQuestionDetail(); // 重新加载数据
                }
            } catch (error) {
                // console.error('删除回答失败:', error);
                ElMessage.error('删除回答失败');
            }
        };
        
        // 跳转到用户个人主页
        const goToUserProfile = (userId) => {
            if (!userId) return;
            router.push(`/profile/${userId}`);
        };
        
        // 加载问题点赞状态
        const loadQuestionLikeStatus = async () => {
            if (!questionId.value) return;
            
            try {
                // 获取点赞数量
                const likeCount = await getQuestionLikeCount(questionId.value);
                questionLikeCount.value = likeCount;
                
                // 获取当前用户是否点赞
                const userId = store.getters.getId;
                if (userId) {
                    const liked = await isQuestionLiked(userId, questionId.value);
                    questionLiked.value = liked;
                }
            } catch (error) {
                // console.error('加载问题点赞状态失败:', error);
            }
        };
        
        // 处理问题点赞
        const handleQuestionLike = async () => {
            if (questionLikeLoading.value) return;
            
            const userId = store.getters.getId;
            if (!userId) {
                ElMessage.warning('请先登录后再点赞');
                return;
            }
            
            if (!questionId.value) {
                ElMessage.warning('问题ID不存在');
                return;
            }
            
            try {
                questionLikeLoading.value = true;
                
                let success = false;
                
                if (questionLiked.value) {
                    // 取消点赞
                    success = await cancelLikeQuestion(userId, questionId.value);
                    if (success) {
                        questionLiked.value = false;
                        questionLikeCount.value = Math.max(0, questionLikeCount.value - 1);
                        ElMessage.success('取消点赞成功');
                    }
                } else {
                    // 点赞
                    success = await likeQuestion(userId, questionId.value);
                    if (success) {
                        questionLiked.value = true;
                        questionLikeCount.value = questionLikeCount.value + 1;
                        ElMessage.success('点赞成功');
                    }
                }
                
                if (success) {
                    // 获取最新点赞数
                    const newLikeCount = await getQuestionLikeCount(questionId.value);
                    questionLikeCount.value = newLikeCount;
                }
            } catch (error) {
                // console.error('问题点赞操作失败:', error);
                ElMessage.error('操作失败，请稍后重试');
            } finally {
                questionLikeLoading.value = false;
            }
        };
        
        // 跳转到首页
        const goToHome = () => {
            router.push('/');
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
            formatDateTime,
            isEdited,
            handleLike,
            acceptLoading,
            acceptAnswerAction,
            isQuestionOwner,
            // 新增
            isCurrentUserAnswer,
            editAnswer,
            confirmDeleteAnswer,
            editDialogVisible,
            editingAnswerText,
            submitEditAnswer,
            goToUserProfile,
            // 问题点赞相关
            questionLiked,
            questionLikeCount,
            questionLikeLoading,
            handleQuestionLike,
            // 问题关注相关
            isFollowed,
            followLoading,
            toggleFollow,
            // 其他
            goToHome
        };
    }
})
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

.bg-strong-container {
    display: none;
}

.el-main {
    padding: 0;
}

.el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
    align-items: flex-start !important;
}

.el-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
    vertical-align: top !important;
}

.el-col:first-child {
    padding-right: 10px !important;
}

.el-col:last-child {
    padding-left: 10px !important;
}

.main-container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 36px 40px 30px 40px;
    margin-bottom: 24px;
    margin-top: 0;
    transition: all 0.3s ease;
    position: relative;
    min-height: 900px;
}

.main-container:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.header-container {
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 16px;
    margin-bottom: 24px;
}

.title-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: 12px;
}

.header-title {
    font-size: 28px;
    font-weight: bold;
    line-height: 1.3;
    color: #2c3e50;
    text-align: left;
    flex: 1;
}

.question-action-section {
    display: flex;
    align-items: center;
    gap: 10px;
}

.follow-button {
    display: flex;
    align-items: center;
    gap: 5px;
    border-radius: 20px;
    padding: 8px 16px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.follow-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.like-button {
    border-radius: 20px;
    transition: all 0.3s ease;
}

.like-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-container {
    margin-bottom: 20px;
    text-align: left;
}

.detail-info {
    margin-bottom: 8px;
    font-size: 14px;
}

.info-label {
    min-width: 80px;
    font-weight: 500;
    color: #666;
    margin-right: 8px;
}

.down-container {
    margin-top: 24px;
}

.abstract-title, .answers-title, .editor-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
    text-align: left;
}

.abstract-content {
    font-size: 15px;
    line-height: 1.7;
    color: #333;
    background: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    border-left: 4px solid #409eff;
    text-align: left;
}

.el-icon {
    margin-right: 4px;
    font-size: 16px;
}

.side-container {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
    margin-top: 0;
    box-sizing: border-box;
    padding: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    position: sticky;
    top: 100px;
}

.side-container:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

/* 答案样式 */
.answers-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.answer-item {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    border: none;
    padding: 20px;
    margin-bottom: 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.answer-item:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.answer-item.accepted {
    border-left: 4px solid #67c23a;
    background-color: #f0f9eb;
}

.answer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.user-info {
    display: flex;
    align-items: flex-start;
    text-align: left;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
    object-fit: cover;
    cursor: pointer;
    transition: opacity 0.2s;
}

.avatar:hover {
    opacity: 0.85;
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
    text-align: left;
    cursor: pointer;
    transition: color 0.2s;
}

.username:hover {
    color: #1890ff;
    text-decoration: underline;
}

.timestamp {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    text-align: left;
}

.edited-time {
    color: #a0a0a0;
    font-style: italic;
    margin-left: 4px;
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
    background: #f9f9fa;
    padding: 16px;
    border-radius: 6px;
}

/* 嵌套回答样式 */
.nested-answers {
    margin-top: 16px;
    padding-left: 24px;
    border-left: 3px solid #ebeef5;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.nested-answer-item {
    background: #f5f7fa;
    border-radius: 0;
    padding: 16px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
}

.nested-answer-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
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
    padding: 40px 20px;
    text-align: center;
}

.error-container {
    padding: 40px 0;
    text-align: center;
}

.error-actions {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.error-actions p {
    color: #606266;
    font-size: 14px;
}

/* 采纳标识样式 */
.accepted-answer-tag {
    display: inline-flex;
    align-items: center;
    background-color: #f0f9eb;
    border: 1px solid #e1f3d8;
    border-radius: 4px;
    padding: 6px 12px;
    margin-top: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #67c23a;
    font-weight: 500;
}

.accepted-answer-tag .el-icon {
    margin-right: 4px;
    font-size: 14px;
}

/* 确保图标正确显示 */
.el-button .el-icon {
    margin-right: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* 如果图标仍有问题，尝试使用固定宽度 */
.el-button .el-icon {
    width: 16px;
    height: 16px;
}

/* 让文字和图标垂直居中对齐 */
.el-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.user-link {
    color: #409eff;
    cursor: pointer;
    transition: color 0.2s;
}

.user-link:hover {
    color: #1890ff;
    text-decoration: underline;
}

.nested-answers.deeper {
    margin-top: 12px;
    padding-left: 20px;
    border-left: 2px solid #ebeef5;
}

.nested-answers.deeper .nested-answer-item {
    background: #f8f9fa;
    padding: 12px;
    margin-bottom: 8px;
}

.nested-answer-item .answer-content {
    background: #f5f7fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .main-content {
        flex-direction: column;
    }
    
    .side-container {
        width: 100%;
        position: static;
        top: auto;
    }
    
    .header-title {
        font-size: 24px;
    }
}
</style> 