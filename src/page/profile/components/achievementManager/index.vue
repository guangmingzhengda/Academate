<template>
    <div class="achievement-manager">
        <div class="manager-card">
            <div class="card-header">
                <h3>学术成果</h3>
                <div class="header-actions">
                    <el-button v-if="isOwnProfile" type="warning" plain @click="openSelectDialog">
                        <el-icon><Search /></el-icon>
                        从库中选择
                    </el-button>
                    <el-button v-if="isOwnProfile" type="success" plain @click="openExcelUploadDialog">
                        <el-icon><Upload /></el-icon>
                        Excel导入
                    </el-button>
                    <el-button v-if="isOwnProfile" type="primary" @click="openAddDialog">
                        <el-icon><Plus /></el-icon>
                        添加成果
                    </el-button>
                </div>
            </div>
            
            <div class="card-content">
                <div v-if="achievements.length === 0" class="empty-state achievement-empty-center">
                    暂无学术成果数据
                </div>
                
                <div v-else class="achievement-list">
                    <div 
                        v-for="achievement in currentPageAchievements" 
                        :key="achievement.id" 
                        class="achievement-item"
                        @click="goToAchievementDetail(achievement)"
                        style="cursor: pointer;"
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
                                    <span v-if="achievement.publishDate" class="meta-value">{{ (achievement.publishDate + '').slice(0, 10) }}</span>
                                </div>
                                <div v-if="achievement.journal || achievement.conference || achievement.patentNumber" class="meta-row">
                                    <span v-if="achievement.journal" class="meta-label">期刊：</span>
                                    <span v-if="achievement.journal" class="meta-value">{{ achievement.journal }}</span>
                                    <span v-if="achievement.conference" class="meta-label">会议：</span>
                                    <span v-if="achievement.conference" class="meta-value">{{ achievement.conference }}</span>
                                    <span v-if="achievement.patentNumber" class="meta-label">专利号：</span>
                                    <span v-if="achievement.patentNumber" class="meta-value">{{ achievement.patentNumber }}</span>
                                </div>
                                <div v-if="achievement.volume || achievement.issue || achievement.pages" class="meta-row">
                                    <span v-if="achievement.volume || achievement.issue" class="meta-label">卷期：</span>
                                    <span v-if="achievement.volume || achievement.issue" class="meta-value">第{{ achievement.volume }}卷 第{{ achievement.issue }}期</span>
                                    <span v-if="achievement.pages" class="meta-label">页码：</span>
                                    <span v-if="achievement.pages" class="meta-value">{{ achievement.pages }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 分页 -->
                <el-pagination
                    v-if="achievements.length > pageSize"
                    v-model:current-page="currentPage"
                    :page-size="pageSize"
                    :total="achievements.length"
                    layout="prev, pager, next, jumper, total"
                    class="pagination"
                    small
                    @current-change="handlePageChange"
                />
            </div>
        </div>

        <!-- Excel上传对话框 -->
        <el-dialog 
            v-model="excelDialogVisible" 
            title=""
            width="800px"
            @close="closeExcelDialog"
            :close-on-click-modal="!importLoading"
            :close-on-press-escape="!importLoading"
            :show-close="!importLoading"
        >
            <div class="excel-upload-section">
                <div class="upload-tips">
                    <h4>导入说明：</h4>
                    <ol>
                        <li>请上传Excel文件（.xlsx或.xls格式）</li>
                        <li>表格应包含两列：第一行为字段名称，第二行开始为对应内容</li>
                        <li>支持的成果类型包括：期刊论文，会议论文，技术报告，海报，书，数据，专利。</li>
                        <li>各类型成果字段如下：
                            <ul>
                                <li>期刊论文：标题、作者、期刊名称、卷号、期号、页码、发表时间、DOI、摘要</li>
                                <li>会议论文：标题、作者、会议名称、发表时间、DOI、摘要</li>
                                <li>技术报告：标题、作者、发表时间、DOI、摘要</li>
                                <li>专利：标题、作者、专利号、发表时间、DOI、摘要</li>
                                <li>海报：标题、作者、发表时间、DOI、摘要</li>
                                <li>书：标题、作者、发表时间、DOI、摘要</li>
                                <li>数据：标题、作者、发表时间、DOI、摘要</li>
                            </ul>
                        </li>
                    </ol>
                    <div style="margin-top: 10px;">
                        <el-link type="primary" :underline="false" href="/学术成果元数据模板.xlsx" target="_blank" download>
                            下载Excel模板
                            <el-icon style="vertical-align: middle;"><Download /></el-icon>
                        </el-link>
                    </div>
                </div>

                <el-upload
                    ref="excelUploadRef"
                    :auto-upload="false"
                    :on-change="handleExcelChange"
                    :before-upload="beforeExcelUpload"
                    accept=".xlsx,.xls"
                    drag
                    :limit="1"
                    class="excel-upload"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        将Excel文件拖到此处，或<em>点击上传</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            只能上传xlsx/xls文件，且不超过10MB
                        </div>
                    </template>
                </el-upload>

                <div v-if="excelPreviewData.length > 0" class="preview-section">
                    <h4 style="text-align: left; margin-left: 10px;">预览数据：</h4>
                    <el-table :data="excelPreviewData" border style="width: 100%" max-height="300">
                        <el-table-column v-for="(field, idx) in excelPreviewFields" :key="field" :prop="excelPreviewFieldKeys[idx]" :label="field" />
                    </el-table>
                </div>
            </div>
            
            <template #footer>
                <div class="dialog-footer">
                    <div class="footer-actions">
                        <el-button @click="closeExcelDialog" :disabled="importLoading">取消</el-button>
                        <el-button type="primary" @click="importExcelData" :loading="importLoading">批量导入</el-button>
                    </div>
                </div>
            </template>
        </el-dialog>

        <!-- 从库中选择学术成果对话框 -->
        <el-dialog 
            v-model="selectDialogVisible" 
            title=""
            width="1000px"
            @close="closeSelectDialog"
            :close-on-click-modal="addSelectedLoading === false ? true : false"
            :close-on-press-escape="addSelectedLoading === false ? true : false"
            :show-close="addSelectedLoading === false ? true : false"
        >
            <div class="select-achievement-section">
                <div class="search-header">
                    <h4>从学术成果库中选择</h4>
                    <div class="search-controls">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="搜索标题、作者或期刊..."
                            style="width: 300px;"
                            clearable
                            @input="handleSearch"
                        >
                            <template #prefix>
                                <el-icon><Search /></el-icon>
                            </template>
                        </el-input>
                    </div>
                </div>

                <div class="achievement-library">
                    <div v-if="libraryTotal === 0" class="empty-library">
                        <el-empty description="没有找到匹配的学术成果" />
                    </div>
                    <div v-else class="library-list">
                        <div 
                            v-for="achievement in currentPageLibraryAchievements" 
                            :key="achievement.id" 
                            class="library-item"
                            :class="{ selected: selectedAchievements.includes(achievement.id) }"
                            @click="toggleSelection(achievement.id)"
                        >
                            <div class="library-item-content">
                                <div class="library-header">
                                    <div class="title-type-row">
                                        <span class="achievement-type-tag" :class="achievement.type">
                                            {{ typeLabels[achievement.type] }}
                                        </span>
                                        <div class="library-title">{{ achievement.title }}</div>
                                    </div>
                                    <el-checkbox 
                                        :model-value="selectedAchievements.includes(achievement.id)"
                                        @change="toggleSelection(achievement.id)"
                                        @click.stop
                                    />
                                </div>
                                <div class="library-meta">
                                    <div class="meta-row">
                                        <span class="meta-label">作者：</span>
                                        <span class="meta-value">{{ achievement.authors || '暂无' }}</span>
                                        <span v-if="achievement.publishDate" class="meta-label">发表时间：</span>
                                        <span v-if="achievement.publishDate" class="meta-value">{{ (achievement.publishDate + '').slice(0, 10) }}</span>
                                    </div>
                                    <div v-if="achievement.journal || achievement.conference" class="meta-row">
                                        <span v-if="achievement.journal" class="meta-label">期刊：</span>
                                        <span v-if="achievement.journal" class="meta-value">{{ achievement.journal }}</span>
                                        <span v-if="achievement.conference" class="meta-label">会议：</span>
                                        <span v-if="achievement.conference" class="meta-value">{{ achievement.conference }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 分页 -->
                    <el-pagination
                        v-if="libraryTotal > libraryPageSize"
                        v-model:current-page="libraryCurrentPage"
                        :page-size="libraryPageSize"
                        :total="libraryTotal"
                        layout="prev, pager, next, jumper, total"
                        class="library-pagination"
                        small
                        @current-change="handleLibraryPageChange"
                    />
                </div>
            </div>
            
            <template #footer>
                <div class="dialog-footer">
                    <div class="selected-count">
                        已选择 {{ selectedAchievements.length }} 项
                    </div>
                    <div class="footer-actions">
                        <el-button @click="closeSelectDialog" :disabled="addSelectedLoading">取消</el-button>
                        <el-button 
                            type="primary" 
                            @click="addSelectedAchievements"
                            :disabled="selectedAchievements.length === 0"
                            :loading="addSelectedLoading"
                        >
                            添加选中项 ({{ selectedAchievements.length }})
                        </el-button>
                    </div>
                </div>
            </template>
        </el-dialog>

        <!-- 添加/编辑学术成果对话框 -->
        <el-dialog 
            v-model="dialogVisible" 
            title=""
            width="700px"
            :close-on-click-modal="!saveLoading"
            :close-on-press-escape="!saveLoading"
            :show-close="!saveLoading"
        >
            <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
                <el-form-item label="成果类型" prop="type">
                    <el-select v-model="formData.type" placeholder="请选择成果类型" style="width: 100%;" @change="onTypeChange">
                        <el-option label="期刊论文" value="期刊论文" />
                        <el-option label="会议论文" value="会议论文" />
                        <el-option label="专利" value="专利" />
                        <el-option label="书" value="书" />
                        <el-option label="技术报告" value="技术报告" />
                        <el-option label="数据" value="数据" />
                        <el-option label="海报" value="海报" />
                    </el-select>
                </el-form-item>
                
                <el-form-item label="标题" prop="title">
                    <el-input v-model="formData.title" placeholder="请输入成果标题" />
                </el-form-item>
                
                <el-form-item label="作者" prop="authors">
                    <el-input v-model="formData.authors" placeholder="请输入作者信息，多个作者用逗号分隔" />
                </el-form-item>

                <!-- 期刊论文字段 -->
                <template v-if="formData.type === '期刊论文'">
                    <el-form-item label="期刊名称" prop="journal">
                        <el-input v-model="formData.journal" placeholder="请输入期刊名称" />
                    </el-form-item>
                    <el-form-item label="卷号" prop="volume">
                        <el-input v-model="formData.volume" placeholder="请输入卷号" />
                    </el-form-item>
                    <el-form-item label="期号" prop="issue">
                        <el-input v-model="formData.issue" placeholder="请输入期号" />
                    </el-form-item>
                    <el-form-item label="页码" prop="pages">
                        <el-input v-model="formData.pages" placeholder="例如：123-130" />
                    </el-form-item>
                </template>

                <!-- 会议论文字段 -->
                <template v-if="formData.type === '会议论文'">
                    <el-form-item label="会议名称" prop="conference">
                        <el-input v-model="formData.conference" placeholder="请输入会议名称" />
                    </el-form-item>
                </template>

                <!-- 专利字段 -->
                <template v-if="formData.type === '专利'">
                    <el-form-item label="专利号" prop="patentNumber">
                        <el-input v-model="formData.patentNumber" placeholder="请输入专利号" />
                    </el-form-item>
                </template>

                <!-- 公共字段 -->
                <el-form-item label="发表/授权时间" prop="publishDate">
                    <el-date-picker
                        v-model="formData.publishDate"
                        type="date"
                        placeholder="选择时间"
                        style="width: 100%;"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>

                <el-form-item label="DOI" prop="doi">
                    <el-input v-model="formData.doi" placeholder="请输入DOI（可选）" />
                </el-form-item>

                <el-form-item label="摘要" prop="abstractContent">
                    <el-input 
                        v-model="formData.abstractContent" 
                        type="textarea" 
                        :rows="4"
                        placeholder="请输入摘要（可选）"
                        @input="onAbstractInput"
                    />
                    <div style="text-align:right;color:#999;font-size:12px;">
                        {{ abstractWordCount }} / 200 字/单词
                    </div>
                </el-form-item>
            </el-form>
            
            <template #footer>
                <div class="dialog-footer-right">
                    <el-button @click="closeDialog" :disabled="saveLoading">取消</el-button>
                    <el-button type="primary" @click="saveAchievement" :loading="saveLoading">保存</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { Plus, Edit, Delete, Upload, UploadFilled, Search, DocumentAdd, Document, Download } from '@element-plus/icons-vue'
import { callSuccess, callWarning, callInfo, callError } from '@/call'
import { ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { uploadAchievementMeta, autoAddResearchOutcomes } from '@/api/achievement'
import { researchOutcomeLibrarySearch } from '@/api/search'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

export default {
    name: 'achievementManager',
    props: {
        researchOutcomes: {
            type: Array,
            default: () => []
        },
        isOwnProfile: {
            type: Boolean,
            default: false
        }
    },
    emits: ['refresh'],
    setup(props, { emit }) {
        const router = useRouter()
        
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(3)
        
        // 成果类型标签（仅保留后端要求的七种类型）
        const typeLabels = {
            '期刊论文': '期刊论文',
            '会议论文': '会议论文',
            '专利': '专利',
            '书': '书',
            '技术报告': '技术报告',
            '数据': '数据',
            '海报': '海报'
        }

        // 学术成果数据（由父组件传入，响应式）
        const achievements = ref([])
        watch(() => props.researchOutcomes, (newVal) => {
          achievements.value = (newVal && newVal.length > 0)
            ? newVal.map(item => ({
                ...item,
                id: item.outcomeId || item.id
              }))
            : []
        }, { immediate: true })

        // 学术成果库数据（接口获取）
        const libraryAchievements = ref([])
        const libraryTotal = ref(0)
        const libraryLoading = ref(false)
        // 分页参数
        const libraryCurrentPage = ref(1)
        const libraryPageSize = ref(4)

        // 获取成果库数据
        const fetchLibraryAchievements = async (key = '', pageNum = 1) => {
            libraryLoading.value = true
            const res = await researchOutcomeLibrarySearch({
                key,
                notMine: true,
                pageSize: libraryPageSize.value,
                pageNum
            })
            if (res && res.data) {
                libraryAchievements.value = (res.data.list || []).map(item => ({
                    ...item,
                    id: item.outcomeId || item.id
                }))
                libraryTotal.value = res.data.total || 0
            } else {
                libraryAchievements.value = []
                libraryTotal.value = 0
            }
            libraryLoading.value = false
        }

        // 对话框相关
        const dialogVisible = ref(false)
        const isEdit = ref(false)
        const formRef = ref()
        const editingId = ref(null)
        
        // 保存按钮加载状态
        const saveLoading = ref(false)
        
        // 添加选中项按钮加载状态
        const addSelectedLoading = ref(false)

        // Excel导入相关
        const excelDialogVisible = ref(false)
        const excelUploadRef = ref()
        const excelPreviewData = ref([])
        const importLoading = ref(false)

        // 从库中选择相关
        const selectDialogVisible = ref(false)
        const selectedAchievements = ref([])
        const searchKeyword = ref('')
        
        // 表单数据（与后端参数完全一致）
        const formData = ref({
            type: '',
            title: '',
            authors: '',
            journal: '',
            volume: 0,
            issue: 0,
            pages: '',
            publishDate: 0,
            doi: '',
            patentNumber: '',
            abstractContent: ''
        })

        // PDF上传相关
        const pdfUploadRef = ref()
        const pdfFileList = ref([])

        // 摘要字/单词数统计
        const abstractWordCount = computed(() => {
            const val = formData.value.abstractContent || ''
            // 汉字按字，英文按单词
            const cn = (val.match(/[\u4e00-\u9fa5]/g) || []).length
            const en = (val.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean) || []).length
            return cn + en
        })
        // 摘要输入时触发校验
        const onAbstractInput = () => {
            formRef.value && formRef.value.validateField && formRef.value.validateField('abstractContent')
        }

        // 动态验证规则
        const rules = computed(() => {
            const baseRules = {
                type: [{ required: true, message: '请选择成果类型', trigger: 'change' }],
                title: [{ required: true, message: '请输入成果标题', trigger: 'blur' }],
                authors: [{ required: true, message: '请输入作者信息', trigger: 'blur' }],
                publishDate: [{ required: true, message: '请选择发表/授权时间', trigger: 'change' }],
                abstractContent: [
                    { validator: (rule, value, callback) => {
                        const val = value || ''
                        const cn = (val.match(/[\u4e00-\u9fa5]/g) || []).length
                        const en = (val.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean) || []).length
                        if (cn + en > 200) {
                            callback(new Error('摘要不能超过200字/单词'))
                        } else {
                            callback()
                        }
                    }, trigger: 'blur' }
                ]
            }

            // 根据类型添加特定验证规则
            if (formData.value.type === '期刊论文') {
                baseRules.journal = [{ required: true, message: '请输入期刊名称', trigger: 'blur' }]
                baseRules.volume = [{ required: true, message: '请输入卷号', trigger: 'blur' }]
                baseRules.issue = [{ required: true, message: '请输入期号', trigger: 'blur' }]
            } else if (formData.value.type === '会议论文') {
                baseRules.conference = [{ required: true, message: '请输入会议名称', trigger: 'blur' }]
            } else if (formData.value.type === '专利') {
                baseRules.patentNumber = [{ required: true, message: '请输入专利号', trigger: 'blur' }]
            }

            return baseRules
        })

        // 当前页成果数据
        const currentPageAchievements = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return achievements.value.slice(start, end)
        })

        // 当前页库中成果数据直接用 libraryAchievements
        const currentPageLibraryAchievements = computed(() => libraryAchievements.value)

        // 类型改变时重置相关字段
        const onTypeChange = () => {
            const keepFields = ['type', 'title', 'authors', 'publishDate', 'doi', 'abstractContent']
            const newFormData = {}
            keepFields.forEach(field => {
                newFormData[field] = formData.value[field]
            })
            formData.value = { ...formData.value, ...newFormData }
        }

        // 打开添加对话框
        const openAddDialog = () => {
            isEdit.value = false
            formData.value = {
                type: '',
                title: '',
                authors: '',
                journal: '',
                volume: 0,
                issue: 0,
                pages: '',
                publishDate: 0,
                doi: '',
                patentNumber: '',
                abstractContent: ''
            }
            pdfFileList.value = []
            dialogVisible.value = true
        }

        // 编辑成果
        const editAchievement = (achievement) => {
            isEdit.value = true
            editingId.value = achievement.id
            formData.value = { ...achievement }
            dialogVisible.value = true
        }

        // 删除成果
        const deleteAchievement = async (id) => {
            try {
                await ElMessageBox.confirm('确定要删除这个学术成果吗？', '确认删除', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const index = achievements.value.findIndex(a => a.id === id)
                if (index > -1) {
                    achievements.value.splice(index, 1)
                    callSuccess('删除成功')
                }
            } catch {
                callInfo('已取消删除')
            }
        }

        // 检查数据完整性
        const checkDataIntegrity = (data) => {
            const errors = []
            
            if (data.type === '期刊论文') {
                if (!data.journal) errors.push('期刊名称')
                if (!data.volume) errors.push('卷号')
                if (!data.issue) errors.push('期号')
            } else if (data.type === '会议论文') {
                if (!data.conference) errors.push('会议名称')
            } else if (data.type === '专利') {
                if (!data.patentNumber) errors.push('专利号')
            }

            // 页码必须为数字
            if (data.pages && isNaN(Number(data.pages))) {
                errors.push('页码（必须为数字）')
            }

            if (errors.length > 0) {
                callError(`以下字段不完整：${errors.join('、')}`)
                return false
            }
            return true
        }

        // 保存成果
        const saveAchievement = async () => {
            if (saveLoading.value) return // 防止重复提交
            
            try {
                saveLoading.value = true // 开始加载
                await formRef.value.validate()
                // 检查数据完整性
                if (!checkDataIntegrity(formData.value)) {
                    return
                }
                // 处理参数类型
                const payload = { ...formData.value }
                payload.volume = Number(payload.volume) || 0
                payload.issue = Number(payload.issue) || 0
                // publishDate 转为数据库datetime格式
                if (payload.publishDate) {
                    if (typeof payload.publishDate === 'string' && payload.publishDate.length <= 10) {
                        // 只有日期，补全为 00:00:00
                        payload.publishDate = dayjs(payload.publishDate).format('YYYY-MM-DD 00:00:00')
                    } else {
                        payload.publishDate = dayjs(payload.publishDate).format('YYYY-MM-DD HH:mm:ss')
                    }
                } else {
                    payload.publishDate = ''
                }
                // 只保留后端需要的字段
                const requestData = {
                    type: payload.type,
                    title: payload.title,
                    authors: payload.authors,
                    journal: payload.journal,
                    volume: payload.volume,
                    issue: payload.issue,
                    pages: payload.pages,
                    publishDate: payload.publishDate,
                    doi: payload.doi,
                    patentNumber: payload.patentNumber,
                    abstractContent: payload.abstractContent
                }
                const res = await uploadAchievementMeta(requestData)
                if (res && res.code === 0) {
                    const newAchievement = {
                        ...formData.value,
                        id: res.data || Date.now()
                    }
                    achievements.value.unshift(newAchievement)
                    callSuccess('添加成功')
                } else {
                    callError(res?.message || '添加失败')
                    return
                }
                closeDialog()
            } catch {
                callWarning('请填写完整信息')
            } finally {
                saveLoading.value = false // 结束加载
            }
        }

        // 关闭对话框
        const closeDialog = () => {
            dialogVisible.value = false
            formRef.value?.clearValidate()
        }

        // 分页处理
        const handlePageChange = (page) => {
            currentPage.value = page
        }

        // 字段映射表
        const fieldMapping = {
            '成果类型': 'type',
            '类型': 'type',
            '标题': 'title',
            '题目': 'title',
            '作者': 'authors',
            '期刊名称': 'journal',
            '期刊': 'journal',
            '会议名称': 'conference',
            '会议': 'conference',
            '专利号': 'patentNumber',
            '卷号': 'volume',
            '卷': 'volume',
            '期号': 'issue',
            '期': 'issue',
            '页码': 'pages',
            '页': 'pages',
            '发表时间': 'publishDate',
            '发表日期': 'publishDate',
            '授权时间': 'publishDate',
            '时间': 'publishDate',
            '日期': 'publishDate',
            'DOI': 'doi',
            'doi': 'doi',
            '摘要': 'abstractContent',
            '简介': 'abstractContent'
        }

        // 成果类型映射（仅保留七种类型）
        const typeMapping = {
            '期刊论文': '期刊论文',
            '会议论文': '会议论文',
            '专利': '专利',
            '书': '书',
            '技术报告': '技术报告',
            '数据': '数据',
            '海报': '海报'
        }

        // 打开Excel上传对话框
        const openExcelUploadDialog = () => {
            excelDialogVisible.value = true
            excelPreviewData.value = []
        }

        // 关闭Excel上传对话框
        const closeExcelDialog = () => {
            excelDialogVisible.value = false
            excelPreviewData.value = []
            excelUploadRef.value?.clearFiles()
        }

        // Excel文件上传前检查
        const beforeExcelUpload = (file) => {
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                           file.type === 'application/vnd.ms-excel'
            const isLt10M = file.size / 1024 / 1024 < 10

            if (!isExcel) {
                callError('只能上传Excel文件！')
                return false
            }
            if (!isLt10M) {
                callError('文件大小不能超过10MB！')
                return false
            }
            return true
        }

        // 处理Excel文件变化
        const handleExcelChange = (file) => {
            if (!file.raw) return
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result)
                    const workbook = XLSX.read(data, { type: 'array' })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
                    if (jsonData.length < 2) {
                        callWarning('Excel文件中没有有效数据')
                        return
                    }
                    const headers = jsonData[0].map(h => h && h.toString().trim())
                    const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''))
                    if (dataRows.length === 0) {
                        callWarning('Excel文件中没有有效数据行')
                        return
                    }
                    // 预览数据：每行为一条成果，每列为一个字段
                    const preview = dataRows.slice(0, 5).map(row => {
                        const obj = {}
                        headers.forEach((h, i) => {
                            const mappedKey = fieldMapping[h]
                            if (mappedKey) {
                                if (mappedKey === 'publishDate' && row[i]) {
                                    try {
                                        const date = new Date(row[i])
                                        if (!isNaN(date.getTime())) {
                                            obj[mappedKey] = date.toISOString().split('T')[0]
                                        } else {
                                            obj[mappedKey] = row[i]
                                        }
                                    } catch {
                                        obj[mappedKey] = row[i]
                                    }
                                } else {
                                    obj[mappedKey] = row[i]
                                }
                            }
                        })
                        return obj
                    })
                    excelPreviewData.value = preview
                    // 存储全部数据用于导入（原始key，后续导入时再映射）
                    excelPreviewData.value._allRows = dataRows.map(row => {
                        const obj = {}
                        headers.forEach((h, i) => { obj[h] = row[i] })
                        return obj
                    })
                    callSuccess(`成功解析${dataRows.length}条数据`)
                } catch (error) {
                    console.error('Excel解析错误:', error)
                    callError('Excel文件解析失败，请检查文件格式')
                }
            }
            reader.readAsArrayBuffer(file.raw)
        }

        // Excel预览区表头（用原始Excel字段名，内容用映射key）
        const excelPreviewFields = computed(() => {
            if (!excelPreviewData.value.length) return []
            // 反向映射：找到fieldMapping的key（中文）
            const reverseMap = {}
            Object.entries(fieldMapping).forEach(([cn, en]) => { reverseMap[en] = cn })
            return Object.keys(excelPreviewData.value[0]).map(en => reverseMap[en] || en)
        })
        // 预览区内容字段顺序与表头一致
        const excelPreviewFieldKeys = computed(() => {
            if (!excelPreviewData.value.length) return []
            return Object.keys(excelPreviewData.value[0])
        })

        // 导入Excel数据到表单（批量添加）
        const importExcelData = async () => {
            if (importLoading.value) return // 防止重复提交
            
            try {
                importLoading.value = true // 开始加载
                const allRows = excelPreviewData.value._allRows || []
                if (allRows.length === 0) {
                    callWarning('没有可导入的数据')
                    return
                }
                let successCount = 0
                let failCount = 0
                for (let i = 0; i < allRows.length; i++) {
                    const row = allRows[i]
                    // 字段映射
                    const mapped = {}
                    Object.keys(row).forEach(key => {
                        const fieldKey = fieldMapping[key]
                        if (fieldKey) {
                            if (fieldKey === 'type') {
                                const mappedType = typeMapping[row[key]]
                                mapped[fieldKey] = mappedType || row[key]
                            } else if (fieldKey === 'publishDate') {
                                try {
                                    const date = new Date(row[key])
                                    if (!isNaN(date.getTime())) {
                                        mapped[fieldKey] = date.toISOString().slice(0,10) + ' 00:00:00'
                                    }
                                } catch {
                                    mapped[fieldKey] = row[key]
                                }
                            } else {
                                mapped[fieldKey] = row[key]
                            }
                        }
                    })
                    // 必填校验（最少有类型、标题、作者）
                    if (!mapped.type || !mapped.title || !mapped.authors) {
                        failCount++
                        continue
                    }
                    try {
                        console.log('上传参数', mapped)
                        const res = await uploadAchievementMeta(mapped)
                        if (res && res.code === 0) {
                            successCount++
                            achievements.value.unshift({ ...mapped, id: res.data || Date.now() })
                        } else {
                            failCount++
                        }
                    } catch {
                        failCount++
                    }
                }
                callSuccess(`批量导入完成，成功${successCount}条，失败${failCount}条`)
                emit('refresh')
            } catch {
                callWarning('批量导入失败，请检查网络连接')
            } finally {
                importLoading.value = false // 结束加载
                closeExcelDialog()
            }
        }

        // 打开从库中选择对话框
        const openSelectDialog = () => {
            selectDialogVisible.value = true
            selectedAchievements.value = []
            searchKeyword.value = ''
            libraryCurrentPage.value = 1
            fetchLibraryAchievements('', 1)
        }

        // 关闭从库中选择对话框
        const closeSelectDialog = () => {
            selectDialogVisible.value = false
            selectedAchievements.value = []
            searchKeyword.value = ''
        }

        // 搜索处理
        const handleSearch = () => {
            libraryCurrentPage.value = 1
            fetchLibraryAchievements(searchKeyword.value.trim(), 1)
        }

        // 切换选择状态
        const toggleSelection = (id) => {
            const index = selectedAchievements.value.indexOf(id)
            if (index > -1) {
                selectedAchievements.value.splice(index, 1)
            } else {
                selectedAchievements.value.push(id)
            }
        }

        // 库分页处理
        const handleLibraryPageChange = (page) => {
            libraryCurrentPage.value = page
            fetchLibraryAchievements(searchKeyword.value.trim(), page)
        }

        // 添加选中的学术成果
        const addSelectedAchievements = async () => {
            if (selectedAchievements.value.length === 0) {
                callWarning('请选择要添加的学术成果')
                return
            }

            if (addSelectedLoading.value) return // 防止重复提交

            try {
                addSelectedLoading.value = true // 开始加载
                // 调用新的接口，传入选中的成果ID数组
                const response = await autoAddResearchOutcomes(selectedAchievements.value)
                
                if (response && response.code === 0) {
                    const selectedCount = selectedAchievements.value.length
                    const successCount = response.data || 0
                    
                    // 显示成功添加的反馈
                    callSuccess(`选择${selectedCount}项，成功添加${successCount}项`)
                    
                    // 如果成功数量小于选择数量，显示警告
                    if (successCount < selectedCount) {
                        callWarning('未添加成功的成果作者不包含当前用户')
                    }
                    
                    // 关闭对话框
                    closeSelectDialog()
                    // 清空选中项
                    selectedAchievements.value = []
                    // 触发父组件刷新数据
                    emit('refresh')
                } else {
                    callError(response?.message || '添加失败')
                }
            } catch (error) {
                callError('添加学术成果时发生错误')
            } finally {
                addSelectedLoading.value = false // 结束加载
            }
        }

        // 跳转到成果详情
        const goToAchievementDetail = (achievement) => {
            router.push(`/outcome-detail/${achievement.id}`)
        }

        // PDF上传相关函数
        const handlePdfChange = (file) => {
            formData.value.fullTextFile = file.raw
            pdfFileList.value = [file]
        }

        const handlePdfRemove = () => {
            formData.value.fullTextFile = null
            pdfFileList.value = []
            // 如果有上传组件的引用，也清理一下
            if (pdfUploadRef.value) {
                pdfUploadRef.value.clearFiles()
            }
        }

        const beforePdfUpload = (file) => {
            const isPDF = file.type === 'application/pdf'
            const isLt50M = file.size / 1024 / 1024 < 50

            if (!isPDF) {
                callError('只能上传PDF格式的文件！')
                return false
            }
            if (!isLt50M) {
                callError('上传文件大小不能超过50MB！')
                return false
            }
            return true
        }

        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes'
            const k = 1024
            const sizes = ['Bytes', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        }

        return {
            currentPage,
            pageSize,
            typeLabels,
            achievements,
            currentPageAchievements,
            dialogVisible,
            isEdit,
            formRef,
            formData,
            rules,
            excelDialogVisible,
            excelUploadRef,
            excelPreviewData,
            selectDialogVisible,
            selectedAchievements,
            searchKeyword,
            libraryCurrentPage,
            libraryPageSize,
            libraryTotal,
            libraryLoading,
            currentPageLibraryAchievements,
            onTypeChange,
            openAddDialog,
            editAchievement,
            deleteAchievement,
            saveAchievement,
            closeDialog,
            handlePageChange,
            openExcelUploadDialog,
            closeExcelDialog,
            beforeExcelUpload,
            handleExcelChange,
            importExcelData,
            openSelectDialog,
            closeSelectDialog,
            handleSearch,
            toggleSelection,
            handleLibraryPageChange,
            addSelectedAchievements,
            pdfUploadRef,
            pdfFileList,
            handlePdfChange,
            handlePdfRemove,
            beforePdfUpload,
            formatFileSize,
            goToAchievementDetail,
            saveLoading,
            addSelectedLoading,
            excelPreviewFields,
            excelPreviewFieldKeys,
            abstractWordCount,
            onAbstractInput,
            importLoading
        }
    }
}
</script>

