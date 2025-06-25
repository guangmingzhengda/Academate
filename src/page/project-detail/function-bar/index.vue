<template>
    <div class="image-container">
        <!-- 评论按钮：creator和participant可见 -->
        <img v-if="role === 'creator' || role === 'participant'" 
             src="../assets/comment.png" @click="handleComment" class="image" alt="评论" 
             title="发表评论"/>
        
        <!-- 邀请按钮：只有creator可见 -->
        <img v-if="role === 'creator'" 
             src="../assets/share.png" @click="shareVisible = true" class="image" alt="邀请" 
             title="邀请用户加入项目"/>
        
        <!-- 申请加入按钮：对非项目成员可见 -->
        <img v-if="role !== 'creator' && role !== 'participant'" 
             src="../assets/applyJoin.png" @click="applyJoin" class="image" alt="申请加入" 
             title="申请加入项目"/>
             
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
    </div>
</template>

<script lang="js">
import {ref} from "vue";
import {callInfo, callSuccess} from "@/call";
import store from "@/store";
import {ElMessage} from "element-plus";
import { searchUsers } from "@/api/search";
import { invite } from "@/api/project";
import { addProjectComment } from "@/page/project-detail/api/api";

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
                        name: u.account,
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
        
        function applyJoin() {
            callSuccess("成功发送申请，请等待项目负责人审核");
            loginVisible.value = false;
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
            applyJoin
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
