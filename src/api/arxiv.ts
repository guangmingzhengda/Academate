import axios from "axios";
import { callError, callSuccess } from "@/call";
import store from "@/store";

// arXiv关键词订阅请求参数类型
export interface ArxivSubscriptionRequest {
  /** 关键词 */
  keyword: string;
  /** 收藏夹ID */
  favoriteId: number;
}

// arXiv作者订阅请求参数类型
export interface ArxivAuthorSubscriptionRequest {
  /** 作者 */
  author: string;
  /** 收藏夹ID */
  favoriteId: number;
}

// arXiv订阅信息类型
export interface ArxivSubscriptionVO {
  /** 用户ID */
  userId: number;
  /** 关键词 */
  keyword: string;
  /** 描述 */
  description: string;
  /** 收藏夹ID */
  favoriteId: number;
  /** 收藏夹名称 */
  favoriteName: string;
}

// arXiv作者订阅信息类型
export interface ArxivAuthorSubscriptionVO {
  /** 用户ID */
  userId: number;
  /** 作者 */
  author: string;
  /** 收藏夹ID */
  favoriteId: number;
  /** 收藏夹名称 */
  favoriteName: string;
}

// 基础响应类型
export interface BaseResponseString {
  code: number;
  data: string;
  message: string;
}

// 获取订阅列表响应类型
export interface BaseResponseListArxivSubscriptionVO {
  code: number;
  data: ArxivSubscriptionVO[];
  message: string;
}

// 获取作者订阅列表响应类型
export interface BaseResponseListArxivAuthorSubscriptionVO {
  code: number;
  data: ArxivAuthorSubscriptionVO[];
  message: string;
}

/**
 * 订阅arXiv关键词-分类
 * 
 * 接口地址: /arxiv/subscription/subscribe
 * 请求方式: POST
 * 请求数据类型: application/x-www-form-urlencoded,application/json
 * 
 * @param data 订阅请求参数
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function subscribeArxivKeyword(data: ArxivSubscriptionRequest): Promise<boolean> {
  try {
    console.log('订阅arXiv关键词请求数据:', data);
    
    // 使用专门的arXiv axios实例
    const response = await axios.post<BaseResponseString>('/arxiv/subscription/subscribe', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('订阅arXiv关键词响应:', response.data);
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        callSuccess('arXiv关键词订阅成功');
        return true;
      } else {
        callError(response.data.message || '订阅失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error: any) {
    console.error('订阅arXiv关键词错误:', error);
    if (error.response) {
      callError(error.response.data?.message || '订阅失败');
    } else if (error.request) {
      callError('网络连接错误');
    } else {
      callError('订阅失败，请重试');
    }
    return false;
  }
}

/**
 * 订阅arXiv作者
 * 
 * 接口地址: /arxiv/subscription/author/subscribe
 * 请求方式: POST
 * 请求数据类型: application/x-www-form-urlencoded,application/json
 * 
 * @param data 作者订阅请求参数
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function subscribeArxivAuthor(data: ArxivAuthorSubscriptionRequest): Promise<boolean> {
  try {
    console.log('订阅arXiv作者请求数据:', data);
    
    // 使用专门的arXiv axios实例
    const response = await axios.post<BaseResponseString>('/arxiv/subscription/author/subscribe', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('订阅arXiv作者响应:', response.data);
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        callSuccess('arXiv作者订阅成功');
        return true;
      } else {
        callError(response.data.message || '订阅失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error: any) {
    console.error('订阅arXiv作者错误:', error);
    if (error.response) {
      callError(error.response.data?.message || '订阅失败');
    } else if (error.request) {
      callError('网络连接错误');
    } else {
      callError('订阅失败，请重试');
    }
    return false;
  }
}

/**
 * 获取用户的关键词订阅列表
 * 
 * 接口地址: /arxiv/subscription/list
 * 请求方式: GET
 * 请求数据类型: application/x-www-form-urlencoded
 * 
 * @returns Promise<ArxivSubscriptionVO[] | null> 成功返回订阅列表，失败返回null
 */
export async function getArxivSubscriptionList(): Promise<ArxivSubscriptionVO[] | null> {
  try {
    console.log('获取arXiv订阅列表请求');
    
    // 使用专门的arXiv axios实例
    const response = await axios.get<BaseResponseListArxivSubscriptionVO>('/arxiv/subscription/list', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('获取arXiv订阅列表响应:', response.data);
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return response.data.data;
      } else {
        callError(response.data.message || '获取订阅列表失败');
        return null;
      }
    } else {
      callError('网络错误');
      return null;
    }
  } catch (error: any) {
    console.error('获取arXiv订阅列表错误:', error);
    if (error.response) {
      callError(error.response.data?.message || '获取订阅列表失败');
    } else if (error.request) {
      callError('网络连接错误');
    } else {
      callError('获取订阅列表失败，请重试');
    }
    return null;
  }
}

/**
 * 获取用户的arXiv作者订阅列表
 * 
 * 接口地址: /arxiv/subscription/author/list
 * 请求方式: GET
 * 请求数据类型: application/x-www-form-urlencoded
 * 
 * @returns Promise<ArxivAuthorSubscriptionVO[] | null> 成功返回作者订阅列表，失败返回null
 */
