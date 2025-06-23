import axios from "axios";
import { callSuccess, callError, callInfo, callWarning } from "@/call";
import { List, number } from "echarts";

// 用户详细信息类型定义
interface UserDetail {
    id: number;
    account: string;
    email: string;
    institution: string;
    field: string;
    profile: string;
    avatar: string;
    createTime: string;
    researchOutcomes: Array<{
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
    }>;
}

/*
获取用户基本信息
返回示例：
{
	"code": 0,
	"data": {
		"id": 0,
		"account": "",
		"email": "",
		"institution": "",
		"field": "",
		"profile": "",
		"avatar": "",
		"createTime": "",
		"researchOutcomes": [
			{
				"outcomeId": 0,
				"type": "",
				"title": "",
				"authors": "",
				"journal": "",
				"volume": 0,
				"issue": 0,
				"pages": "",
				"year": 0,
				"doi": "",
				"url": "",
				"patentNumber": "",
				"authorOrder": 0
			}
		]
	},
	"message": ""
}
*/
export async function get_user_detail(data : {
  userId: number
}) :Promise<UserDetail | null> {
  try {
      // console.log(data);
      const response = await axios.get(`/user/detail/${data.userId}`);
      if (response.status === 200){
          if (response.data.code == 0) {
              return response.data.data; // 返回用户详细信息
          }
          else{
              callError(response.data.message);
              return null;
          }
      }
      else {
          callError('网络错误');
          return null;
      }
  }

  catch (error){
      callError('网络错误或服务器异常');
      return null;
  }
}
