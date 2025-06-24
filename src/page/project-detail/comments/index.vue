<template>
    <el-dialog
        v-model="loginVisible"
        title="Tips"
        width="500"
    >
        <span>需要成为项目成员后才可评论</span>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="loginVisible = false">暂不申请加入</el-button>
                <el-button type="primary" @click="applyJoin">
                    申请加入项目
                </el-button>
            </div>
        </template>
    </el-dialog>
    <div class="comment-container">
        <div v-if="loading" class="loading-container">
            <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="!commentList || commentList.length === 0" class="empty-state">
            目前还没有评论~
        </div>
        <div v-else v-for="(comment, index) in commentList" :key="comment.commentId"
             class="comment" :ref="el => { if(el) commentRefs[comment.commentId] = el }">
            <div class="comment-header">
                <div class="comment-info">
                    <img :src="comment.userAvatar || defaultAvatar" class="small-image" alt="用户头像"/>
                    <span class="user">{{ comment.userAccount }}</span>
                    <span class="time">{{ formatDate(comment.commentedAt) }}</span>
                </div>
                <div class="comment-actions">
                    <img src="../assets/delete.png" v-if="comment.userId === userId"
                         @click="beforeDelete(comment.commentId)" class="image" alt="Icon"/>
                    <img src="../assets/comment.png" @click="beforeComment(comment.commentId)" class="image" alt="Icon"/>
                    <el-button 
                        size="small" 
                        :type="comment.isLiked ? 'primary' : 'default'"
                        icon="el-icon-thumb"
                        @click="handleLike(comment)"
                        :loading="comment.likeLoading"
                    >
                        {{ comment.likeCount }}
                    </el-button>
                </div>
            </div>
            <div class="comment-body">
                <p>{{ comment.commentText }}</p>
            </div>
            <hr v-if="comment.parentComment">
            <div class="comment-reply" style="max-width: 80%" v-if="comment.parentComment && getParentComment(comment.parentComment)">
                <div class="reply-header">
                    <strong>回复: {{ getParentComment(comment.parentComment)?.userAccount }}</strong>
                    <img src="../assets/goBack.png" class="small-small-image" alt="Icon"
                         @click="goToComment(comment.parentComment)">
                </div>
                <div class="source-comment">
                    <p class="source-content">
                        源评论: {{ getParentComment(comment.parentComment)?.commentText }}
                    </p>
                    <p class="source-time">
                        评论时间: {{ formatDate(getParentComment(comment.parentComment)?.commentedAt) }}
                    </p>
                </div>
            </div>
            <div class="comment-reply" style="max-width: 100%" v-else-if="comment.parentComment">
                <div class="reply-header">
                    <strong>回复内容不存在</strong>
                </div>
                <div class="source-comment">
                    <p>
                        源评论已被删除
                    </p>
                </div>
            </div>
        </div>
        <div v-if="totalComments > 0" class="pagination-container">
            <el-pagination
                layout="prev, pager, next"
                :total="totalComments"
                :page-size="pageSize"
                :current-page="currentPage"
                @current-change="handleCurrentChange"
            />
        </div>
        
        <!-- 回复对话框 -->
        <el-dialog
            v-model="dialogVisible"
            title="回复评论"
            width="500"
        >
            <textarea v-model="userInput" placeholder="请输入评论" class="custom-textarea"></textarea>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="commitComment(commentToId)">
                        提交
                    </el-button>
                </div>
            </template>
        </el-dialog>
        
        <!-- 删除确认对话框 -->
        <el-dialog
            v-model="deleteVisible"
            title="确认删除"
            width="500"
        >
            <p>确定要删除这条评论吗？</p>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="deleteVisible = false">取消</el-button>
                    <el-button type="primary" @click="deleteComment(deleteId)">
                        确认
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="js">
import {ref, onMounted, computed} from "vue";
import {getProjectComments, getCommentLikeCount, likeComment, isLikedComment, cancelLikeComment} from "@/page/project-detail/api/api";
import {callSuccess, callInfo, callError} from "@/call";
import store from "@/store";
import { ElMessage } from "element-plus";

