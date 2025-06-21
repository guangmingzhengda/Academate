<template>
    <div class="bg-container"/>

    <div class="view-set-margin">
        <div class="content-container">

            <div class="content-left">

                <fade-box style="margin-bottom: 25px">
                    <logo/>
                </fade-box>

<!--                <fade-box>-->
                <left-pin r-title="recommend"/>
<!--                </fade-box>-->

            </div>

            <div class="content-right">
                <!-- 项目展示区域 -->
                <fade-box>
                <div class="project-section">
                    <div class="section-card">
                        <div class="card-header">
                            <h3>全部项目</h3>
                        </div>
                        
                        <div class="card-content">
                            <div v-if="projects.length === 0" class="empty-state">
                                暂无项目数据
                            </div>
                            
                            <div v-else class="project-list">
                                <div 
                                    v-for="project in currentPageProjects" 
                                    :key="project.id" 
                                    class="project-item"
                                >
                                    <div class="project-info">
                                        <div class="project-title">{{ project.name }}</div>
                                        <div class="project-desc">{{ project.description }}</div>
                                        <div class="project-meta">
                                            <div class="meta-row">
                                                <span class="meta-item">开始时间：{{ project.startDate }}</span>
                                                <span class="meta-item">状态：{{ project.status }}</span>
                                            </div>
                                            <div class="meta-row">
                                                <span class="meta-item">负责人：{{ project.leader }}</span>
                                                <span v-if="project.endDate" class="meta-item">结束时间：{{ project.endDate }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 项目分页 -->
                            <el-pagination
                                v-if="projects.length > projectPageSize"
                                v-model:current-page="projectCurrentPage"
                                :page-size="projectPageSize"
                                :total="projects.length"
                                layout="prev, pager, next"
                                class="pagination"
                                small
                                @current-change="handleProjectPageChange"
                            />
                        </div>
                    </div>
                </div>
                </fade-box>
                <!-- 学术成果展示区域 -->
                 <fade-box>
                <div class="achievement-section">
                    <div class="section-card">
                        <div class="card-header">
                            <h3>文献阅读</h3>
                        </div>
                        
                        <div class="card-content">
                            <div v-if="achievements.length === 0" class="empty-state">
                                暂无学术成果数据
                            </div>
                            
                            <div v-else class="achievement-list">
                                <div 
                                    v-for="achievement in currentPageAchievements" 
                                    :key="achievement.id" 
                                    class="achievement-item"
                                >
                                    <div class="achievement-info">
                                        <div class="achievement-header">
                                            <div class="title-type-row">
                                                <span class="achievement-type-tag" :class="achievement.type">
                                                    {{ typeLabels[achievement.type] }}
                                                </span>
                                                <div class="achievement-title">{{ achievement.title }}</div>
                                            </div>
                                        </div>
                                        <div class="achievement-meta">
                                            <div class="meta-row">
                                                <span class="meta-label">作者：</span>
                                                <span class="meta-value">{{ achievement.authors || '暂无' }}</span>
                                                <span v-if="achievement.publishDate" class="meta-label">发表时间：</span>
                                                <span v-if="achievement.publishDate" class="meta-value">{{ achievement.publishDate }}</span>
                                            </div>
                                            <div v-if="achievement.journal || achievement.conference || achievement.patentNumber" class="meta-row">
                                                <span v-if="achievement.journal" class="meta-label">期刊：</span>
                                                <span v-if="achievement.journal" class="meta-value">{{ achievement.journal }}</span>
                                                <span v-if="achievement.conference" class="meta-label">会议：</span>
                                                <span v-if="achievement.conference" class="meta-value">{{ achievement.conference }}</span>
                                                <span v-if="achievement.patentNumber" class="meta-label">专利号：</span>
                                                <span v-if="achievement.patentNumber" class="meta-value">{{ achievement.patentNumber }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 学术成果分页 -->
                            <el-pagination
                                v-if="achievements.length > achievementPageSize"
                                v-model:current-page="achievementCurrentPage"
                                :page-size="achievementPageSize"
                                :total="achievements.length"
                                layout="prev, pager, next"
                                class="pagination"
                                small
                                @current-change="handleAchievementPageChange"
                            />
                        </div>
                    </div>
                </div>
                </fade-box>

            </div>
        </div>

        <home-bottom/>
    </div>



<!--    <el-backtop :left="50" :bottom="50" />-->

</template>


<script>

import {onMounted, ref, computed} from "vue";
import fadeBox from "@/page/home/component/fadeBox/index.vue";
import logo from "@/page/home/component/logo/index.vue"
import homeBottom from "@/page/home/component/homeBottom/index.vue"
import leftPin from "@/page/home/component/leftPin/index.vue";


export default {
    name: "home",
    components: {fadeBox, logo, homeBottom, leftPin},
    setup(){

        // 项目相关数据
        const projectCurrentPage = ref(1);
        const projectPageSize = ref(5);
        const projects = ref([
            {
                id: 1,
                name: '智能教育平台开发',
                description: '基于人工智能技术的个性化教育平台，支持自适应学习和智能推荐功能。',
                startDate: '2023-01-15',
                endDate: '2023-12-31',
                status: '进行中',
                leader: 'HHH'
            },
            {
                id: 2,
                name: '深度学习算法优化研究',
                description: '针对计算机视觉领域的深度学习算法进行性能优化和准确性提升研究。',
                startDate: '2022-06-01',
                endDate: '2023-05-31',
                status: '已完成',
                leader: 'HHH'
            },
            {
                id: 3,
                name: '知识图谱构建系统',
                description: '构建面向特定领域的知识图谱系统，实现知识的自动抽取和推理。',
                startDate: '2023-09-01',
                endDate: '2024-08-31',
                status: '进行中',
                leader: 'HHH'
            },
            {
                id: 4,
                name: '智能推荐系统优化',
                description: '基于用户行为分析的智能推荐算法研究与实现。',
                startDate: '2023-03-01',
                endDate: '2024-02-29',
                status: '进行中',
                leader: 'HHH'
            },
            {
                id: 5,
                name: '区块链技术应用研究',
                description: '探索区块链技术在学术诚信和版权保护方面的应用。',
                startDate: '2022-09-01',
                endDate: '2023-08-31',
                status: '已完成',
                leader: 'HHH'
            },
            {
                id: 6,
                name: '机器学习框架优化',
                description: '研究和开发高效的机器学习框架，提升模型训练和推理效率。',
                startDate: '2023-07-01',
                endDate: '2024-06-30',
                status: '进行中',
                leader: 'HHH'
            },
            {
                id: 7,
                name: '自然语言处理系统',
                description: '开发面向中文的自然语言处理系统，支持文本分析和语义理解。',
                startDate: '2023-05-01',
                endDate: '2024-04-30',
                status: '进行中',
                leader: 'HHH'
            }
        ]);

        // 学术成果相关数据
        const achievementCurrentPage = ref(1);
        const achievementPageSize = ref(5);
        const achievements = ref([
            {
                id: 1,
                type: 'journal',
                title: '基于深度学习的图像识别算法研究',
                authors: 'HHH, 张三, 李四',
                journal: 'IEEE Transactions on Image Processing',
                volume: '32',
                issue: '5',
                pages: '1234-1245',
                publishDate: '2023-05-15',
                doi: '10.1109/TIP.2023.1234567'
            },
            {
                id: 2,
                type: 'conference',
                title: '智能教育系统中的个性化推荐算法',
                authors: 'HHH, 王五, 赵六',
                conference: 'International Conference on Educational Technology',
                location: '北京',
                publishDate: '2023-08-20'
            },
            {
                id: 3,
                type: 'patent',
                title: '一种基于人工智能的学习路径推荐方法',
                authors: 'HHH, 孙七',
                patentNumber: 'CN202310123456.7',
                patentType: 'invention',
                publishDate: '2023-06-10'
            },
            {
                id: 4,
                type: 'journal',
                title: '知识图谱在教育领域的应用研究',
                authors: 'HHH, 周八',
                journal: 'Computers & Education',
                volume: '195',
                issue: '3',
                pages: '456-467',
                publishDate: '2023-07-01'
            },
            {
                id: 5,
                type: 'conference',
                title: '基于强化学习的智能推荐系统',
                authors: 'HHH, 吴九, 郑十',
                conference: 'AAAI Conference on Artificial Intelligence',
                location: '华盛顿',
                publishDate: '2023-09-12'
            },
            {
                id: 6,
                type: 'book',
                title: '人工智能在教育中的应用',
                authors: 'HHH',
                publisher: '清华大学出版社',
                publishDate: '2023-03-01'
            },
            {
                id: 7,
                type: 'software',
                title: '智能学习管理系统V1.0',
                authors: 'HHH, 技术团队',
                registrationNumber: '2023SR0123456',
                publishDate: '2023-04-15'
            }
        ]);

        // 成果类型标签
        const typeLabels = {
            journal: '期刊论文',
            conference: '会议论文',
            patent: '专利',
            book: '专著',
            software: '软件著作权'
        };

        // 项目分页计算属性
        const currentPageProjects = computed(() => {
            const start = (projectCurrentPage.value - 1) * projectPageSize.value;
            const end = start + projectPageSize.value;
            return projects.value.slice(start, end);
        });

        // 学术成果分页计算属性
        const currentPageAchievements = computed(() => {
            const start = (achievementCurrentPage.value - 1) * achievementPageSize.value;
            const end = start + achievementPageSize.value;
            return achievements.value.slice(start, end);
        });

        // 项目分页处理
        const handleProjectPageChange = (page) => {
            projectCurrentPage.value = page;
        };

        // 学术成果分页处理
        const handleAchievementPageChange = (page) => {
            achievementCurrentPage.value = page;
        };

        onMounted(async () => {
            // 设置导航状态
            //setNav(false);
        });

        return {
            // 项目相关
            projects,
            projectCurrentPage,
            projectPageSize,
            currentPageProjects,
            handleProjectPageChange,
            
            // 学术成果相关
            achievements,
            achievementCurrentPage,
            achievementPageSize,
            currentPageAchievements,
            typeLabels,
            handleAchievementPageChange
        };

    }
}
</script>

<style scoped>

.content-container{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 1200px;
    height: auto;
}

.bg-container {
    background: url('@/asset/home/homehead.png');
    /*opacity: 0.8;*/
    background-size: cover;
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -3;
    top: 0;
    left: 0;
}

.root-set{
    height: 100vh;
    width: 100%;
    /*display: flex;*/
    transition: height 0.8s;
    position: relative;
}

.root-set-change{
    height: 0;
    width: 100%;
    /*display: flex;*/
    transition: height 0.8s;
}

.msg-set{
    transition: opacity 0.3s;
}

.msg-set-change{
    opacity: 0;
    transition: opacity 0.3s;
    z-index: -2;
}

.bar-set{
    margin: auto;
    /*width: 100%;*/
    transition: opacity 0.6s;
}

.bar-set-change{
    margin: auto;
    opacity: 0;
    transition: opacity 0.6s;
    z-index: -2;
}

.content-right{
    width: 70%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* 项目和学术成果展示区域样式 */
.project-section,
.achievement-section {
    width: 100%;
}

.section-card {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f2f5;
}

.card-header h3 {
    font-family: 'Meiryo', sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0;
}

.empty-state {
    text-align: left;
    color: #999;
    padding: 40px;
    font-size: 14px;
}

/* 项目样式 */
.project-list {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.project-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 15px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.project-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.project-info {
    flex: 1;
}

.project-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 6px;
    text-align: left;
}

.project-desc {
    font-family: 'Meiryo', sans-serif;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
    line-height: 1.3;
    text-align: left;
}

.project-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.meta-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.meta-item {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #8e8e8e;
}

/* 学术成果样式 */
.achievement-list {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.achievement-item {
    padding: 15px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.achievement-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.achievement-info {
    width: 100%;
}

.achievement-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.title-type-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.achievement-type-tag {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    color: white;
    white-space: nowrap;
}

.achievement-type-tag.journal {
    background-color: #67c23a;
}

.achievement-type-tag.conference {
    background-color: #409eff;
}

.achievement-type-tag.patent {
    background-color: #e6a23c;
}

.achievement-type-tag.book {
    background-color: #909399;
}

.achievement-type-tag.software {
    background-color: #f56c6c;
}

.achievement-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
    text-align: left;
    flex: 1;
}

.achievement-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.meta-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #8e8e8e;
    font-weight: normal;
}

.meta-value {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #666;
    margin-right: 15px;
}

/* 分页样式 */
.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
.content-left{
    width: 28%;
    min-height: 1000px;
}

.view-set-margin{
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 100px;
}
.pagination-style{
    justify-content: center;
}

.layer-set{
    z-index: 1;
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex
}

.layer-set-change{
    z-index: -2;
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex
}

.zind{
    z-index: -2;
}

.zind2{
    z-index: 2;
}

ai-op1{
    opacity: 1 !important;
}

ai-op0{
    opacity: 0 !important;
}

</style>
