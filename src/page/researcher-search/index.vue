<template>
    <div class="bg-container"/>
    
    <div style="display: flex; justify-content: center; width: 100%; height: 100%;">
        <div class="researcher-search-container">
            <div class="search-content">
                
                <!-- 页面标题 -->
                <!-- <div class="page-header">
                    <h2>科研人员检索</h2>
                    <div class="result-count">共找到 {{ filteredResearchers.length }} 位科研人员</div>
                </div> -->

                <!-- 主要内容区域 -->
                <div class="main-content">
                    <!-- 左侧搜索选项 -->
                    <div class="search-sidebar">
                        <!-- 标题图片 -->
                        <div class="search-title-image">
                            <img src="@/asset/search/title.png" alt="检索标题" class="title-image" />
                        </div>
                        
                        <div class="search-card">
                            <div class="card-header">
                                <h3>高级检索</h3>
                                <el-button type="primary" plain size="small" @click="resetFilters">
                                    <el-icon><Refresh /></el-icon>
                                    重置
                                </el-button>
                            </div>
                            
                            <div class="card-content">
                                <!-- 关键词输入 -->
                                <div class="filter-item">
                                    <label class="filter-label">姓名</label>
                                    <el-input
                                        v-model="searchFilters.userName"
                                        placeholder="请输入科研人员姓名"
                                        clearable
                                        @input="searchResearchers"
                                    />
                                </div>

                                <!-- 成果题目 -->
                                <div class="filter-item">
                                    <label class="filter-label">成果题目</label>
                                    <el-input
                                        v-model="searchFilters.researchTitle"
                                        placeholder="请输入成果题目关键词"
                                        clearable
                                        @input="searchResearchers"
                                    />
                                </div>

                                <!-- 机构名称 -->
                                <div class="filter-item">
                                    <label class="filter-label">所在机构</label>
                                    <el-input
                                        v-model="searchFilters.institution"
                                        placeholder="请输入机构名称"
                                        clearable
                                        @input="searchResearchers"
                                    />
                                </div>

                                <!-- 研究领域 -->
                                <div class="filter-item">
                                    <label class="filter-label">研究领域</label>
                                    <el-input
                                        v-model="searchFilters.field"
                                        placeholder="请输入研究领域"
                                        clearable
                                        @input="searchResearchers"
                                    />
                                </div>


                            </div>
                        </div>
                    </div>

                    <!-- 右侧搜索结果 -->
                    <div class="results-content">
                        <div class="results-list">
                            <!-- 加载状态 -->
                            <div v-if="loading" class="loading-state">
                                <el-icon class="loading-icon"><Loading /></el-icon>
                                <div class="loading-text">正在搜索科研人员...</div>
                            </div>
                            
                            <!-- 空状态 -->
                            <div v-else-if="researchers.length === 0" class="empty-state">
                                <el-icon class="empty-icon"><Search /></el-icon>
                                <div class="empty-text">暂无符合条件的科研人员</div>
                                <div class="empty-desc">请尝试调整搜索条件</div>
                            </div>
                            
                            <!-- 搜索结果列表 -->
                            <div v-else class="researcher-list">
                                <div 
                                    v-for="researcher in researchers" 
                                    :key="researcher.id" 
                                    class="researcher-item"
                                    style="position: relative;"
                                >
                                    <div class="action-buttons card-action-buttons" v-if="researcher.id !== currentUserId">
                                        <el-button
                                            v-if="!researcher.isFollowing"
                                            type="primary"
                                            size="small"
                                            @click="toggleFollow(researcher)"
                                        >
                                            关注
                                        </el-button>
                                        <el-button
                                            v-else
                                            type="info"
                                            plain
                                            size="small"
                                            @click="toggleFollow(researcher)"
                                        >
                                            已关注
                                        </el-button>
                                        <el-button
                                            type="default"
                                            size="small"
                                            @click="sendMessage(researcher)"
                                        >
                                            私信
                                        </el-button>
                                    </div>
                                    <div class="researcher-info" style="display: flex; align-items: flex-start;">
                                        <router-link :to="`/profile/${researcher.id}`" class="avatar-section" style="text-decoration:none;">
                                            <div class="researcher-avatar" :style="{ backgroundColor: !researcher.avatar ? getRandomColor(researcher.id) : '' }">
                                                <template v-if="researcher.avatar">
                                                    <img :src="researcher.avatar" alt="avatar" class="avatar-img" />
                                                </template>
                                                <template v-else>
                                                    {{ researcher.name ? researcher.name.charAt(0) : 'U' }}
                                                </template>
                                            </div>
                                        </router-link>
                                        <div class="info-section">
                                            <div class="info-header">
                                                <router-link :to="`/profile/${researcher.id}`" class="researcher-name" style="text-decoration:none;">
                                                    {{ researcher.name || '未知用户' }}
                                                </router-link>
                                                <span v-if="researcher.field" class="researcher-field">{{ researcher.field }}</span>
                                            </div>
                                            <div class="profile-text">
                                                <div class="info-row">
                                                    <span class="info-label">个人简介：</span>
                                                    <span class="info-content">{{ researcher.profile ? researcher.profile : '这个人很神秘，什么都没有留下~' }}</span>
                                                </div>
                                            </div>
                                            <div class="info-footer">
                                                <div class="info-row">
                                                    <span class="info-label">所属机构：</span>
                                                    <span class="info-content">{{ researcher.institution || '暂无' }}</span>
                                                </div>
                                                <div class="info-row">
                                                    <span class="info-label">Email：</span>
                                                    <span class="info-content">{{ researcher.email || '暂无' }}</span>
                                                </div>
                                            </div>
                                            <div class="info-footer">
                                                <div class="info-row">
                                                    <span class="info-label">研究成果：</span>
                                                    <span class="info-value research-outcomes-list">
                                                        <template v-if="researcher.researchOutcomes && researcher.researchOutcomes.length > 0">
                                                            <div v-for="(outcome, idx) in researcher.researchOutcomes.slice(0, 3)" :key="outcome.outcomeId" class="research-outcome-item">
                                                                <span class="ach-title">{{ outcome.title || '无标题' }}</span>
                                                                <span v-if="outcome.type" class="ach-sep">·</span>
                                                                <span v-if="outcome.type" class="ach-type">{{ outcome.type }}</span>
                                                                <span v-if="outcome.journal" class="ach-sep">|</span>
                                                                <span v-if="outcome.journal" class="ach-journal">{{ outcome.journal }}</span>
                                                                <span v-if="outcome.patentNumber" class="ach-sep">|</span>
                                                                <span v-if="outcome.patentNumber" class="ach-patent">专利号:{{ outcome.patentNumber }}</span>
                                                                <span v-if="outcome.publishDate" class="ach-sep">|</span>
                                                                <span v-if="outcome.publishDate" class="ach-year">{{ outcome.publishDate.slice(0, 4) }}</span>
                                                            </div>
                                                            <div v-if="researcher.researchOutcomes.length > 3" class="ach-more-tip">
                                                                更多成果请
                                                                <router-link :to="`/profile/${researcher.id}`" class="to-profile-link">前往个人主页</router-link>
                                                                查看
                                                            </div>
                                                        </template>
                                                        <template v-else>
                                                            暂无
                                                        </template>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 分页 -->
                            <div class="pagination-container">
                                <el-pagination
                                    v-model:current-page="currentPage"
                                    :page-size="pageSize"
                                    :total="total"
                                    layout="prev, pager, next, jumper, total"
                                    class="pagination"
                                    @current-change="handlePageChange"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 发送私信对话框 -->
    <el-dialog
        v-model="messageDialogVisible"
        title=""
        width="500px"
        @close="closeMessageDialog"
    >
        <div class="message-dialog">
            <div class="recipient-info">
                <div class="recipient-avatar" :style="{ backgroundColor: !selectedResearcher?.avatar ? getRandomColor(selectedResearcher?.id || 1) : '' }">
                    <template v-if="selectedResearcher?.avatar">
                        <img :src="selectedResearcher.avatar" alt="avatar" class="avatar-img" />
                    </template>
                    <template v-else>
                        {{ selectedResearcher?.name ? selectedResearcher.name.charAt(0) : 'U' }}
                    </template>
                </div>
                <div>
                    <div class="recipient-name">{{ selectedResearcher?.name || '未知用户' }}</div>
                    <div class="recipient-org">{{ selectedResearcher?.institution || '未知机构' }}</div>
                </div>
            </div>
            
            <el-form>
                <el-form-item label="消息内容" required>
                    <el-input
                        v-model="messageContent"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入您要发送的消息内容..."
                        maxlength="500"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <el-button @click="closeMessageDialog">取消</el-button>
            <el-button type="primary" @click="sendPrivateMessage" :disabled="!messageContent.trim()">
                发送
            </el-button>
        </template>
    </el-dialog>

