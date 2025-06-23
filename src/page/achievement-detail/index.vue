<template>
    <div class="bg-container"/>
    <div class="bg-strong-container"/>
    <div style="width: 100%; height: 100%; display: flex; justify-content: center; margin-top: 70px">
        <div style="width: 1400px">
    <el-container class="el-main" style="display: flex;">
        <el-row style="width: 100%">
            <el-col :span="18">
                <div class="main-container" style="width: 100%;">
                    <div v-if="work.articleDetail !== null">
                        <div class="header-container">
                            <div class="header-title">{{modifyTitle(work.articleDetail.title)}}</div>
                            <div class="info-container">
                                <div class="detail-info">
                                    <span class="info-label">作者：</span>
                                    <span v-if="work.authorNameIdList.length === 0">anonymous</span>
                                    <span v-for="(author, index) in work.authorNameIdList" :key="index"
                                          class="author-link"
                                          v-if="work.authorNameIdList.length !== 0"
                                          @click="goToAuthor(author.id)">
                                        {{ author.name }}{{ index < work.authorNameIdList.length - 1 ? ', ' : '' }}
                                    </span>
                                </div>
                                <div class="detail-info" v-if="work.articleDetail.publicationDate">
                                    <span class="info-label">发表时间：</span>
                                    <span>{{work.articleDetail.publicationDate}}</span>
                                </div>
                                <div class="detail-info" v-if="work.articleDetail.fwci">
                                    <span class="info-label">fwci：</span>
                                    <span>{{work.articleDetail.fwci}}</span>
                                </div>
                                <div class="detail-info" v-if="work.keyword">
                                    <span class="info-label">关键词：</span>
                                    <span>
                                        {{work.keywords}}
                                    </span>
                                </div>
                                <div class="detail-info" v-if="work.subfield">
                                    <span class="info-label">子领域：</span>
                                    <span>{{work.subfield ? work.subfield : 未细分子领域}}</span>
                                </div>
                            </div>
                            <function-bar :work="work" :achievement-name="work.articleDetail.title"
                            :author-name-list="work.authorNameList" :publication-date="work.articleDetail.publicationDate"/>
                        </div>
                        <div class="down-container">
                            <div class="abstract-title">摘要</div>
                            <div class="abstract-content" id="abstract">
                                {{work.articleDetail.abstractText === "" ? "该学术成果无摘要" : modifyAbstract(work.articleDetail.abstractText)}}
                            </div>
                        </div>
                        <div class="down-container">
                            <el-tabs
                                v-model="activeName"
                                type="card"
                                class="demo-tabs"
                                style="max-width: 100%">
                                <el-tab-pane label="评论" name="third">
                                    <comments :work="work" :userId="userId"/>
                                </el-tab-pane>
                            </el-tabs>
                        </div>
                    </div>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="side-container">
                    <side-component :work="work"/>
                </div>
            </el-col>

        </el-row>
    </el-container>
        </div>
    </div>

<!--    <home-bottom/>-->

</template>

<script lang="js">
import SideComponent from "@/page/achievement-detail/side-component/index.vue";
import {ref} from "vue";
import FunctionBar from "@/page/achievement-detail/function-bar/index.vue";
import References from "@/page/achievement-detail/references/index.vue";
import Citing from "@/page/achievement-detail/citing/index.vue";
import Comments from "@/page/achievement-detail/comments/index.vue";
import {setNav} from "@/nav/set";
import {getWorkAPI} from "@/page/achievement-detail/api/api";
import {callInfo} from "@/call";
import store from "@/store";
import NavButton from "@/nav/navButton/index.vue";
import homeBottom from "@/page/home/component/homeBottom/index.vue";
import {decode_function} from "@/decode/code";

