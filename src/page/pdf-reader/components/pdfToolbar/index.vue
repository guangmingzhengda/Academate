<template>
    <div class="toolbar-card">
        <div class="toolbar-left" v-if="showUpload">
            <el-upload
                ref="uploadRef"
                :show-file-list="false"
                :on-change="handleFileUpload"
                accept=".pdf"
                :auto-upload="false"
            >
                <el-button type="primary" :icon="Upload" class="modern-btn">
                    上传PDF文件
                </el-button>
            </el-upload>
        </div>
        
        <div class="toolbar-center" v-if="pdfDocument">
            <div class="control-group">
                <el-button-group class="zoom-controls">
                    <el-button :icon="ZoomOut" @click="$emit('zoom-out')" :disabled="scale <= 0.3" class="control-btn"></el-button>
                    <el-button class="scale-display" @click="$emit('reset-zoom')" :title="点击重置缩放">{{ Math.round(scale * 100) }}%</el-button>
                    <el-button :icon="ZoomIn" @click="$emit('zoom-in')" :disabled="scale >= 4" class="control-btn"></el-button>
                </el-button-group>
                
                <div class="page-controls">
                    <el-button :icon="ArrowLeft" @click="$emit('prev-page')" :disabled="currentPage <= 1" class="control-btn"></el-button>
                    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
                    <el-button :icon="ArrowRight" @click="$emit('next-page')" :disabled="currentPage >= totalPages" class="control-btn"></el-button>
                </div>
            </div>
        </div>
        
        <div class="toolbar-right">
            <el-button-group v-if="pdfDocument" class="annotation-controls">
                <el-button 
                    :type="annotationMode === 'highlight' ? 'primary' : 'default'"
                    @click="$emit('set-annotation-mode', 'highlight')"
                    class="annotation-btn"
                >
                    高亮
                </el-button>
                <el-button 
                    :type="annotationMode === 'note' ? 'primary' : 'default'"
                    @click="$emit('set-annotation-mode', 'note')"
                    class="annotation-btn"
                >
                    批注
                </el-button>
                <el-button 
                    :type="annotationMode === 'draw' ? 'primary' : 'default'"
                    @click="$emit('set-annotation-mode', 'draw')"
                    class="annotation-btn"
                >
                    绘制
                </el-button>
                <el-button 
                    :type="annotationMode === 'eraser' ? 'primary' : 'default'"
                    @click="$emit('set-annotation-mode', 'eraser')"
                    class="annotation-btn"
                >
                    橡皮擦
                </el-button>
                <el-button 
                    v-if="annotationMode === 'draw' || annotationMode === 'eraser'"
                    @click="$emit('clear-drawing')"
                    class="annotation-btn"
                    type="warning"
                >
                    清除
                </el-button>
            </el-button-group>
            
            <!-- 持久化控制按钮 -->
            <el-button-group v-if="pdfDocument" class="persistence-controls">
                <el-button 
                    @click="$emit('export-annotations')"
                    class="persistence-btn"
                    type="success"
                    :icon="Download"
                    title="导出标注数据"
                >
                    保存标注
                </el-button>
                <el-button 
                    @click="$emit('import-annotations')"
                    class="persistence-btn"
                    type="info"
                    :icon="UploadFilled"
                    title="导入标注数据"
                >
                    加载标注
                </el-button>
            </el-button-group>
            
            <!-- 颜色和透明度控制器 -->
            <div v-if="pdfDocument && (annotationMode === 'highlight' || annotationMode === 'draw')" class="color-controls">
                <span class="color-label">颜色:</span>
                <input 
                    type="color" 
                    :value="annotationMode === 'highlight' ? highlightColor : drawColor"
                    @change="$emit('update-color', $event)"
                    class="color-picker"
                />
                
                <!-- 高亮透明度控制 -->
                <div v-if="annotationMode === 'highlight'" class="opacity-controls">
                    <span class="opacity-label">透明度:</span>
                    <input 
                        type="range" 
                        :value="highlightOpacity"
                        @input="updateOpacity"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        class="opacity-slider"
                    />
                    <span class="opacity-value">{{ Math.round(highlightOpacity * 100) }}%</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { 
    Upload, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, Download, UploadFilled
} from '@element-plus/icons-vue'

