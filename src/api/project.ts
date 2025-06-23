import axios from "axios";
import {callSuccess, callError, callInfo, callWarning} from "@/call";

export async function create_project(data : {
    title: string,
    description: string,
    creatorId: number
}) :Promise<boolean> {
    try {
        // console.log(data);
        const response = await axios.post('/project/create', data);
        if (response.status === 200){
            if (response.data.code == 0) {
                // callSuccess('创建成功'); // 让调用方处理成功消息
                return true;
            }
            else{
                callError(response.data.message);
                return false;
            }
        }
        else {
            // callError('网络错误');
            return false;
        }
    }

    catch (error){
        callError('网络错误或服务器异常');
        return false;
    }
}

// 参数接口
export interface SearchUsersParams {
  userName?: string;
  field?: string;
  researchTitle?: string;
  institution?: string;
  current?: number;
  pageSize?: number;
}

// 响应接口
export interface SearchUsersRes {
  code: number;
  data: {
    pageNum: number;
    pageSize: number;
    total: number;
    list: {
      id: number;
      account: string;
      email: string;
      institution: string;
      field: string;
      profile: string;
      avatar: string;
      createTime: Record<string, unknown>;
      researchOutcomes: {
        outcomeId: number;
        type: string;
        title: string;
        authors: string;
        journal: string;
        volume: number;
        issue: number;
        pages: string;
        year: number;
        doi: string;
        url: string;
        patentNumber: string;
        authorOrder: number;
      }[];
    }[];
  };
  message: string;
}

/**
 * 搜索科研人员
 * @param {object} params UserSearchRequest
 * @param {string} params.userName 
 * @param {string} params.field 
 * @param {string} params.researchTitle 
 * @param {string} params.institution 
 * @param {number} params.current 
 * @param {number} params.pageSize 
 * @returns
 */
export function searchUsers(params: SearchUsersParams): Promise<SearchUsersRes> {
  return axios.post(`/user/search`, params).then(res => res.data);
}
