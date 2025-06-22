<template>
    <div class="project-manager">
        <div class="manager-card">
            <div class="card-header">
                <h3>个人项目</h3>
                <el-button type="primary" @click="openAddDialog">
                    <el-icon><Plus /></el-icon>
                    添加项目
                </el-button>
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
                        <div class="project-actions">
                            <el-button type="primary" link @click="editProject(project)">
                                <el-icon><Edit /></el-icon>
                                编辑
                            </el-button>
                            <el-button type="danger" link @click="deleteProject(project.id)">
                                <el-icon><Delete /></el-icon>
                                删除
                            </el-button>
                        </div>
                    </div>
                </div>
                
                <!-- 分页 -->
                <el-pagination
                    v-if="projects.length > pageSize"
                    v-model:current-page="currentPage"
                    :page-size="pageSize"
                    :total="projects.length"
                    layout="prev, pager, next, jumper, total"
                    class="pagination"
                    small
                    @current-change="handlePageChange"
                />
            </div>
        </div>

        <!-- 添加/编辑项目对话框 -->
        <el-dialog 
            v-model="dialogVisible" 
            title=""
            width="600px"
        >
            <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
                <el-form-item label="项目名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入项目名称" />
                </el-form-item>
                <el-form-item label="项目描述" prop="description">
                    <el-input 
                        v-model="formData.description" 
                        type="textarea" 
                        :rows="3"
                        placeholder="请输入项目描述"
                    />
                </el-form-item>
                <el-form-item label="开始时间" prop="startDate">
                    <el-date-picker
                        v-model="formData.startDate"
                        type="date"
                        placeholder="选择开始时间"
                        style="width: 100%;"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>
                <el-form-item label="结束时间" prop="endDate">
                    <el-date-picker
                        v-model="formData.endDate"
                        type="date"
                        placeholder="选择结束时间"
                        style="width: 100%;"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>
                <el-form-item label="项目状态" prop="status">
                    <el-select v-model="formData.status" placeholder="请选择项目状态" style="width: 100%;">
                        <el-option label="进行中" value="进行中" />
                        <el-option label="已完成" value="已完成" />
                        <el-option label="已暂停" value="已暂停" />
                        <el-option label="已取消" value="已取消" />
                    </el-select>
                </el-form-item>
                <el-form-item label="项目负责人" prop="leader">
                    <el-input v-model="formData.leader" placeholder="请输入项目负责人" />
                </el-form-item>
            </el-form>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeDialog">取消</el-button>
                    <el-button type="primary" @click="saveProject">保存</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { callSuccess, callWarning, callInfo } from '@/call'
import { ElMessageBox } from 'element-plus'

export default {
    name: 'projectManager',
    setup() {
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(2)
        
        // 项目数据
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
            }
        ])

        // 对话框相关
        const dialogVisible = ref(false)
        const isEdit = ref(false)
        const formRef = ref()
        const editingId = ref(null)
        
        // 表单数据
        const formData = ref({
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            status: '',
            leader: ''
        })

        // 表单验证规则
        const rules = {
            name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
            description: [{ required: true, message: '请输入项目描述', trigger: 'blur' }],
            startDate: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
            status: [{ required: true, message: '请选择项目状态', trigger: 'change' }],
            leader: [{ required: true, message: '请输入项目负责人', trigger: 'blur' }]
        }

        // 当前页项目数据
        const currentPageProjects = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return projects.value.slice(start, end)
        })

        // 打开添加对话框
        const openAddDialog = () => {
            isEdit.value = false
            formData.value = {
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                status: '',
                leader: 'HHH'
            }
            dialogVisible.value = true
        }

        // 编辑项目
        const editProject = (project) => {
            isEdit.value = true
            editingId.value = project.id
            formData.value = { ...project }
            dialogVisible.value = true
        }

        // 删除项目
        const deleteProject = async (id) => {
            try {
                await ElMessageBox.confirm('确定要删除这个项目吗？', '确认删除', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                
                const index = projects.value.findIndex(p => p.id === id)
                if (index > -1) {
                    projects.value.splice(index, 1)
                    callSuccess('删除成功')
                }
            } catch {
                callInfo('已取消删除')
            }
        }

        // 保存项目
        const saveProject = async () => {
            try {
                await formRef.value.validate()
                
                if (isEdit.value) {
                    // 编辑
                    const index = projects.value.findIndex(p => p.id === editingId.value)
                    if (index > -1) {
                        projects.value[index] = { ...formData.value, id: editingId.value }
                        callSuccess('更新成功')
                    }
                } else {
                    // 添加
                    const newProject = {
                        ...formData.value,
                        id: Date.now() // 简单的ID生成
                    }
                    projects.value.unshift(newProject)
                    callSuccess('添加成功')
                }
                
                closeDialog()
            } catch {
                callWarning('请填写完整信息')
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

        return {
            currentPage,
            pageSize,
            projects,
            currentPageProjects,
            dialogVisible,
            isEdit,
            formRef,
            formData,
            rules,
            openAddDialog,
            editProject,
            deleteProject,
            saveProject,
            closeDialog,
            handlePageChange
        }
    }
}
</script>

<style scoped>
.project-manager {
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

.project-actions {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: flex-end;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-start;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .project-item {
        flex-direction: column;
        gap: 15px;
    }
    
    .project-actions {
        flex-direction: row;
        align-items: center;
        width: 100%;
        justify-content: flex-end;
    }
}
</style> 