export default {
    name: 'PdfToolbar',
    emits: [
        'file-upload', 'zoom-in', 'zoom-out', 'reset-zoom', 
        'prev-page', 'next-page', 'set-annotation-mode',
        'clear-drawing', 'update-color', 'update-highlight-opacity', 'export-annotations', 'import-annotations'
    ],
    props: {
        pdfDocument: Object,
        currentPage: Number,
        totalPages: Number,
        scale: Number,
        annotationMode: String,
        highlightColor: String,
        drawColor: String,
        highlightOpacity: Number,
        showUpload: {
            type: Boolean,
            default: true
        }
    },
    setup(props, { emit }) {
        const handleFileUpload = (uploadFile, uploadFiles) => {
            emit('file-upload', uploadFile, uploadFiles)
        }
        
        const updateOpacity = (event) => {
            const opacity = parseFloat(event.target.value)
            emit('update-highlight-opacity', opacity)
        }

        return {
            handleFileUpload,
            updateOpacity,
            Upload,
            ZoomIn,
            ZoomOut,
            ArrowLeft,
            ArrowRight,
            Download,
            UploadFilled
        }
    }
}
</script>

<style scoped>
.toolbar-card {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 12px 12px 0 0;
    padding: 20px 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modern-btn {
    font-family: 'Meiryo', sans-serif;
    border-radius: 16px;
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    border: 1px solid transparent;
    height: 40px;
}

.modern-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-group {
    display: flex;
    align-items: center;
    gap: 20px;
}

.zoom-controls,
.annotation-controls,
.persistence-controls {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn,
.annotation-btn,
.persistence-btn {
    font-family: 'Meiryo', sans-serif;
    font-size: 13px;
    padding: 6px 12px;
    height: 32px;
    border: none;
    transition: all 0.3s ease;
}

.scale-display {
    background-color: #f8f9fa;
    color: #2c3e50;
    font-weight: 600;
    cursor: pointer;
    font-size: 13px;
    min-width: 70px;
    transition: all 0.3s ease;
}

.scale-display:hover {
    background-color: #e9ecef;
    color: #409eff;
}

.page-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 16px;
    background-color: rgba(64, 158, 255, 0.1);
    border-radius: 20px;
    border: 1px solid rgba(64, 158, 255, 0.2);
}

.page-info {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #409eff;
    min-width: 80px;
    text-align: center;
}

.color-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    border: 1px solid #e0e0e0;
}

.color-label, .opacity-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #666;
    font-weight: 500;
    white-space: nowrap;
}

.color-picker {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    outline: none;
    transition: transform 0.2s ease;
}

.color-picker:hover {
    transform: scale(1.1);
}

.opacity-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 12px;
    border-left: 1px solid #e0e0e0;
}

.opacity-slider {
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: #e0e0e0;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    transition: all 0.3s ease;
}

.opacity-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #409eff;
    cursor: pointer;
    transition: all 0.3s ease;
}

.opacity-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: #66b1ff;
}

.opacity-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #409eff;
    cursor: pointer;
    border: none;
    transition: all 0.3s ease;
}

.opacity-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    background: #66b1ff;
}

.opacity-value {
    font-family: 'Meiryo', sans-serif;
    font-size: 11px;
    color: #409eff;
    font-weight: 600;
    min-width: 35px;
    text-align: center;
}

@media (max-width: 1024px) {
    .toolbar-card {
        flex-wrap: wrap;
        gap: 12px;
        padding: 15px 20px;
        border-radius: 12px 12px 0 0;
    }
    
    .control-group {
        gap: 10px;
    }
}

@media (max-width: 768px) {
    .toolbar-card {
        padding: 15px;
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
        border-radius: 12px 12px 0 0;
    }
    
    .toolbar-left,
    .toolbar-center,
    .toolbar-right {
        justify-content: center;
        flex-wrap: wrap;
    }
}
</style> 