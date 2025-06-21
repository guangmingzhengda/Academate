<template>
    <div class="library-manager">
        <div class="section-card">
            <!-- 收藏夹视图 -->
            <div v-if="currentView === 'folders'" class="folders-view">
                <div class="card-header">
                    <h3>文献库</h3>
                    <el-button type="primary" @click="openCreateFolderDialog">
                        <el-icon><Plus /></el-icon>
                        新建收藏夹
                    </el-button>
                </div>
                
                <div class="card-content">
                    <div v-if="folders.length === 0" class="empty-state">
                        暂无收藏夹，点击右上角按钮创建收藏夹
                    </div>
                    
                    <div v-else class="folders-grid">
                        <div 
                            v-for="folder in currentPageFolders" 
                            :key="folder.id" 
                            class="folder-item"
                            @click="openFolder(folder)"
                        >
                            <div class="folder-icon">
                                <el-icon><Folder /></el-icon>
                            </div>
                            <div class="folder-info">
                                <div class="folder-name">{{ folder.name }}</div>
                                <div class="folder-desc">{{ folder.description }}</div>
                                <div class="folder-stats">
                                    <span class="paper-count">{{ folder.papers.length }} 篇文献</span>
                                    <span class="create-time">{{ folder.createTime }}</span>
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
                                                编辑
                                            </el-dropdown-item>
                                            <el-dropdown-item @click="deleteFolder(folder.id)" divided>
                                                <el-icon><Delete /></el-icon>
                                                删除
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 收藏夹分页 -->
                    <el-pagination
                        v-if="folders.length > folderPageSize"
                        v-model:current-page="folderCurrentPage"
                        :page-size="folderPageSize"
                        :total="folders.length"
                        layout="prev, pager, next"
                        class="pagination"
                        small
                        @current-change="handleFolderPageChange"
                    />
                </div>
            </div>

            <!-- 文献列表视图 -->
            <div v-else class="papers-view">
                <div class="card-header">
                    <div class="header-left">
                        <el-button type="text" @click="backToFolders" class="back-button">
                            <el-icon><ArrowLeft /></el-icon>
                            返回收藏夹
                        </el-button>
                        <h3>{{ currentFolder.name }}</h3>
                    </div>
                    <el-button type="primary" @click="openAddPaperDialog">
                        <el-icon><Plus /></el-icon>
                        添加文献
                    </el-button>
                </div>
                
                <div class="card-content">
                    <div v-if="currentFolder.papers.length === 0" class="empty-state">
                        该收藏夹暂无文献，点击右上角按钮添加文献
                    </div>
                    
                    <div v-else class="papers-list">
                        <div 
                            v-for="paper in currentPagePapers" 
                            :key="paper.id" 
                            class="paper-item"
                        >
                            <div class="paper-info">
                                <div class="paper-title">{{ paper.title }}</div>
                                <div class="paper-authors">{{ paper.authors }}</div>
                                <div class="paper-meta">
                                    <span class="paper-journal">{{ paper.journal }}</span>
                                    <span class="paper-year">{{ paper.year }}</span>
                                    <span v-if="paper.doi" class="paper-doi">DOI: {{ paper.doi }}</span>
                                </div>
                                <div class="paper-tags">
                                    <span v-for="tag in paper.tags" :key="tag" class="paper-tag">
                                        {{ tag }}
                                    </span>
                                </div>
                            </div>
                            <div class="paper-actions">
                                <el-button type="primary" plain size="small" @click="viewPaper(paper)">
                                    查看详情
                                </el-button>
                                <el-button type="danger" plain size="small" @click="removePaper(paper.id)">
                                    移除
                                </el-button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 文献分页 -->
                    <el-pagination
                        v-if="currentFolder.papers && currentFolder.papers.length > paperPageSize"
                        v-model:current-page="paperCurrentPage"
                        :page-size="paperPageSize"
                        :total="currentFolder.papers.length"
                        layout="prev, pager, next"
                        class="pagination"
                        small
                        @current-change="handlePaperPageChange"
                    />
                </div>
            </div>
        </div>

        <!-- 创建/编辑收藏夹对话框 -->
        <el-dialog 
            v-model="folderDialogVisible" 
            :title="isEditFolder ? '编辑收藏夹' : '创建收藏夹'"
            width="500px"
        >
            <el-form :model="folderForm" :rules="folderRules" ref="folderFormRef" label-width="80px">
                <el-form-item label="名称" prop="name">
                    <el-input v-model="folderForm.name" placeholder="请输入收藏夹名称" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input 
                        v-model="folderForm.description" 
                        type="textarea" 
                        :rows="3"
                        placeholder="请输入收藏夹描述"
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

        <!-- 添加文献对话框 -->
        <el-dialog 
            v-model="paperDialogVisible" 
            title="添加文献"
            width="600px"
        >
            <el-form :model="paperForm" :rules="paperRules" ref="paperFormRef" label-width="80px">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="paperForm.title" placeholder="请输入文献标题" />
                </el-form-item>
                <el-form-item label="作者" prop="authors">
                    <el-input v-model="paperForm.authors" placeholder="请输入作者，多个作者用逗号分隔" />
                </el-form-item>
                <el-form-item label="期刊" prop="journal">
                    <el-input v-model="paperForm.journal" placeholder="请输入期刊名称" />
                </el-form-item>
                <el-form-item label="年份" prop="year">
                    <el-input v-model="paperForm.year" placeholder="请输入发表年份" />
                </el-form-item>
                <el-form-item label="DOI" prop="doi">
                    <el-input v-model="paperForm.doi" placeholder="请输入DOI（可选）" />
                </el-form-item>
                <el-form-item label="标签" prop="tags">
                    <el-input v-model="paperForm.tagsInput" placeholder="请输入标签，多个标签用逗号分隔" />
                </el-form-item>
            </el-form>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closePaperDialog">取消</el-button>
                    <el-button type="primary" @click="savePaper">保存</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Plus, Folder, MoreFilled, Edit, Delete, ArrowLeft } from '@element-plus/icons-vue'
