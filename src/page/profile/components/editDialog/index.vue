<template>
    <el-dialog 
        :model-value="visible" 
        title="" 
        width="600px"
        @close="closeDialog"
        :close-on-click-modal="false"
    >
        <div class="edit-form">
            
            <!-- 学历信息编辑 -->
            <div v-if="type === 'education'" class="form-section">
                <div class="form-row">
                    <label class="form-label">最高学历：</label>
                    <el-select v-model="formData.degree" placeholder="请选择学历" style="width: 100%;">
                        <el-option label="本科" value="本科" />
                        <el-option label="硕士" value="硕士" />
                        <el-option label="博士" value="博士" />
                        <el-option label="博士后" value="博士后" />
                    </el-select>
                </div>
                <div class="form-row">
                    <label class="form-label">毕业院校：</label>
                    <el-input 
                        v-model="formData.university" 
                        placeholder="请输入毕业院校"
                        clearable
                    />
                </div>
                <div class="form-row">
                    <label class="form-label">专业：</label>
                    <el-input 
                        v-model="formData.major" 
                        placeholder="请输入专业"
                        clearable
                    />
                </div>
                <div class="form-row">
                    <label class="form-label">毕业时间：</label>
                    <el-input 
                        v-model="formData.graduationYear" 
                        placeholder="请输入毕业时间（如：2005年）"
                        clearable
                    />
                </div>
            </div>

            <!-- 职称信息编辑 -->
            <div v-if="type === 'title'" class="form-section">
                <div class="form-row">
                    <label class="form-label">当前职称：</label>
                    <el-select v-model="formData.current" placeholder="请选择职称" style="width: 100%;">
                        <el-option label="助教" value="助教" />
                        <el-option label="讲师" value="讲师" />
                        <el-option label="副教授" value="副教授" />
                        <el-option label="教授" value="教授" />
                        <el-option label="研究员" value="研究员" />
                        <el-option label="高级研究员" value="高级研究员" />
                        <el-option label="院士" value="院士" />
                    </el-select>
                </div>
                <div class="form-row">
                    <label class="form-label">工作单位：</label>
                    <el-input 
                        v-model="formData.organization" 
                        placeholder="请输入工作单位"
                        clearable
                    />
                </div>
                <div class="form-row">
                    <label class="form-label">部门：</label>
                    <el-input 
                        v-model="formData.department" 
                        placeholder="请输入所在部门"
                        clearable
                    />
                </div>
                <div class="form-row">
                    <label class="form-label">任职时间：</label>
                    <el-input 
                        v-model="formData.startDate" 
                        placeholder="请输入任职时间（如：2018年）"
                        clearable
                    />
                </div>
            </div>

            <!-- 研究领域编辑 -->
            <div v-if="type === 'research'" class="form-section">
                <div class="form-row">
                    <label class="form-label">主要研究方向：</label>
                    <div class="research-fields-editor">
                        <div class="current-fields">
                            <div 
                                v-for="(field, index) in formData.fields" 
                                :key="index" 
                                class="field-tag"
                            >
                                {{ field }}
                                <el-icon class="remove-field" @click="removeField(index)">
                                    <Close />
                                </el-icon>
                            </div>
                        </div>
                        <div class="add-field">
                            <el-input 
                                v-model="newField" 
                                placeholder="添加新的研究方向"
                                @keydown.enter="addField"
                                style="margin-bottom: 10px;"
                            />
                            <el-button type="primary" plain size="small" @click="addField">
                                添加领域
                            </el-button>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <label class="form-label">研究兴趣：</label>
                    <el-input 
                        v-model="formData.interests" 
                        type="textarea"
                        :rows="4"
                        placeholder="请详细描述您的研究兴趣和方向"
                    />
                </div>
                <div class="form-row">
                    <label class="form-label">发表论文数：</label>
                    <div class="readonly-field">
                        <span class="readonly-value">{{ formData.paperCount || 0 }}</span>
                        <span class="readonly-note">（此数据由系统根据学术成果自动计算）</span>
                    </div>
                </div>
            </div>

        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="closeDialog">取消</el-button>
                <el-button type="primary" @click="saveData">保存</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { callWarning } from '@/call'

export default {
    name: 'editDialog',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            default: ''
        },
        data: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['close', 'save'],
    setup(props, { emit }) {
        const formData = ref({})
        const newField = ref('')

        // 对话框标题
        const dialogTitle = computed(() => {
            const titles = {
                education: '编辑学历信息',
                title: '编辑职称信息',
                research: '编辑研究领域'
            }
            return titles[props.type] || '编辑信息'
        })

        // 监听数据变化，初始化表单
        watch(() => props.data, (newData) => {
            if (newData && Object.keys(newData).length > 0) {
                formData.value = JSON.parse(JSON.stringify(newData))
            }
        }, { immediate: true, deep: true })

        // 关闭对话框
        const closeDialog = () => {
            emit('close')
        }

        // 添加研究领域
        const addField = () => {
            if (newField.value.trim()) {
                if (!formData.value.fields.includes(newField.value.trim())) {
                    formData.value.fields.push(newField.value.trim())
                    newField.value = ''
                } else {
                    callWarning('该研究领域已存在')
                }
            }
        }

        // 移除研究领域
        const removeField = (index) => {
            formData.value.fields.splice(index, 1)
        }

        // 保存数据
        const saveData = () => {
            // 简单验证
            if (props.type === 'education') {
                if (!formData.value.degree || !formData.value.university) {
                    callWarning('请填写必要信息')
                    return
                }
            } else if (props.type === 'title') {
                if (!formData.value.current || !formData.value.organization) {
                    callWarning('请填写必要信息')
                    return
                }
            } else if (props.type === 'research') {
                if (!formData.value.fields || formData.value.fields.length === 0) {
                    callWarning('请至少添加一个研究领域')
                    return
                }
                // 保存时保留原始的论文数量，不允许编辑
                const saveData = { ...formData.value }
                saveData.paperCount = props.data.paperCount
                emit('save', props.type, saveData)
                return
            }

            emit('save', props.type, formData.value)
        }

        return {
            formData,
            newField,
            dialogTitle,
            closeDialog,
            addField,
            removeField,
            saveData
        }
    }
}
</script>

<style scoped>
.edit-form {
    padding: 20px 0;
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-row {
    display: flex;
    flex-direction: column;
}

.form-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
    text-align: left;
}

.research-fields-editor {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.current-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 40px;
    padding: 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #f8f9fa;
}

.field-tag {
    display: flex;
    align-items: center;
    background-color: rgba(64, 158, 255, 0.1);
    color: #409eff;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid rgba(64, 158, 255, 0.3);
}

.remove-field {
    margin-left: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: color 0.2s;
}

.remove-field:hover {
    color: #f56c6c;
}

.add-field {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.readonly-field {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background-color: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    color: #606266;
}

.readonly-value {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #409eff;
}

.readonly-note {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #909399;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-dialog__header) {
    padding: 20px 20px 10px;
    border-bottom: 1px solid #f0f0f0;
}

:deep(.el-dialog__title) {
    font-family: 'Meiryo', sans-serif;
    font-weight: 600;
    color: #2c3e50;
}

:deep(.el-dialog__body) {
    padding: 20px;
}

:deep(.el-dialog__footer) {
    padding: 10px 20px 20px;
    border-top: 1px solid #f0f0f0;
}
</style> 