</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { Refresh, Search, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { search_researchers } from '@/api/profile'
import { followUser, unfollowUser, getFollowedUsers } from '@/api/follow'
import store from '@/store'

export default {
    name: "researcher-search",
    components: {},
    setup() {
        
        // 搜索筛选条件
        const searchFilters = ref({
            userName: '',
            researchTitle: '',
            institution: '',
            field: ''
        })

        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(10)
        const total = ref(0)

        // 私信相关
        const messageDialogVisible = ref(false)
        const selectedResearcher = ref(null)
        const messageContent = ref('')

        // 科研人员数据
        const researchers = ref([])
        const loading = ref(false)

        // 当前用户ID（从store获取）
        const currentUserId = computed(() => store.getters.getData.id)

        // 当前用户已关注的用户id集合
        const followedUserIds = ref(new Set())

        // 获取当前用户关注的所有用户id（一次性拉取全部，假设最多1000）
        const fetchFollowedUserIds = async () => {
            if (!currentUserId.value) return;
            const res = await getFollowedUsers(currentUserId.value, 1, 1000)
            if (res && Array.isArray(res.records)) {
                followedUserIds.value = new Set(res.records.map(u => u.userId))
            } else {
                followedUserIds.value = new Set()
            }
        }

        // 获取科研人员数据
        const fetchResearchers = async () => {
            loading.value = true
            try {
                const searchData = {
                    userName: searchFilters.value.userName || undefined,
                    researchTitle: searchFilters.value.researchTitle || undefined,
                    institution: searchFilters.value.institution || undefined,
                    field: searchFilters.value.field || undefined,
                    current: currentPage.value,
                    pageSize: pageSize.value
                }
                Object.keys(searchData).forEach(key => {
                    if (searchData[key] === undefined) {
                        delete searchData[key]
                    }
                })
                const result = await search_researchers(searchData)
                if (result) {
                    // 标记isFollowing
                    researchers.value = result.list.map(user => ({
                        ...user,
                        isFollowing: followedUserIds.value.has(user.id)
                    }))
                    total.value = result.total
                } else {
                    researchers.value = []
                    total.value = 0
                }
            } catch (error) {
                console.error('获取科研人员数据失败:', error)
                ElMessage.error('获取数据失败，请稍后重试')
                researchers.value = []
                total.value = 0
            } finally {
                loading.value = false
            }
        }

        // 搜索科研人员
        const searchResearchers = () => {
            currentPage.value = 1 // 重置到第一页
            fetchResearchers()
        }

        // 重置筛选条件
        const resetFilters = () => {
            searchFilters.value = {
                userName: '',
                researchTitle: '',
                institution: '',
                field: ''
            }
            currentPage.value = 1
            fetchResearchers()
        }

        // 关注/取消关注
        const toggleFollow = async (researcher) => {
            if (researcher.isFollowing) {
                const ok = await unfollowUser(researcher.id)
                if (ok) {
                    researcher.isFollowing = false
                    followedUserIds.value.delete(researcher.id)
                }
            } else {
                const ok = await followUser(researcher.id)
                if (ok) {
                    researcher.isFollowing = true
                    followedUserIds.value.add(researcher.id)
                }
            }
        }

        // 发送私信
        const sendMessage = (researcher) => {
            selectedResearcher.value = researcher
            messageDialogVisible.value = true
        }

        // 关闭私信对话框
        const closeMessageDialog = () => {
            messageDialogVisible.value = false
            selectedResearcher.value = null
            messageContent.value = ''
        }

        // 发送私信
        const sendPrivateMessage = () => {
            if (!messageContent.value.trim()) {
                ElMessage.warning('请输入消息内容')
                return
            }
            
            // 这里应该调用API发送私信
            ElMessage.success(`私信已发送给 ${selectedResearcher.value.name}`)
            closeMessageDialog()
        }

        // 分页处理
        const handlePageChange = (page) => {
            currentPage.value = page
            fetchResearchers()
        }

        // 生成随机颜色
        const getRandomColor = (id) => {
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
                '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
            ]
            return colors[id % colors.length]
        }

        // 监听关注列表变化，或搜索条件变化时重新拉取
        watch([followedUserIds, searchFilters], () => {
            fetchResearchers()
        }, { deep: true })

        // 组件挂载时拉取关注列表和科研人员
        onMounted(async () => {
            await fetchFollowedUserIds()
            await fetchResearchers()
        })

        return {
            searchFilters,
            currentPage,
            pageSize,
            total,
            messageDialogVisible,
            selectedResearcher,
            messageContent,
            researchers,
            loading,
            searchResearchers,
            resetFilters,
            toggleFollow,
            sendMessage,
            closeMessageDialog,
            sendPrivateMessage,
            handlePageChange,
            getRandomColor,
            currentUserId,
            followedUserIds
        }
    }
}
</script>