export default {
    name: "comments",
    props: {
        work: {
            type: Object,
            required: true
        },
        userId: {
            type: Number,
            default: 0
        },
        role: {
            type: String,
            default: ""
        },
    },
    setup(props) {
        const loading = ref(true);
        const commentList = ref([]);
        const allComments = ref([]);
        const totalComments = ref(0);
        const currentPage = ref(1);
        const pageSize = ref(5);
        const defaultAvatar = "/src/asset/home/user.png";
        
        // 对话框状态
        const dialogVisible = ref(false);
        const deleteVisible = ref(false);
        const loginVisible = ref(false);
        const userInput = ref("");
        const commentToId = ref(null);
        const deleteId = ref(null);
        const commentRefs = ref({});
        
        // 获取项目ID
        const projectId = computed(() => {
            return props.work.projectDetail?.projectId || props.work.projectDetail?.id;
        });
        
        // 获取项目评论
        const fetchComments = async () => {
            if (!projectId.value) {
                ElMessage.warning("项目ID不存在");
                loading.value = false;
                return;
            }
            
            try {
                loading.value = true;
                const result = await getProjectComments(projectId.value);
                
                if (result && result.code === 0 && result.data) {
                    // 添加额外的字段以支持交互
                    const processedComments = result.data.map(comment => ({
                        ...comment,
                        likeLoading: false
                    }));
                    
                    allComments.value = processedComments;
                    totalComments.value = processedComments.length;
                    
                    // 更新当前页的评论
                    updatePageComments();
                    
                    // 初始化评论点赞状态
                    await initCommentLikeStatus(allComments.value);
                } else {
                    // 如果API请求失败或没有数据，使用测试数据
                    useTestData();
                }
            } catch (error) {
                console.error("获取项目评论失败:", error);
                callError("获取项目评论失败");
                // 使用测试数据作为备用
                useTestData();
            } finally {
                loading.value = false;
            }
        };
        
        // 使用测试数据
        const useTestData = () => {
            const testData = [
                { 
                    commentId: 1, 
                    projectId: projectId.value, 
                    layer: 1, 
                    parentComment: null, 
                    userId: 101, 
                    userAccount: 'Alice', 
                    userAvatar: 'https://i.pravatar.cc/150?img=1',
                    commentText: '这是一个非常有见地的项目，期待最终成果！', 
                    commentedAt: '2024-07-20T10:30:00', 
                    likeCount: 5,
                    isLiked: false,
                    likeLoading: false
                },
                { 
                    commentId: 2, 
                    projectId: projectId.value, 
                    layer: 1, 
                    parentComment: null, 
                    userId: 102, 
                    userAccount: 'Bob', 
                    userAvatar: 'https://i.pravatar.cc/150?img=2',
                    commentText: '关于数据收集部分，你们是如何保证隐私的？', 
                    commentedAt: '2024-07-20T11:15:00', 
                    likeCount: 3,
                    isLiked: false,
                    likeLoading: false
                },
                { 
                    commentId: 3, 
                    projectId: projectId.value, 
                    layer: 2, 
                    parentComment: 2, 
                    userId: 101, 
                    userAccount: 'Alice', 
                    userAvatar: 'https://i.pravatar.cc/150?img=1',
                    commentText: '我们采用了匿名化和数据加密技术，确保所有数据都符合隐私保护法规。', 
                    commentedAt: '2024-07-20T11:45:00', 
                    likeCount: 2,
                    isLiked: false,
                    likeLoading: false
                },
                { 
                    commentId: 4, 
                    projectId: projectId.value, 
                    layer: 1, 
                    parentComment: null, 
                    userId: 103, 
                    userAccount: 'Charlie', 
                    userAvatar: 'https://i.pravatar.cc/150?img=3',
                    commentText: '这个项目的研究方法很新颖，值得借鉴。', 
                    commentedAt: '2024-07-21T09:00:00', 
                    likeCount: 7,
                    isLiked: true,
                    likeLoading: false
                },
                { 
                    commentId: 5, 
                    projectId: projectId.value, 
                    layer: 1, 
                    parentComment: null, 
                    userId: 104, 
                    userAccount: 'David', 
                    userAvatar: 'https://i.pravatar.cc/150?img=4',
                    commentText: '请问项目有计划开源部分代码吗？', 
                    commentedAt: '2024-07-21T14:20:00', 
                    likeCount: 1,
                    isLiked: false,
                    likeLoading: false
                }
            ];
            
            allComments.value = testData;
            totalComments.value = testData.length;
            updatePageComments();
        };
        
        // 更新当前页的评论
        const updatePageComments = () => {
            const startIndex = (currentPage.value - 1) * pageSize.value;
            const endIndex = startIndex + pageSize.value;
            commentList.value = allComments.value.slice(startIndex, endIndex);
        };
        
        // 处理分页变化
        const handleCurrentChange = (page) => {
            currentPage.value = page;
            updatePageComments();
        };
        
        // 格式化日期
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        // 获取父评论
        const getParentComment = (parentId) => {
            if (!parentId) return null;
            return allComments.value.find(c => c.commentId === parentId);
        };
        
        // 处理回复评论
        const beforeComment = (commentId) => {
            if (props.role !== 'creator' && props.role !== 'participant') {
                loginVisible.value = true;
                return;
            }
            
            commentToId.value = commentId;
            dialogVisible.value = true;
        };
        
        // 提交评论
        const commitComment = async (parentId) => {
            if (!userInput.value.trim()) {
                ElMessage.warning('评论内容不能为空');
                return;
            }
            
            dialogVisible.value = false;
            
            // TODO: 实现评论提交API
            console.log(`评论提交: ${parentId ? '回复评论' + parentId : '新评论'} - ${userInput.value}`);
            
            // 模拟成功
            callSuccess("评论成功");
            userInput.value = "";
            
            // 重新加载评论
            await fetchComments();
        };
        
        // 处理删除评论
        const beforeDelete = (commentId) => {
            deleteId.value = commentId;
            deleteVisible.value = true;
        };
        
        // 执行删除评论
        const deleteComment = async (commentId) => {
            deleteVisible.value = false;
            
            // TODO: 实现删除评论API
            console.log(`删除评论: ${commentId}`);
            
            // 模拟成功
            callSuccess("删除成功");
            
            // 重新加载评论
            await fetchComments();
        };
        
        // 处理点赞
        const handleLike = async (comment) => {
            // 防止重复点击
            if (comment.likeLoading) return;
            
            if (!props.userId) {
                ElMessage.warning('请先登录后再点赞');
                return;
            }
            
            try {
                comment.likeLoading = true;
                
                let success = false;
                
                if (comment.isLiked) {
                    // 已点赞，执行取消点赞操作
                    success = await cancelLikeComment(props.userId, comment.commentId);
                    
                    if (success) {
                        comment.isLiked = false;
                        callSuccess('取消点赞成功');
                    }
                } else {
                    // 未点赞，执行点赞操作
                    success = await likeComment(props.userId, comment.commentId);
                    
                    if (success) {
                        comment.isLiked = true;
                        callSuccess('点赞成功');
                    }
                }
                
                // 无论是点赞还是取消点赞，都更新点赞数
                if (success) {
                    // 获取最新的点赞数
                    const newLikeCount = await getCommentLikeCount(comment.commentId);
                    comment.likeCount = newLikeCount;
                }
            } catch (error) {
                console.error('点赞操作失败:', error);
                ElMessage.error('点赞操作失败');
            } finally {
                comment.likeLoading = false;
            }
        };
        
        // 初始化评论点赞状态
        const initCommentLikeStatus = async (comments) => {
            if (!props.userId || !comments || comments.length === 0) return;
            
            for (const comment of comments) {
                try {
                    // 获取评论是否已被点赞
                    comment.isLiked = await isLikedComment(props.userId, comment.commentId);
                    
                    // 获取最新的点赞数
                    comment.likeCount = await getCommentLikeCount(comment.commentId);
                } catch (error) {
                    console.error(`获取评论(${comment.commentId})点赞状态失败:`, error);
                }
            }
        };
        
        // 跳转到评论
        const goToComment = (commentId) => {
            // 找到评论在数组中的索引
            const commentIndex = allComments.value.findIndex(c => c.commentId === commentId);
            if (commentIndex === -1) return;
            
            // 计算评论所在的页码
            const page = Math.floor(commentIndex / pageSize.value) + 1;
            currentPage.value = page;
            
            // 更新当前页的评论
            updatePageComments();
            
            // 延迟执行滚动操作，确保DOM已更新
            setTimeout(() => {
                const commentElement = commentRefs.value[commentId];
                if (commentElement) {
                    commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 申请加入项目
        const applyJoin = () => {
            callInfo("您的加入申请已发送！");
            loginVisible.value = false;
        };
        
        // 组件挂载后获取评论
        onMounted(() => {
            fetchComments();
        });
        
        return {
            loading,
            commentList,
            totalComments,
            currentPage,
            pageSize,
            defaultAvatar,
            dialogVisible,
            deleteVisible,
            loginVisible,
            userInput,
            commentToId,
            deleteId,
            commentRefs,
            formatDate,
            getParentComment,
            handleCurrentChange,
            beforeComment,
            commitComment,
            beforeDelete,
            deleteComment,
            handleLike,
            goToComment,
            applyJoin
        };
    }
}
</script>

<style scoped>
.comment-container {
    margin-top: 20px;
    margin-left: 20px;
}

.loading-container {
    padding: 20px;
    margin-bottom: 20px;
}

.empty-state {
    text-align: center;
    padding: 30px;
    color: #909399;
    font-style: italic;
}

.comment {
    border: 1px solid #ebeef5;
    margin-bottom: 16px;
    width: 90%;
    padding: 16px;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.comment-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.comment-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.comment-body {
    font-size: 14px;
    line-height: 1.6;
    color: #606266;
    margin: 12px 0;
}

.comment-body p {
    margin: 0;
}

.image {
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.image:hover {
    transform: scale(1.2);
}

.small-small-image {
    width: 14px;
    height: 14px;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.small-small-image:hover {
    transform: scale(1.2);
}

.small-image {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.custom-textarea {
    width: 95%;
    height: 150px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.5;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    resize: vertical;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.02);
    overflow-y: auto;
}

.user {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
}

.time {
    color: #909399;
    font-size: 12px;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    margin-bottom: 16px;
}

.comment-reply {
    background-color: #f8f9fa;
    border: 1px solid #ebeef5;
    padding: 12px;
    margin-top: 12px;
    border-radius: 4px;
}

.reply-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    margin-bottom: 8px;
    color: #606266;
}

.source-comment {
    font-size: 12px;
    color: #909399;
}

.source-content {
    margin-bottom: 4px;
}

.source-time {
    font-size: 11px;
}

hr {
    border: 0;
    height: 1px;
    background: #ebeef5;
    margin: 16px 0;
}
</style>
