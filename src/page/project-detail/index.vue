<template>
    <div class="bg-container"/>
    <div class="bg-strong-container"/>
    <div style="width: 100%; height: 100%; display: flex; justify-content: center; margin-top: 70px">
        <div style="width: 1400px">
    <el-container class="el-main" style="display: flex;">
        <el-row style="width: 100%; display: flex;" :gutter="24">
            <el-col :span="17">
                <div class="main-container" style="width: 100%;">
                    <div v-if="loading" class="loading-container">
                        <el-skeleton :rows="10" animated />
                    </div>
                    <div v-else-if="project && project.projectDetail">
                        <div class="header-container">
                            <div class="header-title">{{modifyTitle(project.projectDetail.title)}}</div>
                            <div class="info-container">
                                <div class="detail-info" v-if="project.researcherList && project.researcherList.length > 0">
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
                                <div class="detail-info">
                                    <span class="info-label">合作条件：</span>
                                    <span>{{project.projectDetail.collaborationRequirement || "暂无"}}</span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.endDate">
                                    <span class="info-label">结束日期：</span>
                                    <span>{{formatDate(project.projectDetail.endDate)}}</span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.budget">
                                    <span class="info-label">项目预算：</span>
                                    <span>{{project.projectDetail.budget}}</span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.institution && project.projectDetail.institution.name">
                                    <span class="info-label">所属机构：</span>
                                    <span>{{project.projectDetail.institution.name}}</span>
                                </div>
                                <div class="detail-info" v-if="project.subfield">
                                    <span class="info-label">研究领域：</span>
                                    <span>{{project.subfield}}</span>
                                </div>
                            </div>
                            <div class="function-bar-align">
                                <function-bar :work="project" :achievement-name="project.projectDetail.title" :role="role"/>
                            </div>
                        </div>
                        <div v-if="role === 'creator' || role === 'participant'">
                            <div class="info-card">
                                <div class="info-card-title">项目描述</div>
                                <div class="info-card-content" id="description">
                                    {{project.projectDetail.description === "" ? "该项目暂无详细描述" : project.projectDetail.description}}
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-card-title">评论</div>
                                <div class="info-card-content">
                                    <comments :work="project" :userId="userId" :role="role"/>
                                </div>
                            </div>
                        </div>
                        <div v-else class="non-member-container">
                            <div class="card-header">权限不足</div>
                            <p>您不是该项目的成员，无法查看项目详情和评论。</p>
                            <p>请先申请加入项目。</p>
                            <el-button type="primary" @click="applyToJoin">申请加入项目</el-button>
                        </div>
                    </div>
                    <div v-else class="error-container">
                        <el-empty description="未找到该项目或加载失败"></el-empty>
                    </div>
                </div>
            </el-col>
            <el-col :span="7">
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
import {ref, onMounted} from "vue";
import FunctionBar from "@/page/project-detail/function-bar/index.vue";
import Comments from "@/page/project-detail/comments/index.vue";
import {setNav} from "@/nav/set";
import {getProjectDetail} from "@/page/project-detail/api/api";
import {callInfo, callSuccess, callError} from "@/call";
import store from "@/store";
import NavButton from "@/nav/navButton/index.vue";
import homeBottom from "@/page/home/component/homeBottom/index.vue";

