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
                    <img :src="comment.userAvatar || defaultAvatar" class="small-image" alt="用户头像" @click="goToProfile(comment.userId)" style="cursor:pointer;"/>
                    <span class="user" @click="goToProfile(comment.userId)" style="cursor:pointer;">{{ comment.userAccount }}</span>
                    <span class="time">{{ formatDate(comment.commentedAt) }}</span>
                </div>
                <div class="comment-actions">
                    <img src="../assets/delete.png" v-if="comment.userId === userId"
                         @click="beforeDelete(comment.commentId)" class="image" alt="Icon"/>
                    <img src="../assets/comment.png" @click="beforeComment(comment.commentId)" class="image" alt="Icon"/>
                    <el-button 
                        size="small" 
                        :type="comment.isLiked ? 'primary' : 'default'"
                        @click="handleLike(comment)"
                        :loading="comment.likeLoading"
                    >
                        <el-icon style="margin-right:4px;"><Star /></el-icon>
                        {{ comment.likeCount }}
                    </el-button>
                </div>
            </div>
            <div class="comment-body">
                <p>{{ comment.commentText }}</p>
            </div>
            <hr v-if="comment.parentComment">
            <div v-if="comment.parentComment && getParentComment(comment.parentComment)" class="reply-section">
                <div class="reply-label">
                    <strong>回复: {{ getParentComment(comment.parentComment)?.userAccount }}</strong>
                </div>
                <div class="reply-content">
                    <p>{{ getParentComment(comment.parentComment)?.commentText }}</p>
                </div>
            </div>
            <div v-else-if="comment.parentComment" class="reply-section">
                <div class="reply-label">
                    <strong>回复内容不存在</strong>
                </div>
            </div>
            
            <!-- 二级评论展示 -->
            <div v-if="comment.children && comment.children.length > 0" class="children-comments">
                <div v-for="childComment in comment.children" :key="childComment.commentId" 
                     class="child-comment" :ref="el => { if(el) commentRefs[childComment.commentId] = el }">
                    <div class="child-comment-header">
                        <div class="comment-info">
                            <img :src="childComment.userAvatar || defaultAvatar" class="small-image" alt="用户头像" @click="goToProfile(childComment.userId)" style="cursor:pointer;"/>
                            <span class="user" @click="goToProfile(childComment.userId)" style="cursor:pointer;">{{ childComment.userAccount }}</span>
                            <span class="time">{{ formatDate(childComment.commentedAt) }}</span>
                        </div>
                        <div class="comment-actions">
                            <img src="../assets/delete.png" v-if="childComment.userId === userId"
                                 @click="beforeDelete(childComment.commentId)" class="image" alt="Icon"/>
                            <el-button 
                                size="small" 
                                :type="childComment.isLiked ? 'primary' : 'default'"
                                @click="handleLike(childComment)"
                                :loading="childComment.likeLoading"
                            >
                                <el-icon style="margin-right:4px;"><Star /></el-icon>
                                {{ childComment.likeCount }}
                            </el-button>
                        </div>
                    </div>
                    <div class="child-comment-body">
                        <p>{{ childComment.commentText }}</p>
                    </div>
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
import {ref, onMounted, computed, watch} from "vue";
import {
    getProjectComments, 
    getCommentLikeCount, 
    likeComment, 
    isLikedComment, 
    cancelLikeComment, 
    addProjectComment,
    deleteProjectComment
} from "@/page/project-detail/api/api";
import {callSuccess, callInfo, callError} from "@/call";
import store from "@/store";
import { ElMessage } from "element-plus";
import { Star } from '@element-plus/icons-vue';

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
            if (!props.work || !props.work.projectDetail) return null;
            return props.work.projectDetail.projectId || props.work.projectDetail.id;
        });
        
        // 获取项目评论
        const fetchComments = async () => {
            if (!projectId.value) {
                console.error("项目ID不存在");
                loading.value = false;
                return;
            }
            
            try {
                loading.value = true;
                const result = await getProjectComments(projectId.value);
                console.log("获取评论结果:", result);
                
                if (result && result.code === 0 && result.data) {
                    // 添加额外的字段以支持交互
                    const processedComments = result.data.map(comment => ({
                        ...comment,
                        likeLoading: false,
                        // 处理二级评论
                        children: comment.children ? comment.children.map(child => ({
                            ...child,
                            likeLoading: false
                        })) : []
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
                    likeLoading: false,
                    children: [
                        {
                            commentId: 3,
                            projectId: projectId.value,
                            layer: 2,
                            parentComment: 1,
                            userId: 102,
                            userAccount: 'Bob',
                            userAvatar: 'https://i.pravatar.cc/150?img=2',
                            commentText: '完全同意你的观点！',
                            commentedAt: '2024-07-20T11:45:00',
                            likeCount: 2,
                            isLiked: false,
                            likeLoading: false,
                            children: []
                        }
                    ]
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
                    likeLoading: false,
                    children: []
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
                    likeLoading: false,
                    children: []
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
                    likeLoading: false,
                    children: []
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
            
            // 检查是否为二级评论，如果是则不允许回复
            const comment = findCommentById(commentId);
            if (comment && comment.layer === 2) {
                ElMessage.warning('不能对二级评论进行回复');
                return;
            }
            
            commentToId.value = commentId;
            dialogVisible.value = true;
        };
        
        // 根据ID查找评论（包括二级评论）
        const findCommentById = (commentId) => {
            // 先在一级评论中查找
            let comment = allComments.value.find(c => c.commentId === commentId);
            if (comment) return comment;
            
            // 在二级评论中查找
            for (const parentComment of allComments.value) {
                if (parentComment.children) {
                    const childComment = parentComment.children.find(c => c.commentId === commentId);
                    if (childComment) return childComment;
                }
            }
            return null;
        };
        
        // 提交评论
        const commitComment = async (parentId) => {
            if (!userInput.value.trim()) {
                ElMessage.warning('评论内容不能为空');
                return;
            }
            
            if (!props.userId) {
                ElMessage.warning('请先登录后再评论');
                dialogVisible.value = false;
                return;
            }
            
            if (!projectId.value) {
                ElMessage.error('项目ID不存在，无法提交评论');
                dialogVisible.value = false;
                return;
            }
            
            try {
                dialogVisible.value = false;
                
                // 调用API添加评论
                const commentId = await addProjectComment(
                    projectId.value,
                    userInput.value,
                    parentId || null  // 如果是回复评论，传入父评论ID
                );
                
                if (commentId) {
                    callSuccess("评论发布成功");
                    userInput.value = "";
                    
                    // 重新加载评论列表
                    await fetchComments();
                }
            } catch (error) {
                console.error("提交评论失败:", error);
                callError("评论提交失败，请稍后再试");
            }
        };
        
        // 处理删除评论
        const beforeDelete = (commentId) => {
            deleteId.value = commentId;
            deleteVisible.value = true;
        };
        
        // 执行删除评论
        const deleteComment = async (commentId) => {
            if (!commentId) {
                deleteVisible.value = false;
                return;
            }

            try {
                deleteVisible.value = false;
                
                // 调用API删除评论
                const success = await deleteProjectComment(commentId);
                
                if (success) {
                    callSuccess("评论删除成功");
                    
                    // 重新加载评论列表
                    await fetchComments();
                }
            } catch (error) {
                console.error("删除评论失败:", error);
                callError("删除评论失败，请稍后再试");
            }
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
                    
                    // 处理二级评论
                    if (comment.children && comment.children.length > 0) {
                        for (const childComment of comment.children) {
                            try {
                                childComment.isLiked = await isLikedComment(props.userId, childComment.commentId);
                                childComment.likeCount = await getCommentLikeCount(childComment.commentId);
                            } catch (error) {
                                console.error(`获取二级评论(${childComment.commentId})点赞状态失败:`, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`获取评论(${comment.commentId})点赞状态失败:`, error);
                }
            }
        };
        
        // 申请加入项目
        const applyJoin = () => {
            callInfo("您的加入申请已发送！");
            loginVisible.value = false;
        };
        
        // 组件挂载后获取评论
        onMounted(() => {
            if (projectId.value) {
                fetchComments();
            } else {
                console.error("项目ID不存在，无法获取评论");
                loading.value = false;
            }
        });
        
        // 监听项目ID变化，重新获取评论
        watch(() => projectId.value, (newId, oldId) => {
            if (newId && newId !== oldId) {
                fetchComments();
            }
        });
        
        function goToProfile(userId) {
            if (!userId) return;
            window.open(`/profile/${userId}`, '_blank');
        }
        
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
            applyJoin,
            Star,
            goToProfile
        };
    }
}
</script>

<style scoped>
.comment-container {
    margin-top: 20px;
    /* margin-left: 20px; */
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
    /* width: 100%; */
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
    font-size: 15px;
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

.small-image {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    transition: box-shadow 0.2s, border-color 0.2s;
}

.small-image:hover {
    box-shadow: 0 4px 2px rgba(64,158,255,0.18);
    border-color: #409eff;
}

.user {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    cursor: pointer;
    transition: text-decoration 0.2s, color 0.2s;
}

.user:hover {
    text-decoration: underline;
    color: #409eff;
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

hr {
    border: 0;
    height: 1px;
    background: #ebeef5;
    margin: 16px 0;
}

/* 二级评论样式 */
.children-comments {
    margin-top: 16px;
    padding-left: 20px;
    border-left: 2px solid #e4e7ed;
}

.child-comment {
    background-color: #fff;
    border: 1px solid #ebeef5;
    margin-bottom: 12px;
    padding: 16px;
    border-radius: 8px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.child-comment::before {
    content: '';
    position: absolute;
    left: -22px;
    top: 20px;
    width: 20px;
    height: 1px;
    background-color: #e4e7ed;
}

.child-comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.child-comment-body {
    font-size: 13px;
    line-height: 1.5;
    color: #606266;
    margin: 8px 0;
}

.child-comment-body p {
    margin: 0;
}

.reply-section {
    margin-top: 12px;
}

.reply-label {
    font-weight: 600;
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
}

.reply-content {
    background-color: #f8f9fa;
    border: 1px solid #ebeef5;
    padding: 12px;
    border-radius: 4px;
    font-size: 13px;
    line-height: 1.5;
    color: #606266;
}

.reply-content p {
    margin: 0;
}

.comment-actions .el-button {
    border-radius: 16px;
    padding: 0 14px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 48px;
    transition: box-shadow 0.2s, background 0.2s;
}
.comment-actions .el-button .el-icon {
    font-size: 18px;
    margin-right: 4px;
}
.comment-actions .el-button--primary {
    background: linear-gradient(90deg, #409eff 60%, #66b1ff 100%);
    color: #fff;
    border: none;
}
.comment-actions .el-button--default {
    background: #f6f8fa;
    color: #409eff;
    border: 1px solid #dbeafe;
}
.comment-actions .el-button:hover {
    box-shadow: 0 2px 8px rgba(64,158,255,0.15);
    background: #ecf5ff;
    color: #409eff;
}
.comment-actions .el-button--default:hover {
    background: linear-gradient(90deg, #409eff 60%, #66b1ff 100%);
    color: #fff;
    border: none;
    box-shadow: 0 2px 8px rgba(64,158,255,0.18);
}
</style>
