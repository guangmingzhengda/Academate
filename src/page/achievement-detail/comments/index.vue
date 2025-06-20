<template>
    <el-dialog
        v-model="loginVisible"
        title="Tips"
        width="500"
    >
        <span>该功能需要登录后才可使用</span>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="loginVisible = false">暂不登录</el-button>
                <el-button type="primary" @click="goToLogin">
                    前往登录
                </el-button>
            </div>
        </template>
    </el-dialog>
    <div class="comment-container">
        <div v-if="!exist">
            目前还没有评论~
        </div>
        <div v-if="exist" v-for="(comment, index) in comments.commentList" :key="index"
             class="comment" :ref="setCommentRef">
            <div class="comment-header">
                <div class="comment-info">
<!--                    <img :id="'avatar ' + comment.userId" src="../assets/default_avatar.png" class="small-image" alt="加载失败"-->
<!--                         />-->
                    <img :src="comment.avatar ? comment.avatar : '../assets/default_avatar.png'" class="small-image" alt="../assets/default_avatar.png"/>
                    <span class="user">{{ comment.account }}</span>
<!--                    <span class="replies" v-if="comment.replyId == null">评论本文</span>-->
                    <span class="time">{{ comment.time }}</span>
                </div>
                <div class="comment-actions">
                    <img src="../assets/delete.png" v-if="comment.userId === userId"
                         @click="beforeDelete(comment.id)" class="image" alt="Icon"/>
                    <img src="../assets/comment.png" @click="beforeComment(comment.id)" class="image" alt="Icon"/>
                    <el-dialog
                        v-model="dialogVisible"
                        title="回复评论"
                        width="500"
                    >
                        <textarea v-model="userInput" placeholder="请输入评论" class="custom-textarea"></textarea>
                        <template #footer>
                            <div class="dialog-footer">
                                <el-button @click="dialogVisible = false">Cancel</el-button>
                                <el-button type="primary" @click="commitComment(commentToId)">
                                    Confirm
                                </el-button>
                            </div>
                        </template>
                    </el-dialog>
                    <el-dialog
                        v-model="deleteVisible"
                        title="确认删除"
                        width="500"
                    >
                        <template #footer>
                            <div class="dialog-footer">
                                <el-button @click="deleteVisible = false">Cancel</el-button>
                                <el-button type="primary" @click="deleteComment(deleteId)">
                                    Confirm
                                </el-button>
                            </div>
                        </template>
                    </el-dialog>
                </div>
            </div>
            <div class="comment-body">
                <p>{{ comment.content }}</p>
            </div>
            <hr v-if="comment.replyId != null">
            <div class="comment-reply" style="max-width: 80%" v-if="comment.replyId != null && comment.isDel === false">
                <div class="reply-header">
                    <strong>回复: 用户{{ getCommentById(comment.replyId).userId + "  "}}</strong>
                    <img src="../assets/goBack.png" class="small-small-image" alt="Icon"
                         @click="goToComment(comment.replyId)">
                </div>
                <div class="source-comment">
                    <p class="source-content">
                        源评论: {{ getCommentById(comment.replyId).content }}
                    </p>
                    <p class="source-time">
                        评论时间: {{  getCommentById(comment.replyId).time  }}
                    </p>
                </div>
            </div>
            <div class="comment-reply" style="max-width: 100%" v-if="comment.replyId != null && comment.isDel === true">
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
        <div v-if="exist" class="pagination-container">
            <el-pagination
                layout="prev, pager, next"
                v-model:total="pages.total"
                v-model:page-size="pages.pageSize"
                v-model:current-page="pages.cur"
                @current-change="handleCurrentChange"
            />
        </div>
    </div>
</template>