export async function getArxivAuthorSubscriptionList(): Promise<ArxivAuthorSubscriptionVO[] | null> {
  try {
    console.log('获取arXiv作者订阅列表请求');
    
    // 使用专门的arXiv axios实例
    const response = await axios.get<BaseResponseListArxivAuthorSubscriptionVO>('/arxiv/subscription/author/list', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('获取arXiv作者订阅列表响应:', response.data);
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return response.data.data;
      } else {
        callError(response.data.message || '获取作者订阅列表失败');
        return null;
      }
    } else {
      callError('网络错误');
      return null;
    }
  } catch (error: any) {
    console.error('获取arXiv作者订阅列表错误:', error);
    if (error.response) {
      callError(error.response.data?.message || '获取作者订阅列表失败');
    } else if (error.request) {
      callError('网络连接错误');
    } else {
      callError('获取作者订阅列表失败，请重试');
    }
    return null;
  }
}

/**
 * 取消订阅arXiv关键词-分类
 * 
 * 接口地址: /arxiv/subscription/unsubscribe
 * 请求方式: DELETE
 * 请求数据类型: application/x-www-form-urlencoded
 * 
 * @param keyword 要取消订阅的关键词
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function unsubscribeArxivKeyword(keyword: string): Promise<boolean> {
  try {
    console.log('取消订阅arXiv关键词请求，关键词:', keyword);
    
    // 使用专门的arXiv axios实例
    const response = await axios.delete<BaseResponseString>('/arxiv/subscription/unsubscribe', {
      params: {
        keyword: keyword
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('取消订阅arXiv关键词响应:', response.data);
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        callSuccess('arXiv关键词取消订阅成功');
        return true;
      } else {
        callError(response.data.message || '取消订阅失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error: any) {
    console.error('取消订阅arXiv关键词错误:', error);
    if (error.response) {
      callError(error.response.data?.message || '取消订阅失败');
    } else if (error.request) {
      callError('网络连接错误');
    } else {
      callError('取消订阅失败，请重试');
    }
    return false;
  }
}

/**
 * 取消订阅arXiv作者
 * 
 * 接口地址: /arxiv/subscription/author/unsubscribe
 * 请求方式: DELETE
 * 请求数据类型: application/x-www-form-urlencoded
 * 
 * @param author 要取消订阅的作者
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function unsubscribeArxivAuthor(author: string): Promise<boolean> {
  try {
    console.log('取消订阅arXiv作者请求，作者:', author);
    
    // 使用专门的arXiv axios实例
    const response = await axios.delete<BaseResponseString>('/arxiv/subscription/author/unsubscribe', {
      params: {
        author: author
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('取消订阅arXiv作者响应:', response.data);
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        callSuccess('arXiv作者取消订阅成功');
        return true;
      } else {
        callError(response.data.message || '取消订阅失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error: any) {
    console.error('取消订阅arXiv作者错误:', error);
    if (error.response) {
      callError(error.response.data?.message || '取消订阅失败');
    } else if (error.request) {
      callError('网络连接错误');
    } else {
      callError('取消订阅失败，请重试');
    }
    return false;
  }
}

/**
 * 检查收藏夹及其所有子收藏夹是否有订阅
 * 
 * @param favoriteId 收藏夹ID
 * @param allFolders 所有收藏夹列表（用于构建层级关系）
 * @returns Promise<boolean> 有订阅返回true，无订阅返回false
 */
export async function checkFavoriteHasSubscription(favoriteId: number, allFolders: any[] = []): Promise<boolean> {
  try {
    console.log('检查收藏夹订阅状态请求:', favoriteId);
    
    // 获取关键词订阅列表
    const keywordSubscriptions = await getArxivSubscriptionList();
    // 获取作者订阅列表
    const authorSubscriptions = await getArxivAuthorSubscriptionList();
    
    // 获取所有有订阅的收藏夹ID（包括关键词和作者订阅）
    const subscribedFolderIds = new Set<number>();
    
    // 添加关键词订阅的收藏夹ID
    keywordSubscriptions?.forEach(sub => {
      subscribedFolderIds.add(sub.favoriteId);
    });
    
    // 添加作者订阅的收藏夹ID
    authorSubscriptions?.forEach(sub => {
      subscribedFolderIds.add(sub.favoriteId);
    });
    
    // 检查指定收藏夹及其所有子收藏夹是否有订阅
    const checkFolderAndSubFolders = (folderId: number): boolean => {
      // 检查当前收藏夹是否有订阅
      if (subscribedFolderIds.has(folderId)) {
        return true;
      }
      
      // 查找当前收藏夹的所有子收藏夹
      const subFolders = allFolders.filter(folder => folder.parentId === folderId);
      
      // 递归检查每个子收藏夹
      for (const subFolder of subFolders) {
        if (checkFolderAndSubFolders(subFolder.favoriteId)) {
          return true;
        }
      }
      
      return false;
    };
    
    const hasSubscription = checkFolderAndSubFolders(favoriteId);
    
    console.log('检查收藏夹订阅状态结果:', {
      favoriteId,
      subscribedFolderIds: Array.from(subscribedFolderIds),
      hasSubscription
    });
    
    return hasSubscription;
  } catch (error: any) {
    console.error('检查收藏夹订阅状态错误:', error);
    // 如果检查失败，为了安全起见，假设有订阅，阻止删除
    return true;
  }
} 