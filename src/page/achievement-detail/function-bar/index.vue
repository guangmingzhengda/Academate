<template>
    <div class="image-container">
        <img src="../assets/comment.png" @click="beforeComment" class="image" alt="Icon"/>
        <img v-if="!isStar" src="../assets/star.png" @click="starArticle" class="image" alt="Icon"/>
        <img v-if="isStar" src="../assets/star-fill.png" @click="unStarArticle" class="image" alt="Icon"/>
        <img src="../assets/share.png" @click="shareVisible = true" class="image" alt="Icon"/>
        <img src="../assets/quote.png" v-if="work.articleDetail !== null" @click="quoteVisible = true" class="image" alt="Icon"/>
        <img src="../assets/pdf.png" v-if="work.articleDetail !== null" @click="viewPDF" class="image" alt="Icon"/>
        <el-dialog
            v-model="quoteVisible"
            title="引用格式"
            width="500"
        >
            <template #footer>
                <div class="dialog-footer">
                    <div class="info">
                        <span class="info-title">联机网络数据库引用格式</span>
                        <span class="quote-text">{{ handle() }}</span>
                    </div>
                    <el-button @click="copyQuoteToClipboard" style="align-items: center" type="primary">复制引用格式到剪切板</el-button>
<!--                    <div v-for="(quote, index) in quotes" :key="index">-->
<!--                        <div class="info">-->
<!--                            <span class="info-title">{{ quote.style }}</span>-->
<!--                            <span class="quote-text">{{ quote.text }}</span>-->
<!--                            <el-button @click="copyQuoteToClipboard(index)" style="align-items: center" type="primary">复制引用格式到剪切板</el-button>-->
<!--                        </div>-->
<!--                    </div>-->
                </div>
            </template>
        </el-dialog>
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
            v-model="starVisible"
            title="添加至收藏夹"
            width="500"
        >
            <el-button @click="newStarVisible = true" type="primary" style="align-items: center; margin-left: 15px">新建收藏夹</el-button>
            <template #footer>
                <div class="dialog-footer">
                    <div class="info">
                        <span class="info-title">选择添加至收藏夹</span>
                        <el-select
                            v-model="chooseId"
                            clearable
                            placeholder="Select"
                            style="width: 240px"
                        >
                            <el-option v-if="categories.length !== 0"
                                v-for="item in categories"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id"
                            />
                        </el-select>
                        <el-button @click="handleStar" style="align-items: center" type="primary">确定收藏</el-button>
                    </div>
                </div>
            </template>
        </el-dialog>
        <el-dialog
            v-model="newStarVisible"
            title="新建收藏夹"
            width="300"
        >
            <textarea v-model="userInput" placeholder="请输入新建收藏夹名称" class="custom-textarea"></textarea>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="newStarVisible = false">Cancel</el-button>
                    <el-button type="primary" @click="newStarKind">
                        Confirm
                    </el-button>
                </div>
            </template>
        </el-dialog>
        <el-dialog
            v-model="commentVisible"
            title="发表学术成果评论"
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
    </div>
</template>

<script lang="js">
import {ref} from "vue";
import {callInfo, callSuccess} from "@/call";
import {
    addWorkAPI,
    newStarKindAPI,
    getStarKindsAPI,
    deleteWorkAPI,
    commitCommentAPI, isFavoredAPI
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
    methods: {
        isLogin() {
            return store.getters.getToken !== null;
        },
        unStarArticle() {
            this.isStar ^= 1;
            deleteWorkAPI(this.work.articleDetail.id);
        },
        starArticle() {
            if(store.getters.getToken !== null) {
                this.starVisible = true;
            }
            else this.loginVisible = true;
        },
        async handleStar() {
            if(!Number.isFinite(this.chooseId)) {
                callInfo("未选择收藏夹");
            }
            else {
                let res = await addWorkAPI(this.chooseId, this.work.id);
                if(res)
                    this.isStar ^= 1;
                this.starVisible = false;
            }
        },
        goToLogin() {
            window.open("/newLogin",'_blank');
            this.loginVisible = false;
        },
    },
    setup(props) {
        let userInput = ref('');
        let quotes = ref([
            {
                id: 0,
                style: "GB/T 7714-2015",
                text: "[1]周文,许凌云.论新质生产力：内涵特征与重要着力点[J].改革,2023,(10):1-13.\n",
            },
            {
                id: 1,
                style: "MIT",
                text: "引用方式2",
            }
        ]);
        let quoteVisible = ref(false);
        let shareVisible = ref(false);
        let commentVisible = ref(false);
        let newStarVisible = ref(false);
        let loginVisible = ref(false);
        function beforeComment() {
            if(store.getters.getToken === null)
                loginVisible.value = true;
            else commentVisible.value = true;
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
        async function newStarKind() {
            let res = await newStarKindAPI(userInput.value);
            if(res) {
                callSuccess("新建收藏夹成功");
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        }
        const handle = () => {
            let res = "[1]";
            for(let i = 0; i < props.work.authorNameIdList.length; i++) {
                res += props.work.authorNameIdList[i].name;
                if(i < props.work.authorNameIdList.length - 1) res += ', '
            }
            res+='. ' + props.achievementName + '[DB/OL]. (' + props.publicationDate + ')';
            return res;
        };
        async function copyQuoteToClipboard() {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = handle();
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
        function viewPDF() {
            if(props.work.articleDetail.doi !== null)
                window.open(props.work.articleDetail.doi,"_blank");
            else callInfo("暂不支持查看成果PDF");
        }
        function modifyAbstract(s) {
            let las = Math.max(s.lastIndexOf('.'), s.lastIndexOf('。'));
            if(las === -1) return s;
            return s.substring(0, las + 1);
        }
        return {
            commitComment,
            beforeComment,
            quoteVisible,
            quotes,
            copyQuoteToClipboard,
            shareVisible,
            copyShareToClipboard,
            commentVisible,
            userInput,
            newStarVisible,
            newStarKind,
            viewPDF,
            loginVisible,
            handle,
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