<style scoped>
.bg-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: url('@/asset/home/homehead.png');
    background-size: cover;
    z-index: -1;
}

.researcher-search-container {
    width: 1300px;
    /* background: rgba(255, 255, 255, 0.95); */
    padding: 20px;
    box-sizing: border-box;
    margin-top: 80px;
}

.search-content {
    width: 100%;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e0e0;
}

.page-header h2 {
    font-family: 'Meiryo', sans-serif;
    font-size: 28px;
    color: #2c5aa0;
    margin: 0;
}

.result-count {
    font-size: 16px;
    color: #666;
}

.main-content {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.search-sidebar {
    width: 350px;
    flex-shrink: 0;
    position: sticky;
    top: 80px;
    z-index: 10;
}

.search-title-image {
    width: 100%;
    margin-bottom: 10px;
}

.title-image {
    width: 100%;
    height: auto;
    display: block;
}

.search-card {
    background: white;
    border: 1px solid #e0e0e0;
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.card-header h3 {
    font-family: 'Meiryo', sans-serif;
    font-size: 18px;
    color: #2c5aa0;
    margin: 0;
}

.card-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-label {
    font-weight: 600;
    color: #333;
    font-size: 14px;
    text-align: left;
}

.results-content {
    flex: 1;
}



.results-list {
    background: white;
    border: 1px solid #e0e0e0;
    padding: 20px;
    min-height: 600px; /* 确保与左边图片+卡片高度匹配 */
    display: flex;
    flex-direction: column;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #409eff;
}

.loading-icon {
    font-size: 48px;
    margin-bottom: 16px;
    animation: spin 1s linear infinite;
}

.loading-text {
    font-size: 16px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #999;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-text {
    font-size: 18px;
    margin-bottom: 8px;
}

.empty-desc {
    font-size: 14px;
}

.loading-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
}

.loading-icon {
    font-size: 48px;
    margin-bottom: 16px;
    animation: rotate 1s linear infinite;
}

.loading-text {
    font-size: 18px;
    margin-bottom: 8px;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.researcher-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.researcher-item {
    border: 1px solid #e8e8e8;
    padding: 12px 15px;
    transition: all 0.2s cubic-bezier(.4,0,.2,1);
    position: relative;
    background: #fff;
    border-radius: 12px;
}

.researcher-item:hover {
    box-shadow: 0 8px 24px rgba(44,90,160,0.13), 0 1.5px 6px rgba(44,90,160,0.10);
    border-color: #22529a55;
    background: #fdfeff;
    z-index: 2;
}

.researcher-content {
    display: flex;
    align-items: flex-start;
}

.avatar-section {
    margin-right: 15px;
}

.researcher-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    font-weight: 600;
    border: 2px solid #e0e0e0;
}

.basic-info {
    flex: 1;
    margin-right: 15px;
}

.name-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.name-title-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.researcher-name {
    font-size: 18px;
    font-weight: 600;
    color: #2c5aa0;
}

.researcher-title {
    background: #f0f4ff;
    color: #2c5aa0;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
}

.organization {
    color: #666;
    margin-bottom: 8px;
    font-size: 14px;
    text-align: left;
}

.research-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.field-tag {
    background: #e8f4fd;
    color: #1890ff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
}

.more-fields {
    background: #f5f5f5;
    color: #999;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
}

.profile-text {
    margin-top: 8px;
    color: #666;
    font-size: 14px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
}

.info-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    margin-left: 15px;
}

