<template>
    <div class="library-manager">
        <div class="section-card">
            <div class="folders-view">
                <div class="card-header">
                    <div class="header-left">
                        <h3 style="text-align: left;">文献库</h3>
                    </div>
                    <div class="header-actions">
                        <!-- 返回上一级按钮 -->
                        <el-button 
                            v-if="currentParentId !== 0" 
                            type="text" 
                            @click="backToParentFolder"
                            class="back-button"
                        >
                            <el-icon><ArrowLeft /></el-icon>
                            返回上一级
                        </el-button>
                        <!-- 新增：手动上传PDF文献按钮，放在返回上一级和arXiv订阅管理之间 -->
                        <el-tooltip :content="uploadPdfTooltip" placement="bottom">
                            <el-button v-if="currentParentId !== 0" type="primary" style="font-family: 'Meiryo', sans-serif;" @click="manualUploadDialogVisible = true">
                                <el-icon><Plus /></el-icon>
                                手动上传PDF文献
                            </el-button>
                        </el-tooltip>
                        <!-- arXiv订阅管理按钮 -->
                        <ArxivSubscriptionManager />
                        <el-tooltip :content="createFolderTooltip" placement="bottom">
                            <el-button type="primary" @click="openCreateFolderDialog" style="font-family: 'Meiryo', sans-serif;">
                                <el-icon><Plus /></el-icon>
                                新建收藏夹
                            </el-button>
                        </el-tooltip>
                    </div>
                </div>
                
                <!-- 面包屑导航 -->
                <div v-if="breadcrumbList.length > 1" class="breadcrumb-container">
                    <el-breadcrumb separator="/" class="breadcrumb">
                        <el-breadcrumb-item 
                            v-for="(item, index) in breadcrumbList" 
                            :key="item.favoriteId"
                            @click="navigateToBreadcrumb(index)"
                            :class="{ 'clickable': index < breadcrumbList.length - 1 }"
                        >
                            {{ item.name }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                
                <div class="card-content">
                    <div v-if="loading" class="loading-state">
                        <el-icon class="is-loading"><Loading /></el-icon>
                        加载中...
                    </div>
                    
                    <div v-else-if="folders.length === 0 && outcomes.length === 0" class="empty-state">
                        {{ currentParentId === 0 ? '暂无收藏夹，点击右上角按钮创建收藏夹' : '该收藏夹下暂无内容' }}
                    </div>
                    
                    <div v-else>
                        <!-- 收藏夹列表 -->
                        <div class="folders-section">
                            <div class="section-title">所含收藏夹</div>
                            <div v-if="folders.length > 0" class="folders-grid">
                                <div 
                                    v-for="folder in currentPageFolders" 
                                    :key="folder.favoriteId" 
                                    class="folder-item"
                                    @click="openFolder(folder)"
                                >
                                    <div class="folder-icon">
                                        <el-icon><Folder /></el-icon>
                                    </div>
                                    <div class="folder-info">
                                        <div class="folder-name">{{ folder.name }}</div>
                                        <div class="folder-stats">
                                            <span class="paper-count">点击查看内容</span>
                                        </div>
                                    </div>
                                    <div class="folder-actions" @click.stop>
                                        <el-dropdown trigger="click">
                                            <el-button type="text" size="small">
                                                <el-icon><MoreFilled /></el-icon>
                                            </el-button>
                                            <template #dropdown>
                                                <el-dropdown-menu>
                                                    <el-dropdown-item @click="editFolder(folder)">
                                                        <el-icon><Edit /></el-icon>
                                                        重命名
                                                    </el-dropdown-item>
                                                    <el-dropdown-item @click="deleteFolder(folder.favoriteId)" divided>
                                                        <el-icon><Delete /></el-icon>
                                                        删除
                                                    </el-dropdown-item>
                                                </el-dropdown-menu>
                                            </template>
                                        </el-dropdown>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-state">暂无收藏夹</div>
                            <!-- 收藏夹分页 -->
                            <el-pagination
                                v-if="total > folderPageSize"
                                v-model:current-page="folderCurrentPage"
                                :page-size="folderPageSize"
                                :total="total"
                                layout="prev, pager, next, total"
                                class="pagination"
                                small
                                @current-change="handleFolderPageChange"
                            />
                        </div>

                        <!-- 文献列表 -->
                        <div v-if="currentParentId !== 0" class="outcomes-section">
                            <div class="section-title">所含文献</div>
                            <!-- 搜索框：无论是否有文献都显示 -->
                            <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                                <el-input
                                    v-model="keyword"
                                    placeholder="支持输入关键词搜索文献"
                                    clearable
                                    style="width: 350px;"
                                    @keyup.enter="onKeywordSearch"
                                    @clear="onKeywordSearch"
                                >
                                    <template #append>
                                        <el-button @click="onKeywordSearch">
                                            <el-icon><Search /></el-icon>
                                            &nbsp;搜索
                                        </el-button>
                                    </template>
                                </el-input>
                            </div>
                            <div v-if="outcomes.length > 0" class="outcomes-grid">
                                <div 
                                    v-for="outcome in currentPageOutcomes" 
                                    :key="outcome.outcomeId" 
                                    class="outcome-item"
                                    @click="goToOutcomeDetail(outcome.outcomeId)"
                                >
                                    <div class="outcome-icon">
                                        <el-icon><Document /></el-icon>
                                    </div>
                                    <div class="outcome-info">
                                        <div class="outcome-title">{{ outcome.title }}</div>
                                        <div class="outcome-authors">作者：{{ outcome.authors }}</div>
                                        <div class="outcome-meta">
                                            <span class="outcome-type" :data-type="formatType(outcome.type)">{{ formatType(outcome.type) }}</span>
                                            <span v-if="outcome.journal" class="outcome-journal">期刊：{{ outcome.journal }}</span>
                                            <span v-if="outcome.publishDate" class="outcome-date">发表日期：{{ formatDate(outcome.publishDate) }}</span>
                                            <span v-if="outcome.subscribed" class="outcome-subscribed">
                                                <el-icon><Star /></el-icon>
                                                根据订阅自动收集
                                            </span>
                                        </div>
                                    </div>
                                    <div class="outcome-actions" @click.stop>
                                        <el-dropdown trigger="click">
                                            <el-button type="text" size="small">
                                                <el-icon><MoreFilled /></el-icon>
                                            </el-button>
                                            <template #dropdown>
                                                <el-dropdown-menu>
                                                    <el-dropdown-item @click="removeOutcome(outcome.outcomeId)">
                                                        <el-icon><Delete /></el-icon>
                                                        从收藏夹移除
                                                    </el-dropdown-item>
                                                </el-dropdown-menu>
                                            </template>
                                        </el-dropdown>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-state">暂无文献</div>
                            <!-- 文献分页 -->
                            <el-pagination
                                v-if="outcomesTotal > outcomePageSize"
                                v-model:current-page="outcomeCurrentPage"
                                :page-size="outcomePageSize"
                                :total="outcomesTotal"
                                layout="prev, pager, next, total"
                                class="pagination"
                                small
                                @current-change="handleOutcomePageChange"
                            />
                        </div>
                    </div>
                    
                    <!-- 分页 -->
                    <el-pagination
                        v-if="total > pageSize || outcomesTotal > pageSize"
                        v-model:current-page="currentPage"
                        :page-size="pageSize"
                        :total="total + outcomesTotal"
                        layout="prev, pager, next"
                        class="pagination"
                        small
                        @current-change="handlePageChange"
                    />
                </div>
            </div>
        </div>

        <!-- 创建/编辑收藏夹对话框 -->
        <el-dialog 
            v-model="folderDialogVisible" 
            title=""
            width="500px"
        >
            <el-form :model="folderForm" :rules="folderRules" ref="folderFormRef" label-width="80px">
                <el-form-item label="名称" prop="name">
                    <el-input 
                        v-model="folderForm.name" 
                        placeholder="请输入收藏夹名称（最多50个字符）" 
                        :maxlength="50"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeFolderDialog">取消</el-button>
                    <el-button type="primary" @click="saveFolder">保存</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 新增：手动上传PDF文献弹窗（两步tab结构） -->
        <el-dialog v-model="manualUploadDialogVisible" title="手动上传PDF文献" width="650px">
            <el-tabs v-model="uploadActiveTab">
                <el-tab-pane label="版权与隐私确认" name="terms" class="terms-tab-pane">
                    <div class="terms-container">
                        <h3>版权声明与隐私确认</h3>
                        <div class="terms-section">
                            <h4><i class="el-icon-document"></i> 版权确认条款</h4>
                            <div class="terms-quote">
                                "我确认我有权利公开分享此文档，我理解并同意本网站的上传条件。我保证上传的内容不侵犯任何第三方的版权或其他知识产权。如果我上传的内容包含他人的受版权保护的材料，我已获得必要的许可。"
                            </div>
                        </div>
                        <div class="terms-section">
                            <h4><i class="el-icon-lock"></i> 隐私保护</h4>
                            <ul>
                                <li>用户需确认上传内容不包含任何个人隐私信息或敏感数据</li>
                                <li>对于涉及人类受试者的研究，需确认已获得必要的伦理审查和参与者同意</li>
                            </ul>
                        </div>
                        <div class="terms-section">
                            <h4><i class="el-icon-refresh"></i> 回溯确认</h4>
                            <ul>
                                <li>对于本政策实施前已上传的全文，系统将通知相关用户在30天内完成版权确认</li>
                                <li>未在规定时间内确认的全文将被转为"仅元数据"可见状态</li>
                            </ul>
                        </div>
                        <div class="terms-section">
                            <h4><i class="el-icon-s-claim"></i> 权利与责任</h4>
                            <div class="terms-subsection">
                                <h5>用户权利</h5>
                                <ul>
                                    <li>随时可以撤回已上传的全文（元数据将保留）</li>
                                    <li>可以更新或更正已上传成果的信息</li>
                                </ul>
                            </div>
                            <div class="terms-subsection">
                                <h5>网站权利</h5>
                                <ul>
                                    <li>有权移除任何涉嫌侵权或不符合政策的内容</li>
                                    <li>保留展示成果元数据的权利，即使全文被撤回</li>
                                </ul>
                            </div>
                            <div class="terms-subsection">
                                <h5>免责声明</h5>
                                <ul>
                                    <li>网站不承担用户上传内容引发的版权纠纷责任</li>
                                    <li>用户需自行确保上传内容的合法性和适当性</li>
                                </ul>
                            </div>
                        </div>
                        <div class="terms-section">
                            <h4><i class="el-icon-s-operation"></i> 实施条款</h4>
                            <ol>
                                <li>本条件自发布之日起生效</li>
                                <li>所有用户上传行为视为已阅读并同意本条件</li>
                                <li>网站保留修改本条件的权利，修改后将通过公告通知用户</li>
                            </ol>
                        </div>
                        <div class="terms-agreement">
                            <el-checkbox v-model="termsAgreed">我已阅读并同意上述版权声明与隐私确认条款</el-checkbox>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="上传文件" name="upload" :disabled="!termsAgreed">
                    <el-form :model="manualUploadForm" :rules="manualUploadRules" ref="manualUploadFormRef" label-width="120px" enctype="multipart/form-data" :disabled="formDisabled">
                        <el-form-item label="文献类型" prop="type">
                            <el-radio-group v-model="manualUploadForm.type" :disabled="formDisabled">
                                <el-radio label="期刊论文">期刊论文</el-radio>
                                <el-radio label="会议论文">会议论文</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="标题" prop="customTitle">
                            <el-input v-model="manualUploadForm.customTitle" placeholder="请输入标题" :disabled="formDisabled" />
                        </el-form-item>
                        <el-form-item label="作者" prop="customAuthors">
                            <el-input v-model="manualUploadForm.customAuthors" placeholder="请输入作者（多个作者用逗号分隔）" :disabled="formDisabled" />
                        </el-form-item>
                        <el-form-item label="摘要" prop="customAbstract">
                            <el-input type="textarea" v-model="manualUploadForm.customAbstract" placeholder="请输入摘要" :disabled="formDisabled" />
                        </el-form-item>
                        <el-form-item label="期刊/会议名称" prop="journal">
                            <el-input v-model="manualUploadForm.journal" placeholder="请输入期刊或会议名称" :disabled="formDisabled" />
                        </el-form-item>
                        <el-form-item label="DOI" prop="doi">
                            <el-input v-model="manualUploadForm.doi" placeholder="请输入DOI（可选）" :disabled="formDisabled" />
                        </el-form-item>
                        <el-form-item label="发表日期" prop="publishDate">
                            <el-date-picker v-model="manualUploadForm.publishDate" type="date" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" :disabled="formDisabled" />
                        </el-form-item>
                        <el-form-item label="PDF文件" prop="file">
                            <el-upload
                                drag
                                :auto-upload="false"
                                :show-file-list="true"
                                :before-upload="beforePdfUpload"
                                :on-change="handleFileChange"
                                :file-list="manualUploadForm.fileList"
                                accept="application/pdf"
                                class="custom-upload"
                                :disabled="formDisabled"
                            >
                                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                                <div class="el-upload__text">将PDF文件拖到此处，或 <em>点击上传</em></div>
                            </el-upload>
                        </el-form-item>
                    </el-form>
                    <div v-if="duplicateTipVisible" style="color:#e67c00;margin-top:16px;line-height:1.7;white-space:pre-line;">
                        库中已有类似成果，信息如上，无法加到文献？
                        <br>如确须添加相近成果请联系管理员
                    </div>
                </el-tab-pane>
            </el-tabs>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="resetManualUploadDialog">取消</el-button>
                    <el-button v-if="uploadActiveTab === 'terms'" type="primary" @click="proceedToUpload" :disabled="!termsAgreed">继续</el-button>
                    <el-button v-else type="primary" :loading="manualUploadLoading" @click="handleManualUpload" v-show="!duplicateTipVisible">确定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Folder, MoreFilled, Edit, Delete, ArrowLeft, Document, Star, Search } from '@element-plus/icons-vue'
