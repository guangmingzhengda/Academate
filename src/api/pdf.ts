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
 * AI对话请求接口
 */
export interface ChatRequest {
  /** 模型名称 */
  model: string;
  
  /** 对话消息列表 */
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  
  /** 是否流式输出 */
  stream: boolean;
  
  /** 最大tokens数 */
  max_tokens?: number;
  
  /** 温度参数 */
  temperature?: number;
  
  /** API密钥 */
  apiKey?: string;
}

/**
 * AI对话响应数据接口
 */
export interface ChatResponseData {
  /** 选择列表 */
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  
  /** 错误信息 */
  error?: {
    message: string;
  };
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
      // callError(`获取批注失败: ${response.data.message || '未知错误'}`);
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



/**
 * AI对话流式响应
 * 
 * @param message 用户消息内容（已包含页面内容的完整消息）
 * @param onData 数据回调函数，用于处理流式数据
 * @param onError 错误回调函数
 * @param onComplete 完成回调函数
 * @param apiKey API密钥，暂时为空等待用户填写
 * @param model 模型名称，默认使用火山方舟的模型
 * @returns Promise<boolean> 是否成功启动流式请求
 */
export async function generateChatStream(
  message: string,
  onData: (data: string) => void,
  onError?: (error: string) => void,
  onComplete?: () => void,
  apiKey: string = 'b1d34875-d54d-4c42-97b4-b9d067cecf03', // 暂时为空，等待用户填写
  model: string = 'doubao-1-5-thinking-pro-250415' // 默认模型ID，可以根据需要修改
): Promise<boolean> {
  // 检查API密钥
  if (!apiKey || apiKey.trim() === '') {
    const errorMessage = 'API密钥未设置，请先配置API密钥';
    console.error('AI对话请求失败:', errorMessage);
    callError('API密钥未设置，请联系管理员配置');
    if (onError) onError(errorMessage);
    return false;
  }

  try {
    // 构建请求数据
    const requestData: ChatRequest = {
      model: model,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      stream: true,
      max_tokens: 2000,
      temperature: 0.7,
      apiKey: apiKey
    };

    console.log('发送AI对话请求:', { model, messageLength: message.length });

    // 发起流式请求到火山方舟API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`;
      console.error('AI对话请求失败:', errorMessage);
      callError(`AI对话请求失败: ${response.status} ${response.statusText}`);
      if (onError) onError(errorMessage);
      return false;
    }

    if (!response.body) {
      const errorMessage = 'Response body is null';
      console.error('AI对话请求失败:', errorMessage);
      callError('服务器响应异常');
      if (onError) onError(errorMessage);
      return false;
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('AI对话流式响应完成');
          if (onComplete) onComplete();
          break;
        }

        // 解码数据
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 处理可能的多个SSE事件
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // 处理SSE格式的数据
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim(); // 移除 'data: ' 前缀
            
            if (data === '[DONE]') {
              console.log('AI对话生成完成');
              if (onComplete) onComplete();
              return true;
            }

            try {
              const parsed: ChatResponseData = JSON.parse(data);
              
              if (parsed.error) {
                console.error('AI对话生成错误:', parsed.error.message);
                if (onError) onError(parsed.error.message);
                return false;
              }

              if (parsed.choices && parsed.choices.length > 0) {
                const choice = parsed.choices[0];
                if (choice.delta && choice.delta.content) {
                  onData(choice.delta.content);
                }
              }
            } catch (parseError) {
              console.warn('解析流式数据失败:', parseError, 'data:', data);
              // 继续处理其他行，不中断整个流程
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = `处理流式响应失败: ${error instanceof Error ? error.message : '未知错误'}`;
      console.error('处理AI对话流式响应失败:', error);
      callError('处理AI响应时发生错误');
      if (onError) onError(errorMessage);
      return false;
    } finally {
      reader.releaseLock();
    }

    return true;

  } catch (error) {
    const errorMessage = `AI对话请求失败: ${error instanceof Error ? error.message : '未知错误'}`;
    console.error('AI对话请求失败:', error);
    callError('网络错误，AI对话请求失败');
    if (onError) onError(errorMessage);
    return false;
  }
} 