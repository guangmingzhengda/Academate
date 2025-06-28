<template>
    <el-dialog
        :model-value="visible"
        @update:model-value="$emit('update:visible', $event)"
        :title="currentEditingAnnotation ? '编辑批注' : '添加批注'"
        width="400px"
        :before-close="handleClose"
    >
        <el-input
            :model-value="content"
            @input="$emit('update:content', $event)"
            type="textarea"
            :rows="4"
            placeholder="请输入批注内容..."
            maxlength="500"
            show-word-limit
        ></el-input>
        
        <template #footer>
            <div class="dialog-footer">
                <el-button 
                    v-if="currentEditingAnnotation"
                    type="danger"
                    @click="$emit('delete-current-annotation')"
                    :icon="Delete"
                    class="dialog-btn"
                >
                    删除
                </el-button>
                <el-button 
                    @click="handleClose"
                    class="dialog-btn"
                >
                    取消
                </el-button>
                <el-button 
                    type="primary" 
                    @click="handleSave"
                    class="dialog-btn"
                >
                    {{ currentEditingAnnotation ? '更新' : '保存' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script>
import { computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'

export default {
    name: 'NoteDialog',
    emits: ['update:visible', 'update:content', 'save-note', 'cancel-note', 'delete-current-annotation'],
    props: {
        visible: Boolean,
        content: String,
        currentEditingAnnotation: Object
    },
    setup(props, { emit }) {
        const handleClose = () => {
            emit('cancel-note')
        }

        const handleSave = () => {
            if (!props.content.trim()) {
                return
            }
            emit('save-note')
        }



        return {
            handleClose,
            handleSave,
            Delete
        }
    }
}
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 100%;
    gap: 12px;
}

.dialog-btn {
    flex: 1;
    min-width: 80px;
}
</style> 