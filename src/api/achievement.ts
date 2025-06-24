import axios from "axios";
import {callError} from "@/call";
import {useStore} from "vuex";

// 成果元数据上传接口
export interface ResearchOutcomeMetaUploadRequest {
  type?: string;
  title?: string;
  authors?: string;
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: string;
  publishDate?: number;
  doi?: string;
  patentNumber?: string;
}

export interface BaseResponseLong {
  code: number;
  data: number;
  message: string;
}

/**
 * 上传成果元数据
 * @param data ResearchOutcomeMetaUploadRequest
 * @returns Promise<BaseResponseLong>
 */
export async function uploadAchievementMeta(
  data: ResearchOutcomeMetaUploadRequest
): Promise<BaseResponseLong | undefined> {
  try {
    const response = await axios.post("/research_outcome/upload_meta", data);
    if (response.status === 200) {
      return response.data;
    } else {
      callError("网络错误");
    }
  } catch (error) {
    callError(error as string);
  }
}