<script lang="js">
import {ref} from "vue";
import {commitCommentAPI, deleteCommentAPI, getAllCommentsAPI, getUserInfo,} from "@/page/achievement-detail/api/api";
import {callSuccess} from "@/call";
import store from "@/store";
import {getUserAuthorId} from "@/api/favourite";
import {decode_function} from "@/decode/code";
export default {
    name: "comments",
    props: {
        work: {
        },
        userId: 0,
    },
    data() {
        return {
            comments: {
                commentList: [
                    {
                        "isDel": false,
                    }
                ]
            },
            deleteId: ref(0),
            commentToId: ref(0),
            dialogVisible: ref(false),
            deleteVisible: ref(false),
            loginVisible: ref(false),
            userInput: ref(""),
            pages: ref({
                total: 0,
                cur: 1,
                pageSize: 4,
            }),
            exist: ref(false),
            totComments: Object,
            referComment: Object,
            commentRef: [],
            avatars: ref([]),
        };
    },
    async mounted() {
        this.totComments = await this.pullData();
        for(let i = 0; i < this.totComments.commentList.length; i++) {
            if(this.totComments.commentList[i].replyId === null) continue;
            let found = false;
            for(let j = 0; j < this.totComments.commentList.length; j++) {
                if(this.totComments.commentList[i].replyId === this.totComments.commentList[j].id) {
                    found = true;
                    break;
                }
            }
            this.totComments.commentList[i]['isDel'] = !found;
        }
        this.comments.commentList = []
        for(let i = 0; i < 4 && i < this.totComments.commentList.length; i++) {
            this.comments.commentList.push(this.totComments.commentList[i]);
        }
        this.pages.total = this.totComments.total;
        if(this.pages.total !== 0) this.exist = true;
        // this.comments.commentList.forEach((comment) => {
        //     const elementId = `avatar ${comment.userId}`; // 生成对应的元素ID
        //     this.updateAvatar(comment.userId, elementId);
        // });
    },
    methods: {
        async fetchAvatar(userId) {
            try {
                const data = await getUserAuthorId(userId);
                let avatarUrl = data.account;
                if (data.avatar == null) {
                    avatarUrl = "https://s2.loli.net/2024/12/21/UcYvXnKWVSkDuEA.png";
                } else {
                    avatarUrl = data.avatar;
                }
                return avatarUrl;
            } catch (error) {
                return null;
            }
        },
        // async updateAvatar(userId, elementId) {
        //     const avatarUrl = await this.fetchAvatar(userId);
        //     if (avatarUrl) {
        //         document.getElementById(elementId).src = avatarUrl;
        //     }
        // },
        async pullData() {
            return getAllCommentsAPI(decode_function(this.$route.params.id), 20, 1);
          // return getAllCommentsAPI(this.$route.params.id, 20, 1);
        },
        setCommentRef(comment) {
            if(comment) {
                this.commentRef.push(comment);
            }
        },
        beforeComment(id) {
            if(store.getters.getToken === null) {
                this.loginVisible = true;
            }
            else {
                this.dialogVisible = true;
                this.commentToId = id;
            }
        },
        commitComment(id) {
            this.dialogVisible = false;
            commitCommentAPI(this.userInput, this.work.id, id);
            this.userInput = "";
            callSuccess("评论成功");
            setTimeout(() => {
                location.reload();
            }, 2000);
        },
        beforeDelete(id) {
            this.deleteId = id;
            this.deleteVisible= true
        },
        async deleteComment(id) {
            let res = await deleteCommentAPI(id);
            if(res) {
                callSuccess("删除成功");
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        },
        async handleCurrentChange() {
            this.comments.commentList = []
            for(let i = (this.pages.cur - 1) * 4; i < 4 * this.pages.cur && i < this.totComments.commentList.length; i++) {
                this.comments.commentList.push(this.totComments.commentList[i]);
            }
        },
        getCommentById(commentId) {
            for(let i = 0; i< this.totComments.commentList.length; i++) {
                if(this.totComments.commentList[i].id === commentId) {
                    return this.totComments.commentList[i];
                }
            }
        },
        async goToComment(commentId) {
            let id = 0;
            for (let i = 0; i < this.totComments.commentList.length; i++) {
                if (this.totComments.commentList[i].id === commentId) {
                    id = i;
                    break;
                }
            }
            this.pages.cur = Math.floor((id) / 4) + 1;
            await this.handleCurrentChange();

            const dstComment = this.commentRef[id % 4];
            dstComment.scrollIntoView({behavior: 'smooth', block: 'center'});
        },
        goToLogin() {
            window.open("/newLogin",'_blank');
            this.loginVisible = false;
            location.reload();
        },
        // goToProfile(userId) {
        //     window.open("/favorite/"+userId,'_blank');
        // },
    }
}
</script>

<style scoped>
.comment-container {
    margin-top: 20px;
    margin-left: 20px;
}

.comment {
    border: 1px solid #ccc;
    margin-bottom: 10px;
    width: 90%;
    padding: 10px;
    border-radius: 5px;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.comment-info {
    display: flex;
    gap: 10px;
}

.comment-actions {
    display: flex;
    gap: 10px;
}

.comment-body p {
    margin: 0;
}

.image {
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: transform 0.3s ease;
    margin: 5px;
}


.small-small-image {
    width: 15px;
    height: 15px;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.small-small-image:hover {
    transform: scale(1.2);
}

.image:hover {
    transform: scale(1.2);
}

.small-image {
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: transform 0.3s ease;
    margin: 5px;
}

.small-image:hover {
    transform: scale(1.2);
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
.user {
    font-weight: bold;
}

.replies {
    font-weight: bold;
}

.time {
    color: #6c757d;
}

.pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}

.comment-reply {
    border: 1px solid #ccc;
    padding: 10px;
    margin-bottom: 0;
    border-radius: 5px;
}

.reply-header {
    font-size: 14px;
    margin-bottom: 5px;
}

.source-comment {
    font-size: 12px;
    color: #666;
}

.source-time {
    font-size: 10px;
    color: #999;
}

hr {
    border: 0;
    height: 1px;
    background: #ccc;
    margin: 20px 0;
}

</style>
