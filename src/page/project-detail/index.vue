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
                                <div class="detail-info" v-if="project.projectDetail.isPublic !== undefined">
                                    <span class="info-label">项目可见性：</span>
                                    <span class="status-badge" :class="project.projectDetail.isPublic ? 'status-ongoing' : 'status-paused'">
                                        {{project.projectDetail.isPublic ? '公开' : '私有'}}
                                    </span>
                                </div>
                                <div class="detail-info" v-if="project.projectDetail.collaborationRequirement">
                                    <span class="info-label">合作条件：</span>
                                    <span>{{project.projectDetail.collaborationRequirement}}</span>
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
                            <div v-if="project.researchOutcomes && project.researchOutcomes.length > 0" class="info-card">
                                <div class="info-card-title">研究成果</div>
                                <div class="info-card-content">
                                    <div v-for="(outcome, index) in project.researchOutcomes" :key="index" class="outcome-item">
                                        <div class="outcome-title">{{outcome.title}}</div>
                                        <div class="outcome-info">
                                            <span class="outcome-type">{{outcome.type}}</span>
                                            <span v-if="outcome.authors" class="outcome-authors">作者: {{outcome.authors}}</span>
                                            <span v-if="outcome.publishDate" class="outcome-date">发布日期: {{formatDate(outcome.publishDate)}}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="(role === 'creator' || role === 'participant')" class="info-card">
                                <div class="info-card-title">
                                    项目资料
                                    <el-button 
                                        type="primary" 
                                        size="small" 
                                        @click="showFileDialog = true" 
                                        class="file-button"
                                    >
                                        {{ role === 'creator' ? '管理文件' : '查看文件' }}
                                    </el-button>
                                </div>
                                <div class="info-card-content">
                                    <div v-if="project.fileList && project.fileList.length > 0">
                                        <p>项目共有 {{ project.fileList.length }} 个文件资料</p>
                                    </div>
                                    <div v-else>
                                        <p>项目暂无文件资料</p>
                                    </div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-card-title">评论</div>
                                <div class="info-card-content">
                                    <comments :work="project" :userId="userId" :role="role"/>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="project.projectDetail.isPublic">
                            <div class="info-card">
                                <div class="info-card-title">项目描述</div>
                                <div class="info-card-content" id="description">
                                    {{project.projectDetail.description === "" ? "该项目暂无详细描述" : project.projectDetail.description}}
                                </div>
                            </div>
                            <div v-if="project.researchOutcomes && project.researchOutcomes.length > 0" class="info-card">
                                <div class="info-card-title">研究成果</div>
                                <div class="info-card-content">
                                    <div v-for="(outcome, index) in project.researchOutcomes" :key="index" class="outcome-item">
                                        <div class="outcome-title">{{outcome.title}}</div>
                                        <div class="outcome-info">
                                            <span class="outcome-type">{{outcome.type}}</span>
                                            <span v-if="outcome.authors" class="outcome-authors">作者: {{outcome.authors}}</span>
                                            <span v-if="outcome.publishDate" class="outcome-date">发布日期: {{formatDate(outcome.publishDate)}}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="non-member-container">
                                <div class="card-header">权限不足</div>
                                <p>您不是该项目的成员，无法查看项目评论。</p>
                                <p>请先申请加入项目。</p>
                                <el-button 
                                    type="primary" 
                                    @click="applyToJoin" 
                                    :loading="applyLoading" 
                                    :disabled="applyLoading || hasApplied"
                                >
                                    {{ hasApplied ? '已申请加入' : '申请加入项目' }}
                                </el-button>
                            </div>
                        </div>
                        <!-- <div v-else class="non-member-container">
                            <div class="card-header">权限不足</div>
                            <p>您不是该项目的成员，无法查看项目详情和评论。</p>
                            <p>请先申请加入项目。</p>
                            <el-button 
                                type="primary" 
                                @click="applyToJoin" 
                                :loading="applyLoading" 
                                :disabled="applyLoading || hasApplied"
                            >
                                {{ hasApplied ? '已申请加入' : '申请加入项目' }}
                            </el-button>
                        </div> -->
                    </div>
                    <div v-else class="error-container">
                        <el-empty description="项目不存在或未公开"></el-empty>
                        <div class="error-actions">
                            <p>将在3秒后自动跳转到首页...</p>
                            <el-button type="primary" @click="goToHome">立即返回首页</el-button>
                        </div>
                    </div>
                </div>
            </el-col>
            <el-col :span="7">
                <div class="side-container">
                    <side-component :work="project" :role="role" @visibility-changed="handleVisibilityChange"/>
                </div>
            </el-col>

        </el-row>
    </el-container>
        </div>
    </div>

