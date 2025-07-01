import axios from "axios";
import {callError, callSuccess} from "@/call";

// 成果搜索响应数据类型定义
export interface ResourceOutcomeSearchVO {
    outcomeId: number;
    type: string;
    title: string;
    authors: string;
    journal: string;
    publishDate: number | null;
}

export interface PageResultResourceOutcomeSearchVO {
    pageNum: number;
    pageSize: number;
    total: number;
    list: ResourceOutcomeSearchVO[];
}

export interface BaseResponsePageResultResourceOutcomeSearchVO {
    code: number;
    data: PageResultResourceOutcomeSearchVO;
    message: string;
}

/**
 * 获取所有成果
 * 根据prompt.md实现
 * 接口地址：/api/research_outcome/search/
 * 请求方式：GET
 */
export async function getAllOutcomes(pageNum: number = 1, pageSize: number = 5): Promise<PageResultResourceOutcomeSearchVO | null> {
    try {
        console.log(`开始获取成果列表: pageNum=${pageNum}, pageSize=${pageSize}`);
        
        const response = await axios.get<BaseResponsePageResultResourceOutcomeSearchVO>('/research_outcome/search/', {
            params: {
                key: '',
                notMine: false,
                pageSize: pageSize,
                pageNum: pageNum
            }
        });
        
        console.log('获取成果列表响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log(`成功获取到 ${response.data.data.list.length} 条成果数据`);
                return response.data.data;
            } else {
                callError(response.data.message || '获取成果列表失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error: any) {
        console.error('获取成果列表错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '获取成果列表失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('获取成果列表失败，请重试');
        }
        return null;
    }
}

/**
 * 获取热门推荐
 * 根据prompt.md实现
 * 接口地址：/api/recommendation/for-user
 * 请求方式：GET
 */
export async function getPopularRecommendations(pageNum: number = 1, pageSize: number = 8): Promise<PageResultResourceOutcomeSearchVO | null> {
    try {
        console.log(`开始获取热门推荐: pageNum=${pageNum}, pageSize=${pageSize}`);
        
        const response = await axios.get<BaseResponsePageResultResourceOutcomeSearchVO>('/recommendation/for-user', {
            params: {
                pageSize: pageSize,
                pageNum: pageNum
            }
        });
        
        console.log('获取热门推荐响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code === 0) {
                console.log(`成功获取到 ${response.data.data.list.length} 条推荐数据`);
                return response.data.data;
            } else {
                callError(response.data.message || '获取热门推荐失败');
                return null;
            }
        } else {
            callError('网络错误');
            return null;
        }
    } catch (error: any) {
        console.error('获取热门推荐错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '获取热门推荐失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('获取热门推荐失败，请重试');
        }
        return null;
    }
}