import { callSuccess, callInfo, callWarning } from '@/call'
import { ElMessageBox } from 'element-plus'
import { getFavoritePage, createFavorite, deleteFavorite, updateFavorite, getFavoriteOutcomePage, removeOutcomeFromFavorite, addOutcomeToFavorite } from '@/api/favorite'
import { checkFavoriteHasSubscription } from '@/api/arxiv'
import ArxivSubscriptionManager from './ArxivSubscriptionManager.vue'
import { uploadPdfAndExtractMetadata } from '@/api/outcome'

export default {
    name: 'libraryManager',
    components: {
        ArxivSubscriptionManager
    },
    setup() {
        const router = useRouter()
        
        // 当前父级收藏夹ID
        const currentParentId = ref(0)
        
        // 面包屑导航数据
        const breadcrumbList = ref([
            { favoriteId: 0, name: '文献库' }
        ])
        
        // 收藏夹分页相关
        const folderCurrentPage = ref(1)
        const folderPageSize = ref(5)
        
        // 收藏夹数据
        const folders = ref([])
        const total = ref(0)
        const loading = ref(false)
        
        // 文献分页相关
        const outcomeCurrentPage = ref(1)
        const outcomePageSize = ref(5)
        
        // 文献数据
        const outcomes = ref([])
        const outcomesTotal = ref(0)
        const loadingOutcomes = ref(false)
        
        // 对话框状态
        const folderDialogVisible = ref(false)
        const isEditFolder = ref(false)
        const editingFolderId = ref(null)
        
        // 表单数据
        const folderFormRef = ref()
        const folderForm = ref({
            name: ''
        })
        
        // 表单验证规则
        const folderRules = {
            name: [
                { required: true, message: '请输入收藏夹名称', trigger: 'blur' },
                { max: 50, message: '收藏夹名称不能超过50个字符', trigger: 'blur' }
            ]
        }
        
        // 计算属性
        const currentPageFolders = computed(() => {
            return folders.value
        })
        
        const currentPageOutcomes = computed(() => {
            return outcomes.value
        })
        
        // 新增：关键词搜索
        const keyword = ref("");
        
        // 新增：手动上传PDF文献弹窗相关
        const manualUploadDialogVisible = ref(false)
        const manualUploadLoading = ref(false)
        const manualUploadFormRef = ref()
        const manualUploadForm = ref({
            type: '',
            customTitle: '',
            customAuthors: '',
            customAbstract: '',
            journal: '',
            doi: '',
            publishDate: '',
            file: null,
            fileList: []
        })
        const manualUploadRules = {
            type: [{ required: true, message: '请选择文献类型', trigger: 'change' }],
            customTitle: [{ required: true, message: '请输入标题', trigger: 'blur' }],
            customAuthors: [{ required: true, message: '请输入作者', trigger: 'blur' }],
            customAbstract: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
            journal: [{ required: true, message: '请输入期刊/会议名称', trigger: 'blur' }],
            publishDate: [{ required: true, message: '请选择发表日期', trigger: 'change' }],
            file: [{ required: true, message: '请上传PDF文件', trigger: 'change' }]
        }
        
        // 新增tab相关ref
        const uploadActiveTab = ref('terms')
        const termsAgreed = ref(false)
        
        // 新增：表单禁用和库中已有提示
        const formDisabled = ref(false)
        const duplicateInfo = ref('')
        const duplicateTipVisible = ref(false)
        
        // 格式化成果类型
        const formatType = (type) => {
            const typeMap = {
                'article': '论文',
                'journal': '期刊',
                'conference': '会议',
                'patent': '专利',
                'book': '书籍',
                'chapter': '章节',
                // 添加中文类型映射
                '论文': '论文',
                '期刊': '期刊',
                '会议': '会议',
                '会议论文': '会议论文',
                '专利': '专利',
                '书籍': '书籍',
                '章节': '章节',
                '数据': '数据',
                '技术报告': '技术报告',
                '海报': '海报',
                '其他': '其他'
            }
            return typeMap[type] || type
        }
        
        // 格式化日期
        const formatDate = (timestamp) => {
            if (!timestamp) return ''
            const date = new Date(timestamp)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
        
        // 获取当前目录名称
        const getCurrentFolderName = () => {
            if (breadcrumbList.value.length > 0) {
                return breadcrumbList.value[breadcrumbList.value.length - 1].name;
            }
            return '文献库';
        };
        
        // 计算属性：新建收藏夹的tooltip内容
        const createFolderTooltip = computed(() => {
            const currentName = getCurrentFolderName();
            return `在"${currentName}"下新建收藏夹`;
        });
        
        // 计算属性：手动上传PDF文献的tooltip内容
        const uploadPdfTooltip = computed(() => {
            const currentName = getCurrentFolderName();
            return `在"${currentName}"下手动上传PDF文献`;
        });
        
        // 加载收藏夹数据
        const loadFolders = async (parentId = 0) => {
            loading.value = true
            try {
                const result = await getFavoritePage({
                    pageSize: folderPageSize.value,
                    pageNum: folderCurrentPage.value,
                    parentId: parentId
                })
                
                if (result) {
                    folders.value = result.list
                    total.value = result.total
                } else {
                    folders.value = []
                    total.value = 0
                }
            } catch (error) {
                console.error('加载收藏夹失败:', error)
                folders.value = []
                total.value = 0
            } finally {
                loading.value = false
            }
        }
        
        // 加载文献数据
        const loadOutcomes = async (favoriteId) => {
            loadingOutcomes.value = true
            try {
                const result = await getFavoriteOutcomePage({
                    pageSize: outcomePageSize.value,
                    pageNum: outcomeCurrentPage.value,
                    favoriteId: favoriteId,
                    keyword: keyword.value
                })
                
                if (result) {
                    outcomes.value = result.list
                    outcomesTotal.value = result.total
                    console.log(outcomes.value)
                } else {
                    outcomes.value = []
                    outcomesTotal.value = 0
                }
            } catch (error) {
                console.error('加载文献失败:', error)
                outcomes.value = []
                outcomesTotal.value = 0
            } finally {
                loadingOutcomes.value = false
            }
        }
        
        // 加载当前层级的所有数据
        const loadCurrentLevelData = async (parentId = 0) => {
            await Promise.all([
                loadFolders(parentId),
                loadOutcomes(parentId)
            ])
        }
        
        // 获取所有收藏夹数据（用于检查层级关系）
        const getAllFolders = async () => {
            const allFolders = []
            
            // 递归获取所有收藏夹
            const loadFoldersRecursively = async (parentId = 0) => {
                try {
                    const result = await getFavoritePage({
                        pageSize: 1000, // 使用较大的页面大小
                        pageNum: 1,
                        parentId: parentId
                    })
                    
                    if (result && result.list.length > 0) {
                        allFolders.push(...result.list)
                        
                        // 递归加载子收藏夹
                        for (const folder of result.list) {
                            await loadFoldersRecursively(folder.favoriteId)
                        }
                    }
                } catch (error) {
                    console.error(`加载父级ID ${parentId} 的收藏夹失败:`, error)
                }
            }
            
            await loadFoldersRecursively()
            return allFolders
        }
        
        // 面包屑导航点击
        const navigateToBreadcrumb = async (index) => {
            if (index < breadcrumbList.value.length - 1) {
                const targetItem = breadcrumbList.value[index]
                currentParentId.value = targetItem.favoriteId
                
                // 更新面包屑列表
                breadcrumbList.value = breadcrumbList.value.slice(0, index + 1)
                
                // 重置分页并加载对应层级的数据
                folderCurrentPage.value = 1
                outcomeCurrentPage.value = 1
                await loadCurrentLevelData(targetItem.favoriteId)
            }
        }
        
        // 返回上一级收藏夹
        const backToParentFolder = async () => {
            if (breadcrumbList.value.length > 1) {
                // 移除当前层级
                breadcrumbList.value.pop()
                
                // 获取新的当前父级ID
                const newCurrentItem = breadcrumbList.value[breadcrumbList.value.length - 1]
                currentParentId.value = newCurrentItem.favoriteId
                
                // 重置分页并加载上一级数据
                folderCurrentPage.value = 1
                outcomeCurrentPage.value = 1
                await loadCurrentLevelData(newCurrentItem.favoriteId)
            }
        }
        
        // 打开收藏夹
        const openFolder = async (folder) => {
            // 更新面包屑
            breadcrumbList.value.push({
                favoriteId: folder.favoriteId,
                name: folder.name
            })
            
            // 更新当前父级ID
            currentParentId.value = folder.favoriteId
            
            // 重置分页并加载子数据
            folderCurrentPage.value = 1
            outcomeCurrentPage.value = 1
            await loadCurrentLevelData(folder.favoriteId)
        }
        
        // 收藏夹操作
        const openCreateFolderDialog = () => {
            isEditFolder.value = false
            folderForm.value = { name: '' }
            folderDialogVisible.value = true
        }
        
        const editFolder = (folder) => {
            isEditFolder.value = true
            editingFolderId.value = folder.favoriteId
            folderForm.value = { name: folder.name }
            folderDialogVisible.value = true
        }
        
        const closeFolderDialog = () => {
            folderDialogVisible.value = false
            folderFormRef.value?.clearValidate()
        }
        
        const saveFolder = async () => {
            try {
                await folderFormRef.value.validate()
                
                if (isEditFolder.value) {
                    // 编辑收藏夹
                    const success = await updateFavorite({
                        favoriteId: editingFolderId.value,
                        name: folderForm.value.name
                    })
                    
                    if (success) {
                        callSuccess('收藏夹重命名成功')
                        closeFolderDialog()
                        // 重置分页并重新加载数据
                        folderCurrentPage.value = 1
                        outcomeCurrentPage.value = 1
                        await loadCurrentLevelData(currentParentId.value)
                    }
                } else {
                    // 创建收藏夹
                    const result = await createFavorite({
                        name: folderForm.value.name,
                        parentId: currentParentId.value
                    })
                    
                    if (result) {
                        callSuccess('收藏夹创建成功')
                        closeFolderDialog()
                        // 重置分页并重新加载数据
                        folderCurrentPage.value = 1
                        outcomeCurrentPage.value = 1
                        await loadCurrentLevelData(currentParentId.value)
                    } else {
                        callWarning('创建收藏夹失败')
                    }
                }
            } catch (error) {
                if (error) {
                    callWarning('请填写完整信息')
                }
            }
        }
        
        const deleteFolder = async (folderId) => {
            try {
                // 获取所有收藏夹数据用于检查层级关系
                const allFolders = await getAllFolders();
                
                // 检查收藏夹及其子收藏夹是否有订阅
                const hasSubscription = await checkFavoriteHasSubscription(folderId, allFolders)
                
                if (hasSubscription) {
                    // 如果有订阅，提示用户不能删除
                    await ElMessageBox.alert(
                        '该收藏夹或其子收藏夹已订阅了arXiv关键词或科研人员，无法删除。请先取消相关订阅后再删除收藏夹。',
                        '无法删除',
                        {
                            confirmButtonText: '确定',
                            type: 'warning'
                        }
                    )
                    return
                }
                
                // 如果没有订阅，继续删除流程
                await ElMessageBox.confirm('确定要删除这个收藏夹吗？删除后无法恢复。', '确认删除', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const success = await deleteFavorite(folderId)
                if (success) {
                    callSuccess('收藏夹删除成功')
                    // 重置分页并重新加载数据
                    folderCurrentPage.value = 1
                    outcomeCurrentPage.value = 1
                    await loadCurrentLevelData(currentParentId.value)
                }
            } catch (error) {
                // 如果是用户取消操作，不显示错误信息
                if (error !== 'cancel') {
                    callInfo('已取消删除')
                }
            }
        }
        
        // 分页处理
        const handlePageChange = async (page) => {
            folderCurrentPage.value = page
            await loadCurrentLevelData(currentParentId.value)
        }
        
        // 收藏夹分页处理
        const handleFolderPageChange = async (page) => {
            folderCurrentPage.value = page
            await loadFolders(currentParentId.value)
        }
        
        // 文献分页处理
        const handleOutcomePageChange = async (page) => {
            outcomeCurrentPage.value = page
            await loadOutcomes(currentParentId.value)
        }
        
        // 跳转到成果详情页
        const goToOutcomeDetail = (outcomeId) => {
            router.push(`/outcome-detail/${outcomeId}`)
        }
        
        // 移除文献
        const removeOutcome = async (outcomeId) => {
            try {
                await ElMessageBox.confirm('确定要从收藏夹中移除这个文献吗？', '确认移除', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const success = await removeOutcomeFromFavorite({
                    favoriteId: currentParentId.value,
                    outcomeId: outcomeId
                })
                
                if (success) {
                    callSuccess('文献移除成功')
                    // 重新加载数据
                    await loadOutcomes(currentParentId.value)
                }
            } catch {
                callInfo('已取消移除')
            }
        }
        
        // 新增：关键词搜索方法
        const onKeywordSearch = () => {
            outcomeCurrentPage.value = 1;
            loadOutcomes(currentParentId.value);
        };
        
        // 只允许上传PDF
        const beforePdfUpload = (file) => {
            const isPDF = file.type === 'application/pdf'
            if (!isPDF) {
                callWarning('只能上传PDF文件')
            }
            return isPDF
        }
        
        // 处理文件选择
        const handleFileChange = (fileObj) => {
            manualUploadForm.value.file = fileObj.raw
            manualUploadForm.value.fileList = [fileObj]
        }
        
        // 提交上传
        const handleManualUpload = () => {
            manualUploadFormRef.value.validate(async (valid) => {
                if (!valid) return
                manualUploadLoading.value = true
                try {
                    const { type, customTitle, customAuthors, customAbstract, journal, doi, publishDate, file } = manualUploadForm.value
                    const uploadResponse = await uploadPdfAndExtractMetadata(file, {
                        autoExtractMetadata: false,
                        type,
                        customTitle,
                        customAuthors,
                        customAbstract,
                        journal,
                        doi,
                        publishDate
                    })
                    console.log(uploadResponse)
                    const uploadResult = uploadResponse?.data?.data;
                    if (uploadResponse?.data?.code === 50001) {
                        // 库中已有类似成果
                        // 填充表单并禁用
                        manualUploadForm.value = {
                            type: uploadResult.type || '',
                            customTitle: uploadResult.title || '',
                            customAuthors: uploadResult.authors || '',
                            customAbstract: uploadResult.abstractContent || '',
                            journal: uploadResult.journal || '',
                            doi: uploadResult.doi || '',
                            publishDate: uploadResult.publishDate || '',
                            file: null,
                            fileList: []
                        }
                        formDisabled.value = true
                        duplicateInfo.value = uploadResult
                        duplicateTipVisible.value = true
                        manualUploadLoading.value = false
                        return
                    }
                    if (uploadResult && uploadResult.outcomeId) {
                        // 添加到当前收藏夹
                        const addResult = await addOutcomeToFavorite({
                            favoriteId: currentParentId.value,
                            outcomeId: uploadResult.outcomeId
                        })
                        if (addResult) {
                            callSuccess('文献上传并添加到收藏夹成功')
                            manualUploadDialogVisible.value = false
                            // 重置表单
                            manualUploadForm.value = {
                                type: '',
                                customTitle: '',
                                customAuthors: '',
                                customAbstract: '',
                                journal: '',
                                doi: '',
                                publishDate: '',
                                file: null,
                                fileList: []
                            }
                            formDisabled.value = false
                            duplicateTipVisible.value = false
                            // 刷新文献列表
                            await loadOutcomes(currentParentId.value)
                        }
                    }
                } catch (e) {
                    callWarning('上传失败，请重试')
                } finally {
                    manualUploadLoading.value = false
                }
            })
        }
        
        // 切换到上传tab
        const proceedToUpload = () => {
            if (termsAgreed.value) uploadActiveTab.value = 'upload'
        }
        
        // 打开弹窗时重置tab
        watch(manualUploadDialogVisible, (val) => {
            if (val) {
                uploadActiveTab.value = 'terms'
                termsAgreed.value = false
            }
        })
        
        // 关闭上传弹窗时重置所有状态
        const resetManualUploadDialog = () => {
            manualUploadDialogVisible.value = false
            manualUploadForm.value = {
                type: '',
                customTitle: '',
                customAuthors: '',
                customAbstract: '',
                journal: '',
                doi: '',
                publishDate: '',
                file: null,
                fileList: []
            }
            formDisabled.value = false
            duplicateTipVisible.value = false
            duplicateInfo.value = ''
            uploadActiveTab.value = 'terms'
            termsAgreed.value = false
            manualUploadLoading.value = false
            // 清除校验
            manualUploadFormRef.value?.clearValidate?.()
        }
        
        // 组件挂载时加载数据
        onMounted(() => {
            loadCurrentLevelData(0)
        })
        
        return {
            currentParentId,
            breadcrumbList,
            folderCurrentPage,
            folderPageSize,
            folders,
            total,
            loading,
            currentPageFolders,
            folderDialogVisible,
            isEditFolder,
            folderFormRef,
            folderForm,
            folderRules,
            navigateToBreadcrumb,
            backToParentFolder,
            openFolder,
            openCreateFolderDialog,
            editFolder,
            closeFolderDialog,
            saveFolder,
            deleteFolder,
            handleFolderPageChange,
            outcomes,
            outcomesTotal,
            loadingOutcomes,
            currentPageOutcomes,
            outcomeCurrentPage,
            outcomePageSize,
            formatType,
            formatDate,
            loadOutcomes,
            removeOutcome,
            handleOutcomePageChange,
            goToOutcomeDetail,
            createFolderTooltip,
            uploadPdfTooltip,
            keyword,
            onKeywordSearch,
            manualUploadDialogVisible,
            manualUploadLoading,
            manualUploadFormRef,
            manualUploadForm,
            manualUploadRules,
            beforePdfUpload,
            handleFileChange,
            handleManualUpload,
            uploadActiveTab,
            termsAgreed,
            proceedToUpload,
            formDisabled,
            duplicateInfo,
            duplicateTipVisible,
            resetManualUploadDialog,
        }
    }
}
</script>

<style scoped>
.library-manager {
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
    align-items: flex-start;
    margin-bottom: 10px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f2f5;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.header-actions {
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

.breadcrumb-container {
    margin-bottom: 15px;
    padding: 10px 0;
}

.breadcrumb {
    font-family: 'Meiryo', sans-serif;
    line-height: 1.5;
}

.breadcrumb .clickable {
    cursor: pointer;
    color: #409eff;
}

.breadcrumb .clickable:hover {
    color: #66b1ff;
}

.loading-state {
    text-align: center;
    color: #999;
    padding: 40px;
    font-size: 14px;
}

.loading-state .el-icon {
    margin-right: 8px;
    font-size: 16px;
}

.empty-state {
    text-align: center;
    color: #999;
    padding: 40px;
    font-size: 14px;
}

/* 收藏夹网格布局 */
.folders-grid {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

/* 文献网格布局 */
.outcomes-grid {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

/* 文献卡片样式 */
.outcome-item {
    display: flex;
    align-items: center;
    padding: 20px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    margin-bottom: 15px;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.outcome-item:hover {
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    transform: translateY(-2px);
}

.outcome-icon {
    margin-right: 15px;
    color: #409eff;
    font-size: 24px;
}

.outcome-info {
    flex: 1;
    min-width: 0;
}

.outcome-title {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    text-align: left;
    word-wrap: break-word;
    word-break: break-all;
    max-width: 100%;
}

.outcome-authors {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    text-align: left;
    word-wrap: break-word;
    word-break: break-all;
    max-width: 100%;
    line-height: 1.3;
}

.outcome-meta {
    display: flex;
    gap: 15px;
    font-size: 12px;
    color: #909399;
    align-items: center;
    text-align: left;
    flex-wrap: wrap;
    line-height: 1.4;
}

.outcome-type {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    color: white;
    white-space: nowrap;
    background-color: #909399; /* 默认背景色 */
}

.outcome-type[data-type="论文"] {
    background-color: #67c23a;
}

.outcome-type[data-type="期刊"] {
    background-color: #409eff;
}

.outcome-type[data-type="会议"] {
    background-color: #e6a23c;
}

.outcome-type[data-type="会议论文"] {
    background-color: #409eff;
}

.outcome-type[data-type="专利"] {
    background-color: #f56c6c;
}

.outcome-type[data-type="书籍"] {
    background-color: #909399;
}

.outcome-type[data-type="章节"] {
    background-color: #8e44ad;
}

.outcome-type[data-type="数据"] {
    background-color: #1abc9c;
}

.outcome-type[data-type="技术报告"] {
    background-color: #8e44ad;
}

.outcome-type[data-type="海报"] {
    background-color: #e67e22;
}

.outcome-type[data-type="其他"] {
    background-color: #95a5a6;
}

.outcome-journal {
    font-style: italic;
    text-align: left;
}

.outcome-date {
    text-align: left;
}

.outcome-subscribed {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: #f0f9ff;
    color: #0369a1;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid #bae6fd;
}

.outcome-subscribed .el-icon {
    font-size: 10px;
    color: #f59e0b;
}

.outcome-actions {
    margin-left: 15px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.outcome-item:hover .outcome-actions {
    opacity: 1;
}

/* 查看文献按钮样式 */
.view-outcomes-btn {
    font-family: 'Meiryo', sans-serif;
    padding: 8px 12px;
}

.view-outcomes-btn:hover {
    background-color: rgba(103, 194, 58, 0.1);
}

/* 收藏夹卡片样式 */
.folder-item {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.folder-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    transform: translateY(-2px);
}

.folder-icon {
    font-size: 32px;
    color: #409eff;
    margin-right: 15px;
}

.folder-info {
    flex: 1;
    min-width: 0;
}

.folder-name {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-all;
    max-width: 100%;
    line-height: 1.3;
}

.folder-stats {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #8e8e8e;
}

.folder-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.folder-item:hover .folder-actions {
    opacity: 1;
}

/* 分页样式 */
.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 对话框样式 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* 分区域样式 */
.folders-section, .outcomes-section {
    margin-bottom: 30px;
}

.section-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #f0f2f5;
    position: relative;
}

.section-title::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background-color: #409eff;
}

.outcomes-section .section-title::after {
    background-color: #67c23a;
}

.custom-upload {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    max-width: 500px;
}
/* 美化el-upload拖拽区域 */
.custom-upload .el-upload-dragger {
    width: 100%;
    height: 50px;
    border-radius: 12px;
    background: #f8fafc;
    border: 2px dashed #b3c0d1;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;
    margin-bottom: 8px;
}
.custom-upload .el-upload-dragger:hover {
    border-color: #409eff;
    background: #f0f6ff;
}
.custom-upload .el-upload__text {
    font-size: 15px;
    color: #606266;
    margin-left: 8px;
}
.custom-upload .el-icon--upload {
    font-size: 28px;
    color: #409eff;
}

/* outcome-detail版权与隐私确认tab样式复刻 */
.terms-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 10px;
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}
.terms-container h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 12px;
  font-weight: 600;
  position: relative;
}
.terms-container h3:after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
}
.terms-section {
  margin-bottom: 25px;
  text-align: left;
  padding: 0 5px;
}
.terms-section h4 {
  font-size: 16px;
  color: #409eff;
  margin-bottom: 12px;
  font-weight: 600;
  border-left: 4px solid #409eff;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
}
.terms-section h4 i {
  margin-right: 8px;
  font-size: 18px;
}
.terms-subsection h5 {
  font-size: 14px;
  color: #606266;
  margin: 12px 0 8px;
  font-weight: 600;
  border-left: 3px solid #67c23a;
  padding-left: 8px;
}
.terms-quote {
  background-color: #f8f9fa;
  border-left: 4px solid #409eff;
  padding: 12px;
  margin: 10px 0;
  font-style: italic;
  color: #606266;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.terms-container ul, .terms-container ol {
  padding-left: 20px;
  margin: 10px 0;
  line-height: 1.6;
}
.terms-container li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #606266;
  position: relative;
}
.terms-container ul li {
  list-style-type: none;
  padding-left: 5px;
}
.terms-container ul li:before {
  content: "•";
  color: #409eff;
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
  font-size: 16px;
}
.terms-container ol li {
  list-style-type: decimal;
  padding-left: 5px;
}
.terms-agreement {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  border: 1px dashed #dcdfe6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}
.terms-agreement:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}
.terms-agreement .el-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}
.terms-agreement .el-checkbox__label {
  font-weight: 500;
}
.terms-tab-pane {
  padding: 5px;
}
</style> 