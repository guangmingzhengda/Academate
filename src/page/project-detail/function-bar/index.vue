<template>
    <div class="image-container">
        <!-- 评论按钮：creator和participant可见 -->
        <el-tooltip content="发表评论" placement="bottom">
            <img v-if="role === 'creator' || role === 'participant'" 
                 src="../assets/comment.png" @click="handleComment" class="image" alt="评论" 
            />
        </el-tooltip>
        
        <!-- 邀请按钮：只有creator可见 -->
        <el-tooltip content="邀请用户加入项目" placement="bottom">
            <img v-if="role === 'creator'" 
                 src="../assets/share.png" @click="shareVisible = true" class="image" alt="邀请" 
            />
        </el-tooltip>
        
        <!-- 查看邀请列表按钮：只有creator可见 -->
        <el-tooltip content="查看邀请列表" placement="bottom">
            <img v-if="role === 'creator'"
                 src="../assets/inviteList.png" @click="openInviteList" class="image" alt="邀请列表" />
        </el-tooltip>
        
        <!-- 结束项目按钮：只有creator可见且项目状态不为已完成 -->
        <el-tooltip content="结束项目" placement="bottom">
            <img v-if="role === 'creator' && work?.projectDetail?.status !== 'Completed'" 
                 src="../assets/over.png" @click="handleCompleteProject" class="image" alt="结束项目" 
            />
        </el-tooltip>
        
        <!-- 删除项目按钮：只有creator可见 -->
        <el-tooltip content="删除项目" placement="bottom">
            <img v-if="role === 'creator'" 
                 src="../assets/delete.png" @click="handleDeleteProject" class="image" alt="删除项目" 
            />
        </el-tooltip>
        
        <!-- 申请加入按钮：对非项目成员可见 -->
        <el-tooltip content="申请加入项目" placement="bottom">
            <img v-if="role !== 'creator' && role !== 'participant'" 
                 src="../assets/applyJoin.png" @click="applyJoin" class="image" alt="申请加入" 
            />
        </el-tooltip>
             
        <el-dialog
            v-model="shareVisible"
            title="邀请他人加入项目"
            width="650"
        >
            <div class="invite-content">
                <div class="search-form">
                    <el-form :inline="true">
                        <el-form-item label="姓名">
                            <el-input v-model="searchParams.userName" placeholder="请输入用户姓名" />
                        </el-form-item>
                        <el-form-item label="机构">
                            <el-input v-model="searchParams.institution" placeholder="请输入所属机构" />
                        </el-form-item>
                        <el-form-item label="研究方向">
                            <el-input v-model="searchParams.field" placeholder="请输入研究方向" />
                        </el-form-item>
                        <el-form-item label="研究成果">
                            <el-input v-model="searchParams.researchTitle" placeholder="请输入研究成果关键词" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="searchUserByName">查询</el-button>
                            <el-button @click="resetSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>
                <div v-if="userList.length > 0" class="search-result">
                    <el-table :data="userList" style="width: 100%">
                        <el-table-column prop="name" label="姓名" width="100" />
                        <el-table-column prop="email" label="邮箱" width="180" />
                        <el-table-column prop="institution" label="机构" width="120" />
                        <el-table-column prop="field" label="研究方向" width="120" />
                        <el-table-column label="操作" width="100">
                            <template #default="scope">
                                <el-button type="success" size="small" @click="handleInvite(scope.row)">邀请</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <el-empty v-else description="暂无匹配的用户" />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="shareVisible = false">关闭</el-button>
                </div>
            </template>
        </el-dialog>
        <el-dialog
            v-model="commentVisible"
            title="发表项目评论"
            width="500"
        >
            <textarea v-model="userInput" placeholder="请输入信息" class="custom-textarea"></textarea>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="commentVisible = false">取消</el-button>
                    <el-button type="primary" @click="commitComment">
                        提交
                    </el-button>
                </div>
            </template>
        </el-dialog>
        <el-dialog
            v-model="loginVisible"
            title="提示"
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
        <el-dialog
            v-model="inviteListVisible"
            title="已发出邀请列表"
            width="900"
        >
            <div v-if="inviteListLoading">
                <el-skeleton :rows="6" animated style="margin: 30px 0;" />
            </div>
            <div v-else-if="inviteList && inviteList.length > 0">
                <el-table :data="inviteList" border stripe style="width:100%">
                    <el-table-column label="被邀请人" width="150">
                        <template #default="scope">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <el-avatar :src="scope.row.receiverAvatar" size="32" style="background:#f2f6fc;">
                                    <span v-if="!scope.row.receiverAvatar">{{ scope.row.receiverName?.charAt(0) || '?' }}</span>
                                </el-avatar>
                                <span style="font-weight:500;">{{ scope.row.receiverName }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="message" label="邀请信息"/>
                    <el-table-column prop="sentAt" label="发送时间" width="160"/>
                    <el-table-column prop="status" label="状态" width="100"/>
                    <el-table-column prop="isAccepted" label="是否接受" width="100"/>
                    <el-table-column label="操作" width="120">
                        <template #default="scope">
                            <el-button v-if="scope.row.status === 'pending'" type="danger" size="small" @click="handleCancelInvite(scope.row)">
                                取消邀请
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div v-else style="text-align:center;color:#999;padding:40px 0;">暂无邀请信息</div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="inviteListVisible = false">关闭</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="js">
import {ref} from "vue";
import {callInfo, callSuccess} from "@/call";
import store from "@/store";
import {ElMessage} from "element-plus";
import { searchUsers } from "@/api/search";
import { invite, applyJoinProject, deleteProject, completeProject } from "@/api/project";
import { addProjectComment, getProjectInvitations, cancelProjectInvitation } from "@/page/project-detail/api/api";
import { get_user_detail } from "@/api/profile";
import { ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";

export default {
    name: "function-bar",
    props: {
        work: {
            type: Object,
            required: true
        },
        authorNameList: {
            type: Array,
            default: () => []
        },
        achievementName: {
            type: String,
            default: "文章名字"
        },
        role: {
            type: String,
            default: ""
        },
        publicationDate: Object,
    },
    data() {
        return {
            categories: Object,
            starVisible: ref(false),
            isStar: ref(0),
            chooseId: ref("请选择收藏夹"),
        }
    },
    async mounted() {
    },
    setup(props) {
        let userInput = ref('');
        let shareVisible = ref(false);
        let commentVisible = ref(false);
        let loginVisible = ref(false);
        let userList = ref([]);
        let searchParams = ref({
            userName: '',
            institution: '',
            field: '',
            researchTitle: '',
            current: 1,
            pageSize: 10
        });
        let inviteListVisible = ref(false);
        let inviteList = ref([]);
        let inviteListLoading = ref(false);
        const router = useRouter();
        
        function resetSearch() {
            searchParams.value = {
                userName: '',
                institution: '',
                field: '',
                researchTitle: '',
                current: 1,
                pageSize: 10
            };
            userList.value = [];
        }
        
        function handleComment() {
            // 只有creator和participant可以评论
            if (props.role === "creator" || props.role === "participant") {
                commentVisible.value = true;
            } else {
                loginVisible.value = true;
            }
        }
        
        async function commitComment() {
            if (!userInput.value.trim()) {
                ElMessage.warning('评论内容不能为空');
                return;
            }
            
            const userId = store.getters.getId;
            if (!userId) {
                ElMessage.warning('请先登录后再评论');
                return;
            }
            
            try {
                const projectId = props.work?.projectDetail?.projectId || props.work?.projectDetail?.id;
                if (!projectId) {
                    ElMessage.error('项目ID不存在，无法提交评论');
                    return;
                }
                
                // 使用新的评论API
                const commentId = await addProjectComment(projectId, userInput.value);
                
                if (commentId) {
                userInput.value = "";
                commentVisible.value = false;
                callSuccess("评论成功");
                setTimeout(() => {
                    location.reload();
                }, 2000);
                }
            } catch (error) {
                console.error("提交评论失败:", error);
                ElMessage.error("评论提交失败，请稍后再试");
            }
        }
        
        async function searchUserByName() {
            try {
                if (!searchParams.value.userName && 
                    !searchParams.value.institution && 
                    !searchParams.value.field && 
                    !searchParams.value.researchTitle) {
                    ElMessage.warning('请至少输入一个搜索条件');
                    return;
                }
                
                // 只有项目创建者才能邀请他人
                if (props.role !== "creator") {
                    ElMessage.error("您没有权限邀请他人加入项目");
                    return;
                }
                
                const res = await searchUsers(searchParams.value);
                if (res.data && res.data.code === 0 && res.data.data) {
                    userList.value = res.data.data.list.map(u => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        institution: u.institution,
                        field: u.field,
                        profile: u.profile,
                        avatar: u.avatar
                    }));
                    
                    if (userList.value.length === 0) {
                        ElMessage.warning('未找到匹配用户');
                    }
                } else {
                    userList.value = [];
                    ElMessage.warning('未找到匹配用户');
                }
            } catch (e) {
                console.error(e);
                ElMessage.error('查询失败');
                userList.value = [];
            }
        }
        
        async function handleInvite(user) {
            try {
                // 验证权限
                if (props.role !== "creator") {
                    ElMessage.error("只有项目创建者才能邀请他人");
                    return;
                }
                
                const inviter = store.getters.getId;
                if (!inviter) {
                    ElMessage.error("请先登录");
                    return;
                }
                
                const projectId = props.work?.projectDetail?.projectId || props.work?.projectDetail?.id;
                if (!projectId) {
                    ElMessage.error("项目ID不存在");
                    return;
                }
                
                const title = props.work?.projectDetail?.title || '';
                const res = await invite({ 
                    inviter, 
                    invitee: [user.id],
                    projectId,
                    title
                });
                if (res.code === 0) {
                    callSuccess('邀请发送成功');
                    shareVisible.value = false;
                    resetSearch();
                } else {
                    ElMessage.error(res.message || '邀请失败');
                }
            } catch (e) {
                console.error(e);
                ElMessage.error('邀请失败');
            }
        }
        
        async function applyJoin() {
            try {
                const userId = store.getters.getId;
                if (!userId) {
                    ElMessage.error("请先登录");
                    return;
                }
                
                const projectId = props.work?.projectDetail?.projectId || props.work?.projectDetail?.id;
                if (!projectId) {
                    ElMessage.error("项目ID不存在");
                    return;
                }
                
                const title = props.work?.projectDetail?.title || '';
                
                console.log(projectId, userId, title);
                
                const result = await applyJoinProject({
                    applicant: userId,
                    projectId: Number(projectId),
                    title: title
                });
                
                if (result && result.code === 0) {
                    // 申请成功的消息已在API中显示
                    console.log('申请加入项目成功');
                    loginVisible.value = false;
                }
            } catch (error) {
                console.error('申请加入项目出错:', error);
                ElMessage.error('申请加入项目失败，请稍后重试');
            }
        }
        
        async function openInviteList() {
            inviteListVisible.value = true;
            inviteListLoading.value = true;
            const projectId = props.work?.projectDetail?.projectId || props.work?.projectDetail?.id;
            if (!projectId) {
                inviteList.value = [];
                inviteListLoading.value = false;
                ElMessage.error('项目ID不存在，无法获取邀请列表');
                return;
            }
            const res = await getProjectInvitations(projectId);
            let list = Array.isArray(res) ? res : [];
            // 并发获取所有被邀请人信息
            const userMap = {};
            await Promise.all(list.map(async (item) => {
                if (item.receiverId && !userMap[item.receiverId]) {
                    const user = await get_user_detail({ userId: item.receiverId });
                    userMap[item.receiverId] = user;
                }
            }));
            // 合并用户信息
            inviteList.value = list.map(item => ({
                ...item,
                receiverName: userMap[item.receiverId]?.name || ('ID:' + item.receiverId),
                receiverAvatar: userMap[item.receiverId]?.avatar || '',
            }));
            inviteListLoading.value = false;
        }
        
        async function handleCancelInvite(row) {
            if (!row.messageId) return;
            const ok = await cancelProjectInvitation(row.messageId);
            if (ok) {
                openInviteList(); // 刷新列表
            }
        }
        
        async function handleCompleteProject() {
            if (!props.work?.projectDetail?.projectId) {
                ElMessage.error('无法获取项目ID');
                return;
            }
            
            try {
                // 显示确认对话框
                ElMessageBox.confirm(
                    '确定要结束该项目吗？项目状态将变为"已完成"。',
                    '结束项目',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                ).then(async () => {
                    const projectId = props.work.projectDetail.projectId;
                    const success = await completeProject(projectId);
                    
                    if (success) {
                        // 刷新页面以显示更新后的状态
                        window.location.reload();
                    }
                }).catch(() => {
                    // 用户取消操作
                    ElMessage.info('已取消操作');
                });
            } catch (error) {
                console.error('结束项目失败:', error);
                ElMessage.error('结束项目失败');
            }
        }
        
        async function handleDeleteProject() {
            if (!props.work?.projectDetail?.projectId) {
                ElMessage.error('无法获取项目ID');
                return;
            }
            
            try {
                // 显示确认对话框
                ElMessageBox.confirm(
                    '确定要删除该项目吗？此操作不可逆，项目的所有数据将被永久删除。',
                    '删除项目',
                    {
                        confirmButtonText: '确定删除',
                        cancelButtonText: '取消',
                        type: 'danger',
                    }
                ).then(async () => {
                    const projectId = props.work.projectDetail.projectId;
                    const success = await deleteProject(projectId);
                    
                    if (success) {
                        // 删除成功后跳转到首页
                        router.push('/');
                    }
                }).catch(() => {
                    // 用户取消操作
                    ElMessage.info('已取消删除');
                });
            } catch (error) {
                console.error('删除项目失败:', error);
                ElMessage.error('删除项目失败');
            }
        }
        
        return {
            commitComment,
            handleComment,
            shareVisible,
            commentVisible,
            userInput,
            loginVisible,
            searchUserByName,
            resetSearch,
            userList,
            searchParams,
            handleInvite,
            applyJoin,
            inviteListVisible,
            inviteList,
            inviteListLoading,
            openInviteList,
            handleCancelInvite,
            handleCompleteProject,
            handleDeleteProject
        };
    }
}
</script>

<style scoped>
.image-container {
    display: flex;
    gap: 16px;
    margin-top: 16px;
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

.invite-content {
    max-height: 500px;
    overflow-y: auto;
}

.search-form {
    margin-bottom: 20px;
}

.search-result {
    margin-top: 20px;
}
</style>
