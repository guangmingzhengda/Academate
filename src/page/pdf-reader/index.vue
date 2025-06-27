<template>
    <div class="bg-container"/>
    
    <div class="pdf-reader-container">
        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 工具栏 -->
            <div class="toolbar-card">
                <div class="toolbar-left">
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
                            <el-button :icon="ZoomOut" @click="zoomOut" :disabled="scale <= 0.3" class="control-btn"></el-button>
                            <el-button class="scale-display" @click="resetZoom" :title="点击重置缩放">{{ Math.round(scale * 100) }}%</el-button>
                            <el-button :icon="ZoomIn" @click="zoomIn" :disabled="scale >= 4" class="control-btn"></el-button>
                        </el-button-group>
                        
                        <div class="page-controls">
                            <el-button :icon="ArrowLeft" @click="prevPage" :disabled="currentPage <= 1" class="control-btn"></el-button>
                            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
                            <el-button :icon="ArrowRight" @click="nextPage" :disabled="currentPage >= totalPages" class="control-btn"></el-button>
                        </div>
                    </div>
                </div>
                
                <div class="toolbar-right">
                    <el-button-group v-if="pdfDocument" class="annotation-controls">
                        <el-button 
                            :type="annotationMode === 'highlight' ? 'primary' : 'default'"
                            @click="setAnnotationMode('highlight')"
                            class="annotation-btn"
                        >
                            高亮
                        </el-button>
                        <el-button 
                            :type="annotationMode === 'note' ? 'primary' : 'default'"
                            @click="setAnnotationMode('note')"
                            class="annotation-btn"
                        >
                            批注
                        </el-button>
                        <el-button 
                            :type="annotationMode === 'draw' ? 'primary' : 'default'"
                            @click="setAnnotationMode('draw')"
                            class="annotation-btn"
                        >
                            绘制
                        </el-button>
                        <el-button 
                            :type="annotationMode === 'eraser' ? 'primary' : 'default'"
                            @click="setAnnotationMode('eraser')"
                            class="annotation-btn"
                        >
                            橡皮擦
                        </el-button>
                        <el-button 
                            v-if="annotationMode === 'draw' || annotationMode === 'eraser'"
                            @click="clearDrawing"
                            class="annotation-btn"
                            type="warning"
                        >
                            清除
                        </el-button>
                    </el-button-group>
                    
                    <!-- 颜色选择器 -->
                    <div v-if="pdfDocument && (annotationMode === 'highlight' || annotationMode === 'draw')" class="color-controls">
                        <span class="color-label">颜色:</span>
                        <input 
                            type="color" 
                            :value="annotationMode === 'highlight' ? highlightColor : drawColor"
                            @change="updateColor"
                            class="color-picker"
                        />
                    </div>
                    

                </div>
            </div>

            <!-- PDF显示区域 -->
            <div class="pdf-container">
                <!-- PDF显示区域 -->
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
                                            :ref="el => setPageRef(el, currentPage)"
                                            class="pdf-page"
                                        ></canvas>
                                    </div>
                                    
                                    <!-- 批注交互层 -->
                                    <div 
                                        class="annotation-overlay"
                                        @mousedown="handleOverlayMouseDown"
                                        @mousemove="handleOverlayMouseMove"
                                        @mouseup="handleOverlayMouseUp"
                                        @mouseleave="handleOverlayMouseLeave"
                                    >
                                        <canvas 
                                            :ref="el => setAnnotationRef(el, currentPage)"
                                            class="annotation-canvas"
                                        ></canvas>
                                        
                                        <!-- 高亮显示层 -->
                                        <div class="highlights-layer">
                                            <div 
                                                v-for="highlight in getPageHighlights(currentPage)" 
                                                :key="highlight.id"
                                                class="highlight-rect"
                                                :style="getHighlightStyle(highlight)"
                                                @click="selectHighlight(highlight)"
                                                @contextmenu.prevent="showHighlightContextMenu($event, highlight)"
                                                :title="`高亮区域 - 右键删除`"
                                            >
                                                <div 
                                                    class="highlight-delete-btn"
                                                    @click.stop="deleteHighlight(highlight.id)"
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
                                                v-for="annotation in getPageAnnotations(currentPage)" 
                                                :key="annotation.id"
                                                class="annotation-marker"
                                                :style="getAnnotationStyle(annotation)"
                                                @click="showAnnotationDialog(annotation)"
                                                @contextmenu.prevent="showAnnotationContextMenu($event, annotation)"
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
                                            <div>当前页批注数: {{ getPageAnnotations(currentPage).length }}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- 翻页提示 -->
                                    <div class="page-navigation-hints">
                                        <div v-if="currentPage > 1" class="nav-hint nav-hint-left" @click="prevPage">
                                            <el-icon><ArrowLeft /></el-icon>
                                            <span>上一页</span>
                                        </div>
                                        <div v-if="currentPage < totalPages" class="nav-hint nav-hint-right" @click="nextPage">
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
            </div>
            
            <!-- 文字批注对话框 -->
            <el-dialog
                v-model="noteDialogVisible"
                :title="currentEditingAnnotation ? '编辑批注' : '添加批注'"
                width="400px"
                :before-close="cancelNote"
            >
                <el-input
                    v-model="currentNoteContent"
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
                            @click="deleteCurrentAnnotation"
                            :icon="Delete"
                            class="dialog-btn"
                        >
                            删除
                        </el-button>
                        <el-button 
                            @click="cancelNote"
                            class="dialog-btn"
                        >
                            取消
                        </el-button>
                        <el-button 
                            type="primary" 
                            @click="saveCurrentNote"
                            class="dialog-btn"
                        >
                            {{ currentEditingAnnotation ? '更新' : '保存' }}
                        </el-button>
                    </div>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { 
    Upload, Download, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, 
    Document, Plus, Delete, Edit, Close 
} from '@element-plus/icons-vue'
import { callSuccess, callError, callInfo } from '@/call'
// 使用本地的PDF.js
let pdfjsLib = null

