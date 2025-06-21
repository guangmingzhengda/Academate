<template>
    <div class="achievement-manager">
        <div class="manager-card">
            <div class="card-header">
                <h3>学术成果</h3>
                <el-button type="primary" @click="openAddDialog">
                    <el-icon><Plus /></el-icon>
                    添加成果
                </el-button>
            </div>
            
            <div class="card-content">
                <div v-if="achievements.length === 0" class="empty-state">
                    暂无学术成果数据
                </div>
                
                <div v-else class="achievement-list">
                    <div 
                        v-for="achievement in currentPageAchievements" 
                        :key="achievement.id" 
                        class="achievement-item"
                    >
                        <div class="achievement-info">
                            <div class="achievement-header">
                                <div class="title-type-row">
                                    <span class="achievement-type-tag" :class="achievement.type">
                                        {{ typeLabels[achievement.type] }}
                                    </span>
                                    <div class="achievement-title">{{ achievement.title }}</div>
                                </div>
                                <div class="achievement-actions">
                                    <el-button type="primary" link @click="editAchievement(achievement)">
                                        <el-icon><Edit /></el-icon>
                                        编辑
                                    </el-button>
                                    <el-button type="danger" link @click="deleteAchievement(achievement.id)">
                                        <el-icon><Delete /></el-icon>
                                        删除
                                    </el-button>
                                </div>
                            </div>
                            <div class="achievement-meta">
                                <div class="meta-row">
                                    <span class="meta-label">作者：</span>
                                    <span class="meta-value">{{ achievement.authors || '暂无' }}</span>
                                    <span v-if="achievement.publishDate" class="meta-label">发表时间：</span>
                                    <span v-if="achievement.publishDate" class="meta-value">{{ achievement.publishDate }}</span>
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

        <!-- 添加/编辑学术成果对话框 -->
        <el-dialog 
            v-model="dialogVisible" 
            :title="isEdit ? '编辑学术成果' : '添加学术成果'"
            width="700px"
        >
            <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
                <el-form-item label="成果类型" prop="type">
                    <el-select v-model="formData.type" placeholder="请选择成果类型" style="width: 100%;" @change="onTypeChange">
                        <el-option label="期刊论文" value="journal" />
                        <el-option label="会议论文" value="conference" />
                        <el-option label="专利" value="patent" />
                        <el-option label="专著" value="book" />
                        <el-option label="软件著作权" value="software" />
                    </el-select>
                </el-form-item>
                
                <el-form-item label="标题" prop="title">
                    <el-input v-model="formData.title" placeholder="请输入成果标题" />
                </el-form-item>
                
                <el-form-item label="作者" prop="authors">
                    <el-input v-model="formData.authors" placeholder="请输入作者信息，多个作者用逗号分隔" />
                </el-form-item>

                <!-- 期刊论文字段 -->
                <template v-if="formData.type === 'journal'">
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
                <template v-if="formData.type === 'conference'">
                    <el-form-item label="会议名称" prop="conference">
                        <el-input v-model="formData.conference" placeholder="请输入会议名称" />
                    </el-form-item>
                    <el-form-item label="会议地点" prop="location">
                        <el-input v-model="formData.location" placeholder="请输入会议地点" />
                    </el-form-item>
                </template>

                <!-- 专利字段 -->
                <template v-if="formData.type === 'patent'">
                    <el-form-item label="专利号" prop="patentNumber">
                        <el-input v-model="formData.patentNumber" placeholder="请输入专利号" />
                    </el-form-item>
                    <el-form-item label="专利类型" prop="patentType">
                        <el-select v-model="formData.patentType" placeholder="请选择专利类型" style="width: 100%;">
                            <el-option label="发明专利" value="invention" />
                            <el-option label="实用新型" value="utility" />
                            <el-option label="外观设计" value="design" />
                        </el-select>
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

                <el-form-item label="摘要" prop="abstract">
                    <el-input 
                        v-model="formData.abstract" 
                        type="textarea" 
                        :rows="4"
                        placeholder="请输入摘要（可选）"
                    />
                </el-form-item>
            </el-form>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeDialog">取消</el-button>
                    <el-button type="primary" @click="saveAchievement">保存</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { ref, computed } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { callSuccess, callWarning, callInfo, callError } from '@/call'
