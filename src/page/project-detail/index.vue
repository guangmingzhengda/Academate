<template>
    <div class="bg-container"/>
    <div class="bg-strong-container"/>
    <div style="width: 100%; height: 100%; display: flex; justify-content: center; margin-top: 70px">
        <div style="width: 1400px">
    <el-container class="el-main" style="display: flex;">
        <el-row style="width: 100%">
            <el-col :span="18">
                <div class="main-container" style="width: 100%;">
                    <div v-if="project.projectDetail !== null">
                        <div class="header-container">
                            <div class="header-title">{{modifyTitle(project.projectDetail.title)}}</div>
                            <div class="info-container">
                                <div class="detail-info">
                                    <span class="info-label">项目负责人：</span>
                                    <span v-if="project.researcherList.length === 0">未指定</span>
                                    <span v-for="(researcher, index) in project.researcherList" :key="index"
                                          class="researcher-link"
                                          v-if="project.researcherList.length !== 0"
                                          @click="goToResearcher(researcher.id)">
                                        {{ researcher.name }}{{ index < project.researcherList.length - 1 ? ', ' : '' }}
                                    </span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.startDate">
                                    <span class="info-label">开始日期：</span>
                                    <span>{{formatDate(project.projectDetail.startDate)}}</span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.status">
                                    <span class="info-label">项目状态：</span>
                                    <span class="status-badge" :class="getStatusClass(project.projectDetail.status)">
                                        {{project.projectDetail.status}}
                                    </span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.endDate">
                                    <span class="info-label">结束日期：</span>
                                    <span>{{formatDate(project.projectDetail.endDate)}}</span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.budget">
                                    <span class="info-label">项目预算：</span>
                                    <span>{{project.projectDetail.budget}}</span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.institution">
                                    <span class="info-label">所属机构：</span>
                                    <span>{{project.projectDetail.institution.name}}</span>
                                </div>
                                <div class="detail-info" v-if="project.subfield">
                                    <span class="info-label">研究领域：</span>
                                    <span>{{project.subfield}}</span>
                                </div>
                            </div>
                            <function-bar :work="project" :achievement-name="project.projectDetail.title" :role="role"/>
                        </div>
                        <div v-if="role === 'creator' || role === 'participant'">
                            <div class="down-container">
                                <div class="abstract-title">项目描述</div>
                                <div class="abstract-content" id="description">
                                    {{project.projectDetail.description === "" ? "该项目暂无详细描述" : project.projectDetail.description}}
                                </div>
                            </div>
                            <div class="down-container">
                                <el-tabs
                                    v-model="activeName"
                                    type="card"
                                    class="demo-tabs"
                                    style="max-width: 100%">
                                    <!-- <el-tab-pane label="项目成果" name="first">
                                        <div class="achievements-container">
                                            <div v-if="project.achievements && project.achievements.length > 0">
                                                <div v-for="achievement in project.achievements" :key="achievement.id" class="achievement-item">
                                                    <div class="achievement-title">{{achievement.title}}</div>
                                                    <div class="achievement-type">{{achievement.type}}</div>
                                                    <div class="achievement-date">{{formatDate(achievement.date)}}</div>
                                                </div>
                                            </div>
                                            <div v-else class="no-data">
                                                暂无项目成果
                                            </div>
                                        </div>
                                    </el-tab-pane> -->
                                    <el-tab-pane label="评论" name="third">
                                        <comments :work="project" :userId="userId" :role="role"/>
                                    </el-tab-pane>
                                </el-tabs>
                            </div>
                        </div>
                        <div v-else class="non-member-container">
                            <div class="card-header">权限不足</div>
                            <p>您不是该项目的成员，无法查看项目详情和评论。</p>
                            <p>请先申请加入项目。</p>
                            <el-button type="primary" @click="applyToJoin">申请加入项目</el-button>
                        </div>
                    </div>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="side-container">
                    <side-component :work="project"/>
                </div>
            </el-col>

        </el-row>
    </el-container>
        </div>
    </div>

<!--    <home-bottom/>-->

</template>

<script lang="js">
import SideComponent from "@/page/project-detail/side-component/index.vue";
import {ref} from "vue";
import FunctionBar from "@/page/project-detail/function-bar/index.vue";
import Comments from "@/page/project-detail/comments/index.vue";
import {setNav} from "@/nav/set";
import {getWorkAPI} from "@/page/project-detail/api/api";
import {callInfo, callSuccess} from "@/call";
import store from "@/store";
import NavButton from "@/nav/navButton/index.vue";
import homeBottom from "@/page/home/component/homeBottom/index.vue";
import {decode_function} from "@/decode/code";

