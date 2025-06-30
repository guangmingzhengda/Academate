<template>
    <div class="bg-container"/>
    
    <!-- 成果标题区域 -->
    <div class="outcome-header" :class="{ 'outcome-header-with-sidebar': aiSidebarVisible }" v-if="outcomeInfo">
        <div class="outcome-title">
            <h2>{{ outcomeInfo.title }}</h2>
            <div class="outcome-meta">
                <span class="outcome-authors">作者：{{ outcomeInfo.authors }}</span>
                <span class="outcome-date" v-if="outcomeInfo.publishDate">发布时间：{{ outcomeInfo.publishDate }}</span>
                <span class="outcome-journal" v-if="outcomeInfo.journal">期刊：{{ outcomeInfo.journal }}</span>
            </div>
        </div>
    </div>
    
    <!-- 加载动画 -->
    <div class="loading-container" v-if="isLoading">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p class="loading-text">{{ loadingText }}</p>
        </div>
    </div>

    <div class="pdf-reader-container" v-show="!isLoading">
        <!-- AI助手组件 -->
        <ai-assistant
            :visible="aiSidebarVisible"
            :pdf-ready="!!pdfDocument"
            :current-page-text="getCurrentPageText()"
            :all-texts="getAllExtractedTexts()"
            :document-info="outcomeInfo"
            :current-page="currentPage"
            :total-pages="totalPages"
            @toggle="toggleAiSidebar"
            @close="toggleAiSidebar"
            @error="callError"
            @info="callInfo"
        />

        <!-- 主要内容区域 -->
        <div class="main-content" :class="{ 'main-content-with-sidebar': aiSidebarVisible }">
            <!-- 工具栏组件 -->
            <pdf-toolbar
                :pdf-document="pdfDocument"
                :current-page="currentPage"
                :total-pages="totalPages"
                :scale="scale"
                :annotation-mode="annotationMode"
                :highlight-color="highlightColor"
                :draw-color="drawColor"
                :highlight-opacity="highlightOpacity"
                :show-upload="false"
                @zoom-in="zoomIn"
                @zoom-out="zoomOut"
                @reset-zoom="resetZoom"
                @prev-page="prevPage"
                @next-page="nextPage"
                @set-annotation-mode="setAnnotationMode"
                @clear-drawing="clearDrawing"
                @update-color="updateColor"
                @update-highlight-opacity="updateHighlightOpacity"
                @export-annotations="exportAllAnnotations"
            />

            <!-- PDF显示区域 -->
            <div class="pdf-container">
                <!-- PDF显示组件 -->
                <pdf-viewer
                    :pdf-document="pdfDocument"
                    :current-page="currentPage"
                    :total-pages="totalPages"
                    @prev-page="prevPage"
                    @next-page="nextPage"
                    @set-page-ref="setPageRef"
                >
                    <template #annotation-layer>
                        <!-- 批注层组件 -->
                        <annotation-layer
                            :current-page="currentPage"
                            :annotation-mode="annotationMode"
                            :highlights="highlights"
                            :annotations="annotations"
                            :eraser-preview="eraserPreview"
                            :selection-preview="selectionPreview"
                            :highlight-opacity="highlightOpacity"
                            @set-annotation-ref="setAnnotationRef"
                            @select-highlight="selectHighlight"
                            @show-highlight-context-menu="showHighlightContextMenu"
                            @delete-highlight="deleteHighlight"
                            @show-annotation-dialog="showAnnotationDialog"
                            @show-annotation-context-menu="showAnnotationContextMenu"
                            @overlay-mousedown="handleOverlayMouseDown"
                            @overlay-mousemove="handleOverlayMouseMove"
                            @overlay-mouseup="handleOverlayMouseUp"
                            @overlay-mouseleave="handleOverlayMouseLeave"
                        />
                    </template>
                </pdf-viewer>
            </div>
                                    
            <!-- 批注对话框组件 -->
            <note-dialog
                v-model:visible="noteDialogVisible"
                v-model:content="currentNoteContent"
                :current-editing-annotation="currentEditingAnnotation"
                @save-note="saveCurrentNote"
                @cancel-note="cancelNote"
                @delete-current-annotation="deleteCurrentAnnotation"
            />
        </div>
    </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { callSuccess, callError, callInfo } from '@/call'
