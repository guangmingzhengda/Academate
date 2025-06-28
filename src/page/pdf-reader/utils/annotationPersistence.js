/**
 * PDF标注持久化管理模块
 * 负责保存和加载PDF的高亮、批注、绘制数据
 */

// 数据版本号，用于兼容性管理
const DATA_VERSION = '1.0'

/**
 * 标注数据结构定义
 * {
 *   version: string,           // 数据版本
 *   pdfInfo: {                 // PDF基本信息
 *     fileName: string,        // 文件名
 *     totalPages: number,      // 总页数
 *     fileHash: string         // 文件哈希（可选，用于验证）
 *   },
 *   settings: {                // 全局设置
 *     scale: number,           // 缩放比例
 *     defaultColors: object    // 默认颜色设置
 *   },
 *   annotations: {             // 标注数据
 *     highlights: array,       // 高亮数据
 *     notes: array,           // 批注数据
 *     drawings: array         // 绘制数据
 *   },
 *   metadata: {               // 元数据
 *     createdAt: string,      // 创建时间
 *     updatedAt: string,      // 更新时间
 *     exportedAt: string      // 导出时间
 *   }
 * }
 */

/**
 * 创建标注持久化管理器
 */
export function createAnnotationPersistence() {
    
    /**
     * 生成文件哈希（简单版本，基于文件名和大小）
     */
    const generateFileHash = (fileName, fileSize) => {
        const str = `${fileName}_${fileSize}_${Date.now()}`
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // 转换为32位整数
        }
        return Math.abs(hash).toString(16)
    }

    /**
     * 序列化高亮数据
     */
    const serializeHighlights = (highlights) => {
        return highlights.map(highlight => ({
            id: highlight.id,
            page: highlight.page,
            x: highlight.x,
            y: highlight.y,
            width: highlight.width,
            height: highlight.height,
            color: highlight.color || '#ffff00',
            text: highlight.text || '',
            note: highlight.note || '',
            createdAt: highlight.createdAt || new Date().toISOString()
        }))
    }

    /**
     * 序列化批注数据
     */
    const serializeAnnotations = (annotations) => {
        return annotations.map(annotation => ({
            id: annotation.id,
            page: annotation.page,
            x: annotation.x,
            y: annotation.y,
            content: annotation.content,
            color: annotation.color || '#ff6b6b',
            fontSize: annotation.fontSize || 14,
            createdAt: annotation.createdAt || new Date().toISOString()
        }))
    }

    /**
     * 序列化绘制数据
     */
    const serializeDrawings = (drawingData) => {
        const drawings = []
        
        drawingData.forEach((canvasData, pageNum) => {
            if (canvasData && canvasData.startsWith('data:image/')) {
                drawings.push({
                    page: pageNum,
                    type: 'canvas',
                    data: canvasData,
                    createdAt: new Date().toISOString()
                })
            }
        })
        
        return drawings
    }

    /**
     * 导出所有标注数据
     */
    const exportAnnotations = (pdfInfo, currentScale, highlights, annotations, drawingData) => {
        const exportData = {
            version: DATA_VERSION,
            pdfInfo: {
                fileName: pdfInfo.fileName,
                totalPages: pdfInfo.totalPages,
                fileHash: pdfInfo.fileHash || generateFileHash(pdfInfo.fileName, pdfInfo.fileSize || 0)
            },
            settings: {
                scale: currentScale,
                defaultColors: {
                    highlight: '#ffff00',
                    annotation: '#ff6b6b',
                    drawing: '#000000'
                }
            },
            annotations: {
                highlights: serializeHighlights(highlights || []),
                notes: serializeAnnotations(annotations || []),
                drawings: serializeDrawings(drawingData || new Map())
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                exportedAt: new Date().toISOString(),
                totalHighlights: (highlights || []).length,
                totalNotes: (annotations || []).length,
                totalDrawings: (drawingData || new Map()).size
            }
        }

        return exportData
    }

    /**
     * 保存标注数据到本地文件
     */
    const saveToLocalFile = (exportData, customFileName = null) => {
        try {
            const fileName = customFileName || `${exportData.pdfInfo.fileName}_annotations_${new Date().toISOString().slice(0, 10)}.txt`
            const jsonString = JSON.stringify(exportData, null, 2)
            
            // 创建Blob对象
            const blob = new Blob([jsonString], { type: 'text/plain;charset=utf-8' })
            
            // 创建下载链接
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            
            // 触发下载
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // 清理URL对象
            URL.revokeObjectURL(url)
            
            console.log(`✅ 标注数据已保存到: ${fileName}`)
            console.log(`📊 导出统计:`, {
                高亮数量: exportData.annotations.highlights.length,
                批注数量: exportData.annotations.notes.length,
                绘制数量: exportData.annotations.drawings.length,
                文件大小: `${(jsonString.length / 1024).toFixed(2)} KB`
            })
            
            return { success: true, fileName, size: jsonString.length }
        } catch (error) {
            console.error('❌ 保存标注数据失败:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * 从文件内容加载标注数据
     */
    const loadFromFileContent = (fileContent) => {
        try {
            const data = JSON.parse(fileContent)
            
            // 验证数据格式
            if (!data.version || !data.pdfInfo || !data.annotations) {
                throw new Error('无效的标注数据格式')
            }
            
            // 版本兼容性检查
            if (data.version !== DATA_VERSION) {
                console.warn(`⚠️ 数据版本不匹配: 当前${DATA_VERSION}, 文件${data.version}`)
            }
            
            console.log(`📖 加载标注数据成功:`, {
                PDF文件: data.pdfInfo.fileName,
                总页数: data.pdfInfo.totalPages,
                高亮数量: data.annotations.highlights.length,
                批注数量: data.annotations.notes.length,
                绘制数量: data.annotations.drawings.length,
                导出时间: data.metadata.exportedAt
            })
            
            return { success: true, data }
        } catch (error) {
            console.error('❌ 解析标注数据失败:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * 反序列化高亮数据
     */
    const deserializeHighlights = (highlightData) => {
        return highlightData.map(item => ({
            id: item.id,
            page: item.page,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            color: item.color,
            text: item.text,
            note: item.note,
            createdAt: item.createdAt
        }))
    }

    /**
     * 反序列化批注数据
     */
    const deserializeAnnotations = (annotationData) => {
        return annotationData.map(item => ({
            id: item.id,
            page: item.page,
            x: item.x,
            y: item.y,
            content: item.content,
            color: item.color,
            fontSize: item.fontSize,
            createdAt: item.createdAt
        }))
    }

    /**
     * 反序列化绘制数据
     */
    const deserializeDrawings = (drawingData) => {
        const drawingMap = new Map()
        
        drawingData.forEach(item => {
            if (item.type === 'canvas' && item.data) {
                drawingMap.set(item.page, item.data)
            }
        })
        
        return drawingMap
    }

    /**
     * 应用加载的标注数据
     */
    const applyLoadedData = (loadedData, targetHighlights, targetAnnotations, targetDrawingData) => {
        try {
            // 清空现有数据
            targetHighlights.length = 0
            targetAnnotations.length = 0
            targetDrawingData.clear()
            
            // 应用高亮数据
            const highlights = deserializeHighlights(loadedData.annotations.highlights)
            targetHighlights.push(...highlights)
            
            // 应用批注数据
            const annotations = deserializeAnnotations(loadedData.annotations.notes)
            targetAnnotations.push(...annotations)
            
            // 应用绘制数据
            const drawings = deserializeDrawings(loadedData.annotations.drawings)
            drawings.forEach((data, page) => {
                targetDrawingData.set(page, data)
            })
            
            console.log(`✅ 标注数据应用成功:`)
            console.log(`  - 恢复 ${highlights.length} 个高亮`)
            console.log(`  - 恢复 ${annotations.length} 个批注`) 
            console.log(`  - 恢复 ${drawings.size} 页绘制内容`)
            
            return {
                success: true,
                counts: {
                    highlights: highlights.length,
                    annotations: annotations.length,
                    drawings: drawings.size
                },
                settings: loadedData.settings
            }
        } catch (error) {
            console.error('❌ 应用标注数据失败:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * 验证PDF匹配性
     */
    const validatePDFMatch = (loadedData, currentPdfInfo) => {
        const warnings = []
        
        if (loadedData.pdfInfo.fileName !== currentPdfInfo.fileName) {
            warnings.push(`文件名不匹配: 期望"${loadedData.pdfInfo.fileName}", 当前"${currentPdfInfo.fileName}"`)
        }
        
        if (loadedData.pdfInfo.totalPages !== currentPdfInfo.totalPages) {
            warnings.push(`页数不匹配: 期望${loadedData.pdfInfo.totalPages}页, 当前${currentPdfInfo.totalPages}页`)
        }
        
        if (warnings.length > 0) {
            console.warn('⚠️ PDF匹配性警告:')
            warnings.forEach(warning => console.warn(`  - ${warning}`))
            return { isMatch: false, warnings }
        }
        
        return { isMatch: true, warnings: [] }
    }

    // 返回公共API
    return {
        exportAnnotations,
        saveToLocalFile,
        loadFromFileContent,
        applyLoadedData,
        validatePDFMatch,
        generateFileHash,
        DATA_VERSION
    }
}

export default createAnnotationPersistence 