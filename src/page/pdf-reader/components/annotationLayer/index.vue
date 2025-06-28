<template>
    <div 
        class="annotation-overlay"
        @mousedown="handleOverlayMouseDown"
        @mousemove="handleOverlayMouseMove"
        @mouseup="handleOverlayMouseUp"
        @mouseleave="handleOverlayMouseLeave"
    >
        <canvas 
            :ref="el => $emit('set-annotation-ref', el, currentPage)"
            class="annotation-canvas"
        ></canvas>
        
        <!-- 高亮显示层 -->
        <div class="highlights-layer">
            <div 
                v-for="highlight in getPageHighlights" 
                :key="highlight.id"
                class="highlight-rect"
                :style="getHighlightStyle(highlight)"
                @click="$emit('select-highlight', highlight)"
                @contextmenu.prevent="$emit('show-highlight-context-menu', $event, highlight)"
                :title="`高亮区域 - 右键删除`"
            >
                <div 
                    class="highlight-delete-btn"
                    @click.stop="$emit('delete-highlight', highlight.id)"
                    title="删除高亮"
                >
                    <el-icon><Close /></el-icon>
                </div>
            </div>
        </div>
        
        <!-- 批注标记层 -->
        <div class="annotations-layer">
            <!-- 批注标记 -->
            <div 
                v-for="annotation in getPageAnnotations" 
                :key="annotation.id"
                class="annotation-marker"
                :style="getAnnotationStyle(annotation)"
                @click="$emit('show-annotation-dialog', annotation)"
                @contextmenu.prevent="$emit('show-annotation-context-menu', $event, annotation)"
                :title="`批注: ${annotation.content}`"
            >
                <el-icon><Edit /></el-icon>
            </div>
            
            <!-- 橡皮擦预览圆形 -->
            <div 
                v-if="annotationMode === 'eraser' && eraserPreview.show"
                class="eraser-preview"
                :style="{
                    left: eraserPreview.x + 'px',
                    top: eraserPreview.y + 'px',
                    width: eraserPreview.size + 'px',
                    height: eraserPreview.size + 'px'
                }"
            ></div>
            
            <!-- 高亮选择预览 -->
            <div 
                v-if="selectionPreview.show"
                class="selection-preview"
                :style="{
                    left: selectionPreview.x + 'px',
                    top: selectionPreview.y + 'px',
                    width: selectionPreview.width + 'px',
                    height: selectionPreview.height + 'px'
                }"
            ></div>
        </div>
        
        <!-- 调试信息 -->
        <div class="debug-info" v-if="annotations.length > 0">
            <div>总批注数: {{ annotations.length }}</div>
            <div>当前页批注数: {{ getPageAnnotations.length }}</div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue'
import { Edit, Close } from '@element-plus/icons-vue'

export default {
    name: 'AnnotationLayer',
    emits: [
        'set-annotation-ref', 'select-highlight', 'show-highlight-context-menu',
        'delete-highlight', 'show-annotation-dialog', 'show-annotation-context-menu',
        'overlay-mousedown', 'overlay-mousemove', 'overlay-mouseup', 'overlay-mouseleave'
    ],
    props: {
        currentPage: Number,
        annotationMode: String,
        highlights: Array,
        annotations: Array,
        eraserPreview: Object,
        selectionPreview: Object
    },
    setup(props, { emit }) {
        const getPageHighlights = computed(() => {
            return props.highlights.filter(h => h.page === props.currentPage)
        })

        const getPageAnnotations = computed(() => {
            return props.annotations.filter(a => a.page === props.currentPage)
        })

        const getHighlightStyle = (highlight) => {
            const color = highlight.color || '#ffff00'
            return {
                left: highlight.x + 'px',
                top: highlight.y + 'px',
                width: highlight.width + 'px',
                height: highlight.height + 'px',
                backgroundColor: color,
                opacity: '0.15',
                border: 'none'
            }
        }

        const getAnnotationStyle = (annotation) => {
            return {
                left: annotation.x + 'px',
                top: annotation.y + 'px'
            }
        }

        const handleOverlayMouseDown = (event) => {
            emit('overlay-mousedown', event)
        }

        const handleOverlayMouseMove = (event) => {
            emit('overlay-mousemove', event)
        }

        const handleOverlayMouseUp = (event) => {
            emit('overlay-mouseup', event)
        }

        const handleOverlayMouseLeave = (event) => {
            emit('overlay-mouseleave', event)
        }

        return {
            getPageHighlights,
            getPageAnnotations,
            getHighlightStyle,
            getAnnotationStyle,
            handleOverlayMouseDown,
            handleOverlayMouseMove,
            handleOverlayMouseUp,
            handleOverlayMouseLeave,
            Edit,
            Close
        }
    }
}
</script>