import { ElMessageBox } from 'element-plus'

export default {
    name: 'achievementManager',
    setup() {
        // 分页相关
        const currentPage = ref(1)
        const pageSize = ref(3)
        
        // 成果类型标签
        const typeLabels = {
            journal: '期刊论文',
            conference: '会议论文',
            patent: '专利',
            book: '专著',
            software: '软件著作权'
        }

        // 学术成果数据
        const achievements = ref([
            {
                id: 1,
                type: 'journal',
                title: '基于深度学习的图像识别算法研究',
                authors: 'HHH, 张三, 李四',
                journal: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
                volume: '45',
                issue: '3',
                pages: '123-135',
                publishDate: '2023-03-15',
                doi: '10.1109/TPAMI.2023.1234567'
            },
            {
                id: 2,
                type: 'conference',
                title: '自然语言处理中的注意力机制优化',
                authors: 'HHH, 王五',
                conference: 'AAAI Conference on Artificial Intelligence',
                location: 'Vancouver, Canada',
                publishDate: '2023-06-20',
                pages: '1001-1008'
            },
            {
                id: 3,
                type: 'patent',
                title: '一种基于机器学习的智能推荐系统',
                authors: 'HHH',
                patentNumber: 'CN123456789A',
                patentType: 'invention',
                publishDate: '2023-01-10'
            },
            {
                id: 4,
                type: 'journal',
                title: '计算机视觉中的目标检测算法综述',
                authors: 'HHH, 赵六, 钱七',
                journal: 'Computer Vision and Image Understanding',
                volume: '220',
                issue: '2',
                pages: '45-62',
                publishDate: '2023-08-12',
                doi: '10.1016/j.cviu.2023.103456'
            },
            {
                id: 5,
                type: 'conference',
                title: '基于Transformer的多模态学习方法',
                authors: 'HHH, 孙八',
                conference: 'International Conference on Computer Vision',
                location: 'Paris, France',
                publishDate: '2023-10-02',
                pages: '2234-2243'
            },
            {
                id: 6,
                type: 'book',
                title: '人工智能算法设计与实现',
                authors: 'HHH',
                publishDate: '2023-05-20',
                pages: '1-320'
            },
            {
                id: 7,
                type: 'software',
                title: '智能数据分析平台V1.0',
                authors: 'HHH, 开发团队',
                publishDate: '2023-07-15'
            },
            {
                id: 8,
                type: 'patent',
                title: '一种基于深度学习的语音识别方法',
                authors: 'HHH, 李九',
                patentNumber: 'CN987654321B',
                patentType: 'invention',
                publishDate: '2023-04-25'
            },
            {
                id: 9,
                type: 'journal',
                title: '强化学习在游戏AI中的应用研究',
                authors: 'HHH, 周十, 吴十一',
                journal: 'Artificial Intelligence',
                volume: '312',
                issue: '1',
                pages: '78-95',
                publishDate: '2023-11-08',
                doi: '10.1016/j.artint.2023.103789'
            },
            {
                id: 10,
                type: 'conference',
                title: '联邦学习中的隐私保护机制',
                authors: 'HHH, 郑十二',
                conference: 'Neural Information Processing Systems',
                location: 'New Orleans, USA',
                publishDate: '2023-12-10',
                pages: '5678-5689'
            },
            {
                id: 11,
                type: 'journal',
                title: '边缘计算环境下的智能调度算法',
                authors: 'HHH, 王十三, 刘十四',
                journal: 'IEEE Internet of Things Journal',
                volume: '10',
                issue: '15',
                pages: '13456-13470',
                publishDate: '2023-09-28',
                doi: '10.1109/JIOT.2023.3298765'
            }
        ])

        // 对话框相关
        const dialogVisible = ref(false)
        const isEdit = ref(false)
        const formRef = ref()
        const editingId = ref(null)
        
        // 表单数据
        const formData = ref({
            type: '',
            title: '',
            authors: '',
            journal: '',
            volume: '',
            issue: '',
            pages: '',
            conference: '',
            location: '',
            patentNumber: '',
            patentType: '',
            publishDate: '',
            doi: '',
            abstract: ''
        })

        // 动态验证规则
        const rules = computed(() => {
            const baseRules = {
                type: [{ required: true, message: '请选择成果类型', trigger: 'change' }],
                title: [{ required: true, message: '请输入成果标题', trigger: 'blur' }],
                authors: [{ required: true, message: '请输入作者信息', trigger: 'blur' }],
                publishDate: [{ required: true, message: '请选择发表/授权时间', trigger: 'change' }]
            }

            // 根据类型添加特定验证规则
            if (formData.value.type === 'journal') {
                baseRules.journal = [{ required: true, message: '请输入期刊名称', trigger: 'blur' }]
                baseRules.volume = [{ required: true, message: '请输入卷号', trigger: 'blur' }]
                baseRules.issue = [{ required: true, message: '请输入期号', trigger: 'blur' }]
            } else if (formData.value.type === 'conference') {
                baseRules.conference = [{ required: true, message: '请输入会议名称', trigger: 'blur' }]
            } else if (formData.value.type === 'patent') {
                baseRules.patentNumber = [{ required: true, message: '请输入专利号', trigger: 'blur' }]
                baseRules.patentType = [{ required: true, message: '请选择专利类型', trigger: 'change' }]
            }

            return baseRules
        })

        // 当前页成果数据
        const currentPageAchievements = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return achievements.value.slice(start, end)
        })

        // 类型改变时重置相关字段
        const onTypeChange = () => {
            const keepFields = ['type', 'title', 'authors', 'publishDate', 'doi', 'abstract']
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
                authors: 'HHH',
                journal: '',
                volume: '',
                issue: '',
                pages: '',
                conference: '',
                location: '',
                patentNumber: '',
                patentType: '',
                publishDate: '',
                doi: '',
                abstract: ''
            }
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
            
            if (data.type === 'journal') {
                if (!data.journal) errors.push('期刊名称')
                if (!data.volume) errors.push('卷号')
                if (!data.issue) errors.push('期号')
            } else if (data.type === 'conference') {
                if (!data.conference) errors.push('会议名称')
            } else if (data.type === 'patent') {
                if (!data.patentNumber) errors.push('专利号')
                if (!data.patentType) errors.push('专利类型')
            }

            if (errors.length > 0) {
                callError(`以下字段不完整：${errors.join('、')}`)
                return false
            }
            return true
        }

        // 保存成果
        const saveAchievement = async () => {
            try {
                await formRef.value.validate()
                
                // 检查数据完整性
                if (!checkDataIntegrity(formData.value)) {
                    return
                }
                
                if (isEdit.value) {
                    // 编辑
                    const index = achievements.value.findIndex(a => a.id === editingId.value)
                    if (index > -1) {
                        achievements.value[index] = { ...formData.value, id: editingId.value }
                        callSuccess('更新成功')
                    }
                } else {
                    // 添加
                    const newAchievement = {
                        ...formData.value,
                        id: Date.now() // 简单的ID生成
                    }
                    achievements.value.unshift(newAchievement)
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
            typeLabels,
            achievements,
            currentPageAchievements,
            dialogVisible,
            isEdit,
            formRef,
            formData,
            rules,
            onTypeChange,
            openAddDialog,
            editAchievement,
            deleteAchievement,
            saveAchievement,
            closeDialog,
            handlePageChange
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
    gap: 15px;
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

.achievement-type-tag.journal {
    background-color: #409eff;
}

.achievement-type-tag.conference {
    background-color: #67c23a;
}

.achievement-type-tag.patent {
    background-color: #e6a23c;
}

.achievement-type-tag.book {
    background-color: #9c27b0;
}

.achievement-type-tag.software {
    background-color: #f56c6c;
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

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
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
}
</style> 