// 动态导入PDF.js
const loadPDFJS = async () => {
    if (pdfjsLib) return pdfjsLib
    
    // 清除可能存在的有问题的全局对象
    if (window.pdfjsLib || window.PDFJS) {
        delete window.pdfjsLib
        delete window.PDFJS
    }
    
    // 使用CDN加载PDF.js
    if (!window.pdfjsLib && !window.PDFJS) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/1.6.210/pdf.min.js'
        script.crossOrigin = 'anonymous'
        script.async = false
        document.head.appendChild(script)
        
        await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    if (!window.pdfjsLib && !window.PDFJS) {
        throw new Error('PDF.js加载失败')
    }
    
    // 1.6版本使用PDFJS
    pdfjsLib = window.pdfjsLib || window.PDFJS
    
    // 设置worker路径
    if (window.PDFJS) {
        window.PDFJS.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/1.6.210/pdf.worker.min.js'
        pdfjsLib = window.PDFJS
    } else if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/1.6.210/pdf.worker.min.js'
    }
    
    return pdfjsLib
}



export default {
    name: 'PdfReader',
    components: {},
    setup() {
        // 键盘快捷键处理
        const handleKeyPress = (event) => {
            if (pdfDocument.value) {
                switch (event.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        event.preventDefault()
                        prevPage()
                        break
                    case 'ArrowRight':
                    case 'ArrowDown':
                    case ' ':
                        event.preventDefault()
                        nextPage()
                        break
                    case 'Home':
                        event.preventDefault()
                        scrollToPage(1)
                        break
                    case 'End':
                        event.preventDefault()
                        scrollToPage(totalPages.value)
                        break
                    case '+':
                    case '=':
                        event.preventDefault()
                        zoomIn()
                        break
                    case '-':
                        event.preventDefault()
                        zoomOut()
                        break
                }
            }
        }

        // 在组件挂载时初始化
        onMounted(async () => {
            console.log('PDF阅读器组件已挂载')
            console.log('页面可见性检查:', {
                document: !!document,
                body: !!document.body,
                windowInnerHeight: window.innerHeight,
                windowInnerWidth: window.innerWidth
            })
            console.log('DOM元素检查:', {
                pdfContainer: !!pdfContainer.value,
                uploadRef: !!uploadRef.value
            })
            
            // 添加键盘事件监听
            document.addEventListener('keydown', handleKeyPress)
            
            // 检查组件是否在DOM中
            setTimeout(() => {
                const container = document.querySelector('.pdf-reader-container')
                console.log('容器元素检查:', {
                    container: !!container,
                    offsetHeight: container?.offsetHeight || 'not found',
                    offsetWidth: container?.offsetWidth || 'not found',
                    computedStyle: container ? window.getComputedStyle(container).display : 'not found'
                })
            }, 100)
            
            try {
                console.log('开始加载PDF.js...')
                
                // 加载PDF.js
                const pdfjs = await loadPDFJS()
                
                console.log('PDF.js加载成功')
                console.log('PDF.js配置:', {
                    version: pdfjs.version || 'unknown',
                    workerSrc: pdfjs.GlobalWorkerOptions?.workerSrc || pdfjs.workerSrc || 'unknown',
                    getDocument: typeof pdfjs.getDocument
                })
                
                // 显示加载成功消息
                callSuccess('PDF阅读器初始化完成，请上传PDF文件')
                
                // 添加功能说明（方便用户使用）
                setTimeout(() => {
                    callInfo('使用说明：上传PDF后，点击工具栏的"高亮"、"批注"、"绘制"按钮进行标注')
                }, 3000)
            } catch (error) {
                console.error('PDF.js加载失败:', error)
                callError('PDF.js加载失败: ' + error.message)
            }
        })
        
        // 在组件卸载时清理事件监听
        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeyPress)
        })
        
        // 响应式数据
        const uploadRef = ref(null)
        const pdfContainer = ref(null)
        const pdfDocument = ref(null)
        const currentPage = ref(1)
        const totalPages = ref(0)
        const scale = ref(1.3)
        
        // 调试信息
        console.log('Vue组件初始化完成，初始状态:', {
            pdfDocument: pdfDocument.value,
            totalPages: totalPages.value,
            currentPage: currentPage.value
        })
        const pageRefs = ref(new Map())
        const annotationRefs = ref(new Map())
        const drawingCanvases = ref(new Map())
        
        // 批注相关
        const annotationMode = ref('none')
        const isAnnotating = ref(false)
        const startPoint = ref({ x: 0, y: 0 })
        const noteDialogVisible = ref(false)
        const currentNoteContent = ref('')
        const currentAnnotation = ref(null)
        const currentEditingAnnotation = ref(null) // 当前正在编辑的批注
        const clickPosition = ref(null) // 记录点击位置
        

        
        // 批注数据
        const highlights = ref([])
        const annotations = ref([])
        const highlightIdCounter = ref(1)
        const annotationIdCounter = ref(1)
        
        // 当前绘制状态
        const isDrawing = ref(false)
        const startPos = ref({ x: 0, y: 0 })
        const currentSelection = ref(null)
        
        // 实时选择预览
        const selectionPreview = ref({
            show: false,
            x: 0,
            y: 0,
            width: 0,
            height: 0
        })
        
        // 绘制内容存储（按页面存储Canvas绘制数据）
        const drawingData = ref(new Map())
        
        // 颜色设置
        const highlightColor = ref('#ffff00') // 默认黄色
        const drawColor = ref('#ff0000') // 默认红色
        
        // 橡皮擦预览
        const eraserPreview = reactive({
            show: false,
            x: 0,
            y: 0,
            size: 80 // 橡皮擦大小，增大一倍
        })

        // 橡皮擦性能优化
        const eraserThrottle = ref({
            lastTime: 0,
            throttleDelay: 100, // 增加到100ms节流
            pendingOperations: new Set()
        })

        // 绘制性能优化
        const drawingThrottle = ref({
            lastSaveTime: 0,
            saveDelay: 200, // 200ms保存延迟
            saveTimer: null
        })

        // 设置页面引用
        const setPageRef = (el, pageNum) => {
            if (el) {
                pageRefs.value.set(pageNum, el)
            }
        }

        const setAnnotationRef = async (el, pageNum) => {
            if (el) {
                annotationRefs.value.set(pageNum, el)
                // 初始化原生Canvas绘制功能
                await nextTick()
                try {
                    initDrawingEvents(el, pageNum)
                    drawingCanvases.value.set(pageNum, el)
                    console.log(`第${pageNum}页的绘制画布初始化完成`)
                } catch (error) {
                    console.error(`第${pageNum}页绘制画布初始化失败:`, error)
                }
            }
        }

        // 初始化绘制事件
        const initDrawingEvents = (canvas, pageNum) => {
            const ctx = canvas.getContext('2d')
            let isDrawing = false
            let lastX = 0
            let lastY = 0
            
            // 设置绘制样式
            ctx.strokeStyle = drawColor.value
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            
            // 鼠标按下事件
            const handleMouseDown = (e) => {
                // 只有当前页面的canvas才能绘制
                if (annotationMode.value !== 'draw' || pageNum !== currentPage.value) return
                e.preventDefault()
                e.stopPropagation()
                
                // 每次开始绘制时重新设置样式，确保使用最新的颜色和线宽
                ctx.strokeStyle = drawColor.value
                ctx.lineWidth = 3
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                
                isDrawing = true
                const rect = canvas.getBoundingClientRect()
                lastX = e.clientX - rect.left
                lastY = e.clientY - rect.top
                
                console.log(`开始绘制 - 页面:${pageNum}，当前页:${currentPage.value}，颜色:${drawColor.value}`, { x: lastX, y: lastY })
            }
            
            // 鼠标移动事件
            const handleMouseMove = (e) => {
                // 只有当前页面的canvas才能绘制
                if (!isDrawing || annotationMode.value !== 'draw' || pageNum !== currentPage.value) return
                e.preventDefault()
                e.stopPropagation()
                
                const rect = canvas.getBoundingClientRect()
                const currentX = e.clientX - rect.left
                const currentY = e.clientY - rect.top
                
                // 确保绘制样式正确（防止样式丢失）
                if (ctx.strokeStyle !== drawColor.value || ctx.lineWidth !== 3) {
                    ctx.strokeStyle = drawColor.value
                    ctx.lineWidth = 3
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                }
                
                ctx.beginPath()
                ctx.moveTo(lastX, lastY)
                ctx.lineTo(currentX, currentY)
                ctx.stroke()
                
                lastX = currentX
                lastY = currentY
            }
            
            // 鼠标抬起事件
            const handleMouseUp = () => {
                if (isDrawing && pageNum === currentPage.value) {
                    isDrawing = false
                    // 延迟保存，减少频繁操作
                    debouncedSaveDrawing(pageNum)
                }
            }
            
            // 鼠标离开事件
            const handleMouseLeave = () => {
                if (isDrawing && pageNum === currentPage.value) {
                    isDrawing = false
                    // 延迟保存，减少频繁操作
                    debouncedSaveDrawing(pageNum)
                }
            }
            
            // 添加事件监听器
            canvas.addEventListener('mousedown', handleMouseDown)
            canvas.addEventListener('mousemove', handleMouseMove)
            canvas.addEventListener('mouseup', handleMouseUp)
            canvas.addEventListener('mouseleave', handleMouseLeave)
        }

        // 文件上传处理
        const handleFileUpload = (uploadFile, uploadFiles) => {
            console.log('开始处理文件:', uploadFile)
            console.log('文件信息:', {
                name: uploadFile.name,
                size: uploadFile.size,
                type: uploadFile.raw?.type
            })
            
            const file = uploadFile.raw
            if (!file) {
                callError('无法获取文件数据')
                return
            }
            
            if (file.type !== 'application/pdf') {
                callError('请选择PDF文件')
                return
            }
            
            callInfo('正在加载PDF文件...')
            
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    console.log('文件读取完成，开始解析PDF')
                    const typedArray = new Uint8Array(e.target.result)
                    console.log('PDF数据大小:', typedArray.length)
                    await loadPDF(typedArray)
                    callSuccess('PDF文件加载成功')
                } catch (error) {
                    console.error('PDF加载失败:', error)
                    callError('PDF文件加载失败: ' + error.message)
                }
            }
            
            reader.onerror = (error) => {
                console.error('文件读取失败:', error)
                callError('文件读取失败')
            }
            
            reader.readAsArrayBuffer(file)
        }

        // 加载PDF
        const loadPDF = async (data) => {
            try {
                console.log('开始使用PDF.js解析文档')
                
                // 确保PDF.js已加载
                const pdfjs = await loadPDFJS()
                
                console.log('PDF.js版本:', pdfjs.version || 'unknown')
                console.log('getDocument类型:', typeof pdfjs.getDocument)
                
                // 1.6版本的getDocument调用方式
                let loadingTask
                if (pdfjs.getDocument) {
                    // 新版本API
                    loadingTask = pdfjs.getDocument(data)
                } else if (window.PDFJS && window.PDFJS.getDocument) {
                    // 旧版本API
                    loadingTask = window.PDFJS.getDocument(data)
                }
                
                console.log('PDF加载任务创建完成，类型:', typeof loadingTask)
                
                let pdf
                if (loadingTask && loadingTask.promise) {
                    pdf = await loadingTask.promise
                } else if (loadingTask && typeof loadingTask.then === 'function') {
                    // 如果loadingTask本身就是promise
                    pdf = await loadingTask
                } else {
                    throw new Error('无法创建PDF加载任务')
                }
                
                console.log('PDF文档加载成功，页数:', pdf.numPages)
                
                // 先设置页数信息
                totalPages.value = pdf.numPages
                currentPage.value = 1
                
                console.log('准备设置PDF文档对象...')
                
                // 设置PDF文档对象（不使用nextTick，避免卡死）
                pdfDocument.value = pdf
                
                console.log('PDF文档对象设置完成')
                
                console.log('PDF状态更新完成:', {
                    totalPages: totalPages.value,
                    currentPage: currentPage.value,
                    pdfDocument: !!pdfDocument.value
                })
                
                // 等待DOM更新后渲染第一页
                await nextTick()
                await renderCurrentPage()
            } catch (error) {
                console.error('loadPDF错误详情:', error)
                throw error
            }
        }

        // 渲染当前页面
        const renderCurrentPage = async () => {
            console.log('renderCurrentPage开始，当前页:', currentPage.value)
            await renderPage(currentPage.value)
            console.log('当前页面渲染完成')
        }

        // 渲染单个页面
        const renderPage = async (pageNum) => {
            try {
                const page = await pdfDocument.value.getPage(pageNum)
                const canvas = pageRefs.value.get(pageNum)
                
                let finalCanvas = canvas
                if (!finalCanvas) {
                    await nextTick()
                    finalCanvas = pageRefs.value.get(pageNum)
                    if (!finalCanvas) {
                        console.log(`无法找到第${pageNum}页的canvas元素`)
                        return
                    }
                }

                // PDF.js 1.6版本使用旧版本API
                let viewport
                try {
                    viewport = page.getViewport(scale.value)
                } catch (e) {
                    try {
                        viewport = page.getViewport({ scale: scale.value })
                    } catch (e2) {
                        console.error(`获取第${pageNum}页viewport失败:`, e2)
                        return
                    }
                }
                
                const context = finalCanvas.getContext('2d')
                
                // 获取PDF原始尺寸
                const { width, height } = viewport
                
                // 直接应用用户设置的缩放级别，不限制最大尺寸
                const displayWidth = width * scale.value
                const displayHeight = height * scale.value
                
                // 设置canvas的实际像素尺寸（使用原始尺寸以保持清晰度）
                finalCanvas.width = width
                finalCanvas.height = height
                
                // 设置CSS显示尺寸（缩放后的尺寸）
                finalCanvas.style.width = displayWidth + 'px'
                finalCanvas.style.height = displayHeight + 'px'
                finalCanvas.style.display = 'block'
                finalCanvas.style.margin = '0 auto'

                // 设置批注层画布尺寸
                const annotationCanvas = annotationRefs.value.get(pageNum)
                if (annotationCanvas) {
                    // 设置canvas内部分辨率（清晰度）
                    annotationCanvas.width = displayWidth
                    annotationCanvas.height = displayHeight
                    
                    // 设置CSS尺寸
                    annotationCanvas.style.width = displayWidth + 'px'
                    annotationCanvas.style.height = displayHeight + 'px'
                    
                    // 重新设置绘制样式（因为改变canvas尺寸会重置context状态）
                    const ctx = annotationCanvas.getContext('2d')
                    ctx.strokeStyle = drawColor.value
                    ctx.lineWidth = 3
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                    
                    console.log(`第${pageNum}页annotation canvas尺寸和绘制样式已更新`)
                }

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                }

                await page.render(renderContext).promise
                console.log(`第${pageNum}页渲染完成，尺寸: ${width}x${height}`)
                
                // 渲染完成后恢复绘制内容
                setTimeout(() => restoreDrawingData(pageNum), 200)
            } catch (error) {
                console.error(`渲染第${pageNum}页失败:`, error)
            }
        }

        // 缩放控制
        const zoomIn = async () => {
            if (scale.value < 4) {
                scale.value = Math.min(scale.value + 0.2, 4)
                await nextTick()
                await renderCurrentPage()
            }
        }

        const zoomOut = async () => {
            if (scale.value > 0.3) {
                scale.value = Math.max(scale.value - 0.2, 0.3)
                await nextTick()
                await renderCurrentPage()
            }
        }

        const resetZoom = async () => {
            scale.value = 1.3
            await nextTick()
            await renderCurrentPage()
        }

        // 页面导航
        const nextPage = async () => {
            if (currentPage.value < totalPages.value) {
                // 立即保存当前页面的绘制内容
                saveDrawingData(currentPage.value)
                
                currentPage.value++
                
                await nextTick()
                await renderCurrentPage()
                
                // 恢复新页面的绘制内容
                setTimeout(() => {
                    restoreDrawingData(currentPage.value)
                }, 200)
            }
        }

        const prevPage = async () => {
            if (currentPage.value > 1) {
                // 立即保存当前页面的绘制内容
                saveDrawingData(currentPage.value)
                
                currentPage.value--
                
                await nextTick()
                await renderCurrentPage()
                
                // 恢复新页面的绘制内容
                setTimeout(() => {
                    restoreDrawingData(currentPage.value)
                }, 200)
            }
        }

        const scrollToPage = async (pageNum) => {
            if (pageNum >= 1 && pageNum <= totalPages.value) {
                // 立即保存当前页面的绘制内容
                saveDrawingData(currentPage.value)
                
                currentPage.value = pageNum
                
                await nextTick()
                await renderCurrentPage()
                
                // 恢复新页面的绘制内容
                setTimeout(() => {
                    restoreDrawingData(currentPage.value)
                }, 200)
            }
        }

        // 批注模式设置
        const setAnnotationMode = async (mode) => {
            console.log('设置批注模式:', mode)
            annotationMode.value = mode
            
            // 隐藏橡皮擦预览（切换到其他模式时）
            if (mode !== 'eraser') {
                eraserPreview.show = false
            }
            
            // 更新DOM class来控制cursor样式
            await nextTick()
            const overlays = document.querySelectorAll('.annotation-overlay')
            overlays.forEach(overlay => {
                // 清除所有模式class
                overlay.classList.remove('highlight-mode', 'note-mode', 'draw-mode', 'eraser-mode')
                // 添加当前模式class
                if (mode !== 'none') {
                    overlay.classList.add(mode + '-mode')
                }
            })
            
            console.log('批注模式设置完成:', mode, '当前值:', annotationMode.value)
        }

        // 统一的overlay事件处理
        const handleOverlayMouseDown = (event) => {
            console.log('Overlay mousedown, mode:', annotationMode.value)
            if (annotationMode.value === 'draw') {
                // 绘制模式由Canvas事件处理
                return
            } else if (annotationMode.value === 'eraser') {
                startErasing(event)
            } else if (annotationMode.value === 'highlight' || annotationMode.value === 'note') {
                startAnnotation(event)
            }
        }

        const handleOverlayMouseMove = (event) => {
            if (annotationMode.value === 'draw') {
                return
            } else if (annotationMode.value === 'eraser') {
                // 更新橡皮擦预览位置
                const rect = event.currentTarget.getBoundingClientRect()
                eraserPreview.x = event.clientX - rect.left - eraserPreview.size / 2
                eraserPreview.y = event.clientY - rect.top - eraserPreview.size / 2
                eraserPreview.show = true
                
                updateErasing(event)
            } else if (annotationMode.value === 'highlight' || annotationMode.value === 'note') {
                updateAnnotation(event)
            }
        }

        const handleOverlayMouseUp = (event) => {
            if (annotationMode.value === 'draw') {
                return
            } else if (annotationMode.value === 'eraser') {
                finishErasing(event)
            } else if (annotationMode.value === 'highlight' || annotationMode.value === 'note') {
                finishAnnotation(event)
            }
        }

        const handleOverlayMouseLeave = (event) => {
            if (annotationMode.value === 'draw') {
                return
            } else if (annotationMode.value === 'eraser') {
                // 隐藏橡皮擦预览
                eraserPreview.show = false
                cancelErasing()
            } else {
                cancelAnnotation()
            }
        }

        // 批注交互方法（高亮和文字批注）
        const startAnnotation = (event) => {
            // 阻止默认事件
            event.preventDefault()
            event.stopPropagation()
            
            isAnnotating.value = true
            
            // 获取annotation-overlay相对于视口的位置
            const overlayRect = event.currentTarget.getBoundingClientRect()
            
            console.log('坐标计算详情:', {
                eventClient: { x: event.clientX, y: event.clientY },
                overlayRect: {
                    left: overlayRect.left,
                    top: overlayRect.top,
                    width: overlayRect.width,
                    height: overlayRect.height
                }
            })
            
            // 计算相对于annotation-overlay的坐标
            const relativeX = event.clientX - overlayRect.left
            const relativeY = event.clientY - overlayRect.top
            
            console.log('计算结果:', {
                relativeX,
                relativeY,
                calculation: `${event.clientX} - ${overlayRect.left} = ${relativeX}`
            })
            
            startPoint.value = {
                x: relativeX,
                y: relativeY
            }
            
            // 记录点击位置用于批注图标定位
            clickPosition.value = {
                x: relativeX,
                y: relativeY
            }
            
            // 如果是高亮模式，初始化选择预览
            if (annotationMode.value === 'highlight') {
                selectionPreview.value = {
                    show: true,
                    x: relativeX,
                    y: relativeY,
                    width: 0,
                    height: 0
                }
            }
            
            console.log('开始批注', {
                mode: annotationMode.value,
                startPos: startPoint.value,
                clickPos: clickPosition.value,
                overlayRect: {
                    left: overlayRect.left,
                    top: overlayRect.top,
                    width: overlayRect.width,
                    height: overlayRect.height
                },
                clientX: event.clientX,
                clientY: event.clientY,
                viewportOffset: {
                    x: event.clientX - overlayRect.left,
                    y: event.clientY - overlayRect.top
                }
            })
        }

        const updateAnnotation = (event) => {
            if (!isAnnotating.value) return
            
            event.preventDefault()
            event.stopPropagation()
            
            // 如果是高亮模式，更新选择预览
            if (annotationMode.value === 'highlight') {
                const overlayRect = event.currentTarget.getBoundingClientRect()
                const currentX = event.clientX - overlayRect.left
                const currentY = event.clientY - overlayRect.top
                
                // 计算选择框的位置和大小
                const minX = Math.min(startPoint.value.x, currentX)
                const minY = Math.min(startPoint.value.y, currentY)
                const maxX = Math.max(startPoint.value.x, currentX)
                const maxY = Math.max(startPoint.value.y, currentY)
                
                selectionPreview.value = {
                    show: true,
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                }
            }
        }

        const finishAnnotation = (event) => {
            if (!isAnnotating.value) return
            
            isAnnotating.value = false
            
            event.preventDefault()
            event.stopPropagation()
            
            // 隐藏选择预览
            selectionPreview.value.show = false
            
            // 获取annotation-overlay相对于视口的位置
            const overlayRect = event.currentTarget.getBoundingClientRect()
            
            // 计算相对于annotation-overlay的坐标
            const endPos = {
                x: event.clientX - overlayRect.left,
                y: event.clientY - overlayRect.top
            }
            
            // 计算选择区域
            const selection = {
                x: Math.min(startPoint.value.x, endPos.x),
                y: Math.min(startPoint.value.y, endPos.y),
                width: Math.abs(endPos.x - startPoint.value.x),
                height: Math.abs(endPos.y - startPoint.value.y)
            }
            
            console.log('结束批注', {
                mode: annotationMode.value,
                selection,
                isClick: selection.width < 10 && selection.height < 10
            })
            
            // 检查是否是点击（没有拖拽）
            if (selection.width < 10 && selection.height < 10) {
                // 单纯点击，直接在点击位置创建批注
                if (annotationMode.value === 'note') {
                    console.log('检测到点击模式，设置currentSelection:', {
                        clickPosition: clickPosition.value,
                        calculatedSelection: {
                            x: clickPosition.value.x - 10,
                            y: clickPosition.value.y - 10,
                            width: 20,
                            height: 20
                        }
                    })
                    
                    // 创建一个小的虚拟选择区域用于数据存储
                    currentSelection.value = {
                        x: clickPosition.value.x - 10,
                        y: clickPosition.value.y - 10,
                        width: 20,
                        height: 20
                    }
                    
                    console.log('设置currentSelection后的值:', currentSelection.value)
                    noteDialogVisible.value = true
                }
                return
            }
            
            // 有实际选择区域（拖拽）
            if (annotationMode.value === 'highlight') {
                addHighlight(selection)
            } else if (annotationMode.value === 'note') {
                currentSelection.value = selection
                noteDialogVisible.value = true
            }
        }

        const cancelAnnotation = () => {
            isAnnotating.value = false
            currentSelection.value = null
            // 隐藏选择预览
            selectionPreview.value.show = false
        }

        // 高亮功能
        const addHighlight = (selection) => {
            const highlight = {
                id: highlightIdCounter.value++,
                page: currentPage.value,
                x: selection.x,
                y: selection.y,
                width: selection.width,
                height: selection.height,
                color: highlightColor.value,
                timestamp: new Date().toLocaleString()
            }
            highlights.value.push(highlight)
        }

        const getPageHighlights = (pageNum) => {
            return highlights.value.filter(h => h.page === pageNum)
        }

        const getHighlightStyle = (highlight) => {
            const color = highlight.color || '#ffff00'
            return {
                left: highlight.x + 'px',
                top: highlight.y + 'px',
                width: highlight.width + 'px',
                height: highlight.height + 'px',
                backgroundColor: color,
                opacity: '0.3',
                border: 'none'
            }
        }

        const selectHighlight = (highlight) => {
            // 可以实现高亮选择和编辑功能
            console.log('选中高亮:', highlight)
        }

        // 删除高亮
        const deleteHighlight = (highlightId) => {
            const index = highlights.value.findIndex(h => h.id === highlightId)
            if (index > -1) {
                highlights.value.splice(index, 1)
                console.log(`删除了高亮 ID: ${highlightId}`)
            }
        }

        // 显示高亮右键菜单
        const showHighlightContextMenu = (event, highlight) => {
            // 可以在这里添加右键菜单功能
            console.log('高亮右键菜单:', highlight)
            // 简单实现：直接删除
            if (confirm('确定要删除这个高亮吗？')) {
                deleteHighlight(highlight.id)
            }
        }

        // 批注功能
        const addAnnotation = (selection, content, clickPosition = null) => {
            console.log('addAnnotation被调用:', {
                selection,
                content,
                clickPosition,
                hasClickPosition: !!clickPosition
            })
            
            // 简化逻辑：如果有点击位置，直接使用；否则使用选择区域中心
            let finalX, finalY
            
            if (clickPosition && clickPosition.x !== undefined && clickPosition.y !== undefined) {
                finalX = clickPosition.x
                finalY = clickPosition.y
                console.log('使用点击位置:', { x: finalX, y: finalY })
            } else {
                finalX = selection.x + selection.width / 2
                finalY = selection.y
                console.log('使用选择区域中心:', { x: finalX, y: finalY })
            }
            
            const annotation = {
                id: annotationIdCounter.value++,
                page: currentPage.value,
                x: finalX,
                y: finalY,
                content: content,
                timestamp: new Date().toLocaleString()
            }
            
            annotations.value.push(annotation)
            
            console.log('批注已添加:', annotation)
        }

        const getPageAnnotations = (pageNum) => {
            const pageAnnotations = annotations.value.filter(a => a.page === pageNum)
            console.log(`第${pageNum}页的批注:`, pageAnnotations)
            return pageAnnotations
        }

        const getAnnotationStyle = (annotation) => {
            const style = {
                left: annotation.x + 'px',
                top: annotation.y + 'px'
            }
            
            return style
        }

        const showAnnotationDialog = (annotation) => {
            console.log('显示批注对话框:', annotation)
            currentNoteContent.value = annotation.content
            currentEditingAnnotation.value = annotation
            currentSelection.value = {
                x: annotation.x - 50,
                y: annotation.y,
                width: 100,
                height: 30
            }
            noteDialogVisible.value = true
        }

        // 删除批注
        const deleteAnnotation = (annotationId) => {
            const index = annotations.value.findIndex(a => a.id === annotationId)
            if (index > -1) {
                annotations.value.splice(index, 1)
                console.log(`删除了批注 ID: ${annotationId}`)
            }
        }

        // 显示批注右键菜单
        const showAnnotationContextMenu = (event, annotation) => {
            // 可以在这里添加右键菜单功能
            console.log('批注右键菜单:', annotation)
            // 简单实现：直接删除
            if (confirm('确定要删除这个批注吗？')) {
                deleteAnnotation(annotation.id)
            }
        }

        const saveAnnotation = () => {
            if (currentSelection.value && currentNoteContent.value) {
                addAnnotation(currentSelection.value, currentNoteContent.value)
            }
            
            currentSelection.value = null
            currentNoteContent.value = ''
            noteDialogVisible.value = false
        }



        const saveCurrentNote = () => {
            console.log('保存批注被调用', {
                content: currentNoteContent.value,
                selection: currentSelection.value,
                clickPosition: clickPosition.value,
                currentPage: currentPage.value,
                isEditing: !!currentEditingAnnotation.value
            })
            
            if (!currentNoteContent.value.trim()) {
                return
            }
            
            // 如果是编辑模式，更新现有批注
            if (currentEditingAnnotation.value) {
                const annotationIndex = annotations.value.findIndex(a => a.id === currentEditingAnnotation.value.id)
                if (annotationIndex > -1) {
                    annotations.value[annotationIndex].content = currentNoteContent.value
                    annotations.value[annotationIndex].timestamp = new Date().toLocaleString()
                    

                    
                    console.log('批注已更新:', annotations.value[annotationIndex])
                }
            } else {
                // 新增批注的逻辑保持不变
                if (clickPosition.value && clickPosition.value.x !== undefined && clickPosition.value.y !== undefined) {
                    console.log('使用点击位置保存批注:', clickPosition.value)
                    
                    const virtualSelection = {
                        x: clickPosition.value.x - 10,
                        y: clickPosition.value.y - 10,
                        width: 20,
                        height: 20
                    }
                    
                    addAnnotation(virtualSelection, currentNoteContent.value, clickPosition.value)
                } else if (currentSelection.value) {
                    console.log('使用选择区域保存批注:', currentSelection.value)
                    
                    addAnnotation(currentSelection.value, currentNoteContent.value, null)
                } else {
                    console.log('没有点击位置和选择区域，使用默认位置')
                    
                    const defaultSelection = {
                        x: 50,
                        y: 50,
                        width: 100,
                        height: 30
                    }
                    
                    const defaultClickPos = {
                        x: 50,
                        y: 50
                    }
                    
                    addAnnotation(defaultSelection, currentNoteContent.value, defaultClickPos)
                }
            }
            
            // 清理状态
            currentSelection.value = null
            currentNoteContent.value = ''
            currentEditingAnnotation.value = null
            noteDialogVisible.value = false
            
            console.log('批注保存完成')
        }
        
        const cancelNote = () => {
            noteDialogVisible.value = false
            currentAnnotation.value = null
            currentNoteContent.value = ''
            currentEditingAnnotation.value = null
        }

        // 删除当前正在编辑的批注
        const deleteCurrentAnnotation = () => {
            if (currentEditingAnnotation.value) {
                deleteAnnotation(currentEditingAnnotation.value.id)
                noteDialogVisible.value = false
                currentNoteContent.value = ''
                currentEditingAnnotation.value = null
            }
        }



        // 防抖保存函数
        const debouncedSaveDrawing = (pageNum) => {
            // 清除之前的定时器
            if (drawingThrottle.value.saveTimer) {
                clearTimeout(drawingThrottle.value.saveTimer)
            }
            
            // 设置新的定时器
            drawingThrottle.value.saveTimer = setTimeout(() => {
                saveDrawingData(pageNum)
            }, drawingThrottle.value.saveDelay)
        }

        // 保存当前页面的绘制内容（优化版本）
        const saveDrawingData = (pageNum) => {
            const canvas = annotationRefs.value.get(pageNum)
            if (!canvas) return
            
            try {
                const imageData = canvas.toDataURL()
                // 检查是否是空白画布（避免保存空白内容）
                const emptyCanvas = document.createElement('canvas')
                emptyCanvas.width = canvas.width
                emptyCanvas.height = canvas.height
                const emptyData = emptyCanvas.toDataURL()
                
                if (imageData !== emptyData) {
                    drawingData.value.set(pageNum, imageData)
                } else {
                    // 如果是空白，删除之前保存的数据
                    drawingData.value.delete(pageNum)
                }
            } catch (error) {
                console.error(`保存第${pageNum}页绘制内容失败:`, error)
            }
        }

        // 恢复页面的绘制内容
        const restoreDrawingData = (pageNum) => {
            const canvas = annotationRefs.value.get(pageNum)
            const savedData = drawingData.value.get(pageNum)
            
            if (!canvas) return
            
            const ctx = canvas.getContext('2d')
            // 先完全清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            if (savedData && savedData !== 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==') {
                const img = new Image()
                img.onload = () => {
                    // 再次确保画布是干净的
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, 0, 0)
                    
                    // 恢复绘制内容后，重新设置绘制样式
                    ctx.strokeStyle = drawColor.value
                    ctx.lineWidth = 3
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                }
                img.onerror = () => {
                    console.error(`第${pageNum}页绘制内容恢复失败`)
                }
                img.src = savedData
            } else {
                // 即使没有绘制内容，也要设置绘制样式
                ctx.strokeStyle = drawColor.value
                ctx.lineWidth = 3
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
            }
        }

        // 清除当前页面的绘制内容
        const clearDrawing = () => {
            const canvas = annotationRefs.value.get(currentPage.value)
            if (canvas) {
                const ctx = canvas.getContext('2d')
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                // 从存储中删除
                drawingData.value.delete(currentPage.value)
            }
        }

        // 更新颜色
        const updateColor = (event) => {
            const newColor = event.target.value
            console.log('更新颜色:', newColor, '模式:', annotationMode.value)
            
            if (annotationMode.value === 'highlight') {
                highlightColor.value = newColor
                console.log('高亮颜色已更新为:', newColor)
            } else if (annotationMode.value === 'draw') {
                drawColor.value = newColor
                console.log('绘制颜色已更新为:', newColor)
                
                // 更新所有annotation canvas的绘制样式（绘制是在annotation canvas上进行的）
                annotationRefs.value.forEach((canvas, pageNum) => {
                    if (canvas) {
                        const ctx = canvas.getContext('2d')
                        ctx.strokeStyle = newColor
                        ctx.lineWidth = 3
                        ctx.lineCap = 'round'
                        ctx.lineJoin = 'round'
                        console.log(`第${pageNum}页canvas绘制样式已更新`)
                    }
                })
            }
        }

        // 橡皮擦功能
        const startErasing = (event) => {
            event.preventDefault()
            event.stopPropagation()
            
            isAnnotating.value = true
            const rect = event.currentTarget.getBoundingClientRect()
            const currentPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            }
            startPoint.value = currentPos
            
            // 立即开始清除
            performErase(currentPos)
            
            console.log('开始橡皮擦', startPoint.value)
        }

        const updateErasing = (event) => {
            if (!isAnnotating.value) return
            
            event.preventDefault()
            event.stopPropagation()
            
            const rect = event.currentTarget.getBoundingClientRect()
            const currentPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            }
            
            // 在拖拽过程中持续清除
            performErase(currentPos)
        }

        // 执行清除操作（优化版本）
        const performErase = (centerPos) => {
            const now = Date.now()
            
            // 节流控制
            if (now - eraserThrottle.value.lastTime < eraserThrottle.value.throttleDelay) {
                return
            }
            eraserThrottle.value.lastTime = now
            
            const eraseArea = {
                x: centerPos.x - eraserPreview.size / 2,
                y: centerPos.y - eraserPreview.size / 2,
                width: eraserPreview.size,
                height: eraserPreview.size
            }
            
            // 批量处理，减少频繁的数组操作
            let hasChanges = false
            
            // 删除重叠的高亮（优化版）
            const highlightChanges = eraseHighlightsOptimized(eraseArea)
            if (highlightChanges > 0) hasChanges = true
            
            // 删除重叠的批注（优化版）
            const annotationChanges = eraseAnnotationsOptimized(eraseArea)
            if (annotationChanges > 0) hasChanges = true
            
            // 清除Canvas绘制内容（使用圆形清除）
            eraseDrawingCircular(centerPos, eraserPreview.size / 2)
            
            // 只在需要时输出调试信息
            if (hasChanges && (highlightChanges > 0 || annotationChanges > 0)) {
                console.log(`橡皮擦清除: ${highlightChanges}个高亮, ${annotationChanges}个批注`)
            }
        }

        const finishErasing = (event) => {
            if (!isAnnotating.value) return
            
            isAnnotating.value = false
            
            event.preventDefault()
            event.stopPropagation()
            
            console.log('橡皮擦操作结束')
        }

        const cancelErasing = () => {
            isAnnotating.value = false
        }

        // 删除重叠的高亮（优化版本）
        const eraseHighlightsOptimized = (eraseArea) => {
            const toDelete = []
            const pageHighlights = highlights.value.filter(h => h.page === currentPage.value)
            
            // 收集需要删除的高亮
            pageHighlights.forEach(highlight => {
                if (isOverlapping(highlight, eraseArea)) {
                    toDelete.push(highlight.id)
                }
            })
            
            // 批量删除
            if (toDelete.length > 0) {
                highlights.value = highlights.value.filter(h => !toDelete.includes(h.id))
            }
            
            return toDelete.length
        }

        // 删除重叠的高亮（原版本，保留作为备用）
        const eraseHighlights = (eraseArea) => {
            const pageHighlights = highlights.value.filter(h => h.page === currentPage.value)
            let erasedCount = 0
            
            pageHighlights.forEach(highlight => {
                if (isOverlapping(highlight, eraseArea)) {
                    const index = highlights.value.findIndex(h => h.id === highlight.id)
                    if (index > -1) {
                        highlights.value.splice(index, 1)
                        erasedCount++
                    }
                }
            })
            
            if (erasedCount > 0) {
                console.log(`删除了${erasedCount}个高亮`)
            }
        }

        // 删除重叠的批注（优化版本）
        const eraseAnnotationsOptimized = (eraseArea) => {
            const toDelete = []
            const pageAnnotations = annotations.value.filter(a => a.page === currentPage.value)
            
            // 收集需要删除的批注
            pageAnnotations.forEach(annotation => {
                if (isPointInArea(annotation, eraseArea)) {
                    toDelete.push(annotation.id)
                }
            })
            
            // 批量删除批注
            if (toDelete.length > 0) {
                annotations.value = annotations.value.filter(a => !toDelete.includes(a.id))
            }
            
            return toDelete.length
        }

        // 删除重叠的批注（原版本，保留作为备用）
        const eraseAnnotations = (eraseArea) => {
            const pageAnnotations = annotations.value.filter(a => a.page === currentPage.value)
            let erasedCount = 0
            
            pageAnnotations.forEach(annotation => {
                if (isPointInArea(annotation, eraseArea)) {
                    const index = annotations.value.findIndex(a => a.id === annotation.id)
                    if (index > -1) {
                        annotations.value.splice(index, 1)
                        erasedCount++
                    }
                    

                }
            })
            
            if (erasedCount > 0) {
                console.log(`删除了${erasedCount}个批注`)
            }
        }

        // 清除Canvas绘制内容（圆形清除）
        const eraseDrawingCircular = (centerPos, radius) => {
            const canvas = annotationRefs.value.get(currentPage.value)
            if (canvas) {
                const ctx = canvas.getContext('2d')
                // 保存当前状态
                ctx.save()
                // 设置全局合成操作为清除模式
                ctx.globalCompositeOperation = 'destination-out'
                // 绘制圆形清除区域
                ctx.beginPath()
                ctx.arc(centerPos.x, centerPos.y, radius, 0, 2 * Math.PI)
                ctx.fill()
                // 恢复状态
                ctx.restore()
                // 重新保存绘制数据
                saveDrawingData(currentPage.value)
            }
        }

        // 清除Canvas绘制内容（矩形清除，保留作为备用）
        const eraseDrawing = (eraseArea) => {
            const canvas = annotationRefs.value.get(currentPage.value)
            if (canvas) {
                const ctx = canvas.getContext('2d')
                ctx.clearRect(eraseArea.x, eraseArea.y, eraseArea.width, eraseArea.height)
                // 重新保存绘制数据
                saveDrawingData(currentPage.value)
                console.log('清除了绘制内容')
            }
        }

        // 检查两个矩形是否重叠
        const isOverlapping = (rect1, rect2) => {
            return !(rect1.x + rect1.width < rect2.x || 
                    rect2.x + rect2.width < rect1.x || 
                    rect1.y + rect1.height < rect2.y || 
                    rect2.y + rect2.height < rect1.y)
        }

        // 检查点是否在区域内
        const isPointInArea = (point, area) => {
            return point.x >= area.x && 
                   point.x <= area.x + area.width && 
                   point.y >= area.y && 
                   point.y <= area.y + area.height
        }

        // 检查点是否在圆形区域内
        const isPointInCircle = (point, centerPos, radius) => {
            const dx = point.x - centerPos.x
            const dy = point.y - centerPos.y
            return Math.sqrt(dx * dx + dy * dy) <= radius
        }



        return {
            // refs
            uploadRef,
            pdfContainer,
            
            // 数据
            pdfDocument,
            currentPage,
            totalPages,
            scale,
            annotationMode,

            noteDialogVisible,
            currentNoteContent,
            highlights,
            annotations,
            highlightColor,
            drawColor,
            clickPosition,
            eraserPreview,
            selectionPreview,
            currentEditingAnnotation,
            
            // 方法
            handleFileUpload,
            zoomIn,
            zoomOut,
            resetZoom,
            nextPage,
            prevPage,
            scrollToPage,
            setAnnotationMode,
            handleOverlayMouseDown,
            handleOverlayMouseMove,
            handleOverlayMouseUp,
            handleOverlayMouseLeave,
            addHighlight,
            getPageHighlights,
            getHighlightStyle,
            selectHighlight,
            addAnnotation,
            getPageAnnotations,
            getAnnotationStyle,
            showAnnotationDialog,
            saveAnnotation,
            saveCurrentNote,
            cancelNote,
            clearDrawing,
            updateColor,
            startErasing,
            updateErasing,
            finishErasing,
            cancelErasing,
            saveDrawingData,
            restoreDrawingData,
            debouncedSaveDrawing,
            setPageRef,
            setAnnotationRef,
            performErase,
            eraseDrawingCircular,
            isPointInCircle,
            deleteAnnotation,
            deleteHighlight,
            showAnnotationContextMenu,
            showHighlightContextMenu,
            deleteCurrentAnnotation,
            eraseHighlightsOptimized,
            eraseAnnotationsOptimized,
            
            // 图标
            Upload,
            Download,
            ZoomIn,
            ZoomOut,
            ArrowLeft,
            ArrowRight,
            Document,
            Plus,
            Delete,
            Edit,
            Close
        }
    }
}
</script>