<style scoped>
/* 批注交互层 - 直接覆盖在PDF上，考虑page-wrapper的padding */
.annotation-overlay {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    z-index: 2;
    pointer-events: auto;
    cursor: default;
}

.annotation-overlay.highlight-mode {
    cursor: crosshair;
}

.annotation-overlay.note-mode {
    cursor: text;
}

.annotation-overlay.draw-mode {
    cursor: pointer;
}

.annotation-overlay.eraser-mode {
    cursor: crosshair;
}

/* 批注Canvas - 绘制层 */
.annotation-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: auto;
    z-index: 1;
}

/* 高亮层 */
.highlights-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    pointer-events: none;
}

.highlight-rect {
    position: absolute;
    pointer-events: auto;
    cursor: pointer;
    transition: opacity 0.2s ease;
    box-sizing: border-box;
    border-radius: 2px;
}

.highlight-rect:hover {
    opacity: 0.5 !important;
}

.highlight-rect:hover .highlight-delete-btn {
    opacity: 1;
    transform: scale(1);
}

/* 高亮删除按钮 */
.highlight-delete-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 16px;
    height: 16px;
    background-color: #ff4757;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.2s ease;
    border: 1px solid white;
    z-index: 12;
    pointer-events: auto;
}

.highlight-delete-btn:hover {
    background-color: #ff3838;
    transform: scale(1.1);
}

/* 批注标记层 */
.annotations-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    pointer-events: none;
}

.annotation-marker {
    position: absolute;
    width: 24px;
    height: 24px;
    background-color: #409eff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
    transform: translateX(-50%) translateY(-50%);
    border: 2px solid white;
    z-index: 10;
}

.annotation-marker:hover {
    background-color: #337ecc;
    transform: translateX(-50%) translateY(-50%) scale(1.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

/* 橡皮擦预览 */
.eraser-preview {
    position: absolute;
    border: 3px solid #888888;
    border-radius: 50%;
    background-color: transparent;
    pointer-events: none;
    z-index: 15;
    transition: all 0.1s ease;
    box-shadow: 0 0 12px rgba(136, 136, 136, 0.4);
    opacity: 0.8;
}

.eraser-preview::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    background-color: #666666;
    border-radius: 50%;
    transform: translate(-50%, -50%);
}

.eraser-preview::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60%;
    height: 60%;
    border: 1px solid #aaaaaa;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background-color: transparent;
    opacity: 0.6;
}

/* 高亮选择预览 */
.selection-preview {
    position: absolute;
    border: 2px dashed #409eff;
    background-color: rgba(255, 255, 0, 0.2);
    pointer-events: none;
    z-index: 15;
    border-radius: 2px;
    animation: dash-animation 1s linear infinite;
    box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

@keyframes dash-animation {
    0% {
        border-color: #409eff;
        background-color: rgba(255, 255, 0, 0.15);
    }
    50% {
        border-color: #66b3ff;
        background-color: rgba(255, 255, 0, 0.25);
    }
    100% {
        border-color: #409eff;
        background-color: rgba(255, 255, 0, 0.15);
    }
}

/* 调试信息 */
.debug-info {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 20;
    pointer-events: none;
}

.debug-info div {
    margin: 2px 0;
}
</style> 