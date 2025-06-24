import axios from "axios";
import {callError, callSuccess} from "@/call";

export async function newStarKindAPI(name){
    try{
        let paras = {
            "name": name,
        }
        const response =
            await axios.post(`/favorites/create`,paras);
        if(response.data.code === 0) {
            callSuccess("新建收藏夹成功");
            return true;
        }
        else callError("新建收藏夹时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

export async function getStarKindsAPI(userId,pageNum,pageSize) {
    try{
        const response =
            await axios.get(`/favorites/list?userId=${userId}&pageNum=${pageNum}&pageSize=${pageSize}`);
        if(response.data.code === 0) {
            return response.data.data;
        }
        else callError("查询收藏夹时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

export async function isFavoredAPI(workId) {
    try{
        const response =
            await axios.get(`/favorites/is-favored?workId=${workId}`);
        if(response.data.code === 0) {
            return response.data.data;
        }
        else callError("获取收藏情况时出错："+response.data.message);
    } catch (error) {
        callError(error as string);
    }
}

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

/**
 * 根据成果ID获取研究成果信息
 * @param outcomeId 成果ID
 * @returns 研究成果信息
 */
export async function getResearchOutcomeById(outcomeId: number) {
    try {
        const response = await axios.get(`/research_outcome/research_by_id`, {
            params: {
                outcome_id: outcomeId
            }
        });
        
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
