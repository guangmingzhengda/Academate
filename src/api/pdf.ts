import axios from "axios";
import { callError, callSuccess, callInfo } from "@/call";

/**
 * 批注请求接口
 */
export interface NoteRequest {
  /** 成果ID */
  outcomeId: number;
  
  /** 批注数据字符串 */
  annotation: string;
}

/**
 * 批注响应数据接口
 */
export interface NoteVO {
  /** 批注ID */
  id: number;
  
  /** 用户ID */
  userId: number;
  
  /** 成果ID */
  outcomeId: number;
  
  /** 批注数据字符串 */
  annotation: string;
  
  /** 创建时间 */
  createdAt: string;
}

/**
 * 基础响应接口
 */
export interface BaseResponse {
  /** 响应码 */
  code: number;
  
  /** 响应数据 */
  data: any;
  
  /** 响应消息 */
  message: string;
}

/**
 * 批注响应接口
 */
export interface BaseResponseNoteVO {
  /** 响应码 */
  code: number;
  
  /** 响应数据 */
  data: NoteVO;
  
  /** 响应消息 */
  message: string;
}

/**
 * 云端批注持久化管理器
 */
export class CloudAnnotationPersistence {
  private outcomeId: number = 0;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private isDirty: boolean = false;
  
  /**
   * 设置当前成果ID
   */
  setOutcomeId(outcomeId: number) {
    this.outcomeId = outcomeId;
  }
  
  /**
   * 标记数据已修改，需要保存
   */
  markDirty() {
    this.isDirty = true;
  }
  
  /**
   * 导出批注数据（与原来的格式保持一致）
   */
  exportAnnotations(
    pdfInfo: any,
    scale: number,
    highlights: any[],
    annotations: any[],
    drawingData: Map<number, string>
  ) {
    // 转换绘制数据为数组格式
    const drawings: any[] = [];
    drawingData.forEach((data, pageNum) => {
      if (data && data.startsWith('data:image/')) {
        drawings.push({
          page: pageNum,
          type: 'canvas',
          data: data,
          createdAt: new Date().toISOString()
        });
      }
    });
    
    return {
      version: "1.0",
      pdfInfo: pdfInfo,
      settings: {
        scale: scale,
        highlightOpacity: 0.15, // 默认透明度，实际值由调用方传入
        defaultColors: {
          highlight: "#ffff00",
          annotation: "#ff6b6b", 
          drawing: "#000000"
        }
      },
      annotations: {
        highlights: highlights,
        notes: annotations,
        drawings: drawings
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
        totalHighlights: highlights.length,
        totalNotes: annotations.length,
        totalDrawings: drawings.length
      }
    };
  }
  
  /**
   * 应用加载的数据（与原来的格式保持一致）
   */
  applyLoadedData(
    loadedData: any,
    highlights: any[],
    annotations: any[],
    drawingData: Map<number, string>
  ) {
    try {
      // 清空现有数据
      highlights.length = 0;
      annotations.length = 0;
      drawingData.clear();
      
      let counts = { highlights: 0, annotations: 0, drawings: 0 };
      
      // 恢复高亮
      if (loadedData.annotations?.highlights) {
        highlights.push(...loadedData.annotations.highlights);
        counts.highlights = loadedData.annotations.highlights.length;
      }
      
      // 恢复批注
      if (loadedData.annotations?.notes) {
        annotations.push(...loadedData.annotations.notes);
        counts.annotations = loadedData.annotations.notes.length;
      }
      
      // 恢复绘制内容
      if (loadedData.annotations?.drawings) {
        loadedData.annotations.drawings.forEach((drawing: any) => {
          if (drawing.page && drawing.data) {
            drawingData.set(drawing.page, drawing.data);
            counts.drawings++;
          }
        });
      }
      
      return {
        success: true,
        counts: counts
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '应用数据失败'
      };
    }
  }
  
  /**
   * 启动自动保存（每30秒）
   */
  startAutoSave(saveCallback: () => void) {
    this.stopAutoSave(); // 先停止之前的定时器
    
    this.autoSaveTimer = setInterval(() => {
      if (this.isDirty) {
        saveCallback();
        this.isDirty = false;
      }
    }, 30000); // 30秒
  }
  
  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

/**
 * 保存批注到云端
 */
export async function saveAnnotationsToCloud(outcomeId: number, annotationData: object): Promise<boolean> {
  try {
    const request: NoteRequest = {
      outcomeId: outcomeId,
      annotation: JSON.stringify(annotationData)
    };
    
    const response = await axios.post('/note/comment', request);
    
    if (response.data.code === 0) {
      return true;
    } else {
      callError(`保存失败: ${response.data.message || '未知错误'}`);
      return false;
    }
  } catch (error) {
    console.error('保存批注到云端失败:', error);
    callError('网络错误，保存失败');
    return false;
  }
}

/**
 * 从云端获取批注数据
 */
export async function getAnnotationsFromCloud(outcomeId: number): Promise<any | null> {
  try {
    const response = await axios.get('/note/getNote', {
      params: {
        outcomeId: outcomeId
      }
    });
    
    if (response.data.code === 0) {
      const annotationString = response.data.data?.annotation;
      if (annotationString) {
        try {
          return JSON.parse(annotationString);
        } catch (error) {
          console.error('解析批注数据失败:', error);
          return null;
        }
      }
      return null;
    } else {
      // 如果是没有找到数据，不显示错误
      if (response.data.code === 404 || response.data.message?.includes('not found')) {
        return null;
      }
      callError(`获取批注失败: ${response.data.message || '未知错误'}`);
      return null;
    }
  } catch (error) {
    console.error('从云端获取批注失败:', error);
    // 网络错误或服务器错误，不影响PDF正常加载
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // 没有找到批注数据是正常情况
    }
    callError('网络错误，无法获取批注数据');
    return null;
  }
}

/**
 * 创建云端批注持久化管理器实例
 */
export function createCloudAnnotationPersistence(): CloudAnnotationPersistence {
  return new CloudAnnotationPersistence();
} 