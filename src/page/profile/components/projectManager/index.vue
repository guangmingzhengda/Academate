<template>
    <div class="project-manager">
        <div class="manager-card">
            <div class="card-header">
                <h3>参与项目</h3>
                <el-button v-if="isOwnProfile" type="primary" @click="openAddDialog">
                    <el-icon><Plus /></el-icon>
                    创建项目
                </el-button>
            </div>
            
            <div class="card-content">
                <div v-if="projects.length === 0" class="empty-state project-empty-center">
                    暂无项目数据
                </div>
                
                <div v-else class="project-list">
                    <div 
                        v-for="project in currentPageProjects" 
                        :key="project.id" 
                        class="project-item"
                        @click="goToProjectDetail(project)"
                        style="cursor: pointer;"
                    >
                        <div class="project-info">
                            <div class="project-title">{{ project.name }}</div>
                            <div class="project-desc">{{ project.description }}</div>
                            <div class="project-meta">
                                <div class="meta-row">
                                    <span class="meta-item">创建时间：{{ (project.startDate + '').slice(0, 10) }}</span>
                                    <span class="meta-item">状态：{{ statusMap[project.status] || project.status }}</span>
                                </div>
                                <div class="meta-row">
                                    <span class="meta-item">身份：{{ roleMap[project.leader] || project.leader }}</span>
                                    <span v-if="project.endDate" class="meta-item">结束时间：{{ project.endDate }}</span>
                                    <span class="meta-item">
                                        <el-tag :type="project.isPublic ? 'success' : 'warning'" size="small">
                                            {{ project.isPublic ? '公开' : '私密' }}
                                        </el-tag>
                                    </span>
                                </div>
                            </div>
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
                    <el-input 
                        v-model="formData.name" 
                        placeholder="请输入项目名称" 
                        @input="onNameInput"
                    />
                    <div style="text-align:right;color:#999;font-size:12px;">
                        {{ nameWordCount }} / 50 字/单词
                    </div>
                </el-form-item>
                <el-form-item label="项目描述" prop="description">
                    <el-input 
                        v-model="formData.description" 
                        type="textarea" 
                        :rows="3"
                        placeholder="请输入项目描述"
                        @input="onDescInput"
                    />
                    <div style="text-align:right;color:#999;font-size:12px;">
                        {{ descWordCount }} / 200 字/单词
                    </div>
                </el-form-item>
                <el-form-item label="私密设置" prop="isPublic">
                    <el-switch
                        v-model="formData.isPublic"
                        active-text="公开"
                        inactive-text="私密"
                        :active-value="true"
                        :inactive-value="false"
                    />
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
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { callSuccess, callWarning, callInfo } from '@/call'
import { ElMessageBox } from 'element-plus'
import { create_project, get_user_projects } from '@/api/project'
import store from '@/store'
import { useRouter } from 'vue-router'

export default {
    name: 'projectManager',
    props: {
        userId: {
            type: Number,
            required: true
        },
        isOwnProfile: {
            type: Boolean,
            default: false
        }
    },
    setup(props) {
        const router = useRouter()
        
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(2)
        
        // 项目数据
        const projects = ref([])

        // 拉取项目数据
        const fetchProjects = async () => {
            if (!props.userId) return;
            const res = await get_user_projects(props.userId);
            // 格式化字段
            projects.value = (res || []).map(item => ({
                id: item.projectId,
                name: item.title,
                description: item.description,
                startDate: item.startDate,
                endDate: item.endDate,
                status: item.status,
                leader: item.role,
                joinedAt: item.joinedAt,
                isPublic: item.isPublic !== undefined ? item.isPublic : true
            }));
        }

        onMounted(fetchProjects);
        watch(() => props.userId, fetchProjects);

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
            leader: '',
            isPublic: true
        })

        // 表单验证规则
        const nameWordCount = computed(() => {
            const val = formData.value.name || ''
            const cn = (val.match(/[\u4e00-\u9fa5]/g) || []).length
            const en = (val.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean) || []).length
            return cn + en
        })
        const descWordCount = computed(() => {
            const val = formData.value.description || ''
            const cn = (val.match(/[\u4e00-\u9fa5]/g) || []).length
            const en = (val.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean) || []).length
            return cn + en
        })
        const onNameInput = () => {
            formRef.value && formRef.value.validateField && formRef.value.validateField('name')
        }
        const onDescInput = () => {
            formRef.value && formRef.value.validateField && formRef.value.validateField('description')
        }
        const rules = {
            name: [
                { required: true, message: '请输入项目名称', trigger: 'blur' },
                { validator: (rule, value, callback) => {
                    const val = value || ''
                    const cn = (val.match(/[\u4e00-\u9fa5]/g) || []).length
                    const en = (val.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean) || []).length
                    if (cn + en > 50) {
                        callback(new Error('项目名称不能超过50字/单词'))
                    } else {
                        callback()
                    }
                }, trigger: 'blur' }
            ],
            description: [
                { required: true, message: '请输入项目描述', trigger: 'blur' },
                { validator: (rule, value, callback) => {
                    const val = value || ''
                    const cn = (val.match(/[\u4e00-\u9fa5]/g) || []).length
                    const en = (val.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean) || []).length
                    if (cn + en > 200) {
                        callback(new Error('项目描述不能超过200字/单词'))
                    } else {
                        callback()
                    }
                }, trigger: 'blur' }
            ]
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
                isPublic: true
            }
            dialogVisible.value = true
        }

        // 编辑项目
        const editProject = (project) => {
            isEdit.value = true
            editingId.value = project.id
            formData.value = { ...project, isPublic: project.isPublic }
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
                    // 编辑项目
                    const index = projects.value.findIndex(p => p.id === editingId.value)
                    if (index > -1) {
                        projects.value[index] = { ...formData.value, id: editingId.value }
                        callSuccess('更新成功')
                    }
                } else {
                    // 创建新项目 - 对接后端API
                    const userId = store.getters.getId
                    
                    if (!userId) {
                        callWarning('获取用户信息失败，请重新登录')
                        return
                    }
                    
                    const projectData = {
                        title: formData.value.name,
                        description: formData.value.description,
                        creatorId: userId,
                        isPublic: formData.value.isPublic
                    }
                    
                    const success = await create_project(projectData)
                    
                    if (success) {
                        // API调用成功，重新获取项目列表以确保数据一致性
                        await fetchProjects()
                        callSuccess('项目创建成功')
                    } else {
                        callWarning('项目创建失败，请重试')
                        return
                    }
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

        // 跳转到项目详情
        const goToProjectDetail = (project) => {
            router.push(`/project-detail/${project.id}`)
        }

        // 角色映射
        const roleMap = {
            'creator': '创建者',
            'participant': '参与者'
        }

        const statusMap = {
            'In Progress': '进行中',
            'Completed': '已完成'
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
            handlePageChange,
            goToProjectDetail,
            roleMap,
            nameWordCount,
            descWordCount,
            onNameInput,
            onDescInput,
            statusMap
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
    color: #5c5c5c;
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

.project-empty-center {
    text-align: center;
    color: #a1a1a1;
    font-size: 18px;
    font-weight: 500;
    padding: 40px 0;
}
</style> 