<!--    <home-bottom/>-->

    <!-- 项目文件对话框 -->
    <el-dialog
        title="项目文件资料"
        v-model="showFileDialog"
        width="650px"
    >
        <div class="file-dialog-content">
            <!-- 上传文件区域 (仅项目创建者可见) -->
            <div v-if="role === 'creator'" class="file-upload-section">
                <el-upload
                    class="file-uploader"
                    action="#"
                    :http-request="handleCustomUpload"
                    :before-upload="beforeFileUpload"
                    :show-file-list="false"
                    :disabled="uploadLoading"
                >
                    <el-button type="primary" :loading="uploadLoading">
                        {{ uploadLoading ? '上传中...' : '上传文件' }}
                    </el-button>
                    <span v-if="currentFile && !uploadLoading" class="selected-filename">
                        已选择: {{ currentFile.name }}
                    </span>
                </el-upload>
            </div>
            
            <!-- 文件列表 -->
            <div class="file-list">
                <el-table :data="project.fileList || []" style="width: 100%">
                    <el-table-column prop="filename" label="文件名称"></el-table-column>
                    <el-table-column label="操作" width="180">
                        <template #default="scope">
                            <el-button 
                                type="primary" 
                                size="small" 
                                @click="handleDownloadFile(scope.row)"
                            >
                                下载
                            </el-button>
                            <el-button 
                                v-if="role === 'creator'"
                                type="danger" 
                                size="small" 
                                @click="handleDeleteFile(scope.row)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                
                <div v-if="!project.fileList || project.fileList.length === 0" class="empty-files">
                    暂无文件资料
                </div>
            </div>
        </div>
    </el-dialog>

</template>

<script lang="js">
import SideComponent from "@/page/project-detail/side-component/index.vue";
import {ref, onMounted} from "vue";
import FunctionBar from "@/page/project-detail/function-bar/index.vue";
import Comments from "@/page/project-detail/comments/index.vue";
import {setNav} from "@/nav/set";
import {getProjectDetail} from "@/page/project-detail/api/api";
import {callInfo, callSuccess, callError, callWarning} from "@/call";
import store from "@/store";
import NavButton from "@/nav/navButton/index.vue";
import homeBottom from "@/page/home/component/homeBottom/index.vue";
import {applyJoinProject, uploadProjectFile, downloadProjectFile, deleteProjectFile} from "@/api/project";
import { ElMessageBox } from 'element-plus';