<style scoped>
/* 防止横向滚动 */
* {
    box-sizing: border-box;
}

/* 背景容器 - 与profile页面一致 */
.bg-container {
    background: url('@/asset/home/homehead.png');
    position: fixed;
    height: 100vh;
    width: 100vw;
    z-index: -2;
    top: 0;
    left: 0;
    background-size: cover;
}

.pdf-reader-container {
    min-height: 100vh;
    margin-top: 100px;
    display: flex;
    justify-content: center;
    width: 100%;
    max-width: 100vw;
    padding: 0 15px;
    overflow-x: hidden;
    box-sizing: border-box;
}

.main-content {
    max-width: 1200px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
    min-height: calc(100vh - 120px);
}

/* 工具栏卡片 - 与profile页面风格一致 */
.toolbar-card {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    padding: 20px 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.toolbar-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* 现代化按钮样式 */
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



/* 控制组样式 */
.control-group {
    display: flex;
    align-items: center;
    gap: 20px;
}

.zoom-controls,
.annotation-controls {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn,
.annotation-btn {
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

.notes-toggle-btn {
    font-family: 'Meiryo', sans-serif;
    border-radius: 16px;
    padding: 8px 16px;
    font-size: 14px;
    transition: all 0.3s ease;
    height: 40px;
}

/* 颜色控制器 */
.color-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    border: 1px solid #e0e0e0;
}

.color-label {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #666;
    font-weight: 500;
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

/* PDF容器 */
.pdf-container {
    display: flex;
    gap: 15px;
    min-height: calc(100vh - 300px);
}

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

/* 空状态 */
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

/* PDF内容区域 */
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

/* 自定义滚动条 */
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

/* 页面包装器 */
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

/* PDF层 */
.pdf-layer {
    position: relative;
    z-index: 1;
}

/* PDF页面样式 */
.pdf-page {
    display: block;
    border-radius: 4px;
    background: white;
}

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

/* 翻页提示 */
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

/* 键盘快捷键提示 */
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

/* 对话框footer样式 */
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

/* 响应式设计 */
@media (max-width: 1024px) {
    .toolbar-card {
        flex-wrap: wrap;
        gap: 12px;
        padding: 15px 20px;
    }
    
    .control-group {
        gap: 10px;
    }
}

@media (max-width: 768px) {
    .pdf-reader-container {
        padding: 0 10px;
        margin-top: 80px;
    }
    
    .toolbar-card {
        padding: 15px;
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
    }
    
    .toolbar-left,
    .toolbar-center,
    .toolbar-right {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .pdf-pages {
        padding: 15px;
    }
}
</style>