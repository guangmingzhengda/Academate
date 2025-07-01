<template>
    <!-- 过场动画层 -->
    <div v-if="showSplash" class="splash-overlay" :class="{ 'splash-fade-out': splashFadingOut }">
        <div class="splash-content">
            <div class="splash-text">
                {{ splashText }}<span v-show="showSplashCursor" class="splash-cursor">|</span>
            </div>
        </div>
    </div>

    <div class="bg-container"/>

    <div v-show="pageContentVisible" class="view-set-margin">
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
                <!-- 学术成果展示区域 -->
                 <fade-box>
                <div class="achievement-section">
                    <div class="section-card">
                        <div class="card-header">
                            <h3>文献阅读</h3>
                            <div class="search-controls">
                                <el-input
                                    v-model="achievementSearchKeyword"
                                    placeholder="搜索标题、作者或期刊..."
                                    style="width: 300px;"
                                    clearable
                                    @input="handleAchievementSearch"
                                >
                                    <template #prefix>
                                        <el-icon><Search /></el-icon>
                                    </template>
                                </el-input>
                            </div>
                        </div>
                        
                        <div class="card-content">
                            <div v-if="achievementLoading" class="empty-state">
                                正在加载学术成果数据...
                            </div>
                            
                            <div v-else-if="achievements.length === 0" class="empty-state">
                                暂无学术成果数据
                            </div>
                            
                            <div v-else-if="achievements.length > 0" class="achievement-list">
                                <div 
                                    v-for="achievement in currentPageAchievements" 
                                    :key="achievement.id" 
                                    class="achievement-item"
                                    @click="goToAchievementDetail(achievement)"
                                    style="cursor: pointer;"
                                    :style="{ '--mark-icon': `url(${getRandomMarkIcon()})` }"
                                >
                                    <div class="achievement-info">
                                        <div class="achievement-header">
                                            <div class="title-type-row">
                                                <span class="achievement-type-tag" :class="achievement.type">
                                                    {{ typeLabels[achievement.type] || achievement.type }}
                                                </span>
                                                <div class="achievement-title">{{ achievement.title }}</div>
                                            </div>
                                        </div>
                                        <div class="achievement-meta">
                                            <div class="meta-row">
                                                <span class="meta-item">作者：{{ achievement.authors || '暂无' }}</span>
                                            </div>
                                            <div class="meta-row">
                                                <span v-if="achievement.publishDate" class="meta-item">发表时间：{{ achievement.publishDate }}</span>
                                                <span v-if="achievement.journal" class="meta-item">期刊：{{ achievement.journal }}</span>
                                                <span v-if="achievement.conference" class="meta-item">会议：{{ achievement.conference }}</span>
                                                <span v-if="achievement.patentNumber" class="meta-item">专利号：{{ achievement.patentNumber }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 学术成果分页 -->
                            <el-pagination
                                v-if="achievementTotal > achievementPageSize"
                                v-model:current-page="achievementCurrentPage"
                                :page-size="achievementPageSize"
                                :total="achievementTotal"
                                layout="prev, pager, next"
                                class="pagination"
                                small
                                @current-change="handleAchievementPageChange"
                            />
                        </div>
                    </div>
                </div>
                </fade-box>
                <!-- 项目展示区域 -->
                <fade-box>
                <div class="project-section">
                    <div class="section-card">
                        <div class="card-header">
                            <h3>全部项目</h3>
                        </div>
                        
                        <div class="card-content">
                            <div v-if="projectLoading" class="empty-state">
                                正在加载项目数据...
                            </div>
                            
                            <div v-else-if="projects.length === 0" class="empty-state">
                                暂无项目数据
                            </div>
                            
                            <div v-else class="project-list">
                                <div 
                                    v-for="project in currentPageProjects" 
                                    :key="project.id" 
                                    class="project-item"
                                    @click="goToProjectDetail(project)"
                                    style="cursor: pointer;"
                                    :style="{ '--mark-icon': `url(${getRandomMarkIcon()})` }"
                                >
                                    <div class="project-info">
                                        <div class="project-title-row">
                                            <div class="project-title">{{ project.name }}</div>
                                            <img :src="getRandomIcon()" alt="项目图标" class="project-icon" />
                                        </div>
                                        <div class="project-desc">{{ project.description }}</div>
                                        <div class="project-meta">
                                            <div class="meta-row">
                                                <span class="meta-item">开始时间：{{ formatDate(project.startDate) }}</span>
                                                <span class="meta-item">状态：{{ project.status }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 项目分页 -->
                            <el-pagination
                                v-if="projectTotal > projectPageSize"
                                v-model:current-page="projectCurrentPage"
                                :page-size="projectPageSize"
                                :total="projectTotal"
                                layout="prev, pager, next"
                                class="pagination"
                                small
                                @current-change="handleProjectPageChange"
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
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import fadeBox from "@/page/home/component/fadeBox/index.vue";
import logo from "@/page/home/component/logo/index.vue"
import homeBottom from "@/page/home/component/homeBottom/index.vue"
import leftPin from "@/page/home/component/leftPin/index.vue";
import { getAllOutcomes, ResourceOutcomeSearchVO } from "@/api/home";
import { get_all_projects } from "@/api/project";
import { researchOutcomeLibrarySearch } from "@/api/search";
import { setNav } from "@/nav/set";


export default {
    name: "home",
    components: {fadeBox, logo, homeBottom, leftPin},
    setup(){
        const router = useRouter();

        // 过场动画相关数据
        const showSplash = ref(true);
        const splashFadingOut = ref(false);
        const splashText = ref('');
        const showSplashCursor = ref(true);
        const pageContentVisible = ref(false);
        const fullSplashText = 'Academate Platform 2025';
        const SPLASH_CACHE_KEY = 'academate_splash_timestamp';
        const SPLASH_CACHE_DURATION = 5 * 60 * 1000; // 5分钟（毫秒）

        // 项目相关数据
        const projectCurrentPage = ref(1);
        const projectPageSize = ref(5);
        const projects = ref([]);
        const projectTotal = ref(0);
        const projectLoading = ref(false);

        // 学术成果相关数据
        const achievementCurrentPage = ref(1);
        const achievementPageSize = ref(5);
        const achievements = ref([]);
        const achievementTotal = ref(0);
        const achievementLoading = ref(false);

        // 学术成果搜索相关数据
        const achievementSearchKeyword = ref('');

        // 成果类型标签
        const typeLabels = {
            '期刊论文': '期刊论文',
            '会议论文': '会议论文', 
            '专利': '专利',
            '书': '书',
            '技术报告': '技术报告',
            '海报': '海报',
            '数据': '数据',
            '其他': '其他'
        };

        // 项目分页计算属性 - 现在直接返回当前页的数据
        const currentPageProjects = computed(() => {
            return projects.value;
        });

        // 学术成果分页计算属性 - 现在直接返回当前页的数据
        const currentPageAchievements = computed(() => {
            return achievements.value;
        });

        // 项目分页处理
        const handleProjectPageChange = async (page) => {
            projectCurrentPage.value = page;
            await loadProjects();
        };

        // 学术成果分页处理
        const handleAchievementPageChange = async (page) => {
            achievementCurrentPage.value = page;
            await loadAchievements();
        };

        // 加载项目数据
        const loadProjects = async () => {
            projectLoading.value = true;
            try {
                const result = await get_all_projects({
                    page: projectCurrentPage.value,
                    size: projectPageSize.value
                });
                if (result) {
                    // 过滤出 isPublic 为 true 的项目
                    const publicProjects = result.records.filter(item => item.isPublic);
                    projects.value = publicProjects.map(item => ({
                        id: item.projectId,
                        name: item.title,
                        description: item.description,
                        startDate: item.startDate,
                        status: item.status
                    }));
                    projectTotal.value = publicProjects.length;
                    console.log(`成功加载 ${projects.value.length} 条公开项目数据，总计 ${projectTotal.value} 条`);
                } else {
                    projects.value = [];
                    projectTotal.value = 0;
                }
            } catch (error) {
                console.error('加载项目数据失败:', error);
                projects.value = [];
                projectTotal.value = 0;
            } finally {
                projectLoading.value = false;
            }
        };

        // 加载学术成果数据
        const loadAchievements = async () => {
            achievementLoading.value = true;
            try {
                // 使用新的搜索API，notMine为false，pageSize为5
                const result = await researchOutcomeLibrarySearch({
                    key: achievementSearchKeyword.value.trim(),
                    notMine: false,
                    pageSize: achievementPageSize.value,
                    pageNum: achievementCurrentPage.value
                });
                if (result && result.data) {
                    achievements.value = result.data.list.map(item => ({
                        id: item.outcomeId,
                        type: item.type,
                        title: item.title,
                        authors: item.authors,
                        journal: item.journal,
                        publishDate: item.publishDate ? formatTimestamp(item.publishDate) : null
                    }));
                    achievementTotal.value = result.data.total;
                    console.log(`成功加载 ${achievements.value.length} 条成果数据，总计 ${achievementTotal.value} 条`);
                } else {
                    achievements.value = [];
                    achievementTotal.value = 0;
                }
            } catch (error) {
                console.error('加载成果数据失败:', error);
                achievements.value = [];
                achievementTotal.value = 0;
            } finally {
                achievementLoading.value = false;
            }
        };

        // 学术成果搜索处理
        const handleAchievementSearch = () => {
            achievementCurrentPage.value = 1;
            loadAchievements();
        };

        // 时间戳格式化函数
        const formatTimestamp = (timestamp) => {
            if (!timestamp) return null;
            const date = new Date(timestamp);
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        };

        // 日期格式化函数
        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
        };

        // 随机图标函数
        const getRandomIcon = () => {
            const icons = [
                'beveled-star.png',
                'cursed-star.png', 
                'night-sky.png',
                'polar-star.png',
                'star-swirl.png'
            ];
            const randomIndex = Math.floor(Math.random() * icons.length);
            return require(`@/asset/home/${icons[randomIndex]}`);
        };

        // 随机mark图标函数 - 前四种图标有更高权重
        const getRandomMarkIcon = () => {
            const markIcons = [
                // 前四种图标各出现5次，大幅增加权重
                'mark-1.png', 'mark-1.png', 'mark-1.png', 'mark-1.png', 'mark-1.png',
                'mark-2.png', 'mark-2.png', 'mark-2.png', 'mark-2.png', 'mark-2.png',
                'mark-3.png', 'mark-3.png', 'mark-3.png', 'mark-3.png', 'mark-3.png',
                'mark-4.png', 'mark-4.png', 'mark-4.png', 'mark-4.png', 'mark-4.png',
                // 后面7种图标各出现1次
                'mark-5.png',
                'mark-6.png',
                'mark-7.png',
                'mark-8.png',
                'mark-9.png',
                'mark-10.png',
                'mark-11.png'
            ];
            const randomIndex = Math.floor(Math.random() * markIcons.length);
            return require(`@/asset/home/${markIcons[randomIndex]}`);
        };

        // 跳转到项目详情
        const goToProjectDetail = (project) => {
            router.push(`/project-detail/${project.id}`)
        }

        // 跳转到学术成果详情
        const goToAchievementDetail = (achievement) => {
            router.push(`/outcome-detail/${achievement.id}`)
        }

        // 检查是否需要显示过场动画
        const shouldShowSplash = () => {
            try {
                const lastSplashTime = localStorage.getItem(SPLASH_CACHE_KEY);
                if (!lastSplashTime) {
                    // 第一次访问，显示过场动画
                    return true;
                }
                
                const currentTime = Date.now();
                const timeDiff = currentTime - parseInt(lastSplashTime);
                
                // 如果距离上次播放超过5分钟，显示过场动画
                return timeDiff > SPLASH_CACHE_DURATION;
            } catch (error) {
                console.error('检查过场动画缓存失败:', error);
                return true; // 出错时默认显示
            }
        };

        // 记录过场动画播放时间
        const recordSplashTime = () => {
            try {
                localStorage.setItem(SPLASH_CACHE_KEY, Date.now().toString());
            } catch (error) {
                console.error('记录过场动画时间失败:', error);
            }
        };

        // 过场动画打字机效果
        const splashTypeWriter = async () => {
            for (let i = 0; i <= fullSplashText.length; i++) {
                splashText.value = fullSplashText.slice(0, i);
                await new Promise(resolve => setTimeout(resolve, 45)); // 45ms每个字符，更快
            }
            // 打字完成后停顿
            await new Promise(resolve => setTimeout(resolve, 150));
            showSplashCursor.value = false;
        };

        // 过场动画序列控制
        const startSplashSequence = async () => {
            // 1. 隐藏导航栏
            setNav(false);
            
            // 2. 记录过场动画播放时间
            recordSplashTime();
            
            // 3. 开始打字机效果（约1.5秒）
            await splashTypeWriter();
            
            // 4. 开始淡出过场动画
            splashFadingOut.value = true;
            
            // 5. 淡出完成后显示导航栏和页面内容
            setTimeout(() => {
                showSplash.value = false;
                setNav(true);
                pageContentVisible.value = true; // 页面内容立即显示，让原有fade-box效果正常工作
            }, 600); // 等待淡出动画完成（600ms）
        };

        // 跳过过场动画，直接显示页面内容
        const skipSplashAndShowContent = () => {
            showSplash.value = false;
            setNav(true);
            pageContentVisible.value = true;
        };

        onMounted(async () => {
            // 检查是否需要显示过场动画
            if (shouldShowSplash()) {
                // 显示过场动画
                startSplashSequence();
                
                // 在过场动画期间预加载数据
                setTimeout(async () => {
                    await loadProjects();
                    await loadAchievements();
                }, 200);
            } else {
                // 跳过过场动画，直接显示页面内容
                skipSplashAndShowContent();
                
                // 立即加载数据
                setTimeout(async () => {
                    await loadProjects();
                    await loadAchievements();
                }, 100);
            }
        });

        return {
            // 过场动画相关
            showSplash,
            splashFadingOut,
            splashText,
            showSplashCursor,
            pageContentVisible,
            
            // 项目相关
            projects,
            projectCurrentPage,
            projectPageSize,
            projectTotal,
            projectLoading,
            currentPageProjects,
            handleProjectPageChange,
            loadProjects,
            
            // 学术成果相关
            achievements,
            achievementCurrentPage,
            achievementPageSize,
            achievementTotal,
            achievementLoading,
            currentPageAchievements,
            typeLabels,
            handleAchievementPageChange,
            loadAchievements,
            
            // 学术成果搜索相关
            achievementSearchKeyword,
            handleAchievementSearch,
            
            // 工具函数
            getRandomIcon,
            getRandomMarkIcon,
            goToProjectDetail,
            goToAchievementDetail,
            formatDate
        };

    }
}
</script>

<style scoped>

/* 过场动画样式 */
.splash-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #008cff, #3b82f6); /* 深蓝色到亮蓝色渐变 */
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 1;
    transition: opacity 0.6s ease-in-out;
}

