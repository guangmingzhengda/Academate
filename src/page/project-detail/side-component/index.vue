<template>
    <div class="stats">
        <div class="stat">
            <div style="font-size: 20px">成员数</div>
            <div :style="{ color: getColor(memberCount), fontSize: '18px' }">{{ formatNumber(memberCount) }}</div>
        </div>
        <div class="stat">
            <div style="font-size: 20px">评论数</div>
            <div :style="{ color: getColor(comments), fontSize: '18px' }">{{ formatNumber(comments) }}</div>
        </div>
        <div class="stat">
            <div style="font-size: 20px">收藏数</div>
            <div :style="{ color: getColor(favorites), fontSize: '18px' }">{{ formatNumber(favorites) }}</div>
        </div>
    </div>
    <hr>

    <div class="owner-info-card">
        <div class="card-header">
            <h3>关于项目负责人</h3>
        </div>
        <div class="card-body">
            <div class="owner-profile">
                <img :src="owner.avatar || '../assets/default_avatar.png'" alt="owner avatar" class="avatar">
                <div class="owner-details">
                    <div class="owner-name">{{ owner.name }}</div>
                    <div class="owner-institution">{{ owner.institution }}</div>
                    <div class="owner-title">{{ owner.jobTitle }}</div>
                </div>
            </div>
            <hr>
            <div class="info-section">
                <h4>研究领域</h4>
                <p>{{ owner.field || '暂无信息' }}</p>
            </div>
            <div class="info-section">
                <h4>教育背景</h4>
                <p>{{ formatEducation() }}</p>
            </div>
            <div class="info-section">
                <h4>个人简介</h4>
                <p class="bio">{{ owner.profile || '暂无信息' }}</p>
            </div>
             <div class="info-section">
                <h4>联系方式</h4>
                <p>{{ owner.email || '暂无信息' }}</p>
            </div>
            <div class="info-section">
                <h4>统计数据</h4>
                <p>研究成果获赞: {{ owner.totalOutcomeLikes || 0 }}</p>
                <p>关注人数: {{ owner.followersCount || 0 }}</p>
            </div>
        </div>
        <div class="card-footer">
            <el-button type="primary" plain @click="viewProfile">查看完整资料</el-button>
        </div>
    </div>
    
    <!-- 项目研究成果列表 -->
    <div class="research-outcomes" v-if="researchOutcomes && researchOutcomes.length > 0">
        <div class="card-header">
            <h3>项目研究成果</h3>
        </div>
        <div class="card-body">
            <div v-for="(outcome, index) in researchOutcomes" :key="index" class="outcome-item">
                <div class="outcome-title" @click="goToOutcome(outcome.outcomeId)">
                    {{ outcome.title }}
                </div>
                <div class="outcome-meta">
                    <span v-if="outcome.authors">作者: {{ outcome.authors }}</span>
                    <span v-if="outcome.publishDate">发表日期: {{ formatDate(outcome.publishDate) }}</span>
                    <span v-if="outcome.journal">期刊: {{ outcome.journal }}</span>
                    <span v-if="outcome.type" class="outcome-type">{{ outcome.type }}</span>
                </div>
                <div class="outcome-stats">
                    <span class="likes">
                        <i class="el-icon-star-on"></i> {{ outcome.likeCount || 0 }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="js">
import {getAllCommentsAPI, getStarSum} from "@/page/achievement-detail/api/api";
import {ref} from "vue";

export default {
    name: "side-component",
    props: {
        work: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            comments: ref(3),
            favorites: ref(1),
            memberCount: ref(5),
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
            researchOutcomes: []
        }
    },
    computed: {
        // 计算属性获取统计数据
        projectStats() {
            if (!this.work || !this.work.stats) {
                return { visitCount: 0, comments: 0, favorites: 0, memberCount: 0 };
            }
            return this.work.stats;
        }
    },
    mounted() {
        // 更新统计数据
        this.updateStats();
    },
    methods: {
        formatNumber(num) {
            if (num === undefined || num === null) return '0';
            if (num < 1000) return num.toString();
            if (num < 10000) return (num / 1000).toFixed(1) + 'k';
            return (num / 10000).toFixed(1) + 'w';
        },
        getColor(num) {
            if (num === undefined || num === null) num = 0;
            if (num >= 1000) return '#f5222d';
            if (num >= 100) return '#fa8c16';
            if (num >= 10) return '#52c41a';
            return '#1890ff';
        },
        viewProfile() {
            if (this.owner && this.owner.id) {
                window.open(`/profile/${this.owner.id}`, '_blank');
            }
        },
        updateStats() {
            if (this.work && this.work.stats) {
                this.comments = this.work.stats.comments || 0;
                this.favorites = this.work.stats.favorites || 0;
                this.memberCount = this.work.stats.memberCount || 0;
            }
        },
        formatEducation() {
            const { highestDegree, graduateSchool, major, graduationDate } = this.owner;
            let education = [];
            
            if (highestDegree) education.push(highestDegree);
            if (major) education.push(major);
            if (graduateSchool) education.push(graduateSchool);
            if (graduationDate) education.push(`毕业于 ${graduationDate}`);
            
            return education.length > 0 ? education.join(', ') : '暂无信息';
        },
        formatDate(date) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(date).toLocaleDateString(undefined, options);
        },
        goToOutcome(outcomeId) {
            if (!outcomeId) return;
            window.open(`/outcome-detail/${outcomeId}`, '_blank');
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
                
                // 当work更新时，更新统计数据
                this.updateStats();
            },
            immediate: true,
            deep: true
        }
    }
}
</script>

