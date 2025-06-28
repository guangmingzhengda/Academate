<template>
    <div class="report-manager">
        <div class="section-card">
            <!-- 报告列表视图 -->
            <div v-if="currentView === 'list'" class="reports-view">
                <div class="card-header">
                    <h3>技术趋势报告</h3>
                    <div class="header-actions">
                        <el-button type="primary" @click="refreshReports">
                            <el-icon><Refresh /></el-icon>
                            刷新
                        </el-button>
                    </div>
                </div>
                
                <div class="card-content">
                    <div v-if="reports.length === 0" class="empty-state">
                        暂无技术趋势报告，系统将定期为您生成最新的技术趋势分析
                    </div>
                    
                    <div v-else class="reports-list">
                        <div 
                            v-for="report in currentPageReports" 
                            :key="report.id" 
                            class="report-item"
                            @click="viewReport(report)"
                        >
                            <div class="report-info">
                                <div class="report-title">{{ report.title }}</div>
                                <div class="report-date">{{ formatDate(report.date) }}</div>
                            </div>
                            <div class="report-actions">
                                <el-button type="primary" plain size="small">
                                    查看详情
                                </el-button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 报告分页 -->
                    <el-pagination
                        v-if="reports.length > pageSize"
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="reports.length"
                        layout="prev, pager, next"
                        class="pagination"
                        small
                        @current-change="handlePageChange"
                    />
                </div>
            </div>

            <!-- 报告详情视图 -->
            <div v-else class="report-detail-view">
                <div class="card-header">
                    <div class="header-left">
                        <el-button type="text" @click="backToList" class="back-button">
                            <el-icon><ArrowLeft /></el-icon>
                            返回报告列表
                        </el-button>
                        <h3>{{ currentReport.title }}</h3>
                    </div>
                    <div class="report-meta">
                        <span class="report-date">{{ formatDate(currentReport.date) }}</span>
                    </div>
                </div>
                
                <div class="card-content">
                    <div class="report-content">
                        <div class="markdown-content" v-html="renderedContent"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { Refresh, ArrowLeft } from '@element-plus/icons-vue'
import { callInfo } from '@/call'
import MarkdownIt from 'markdown-it'
import reportsData from './data.json'

export default {
    name: 'reportManager',
    setup() {
        // 视图状态
        const currentView = ref('list') // 'list' 或 'detail'
        const currentReport = ref({})
        
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(10)
        
        // 报告数据（从JSON文件导入）
        const reports = ref(reportsData)
        
        // Markdown渲染器
        const md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true
        })
        
        // 计算属性
        const currentPageReports = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return reports.value.slice(start, end)
        })
        
        const renderedContent = computed(() => {
            if (!currentReport.value.content) return ''
            return md.render(currentReport.value.content)
        })
        
        // 方法
        const refreshReports = () => {
            callInfo('报告列表已刷新')
        }
        
        const viewReport = (report) => {
            currentReport.value = report
            currentView.value = 'detail'
        }
        
        const backToList = () => {
            currentView.value = 'list'
            currentReport.value = {}
        }
        
        const handlePageChange = (page) => {
            currentPage.value = page
        }
        
        const formatDate = (dateString) => {
            const date = new Date(dateString)
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }
        
        return {
            currentView,
            currentReport,
            currentPage,
            pageSize,
            reports,
            currentPageReports,
            renderedContent,
            refreshReports,
            viewReport,
            backToList,
            handlePageChange,
            formatDate
        }
    }
}
</script>

<style scoped>
.report-manager {
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

.header-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

.back-button {
    font-family: 'Meiryo', sans-serif;
    color: #409eff;
    padding: 8px 12px;
}

.back-button:hover {
    background-color: rgba(64, 158, 255, 0.1);
}

.card-header h3 {
    font-family: 'Meiryo', sans-serif;
    font-size: 20px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.report-meta {
    display: flex;
    align-items: center;
    gap: 15px;
}

.report-date {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #666;
    text-align: left;
}

.empty-state {
    text-align: center;
    color: #999;
    padding: 40px;
    font-size: 14px;
}

/* 报告列表样式 */
.reports-list {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.report-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    cursor: pointer;
    transition: all 0.3s ease;
}

.report-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.report-info {
    flex: 1;
    margin-right: 20px;
}

.report-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 6px;
    text-align: left;
    line-height: 1.3;
}

.report-actions {
    display: flex;
    align-items: center;
}

/* 报告详情样式 */
.report-content {
    background-color: #fff;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-content {
    font-family: 'Meiryo', sans-serif;
    line-height: 1.6;
    color: #2c3e50;
    text-align: left;
}

.markdown-content h1 {
    font-size: 28px;
    font-weight: bold;
    color: #1a202c;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e2e8f0;
    text-align: center;
}

.markdown-content h2 {
    font-size: 24px;
    font-weight: bold;
    color: #2d3748;
    margin-top: 30px;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
}

.markdown-content h3 {
    font-size: 20px;
    font-weight: bold;
    color: #4a5568;
    margin-top: 25px;
    margin-bottom: 12px;
}

.markdown-content h4 {
    font-size: 18px;
    font-weight: bold;
    color: #4a5568;
    margin-top: 20px;
    margin-bottom: 10px;
}

.markdown-content p {
    margin-bottom: 15px;
    text-align: justify;
}

.markdown-content ul, .markdown-content ol {
    margin-bottom: 15px;
    padding-left: 20px;
}

.markdown-content li {
    margin-bottom: 8px;
}

.markdown-content strong {
    font-weight: bold;
    color: #2d3748;
}

.markdown-content em {
    font-style: italic;
    color: #4a5568;
}

.markdown-content blockquote {
    border-left: 4px solid #409eff;
    padding-left: 15px;
    margin: 20px 0;
    color: #666;
    font-style: italic;
}

.markdown-content code {
    background-color: #f7fafc;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #e53e3e;
}

.markdown-content pre {
    background-color: #f7fafc;
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 15px 0;
    border: 1px solid #e2e8f0;
}

.markdown-content pre code {
    background-color: transparent;
    padding: 0;
    color: #2d3748;
}

.markdown-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

.markdown-content th,
.markdown-content td {
    border: 1px solid #e2e8f0;
    padding: 12px;
    text-align: left;
}

.markdown-content th {
    background-color: #f7fafc;
    font-weight: bold;
    color: #2d3748;
}

.markdown-content hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 30px 0;
}

/* 分页样式 */
.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .report-item {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
    
    .report-actions {
        width: 100%;
        justify-content: flex-start;
    }
    
    .card-header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
    
    .header-actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style> 