.splash-overlay.splash-fade-out {
    opacity: 0;
}

.splash-content {
    text-align: center;
}

.splash-text {
    font-family: 'Brush Script MT', cursive;
    font-size: 48px;
    font-weight: bold;
    color: #000000;
    text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.3);
    letter-spacing: 2px;
}

.splash-cursor {
    font-weight: bold;
    color: #000000;
    animation: splashBlink 1s infinite;
}

@keyframes splashBlink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

/* 页面内容在过场动画结束后直接显示，保持原有fade-box效果 */

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

.search-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #999;
    padding: 40px;
    font-size: 18px;
    min-height: 200px;
    text-align: center;
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
    position: relative;
    overflow: hidden;
}

.project-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: var(--mark-icon);
    background-repeat: no-repeat;
    background-position: bottom right;
    background-size: 80px 80px;
    background-blend-mode: multiply;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
    transition: background-size 0.3s ease;
}

.project-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.project-item:hover::before {
    background-size: 85px 85px;
}

.project-item:hover .project-icon {
    opacity: 1;
    transform: scale(1.1);
}

.project-info {
    flex: 1;
    position: relative;
    z-index: 1;
}

.project-title-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 6px;
}

.project-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #2c3e50;
    text-align: left;
}

.project-icon {
    width: 22px;
    height: 22px;
    object-fit: cover;
    border-radius: 4px;
    margin-left: 8px;
    opacity: 0.8;
    transition: all 0.3s ease;
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
    margin-bottom: 3px;
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #666;
    word-wrap: break-word;
    word-break: break-all;
    white-space: normal;
    line-height: 1.5;
    max-width: 100%;
}

.meta-item:first-child {
    color: #666;
    text-align: left;
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
    position: relative;
    overflow: hidden;
}

.achievement-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: var(--mark-icon);
    background-repeat: no-repeat;
    background-position: bottom right;
    background-size: 80px 80px;
    background-blend-mode: multiply;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
    transition: background-size 0.3s ease;
}

.achievement-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.achievement-item:hover::before {
    background-size: 85px 85px;
}

.achievement-info {
    width: 100%;
    position: relative;
    z-index: 1;
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

.achievement-type-tag.期刊论文 {
    background-color: #67c23a;
}

.achievement-type-tag.会议论文 {
    background-color: #409eff;
}

.achievement-type-tag.专利 {
    background-color: #e6a23c;
}

.achievement-type-tag.书 {
    background-color: #909399;
}

.achievement-type-tag.技术报告 {
    background-color: #8e44ad;
}

.achievement-type-tag.海报 {
    background-color: #e67e22;
}

.achievement-type-tag.数据 {
    background-color: #1abc9c;
}

.achievement-type-tag.其他 {
    background-color: #95a5a6;
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

.meta-row {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
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