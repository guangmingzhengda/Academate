<template>
    <div class="side-component">
        <!-- 创建者信息 -->
        <div v-if="work && work.creatorUserDetail" class="card">
            <div class="card-header">项目创建者</div>
            <div class="creator-container">
                <div class="creator-info">
                    <img 
                        :src="work.creatorUserDetail.avatar || defaultAvatar" 
                        class="creator-avatar" 
                        alt="创建者头像" 
                        @click="goToUserProfile(work.creatorUserDetail.id)"
                    />
                    <div class="creator-details">
                        <div class="creator-name" @click="goToUserProfile(work.creatorUserDetail.id)">
                            {{ work.creatorUserDetail.name || work.creatorUserDetail.account }}
                        </div>
                        <div class="creator-institution" v-if="work.creatorUserDetail.institution">
                            <i class="el-icon-office-building"></i> {{ work.creatorUserDetail.institution }}
                        </div>
                        <div class="creator-field" v-if="work.creatorUserDetail.field">
                            <i class="el-icon-collection"></i> {{ work.creatorUserDetail.field }}
                        </div>
                    </div>
                </div>
                
                <!-- 额外的创建者信息 -->
                <div class="creator-additional-info">
                    <div class="info-item" v-if="work.creatorUserDetail.department">
                        <div class="info-label">所属部门</div>
                        <div class="info-value">{{ work.creatorUserDetail.department }}</div>
                    </div>
                    <div class="info-item" v-if="work.creatorUserDetail.jobTitle">
                        <div class="info-label">职称</div>
                        <div class="info-value">{{ work.creatorUserDetail.jobTitle }}</div>
                    </div>
                    <div class="info-item" v-if="work.creatorUserDetail.highestDegree">
                        <div class="info-label">最高学位</div>
                        <div class="info-value">{{ work.creatorUserDetail.highestDegree }}</div>
                    </div>
                    <div class="info-item" v-if="work.creatorUserDetail.graduateSchool">
                        <div class="info-label">毕业院校</div>
                        <div class="info-value">{{ work.creatorUserDetail.graduateSchool }}</div>
                    </div>
                    <div class="info-item" v-if="work.creatorUserDetail.major">
                        <div class="info-label">专业</div>
                        <div class="info-value">{{ work.creatorUserDetail.major }}</div>
                    </div>
                    <div class="info-item" v-if="work.creatorUserDetail.email">
                        <div class="info-label">联系邮箱</div>
                        <div class="info-value">{{ work.creatorUserDetail.email }}</div>
                    </div>
                </div>
                
                <!-- 创建者简介 -->
                <div class="creator-profile" v-if="work.creatorUserDetail.profile">
                    <div class="profile-label">个人简介</div>
                    <div class="profile-content">{{ work.creatorUserDetail.profile }}</div>
                </div>
            </div>
        </div>

        <!-- 项目成员列表 (仅对项目创建者和参与者显示) -->
        <div v-if="work && (role === 'creator' || role === 'participant')" class="card">
            <div class="card-header">
                项目成员
                <span class="member-count">共 {{ getMemberCount() }} 人</span>
            </div>
            <div class="members-container" v-if="work.participantUserDetail && work.participantUserDetail.length > 0">
                <div v-for="(member, index) in work.participantUserDetail" :key="index" class="member-item">
                    <img 
                        :src="member.avatar || defaultAvatar" 
                        class="member-avatar" 
                        alt="成员头像" 
                        @click="goToUserProfile(member.id)"
                    />
                    <div class="member-details">
                        <div class="member-name" @click="goToUserProfile(member.id)">
                            {{ member.name || member.account }}
                        </div>
                        <div class="member-institution" v-if="member.institution">
                            {{ member.institution }}
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="empty-members">
                暂无其他项目成员
            </div>
        </div>
    </div>
</template>

<script lang="js">
import {getAllCommentsAPI, getStarSum} from "@/page/achievement-detail/api/api";
import {ref} from "vue";
import { useRouter } from 'vue-router';

