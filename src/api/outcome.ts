import axios from "axios";
import { callError, callSuccess } from "@/call";

/**
 * 研究成果作者信息接口
 */
export interface ResourceOutcomeAuthorVO {
  /** 作者ID */
  id: number;
  
  /** 账号 */
  account: string;
  
  /** 头像 */
  avatar: string;
  
  /** 邮箱 */
  email: string;
  
  /** 个人简介 */
  profile: string;
  
  /** 机构 */
  institution: string;
  
  /** 研究领域 */
  field: string;
  
  /** 姓名 */
  name: string;
  
  /** 院系 */
  department: string;
  
  /** 职称 */
  jobTitle: string;
}

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
  
  /** arXiv ID */
  arxivId: string;
  
  /** 摘要内容 */
  abstractContent: string;
  
  /** 分类 */
  category: string;
  
  /** PDF链接 */
  pdfUrl: string;
  
  /** 状态 */
  status: string;
  
  /** 创建时间 */
  createTime: string;
  
  /** 更新时间 */
  updateTime: string;
  
  /** 作者列表 */
  authorList?: ResourceOutcomeAuthorVO[];
  
  /** 是否是当前用户的成果 */
  isMine?: boolean;
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
 * 评论数据接口
 */
export interface CommentVO {
  /** 评论ID */
  commentId: number;
  
  /** 评论层级 */
  layer: number;
  
  /** 父评论ID */
  parentComment: number | null;
  
  /** 成果ID */
  outcomeId: number;
  
  /** 用户ID */
  userId: number;
  
  /** 用户账号 */
  userAccount: string;
  
  /** 用户头像 */
  userAvatar: string;
  
  /** 评论内容 */
  comment: string;
  
  /** 评论时间 */
  commentedAt: string;
  
  /** 子评论 */
  children?: CommentVO[];
}

/**
 * 评论请求接口
 */
export interface OutcomeCommentRequest {
  /** 成果ID */
  outcomeId: number;
  
  /** 评论内容 */
  commentText: string;
  
  /** 父评论ID */
  parentCommentId?: number;
}

/**
 * 研究成果元数据上传请求接口
 */
export interface ResearchOutcomeMetaUploadRequest {
  outcomeId?: number; // 修改时需要提供
  type?: string;
  title?: string;
  authors?: string;
  journal?: string;
  volume?: number;
  issue?: number;
  pages?: number;
  publishDate?: string;
  doi?: string;
  patentNumber?: string;
  abstractContent?: string;
  category?: string;
}

/**
 * 点赞响应接口
 */
export interface LikeResponse {
  /** 响应码 */
  code: number;
  
  /** 响应数据 */
  data: any;
  
  /** 响应消息 */
  message: string;
}

/**
 * 是否点赞响应接口
 */
export interface IsLikeResponse {
  /** 响应码 */
  code: number;
  
  /** 是否已点赞 */
  data: boolean;
  
  /** 响应消息 */
  message: string;
}

/**
 * 点赞数量响应接口
 */
export interface LikeCountResponse {
  /** 响应码 */
  code: number;
  