<style scoped>
.stats {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 100px;
    padding: 10px;
    box-sizing: border-box;
    margin-top: 10px;
    align-items: center;
}
.stat {
    text-align: center;
    line-height: 1.5;
    padding: 5px;
    box-sizing: border-box;
}
.small-title {
    text-align: left;
    font-weight: bold;
    font-size: 20px;
}
.field-list {
    padding: 5px;
}
.field {
    margin: 5px 0;
    cursor: pointer;
    text-align: left;
    font-size: 16px;
    color: #6e9bc5;
    transition: color 0.3s;
}
.field:hover {
    color: #106898;
}
hr {
    border: 0;
    height: 1px;
    background: #ccc;
    margin: 20px 0;
}

.owner-info-card {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin-bottom: 20px;
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.card-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f9f9f9;
    border-radius: 8px 8px 0 0;
}

.card-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
}

.card-body {
    padding: 20px;
}

.card-footer {
    padding: 15px 20px;
    border-top: 1px solid #e0e0e0;
    text-align: center;
    background-color: #f9f9f9;
    border-radius: 0 0 8px 8px;
}

.owner-profile {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e0e0e0;
}

.owner-details {
    margin-left: 15px;
}

.owner-name {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 5px;
}

.owner-institution, .owner-title {
    font-size: 14px;
    color: #666;
    margin-bottom: 3px;
}

.info-section {
    margin-bottom: 15px;
}

.info-section h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
    font-weight: 600;
}

.info-section p {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
}

.bio {
    max-height: 80px;
    overflow-y: auto;
}

.research-outcomes {
    margin-top: 20px;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.outcome-item {
    padding: 15px;
    border-bottom: 1px solid #e0e0e0;
    transition: background-color 0.2s;
}

.outcome-item:last-child {
    border-bottom: none;
}

.outcome-item:hover {
    background-color: #f9f9f9;
}

.outcome-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    cursor: pointer;
    margin-bottom: 8px;
}

.outcome-title:hover {
    color: #1890ff;
    text-decoration: underline;
}

.outcome-meta {
    margin-top: 5px;
    font-size: 13px;
    color: #666;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.outcome-type {
    background-color: #e6f7ff;
    color: #1890ff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.outcome-stats {
    margin-top: 8px;
    text-align: right;
}

.likes {
    font-size: 13px;
    color: #ff4d4f;
    display: inline-flex;
    align-items: center;
}

.likes i {
    margin-right: 3px;
}
</style>
