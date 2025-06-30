import axios from "axios";
import { callError } from "@/call";

// 订阅主题请求参数类型
export interface TrendSubscriptionRequest {
  userId?: number;
  paperTopic?: string;
  subscriptionCycle?: number;
}

// 基础响应类型
export interface BaseResponse {
  code: number;
  data: any;
  message: string;
}

// 用户订阅信息类型
export interface TrendSubscription {
  subscriptionId: number;
  userId: number;
  paperTopic: string;
  subscriptionCycle: number;
  createdAt: string;
  nextGenerateTime: string;
}

// 获取用户订阅列表响应类型
export interface BaseResponseListTrendSubscription {
  code: number;
  data: TrendSubscription[];
  message: string;
}

// 技术报告类型
export interface TechReport {
  id: number;
  subscriptionId: number;
  genDate: string;
  text: string;
  mindmap: string;
  trendGraph: string;
  wordCloud: string;
}

// 分页结果类型
export interface PageResultTechReport {
  pageNum: number;
  pageSize: number;
  total: number;
  list: TechReport[];
}

// 响应类型
export interface BaseResponsePageResultTechReport {
  code: number;
  data: PageResultTechReport;
  message: string;
}

/**
 * 订阅技术趋势报告主题
 * @param userId 用户ID
 * @param trendSubscriptionRequests 订阅请求数组
 * @returns Promise<BaseResponse | undefined>
 */
export async function subscribeTrendTopic(
  userId: number,
  trendSubscriptionRequests: TrendSubscriptionRequest[]
): Promise<BaseResponse | undefined> {
  try {
    const response = await axios.post("/trend/subscribe", trendSubscriptionRequests, {
      params: { userId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      return response.data;
    } else {
      callError("网络错误");
    }
  } catch (error) {
    callError(error as string);
  }
}

/**
 * 取消技术趋势报告主题订阅
 * @param userId 用户ID
 * @param topics 要取消订阅的主题数组
 * @returns Promise<BaseResponse | undefined>
 */
export async function cancelTrendSubscription(
  userId: number,
  topics: string[]
): Promise<BaseResponse | undefined> {
  try {
    const response = await axios.post("/trend/cancel", topics, {
      params: { userId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      callError("网络错误");
    }
  } catch (error) {
    callError(error as string);
  }
}

/**
 * 获取用户订阅列表
 * @param userId 用户ID
 * @returns Promise<BaseResponseListTrendSubscription | undefined>
 */
export async function getUserTrendSubscriptions(
  userId: number
): Promise<BaseResponseListTrendSubscription | undefined> {
  try {
    const response = await axios.get("/trend/subscription/list", {
      params: { userId },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      callError("网络错误");
    }
  } catch (error) {
    callError(error as string);
  }
}

/**
 * 分页获取技术报告列表
 * @param params 查询参数（userId、subscriptionId、pageNum、pageSize均可选）
 * @returns Promise<BaseResponsePageResultTechReport | undefined>
 */
export async function getTechReportList(
  params: {
    userId?: number;
    subscriptionId?: number;
    pageNum?: number;
    pageSize?: number;
  }
): Promise<BaseResponsePageResultTechReport | undefined> {
  try {
    const response = await axios.get("/trend/tech_report/list", {
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      callError("网络错误");
    }
  } catch (error) {
    callError(error as string);
  }
}