let isIframeLoaded = ref(true);
export default {
    name: "achievement-detail",
    components: {NavButton, Comments, Citing, References, FunctionBar, SideComponent, homeBottom},
    data() {
        return {
            userId: ref(0),
            work: ref({
                "id": 25,
                "type": "article",
                "articleDetail": {
                    "id": 25,
                    "title": "默认标题",
                    "url": null,
                    "type": "article",
                    "citedByCount": 10,
                    "fwci": 2.374,
                    "doi": "https://doi.org/10.1111/j.1467-9515.2010.00737.x",
                    "publicationDate": 1286841600000,
                    "lang": "en",
                    "abstractText": "This article examines the phenomenon of Israeli civil society organizations (CSOs) providing services to women as part creation an alternative women's welfare sphere in Israel recent years, and its influence upon state women. The existence can be seen a move by towards liberal-style economic regime. mode operation fourteen offering welfare, health educational Israel, using qualitative research method. study identifies four traits characterizing these organizations: their loose connections with state, use sectoral selective criteria determining eligibility for services, mirroring internal dynamics community response gender issues, CSOs' holistic, sporadic unprofessional services. analysis highlights dimensions organizations, characteristics structure content they offer, role place operating parallel state. It sheds light on complex nature this which contribute empowerment improvement lives but, simultaneously, strengthen reinforce exclusion marginalization."
                },
                "patentDetail": {
                    "id": 3,
                    "applicationId": "application_id",
                    "applicationDate": "2024-12-04",
                    "publicationId": "publication_id",
                    "category": "category",
                    "priority": "priority",
                    "publicationDate": "2024-12-05",
                    "abstractText": "abstract_text abstract_text abstract_text abstract_text abstract_text abstract_text abstract_text abstract_text abstract_text abstract_text abstract_text ",
                    "name": "name"
                },
                "awardDetail": {
                    "id": 4,
                    "name": "award",
                    "awardDate": 1733529600000
                },
                "projectDetail": {
                    "id": 12,
                    "ratificationNumber": "test less info",
                    "name": "test less info",
                    "startDate": "1983-06-29",
                    "endDate": "1970-03-26",
                    "budget": "test less info",
                    "institution": {
                        "id": 14,
                        "name": "test less info",
                        "identification": "test less info"
                    }
                },
                "authorNameIdList": [
                    {
                        "id": 48,
                        "name": "Michal Almog‐Bar"
                    },
                    {
                        "id": 49,
                        "name": "Mimi Ajzenstadt"
                    }
                ],
                "subfield": "Public Health, Environmental and Occupational Health",
                "keywords": "keyword1, keyword2",
                "referencerList": [
                    {
                        "id": 29,
                        "name": "The European Works Council – not an effective means against site-competition and multiscalar social fragmentation",
                        "authorNameList": [
                            "Michal Almog‐Bar",
                            "Mimi Ajzenstadt"
                        ]
                    }
                ],
                "referenceeList": [],
                "relatedSubfieldList": [
                    "Industrial and Manufacturing Engineering",
                    "Mechanics of Materials",
                    "Mechanical Engineering",
                    "Ocean Engineering",
                    "Atmospheric Science"
                ],
                "relatedWorkList": [
                    {
                        "id": 37,
                        "name": "Early and middle latency auditory evoked responses in audiology and neurootology."
                    }
                ],
                "visitCount": 235
            }),
        };
    },
    async mounted() {
        console.log("mounted");
        //setNav(true);
        window.scrollTo(0, 0);
        if(this.$route.params.id) {
            const res = await this.pullWorkData();
            if (res != null && (res.articleDetail || res.patentDetail || res.projectDetail || res.awardDetail))
                this.work = res;
            else {
                callInfo("当前学术成果不存在，将返回首页");
                setTimeout(() => {
                    window.location.href = "/home";
                }, 2000);
            }
        }
        this.userId = store.getters.getId;
    },
    methods: {
        pullWorkData() {
            // console.log(decode_function(this.$route.params.id));
            return getWorkAPI(decode_function(this.$route.params.id), store.getters.getId);
        },
    },
    setup() {
        const activeName = ref('third');
        function goToAuthor(id) {
            window.open("/profile/"+id,'_blank');
        }
        function modifyAbstract(s) {
            let las = Math.max(s.lastIndexOf('.'), s.lastIndexOf('。'));
            if(las === -1) return s;
            return s.substring(0, las + 1);
        }
        function modifyTitle(s) {
            return s.replace(/[</>]/g, "").slice(0, 200);
        }
        return {
            activeName,
            goToAuthor,
            isIframeLoaded,
            modifyAbstract,
            modifyTitle,
        };
    }
}
</script>

<style scoped>
.bg-container {
    background: url('@/asset/detail-enhance/bg.png');
    background-size: cover;
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -1;
    top: 0;
    left: 0;
}
.bg-strong-container {
    background: url('@/asset/login/bg.png');
    opacity: 0.9;
    background-size: cover;
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -2;
    top: 0;
    left: 0;
}
.main-container {
    flex: 1;
    width: 90%;
    margin: 10px;
    box-sizing: border-box;
}
.side-container {
    width: 90%;
    background-color: rgba(255, 255, 255, 0.9);
    margin: 10px;
    box-sizing: border-box;
    padding: 15px;
}
.header-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    border: 1px solid #dee2e6;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
    max-width: 90%;
    margin: 10px auto 10px auto;
    text-align: left;
    align-self: flex-start;
}
.down-container {
    border: 1px solid #dee2e6;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
    max-width: 90%;
    margin: 10px auto 10px auto;
    word-wrap: break-word;
    text-align: left;
}
.down-container {
    border: 1px solid #dee2e6;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
    max-width: 90%;
    margin: 10px auto 10px auto;
    text-align: left;
    align-self: flex-start;
}
.header-title {
    font-size: 28px;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 10px;
}

.abstract-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 10px;
}

.abstract-content {
    font-size: 1.1rem;
    color: #495057;
    text-align: justify;
    line-height: 1.5;
}

.info-container {
    display: flex;
    margin-bottom: 20px;
    flex-direction: column;
}

.detail-info {
    font-size: 1.2rem;
    color: #6c757d;
}

.info-label {
    font-weight: bold;
    margin-right: 5px;
}
.author-link {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.3s, text-decoration 0.3s;
}

.author-link:hover {
    color: #aed0ee;
    text-decoration: underline;
}

</style>