export default {
    name: "project-detail",
    components: {NavButton, Comments, FunctionBar, SideComponent, homeBottom},
    data() {
        return {
            userId: 0,
            loading: true,
            project: {
                projectDetail: {
                    projectId: 1,
                    title: "人工智能在医疗诊断中的应用研究",
                    description: "本项目旨在研究人工智能技术在医疗诊断领域的应用，通过深度学习算法提高疾病诊断的准确性和效率。项目将收集大量医疗影像数据，训练AI模型，并验证其在临床实践中的有效性。",
                    startDate: "2024-01-01",
                    status: "进行中"
                },
                researcherList: [
                    {
                        id: 1,
                        name: "张三",
                        role: "项目负责人",
                        institution: "清华大学医学院"
                    },
                    {
                        id: 2,
                        name: "李四",
                        role: "技术专家",
                        institution: "清华大学计算机系"
                    },
                    {
                        id: 3,
                        name: "王五",
                        role: "临床专家",
                        institution: "北京协和医院"
                    }
                ],
                subfield: "人工智能与医疗健康",
                stats: {
                    visitCount: 156,
                    comments: 10,
                    favorites: 5,
                    memberCount: 15
                }
            },
            role: "creator", // 设置默认值，避免空值
        };
    },
    mounted() {
        this.initializeProject();
    },
    methods: {
        async initializeProject() {
            console.log("项目详情页面初始化开始");
            try {
                this.userId = store.getters.getId || 0;
                console.log("当前用户ID:", this.userId);
                
                if (this.$route.params.id) {
                    console.log("正在获取项目ID:", this.$route.params.id);
                    this.loading = true;
                    const res = await this.pullProjectData();
                    console.log("项目详情API响应:", res);
                    
                    if (res && res.code === 0 && res.data) {
                        // 保存用户在项目中的角色
                        this.role = res.data.role || "visitor";
                        console.log("用户角色:", this.role);
                        
                        // 将API返回的数据转换为组件所需的格式
                        const projectData = res.data;
                        
                        this.project = {
                            projectDetail: {
                                projectId: projectData.projectId || projectData.id || 1,
                                title: projectData.title || "未命名项目",
                                description: projectData.description || "",
                                startDate: projectData.startDate || "",
                                endDate: projectData.endDate || "",
                                collaborationRequirement: projectData.collaborationRequirement || "",
                                status: projectData.status || "未知",
                                budget: projectData.budget || "",
                                institution: projectData.institution || { name: "" }
                            },
                            userDetail: projectData.userDetail || null,
                            researcherList: Array.isArray(projectData.researcherList) ? projectData.researcherList : [],
                            subfield: projectData.field || "",
                            stats: {
                                visitCount: projectData.visitCount || 0,
                                comments: projectData.commentCount || 0,
                                favorites: projectData.favoriteCount || 0,
                                memberCount: projectData.memberCount || 0
                            },
                            researchOutcomes: Array.isArray(projectData.researchOutcomes) ? projectData.researchOutcomes : []
                        };
                        
                        console.log("处理后的项目数据:", JSON.stringify(this.project));
                    } else {
                        callInfo("获取项目信息失败，将显示默认数据");
                        console.warn("API响应无效:", res);
                    }
                } else {
                    console.warn("未提供项目ID");
                }
            } catch (error) {
                console.error("获取项目详情出错:", error);
                callError("获取项目信息出错，将显示默认数据");
            } finally {
                this.loading = false;
                console.log("项目详情页面初始化完成");
            }
        },
        applyToJoin() {
            // 在实际场景中，这里会触发API调用
            callSuccess('您的加入申请已发送，请等待项目创建者批准。');
        },
        pullProjectData() {
            console.log("调用getProjectDetail API");
            return getProjectDetail(this.$route.params.id);
        },
    },
    setup() {
        const activeName = ref('third');
        function goToResearcher(id) {
            if (!id) return;
            window.open("/profile/"+id,'_blank');
        }
        function formatDate(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('zh-CN');
            } catch (e) {
                console.error("日期格式化错误:", e);
                return dateString;
            }
        }
        function getStatusClass(status) {
            if (!status) return 'status-default';
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
            if (!s) return '未命名项目';
            return s;
        }
        return {
            activeName,
            goToResearcher,
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
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 20px;
}
.side-container {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.9);
    margin: 10px;
    box-sizing: border-box;
    padding: 15px;
    border-radius: 8px;
}
.loading-container {
    padding: 20px;
}
.error-container {
    padding: 40px 0;
    text-align: center;
}
.header-container {
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #ebeef5;
    padding: 0 0 20px 0;
    margin: 24px 0;
    overflow: hidden;
    text-align: left;
}
.header-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    background: linear-gradient(90deg, #f8f9fa 60%, #e9ecef 100%);
    padding: 18px 28px 10px 28px;
    border-bottom: 1px solid #ebeef5;
    text-align: left;
}
.info-container {
    padding: 20px 28px 0 28px;
    font-size: 15px;
    color: #606266;
    line-height: 1.7;
    text-align: left;
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

.info-card {
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    margin: 24px 0;
    padding: 0 0 20px 0;
    border: 1px solid #ebeef5;
    overflow: hidden;
    text-align: left;
}
.info-card-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    background: linear-gradient(90deg, #f8f9fa 60%, #e9ecef 100%);
    padding: 18px 28px 10px 28px;
    border-bottom: 1px solid #ebeef5;
    text-align: left;
}
.info-card-content {
    padding: 20px 28px 0 28px;
    font-size: 17px;
    color: #606266;
    line-height: 1.7;
    text-align: left;
}

.function-bar-align {
    padding-left: 28px;
    padding-right: 28px;
    margin-top: 10px;
}
@media (max-width: 900px) {
    .header-title, .info-container {
        padding-left: 12px;
        padding-right: 12px;
    }
    .function-bar-align {
        padding-left: 12px;
        padding-right: 12px;
    }
}
</style>
