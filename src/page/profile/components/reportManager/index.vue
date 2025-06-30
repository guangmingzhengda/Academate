<template>
    <div class="report-manager">
        <div class="section-card">
            <!-- 首页：展示所有订阅关键词及其信息 -->
            <div v-if="currentView === 'list'" class="subscriptions-view">
                <div class="card-header">
                    <h3>技术趋势报告</h3>
                    <el-button type="success" @click="openSubscriptionModal">
                        <el-icon><Setting /></el-icon>
                        管理研究领域订阅
                    </el-button>
                </div>
                <div class="card-content">
                    <div v-if="loadingSubscriptions" class="empty-state">加载中...</div>
                    <div v-else-if="subscriptions.length === 0" class="empty-state">暂无订阅，请先添加研究领域</div>
                    <div v-else class="subscriptions-list-cards">
                        <div class="subscriptions-title">关注的研究领域：</div>
                        <el-row :gutter="24">
                            <el-col v-for="sub in subscriptions" :key="sub.subscriptionId" :span="8" style="margin-bottom: 24px;">
                                <el-card class="subscription-card" shadow="hover" @click.native="enterReportList(sub)">
                                    <div class="sub-topic">{{ sub.paperTopic }}</div>
                                    <div class="sub-meta">
                                        <span>推送周期：{{ sub.subscriptionCycle }}周</span>
                                        <span>订阅时间：{{ formatDate(sub.createdAt) }}</span>
                                        <span>下次推送：{{ formatDate(sub.nextGenerateTime) }}</span>
                                    </div>
                                    <el-button type="primary" size="small" style="margin-top: 12px;" @click.stop="enterReportList(sub)">查看报告</el-button>
                                </el-card>
                            </el-col>
                        </el-row>
                    </div>
                </div>
            </div>
            <!-- 关键词报告列表页 -->
            <div v-else-if="currentView === 'reportList'" class="reports-view">
                <div class="card-header">
                    <el-button type="text" @click="backToSubList" class="back-button">
                        <el-icon><ArrowLeft /></el-icon>
                        返回研究领域列表
                    </el-button>
                </div>
                <div class="card-content">
                    <h3>{{ currentSub.paperTopic }}</h3>
                    <div v-if="loadingReports" class="empty-state">报告加载中...</div>
                    <div v-else-if="reports.length === 0" class="empty-state">暂无技术趋势报告</div>
                    <div v-else class="reports-list">
                        <div v-for="(report, idx) in reports" :key="report.id" class="report-item" @click="viewReport(report, idx)">
                            <div class="report-info">
                                <div class="report-title">第{{ total - ((currentPage - 1) * pageSize + idx) }}期</div>
                                <div class="report-date">生成日期：{{ formatDate(report.genDate) }}</div>
                            </div>
                            <div class="report-actions">
                                <el-button type="primary" plain size="small">查看详情</el-button>
                            </div>
                        </div>
                    </div>
                    <div class="pagination">
                        <el-pagination
                            v-model:current-page="currentPage"
                            v-model:page-size="pageSize"
                            :total="total"
                            @current-change="handlePageChange"
                            @size-change="handleSizeChange"
                            :page-sizes="[10, 20, 50, 100]"
                            layout="total, sizes, prev, pager, next"
                        ></el-pagination>
                    </div>
                </div>
            </div>
            <!-- 详情页 -->
            <div v-else class="report-detail-view">
                <div class="card-header">
                    <div class="header-left">
                        <el-button type="text" @click="backToReportList" class="back-button">
                            <el-icon><ArrowLeft /></el-icon>
                            返回报告列表
                        </el-button>
                        <h3 style="text-align: left;">{{ currentSub.paperTopic ? currentSub.paperTopic + '-' : '' }}第{{ total - ((currentPage - 1) * pageSize + currentReportIndex) }}期</h3>
                    </div>
                    <div class="report-meta">
                        <span class="report-date">{{ formatDate(currentReport.genDate) }}</span>
                    </div>
                </div>
                <div class="card-content">
                    <div class="report-content">
                        <div class="markdown-content" v-html="renderedMarkdown"></div>
                        <template v-if="currentReport.mindmap">
                            <h3 style="margin-top:32px;">思维导图</h3>
                            <div style="text-align:right;">
                                <span style="font-size: 13px; color: #888;">点击图片可查看大图预览</span>
                            </div>
                            <div ref="mindmapContainer" style="display: flex; justify-content: center; align-items: center; cursor: pointer;" @click="showBigMermaid('mindmap')"></div>
                        </template>
                        <template v-if="currentReport.trendGraph">
                            <h3 style="margin-top:32px;">技术趋势图</h3>
                            <div style="text-align:right;">
                                <span style="font-size: 13px; color: #888;">点击图片可查看大图预览</span>
                            </div>
                            <div ref="trendGraphContainer" style="display: flex; justify-content: center; align-items: center; cursor: pointer;" @click="showBigMermaid('trendGraph')"></div>
                        </template>
                        <template v-if="currentReport.wordCloud">
                            <h3 style="margin-top:32px;">词云图</h3>
                            <div ref="wordCloudContainer" style="width:100%;height:400px; display: flex; justify-content: center; align-items: center;"></div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <!-- 订阅管理Modal -->
        <el-dialog v-model="showSubscriptionModal" title="我的研究领域订阅" width="700px" :close-on-click-modal="false">
            <div v-loading="loadingSubscriptions">
                <el-table :data="subscriptions" class="subscription-table" border @selection-change="val=>selectedToCancel=val.map(i=>i.paperTopic)" row-class-name="big-table-row">
                    <el-table-column type="selection" width="40" />
                    <el-table-column prop="paperTopic" label="研究领域" min-width="160" />
                    <el-table-column prop="subscriptionCycle" label="推送周期(周)" min-width="100" />
                    <el-table-column prop="createdAt" label="订阅时间" min-width="160">
                        <template #default="scope">
                            {{ formatDate(scope.row.createdAt) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="nextGenerateTime" label="下次推送时间" min-width="160">
                        <template #default="scope">
                            {{ formatDate(scope.row.nextGenerateTime) }}
                        </template>
                    </el-table-column>
                </el-table>
                <div class="subscription-input-row">
                    <div class="subscription-input-group">
                        <span class="subscription-label">研究领域</span>
                        <el-input v-model="newTopic" placeholder="输入您关注的新研究领域" clearable maxlength="30" show-word-limit style="width:350px;" />
                    </div>
                    <div class="subscription-input-group">
                        <span class="subscription-label">推送周期</span>
                        <el-select v-model="newCycle" placeholder="选择推送周期">
                            <el-option label="周报" :value="1" />
                            <el-option label="双周报" :value="2" />
                            <el-option label="月报" :value="4" />
                            <el-option label="季报" :value="13" />
                            <el-option label="年报" :value="52" />
                        </el-select>
                    </div>
                </div>
                <div class="subscription-btn-row">
                    <el-button type="primary" :loading="addLoading" @click="handleAddSubscription">新增订阅</el-button>
                    <el-button type="danger" :loading="cancelLoading" @click="handleCancelSubscriptions" :disabled="!selectedToCancel.length">批量取消订阅</el-button>
                </div>
            </div>
        </el-dialog>
        <!-- 大图弹窗 -->
        <el-dialog v-model="showBigImageModal" width="95vw" top="2vh" :close-on-click-modal="true" title="大图预览">
            <div v-html="bigImageSvg" style="text-align:center;"></div>
        </el-dialog>
    </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ArrowLeft, Setting } from '@element-plus/icons-vue'
import { callSuccess, callError } from '@/call'
import MarkdownIt from 'markdown-it'
import * as trendApi from '@/api/trend'
import { useStore } from 'vuex'
import mermaid from 'mermaid'
import * as echarts from 'echarts'
import 'echarts-wordcloud'

export default {
    name: 'reportManager',
    setup() {
        // vuex
        const store = useStore()
        const userId = computed(() => store.getters.getId)

        // 订阅管理modal
        const showSubscriptionModal = ref(false)
        const subscriptions = ref([])
        const loadingSubscriptions = ref(false)
        const selectedToCancel = ref([])
        const newTopic = ref('')
        const newCycle = ref(1)
        const addLoading = ref(false)
        const cancelLoading = ref(false)

        // 首页/报告列表/详情页状态
        const currentView = ref('list') // 'list' | 'reportList' | 'detail'
        const currentSub = ref({}) // 当前选中的订阅
        const reports = ref([])
        const loadingReports = ref(false)
        const currentReport = ref({})
        const currentReportIndex = ref(0)
        const mindmapContainer = ref(null)
        const trendGraphContainer = ref(null)
        const wordCloudContainer = ref(null)
        // 大图弹窗相关
        const showBigImageModal = ref(false)
        const bigImageSvg = ref('')

        // 分页相关状态
        const currentPage = ref(1)
        const pageSize = ref(10)
        const total = ref(0)

        // Markdown渲染器
        const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
        const renderedMarkdown = computed(() => currentReport.value.text ? md.render(currentReport.value.text) : '')

        // 获取订阅列表
        const fetchSubscriptions = async () => {
            if (!userId.value) return
            loadingSubscriptions.value = true
            try {
                const res = await trendApi.getUserTrendSubscriptions(userId.value)
                if (res && res.code === 0) {
                    subscriptions.value = res.data || []
                } else {
                    subscriptions.value = []
                }
            } finally {
                loadingSubscriptions.value = false
            }
        }

        // 订阅管理相关
        const handleAddSubscription = async () => {
            if (!newTopic.value.trim()) {
                callError('请输入订阅研究领域')
                return
            }
            addLoading.value = true
            try {
                const req = [{ userId: userId.value, paperTopic: newTopic.value.trim(), subscriptionCycle: newCycle.value }]
                const res = await trendApi.subscribeTrendTopic(userId.value, req)
                if (res && res.code === 0) {
                    callSuccess('订阅成功')
                    newTopic.value = ''
                    newCycle.value = 1
                    await fetchSubscriptions()
                } else {
                    callError(res?.message || '订阅失败')
                }
            } finally {
                addLoading.value = false
            }
        }
        const handleCancelSubscriptions = async () => {
            if (!selectedToCancel.value.length) {
                callError('请选择要取消订阅的研究领域')
                return
            }
            cancelLoading.value = true
            try {
                const topics = selectedToCancel.value
                const res = await trendApi.cancelTrendSubscription(userId.value, topics)
                if (res && res.code === 0) {
                    callSuccess('取消订阅成功')
                    selectedToCancel.value = []
                    await fetchSubscriptions()
                } else {
                    callError(res?.message || '取消失败')
                }
            } finally {
                cancelLoading.value = false
            }
        }
        const openSubscriptionModal = async () => {
            showSubscriptionModal.value = true
            await fetchSubscriptions()
        }

        // 进入某个订阅的报告列表
        const enterReportList = async (sub) => {
            currentSub.value = sub
            currentView.value = 'reportList'
            reports.value = []
            currentPage.value = 1 // 重置页码
            await fetchReports()
        }
        
        // 获取报告列表
        const fetchReports = async () => {
            if (!userId.value || !currentSub.value.subscriptionId) return
            loadingReports.value = true
            try {
                const res = await trendApi.getTechReportList({
                    userId: userId.value,
                    subscriptionId: currentSub.value.subscriptionId,
                    pageNum: currentPage.value,
                    pageSize: pageSize.value
                })
                console.log("ressssssss", res)
                if (res && res.code === 0) {
                    reports.value = res.data.list || []
                    total.value = res.data.total || 0
                } else {
                    reports.value = []
                    total.value = 0
                }
            } finally {
                loadingReports.value = false
            }
        }
        
        // 处理分页变化
        const handlePageChange = (page) => {
            currentPage.value = page
            fetchReports()
        }
        
        // 处理每页条数变化
        const handleSizeChange = (size) => {
            pageSize.value = size
            currentPage.value = 1 // 重置到第一页
            fetchReports()
        }

        // 返回订阅列表
        const backToSubList = () => {
            currentView.value = 'list'
            currentSub.value = {}
            reports.value = []
            currentPage.value = 1
            total.value = 0
        }
        // 查看报告详情
        const viewReport = (report, idx) => {
            currentReport.value = report
            currentReportIndex.value = idx
            currentView.value = 'detail'
            nextTick(() => {
                renderMermaid()
                renderWordCloud()
            })
        }
        // 返回报告列表
        const backToReportList = () => {
            currentView.value = 'reportList'
            currentReport.value = {}
        }
        // 日期格式化
        const formatDate = (dateString) => {
            if (!dateString) return ''
            const date = new Date(dateString)
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
        }
        // mermaid渲染
        const renderMermaid = () => {
            // 渲染思维导图
            if (currentReport.value.mindmap && mindmapContainer.value) {
                try {
                    mindmapContainer.value.innerHTML = `${currentReport.value.mindmap}`
                    mermaid.init(undefined, mindmapContainer.value)
                } catch (e) {
                    mindmapContainer.value.innerHTML = '<div style="color:red;">思维导图渲染失败</div>'
                }
            }
            // 渲染技术趋势图
            if (currentReport.value.trendGraph && trendGraphContainer.value) {
                try {
                    trendGraphContainer.value.innerHTML = `${currentReport.value.trendGraph}`
                    mermaid.init(undefined, trendGraphContainer.value)
                } catch (e) {
                    trendGraphContainer.value.innerHTML = '<div style="color:red;">技术趋势图渲染失败</div>'
                }
            }
        }
        // 词云渲染
        const renderWordCloud = () => {
            if (currentReport.value.wordCloud && wordCloudContainer.value) {
                let data = []
                try {
                    // 解析后端返回的 JSON 字符串
                    const arr = JSON.parse(currentReport.value.wordCloud)
                    // 将每项的 text 字段映射为 name
                    data = arr.map(item => ({
                        name: item.text,
                        value: item.value
                    }))
                } catch {}
                if (data.length) {
                    const chart = echarts.init(wordCloudContainer.value)
                    chart.setOption({
                        series: [{
                            type: 'wordCloud',
                            shape: 'circle',
                            left: 'center',
                            top: 'center',
                            width: '100%',
                            height: '100%',
                            sizeRange: [18, 60],
                            rotationRange: [-90, 90],
                            gridSize: 8,
                            drawOutOfBound: false,
                            textStyle: {
                                fontFamily: 'Meiryo,sans-serif',
                                color: () => `hsl(${Math.random()*360}, 70%, 50%)`
                            },
                            data
                        }]
                    })
                }
            }
        }
        // 显示大图方法
        const showBigMermaid = (type) => {
            let svg = ''
            if (type === 'mindmap' && mindmapContainer.value) {
                svg = mindmapContainer.value.innerHTML
            } else if (type === 'trendGraph' && trendGraphContainer.value) {
                svg = trendGraphContainer.value.innerHTML
            }
            if (svg) {
                bigImageSvg.value = svg.replace('<svg ', '<svg style="width:90vw;height:auto;max-height:80vh;" ')
                showBigImageModal.value = true
            }
        }
        // 首次加载订阅
        onMounted(() => {
            fetchSubscriptions()
        })
        return {
            // 首页/报告列表/详情
            currentView, currentSub, reports, loadingReports, currentReport, currentReportIndex,
            // 订阅管理
            showSubscriptionModal, loadingSubscriptions, subscriptions, selectedToCancel, newTopic, newCycle, addLoading, cancelLoading,
            openSubscriptionModal, handleAddSubscription, handleCancelSubscriptions,
            // 详情页渲染
            renderedMarkdown, mindmapContainer, trendGraphContainer, wordCloudContainer,
            // 分页相关
            currentPage, pageSize, total,
            // 方法
            enterReportList, backToSubList, viewReport, backToReportList, formatDate,
            // 大图弹窗
            showBigImageModal, bigImageSvg, showBigMermaid
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
    min-width: 100px;
    margin-left: 15px;
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
    justify-content: center;
    padding: 20px 0;
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

.subscription-table {
    width: 100%;
    margin-bottom: 20px;
    font-size: 14px;
}
.subscription-input-row {
    display: flex;
    align-items: center;
    gap: 24px;
    margin: 24px 0 0 0;
}
.subscription-input-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}
.subscription-label {
    min-width: 60px;
}
.subscription-btn-row {
    margin-top: 24px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}
.big-table-row td {
    font-size: 18px !important;
}
.subscriptions-list-cards {
    padding: 12px 0;
}
.subscription-card {
    border-radius: 10px;
    transition: box-shadow 0.2s, border-color 0.2s;
    cursor: pointer;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.subscription-card:hover {
    box-shadow: 0 4px 16px rgba(64,158,255,0.18);
    border-color: #409eff;
}
.sub-topic {
    font-size: 18px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
}
.sub-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
}
.subscriptions-title {
    font-size: 18px;
    font-weight: bold;
    color: #222;
    margin-bottom: 18px;
    margin-left: 2px;
}
</style> 