.info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.researcher-name {
    font-size: 18px;
    font-weight: 600;
    color: #2c5aa0;
}

.researcher-field {
    background: #e8f4fd;
    color: #1890ff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 13px;
    margin-left: 8px;
}

.info-footer {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 30px;
}

.info-row {
    display: flex;
    align-items: top;
    font-size: 14px;
    color: #444;
    min-width: 180px;
    margin-top: 2px;
}

.info-label {
    color: #888;
    font-weight: 500;
    margin-right: 4px;
    min-width: 70px;
    text-align: right;
    line-height: 22px;
}

.info-content{
    display: inline-flex;
    align-items: center;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.card-action-buttons {
    position: absolute;
    right: 20px;
    top: 18px;
    z-index: 2;
    gap: 10px;
}

.pagination-container {
    margin-top: 20px;
    margin-bottom: 0;
    display: flex;
    justify-content: flex-end;
}

.pagination {
    display: flex;
}

/* 私信对话框样式 */
.message-dialog {
    padding: 20px 0;
}

.recipient-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.recipient-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    font-weight: 600;
}

.recipient-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    text-align: left;
}

.recipient-org {
    font-size: 14px;
    color: #666;
    text-align: left;
}

.ach-title {
    font-size: 14px;
    font-weight: 600;
    color: #2c5aa0;
}

.ach-sep {
    margin: 0 4px;
}

.ach-type, .ach-journal, .ach-patent, .ach-year {
    background: #f5f7fa;
    color: #1890ff;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 12px;
    margin-right: 2px;
}

.ach-more-tip {
    font-size: 14px;
    color: #999;
    text-align: center;
    margin-top: 5px;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
}

.research-outcomes-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
}

.research-outcome-item {
    font-size: 13px;
    margin-bottom: 0;
    line-height: 20px;
    text-align: left;
}

.to-profile-link {
    color: #2c5aa0;
    margin-left: 3px;
    margin-right: 3px;
    text-decoration: underline;
    cursor: pointer;
}
</style> 