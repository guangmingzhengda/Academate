<template>
    <div class="image-container">
        <img src="../assets/comment.png" @click="beforeComment" class="image" alt="Icon"/>
        <img v-if="canShare" src="../assets/share.png" @click="shareVisible = true" class="image" alt="Icon"/>
        <img src="../assets/applyJoin.png" @click="applyJoin" class="image" alt="Icon"/>
        <el-dialog
            v-model="shareVisible"
            title="邀请他人加入项目"
            width="500"
        >
            <div class="invite-content">
                <el-input v-model="inviteeName" placeholder="请输入被邀请人姓名" style="margin-bottom: 16px; width: 80%;" />
                <el-button @click="searchUserByName" type="primary" size="small" style="margin-left: 8px;">查询</el-button>
                <el-table v-if="userList.length > 0" :data="userList" style="margin-top: 16px;">
                    <el-table-column prop="name" label="姓名" width="120" />
                    <el-table-column prop="email" label="邮箱" width="180" />
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column label="操作" width="100">
                        <template #default="scope">
                            <el-button type="success" size="small" @click="handleInvite(scope.row)">邀请</el-button>
                        </template>
                    </el-table-column>
                </el-table>
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
                    <el-button @click="commentVisible = false">Cancel</el-button>
                    <el-button type="primary" @click="commitComment">
                        Confirm
                    </el-button>
                </div>
            </template>
        </el-dialog>
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
    </div>
</template>

<script lang="js">
import {ref} from "vue";
import {callInfo, callSuccess} from "@/call";
import {
    commitCommentAPI,
    invite
} from "@/page/achievement-detail/api/api";
import store from "@/store";
import {ElMessage} from "element-plus";
import { searchUsers } from "@/api/project";
export default {
    name: "function-bar",
    props: {
        work: {

        },
        authorNameList: [],
        achievementName: "文章名字",
        role: "",
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
        // if(this.isLogin()) {
        //     let starKinds = await getStarKindsAPI(store.getters.getId, 1, 100);
        //     this.categories = starKinds.list;
        //     const res = await isFavoredAPI(decode_function(this.$route.params.id));
        //     if(res === true)
        //         this.isStar = 1;
        // }
    },
    methods: {
        isLogin() {
            return store.getters.getToken !== null;
        },
        applyJoin() {
            // TODO: 向后端申请加入项目
            callSuccess("成功发送申请，请等待项目负责人审核");
            this.loginVisible = false;
        },
        canShare() {
            return props.role === "creator";
        }
    },
    setup(props) {
        let userInput = ref('');
        let shareVisible = ref(false);
        let commentVisible = ref(false);
        let loginVisible = ref(false);
        let inviteeName = ref("");
        let userList = ref([
            { id: 1, name: '张三', email: 'zhangsan@example.com' },
            { id: 2, name: '李四', email: 'lisi@example.com' },
            { id: 3, name: '王五', email: 'wangwu@example.com' },
        ]);
        function beforeComment() {
            if(props.role != "creator" && props.role != "participant") {
                this.commentVisible = true;
            }
            else this.loginVisible = true;
        }
        async function commitComment() {
            let res = await commitCommentAPI(userInput.value, props.work.articleDetail.id, null);
            if(res) {
                userInput.value = "";
                commentVisible.value = false;
                callSuccess("评论成功");
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        }
        async function searchUserByName() {
            if (!inviteeName.value) {
                ElMessage.error('请输入被邀请人姓名');
                return;
            }
            try {
                const res = await searchUsers({
                    userName: inviteeName.value,
                    current: 1,
                    pageSize: 10
                });
                if (res.code === 0 && res.data && Array.isArray(res.data.list)) {
                    userList.value = res.data.list.map(u => ({
                        id: u.id,
                        name: u.account,
                        email: u.email,
                        institution: u.institution,
                        field: u.field,
                    }));
                } else {
                    userList.value = [];
                }
            } catch (e) {
                ElMessage.error('查询失败');
                userList.value = [];
            }
        }
        async function handleInvite(user) {
            try {
                const inviter = store.getters.getId;
                const res = await invite({ inviter, invitee: user.id });
                if (res.code === 0) {
                    callSuccess('邀请发送成功');
                    shareVisible.value = false;
                    inviteeName.value = "";
                    userList.value = [];
                } else {
                    ElMessage.error(res.message || '邀请失败');
                }
            } catch (e) {
                ElMessage.error('邀请失败');
            }
        }
        function modifyAbstract(s) {
            let las = Math.max(s.lastIndexOf('.'), s.lastIndexOf('。'));
            if(las === -1) return s;
            return s.substring(0, las + 1);
        }
        return {
            commitComment,
            beforeComment,
            shareVisible,
            commentVisible,
            userInput,
            loginVisible,
            modifyAbstract,
            inviteeName,
            userList,
            searchUserByName,
            handleInvite,
        };
    }
}
</script>

<style scoped>
.image-container {
    display: inline-block;
}

.image {
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: transform 0.3s ease;
    margin: 5px;
}

.image:hover {
    transform: scale(1.2);
}

.info {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
}

.quote-text {
    font-size: 14px;
    text-align: left;
}

.info-title {
    font-size: 16px;
    font-weight: bold;
    text-align: left;
}

.custom-textarea {
    width: 95%;
    height: 150px;
    padding: 10px;
    font-size: 16px;
    line-height: 1.5;
    border: 1px solid #ccc;
    border-radius: 5px;
    resize: vertical;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
}
</style>
