import axios from "axios";
import { callSuccess, callError, callInfo, callWarning } from "@/call";

// 搜索科研人员请求参数类型
export interface UserSearchRequest {
    userName?: string;
    field?: string;
    researchTitle?: string;
    institution?: string;
    current?: number;
    pageSize?: number;
}

// 研究成果类型
export interface ResearchOutcomeVO {
    outcomeId: number;
    type: string;
    title: string;
    authors: string;
    journal: string;
    volume: number;
    issue: number;
    pages: string;
    publishDate: number;
    doi: string;
    url: string;
    patentNumber: string;
    authorOrder: number;
}

// 用户详细信息类型
export interface UserDetailVO {
    id: number;
    account: string;
    email: string;
    institution: string;
    field: string;
    profile: string;
    avatar: string;
    createTime: string;
    researchOutcomes: ResearchOutcomeVO[];
}

// 分页结果类型
export interface PageResultUserDetailVO {
    pageNum: number;
    pageSize: number;
    total: number;
    list: UserDetailVO[];
}

// API响应类型
export interface SearchResponse {
    code: number;
    data: PageResultUserDetailVO;
    message: string;
}

/**
 * 搜索科研人员
 * 
 * @param searchParams 搜索参数
 * @returns Promise<PageResultUserDetailVO | null> 成功返回分页结果，失败返回null
 */
export async function searchResearchers(searchParams: UserSearchRequest): Promise<PageResultUserDetailVO | null> {
    try {
        const response = await axios.post<SearchResponse>('/user/search', searchParams, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                return response.data.data;
            } else {
                callError(response.data.message || '搜索失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error) {
        callError('网络错误或服务器异常');
        return null;
    }
}
