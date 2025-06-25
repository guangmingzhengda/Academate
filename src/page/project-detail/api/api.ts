import axios from "axios";
import {callError, callSuccess} from "@/call";

export async function addWorkAPI(favoriteId,workId) {
    try{
        let paras = {
            "favoritesId": favoriteId,
            "workId": workId
        };
        const response =
            await axios.post(`/favorites/add_work`, paras);
        if(response.data.code === 0) {
            callSuccess("收藏成功");
            return true;
        }
        else callError("添加收藏时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

export async function deleteWorkAPI(workId) {
    try{
        const response =
            await axios.get(`/favorites/delete_work?workId=${workId}`);
        if(response.data.code === 0) {
            callSuccess("取消收藏成功");
            return response.data.data;
        }
        else callError("删除收藏时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

export async function getStarSum(workId) {
    try{
        const response = await axios.get(`/favorites/favorites_count?workId=${workId}`);
        if(response.data.code === 0) {
            return response.data.data;
        }
    }
    catch (error) {
        callError(error as string);
    }
}

export async function commitCommentAPI(content,workId,replyId) {
    try{
        let paras = {
            "content": content,
            "replyId": replyId,
            "workId": workId
        };
        const response =
            await axios.post(`/comment/post?content`, paras);
        if(response.data.code === 0) {
            callSuccess("评论成功");
            return true;
        }
        else callError("发布评论时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

export async function deleteCommentAPI(id) {
    try{
        const response =
            await axios.post(`/comment/delete?id=${id}`);
        if(response.data.code === 0) {
            return 1;
        }
        else callError("删除收藏时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}


export async function getWorkAPI(id, userId) {
    try{
        const response = userId == null ? await axios.get(`/work/detail?id=${id}`)
        :  await axios.get(`/work/detail?id=${id}&userId=${userId}`);
        if(response.status === 200) {
            return response.data.data;
        }
        else callError("获取学术成果详情时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

export async function getAllCommentsAPI(workId, pageSize, pageNum) {
    try{
        let paras = {
            "workId": workId,
            "pageSize": pageSize,
            "pageNum": pageNum
        }
        const response =
            await axios.post(`/comment/page`,paras);
        if(response.data.code === 0) {
            return response.data.data;
        }
        else callError("获取评论时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

export async function getUserInfo(id) {
    try {
        const response = await axios.get(`/user/info?id=${id}`);
        if (response.data.code === 0) {
            return response.data.data;
        } else return null;
    } catch (error) {
        callError(error as string);
    }
}

// 参数接口
export interface InviteParams {
  inviter?: number;
  invitee?: number;
}

// 响应接口
export interface InviteRes {
  code: number;
  data: Record<string, unknown>;
  message: string;
}

/**
 * 邀请研究人员进入项目
 * @param {object} params ProjectInviteRequest
 * @param {number} params.inviter 
 * @param {number} params.invitee 
 * @returns
 */
export function invite(params: InviteParams): Promise<InviteRes> {
  return axios.post(`/project/invite`, params).then(res => res.data);
}

/**
 * 根据id获取项目详情
 * @param id 项目ID
 * @returns 项目详情
 */
export async function getProjectDetail(id: number | string) {
    if (!id) {
        console.error("getProjectDetail: 项目ID不能为空");
        callError("项目ID不能为空");
        return null;
    }
    
    console.log(`正在获取项目详情，ID: ${id}`);
    
    try {
        const response = await axios.get(`/project/detail/${id}`);
        console.log("项目详情API响应:", response);
        
        if (response.status === 200) {
            // 检查响应数据是否符合预期
            if (response.data && typeof response.data === 'object') {
                return response.data;
            } else {
                console.error("API响应格式异常:", response.data);
                callError("API响应格式异常");
                return {
                    code: -1,
                    data: null,
                    message: "API响应格式异常"
                };
            }
        } else {
            console.error("获取项目详情时出错:", response);
            callError("获取项目详情时出错：" + (response.data?.message || "未知错误"));
            return null;
        }
    } catch (error: any) {
        console.error("获取项目详情异常:", error);
        if (error.response) {
            console.error("错误响应:", error.response);
            callError(`获取项目详情失败: ${error.response.status} - ${error.response.data?.message || "未知错误"}`);
        } else if (error.request) {
            console.error("无响应:", error.request);
            callError("服务器未响应，请检查网络连接");
        } else {
            console.error("请求配置错误:", error.message);
            callError(error.message || "获取项目详情失败");
        }
        
        // 返回一个结构化的错误响应，而不是null
        return {
            code: -1,
            data: null,
            message: error.message || "获取项目详情失败"
        };
    }
}

/**
 * 获取项目评论列表
 * @param projectId 项目ID
 * @returns 项目评论列表
 */
export async function getProjectComments(projectId: number) {
    try {
        const response = await axios.get(`/project/comment/list`, {
            params: { projectId }
        });
        
        if (response.status === 200) {
            return response.data;
        } else {
            callError("获取项目评论失败：" + response.data.message);
            return null;
        }
    } catch (error) {
        callError(error as string);
        return null;
    }
}

/**
 * 获取评论点赞数量
 * @param commentId 评论ID
 * @returns 点赞数量
 */
export async function getCommentLikeCount(commentId: number) {
    try {
        const response = await axios.post(`/comment_like/like_count`, null, {
            params: { commentId }
        });
        
        if (response.status === 200 && response.data.code === 0) {
            return response.data.data; // 返回点赞数量
        } else {
            console.error("获取评论点赞数量失败：", response.data.message);
            return 0;
        }
    } catch (error) {
        console.error("获取评论点赞数量出错：", error);
        return 0;
    }
}

/**
 * 点赞评论
 * @param uid 用户ID
 * @param commentId 评论ID
 * @returns 是否点赞成功
 */
export async function likeComment(uid: number, commentId: number) {
    try {
        const response = await axios.post(`/comment_like/like`, null, {
            params: { uid, commentId }
        });
        
        if (response.status === 200 && response.data.code === 0) {
            return true;
        } else {
            callError("点赞失败：" + response.data.message);
            return false;
        }
    } catch (error) {
        callError("点赞失败");
        console.error("点赞评论出错：", error);
        return false;
    }
}

/**
 * 检查用户是否已点赞评论
 * @param uid 用户ID
 * @param commentId 评论ID
 * @returns 是否已点赞
 */
export async function isLikedComment(uid: number, commentId: number) {
    try {
        const response = await axios.post(`/comment_like/is_like`, null, {
            params: { uid, commentId }
        });
        
        if (response.status === 200 && response.data.code === 0) {
            return response.data.data; // 返回布尔值，表示是否已点赞
        } else {
            console.error("检查点赞状态失败：", response.data.message);
            return false;
        }
    } catch (error) {
        console.error("检查点赞状态出错：", error);
        return false;
    }
}

/**
 * 取消点赞评论
 * @param uid 用户ID
 * @param commentId 评论ID
 * @returns 是否取消点赞成功
 */
export async function cancelLikeComment(uid: number, commentId: number) {
    try {
        const response = await axios.post(`/comment_like/cancel_like`, null, {
            params: { uid, commentId }
        });
        
        if (response.status === 200 && response.data.code === 0) {
            return true;
        } else {
            callError("取消点赞失败：" + response.data.message);
            return false;
        }
    } catch (error) {
        callError("取消点赞失败");
        console.error("取消点赞评论出错：", error);
        return false;
    }
}

/**
 * 添加项目评论
 * @param projectId 项目ID
 * @param commentText 评论内容
 * @param parentCommentId 父评论ID（可选，用于二级评论）
 * @returns 新评论的ID
 */
export async function addProjectComment(projectId: number, commentText: string, parentCommentId?: number) {
    try {
        const requestData = {
            projectId,
            commentText,
            parentCommentId
        };
        
        // 如果parentCommentId为undefined或null，则不包含此字段
        if (!parentCommentId) {
            delete requestData.parentCommentId;
        }
        
        const response = await axios.post('/project/comment/add', requestData);
        
        if (response.status === 200 && response.data.code === 0) {
            return response.data.data; // 返回新评论的ID
        } else {
            callError("发表评论失败：" + response.data.message);
            return null;
        }
    } catch (error) {
        console.error("发表评论出错：", error);
        callError("发表评论失败，请稍后再试");
        return null;
    }
}

/**
 * 删除项目评论
 * @param commentId 评论ID
 * @returns 是否删除成功
 */
export async function deleteProjectComment(commentId: number) {
    try {
        const response = await axios.post(`/project/comment/delete`, null, {
            params: { commentId }
        });
        
        if (response.status === 200 && response.data.code === 0) {
            return true;
        } else {
            callError("删除评论失败：" + response.data.message);
            return false;
        }
    } catch (error) {
        console.error("删除评论出错：", error);
        callError("删除评论失败，请稍后再试");
        return false;
    }
}
