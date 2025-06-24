import axios from "axios";
import { callError } from "@/call";

/**
 * 研究成果信息接口
 */
export interface ResearchOutcomeVO {
  /** 成果ID */
  outcomeId: number;
  
  /** 成果类型 */
  type: string;
  
  /** 标题 */
  title: string;
  
  /** 作者 (逗号分隔) */
  authors: string;
  
  /** 期刊名称 */
  journal: string;
  
  /** 卷号 */
  volume: number;
  
  /** 期号 */
  issue: number;
  
  /** 页码 */
  pages: number;
  
  /** 发布日期 */
  publishDate: string;
  
  /** DOI */
  doi: string;
  
  /** URL */
  url: string;
  
  /** 专利号 */
  patentNumber: string;
}

/**
 * 研究成果响应接口
 */
export interface ResearchOutcomeResponse {
  /** 响应码 */
  code: number;
  
  /** 响应数据 */
  data: ResearchOutcomeVO;
  
  /** 响应消息 */
  message: string;
}

/**
 * 根据成果ID获取研究成果信息
 * @param outcomeId 成果ID
 * @returns 研究成果信息
 */
export async function getResearchOutcomeById(outcomeId: number): Promise<ResearchOutcomeVO | null> {
  try {
    const response = await axios.get<ResearchOutcomeResponse>(`/research_outcome/detail/${outcomeId}`);
    
    if (response.status === 200 && response.data.code === 0) {
      return response.data.data;
    } else {
      callError("获取研究成果信息失败: " + (response.data.message || "未知错误"));
      return null;
    }
  } catch (error) {
    callError("获取研究成果信息失败: " + error);
    return null;
  }
}
