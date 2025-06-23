<template>
    <div class="image-container">
        <img src="../assets/comment.png" @click="beforeComment" class="image" alt="Icon"/>
        <img src="../assets/share.png" @click="shareVisible = true" class="image" alt="Icon"/>
        <img src="../assets/applyJoin.png" @click="applyJoin" class="image" alt="Icon"/>
        <el-dialog
            v-model="shareVisible"
            title="分享给他人"
            width="500"
        >
            <template #footer>
                <div class="dialog-footer">
                    <div class="info">
                        <span class="info-title">我在SSSR看到了很棒的内容《{{ modifyAbstract(achievementName) }}》，你也来看看吧！</span>
                        <el-button @click="copyShareToClipboard" style="align-items: center" type="primary">复制分享链接到剪切板</el-button>
                    </div>
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
    commitCommentAPI
} from "@/page/achievement-detail/api/api";
import store from "@/store";
import {ElMessage} from "element-plus";
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
    },
    setup(props) {
        let userInput = ref('');
        let shareVisible = ref(false);
        let commentVisible = ref(false);
        let loginVisible = ref(false);
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
        async function copyShareToClipboard() {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = "我在SSSR看到了很棒的学术成果《" + modifyAbstract(props.achievementName) + "》，你也来看看吧！\n"+"链接："+window.location.href;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        callSuccess('内容已复制到剪贴板');
                    }
                } catch (err) {

                }
                document.body.removeChild(textArea);
            } catch (err) {
                ElMessage.error('复制失败');
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
            copyShareToClipboard,
            commentVisible,
            userInput,
            loginVisible,
            modifyAbstract,
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
