<template>
    <div class="pdf-viewer">
        <div v-if="!pdfDocument" class="empty-state">
            <el-icon class="empty-icon"><Document /></el-icon>
            <h3>请上传PDF文件开始阅读</h3>
            <p>支持上传 .pdf 格式的文件</p>
        </div>
        
        <div v-else class="pdf-content">
            <div v-if="totalPages > 0" class="pdf-pages" ref="pdfContainer">
                <!-- PDF页面容器 -->
                <div class="page-container">
                    <div 
                        :id="`page-wrapper-${currentPage}`"
                        class="page-wrapper"
                    >
                        <!-- PDF Canvas层 -->
                        <div class="pdf-layer">
                            <canvas 
                                :id="`page-${currentPage}`"
                                :ref="el => $emit('set-page-ref', el, currentPage)"
                                class="pdf-page"
                            ></canvas>
                        </div>
                        
                        <!-- 批注交互层 -->
                        <slot name="annotation-layer"></slot>
                        
                        <!-- 翻页提示 -->
                        <div class="page-navigation-hints">
                            <div v-if="currentPage > 1" class="nav-hint nav-hint-left" @click="$emit('prev-page')">
                                <el-icon><ArrowLeft /></el-icon>
                                <span>上一页</span>
                            </div>
                            <div v-if="currentPage < totalPages" class="nav-hint nav-hint-right" @click="$emit('next-page')">
                                <span>下一页</span>
                                <el-icon><ArrowRight /></el-icon>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 键盘快捷键提示 -->
                <div class="keyboard-hints">
                    <div class="hint-item">
                        <span class="key">←→</span>
                        <span>翻页</span>
                    </div>
                    <div class="hint-item">
                        <span class="key">+/-</span>
                        <span>缩放</span>
                    </div>
                    <div class="hint-item">
                        <span class="key">空格</span>
                        <span>下一页</span>
                    </div>
                </div>
            </div>
            
            <div v-else class="loading-container">
                <el-empty description="正在加载PDF页面..."></el-empty>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue'
import { Document, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

export default {
    name: 'PdfViewer',
    emits: ['prev-page', 'next-page', 'set-page-ref'],
    props: {
        pdfDocument: Object,
        currentPage: Number,
        totalPages: Number
    },
    setup() {
        const pdfContainer = ref(null)

        return {
            pdfContainer,
            Document,
            ArrowLeft,
            ArrowRight
        }
    }
}
</script>

<style scoped>
.pdf-viewer {
    flex: 1;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
}

.pdf-viewer:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 500px;
    color: #909399;
    padding: 40px;
}

.empty-icon {
    font-size: 80px;
    margin-bottom: 20px;
    color: #c0c4cc;
}

.empty-state h3 {
    font-family: 'Meiryo', sans-serif;
    font-size: 24px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 12px 0;
}

.empty-state p {
    font-family: 'Meiryo', sans-serif;
    font-size: 16px;
    color: #909399;
    margin: 8px 0;
}

.pdf-content {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.pdf-pages {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    overflow-x: hidden;
    background: #fafafa;
    min-height: 600px;
    width: 100%;
    box-sizing: border-box;
}

.page-container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex: 1;
    width: 100%;
    min-height: 500px;
    padding: 20px 0;
    overflow: visible;
}

.pdf-pages::-webkit-scrollbar {
    width: 8px;
}

.pdf-pages::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.pdf-pages::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.pdf-pages::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.page-wrapper {
    position: relative;
    display: inline-block;
    margin: 0 auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    transition: all 0.3s ease;
    background: white;
    padding: 8px;
    width: fit-content;
    height: fit-content;
    max-width: calc(100% - 40px);
    box-sizing: border-box;
}

.page-wrapper:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
    transform: translateY(-2px);
}

.pdf-layer {
    position: relative;
    z-index: 1;
}

.pdf-page {
    display: block;
    border-radius: 4px;
    background: white;
}

.page-navigation-hints {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    z-index: 20;
}

.nav-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: auto;
    margin: 0 -10px;
}

.page-wrapper:hover .nav-hint {
    opacity: 1;
}

.nav-hint:hover {
    background: rgba(64, 158, 255, 0.9);
    transform: scale(1.05);
}

.nav-hint-left {
    margin-left: -20px;
}

.nav-hint-right {
    margin-right: -20px;
}

.keyboard-hints {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin: 20px 0;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    position: sticky;
    bottom: 20px;
    z-index: 5;
}

.hint-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
}

.key {
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 11px;
    font-weight: bold;
    color: #333;
    min-width: 20px;
    text-align: center;
}

.loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
}

@media (max-width: 768px) {
    .pdf-pages {
        padding: 15px;
    }
}
</style> 