<template>
    <div class="side-panel">
        <div class="panel-section">
            <div class="section-title">问题概览</div>
            <div class="stat-row">
                <div class="stat-item">
                    <div class="stat-value">{{ problem?.answerCount || 0 }}</div>
                    <div class="stat-label">回答数</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{{ problem?.likeCount || 0 }}</div>
                    <div class="stat-label">点赞数</div>
                </div>
            </div>
            
            <!-- 显示被采纳的回答 -->
            <div v-if="problem && problem.acceptAnswer && acceptedAnswer" class="info-card accepted-answer">
                <div class="card-title"><i class="el-icon-check"></i> 已采纳回答</div>
                <div class="answer-preview">
                    <div class="answer-info">
                        <img :src="acceptedAnswer.userAvatar || defaultAvatar" class="avatar" alt="用户头像">
                        <div class="user-info">
                            <div class="username">{{ acceptedAnswer.userName }}</div>
                            <div class="timestamp">{{ formatDate(acceptedAnswer.answeredAt) }}</div>
                        </div>
                    </div>
                    <div class="answer-content">{{ truncateText(acceptedAnswer.answerText, 100) }}</div>
                </div>
            </div>
            
            <div v-if="problem && problem.answers && problem.answers.length > 0" class="info-card">
                <div class="card-title">最新回答</div>
                <div v-for="(answer, index) in recentAnswers" :key="index" class="answer-preview">
                    <div class="answer-info">
                        <img :src="answer.userAvatar || defaultAvatar" class="avatar" alt="用户头像">
                        <div class="user-info">
                            <div class="username">{{ answer.userName }}</div>
                            <div class="timestamp">{{ formatDate(answer.answeredAt) }}</div>
                        </div>
                    </div>
                    <div class="answer-content">{{ truncateText(answer.answerText, 80) }}</div>
                </div>
            </div>
            <div v-else class="empty-state">暂无回答</div>
        </div>
        
        <div class="panel-section">
            <div class="section-title">提问者信息</div>
            <div v-if="problem" class="user-card">
                <img :src="problem.userAvatar || defaultAvatar" class="user-avatar" alt="提问者头像">
                <div class="user-details">
                    <div class="user-name">{{ problem.userName }}</div>
                    <div class="ask-time">提问于：{{ formatDate(problem.askedAt) }}</div>
                </div>
            </div>
        </div>
        
        <div class="panel-section action-section">
            <el-button type="primary" size="large" style="width: 100%" @click="$emit('answer-click')">回答问题</el-button>
        </div>
    </div>
</template>

<script lang="js">
import { ref, computed } from 'vue';
import { getQuestionDetail } from '@/api/question';

export default {
    name: "ProblemSideComponent",
    props: {
        questionId: {
            type: Number,
            default: null
        }
    },
    emits: ['answer-click'],
    setup(props) {
        const problem = ref(null);
        const loading = ref(false);
        const defaultAvatar = '/src/asset/home/user.png';
        
        // 获取最近的3条回答
        const recentAnswers = computed(() => {
            if (!problem.value || !problem.value.answers) return [];
            // 只显示所有回答中最新的3条，不考虑层级
            return [...problem.value.answers]
                .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt))
                .slice(0, 3);
        });

        // 获取被采纳的回答
        const acceptedAnswer = computed(() => {
            if (!problem.value || !problem.value.acceptAnswer || !problem.value.answers) return null;
            return problem.value.answers.find(answer => answer.answerId === problem.value.acceptAnswer);
        });
        
        // 获取问题详情
        const fetchQuestionDetail = async () => {
            if (!props.questionId) {
                // 没有问题ID时使用静态数据
                problem.value = {
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
                            isLiked: false
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
                            isLiked: false
                        }
                    ],
                    answerCount: 2,
                    likeCount: 15,
                    isLiked: false
                };
                return;
            }
            
            try {
                loading.value = true;
                const data = await getQuestionDetail(props.questionId);
                if (data) {
                    problem.value = data;
                }
            } catch (error) {
                console.error('获取问题详情失败:', error);
            } finally {
                loading.value = false;
            }
        };
        
        // 页面加载时获取数据
        fetchQuestionDetail();
        
        // 格式化日期
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };
        
        // 截断文本
        const truncateText = (text, maxLength) => {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };
        
        return {
            problem,
            loading,
            recentAnswers,
            defaultAvatar,
            formatDate,
            truncateText,
            acceptedAnswer
        };
    }
}
</script>

<style scoped>
.side-panel {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
}

.panel-section {
    padding: 20px;
    border-bottom: 1px solid #f0f0f0;
    width: 100%;
    box-sizing: border-box;
}

.panel-section:last-child {
    border-bottom: none;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
    text-align: left;
}

.stat-row {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #409EFF;
}

.stat-label {
    font-size: 14px;
    color: #606266;
    margin-top: 4px;
}

.info-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
}

.card-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 12px;
    text-align: left;
}

.answer-preview {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    text-align: left;
}

.answer-preview:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.answer-info {
    display: flex;
    align-items: flex-start;
    text-align: left;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 10px;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
}

.username {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    text-align: left;
}

.timestamp {
    font-size: 12px;
    color: #909399;
    text-align: left;
}

.answer-content {
    margin-top: 8px;
    font-size: 14px;
    color: #333;
    line-height: 1.6;
    text-align: left;
}

.empty-state {
    text-align: center;
    color: #909399;
    padding: 20px 0;
    font-size: 14px;
}

.user-card {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
}

.user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 16px;
}

.user-details {
    flex: 1;
}

.user-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.ask-time {
    font-size: 13px;
    color: #909399;
}

.action-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.accepted-answer {
    border-left: 3px solid #67c23a;
    background-color: #f0f9eb;
}

.accepted-answer .card-title {
    color: #67c23a;
}
</style> 