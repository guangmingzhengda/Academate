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
                                    <label class="filter-label">关键词</label>
                                    <el-input
                                        v-model="searchFilters.keyword"
                                        placeholder="请输入姓名或关键词"
                                        clearable
                                        @input="filterResearchers"
                                    />
                                </div>

                                <!-- 成果题目 -->
                                <div class="filter-item">
                                    <label class="filter-label">成果题目</label>
                                    <el-input
                                        v-model="searchFilters.achievementTitle"
                                        placeholder="请输入成果题目关键词"
                                        clearable
                                        @input="filterResearchers"
                                    />
                                </div>

                                <!-- 机构名称 -->
                                <div class="filter-item">
                                    <label class="filter-label">所在机构</label>
                                    <el-select
                                        v-model="searchFilters.organization"
                                        placeholder="选择或输入机构名称"
                                        filterable
                                        allow-create
                                        clearable
                                        @change="filterResearchers"
                                    >
                                        <el-option
                                            v-for="org in organizations"
                                            :key="org"
                                            :label="org"
                                            :value="org"
                                        />
                                    </el-select>
                                </div>

                                <!-- 研究领域 -->
                                <div class="filter-item">
                                    <label class="filter-label">研究领域</label>
                                    <el-select
                                        v-model="searchFilters.researchField"
                                        placeholder="选择研究领域"
                                        clearable
                                        @change="filterResearchers"
                                    >
                                        <el-option
                                            v-for="field in researchFields"
                                            :key="field"
                                            :label="field"
                                            :value="field"
                                        />
                                    </el-select>
                                </div>


                            </div>
                        </div>
                    </div>

                    <!-- 右侧搜索结果 -->
                    <div class="results-content">
                        <div class="results-list">
                            <div v-if="loading" class="loading-state">
                                <el-icon class="loading-icon"><Loading /></el-icon>
                                <div class="loading-text">正在搜索中...</div>
                            </div>
                            
                            <div v-else-if="currentPageResearchers.length === 0" class="empty-state">
                                <el-icon class="empty-icon"><Search /></el-icon>
                                <div class="empty-text">暂无符合条件的科研人员</div>
                                <div class="empty-desc">请尝试调整搜索条件</div>
                            </div>
                            
                            <div v-else class="researcher-list">
                                <div 
                                    v-for="researcher in currentPageResearchers" 
                                    :key="researcher.id" 
                                    class="researcher-item"
                                >
                                    <div class="researcher-info">
                                        <div class="researcher-content">
                                            <div class="avatar-section">
                                                <div class="researcher-avatar" :style="{ backgroundColor: getRandomColor(researcher.id) }">
                                                    {{ researcher.name.charAt(0) }}
                                                </div>
                                            </div>
                                            <div class="basic-info">
                                                <div class="name-title-row">
                                                    <div class="name-title-section">
                                                        <div class="researcher-name">{{ researcher.name }}</div>
                                                        <div class="researcher-title">{{ researcher.title }}</div>
                                                    </div>
                                                    <div class="action-buttons">
                                                        <el-button 
                                                            :type="researcher.isFollowing ? 'info' : 'primary'"
                                                            size="small"
                                                            @click="toggleFollow(researcher)"
                                                        >
                                                            {{ researcher.isFollowing ? '已关注' : '关注' }}
                                                        </el-button>
                                                        <el-button 
                                                            type="default" 
                                                            size="small"
                                                            @click="sendMessage(researcher)"
                                                        >
                                                            私信
                                                        </el-button>
                                                    </div>
                                                </div>
                                                <div class="organization">{{ researcher.email }}</div>
                                                <div class="research-fields">
                                                    <span 
                                                        v-for="field in researcher.researchFields.slice(0, 3)" 
                                                        :key="field" 
                                                        class="field-tag"
                                                    >
                                                        {{ field }}
                                                    </span>
                                                    <span v-if="researcher.researchFields.length > 3" class="more-fields">
                                                        +{{ researcher.researchFields.length - 3 }}
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
                                    v-if="totalCount > pageSize"
                                    v-model:current-page="currentPage"
                                    :page-size="pageSize"
                                    :total="totalCount"
                                    layout="prev, pager, next, jumper"
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
                <div class="recipient-avatar" :style="{ backgroundColor: getRandomColor(selectedResearcher?.id || 1) }">
                    {{ selectedResearcher?.name?.charAt(0) || '' }}
                </div>
                <div>
                    <div class="recipient-name">{{ selectedResearcher?.name }}</div>
                    <div class="recipient-org">{{ selectedResearcher?.email }}</div>
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
import { ref, computed, onMounted } from 'vue'
import { Refresh, Search, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { searchResearchers, UserSearchRequest, PageResultUserDetailVO, UserDetailVO } from '@/api/search'

export default {
    name: "researcher-search",
    components: {},
    setup() {
        
        // 搜索筛选条件
        const searchFilters = ref({
            keyword: '',
            achievementTitle: '',
            organization: '',
            researchField: ''
        })

        // 排序方式
        const sortBy = ref('default')
        
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(5)

        // 加载状态
        const loading = ref(false)

        // 搜索结果数据
        const searchResults = ref(null)

        // 私信相关
        const messageDialogVisible = ref(false)
        const selectedResearcher = ref(null)
        const messageContent = ref('')

        // 筛选选项数据
        const organizations = ref([
            '清华大学', '北京大学', '中科院', '复旦大学', '上海交大', 
            '浙江大学', '南京大学', '华中科技大学', '西安交大', '同济大学'
        ])

        const researchFields = ref([
            '人工智能', '机器学习', '深度学习', '计算机视觉', '自然语言处理',
            '数据挖掘', '云计算', '物联网', '区块链', '网络安全',
            '软件工程', '数据库', '分布式系统', '算法设计', '生物信息学'
        ])

        // 当前页的科研人员
        const currentPageResearchers = computed(() => {
            if (!searchResults.value || !searchResults.value.list) {
                return []
            }
            return searchResults.value.list
        })

        // 总数
        const totalCount = computed(() => {
            return searchResults.value?.total || 0
        })

        // 搜索科研人员（调用后端API）
        const performSearch = async () => {
            loading.value = true
            
            try {
                const searchParams = {
                    userName: searchFilters.value.keyword || '',
                    field: searchFilters.value.researchField || '',
                    researchTitle: searchFilters.value.achievementTitle || '',
                    institution: searchFilters.value.organization || '',
                    current: currentPage.value,
                    pageSize: pageSize.value
                }

                const result = await searchResearchers(searchParams)
                
                if (result) {
                    searchResults.value = result
                    // 转换数据格式以适配现有UI
                    if (result.list) {
                        result.list = result.list.map(user => ({
                            ...user,
                            name: user.account, // 使用account作为name
                            title: user.field || '研究员', // 使用field作为title
                            organization: user.institution || '',
                            email: user.email || '',
                            researchFields: user.field ? [user.field] : [],
                            isFollowing: false, // 默认未关注
                            recentAchievements: user.researchOutcomes || []
                        }))
                    }
                } else {
                    searchResults.value = {
                        pageNum: 1,
                        pageSize: pageSize.value,
                        total: 0,
                        list: []
                    }
                }
            } catch (error) {
                console.error('搜索失败:', error)
                ElMessage.error('搜索失败，请重试')
                searchResults.value = {
                    pageNum: 1,
                    pageSize: pageSize.value,
                    total: 0,
                    list: []
                }
            } finally {
                loading.value = false
            }
        }

        // 过滤科研人员（改为调用API）
        const filterResearchers = () => {
            currentPage.value = 1 // 重置到第一页
            performSearch()
        }

        // 排序科研人员
        const sortResearchers = () => {
            // 排序逻辑暂时保留本地排序，后续可以改为后端排序
            if (!searchResults.value || !searchResults.value.list) return
            
            let sorted = [...searchResults.value.list]

            switch (sortBy.value) {
                case 'papers':
                    sorted.sort((a, b) => (b.researchOutcomes?.length || 0) - (a.researchOutcomes?.length || 0))
                    break
                case 'followers':
                    // 暂时无法排序，因为API没有返回关注者数量
                    break
                case 'impact':
                    // 暂时无法排序，因为API没有返回影响因子
                    break
                default:
                    // 默认排序，保持原顺序
                    break
            }

            searchResults.value.list = sorted
        }

        // 重置筛选条件
        const resetFilters = () => {
            searchFilters.value = {
                keyword: '',
                achievementTitle: '',
                organization: '',
                researchField: ''
            }
            sortBy.value = 'default'
            currentPage.value = 1
            performSearch() // 重新搜索
        }

        // 关注/取消关注
        const toggleFollow = (researcher) => {
            researcher.isFollowing = !researcher.isFollowing
            if (researcher.isFollowing) {
                ElMessage.success(`已关注 ${researcher.name}`)
            } else {
                ElMessage.info(`已取消关注 ${researcher.name}`)
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
            performSearch()
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

        // 页面加载时执行初始搜索
        onMounted(() => {
            performSearch()
        })

        return {
            searchFilters,
            sortBy,
            currentPage,
            pageSize,
            loading,
            messageDialogVisible,
            selectedResearcher,
            messageContent,
            organizations,
            researchFields,
            currentPageResearchers,
            totalCount,
            filterResearchers,
            sortResearchers,
            resetFilters,
            toggleFollow,
            sendMessage,
            closeMessageDialog,
            sendPrivateMessage,
            handlePageChange,
            getRandomColor
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

.researcher-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.researcher-item {
    border: 1px solid #e8e8e8;
    padding: 12px 15px;
    transition: all 0.3s ease;
}

.researcher-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #2c5aa0;
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

.action-buttons {
    display: flex;
    gap: 8px;
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
</style> 