// 导入成果API
import { getResearchOutcomeById } from '@/api/outcome'
// 导入组件
import PdfToolbar from './components/pdfToolbar/index.vue'
import PdfViewer from './components/pdfViewer/index.vue'
import AnnotationLayer from './components/annotationLayer/index.vue'
import NoteDialog from './components/noteDialog/index.vue'
import AiAssistant from '@/components/AiAssistant.vue'
// 导入云端持久化模块
import { 
    createCloudAnnotationPersistence, 
    saveAnnotationsToCloud, 
    getAnnotationsFromCloud
} from '@/api/pdf'
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
    components: {
        PdfToolbar,
        PdfViewer,
        AnnotationLayer,
        NoteDialog,
        AiAssistant
    },
    setup() {
        const route = useRoute()
        
        // 加载状态
        const isLoading = ref(true)
        const loadingText = ref('正在加载PDF阅读器...')
        
        // 成果信息
        const outcomeInfo = ref(null)
        const outcomeId = ref(null)

        // 从路由获取PDF并加载成果信息
        const loadOutcomeAndPDF = async () => {
            try {
                // 从路由参数获取ID
                const id = route.params.id
                if (!id) {
                    callError('缺少成果ID参数')
                    isLoading.value = false
                    return
                }
                
                outcomeId.value = Number(id)
                loadingText.value = '正在获取成果信息...'
                
                // 获取成果信息
                const outcome = await getResearchOutcomeById(outcomeId.value)
                if (!outcome) {
                    callError('无法获取成果信息')
                    isLoading.value = false
                    return
                }
                
                outcomeInfo.value = {
                    ...outcome,
                    id: outcomeId.value // 确保包含id字段用于AI摘要API
                }
                
                // 更新PDF信息
                currentPdfInfo.value = {
                    fileName: outcome.title + '.pdf',
                    fileSize: 0, // 待下载后更新
                    totalPages: 0, // 待PDF加载后更新
                    fileHash: `outcome_${outcomeId.value}_${outcome.title}` // 使用成果ID作为标识
                }
                
                // 设置云端持久化管理器的成果ID
                cloudPersistenceManager.setOutcomeId(outcomeId.value)
                
                // 检查是否有PDF链接
                if (!outcome.url) {
                    callError('该成果暂无PDF文件')
                    isLoading.value = false
                    return
                }
                
                loadingText.value = '正在下载PDF文件...'
                
                // 构建代理URL，避免CORS问题
                let proxyUrl = outcome.url
                
                // console.log('PDF链接：'+proxyUrl);

                // 如果是阿里云OSS的完整URL，转换为代理路径
                if (outcome.url.includes('chkbigevent.oss-cn-beijing.aliyuncs.com')) {
                    const urlPath = outcome.url.replace('https://chkbigevent.oss-cn-beijing.aliyuncs.com', '')
                    proxyUrl = `/postFile${urlPath}`
                } else {
                    // 直接使用原URL，不做任何处理
                    proxyUrl = outcome.url
                }
                
                // 通过代理下载PDF文件
                const response = await fetch(proxyUrl)
                if (!response.ok) {
                    throw new Error(`PDF下载失败: ${response.status} ${response.statusText}`)
                }
                
                loadingText.value = '正在解析PDF文件...'
                
                // 获取PDF数据
                const arrayBuffer = await response.arrayBuffer()
                const typedArray = new Uint8Array(arrayBuffer)
                
                // 更新文件大小
                currentPdfInfo.value.fileSize = arrayBuffer.byteLength
                
                // 加载PDF
                await loadPDF(typedArray)
                
                isLoading.value = false
                
            } catch (error) {
                console.error('加载PDF失败:', error)
                callError('PDF文档加载失败: ' + error.message)
                isLoading.value = false
            }
        }

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
            // 添加键盘事件监听
            document.addEventListener('keydown', handleKeyPress)
            
            try {
                // 加载PDF.js
                const pdfjs = await loadPDFJS()
                
                // 初始化完成后，加载成果信息和PDF
                await loadOutcomeAndPDF()
                
                // 启动云端自动保存（每30秒）
                cloudPersistenceManager.startAutoSave(() => {
                    saveAnnotationsToCloudQuiet()
                })
                
            } catch (error) {
                console.error('PDF阅读器初始化失败:', error)
                callError('PDF阅读器初始化失败: ' + error.message)
                isLoading.value = false
            }
        })
        
        // 在组件卸载时清理事件监听
        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeyPress)
            // 停止云端自动保存
            cloudPersistenceManager.stopAutoSave()
        })
        
        // 响应式数据
        const uploadRef = ref(null)
        const pdfContainer = ref(null)
        const pdfDocument = ref(null)
        const currentPage = ref(1)
        const totalPages = ref(0)
        const scale = ref(1.3)
        
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
        const highlightOpacity = ref(0.15) // 高亮透明度，默认0.15
        
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
            throttleDelay: 16, // 减少到16ms，约60fps
            pendingOperations: new Set()
        })

        // 绘制性能优化 - 更激进的优化
        const drawingThrottle = ref({
            lastSaveTime: 0,
            saveDelay: 1000, // 增加到1秒保存延迟
            saveTimer: null,
            needsSave: false
        })

        // 优化的绘制状态管理
        const optimizedDrawingState = ref({
            lastSaveTime: 0,
            saveDelay: 1000, // 增加延迟减少保存频率
            isDirty: new Map(), // 跟踪哪些页面需要保存
            saveQueue: new Set() // 保存队列
        })

        // PDF文字提取存储
        const extractedTexts = ref(new Map()) // pageNum -> 文字内容

        // 云端持久化管理器
        const cloudPersistenceManager = createCloudAnnotationPersistence()
        
        // 当前PDF信息
        const currentPdfInfo = ref({
            fileName: '',
            totalPages: 0,
            fileSize: 0,
            fileHash: ''
        })

        // ==================== AI 对话功能 ====================
        
        // AI侧边栏状态
        const aiSidebarVisible = ref(false)
        
        // 切换AI侧边栏显示/隐藏
        const toggleAiSidebar = () => {
            aiSidebarVisible.value = !aiSidebarVisible.value
        }

        // 提取页面文字内容
        const extractPageText = async (page, pageNum) => {
            try {
                // 检查是否已经提取过该页面的文字
                if (extractedTexts.value.has(pageNum)) {
                    return extractedTexts.value.get(pageNum)
                }
                
                // 使用PDF.js提取文字内容
                const textContent = await page.getTextContent()
                
                // 将文字项组合成完整文本
                let pageText = ''
                let previousY = null
                
                textContent.items.forEach((item, index) => {
                    // 检查是否需要换行（Y坐标发生变化时）
                    if (previousY !== null && Math.abs(item.transform[5] - previousY) > 5) {
                        pageText += '\n'
                    }
                    
                    // 添加文字内容
                    pageText += item.str
                    
                    // 添加空格（如果下一个item在同一行且有间距）
                    if (index < textContent.items.length - 1) {
                        const nextItem = textContent.items[index + 1]
                        if (Math.abs(nextItem.transform[5] - item.transform[5]) <= 5) {
                            // 同一行，检查水平间距
                            const currentX = item.transform[4] + item.width
                            const nextX = nextItem.transform[4]
                            if (nextX - currentX > 5) {
                                pageText += ' '
                            }
                        }
                    }
                    
                    previousY = item.transform[5]
                })
                
                // 清理多余的空行和空格
                pageText = pageText
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n')
                
                // 存储提取的文字
                extractedTexts.value.set(pageNum, pageText)
                
                return pageText
                
            } catch (error) {
                console.error(`❌ 提取第${pageNum}页文字失败:`, error)
                return ''
            }
        }

        // 获取当前页面的文字
        const getCurrentPageText = () => {
            const text = extractedTexts.value.get(currentPage.value)
            return text || ''
        }

        // 获取指定页面的文字
        const getPageText = (pageNum) => {
            if (pageNum < 1 || pageNum > totalPages.value) {
                return ''
            }
            
            const text = extractedTexts.value.get(pageNum)
            return text || ''
        }

        // 获取所有已提取的文字
        const getAllExtractedTexts = () => {
            const allTexts = {}
            extractedTexts.value.forEach((text, pageNum) => {
                allTexts[pageNum] = text
            })
            
            return allTexts
        }

        // 搜索文字内容
        const searchInTexts = (keyword) => {
            if (!keyword || keyword.trim() === '') {
                return []
            }
            
            const results = []
            extractedTexts.value.forEach((text, pageNum) => {
                if (text.toLowerCase().includes(keyword.toLowerCase())) {
                    // 找到匹配的行
                    const lines = text.split('\n')
                    lines.forEach((line, lineIndex) => {
                        if (line.toLowerCase().includes(keyword.toLowerCase())) {
                            results.push({
                                page: pageNum,
                                line: lineIndex + 1,
                                content: line.trim(),
                                context: line
                            })
                        }
                    })
                }
            })
            
            return results
        }

        // ==================== 云端持久化功能 ====================
        
        /**
         * 从云端加载批注数据
         */
        const loadCloudAnnotations = async () => {
            try {
                if (!outcomeId.value) return
                
                const cloudData = await getAnnotationsFromCloud(outcomeId.value)
                if (!cloudData) {
                    return // 没有云端数据，正常情况
                }
                
                // 应用云端数据
                const applyResult = cloudPersistenceManager.applyLoadedData(
                    cloudData,
                    highlights.value,
                    annotations.value,
                    drawingData.value
                )
                
                if (applyResult.success) {
                    // 应用设置
                    if (cloudData.settings) {
                        if (cloudData.settings.scale) {
                            scale.value = cloudData.settings.scale
                        }
                        if (cloudData.settings.highlightOpacity !== undefined) {
                            highlightOpacity.value = cloudData.settings.highlightOpacity
                        }
                    }
                    
                    // 重新渲染当前页面以显示恢复的内容
                    await nextTick()
                    await renderCurrentPage()
                    
                    // 恢复绘制内容
                    setTimeout(() => {
                        restoreDrawingData(currentPage.value)
                    }, 300)
                    
                    // callInfo(`已从云端恢复 ${applyResult.counts.highlights} 个高亮、${applyResult.counts.annotations} 个批注、${applyResult.counts.drawings} 页绘制内容`)
                }
            } catch (error) {
                console.error('从云端加载批注失败:', error)
                callError('从云端加载批注失败')
            }
        }
        
        /**
         * 保存批注到云端（静默保存，不显示成功提示）
         */
        const saveAnnotationsToCloudQuiet = async () => {
            try {
                if (!pdfDocument.value || !outcomeId.value) {
                    return
                }
                
                // 保存当前页面的绘制内容
                if (currentPage.value) {
                    saveFast(currentPage.value)
                }
                
                // 导出数据
                const exportData = cloudPersistenceManager.exportAnnotations(
                    currentPdfInfo.value,
                    scale.value,
                    highlights.value,
                    annotations.value,
                    drawingData.value
                )
                
                // 添加透明度设置
                exportData.settings.highlightOpacity = highlightOpacity.value
                
                // 保存到云端
                await saveAnnotationsToCloud(outcomeId.value, exportData)
                
            } catch (error) {
                console.error('静默保存到云端失败:', error)
            }
        }
        
        /**
         * 手动保存所有标注数据到云端
         */
        const exportAllAnnotations = async () => {
            try {
                if (!pdfDocument.value) {
                    callError('请先加载PDF文件')
                    return
                }
                
                // 保存当前页面的绘制内容
                if (currentPage.value) {
                    saveFast(currentPage.value)
                }
                
                // 导出数据
                const exportData = cloudPersistenceManager.exportAnnotations(
                    currentPdfInfo.value,
                    scale.value,
                    highlights.value,
                    annotations.value,
                    drawingData.value
                )
                
                // 添加透明度设置
                exportData.settings.highlightOpacity = highlightOpacity.value
                
                // 保存到云端
                const success = await saveAnnotationsToCloud(outcomeId.value, exportData)
                
                if (success) {
                    callSuccess('标注数据已保存到云端')
                }
                
                return { success }
            } catch (error) {
                console.error('保存标注数据到云端失败:', error)
                callError('保存标注数据失败')
                return { success: false, error: error.message }
            }
        }



        // 空间索引优化 - 新增
        const spatialIndex = ref({
            highlights: new Map(), // 按页面分组的高亮空间索引
            annotations: new Map(), // 按页面分组的批注空间索引
            gridSize: 100 // 网格大小，用于空间分割
        })

        // Canvas离屏缓存 - 新增
        const offscreenCanvas = ref(new Map()) // 离屏Canvas缓存

        // 初始化空间索引
        const initSpatialIndex = (pageNum) => {
            if (!spatialIndex.value.highlights.has(pageNum)) {
                spatialIndex.value.highlights.set(pageNum, new Map())
            }
            if (!spatialIndex.value.annotations.has(pageNum)) {
                spatialIndex.value.annotations.set(pageNum, new Map())
            }
        }

        // 获取网格键
        const getGridKey = (x, y) => {
            const gridX = Math.floor(x / spatialIndex.value.gridSize)
            const gridY = Math.floor(y / spatialIndex.value.gridSize)
            return `${gridX},${gridY}`
        }

        // 获取区域涉及的所有网格
        const getGridKeys = (area) => {
            const keys = []
            const startX = Math.floor(area.x / spatialIndex.value.gridSize)
            const endX = Math.floor((area.x + area.width) / spatialIndex.value.gridSize)
            const startY = Math.floor(area.y / spatialIndex.value.gridSize)
            const endY = Math.floor((area.y + area.height) / spatialIndex.value.gridSize)
            
            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    keys.push(`${x},${y}`)
                }
            }
            return keys
        }

        // 添加到空间索引
        const addToSpatialIndex = (item, type, pageNum) => {
            initSpatialIndex(pageNum)
            const indexMap = spatialIndex.value[type].get(pageNum)
            const keys = getGridKeys(item)
            
            keys.forEach(key => {
                if (!indexMap.has(key)) {
                    indexMap.set(key, [])
                }
                indexMap.get(key).push(item)
            })
        }

        // 从空间索引中移除
        const removeFromSpatialIndex = (item, type, pageNum) => {
            const indexMap = spatialIndex.value[type]?.get(pageNum)
            if (!indexMap) return
            
            const keys = getGridKeys(item)
            keys.forEach(key => {
                const items = indexMap.get(key)
                if (items) {
                    const index = items.findIndex(i => i.id === item.id)
                    if (index > -1) {
                        items.splice(index, 1)
                        if (items.length === 0) {
                            indexMap.delete(key)
                        }
                    }
                }
            })
        }

        // 查询空间索引
        const queryFromSpatialIndex = (area, type, pageNum) => {
            const indexMap = spatialIndex.value[type]?.get(pageNum)
            if (!indexMap) return []
            
            const keys = getGridKeys(area)
            const results = new Set()
            
            keys.forEach(key => {
                const items = indexMap.get(key)
                if (items) {
                    items.forEach(item => results.add(item))
                }
            })
            
            return Array.from(results)
        }

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
                } catch (error) {
                    console.error(`第${pageNum}页绘制画布初始化失败:`, error)
                }
            }
        }

        // 优化的绘制系统 - 简单但高性能
        const initDrawingEvents = (canvas, pageNum) => {
            const ctx = canvas.getContext('2d')
            let isDrawing = false
            let lastX = 0
            let lastY = 0
            let lastTime = 0
            
            // 鼠标按下事件
            const handleMouseDown = (e) => {
                if (annotationMode.value !== 'draw' || pageNum !== currentPage.value) return
                e.preventDefault()
                e.stopPropagation()
                
                isDrawing = true
                const rect = canvas.getBoundingClientRect()
                lastX = e.clientX - rect.left
                lastY = e.clientY - rect.top
                lastTime = 0
                
                // 设置绘制样式
                ctx.strokeStyle = drawColor.value
                ctx.lineWidth = 3
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'

            }
            
            // 鼠标移动事件 - 加入性能优化
            const handleMouseMove = (e) => {
                if (!isDrawing || annotationMode.value !== 'draw' || pageNum !== currentPage.value) return
                e.preventDefault()
                e.stopPropagation()
                
                const now = performance.now()
                // 限制绘制频率到60fps，避免过度绘制
                if (now - lastTime < 16) return
                lastTime = now
                
                const rect = canvas.getBoundingClientRect()
                const currentX = e.clientX - rect.left
                const currentY = e.clientY - rect.top
                
                // 距离过滤 - 避免重复的近距离点
                const distance = Math.sqrt((currentX - lastX) ** 2 + (currentY - lastY) ** 2)
                if (distance < 2) return
                
                // 绘制线段
                    ctx.strokeStyle = drawColor.value
                    ctx.lineWidth = 3
                    ctx.lineCap = 'round'
                    ctx.lineJoin = 'round'
                
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
                    
                    // 延迟保存，避免频繁保存
                    debouncedSaveDrawing(pageNum)
                }
            }
            
            // 鼠标离开事件
            const handleMouseLeave = () => {
                if (isDrawing && pageNum === currentPage.value) {
                    isDrawing = false
                    
                    // 延迟保存
                    debouncedSaveDrawing(pageNum)
                }
            }
            
            // 添加事件监听器
            canvas.addEventListener('mousedown', handleMouseDown)
            canvas.addEventListener('mousemove', handleMouseMove)
            canvas.addEventListener('mouseup', handleMouseUp)
            canvas.addEventListener('mouseleave', handleMouseLeave)
        }
        

        




        // 加载PDF
        const loadPDF = async (data) => {
            try {
                // 清理之前的数据
                pageRefs.value.clear()
                annotationRefs.value.clear()
                drawingData.value.clear()
                highlights.value.length = 0  // 清空数组
                annotations.value.length = 0  // 清空数组
                extractedTexts.value.clear() // 清理文字提取缓存
                
                // 确保PDF.js已加载
                const pdfjs = await loadPDFJS()
                
                // 1.6版本的getDocument调用方式
                let loadingTask
                if (pdfjs.getDocument) {
                    // 新版本API
                    loadingTask = pdfjs.getDocument(data)
                } else if (window.PDFJS && window.PDFJS.getDocument) {
                    // 旧版本API
                    loadingTask = window.PDFJS.getDocument(data)
                }
                
                let pdf
                if (loadingTask && loadingTask.promise) {
                    pdf = await loadingTask.promise
                } else if (loadingTask && typeof loadingTask.then === 'function') {
                    // 如果loadingTask本身就是promise
                    pdf = await loadingTask
                } else {
                    throw new Error('无法创建PDF加载任务')
                }
                
                // 先设置页数信息
                totalPages.value = pdf.numPages
                currentPage.value = 1
                
                // 更新PDF信息
                currentPdfInfo.value.totalPages = pdf.numPages
                currentPdfInfo.value.fileHash = `outcome_${outcomeId.value}_${currentPdfInfo.value.fileName}`
                
                // 设置PDF文档对象（不使用nextTick，避免卡死）
                pdfDocument.value = pdf
                
                // 等待DOM更新后渲染第一页
                await nextTick()
                await renderCurrentPage()
                
                // 从云端加载批注数据
                setTimeout(() => {
                    loadCloudAnnotations()
                }, 1000)
            } catch (error) {
                console.error('loadPDF错误详情:', error)
                throw error
            }
        }

        // 渲染当前页面
        const renderCurrentPage = async () => {
            await renderPage(currentPage.value)
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
                }

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                }

                await page.render(renderContext).promise
                
                // 提取页面文字内容
                await extractPageText(page, pageNum)
                
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
        }

        // 统一的overlay事件处理
        const handleOverlayMouseDown = (event) => {
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
            
            // 计算相对于annotation-overlay的坐标
            const relativeX = event.clientX - overlayRect.left
            const relativeY = event.clientY - overlayRect.top
            
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
            
            // 检查是否是点击（没有拖拽）
            if (selection.width < 10 && selection.height < 10) {
                // 单纯点击，直接在点击位置创建批注
                if (annotationMode.value === 'note') {
                    // 创建一个小的虚拟选择区域用于数据存储
                    currentSelection.value = {
                        x: clickPosition.value.x - 10,
                        y: clickPosition.value.y - 10,
                        width: 20,
                        height: 20
                    }
                    
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

        // 高亮功能（优化版，维护空间索引）
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
            
            // 添加到主数组
            highlights.value.push(highlight)
            
            // 添加到空间索引
            addToSpatialIndex(highlight, 'highlights', currentPage.value)
            
            // 标记数据已修改，触发云端保存
            cloudPersistenceManager.markDirty()
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
                opacity: highlightOpacity.value,
                border: 'none'
            }
        }

        const selectHighlight = (highlight) => {
            // 可以实现高亮选择和编辑功能
        }

        // 删除高亮（优化版，维护空间索引）
        const deleteHighlight = (highlightId) => {
            const index = highlights.value.findIndex(h => h.id === highlightId)
            if (index > -1) {
                const highlight = highlights.value[index]
                
                // 从空间索引中移除
                removeFromSpatialIndex(highlight, 'highlights', highlight.page)
                
                // 从主数组中移除
                highlights.value.splice(index, 1)
                
                // 标记数据已修改，触发云端保存
                cloudPersistenceManager.markDirty()
            }
        }

        // 显示高亮右键菜单
        const showHighlightContextMenu = (event, highlight) => {
            // 可以在这里添加右键菜单功能
            // 简单实现：直接删除
            if (confirm('确定要删除这个高亮吗？')) {
                deleteHighlight(highlight.id)
            }
        }

        // 批注功能（优化版，维护空间索引）
        const addAnnotation = (selection, content, clickPosition = null) => {
            // 简化逻辑：如果有点击位置，直接使用；否则使用选择区域中心
            let finalX, finalY
            
            if (clickPosition && clickPosition.x !== undefined && clickPosition.y !== undefined) {
                finalX = clickPosition.x
                finalY = clickPosition.y
            } else {
                finalX = selection.x + selection.width / 2
                finalY = selection.y
            }
            
            const annotation = {
                id: annotationIdCounter.value++,
                page: currentPage.value,
                x: finalX,
                y: finalY,
                width: 20, // 为空间索引添加宽高
                height: 20,
                content: content,
                timestamp: new Date().toLocaleString()
            }
            
            // 添加到主数组
            annotations.value.push(annotation)
            
            // 添加到空间索引
            addToSpatialIndex(annotation, 'annotations', currentPage.value)
            
            // 标记数据已修改，触发云端保存
            cloudPersistenceManager.markDirty()
        }

        const getPageAnnotations = (pageNum) => {
            const pageAnnotations = annotations.value.filter(a => a.page === pageNum)
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

        // 删除批注（优化版，维护空间索引）
        const deleteAnnotation = (annotationId) => {
            const index = annotations.value.findIndex(a => a.id === annotationId)
            if (index > -1) {
                const annotation = annotations.value[index]
                
                // 从空间索引中移除
                removeFromSpatialIndex(annotation, 'annotations', annotation.page)
                
                // 从主数组中移除
                annotations.value.splice(index, 1)
                
                // 标记数据已修改，触发云端保存
                cloudPersistenceManager.markDirty()
            }
        }

        // 显示批注右键菜单
        const showAnnotationContextMenu = (event, annotation) => {
            // 可以在这里添加右键菜单功能
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
            if (!currentNoteContent.value.trim()) {
                return
            }
            
            // 如果是编辑模式，更新现有批注
            if (currentEditingAnnotation.value) {
                const annotationIndex = annotations.value.findIndex(a => a.id === currentEditingAnnotation.value.id)
                if (annotationIndex > -1) {
                    annotations.value[annotationIndex].content = currentNoteContent.value
                    annotations.value[annotationIndex].timestamp = new Date().toLocaleString()
                    // 编辑批注也要标记数据已修改
                    cloudPersistenceManager.markDirty()
                }
            } else {
                // 新增批注的逻辑保持不变
                if (clickPosition.value && clickPosition.value.x !== undefined && clickPosition.value.y !== undefined) {
                    const virtualSelection = {
                        x: clickPosition.value.x - 10,
                        y: clickPosition.value.y - 10,
                        width: 20,
                        height: 20
                    }
                    
                    addAnnotation(virtualSelection, currentNoteContent.value, clickPosition.value)
                } else if (currentSelection.value) {
                    addAnnotation(currentSelection.value, currentNoteContent.value, null)
                } else {
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



        // 优化的防抖保存 - 批量处理
        const debouncedSaveDrawing = (pageNum) => {
            // 标记页面为需要保存
            optimizedDrawingState.value.isDirty.set(pageNum, true)
            optimizedDrawingState.value.saveQueue.add(pageNum)
            
            // 清除之前的定时器
            if (drawingThrottle.value.saveTimer) {
                clearTimeout(drawingThrottle.value.saveTimer)
            }
            
            // 批量保存定时器
            drawingThrottle.value.saveTimer = setTimeout(() => {
                // 批量保存所有脏页面
                const pagesToSave = Array.from(optimizedDrawingState.value.saveQueue)
                optimizedDrawingState.value.saveQueue.clear()
                
                pagesToSave.forEach(page => {
                    if (optimizedDrawingState.value.isDirty.get(page)) {
                        saveFast(page)
                        optimizedDrawingState.value.isDirty.set(page, false)
                    }
                })
                
                // 标记数据已修改，触发云端保存
                cloudPersistenceManager.markDirty()
            }, optimizedDrawingState.value.saveDelay)
        }
        
        // 快速保存 - 只在真正需要时调用toDataURL
        const saveFast = (pageNum) => {
            const canvas = annotationRefs.value.get(pageNum)
            if (!canvas) return
            
            try {
                // 检查Canvas是否为空，避免保存空白内容
                const ctx = canvas.getContext('2d')
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data
                
                // 快速检查是否有非透明像素
                let hasContent = false
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] > 0) { // alpha通道
                        hasContent = true
                        break
                    }
                }
                
                if (hasContent) {
                    // 有内容才保存
                    const base64Data = canvas.toDataURL('image/png', 0.7) // 降低质量提升速度
                    drawingData.value.set(pageNum, base64Data)
                } else {
                    // 没有内容，删除存储
                    drawingData.value.delete(pageNum)
                }
            } catch (error) {
                console.error(`页面${pageNum}保存失败:`, error)
            }
        }



        // 保存当前页面的绘制内容（原版本，保留作为备用）
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

        // 简化恢复功能 - 基础图像恢复
        const restoreDrawingData = (pageNum) => {
            const canvas = annotationRefs.value.get(pageNum)
            const savedData = drawingData.value.get(pageNum)
            
            if (!canvas) return
            
            const ctx = canvas.getContext('2d')
            // 先清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            if (savedData && savedData.startsWith('data:image/')) {
                const img = new Image()
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, 0, 0)
                }
                img.onerror = () => {
                    console.error(`页面${pageNum}绘制内容恢复失败`)
                }
                img.src = savedData
            }
        }

        // 清除当前页面的绘制内容
        const clearDrawing = () => {
            const pageNum = currentPage.value
            const canvas = annotationRefs.value.get(pageNum)
            
            if (canvas) {
                // 清除Canvas显示
                const ctx = canvas.getContext('2d')
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
            
            // 清除存储数据
            drawingData.value.delete(pageNum)
            
            // 标记数据已修改，触发云端保存
            cloudPersistenceManager.markDirty()
        }

        // 更新颜色
        const updateColor = (event) => {
            const newColor = event.target.value
            
            if (annotationMode.value === 'highlight') {
                highlightColor.value = newColor
            } else if (annotationMode.value === 'draw') {
                drawColor.value = newColor
                
                // 更新所有annotation canvas的绘制样式（绘制是在annotation canvas上进行的）
                annotationRefs.value.forEach((canvas, pageNum) => {
                    if (canvas) {
                        const ctx = canvas.getContext('2d')
                        ctx.strokeStyle = newColor
                        ctx.lineWidth = 3
                        ctx.lineCap = 'round'
                        ctx.lineJoin = 'round'
                    }
                })
            }
        }
        
        // 更新高亮透明度
        const updateHighlightOpacity = (opacity) => {
            highlightOpacity.value = opacity
            // 标记数据已修改，触发云端保存
            cloudPersistenceManager.markDirty()
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

        // 高性能橡皮擦 - 简单直接
        const performErase = (centerPos) => {
            const now = performance.now()
            
            // 高频节流控制 - 提升到120fps
            if (now - eraserThrottle.value.lastTime < 8) {
                return
            }
            eraserThrottle.value.lastTime = now
            
            const canvas = annotationRefs.value.get(currentPage.value)
            if (!canvas) return
            
            const ctx = canvas.getContext('2d')
            const radius = eraserPreview.size / 2
            
            // 直接清除Canvas上的圆形区域
            ctx.save()
            ctx.globalCompositeOperation = 'destination-out'
            ctx.beginPath()
            ctx.arc(centerPos.x, centerPos.y, radius, 0, 2 * Math.PI)
            ctx.fill()
            ctx.restore()
            
            // 简化的数据清理
            const eraseArea = {
                x: centerPos.x - radius,
                y: centerPos.y - radius,
                width: eraserPreview.size,
                height: eraserPreview.size
            }
            
            // 快速删除高亮和批注
            eraseHighlightsFast(eraseArea)
            eraseAnnotationsFast(eraseArea)
        }
        
        // 快速高亮删除 - 简化算法
        const eraseHighlightsFast = (eraseArea) => {
            const pageHighlights = highlights.value.filter(h => h.page === currentPage.value)
            if (!pageHighlights || pageHighlights.length === 0) return
            
            const before = pageHighlights.length
            // 简单的边界框检测，避免复杂计算
            const remainingHighlights = pageHighlights.filter(highlight => {
                return !isRectangleOverlap(highlight, eraseArea)
            })
            
            // 移除当前页面的高亮，然后添加剩余的
            highlights.value = highlights.value.filter(h => h.page !== currentPage.value).concat(remainingHighlights)
            
            const removed = before - remainingHighlights.length
        }
        
        // 快速批注删除 - 简化算法
        const eraseAnnotationsFast = (eraseArea) => {
            const pageAnnotations = annotations.value.filter(a => a.page === currentPage.value)
            if (!pageAnnotations || pageAnnotations.length === 0) return
            
            const before = pageAnnotations.length
            // 简单的点检测
            const remainingAnnotations = pageAnnotations.filter(annotation => {
                const distance = Math.sqrt(
                    (annotation.x - (eraseArea.x + eraseArea.width/2)) ** 2 + 
                    (annotation.y - (eraseArea.y + eraseArea.height/2)) ** 2
                )
                return distance > eraseArea.width / 2
            })
            
            // 移除当前页面的批注，然后添加剩余的
            annotations.value = annotations.value.filter(a => a.page !== currentPage.value).concat(remainingAnnotations)
            
            const removed = before - remainingAnnotations.length
        }
        
        // 简单的矩形重叠检测
        const isRectangleOverlap = (rect1, rect2) => {
            return !(rect1.x + rect1.width < rect2.x || 
                    rect2.x + rect2.width < rect1.x || 
                    rect1.y + rect1.height < rect2.y || 
                    rect2.y + rect2.height < rect1.y)
        }
        
        // 删除被橡皮擦覆盖的笔画部分（真删除）
        const eraseDrawingStrokes = (centerPos, radius) => {
            const pageStrokes = drawingSystem.value.strokes.get(currentPage.value)
            if (!pageStrokes || pageStrokes.length === 0) return 0
            
            let changesCount = 0
            const strokesToRemove = []
            
            // 遍历所有笔画，检查是否与橡皮擦区域重叠
            pageStrokes.forEach((stroke, strokeIndex) => {
                // 快速边界检查
                if (!isStrokeBoundsOverlapping(stroke.bounds, centerPos, radius)) {
                    return
                }
                
                // 详细点检查 - 移除被橡皮擦覆盖的点
                const originalLength = stroke.points.length
                stroke.points = stroke.points.filter(point => {
                    const distance = Math.sqrt(
                        Math.pow(point.x - centerPos.x, 2) + 
                        Math.pow(point.y - centerPos.y, 2)
                    )
                    return distance > radius
                })
                
                // 如果点被大量删除，标记整个笔画为删除
                if (stroke.points.length < originalLength * 0.3) {
                    strokesToRemove.push(strokeIndex)
                    changesCount++
                } else if (stroke.points.length !== originalLength) {
                    // 如果还有剩余点，重新计算边界
                    recalculateStrokeBounds(stroke)
                    changesCount++
                }
            })
            
            // 从后往前删除笔画，避免索引问题
            strokesToRemove.reverse().forEach(index => {
                pageStrokes.splice(index, 1)
            })
            
            return changesCount
        }
        
        // 检查笔画边界是否与圆形区域重叠
        const isStrokeBoundsOverlapping = (bounds, centerPos, radius) => {
            // 找到矩形边界上离圆心最近的点
            const closestX = Math.max(bounds.minX, Math.min(centerPos.x, bounds.maxX))
            const closestY = Math.max(bounds.minY, Math.min(centerPos.y, bounds.maxY))
            
            // 计算距离
            const distance = Math.sqrt(
                Math.pow(closestX - centerPos.x, 2) + 
                Math.pow(closestY - centerPos.y, 2)
            )
            
            return distance <= radius
        }
        
        // 重新计算笔画边界
        const recalculateStrokeBounds = (stroke) => {
            if (stroke.points.length === 0) return
            
            stroke.bounds = {
                minX: Math.min(...stroke.points.map(p => p.x)),
                minY: Math.min(...stroke.points.map(p => p.y)),
                maxX: Math.max(...stroke.points.map(p => p.x)),
                maxY: Math.max(...stroke.points.map(p => p.y))
            }
        }

        const finishErasing = (event) => {
            if (!isAnnotating.value) return
            
            isAnnotating.value = false
            
            event.preventDefault()
            event.stopPropagation()
            
            // 橡皮擦操作完成，标记数据已修改
            cloudPersistenceManager.markDirty()
        }

        const cancelErasing = () => {
            isAnnotating.value = false
        }

        // 通过空间索引删除高亮（最优化版本）
        const eraseHighlightsBySpatialIndex = (eraseArea, candidates) => {
            const toDelete = []
            
            // 只检查候选高亮，大幅减少计算量
            candidates.forEach(highlight => {
                if (isOverlapping(highlight, eraseArea)) {
                    toDelete.push(highlight)
                }
            })
            
            // 批量删除并更新空间索引
            if (toDelete.length > 0) {
                toDelete.forEach(highlight => {
                    // 从空间索引中移除
                    removeFromSpatialIndex(highlight, 'highlights', currentPage.value)
                    
                    // 从主数组中移除
                    const index = highlights.value.findIndex(h => h.id === highlight.id)
                    if (index > -1) {
                        highlights.value.splice(index, 1)
                    }
                })
            }
            
            return toDelete.length
        }

        // 删除重叠的高亮（优化版本，保留作为备用）
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

        // 通过空间索引删除批注（最优化版本）
        const eraseAnnotationsBySpatialIndex = (eraseArea, candidates) => {
            const toDelete = []
            
            // 只检查候选批注，大幅减少计算量
            candidates.forEach(annotation => {
                if (isPointInArea(annotation, eraseArea)) {
                    toDelete.push(annotation)
                }
            })
            
            // 批量删除并更新空间索引
            if (toDelete.length > 0) {
                toDelete.forEach(annotation => {
                    // 从空间索引中移除
                    removeFromSpatialIndex(annotation, 'annotations', currentPage.value)
                    
                    // 从主数组中移除
                    const index = annotations.value.findIndex(a => a.id === annotation.id)
                    if (index > -1) {
                        annotations.value.splice(index, 1)
                    }
                })
            }
            
            return toDelete.length
        }

        // 删除重叠的批注（优化版本，保留作为备用）
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

        // 获取页面绘制状态（调试用）
        const getDrawingStats = (pageNum) => {
            const pageStrokes = drawingSystem.value.strokes.get(pageNum || currentPage.value)
            if (!pageStrokes) return { strokeCount: 0, totalPoints: 0 }
            
            const totalPoints = pageStrokes.reduce((sum, stroke) => sum + stroke.points.length, 0)
            return {
                strokeCount: pageStrokes.length,
                totalPoints,
                memoryEstimate: totalPoints * 16 + ' bytes'
            }
        }

        // 清除Canvas绘制内容（圆形清除，保留作为备用）
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
            
            // 加载状态
            isLoading,
            loadingText,
            
            // 成果数据
            outcomeInfo,
            outcomeId,
            
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
            highlightOpacity,
            clickPosition,
            eraserPreview,
            selectionPreview,
            currentEditingAnnotation,
            
            // 方法
            loadOutcomeAndPDF,
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
            selectHighlight,
            addAnnotation,
            showAnnotationDialog,
            saveAnnotation,
            saveCurrentNote,
            cancelNote,
            clearDrawing,
            updateColor,
            updateHighlightOpacity,
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
            
            // 优化绘制系统
            optimizedDrawingState,
            debouncedSaveDrawing,
            saveFast,
            eraseHighlightsFast,
            eraseAnnotationsFast,
            isRectangleOverlap,

            // PDF文字提取功能
            extractedTexts,
            extractPageText,
            getCurrentPageText,
            getPageText,
            getAllExtractedTexts,
            searchInTexts,

            // 云端持久化功能
            currentPdfInfo,
            exportAllAnnotations,
            loadCloudAnnotations,
            saveAnnotationsToCloudQuiet,
            
            // 空间索引系统
            eraseHighlightsBySpatialIndex,
            eraseAnnotationsBySpatialIndex,
            initSpatialIndex,
            addToSpatialIndex,
            removeFromSpatialIndex,
            queryFromSpatialIndex,
            
            // 调试和状态查询
            getDrawingStats,

            // AI对话功能
            aiSidebarVisible,
            toggleAiSidebar
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

/* 成果标题区域 */
.outcome-header {
    margin-top: 100px;
    padding: 20px 15px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    transform: translateX(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.outcome-title h2 {
    margin: 0 0 12px 0;
    color: #2c3e50;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.4;
    text-align: center;
}

.outcome-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    font-size: 14px;
    color: #6c757d;
}

.outcome-meta span {
    display: flex;
    align-items: center;
}

/* 加载动画容器 */
.loading-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.loading-spinner {
    text-align: center;
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-width: 300px;
}

/* 旋转动画 */
.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e3f2fd;
    border-top: 4px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-text {
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 500;
}

.pdf-reader-container {
    min-height: 100vh;
    margin-top: 20px;
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
    gap: 0;
    min-height: calc(100vh - 120px);
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 工具栏和PDF容器布局样式 */

/* PDF容器 */
.pdf-container {
    display: flex;
    gap: 15px;
    min-height: calc(100vh - 300px);
    background: rgba(255, 255, 255, 0.95);
    border-radius: 0 0 12px 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-top: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .outcome-header {
        margin-top: 80px;
        padding: 15px 10px;
        margin-bottom: 15px;
    }
    
    .outcome-title h2 {
        font-size: 20px;
    }
    
    .outcome-meta {
        gap: 12px;
        font-size: 13px;
        flex-direction: column;
    }
    
    .pdf-reader-container {
        padding: 0 10px;
        margin-top: 15px;
    }
    
    .pdf-container {
        gap: 10px;
        min-height: calc(100vh - 200px);
        padding: 15px;
    }
    
    .loading-spinner {
        padding: 30px 20px;
        max-width: 280px;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border-width: 3px;
    }
    
    .loading-text {
        font-size: 14px;
    }
    
    .main-content-with-sidebar {
        margin-left: 0 !important;
    }
    
    .outcome-header-with-sidebar {
        margin-left: 0 !important;
    }
}

/* 主内容区域适配 */
.main-content-with-sidebar {
    margin-left: 380px;
}

/* 标题区域适配 */
.outcome-header-with-sidebar {
    transform: translateX(190px);
}
</style>