<style scoped>
.achievement-manager {
    width: 100%;
}

.manager-card {
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

.header-actions {
    display: flex;
    gap: 10px;
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
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 11px;
    font-weight: 500;
    color: white;
}

.achievement-type-tag.期刊论文 {
    background-color: #409eff;
}

.achievement-type-tag.会议论文 {
    background-color: #67c23a;
}

.achievement-type-tag.专利 {
    background-color: #e93333;
}

.achievement-type-tag.书 {
    background-color: #9c27b0;
}

.achievement-type-tag.技术报告 {
    background-color: #ffb300;
}

.achievement-type-tag.数据 {
    background-color: #009688;
}

.achievement-type-tag.海报 {
    background-color: #3949ab;
}

.achievement-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.achievement-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0;
    line-height: 1.3;
    text-align: left;
    flex: 1;
}

.achievement-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.meta-row {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
}

.meta-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #8e8e8e;
    font-weight: 600;
}

.meta-value {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #666;
    margin-right: 15px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
}

.dialog-footer-right {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

/* Excel上传样式 */
.excel-upload-section {
    padding: 20px 0;
}

.upload-tips {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #409eff;
    text-align: left;
}

.upload-tips h4 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

.upload-tips ol {
    margin: 0;
    padding-left: 20px;
    color: #666;
}

.upload-tips li {
    margin-bottom: 5px;
    font-size: 14px;
    line-height: 1.5;
}

.excel-upload {
    margin-bottom: 20px;
}

.preview-section {
    margin-top: 20px;
}

.preview-section h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
}

