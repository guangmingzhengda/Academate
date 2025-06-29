import axios from "axios";
import { callError } from "@/call";

// 收藏夹实体类型
export interface Favorite {
  favoriteId: number;
  name: string;
  userId: number;
  parentId: number;
}

// 分页结果类型
export interface PageResultFavorite {
  pageNum: number;
  pageSize: number;
  total: number;
  list: Favorite[];
}

// API响应类型
export interface BaseResponsePageResultFavorite {
  code: number;
  data: PageResultFavorite;
  message: string;
}

// 创建收藏夹请求参数类型
export interface FavoriteCreateRequest {
  name?: string;
  parentId?: number;
}

// 更新收藏夹请求参数类型
export interface FavoriteUpdateRequest {
  favoriteId?: number;
  name?: string;
}

// 添加成果到收藏夹请求参数类型
export interface FavoriteOutcome {
  favoriteId?: number;
  outcomeId?: number;
}

// 创建收藏夹响应类型
export interface BaseResponseLong {
  code: number;
  data: number;
  message: string;
}

// 删除收藏夹响应类型
export interface BaseResponseVoid {
  code: number;
  data: object;
  message: string;
}

// 分页获取收藏夹请求参数类型
export interface GetFavoritePageRequest {
  pageSize: number;
  pageNum: number;
  parentId?: number;
}

// 收藏夹中的成果类型
export interface ResourceOutcomeSearchVO {
  outcomeId: number;
  type: string;
  title: string;
  authors: string;
  journal: string;
  publishDate: number;
}

// 分页获取收藏夹中成果的结果类型
export interface PageResultResourceOutcomeSearchVO {
  pageNum: number;
  pageSize: number;
  total: number;
  list: ResourceOutcomeSearchVO[];
}

// 分页获取收藏夹中成果的API响应类型
export interface BaseResponsePageResultResourceOutcomeSearchVO {
  code: number;
  data: PageResultResourceOutcomeSearchVO;
  message: string;
}

// 分页获取收藏夹中成果的请求参数类型
export interface GetFavoriteOutcomePageRequest {
  pageSize: number;
  pageNum: number;
  favoriteId?: number;
}

/**
 * 创建收藏夹
 * 
 * @param data 创建收藏夹的请求参数
 * @returns Promise<number | null> 成功返回收藏夹ID，失败返回null
 */
export async function createFavorite(data: FavoriteCreateRequest): Promise<number | null> {
  try {
    const response = await axios.post<BaseResponseLong>('/favorite/create', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return response.data.data;
      } else {
        callError(response.data.message || '创建收藏夹失败');
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

/**
 * 分页获取收藏夹
 * 
 * @param params 请求参数
 * @returns Promise<PageResultFavorite | null> 成功返回分页结果，失败返回null
 */
export async function getFavoritePage(params: GetFavoritePageRequest): Promise<PageResultFavorite | null> {
  try {
    const response = await axios.get<BaseResponsePageResultFavorite>('/favorite/page', {
      params: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return response.data.data;
      } else {
        callError(response.data.message || '获取收藏夹失败');
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

/**
 * 添加成果到收藏夹
 * 
 * @param data 添加成果的请求参数
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function addOutcomeToFavorite(data: FavoriteOutcome): Promise<boolean> {
  try {
    const response = await axios.post<BaseResponseVoid>('/favorite/add_outcome', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return true;
      } else {
        callError(response.data.message || '添加到收藏夹失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error) {
    callError('网络错误或服务器异常');
    return false;
  }
}

/**
 * 更新收藏夹（重命名）
 * 
 * @param data 更新收藏夹的请求参数
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function updateFavorite(data: FavoriteUpdateRequest): Promise<boolean> {
  try {
    const response = await axios.post<BaseResponseVoid>('/favorite/update', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return true;
      } else {
        callError(response.data.message || '更新收藏夹失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error) {
    callError('网络错误或服务器异常');
    return false;
  }
}

/**
 * 删除收藏夹
 * 
 * @param favoriteId 收藏夹ID
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function deleteFavorite(favoriteId: number): Promise<boolean> {
  try {
    const response = await axios.post<BaseResponseVoid>('/favorite/delete', null, {
      params: {
        favoriteId: favoriteId
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return true;
      } else {
        callError(response.data.message || '删除收藏夹失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error) {
    callError('网络错误或服务器异常');
    return false;
  }
}

/**
 * 分页获取收藏夹中的成果
 * 
 * @param params 请求参数
 * @returns Promise<PageResultResourceOutcomeSearchVO | null> 成功返回分页结果，失败返回null
 */
export async function getFavoriteOutcomePage(params: GetFavoriteOutcomePageRequest): Promise<PageResultResourceOutcomeSearchVO | null> {
  try {
    const response = await axios.get<BaseResponsePageResultResourceOutcomeSearchVO>('/favorite/page_outcome', {
      params: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return response.data.data;
      } else {
        callError(response.data.message || '获取收藏夹中的成果失败');
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

/**
 * 从收藏夹中移除成果
 * 
 * @param data 移除成果的请求参数
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export async function removeOutcomeFromFavorite(data: FavoriteOutcome): Promise<boolean> {
  try {
    const response = await axios.post<BaseResponseVoid>('/favorite/remove_outcome', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      if (response.data.code === 0) {
        return true;
      } else {
        callError(response.data.message || '从收藏夹中移除成果失败');
        return false;
      }
    } else {
      callError('网络错误');
      return false;
    }
  } catch (error) {
    callError('网络错误或服务器异常');
    return false;
  }
}