export default {
    name: "side-component",
    props: {
        work: {
            type: Object,
            default: () => ({})
        },
        role: {
            type: String,
            default: 'visitor'
        }
    },
    data() {
        return {
            owner: {
                id: 0,
                account: '',
                email: '',
                name: '项目负责人',
                institution: '',
                field: '',
                profile: '',
                avatar: '',
                createTime: '',
                jobTitle: '',
                department: '',
                highestDegree: '',
                graduateSchool: '',
                major: '',
                graduationDate: '',
                totalOutcomeLikes: 0,
                followersCount: 0
            },
            researchOutcomes: [],
            defaultAvatar: ref('/api/file/default_avatar.png')
        }
    },
    computed: {
        // 不需要统计数据的计算属性
    },
    mounted() {
        // 不再需要更新统计数据
    },
    methods: {
        viewProfile() {
            if (this.owner && this.owner.id) {
                window.open(`/profile/${this.owner.id}`, '_blank');
            }
        },
        formatEducation() {
            const { highestDegree, graduateSchool, major, graduationDate } = this.owner;
            let education = [];
            if (highestDegree) education.push(highestDegree);
            if (major) education.push(major);
            if (graduateSchool) education.push(graduateSchool);
            if (graduationDate) {
                // 只显示年月日
                const date = new Date(graduationDate);
                const y = date.getFullYear();
                const m = (date.getMonth() + 1).toString().padStart(2, '0');
                const d = date.getDate().toString().padStart(2, '0');
                education.push(`毕业于 ${y}-${m}-${d}`);
            }
            return education.length > 0 ? education.join(', ') : '暂无信息';
        },
        formatDate(date) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(date).toLocaleDateString(undefined, options);
        },
        goToOutcome(outcomeId) {
            if (!outcomeId) return;
            window.open(`/outcome-detail/${outcomeId}`, '_blank');
        },
        goToUserProfile(userId) {
            if (!userId) return;
            const router = useRouter();
            router.push(`/profile/${userId}`);
        },
        getMemberCount() {
            const participantCount = this.work?.participantUserDetail?.length || 0;
            // 加1是因为还有创建者
            return participantCount + 1;
        }
    },
    watch: {
        work: {
            handler(newWork) {
                // 当接收到新的work数据时，更新项目负责人信息
                if (newWork && newWork.userDetail) {
                    this.owner = {
                        ...this.owner,
                        ...newWork.userDetail
                    };
                } else if (newWork && newWork.researcherList && newWork.researcherList.length > 0) {
                    // 兼容旧的数据结构
                    const projectLead = newWork.researcherList.find(r => r.role === '项目负责人') || newWork.researcherList[0];
                    if (projectLead) {
                        this.owner.name = projectLead.name || this.owner.name;
                        this.owner.institution = projectLead.institution || this.owner.institution;
                        this.owner.id = projectLead.id || this.owner.id;
                    }
                }
                
                // 更新研究成果列表
                if (newWork && Array.isArray(newWork.researchOutcomes)) {
                    this.researchOutcomes = newWork.researchOutcomes;
                }
            },
            immediate: true,
            deep: true
        }
    }
}
</script>

<style scoped>
.side-component {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.card-header {
    background-color: #f5f7fa;
    padding: 12px 15px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.member-count {
    font-size: 14px;
    color: #909399;
    font-weight: normal;
}

/* 创建者样式 */
.creator-container {
    padding: 15px;
}

.creator-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

.creator-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    border: 2px solid #f0f0f0;
    transition: all 0.3s ease;
}

.creator-avatar:hover {
    border-color: #409eff;
    transform: scale(1.05);
}

.creator-details {
    flex: 1;
}

.creator-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 5px;
    cursor: pointer;
}

.creator-name:hover {
    color: #409eff;
    text-decoration: underline;
}

.creator-institution, .creator-field {
    font-size: 14px;
    color: #606266;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 5px;
}

/* 额外的创建者信息 */
.creator-additional-info {
    margin-top: 15px;
    border-top: 1px dashed #ebeef5;
    padding-top: 15px;
}

.info-item {
    display: flex;
    margin-bottom: 10px;
    font-size: 14px;
}

.info-label {
    width: 80px;
    color: #909399;
    flex-shrink: 0;
}

.info-value {
    color: #606266;
    flex: 1;
}

/* 创建者简介 */
.creator-profile {
    margin-top: 15px;
    border-top: 1px dashed #ebeef5;
    padding-top: 15px;
}

.profile-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
}

.profile-content {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    max-height: 120px;
    overflow-y: auto;
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
}

/* 成员列表样式 */
.members-container {
    padding: 15px;
    max-height: 300px;
    overflow-y: auto;
}

.member-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
}

.member-item:last-child {
    border-bottom: none;
}

.member-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
}

.member-details {
    flex: 1;
}

.member-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
}

.member-name:hover {
    color: #409eff;
    text-decoration: underline;
}

.member-institution {
    font-size: 12px;
    color: #909399;
}

.empty-members {
    padding: 20px 15px;
    text-align: center;
    color: #909399;
    font-size: 14px;
}
</style>