/* 从库中选择样式 */
.select-achievement-section {
    padding: 20px 0;
}

.search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e9ecef;
}

.search-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
}

.search-controls {
    display: flex;
    align-items: center;
}

.achievement-library {
    min-height: 400px;
    max-height: 500px;
    overflow-y: hidden;
}

.empty-library {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
}

.library-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.library-item {
    padding: 15px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #fff;
}

.library-item:hover {
    border-color: #409eff;
    background-color: #f0f8ff;
}

.library-item.selected {
    border-color: #409eff;
    background-color: #e3f2fd;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.library-item-content {
    width: 100%;
}

.library-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
}

.library-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 15px;
    font-weight: bold;
    color: #2c3e50;
    line-height: 1.3;
    text-align: left;
    flex: 1;
}

.library-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.library-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.selected-count {
    color: #666;
    font-size: 14px;
}

.footer-actions {
    display: flex;
    gap: 10px;
}

/* PDF上传相关样式 */
.file-upload-section {
    width: 100%;
}

.upload-row {
    display: flex;
    align-items: center;
    gap: 15px;
}

.pdf-upload {
    flex-shrink: 0;
}

.upload-tip {
    font-size: 13px;
    color: #999;
    line-height: 1.4;
}

.uploaded-file-info {
    margin-top: 15px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #2c3e50;
}