let isIframeLoaded = ref(true);
export default {
    name: "project-detail",
    components: {NavButton, Comments, FunctionBar, SideComponent, homeBottom},
    data() {
        return {
            userId: ref(0),
            project: ref({
                "id": 1,
                "type": "project",
                "projectDetail": {
                    "id": 1,
                    "title": "人工智能在医疗诊断中的应用研究",
                    "description": "本项目旨在研究人工智能技术在医疗诊断领域的应用，通过深度学习算法提高疾病诊断的准确性和效率。项目将收集大量医疗影像数据，训练AI模型，并验证其在临床实践中的有效性。",
                    "startDate": "2024-01-01",
                    "endDate": "2026-12-31",
                    "status": "进行中",
                    "budget": "500万元",
                    "institution": {
                        "id": 1,
                        "name": "清华大学医学院",
                        "identification": "THU-MED"
                    }
                },
                "researcherList": [
                    {
                        "id": 1,
                        "name": "张三",
                        "role": "项目负责人",
                        "institution": "清华大学医学院"
                    },
                    {
                        "id": 2,
                        "name": "李四",
                        "role": "技术专家",
                        "institution": "清华大学计算机系"
                    },
                    {
                        "id": 3,
                        "name": "王五",
                        "role": "临床专家",
                        "institution": "北京协和医院"
                    }
                ],
                "subfield": "人工智能与医疗健康",
                "achievements": [
                    {
                        "id": 1,
                        "title": "基于深度学习的肺部CT影像诊断系统",
                        "type": "软件系统",
                        "date": "2024-06-15"
                    },
                    {
                        "id": 2,
                        "title": "医疗AI诊断准确率提升研究报告",
                        "type": "研究报告",
                        "date": "2024-08-20"
                    }
                ],
                "visitCount": 156,
                "comments": 10,
                "favorites": 5
            }),
            role: ref(""),
        };
    },
    async mounted() {
        if(this.$route.params.id) {
            const res = await this.pullProjectData();
            if (res != null && res.projectDetail)
                this.project = res;
            else {
                callInfo("当前项目不存在，将返回首页");
                setTimeout(() => {
                    window.location.href = "/home";
                }, 2000);
            }
        }
        this.userId = store.getters.getId;
        this.role = "creator";
        // this.isMember = store.getters.isMember;
    },
    methods: {
        applyToJoin() {
            // In a real scenario, this would trigger an API call.
            // For now, we'll just show an info message.
            callSuccess('您的加入申请已发送，请等待项目创建者批准。');
        },
        pullProjectData() {
            // 这里应该调用项目详情的API
            // return getProjectAPI(decode_function(this.$route.params.id), store.getters.getId);
            // 暂时返回null，使用默认数据
            return null;
        },
    },
    setup() {
        const activeName = ref('first');
        function goToResearcher(id) {
            window.open("/profile/"+id,'_blank');
        }
        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN');
        }
        function getStatusClass(status) {
            switch(status) {
                case '进行中':
                    return 'status-ongoing';
                case '已完成':
                    return 'status-completed';
                case '已暂停':
                    return 'status-paused';
                case '已取消':
                    return 'status-cancelled';
                default:
                    return 'status-default';
            }
        }
        function modifyTitle(s) {
            return s.replace(/[</>]/g, "").slice(0, 200);
        }
        return {
            activeName,
            goToResearcher,
            isIframeLoaded,
            formatDate,
            getStatusClass,
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
.researcher-link {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.3s, text-decoration 0.3s;
}

.researcher-link:hover {
    color: #aed0ee;
    text-decoration: underline;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
}

.status-ongoing {
    background-color: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
}

.status-completed {
    background-color: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
}

.status-paused {
    background-color: #fff3e0;
    color: #f57c00;
    border: 1px solid #ffcc02;
}

.status-cancelled {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
}

.status-default {
    background-color: #f5f5f5;
    color: #616161;
    border: 1px solid #e0e0e0;
}

.achievements-container {
    margin-bottom: 20px;
}

.achievement-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #fafafa;
    transition: box-shadow 0.3s ease;
}

.achievement-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.achievement-title {
    font-size: 1.2rem;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 5px;
}

.achievement-type {
    font-size: 1rem;
    color: #6c757d;
    margin-bottom: 5px;
}

.achievement-date {
    font-size: 0.9rem;
    color: #6c757d;
}

.members-container {
    margin-bottom: 20px;
}

.member-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #fafafa;
    transition: box-shadow 0.3s ease;
}

.member-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.member-name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 5px;
}

.member-role {
    font-size: 1rem;
    color: #6c757d;
    margin-bottom: 5px;
}

.member-institution {
    font-size: 0.9rem;
    color: #6c757d;
}

.no-data {
    text-align: center;
    color: #6c757d;
    padding: 40px 20px;
    font-style: italic;
}

.non-member-container {
    border: 1px solid #dee2e6;
    padding: 40px 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
    max-width: 90%;
    margin: 10px auto;
    text-align: center;
}

.card-header {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 20px;
    color: #343a40;
}

.non-member-container p {
    margin-bottom: 20px;
    font-size: 1rem;
    color: #495057;
    line-height: 1.5;
}

</style>