  /** 点赞数量 */
  data: number;
  
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

/**
 * 上传研究成果文件（PDF格式）
 * @param outcomeId 成果ID
 * @param file 文件对象
 * @returns 上传结果
 */
export async function uploadResearchFile(outcomeId: number, file: File): Promise<string | null> {
  try {
    // 检查文件格式
    if (!file.type.includes('pdf')) {
      callError("只支持上传PDF格式文件");
      return null;
    }
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('multipartFile', file);
    
    // 发送请求
    const response = await axios.post(`/research_outcome/upload_file?outcomeId=${outcomeId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess("文件上传成功");
      return response.data.data;
    } else {
      callError("文件上传失败: " + (response.data.message || "未知错误"));
      return null;
    }
  } catch (error) {
    callError("文件上传失败: " + error);
    return null;
  }
}

/**
 * 根据成果ID获取评论列表
 * @param outcomeId 成果ID
 * @returns 评论列表
 */
export async function getOutcomeComments(outcomeId: number): Promise<CommentVO[] | null> {
  try {
    const response = await axios.get('/outcome/comment/list', {
      params: { outcomeId }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      // 处理响应数据，将扁平结构转为树状结构
      const comments: CommentVO[] = response.data.data || [];
      return organizeComments(comments);
    } else {
      callError("获取评论列表失败: " + (response.data.message || "未知错误"));
      return null;
    }
  } catch (error) {
    callError("获取评论列表失败: " + error);
    return null;
  }
}

/**
 * 发送评论
 * @param request 评论请求
 * @returns 评论ID
 */
export async function sendOutcomeComment(request: OutcomeCommentRequest): Promise<number | null> {
  console.log('=== API 层发送评论 ===');
  
  // 创建新的请求对象，避免修改原始对象
  const apiRequest: any = {
    outcomeId: request.outcomeId,
    commentText: request.commentText
  };
  
  // 只有当明确指定了父评论ID时才添加该字段
  if (request.parentCommentId) {
    apiRequest.parentCommentId = request.parentCommentId;
  }
  
  // 判断是一级评论还是二级评论
  const commentType = request.parentCommentId ? '二级评论(回复)' : '一级评论';
  console.log('评论类型:', commentType);
  console.log('最终请求数据:', apiRequest);
  
  try {
    console.log('准备发送请求到:', '/outcome/comment/send');
    const response = await axios.post('/outcome/comment/send', apiRequest);
    console.log('API响应结果:', response);
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess(`${commentType}发送成功`);
      return response.data.data;
    } else {
      console.error('API返回错误:', response.data);
      callError(`发送${commentType}失败: ` + (response.data.message || "未知错误"));
      return null;
    }
  } catch (error: any) {
    console.error("API异常:", error);
    if (error.response) {
      console.error('响应数据:', error.response.data);
      console.error('响应状态:', error.response.status);
    }
    callError(`发送${commentType}失败: ` + error);
    return null;
  }
}

/**
 * 将扁平评论列表组织为树状结构
 * @param comments 扁平评论列表
 * @returns 树状结构评论列表
 */
function organizeComments(comments: CommentVO[]): CommentVO[] {
  // 先按评论时间排序，确保较早的评论在前面
  const sortedComments = [...comments].sort((a, b) => 
    new Date(a.commentedAt).getTime() - new Date(b.commentedAt).getTime()
  );
  
  // 找出所有一级评论
  const rootComments = sortedComments.filter(comment => !comment.parentComment);
  
  // 为每个一级评论添加子评论
  rootComments.forEach(rootComment => {
    const children = sortedComments.filter(
      comment => comment.parentComment === rootComment.commentId
    );
    if (children.length > 0) {
      rootComment.children = children;
    }
  });
  
  return rootComments;
}

/**
 * 修改研究成果元数据
 * @param data 研究成果元数据
 * @returns 修改结果
 */
export async function updateResearchOutcomeMeta(data: ResearchOutcomeMetaUploadRequest): Promise<boolean> {
  try {
    if (!data.outcomeId) {
      callError("缺少成果ID");
      return false;
    }
    
    console.log('更新成果信息，发送数据:', data);
    const response = await axios.post('/research_outcome/update_meta', data);
    console.log('更新成果信息响应:', response);
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess("成果信息更新成功");
      return true;
    } else {
      callError("更新研究成果信息失败: " + (response.data.message || "未知错误"));
      return false;
    }
  } catch (error: any) {
    console.error('更新成果信息异常:', error);
    if (error.response) {
      console.error('响应数据:', error.response.data);
      console.error('响应状态:', error.response.status);
    }
    callError("更新研究成果信息失败: " + (error.message || error));
    return false;
  }
}

/**
 * 点赞成果
 * @param uid 用户ID
 * @param outcomeId 成果ID
 * @returns 点赞结果
 */
export async function likeOutcome(uid: number, outcomeId: number): Promise<boolean> {
  try {
    const response = await axios.post<LikeResponse>('/outcome_like/like', null, {
      params: { uid, outcomeId }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess("点赞成功");
      return true;
    } else {
      callError("点赞失败: " + (response.data.message || "未知错误"));
      return false;
    }
  } catch (error) {
    callError("点赞失败: " + error);
    return false;
  }
}

/**
 * 取消点赞成果
 * @param uid 用户ID
 * @param outcomeId 成果ID
 * @returns 取消点赞结果
 */
export async function cancelLikeOutcome(uid: number, outcomeId: number): Promise<boolean> {
  try {
    const response = await axios.post<LikeResponse>('/outcome_like/cancel_like', null, {
      params: { uid, outcomeId }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      callSuccess("取消点赞成功");
      return true;
    } else {
      callError("取消点赞失败: " + (response.data.message || "未知错误"));
      return false;
    }
  } catch (error) {
    callError("取消点赞失败: " + error);
    return false;
  }
}

/**
 * 检查用户是否已点赞该成果
 * @param uid 用户ID
 * @param outcomeId 成果ID
 * @returns 是否已点赞
 */
export async function isOutcomeLiked(uid: number, outcomeId: number): Promise<boolean> {
  try {
    const response = await axios.get<IsLikeResponse>('/outcome_like/is_like', {
      params: { uid, outcomeId }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      return response.data.data;
    } else {
      console.error("检查点赞状态失败: " + (response.data.message || "未知错误"));
      return false;
    }
  } catch (error) {
    console.error("检查点赞状态失败: " + error);
    return false;
  }
}

/**
 * 获取成果点赞数量
 * @param outcomeId 成果ID
 * @returns 点赞数量
 */
export async function getOutcomeLikeCount(outcomeId: number): Promise<number> {
  try {
    const response = await axios.get<LikeCountResponse>('/outcome_like/like_num', {
      params: {
        outcomeId: outcomeId
      }
    });
    
    if (response.status === 200 && response.data.code === 0) {
      console.log(`成果${outcomeId}的点赞数量:`, response.data.data);
      return response.data.data || 0;
    } else {
      console.error("获取点赞数量失败: " + (response.data.message || "未知错误"));
      return 0;
    }
  } catch (error) {
    console.error("获取点赞数量失败: " + error);
    return 0;
  }
}