.file-icon {
    color: #f56c6c;
    font-size: 16px;
}

.file-name {
    font-weight: 500;
    font-size: 14px;
    flex: 1;
    text-align: left;
}

.file-size {
    font-size: 12px;
    color: #666;
    background-color: #e9ecef;
    padding: 2px 8px;
    border-radius: 12px;
}

.remove-btn {
    margin-left: auto;
    padding: 0;
    font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .achievement-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .title-type-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        width: 100%;
    }
    
    .achievement-title {
        font-size: 14px;
    }
    
    .achievement-actions {
        width: 100%;
        justify-content: flex-end;
    }
    
    .header-actions {
        flex-direction: column;
        width: 100%;
        gap: 8px;
    }
    
    .upload-tips {
        padding: 10px;
    }
    
    .upload-tips h4 {
        font-size: 14px;
    }
    
    .upload-tips li {
        font-size: 12px;
    }
    
    .search-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
    }
    
    .search-controls {
        width: 100%;
        flex-direction: column;
        gap: 10px;
    }
    
    .search-controls .el-input {
        width: 100% !important;
    }
    
    .library-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .dialog-footer {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
    }
    
    .footer-actions {
        justify-content: center;
    }
}

.achievement-empty-center {
    text-align: center;
    color: #a1a1a1;
    font-size: 18px;
    font-weight: 500;
    padding: 40px 0;
}
</style> 