import { callSuccess, callInfo, callWarning } from '@/call'
import { ElMessageBox } from 'element-plus'

export default {
    name: 'libraryManager',
    setup() {
        // 视图状态
        const currentView = ref('folders') // 'folders' 或 'papers'
        const currentFolder = ref({})
        
        // 分页相关
        const folderCurrentPage = ref(1)
        const folderPageSize = ref(6)
        const paperCurrentPage = ref(1)
        const paperPageSize = ref(5)
        
        // 收藏夹数据
        const folders = ref([
            {
                id: 1,
                name: '机器学习',
                description: '收集机器学习相关的经典论文和最新研究',
                createTime: '2023-01-15',
                papers: [
                    {
                        id: 1,
                        title: 'Attention Is All You Need',
                        authors: 'Vaswani, A., Shazeer, N., Parmar, N., et al.',
                        journal: 'Advances in Neural Information Processing Systems',
                        year: '2017',
                        doi: '10.48550/arXiv.1706.03762',
                        tags: ['Transformer', 'Attention', 'NLP']
                    },
                    {
                        id: 2,
                        title: 'Deep Residual Learning for Image Recognition',
                        authors: 'He, K., Zhang, X., Ren, S., Sun, J.',
                        journal: 'Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition',
                        year: '2016',
                        doi: '10.1109/CVPR.2016.90',
                        tags: ['ResNet', 'CNN', 'Computer Vision']
                    }
                ]
            },
            {
                id: 2,
                name: '计算机视觉',
                description: '计算机视觉领域的重要论文集合',
                createTime: '2023-02-20',
                papers: [
                    {
                        id: 3,
                        title: 'You Only Look Once: Unified, Real-Time Object Detection',
                        authors: 'Redmon, J., Divvala, S., Girshick, R., Farhadi, A.',
                        journal: 'Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition',
                        year: '2016',
                        doi: '10.1109/CVPR.2016.91',
                        tags: ['YOLO', 'Object Detection', 'Real-time']
                    }
                ]
            },
            {
                id: 3,
                name: '自然语言处理',
                description: 'NLP领域的前沿研究论文',
                createTime: '2023-03-10',
                papers: []
            },
            {
                id: 4,
                name: '深度学习理论',
                description: '深度学习理论基础相关文献',
                createTime: '2023-04-05',
                papers: [
                    {
                        id: 4,
                        title: 'Deep Learning',
                        authors: 'Goodfellow, I., Bengio, Y., Courville, A.',
                        journal: 'MIT Press',
                        year: '2016',
                        doi: '',
                        tags: ['Deep Learning', 'Theory', 'Book']
                    }
                ]
            }
        ])
        
        // 对话框状态
        const folderDialogVisible = ref(false)
        const paperDialogVisible = ref(false)
        const isEditFolder = ref(false)
        const editingFolderId = ref(null)
        
        // 表单数据
        const folderFormRef = ref()
        const paperFormRef = ref()
        const folderForm = ref({
            name: '',
            description: ''
        })
        const paperForm = ref({
            title: '',
            authors: '',
            journal: '',
            year: '',
            doi: '',
            tagsInput: ''
        })
        
        // 表单验证规则
        const folderRules = {
            name: [
                { required: true, message: '请输入收藏夹名称', trigger: 'blur' }
            ]
        }
        const paperRules = {
            title: [
                { required: true, message: '请输入文献标题', trigger: 'blur' }
            ],
            authors: [
                { required: true, message: '请输入作者', trigger: 'blur' }
            ]
        }
        
        // 计算属性
        const currentPageFolders = computed(() => {
            const start = (folderCurrentPage.value - 1) * folderPageSize.value
            const end = start + folderPageSize.value
            return folders.value.slice(start, end)
        })
        
        const currentPagePapers = computed(() => {
            if (!currentFolder.value.papers) return []
            const start = (paperCurrentPage.value - 1) * paperPageSize.value
            const end = start + paperPageSize.value
            return currentFolder.value.papers.slice(start, end)
        })
        
        // 收藏夹操作
        const openCreateFolderDialog = () => {
            isEditFolder.value = false
            folderForm.value = { name: '', description: '' }
            folderDialogVisible.value = true
        }
        
        const editFolder = (folder) => {
            isEditFolder.value = true
            editingFolderId.value = folder.id
            folderForm.value = { ...folder }
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
                    const index = folders.value.findIndex(f => f.id === editingFolderId.value)
                    if (index > -1) {
                        folders.value[index] = {
                            ...folders.value[index],
                            ...folderForm.value
                        }
                        callSuccess('收藏夹更新成功')
                    }
                } else {
                    // 创建收藏夹
                    const newFolder = {
                        ...folderForm.value,
                        id: Date.now(),
                        createTime: new Date().toISOString().split('T')[0],
                        papers: []
                    }
                    folders.value.unshift(newFolder)
                    callSuccess('收藏夹创建成功')
                }
                
                closeFolderDialog()
            } catch {
                callWarning('请填写完整信息')
            }
        }
        
        const deleteFolder = async (folderId) => {
            try {
                await ElMessageBox.confirm('确定要删除这个收藏夹吗？删除后无法恢复。', '确认删除', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const index = folders.value.findIndex(f => f.id === folderId)
                if (index > -1) {
                    folders.value.splice(index, 1)
                    callSuccess('收藏夹删除成功')
                }
            } catch {
                callInfo('已取消删除')
            }
        }
        
        const openFolder = (folder) => {
            currentFolder.value = folder
            currentView.value = 'papers'
            paperCurrentPage.value = 1
        }
        
        const backToFolders = () => {
            currentView.value = 'folders'
            currentFolder.value = {}
        }
        
        // 文献操作
        const openAddPaperDialog = () => {
            paperForm.value = {
                title: '',
                authors: '',
                journal: '',
                year: '',
                doi: '',
                tagsInput: ''
            }
            paperDialogVisible.value = true
        }
        
        const closePaperDialog = () => {
            paperDialogVisible.value = false
            paperFormRef.value?.clearValidate()
        }
        
        const savePaper = async () => {
            try {
                await paperFormRef.value.validate()
                
                const newPaper = {
                    ...paperForm.value,
                    id: Date.now(),
                    tags: paperForm.value.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
                }
                delete newPaper.tagsInput
                
                currentFolder.value.papers.unshift(newPaper)
                callSuccess('文献添加成功')
                closePaperDialog()
            } catch {
                callWarning('请填写完整信息')
            }
        }
        
        const removePaper = async (paperId) => {
            try {
                await ElMessageBox.confirm('确定要从收藏夹中移除这篇文献吗？', '确认移除', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const index = currentFolder.value.papers.findIndex(p => p.id === paperId)
                if (index > -1) {
                    currentFolder.value.papers.splice(index, 1)
                    callSuccess('文献移除成功')
                }
            } catch {
                callInfo('已取消移除')
            }
        }
        
        const viewPaper = (paper) => {
            callInfo(`查看文献：${paper.title}`)
        }
        
        // 分页处理
        const handleFolderPageChange = (page) => {
            folderCurrentPage.value = page
        }
        
        const handlePaperPageChange = (page) => {
            paperCurrentPage.value = page
        }
        
        return {
            currentView,
            currentFolder,
            folderCurrentPage,
            folderPageSize,
            paperCurrentPage,
            paperPageSize,
            folders,
            currentPageFolders,
            currentPagePapers,
            folderDialogVisible,
            paperDialogVisible,
            isEditFolder,
            folderFormRef,
            paperFormRef,
            folderForm,
            paperForm,
            folderRules,
            paperRules,
            openCreateFolderDialog,
            editFolder,
            closeFolderDialog,
            saveFolder,
            deleteFolder,
            openFolder,
            backToFolders,
            openAddPaperDialog,
            closePaperDialog,
            savePaper,
            removePaper,
            viewPaper,
            handleFolderPageChange,
            handlePaperPageChange
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

.folder-item {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.folder-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.folder-icon {
    font-size: 32px;
    color: #409eff;
    margin-right: 15px;
}

.folder-info {
    flex: 1;
}

.folder-name {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
    text-align: left;
}

.folder-desc {
    font-family: 'Meiryo', sans-serif;
    font-size: 13px;
    color: #666;
    margin-bottom: 8px;
    text-align: left;
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
}

/* 文献列表样式 */
.papers-list {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.paper-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.paper-item:hover {
    background-color: #e3f2fd;
    border-color: #409eff;
}

.paper-info {
    flex: 1;
    margin-right: 20px;
}

.paper-title {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 6px;
    text-align: left;
    line-height: 1.3;
}

.paper-authors {
    font-family: 'Meiryo', sans-serif;
    font-size: 13px;
    color: #666;
    margin-bottom: 6px;
    text-align: left;
}

.paper-meta {
    display: flex;
    gap: 15px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.paper-journal,
.paper-year,
.paper-doi {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #8e8e8e;
}

.paper-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.paper-tag {
    background-color: rgba(64, 158, 255, 0.1);
    color: #409eff;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid rgba(64, 158, 255, 0.3);
}

.paper-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
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

/* 响应式设计 */
@media (max-width: 768px) {
    .paper-item {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }
    
    .paper-actions {
        width: 100%;
        flex-direction: row;
        align-items: flex-start;
    }
}
</style> 