export default {
    name: "project-detail",
    components: {NavButton, Comments, FunctionBar, SideComponent, homeBottom},
    data() {
        return {
            userId: 0,
            loading: true,
            project: null,  // 初始化为null，不再设置默认值
            role: "visitor", // 设置默认值为visitor
            applyLoading: false, // 申请加入项目的加载状态
            hasApplied: false, // 新增已申请状态
            showFileDialog: false,
            uploadLoading: false, // 文件上传加载状态
            currentFile: null, // 当前选择的文件
        };
    },
    mounted() {
        this.initializeProject();
    },
    methods: {
        async initializeProject() {
            // console.log("项目详情页面初始化开始");
            try {
                this.userId = store.getters.getId || 0;
                // console.log("当前用户ID:", this.userId);
                
                if (this.$route.params.id) {
                    // console.log("正在获取项目ID:", this.$route.params.id);
                    this.loading = true;
                    const res = await this.pullProjectData();
                    // console.log("项目详情API响应:", res);
                    
                    if (res && res.code === 0 && res.data) {
                        // 保存用户在项目中的角色
                        this.role = res.data.role || "guest";
                        // console.log("用户角色:", this.role);
                        
                        // 将API返回的数据转换为组件所需的格式
                        const projectData = res.data;
                        
                        // 检查项目是否公开或用户是否有权限查看
                        if (!projectData.isPublic && this.role === "guest") {
                            // console.log("项目不公开且用户无权限");
                            this.project = null;
                            callError("项目不存在或未公开，3秒后将自动跳转到首页");
                            setTimeout(() => {
                                this.goToHome();
                            }, 3000);
                            return;
                        }
                        
                        this.project = {
                            projectDetail: {
                                projectId: projectData.projectId || 1,
                                title: projectData.title || "未命名项目",
                                description: projectData.description || "",
                                startDate: projectData.startDate || "",
                                status: projectData.status || "未知",
                                collaborationRequirement: projectData.collaborationRequirement || "",
                                isPublic: projectData.isPublic !== undefined ? projectData.isPublic : true, // 默认为公开
                            },
                            // 新API结构中的创建者信息
                            creatorUserDetail: projectData.creatorUserDetail || null,
                            // 新API结构中的参与者信息
                            participantUserDetail: Array.isArray(projectData.participantUserDetail) ? projectData.participantUserDetail : [],
                            // 保留原有字段
                            researcherList: Array.isArray(projectData.researcherList) ? projectData.researcherList : [],
                            subfield: projectData.field || "",
                            stats: {
                                visitCount: projectData.visitCount || 0,
                                comments: projectData.commentCount || 0,
                                favorites: projectData.favoriteCount || 0,
                                memberCount: (projectData.participantUserDetail?.length || 0) + 1 // 成员数量为参与者数量+1(创建者)
                            },
                            researchOutcomes: Array.isArray(projectData.researchOutcomes) ? projectData.researchOutcomes : [],
                            fileList: Array.isArray(projectData.fileList) ? projectData.fileList : [],
                        };
                        
                        // console.log("项目可见性状态:", projectData.isPublic, this.project.projectDetail.isPublic);
                    } else {
                        this.project = null; // 确保项目数据为null
                        callError("项目不存在或未公开，3秒后将自动跳转到首页");
                        // console.warn("API响应无效:", res);
                        // 设置3秒后自动跳转到首页
                        setTimeout(() => {
                            this.goToHome();
                        }, 3000);
                    }
                } else {
                    this.project = null; // 确保项目数据为null
                    // console.warn("未提供项目ID");
                    callError("未提供项目ID，3秒后将自动跳转到首页");
                    // 设置3秒后自动跳转到首页
                    setTimeout(() => {
                        this.goToHome();
                    }, 3000);
                }
            } catch (error) {
                this.project = null; // 确保项目数据为null
                // console.error("获取项目详情出错:", error);
                callError("获取项目信息出错，3秒后将自动跳转到首页");
                // 设置3秒后自动跳转到首页
                setTimeout(() => {
                    this.goToHome();
                }, 3000);
            } finally {
                this.loading = false;
                // console.log("项目详情页面初始化完成");
            }
        },
        async applyToJoin() {
            try {
                const projectId = this.$route.params.id;
                const userId = this.userId;
                const projectTitle = this.project?.projectDetail?.title || "未命名项目";
                // console.log(projectId, userId, projectTitle);
                if (!projectId || !userId) {
                    callError('申请失败：缺少项目ID或用户ID');
                    return;
                }
                
                this.applyLoading = true;
                const result = await applyJoinProject({
                    applicant: userId,
                    projectId: Number(projectId),
                    title: projectTitle
                });
                
                if (result && result.code === 0) {
                    // 申请成功后显示成功提示，并禁用申请按钮
                    // 可以考虑在一段时间后刷新页面或重新获取项目数据
                    setTimeout(() => {
                        this.initializeProject();
                    }, 2000);
                } else if (result && result.code === 400 && result.message.includes('已申请')) {
                    // 如果已经申请过，设置已申请状态
                    callInfo('您已经申请过该项目，请等待管理员审核');
                }
            } catch (error) {
                console.error('申请加入项目出错:', error);
                callError('申请加入项目失败，请稍后重试');
            } finally {
                this.applyLoading = false;
            }
        },
        async pullProjectData() {
            try {
                const res = await getProjectDetail(this.$route.params.id);
                return res;
            } catch (error) {
                console.error("获取项目数据出错:", error);
                return null;
            }
        },
        goToHome() {
            this.$router.push("/");
        },
        formatDate(dateString) {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toLocaleDateString();
        },
        handleVisibilityChange(isPublic) {
            // 更新当前页面的项目公开状态
            // console.log("主页面接收到可见性变更通知:", isPublic);
            if (this.project && this.project.projectDetail) {
                this.project.projectDetail.isPublic = isPublic;
                // console.log("主页面更新项目可见性为:", this.project.projectDetail.isPublic);
            }
        },
        beforeFileUpload(file) {
            // 处理上传前的逻辑
            // console.log("上传前:", file);
            
            // 文件大小限制（10MB）
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                callError('文件大小不能超过 10MB!');
                return false;
            }
            
            // 保存当前文件以便后续上传
            this.currentFile = file;
            
            return true;
        },
        async handleCustomUpload(options) {
            if (!this.currentFile || !this.project?.projectDetail?.projectId) {
                callError('上传失败：文件或项目ID不存在');
                return;
            }
            
            this.uploadLoading = true;
            
            try {
                // 创建FormData对象
                const formData = new FormData();
                formData.append('multipartFile', this.currentFile);
                formData.append('projectId', this.project.projectDetail.projectId);
                formData.append('filename', this.currentFile.name); // 使用文件的原始名称
                
                // 调用API上传文件
                const response = await uploadProjectFile(formData);
                
                if (response && response.code === 0) {
                    this.currentFile = null;
                    // 重新获取项目数据以更新文件列表
                    this.initializeProject();
                }
            } catch (error) {
                console.error('上传文件出错:', error);
            } finally {
                this.uploadLoading = false;
            }
        },
        handleDownloadFile(file) {
            if (file && file.url) {
                downloadProjectFile(file.url, file.filename);
            } else {
                callError('下载链接不可用');
            }
        },
        async handleDeleteFile(file) {
            if (!file || !file.projectFileId) {
                callError('无法删除文件：文件ID不存在');
                return;
            }
            
            try {
                // 显示确认对话框
                await ElMessageBox.confirm(
                    '确定要删除此文件吗？此操作不可恢复',
                    '提示',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                );
                
                // 用户确认删除，执行删除操作
                const success = await deleteProjectFile(file.projectFileId);
                if (success) {
                    // 重新获取项目数据以更新文件列表
                    this.initializeProject();
                }
            } catch (error) {
                if (error === 'cancel') {
                    // 用户取消删除操作
                    return;
                }
                console.error('删除文件出错:', error);
            }
        },
    },
    setup() {
        const activeName = ref('third');
        function goToResearcher(id) {
            if (!id) return;
            window.open("/profile/"+id,'_blank');
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
.error-actions {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}
.error-actions p {
    color: #606266;
    font-size: 14px;
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
    font-size: 1.1rem;
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

.outcome-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #fafafa;
    transition: box-shadow 0.3s ease;
}

.outcome-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.outcome-title {
    font-size: 1.2rem;
    font-weight: bold;
    color: #343a40;
    margin-bottom: 5px;
}

.outcome-info {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    font-size: 0.9rem;
    color: #6c757d;
}

.outcome-type {
    background-color: #e3f2fd;
    color: #1976d2;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
}

.outcome-authors {
    font-style: italic;
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
    font-size: 15px;
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

.file-button {
    float: right;
    margin-top: -3px;
}

.file-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.file-upload-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
}

.selected-filename {
    margin-left: 10px;
    color: #606266;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 300px;
}

.empty-files {
    text-align: center;
    color: #909399;
    padding: 20px 0;
}

.info-card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
