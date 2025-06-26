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
                    </el-button-group>
                    
                    <el-button 
                        v-if="pdfDocument"
                        :icon="Notebook" 
                        @click="toggleNotesPanel"
                        :type="showNotesPanel ? 'primary' : 'default'"
                        class="notes-toggle-btn"
                    >
                        笔记面板
                    </el-button>
                </div>
            </div>

            <!-- PDF显示和笔记区域 -->
            <div class="pdf-container" :class="{ 'with-notes': showNotesPanel }">
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
                                        @mousedown="startAnnotation"
                                        @mousemove="updateAnnotation"
                                        @mouseup="finishAnnotation"
                                        @mouseleave="cancelAnnotation"
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
                                            ></div>
                                        </div>
                                        
                                        <!-- 批注标记层 -->
                                        <div class="annotations-layer">
                                            <div 
                                                v-for="annotation in getPageAnnotations(currentPage)" 
                                                :key="annotation.id"
                                                class="annotation-marker"
                                                :style="getAnnotationStyle(annotation)"
                                                @click="showAnnotationDialog(annotation)"
                                            >
                                                <el-icon><Edit /></el-icon>
                                            </div>
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

                <!-- 笔记侧边栏 -->
                <div v-if="showNotesPanel" class="notes-sidebar">
                    <div class="notes-header">
                        <h3>笔记与批注</h3>
                        <el-button 
                            @click="showNotesPanel = false"
                            icon="el-icon-close"
                            size="small"
                            circle
                            class="close-btn"
                        ></el-button>
                    </div>
                    
                    <div class="notes-content">
                        <div v-if="notes.length === 0" class="no-notes">
                            <el-empty description="暂无笔记" :image-size="80"></el-empty>
                        </div>
                        
                        <div v-else class="notes-list">
                            <div 
                                v-for="note in notes" 
                                :key="note.id"
                                class="note-item"
                                @click="scrollToPage(note.page)"
                            >
                                <div class="note-header">
                                    <span class="note-page">第{{ note.page }}页</span>
                                    <span class="note-type">{{ note.type }}</span>
                                    <el-button 
                                        @click.stop="deleteNote(note.id)"
                                        icon="el-icon-delete"
                                        size="mini"
                                        type="text"
                                    ></el-button>
                                </div>
                                <div class="note-content">{{ note.content }}</div>
                                <div class="note-time">{{ formatTime(note.timestamp) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 文字批注对话框 -->
            <el-dialog
                v-model="noteDialogVisible"
                title="添加批注"
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
                    <el-button @click="cancelNote">取消</el-button>
                    <el-button type="primary" @click="saveCurrentNote">保存</el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { 
    Upload, Download, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, 
    Document, Notebook, Plus, Delete, Edit 
} from '@element-plus/icons-vue'
import { callSuccess, callError, callInfo } from '@/call'
// 使用本地的PDF.js和CDN的Fabric.js
let pdfjsLib = null
let fabric = null

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

// 动态加载Fabric.js
const loadFabricJS = async () => {
    if (fabric) return fabric
    
    console.log('开始加载Fabric.js脚本...')
    
    // 加载Fabric.js脚本
    if (!window.fabric) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js'
        document.head.appendChild(script)
        
        await new Promise((resolve, reject) => {
            script.onload = () => {
                console.log('Fabric.js脚本加载完成')
                resolve()
            }
            script.onerror = (error) => {
                console.error('Fabric.js脚本加载失败:', error)
                reject(error)
            }
        })
        
        // 等待一小段时间确保全局变量已设置
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (!window.fabric) {
        throw new Error('Fabric.js加载失败：未找到全局对象')
    }
    
    fabric = window.fabric
    console.log('Fabric.js配置完成')
    return fabric
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
                console.log('开始加载依赖库...')
                
                // 并行加载PDF.js和Fabric.js
                const [pdfjs, fabricjs] = await Promise.all([
                    loadPDFJS(),
                    loadFabricJS()
                ])
                
                console.log('所有依赖库加载成功')
                console.log('PDF.js配置:', {
                    version: pdfjs.version || 'unknown',
                    workerSrc: pdfjs.GlobalWorkerOptions?.workerSrc || pdfjs.workerSrc || 'unknown',
                    getDocument: typeof pdfjs.getDocument
                })
                
                // 测试基本功能
                console.log('测试Fabric.js:', typeof fabricjs)
                console.log('测试Fabric.Canvas:', fabricjs?.Canvas ? 'OK' : 'NOT FOUND')
                console.log('测试PDF.js getDocument:', typeof pdfjs.getDocument)
                console.log('测试callSuccess:', typeof callSuccess)
                
                // 显示加载成功消息
                callSuccess('PDF阅读器初始化完成，请上传PDF文件')
                
                // 添加功能说明（方便用户使用）
                setTimeout(() => {
                    callInfo('使用说明：上传PDF后，点击工具栏的"高亮"、"批注"、"绘制"按钮进行标注')
                }, 3000)
            } catch (error) {
                console.error('依赖库加载失败:', error)
                callError('依赖库加载失败: ' + error.message)
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
        const fabricCanvases = ref(new Map())
        
        // 批注相关
        const annotationMode = ref('none')
        const isAnnotating = ref(false)
        const startPoint = ref({ x: 0, y: 0 })
        const noteDialogVisible = ref(false)
        const currentNoteContent = ref('')
        const currentAnnotation = ref(null)
        
        // 笔记相关
        const showNotesPanel = ref(false)
        const notes = ref([])
        const noteIdCounter = ref(1)
        
        // 批注数据
        const highlights = ref([])
        const annotations = ref([])
        const highlightIdCounter = ref(1)
        const annotationIdCounter = ref(1)
        
        // 当前绘制状态
        const isDrawing = ref(false)
        const startPos = ref({ x: 0, y: 0 })
        const currentSelection = ref(null)

        // 设置页面引用
        const setPageRef = (el, pageNum) => {
            if (el) {
                pageRefs.value.set(pageNum, el)
            }
        }

        const setAnnotationRef = async (el, pageNum) => {
            if (el) {
                annotationRefs.value.set(pageNum, el)
                // 初始化Fabric.js画布
                await nextTick()
                try {
                    // 确保Fabric.js已加载
                    const fabricjs = await loadFabricJS()
                    
                    if (fabricjs && fabricjs.Canvas) {
                        const canvas = new fabricjs.Canvas(el, {
                            isDrawingMode: false,
                            selection: false,
                            backgroundColor: 'transparent'
                        })
                        
                        // 设置绘制画笔
                        canvas.freeDrawingBrush.width = 3
                        canvas.freeDrawingBrush.color = '#ff0000'
                        
                        fabricCanvases.value.set(pageNum, canvas)
                        console.log(`第${pageNum}页的Fabric画布初始化完成`)
                    } else {
                        console.error('Fabric.js Canvas未找到')
                    }
                } catch (error) {
                    console.error(`第${pageNum}页Fabric画布初始化失败:`, error)
                }
            }
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
                    
                    // 更新Fabric画布尺寸
                    const fabricCanvas = fabricCanvases.value.get(pageNum)
                    if (fabricCanvas) {
                        fabricCanvas.setDimensions({
                            width: displayWidth,
                            height: displayHeight
                        })
                        fabricCanvas.renderAll()
                    }
                }

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                }

                await page.render(renderContext).promise
                console.log(`第${pageNum}页渲染完成，尺寸: ${width}x${height}`)
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
                currentPage.value++
                await nextTick()
                await renderCurrentPage()
            }
        }

        const prevPage = async () => {
            if (currentPage.value > 1) {
                currentPage.value--
                await nextTick()
                await renderCurrentPage()
            }
        }

        const scrollToPage = async (pageNum) => {
            if (pageNum >= 1 && pageNum <= totalPages.value) {
                currentPage.value = pageNum
                await nextTick()
                await renderCurrentPage()
            }
        }

        // 批注模式设置
        const setAnnotationMode = async (mode) => {
            annotationMode.value = mode
            console.log('设置批注模式:', mode)
            
            // 更新DOM class来控制cursor样式
            await nextTick()
            const overlays = document.querySelectorAll('.annotation-overlay')
            overlays.forEach(overlay => {
                // 清除所有模式class
                overlay.classList.remove('highlight-mode', 'note-mode', 'draw-mode')
                // 添加当前模式class
                if (mode !== 'none') {
                    overlay.classList.add(mode + '-mode')
                }
            })
            
            try {
                // 设置Fabric画布绘制模式
                if (mode === 'draw') {
                    await loadFabricJS()
                    fabricCanvases.value.forEach(canvas => {
                        canvas.isDrawingMode = true
                        canvas.freeDrawingBrush.width = 2
                        canvas.freeDrawingBrush.color = '#ff0000'
                    })
                } else {
                    fabricCanvases.value.forEach(canvas => {
                        canvas.isDrawingMode = false
                    })
                }
            } catch (error) {
                console.error('设置绘制模式失败:', error)
            }
        }

        // 批注交互方法
        const startAnnotation = (event) => {
            if (annotationMode.value === 'none' || annotationMode.value === 'draw') return
            
            // 阻止默认事件
            event.preventDefault()
            event.stopPropagation()
            
            isDrawing.value = true
            const rect = event.currentTarget.getBoundingClientRect()
            startPos.value = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            }
            
            console.log('开始批注', {
                mode: annotationMode.value,
                startPos: startPos.value
            })
        }

        const updateAnnotation = (event) => {
            if (!isDrawing.value || annotationMode.value === 'draw') return
            
            event.preventDefault()
            event.stopPropagation()
        }

        const finishAnnotation = (event) => {
            if (!isDrawing.value || annotationMode.value === 'draw') return
            
            isDrawing.value = false
            
            event.preventDefault()
            event.stopPropagation()
            
            const rect = event.currentTarget.getBoundingClientRect()
            const endPos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            }
            
            // 计算选择区域
            const selection = {
                x: Math.min(startPos.value.x, endPos.x),
                y: Math.min(startPos.value.y, endPos.y),
                width: Math.abs(endPos.x - startPos.value.x),
                height: Math.abs(endPos.y - startPos.value.y)
            }
            
            console.log('结束批注', {
                mode: annotationMode.value,
                selection
            })
            
            // 忽略过小的选择
            if (selection.width < 10 || selection.height < 10) {
                console.log('选择区域太小，忽略')
                return
            }
            
            if (annotationMode.value === 'highlight') {
                addHighlight(selection)
                callSuccess('高亮添加成功')
            } else if (annotationMode.value === 'note') {
                currentSelection.value = selection
                noteDialogVisible.value = true
            }
        }

        const cancelAnnotation = () => {
            isDrawing.value = false
            currentSelection.value = null
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
                color: '#ffff00',
                timestamp: new Date().toLocaleString()
            }
            highlights.value.push(highlight)
        }

        const getPageHighlights = (pageNum) => {
            return highlights.value.filter(h => h.page === pageNum)
        }

        const getHighlightStyle = (highlight) => {
            return {
                left: highlight.x + 'px',
                top: highlight.y + 'px',
                width: highlight.width + 'px',
                height: highlight.height + 'px',
                backgroundColor: highlight.color || '#ffff00'
            }
        }

        const selectHighlight = (highlight) => {
            // 可以实现高亮选择和编辑功能
            console.log('选中高亮:', highlight)
        }

        // 批注功能
        const addAnnotation = (selection, content) => {
            const annotation = {
                id: annotationIdCounter.value++,
                page: currentPage.value,
                x: selection.x + selection.width / 2, // 中心位置
                y: selection.y,
                content: content,
                timestamp: new Date().toLocaleString()
            }
            annotations.value.push(annotation)
        }

        const getPageAnnotations = (pageNum) => {
            return annotations.value.filter(a => a.page === pageNum)
        }

        const getAnnotationStyle = (annotation) => {
            return {
                left: annotation.x + 'px',
                top: annotation.y + 'px'
            }
        }

        const showAnnotationDialog = (annotation) => {
            currentNoteContent.value = annotation.content
            noteDialogVisible.value = true
        }

        const saveAnnotation = () => {
            if (currentSelection.value && currentNoteContent.value) {
                addAnnotation(currentSelection.value, currentNoteContent.value)
            }
            
            currentSelection.value = null
            currentNoteContent.value = ''
            noteDialogVisible.value = false
        }

        // 笔记管理
        const toggleNotesPanel = () => {
            showNotesPanel.value = !showNotesPanel.value
        }

        const addNote = (noteData = {}) => {
            const note = {
                id: noteIdCounter.value++,
                type: noteData.type || 'note',
                page: noteData.page || currentPage.value,
                content: noteData.content || '',
                timestamp: new Date().toLocaleString(),
                position: noteData.position || null
            }
            notes.value.push(note)
        }

        const deleteNote = (noteId) => {
            const index = notes.value.findIndex(note => note.id === noteId)
            if (index > -1) {
                notes.value.splice(index, 1)
            }
        }

        const saveNote = (note) => {
            // 这里可以添加保存到后端的逻辑
            console.log('保存笔记:', note)
        }

        const saveCurrentNote = () => {
            if (!currentNoteContent.value.trim()) {
                callError('请输入批注内容')
                return
            }
            
            if (currentSelection.value) {
                // 添加批注
                addAnnotation(currentSelection.value, currentNoteContent.value)
                callSuccess('批注添加成功')
            }
            
            // 清理状态
            currentSelection.value = null
            currentNoteContent.value = ''
            noteDialogVisible.value = false
        }
        
        const cancelNote = () => {
            noteDialogVisible.value = false
            currentAnnotation.value = null
            currentNoteContent.value = ''
        }

        const getNoteTypeLabel = (type) => {
            const labels = {
                highlight: '高亮',
                note: '批注',
                draw: '绘制',
                default: '笔记'
            }
            return labels[type] || labels.default
        }
        
        const formatTime = (timeString) => {
            return timeString || '未知时间'
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
            showNotesPanel,
            notes,
            noteDialogVisible,
            currentNoteContent,
            highlights,
            annotations,
            
            // 方法
            handleFileUpload,
            zoomIn,
            zoomOut,
            resetZoom,
            nextPage,
            prevPage,
            scrollToPage,
            setAnnotationMode,
            startAnnotation,
            updateAnnotation,
            finishAnnotation,
            cancelAnnotation,
            addHighlight,
            getPageHighlights,
            getHighlightStyle,
            selectHighlight,
            addAnnotation,
            getPageAnnotations,
            getAnnotationStyle,
            showAnnotationDialog,
            saveAnnotation,
            toggleNotesPanel,
            addNote,
            deleteNote,
            saveNote,
            saveCurrentNote,
            cancelNote,
            getNoteTypeLabel,
            formatTime,
            setPageRef,
            setAnnotationRef,
            
            // 图标
            Upload,
            Download,
            ZoomIn,
            ZoomOut,
            ArrowLeft,
            ArrowRight,
            Document,
            Notebook,
            Plus,
            Delete,
            Edit
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

/* PDF容器 */
.pdf-container {
    display: flex;
    gap: 15px;
    min-height: calc(100vh - 300px);
}

.pdf-container.with-notes {
    gap: 20px;
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

.pdf-container.with-notes .pdf-viewer {
    flex: 0 0 70%;
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

/* 批注交互层 - 直接覆盖在PDF上 */
.annotation-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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
    background-color: rgba(255, 255, 0, 0.4);
    border: 1px solid rgba(255, 255, 0, 0.7);
    pointer-events: auto;
    cursor: pointer;
    transition: opacity 0.2s ease;
}

.highlight-rect:hover {
    opacity: 0.8;
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
    width: 20px;
    height: 20px;
    background-color: #409eff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transform: translateX(-50%) translateY(-50%);
}

.annotation-marker:hover {
    background-color: #337ecc;
    transform: translateX(-50%) translateY(-50%) scale(1.2);
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

/* 笔记侧边栏 - 与profile页面风格一致 */
.notes-sidebar {
    width: 350px;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
}

.notes-sidebar:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.notes-header {
    padding: 20px 25px;
    border-bottom: 2px solid #f0f2f5;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.notes-header h3 {
    font-family: 'Meiryo', sans-serif;
    font-size: 18px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0;
}

.close-btn {
    border-radius: 50%;
    padding: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.notes-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}

.notes-content::-webkit-scrollbar {
    width: 6px;
}

.notes-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.notes-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.notes-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.no-notes {
    text-align: center;
    color: #909399;
    padding: 40px 0;
}

.notes-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.note-item {
    background: #f9f9f9;
    border-radius: 12px;
    padding: 15px;
    border-left: 4px solid #409eff;
    cursor: pointer;
    transition: all 0.3s ease;
}

.note-item:hover {
    background: #f0f9ff;
    transform: translateX(5px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.note-item.highlight-note {
    border-left-color: #f56c6c;
    background: #fef0f0;
}

.note-item.highlight-note:hover {
    background: #fde2e2;
}

.note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.note-page {
    font-family: 'Meiryo', sans-serif;
    font-size: 12px;
    color: #909399;
    font-weight: 500;
}

.note-type {
    font-family: 'Meiryo', sans-serif;
    font-size: 11px;
    padding: 3px 8px;
    background: #409eff;
    color: white;
    border-radius: 10px;
    font-weight: 500;
}

.note-content {
    font-family: 'Meiryo', sans-serif;
    font-size: 14px;
    color: #2c3e50;
    line-height: 1.4;
    margin-bottom: 8px;
    text-align: left;
}

.note-time {
    font-family: 'Meiryo', sans-serif;
    font-size: 11px;
    color: #c0c4cc;
    text-align: right;
}

.loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .pdf-container {
        flex-direction: column;
    }
    
    .pdf-container.with-notes .pdf-viewer {
        flex: 1;
    }
    
    .notes-sidebar {
        width: 100%;
        max-height: 400px;
    }
    
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
    
    .notes-sidebar {
        width: 100%;
    }
}
</style>