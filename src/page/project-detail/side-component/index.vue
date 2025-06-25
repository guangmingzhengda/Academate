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
                <!-- <img :src="owner.avatar" alt="owner avatar" class="avatar"> -->
                <img src="../assets/default_avatar.png" alt="owner avatar" class="avatar">
                <div class="owner-details">
                    <div class="owner-name">{{ owner.name }}</div>
                    <div class="owner-title">{{ owner.title }}</div>
                    <div class="owner-institution">{{ owner.institution }}</div>
                </div>
            </div>
            <hr>
            <div class="info-section">
                <h4>研究领域</h4>
                <p>{{ owner.research_area }}</p>
            </div>
            <div class="info-section">
                <h4>教育背景</h4>
                <p>{{ owner.education }}</p>
            </div>
            <div class="info-section">
                <h4>个人简介</h4>
                <p class="bio">{{ owner.bio }}</p>
            </div>
             <div class="info-section">
                <h4>联系方式</h4>
                <p>{{ owner.email }}</p>
            </div>
        </div>
        <div class="card-footer">
            <el-button type="primary" plain @click="viewProfile">查看完整资料</el-button>
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
                user_id: 1,
                email: 'zhang.san@example.com',
                name: '张三',
                education: '博士 (计算机科学)',
                bio: '人工智能领域的资深专家，专注于机器学习和自然语言处理。致力于将前沿技术应用于解决实际问题，拥有超过15年的研发经验。',
                research_area: '机器学习, 自然语言处理, 计算机视觉',
                institution: '清华大学医学院',
                title: '教授 / 博士生导师',
                avatar: 'https://i.pravatar.cc/150?img=1'
            }
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
        updateStats() {
            if (this.work && this.work.stats) {
                this.memberCount = this.projectStats.memberCount || 0;
                this.comments = this.projectStats.comments || 0;
                this.favorites = this.projectStats.favorites || 0;
            }
        },
        getColor(value) {
            if (value < 10) {
                return '#4994c4';
            }
            if(value < 1000) {
                return '#003d74';
            }
            else {
                return '#2e59a7';
            }
        },
        formatNumber(value) {
            if (!value && value !== 0) return '0';
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + ' M';
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + ' K';
            } else {
                return value.toString();
            }
        },
        goToField(fieldName) {
            window.open(`/search/null/2/${fieldName}`,'_self');
        },
        goToAchievement(id) {
            window.open("/achievement-detail/"+id,'_self');
        },
        viewProfile() {
            window.open(`/profile/${this.owner.user_id}`, '_blank');
        }
    },
    setup() {
        function modifyTitle(s) {
            if (!s) return '';
            return s.replace(/\(<i>.*?<\/i>\)/g, '').replace(/<scp>.*?<\/scp>/g, '');
        }
        return {
            modifyTitle,
        }
    },
    watch: {
        work: {
            handler(newWork) {
                if (newWork && newWork.researcherList && newWork.researcherList.length > 0) {
                    const projectLead = newWork.researcherList.find(r => r.role === '项目负责人') || newWork.researcherList[0];
                    if (projectLead) {
                        this.owner.name = projectLead.name || this.owner.name;
                        this.owner.institution = projectLead.institution || this.owner.institution;
                        this.owner.user_id = projectLead.id || this.owner.user_id;
                    }
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
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.card-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
}

.card-header h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
}

.card-body {
    padding: 20px;
}

.owner-profile {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-right: 15px;
    border: 2px solid #f0f0f0;
}

.owner-details {
    display: flex;
    flex-direction: column;
}

.owner-name {
    font-size: 1.1rem;
    font-weight: bold;
    color: #333;
}

.owner-title, .owner-institution {
    font-size: 0.9rem;
    color: #666;
    margin-top: 4px;
}

.info-section {
    margin-bottom: 15px;
}

.info-section h4 {
    margin: 0 0 8px 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
}

.info-section p {
    margin: 0;
    font-size: 0.9rem;
    color: #555;
    line-height: 1.5;
}

.bio {
    text-align: justify;
}

.card-footer {
    padding: 15px 20px;
    background-color: #f9f9f9;
    border-top: 1px solid #e0e0e0;
    text-align: center;
}
</style>
