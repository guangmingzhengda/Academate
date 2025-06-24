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

// 参数接口
export interface SearchUsersParams {
  /* 用户名 */
  userName?: string;

  /* 研究领域 */
  field?: string;

  /* 研究成果标题 */
  researchTitle?: string;

  /* 所属机构 */
  institution?: string;

  /* 当前页码 */
  current?: number;

  /* 每页数量 */
  pageSize?: number;
}

// 响应接口
export interface SearchUsersRes {
  /* 响应码 */
  code: number;

  /* 响应数据 */
  data: {
    /* 当前页码 */
    pageNum: number;

    /* 每页数量 */
    pageSize: number;

    /* 总记录数 */
    total: number;

    /* 用户列表 */
    list: {
      /* 用户ID */
      id: number;

      /* 用户账号 */
      account: string;

      /* 邮箱 */
      email: string;

      /* 所属机构 */
      institution: string;

      /* 研究领域 */
      field: string;

      /* 个人简介 */
      profile: string;

      /* 头像 */
      avatar: string;

      /* 创建时间 */
      createTime: Record<string, unknown>;

      /* 研究成果 */
      researchOutcomes: {
        /* 成果ID */
        outcomeId: number;

        /* 成果类型 */
        type: string;

        /* 成果标题 */
        title: string;

        /* 作者 */
        authors: string;

        /* 期刊 */
        journal: string;

        /* 卷号 */
        volume: number;

        /* 期号 */
        issue: number;

        /* 页码 */
        pages: string;

        /* 年份 */
        year: number;

        /* DOI */
        doi: string;

        /* URL */
        url: string;

        /* 专利号 */
        patentNumber: string;

        /* 作者顺序 */
        authorOrder: number;
      }[];
    }[];
  };

  /* 响应消息 */
  message: string;
}

/** 
 * 搜索科研人员
 * @param {object} params UserSearchRequest
 * @param {string} params.userName 用户名
 * @param {string} params.field 研究领域
 * @param {string} params.researchTitle 研究成果标题
 * @param {string} params.institution 所属机构
 * @param {number} params.current 当前页码
 * @param {number} params.pageSize 每页数量
 * @returns Promise<SearchUsersRes> 搜索结果
 */
export function searchUsers(params: SearchUsersParams): Promise<SearchUsersRes> {
  return axios.post(`/user/search`, params);
}