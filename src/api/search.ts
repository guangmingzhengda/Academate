import axios from "axios";
import { callSuccess, callError, callInfo, callWarning } from "@/call";
import { List } from "echarts";
interface Condition {
  field: string;
  type: string;
  value: string;
}
export async function searchData(data: {
  pageSize: number,
  pageNum: number,
  type: string,
  conditionList: Condition[],
  orderField: string | null,
}): Promise<Array<any>> {
  try {
    const response = await axios.post('/work/page', data);
    if (response.status === 200) {
      if (response.data.code == 0) {
        callSuccess('查询成功');
        // const res = [{}];
        // res.push(response.data.data.articleList);
        // res.push(response.data.data.patentList);
        // res.push(response.data.data.projectList);
        // res.push(response.data.data.awardList);
        return response.data.data;
      }
      else {
        return [];
      }
    } else {
      callError('网络错误');
      return [];
    }
  } catch (error) {
    return [];
  }
}

export async function searchArticle(data: {
  pageSize: number,
  pageNum: number,
  workTitle: string | null,
  author: string | null,
  workId: string | null,
  doi: string | null,
  language: string | null,
  field: string | null,
  publishedDate: string | null,
  sortOrder: string | null,
  sortField: string | null,
}): Promise<Array<any>> {
  try {
    const response = await axios.post('/work/pageArticleEs', data);
    if (response.status === 200) {
      if (response.data.data == null)
        callInfo('暂无相关内容，换个关键词吧~')
      else
        callSuccess('查询论文成功');
      return response.data.data;
    } else {
      callInfo('暂无数据');
      return [];
    }
  } catch (error) {
    callError('网络错误');
    return [];
  }
}

export async function searchPatent(data: {
  pageSize: number,
  pageNum: number,
  workTitle: string | null,
  author: string | null,
  workId: string | null,
  language: string | null,
  field: string | null,
  applicationDate: string | null,
  publicationDate: string | null,
  applicationType: string | null,
  sortOrder: string | null,
  sortField: string | null,
}): Promise<Array<any>> {
  try {
    const response = await axios.post('/work/pagePatentEs', data);
    if (response.status === 200) {
      if (response.data.data == null)
        callInfo('暂无相关内容，换个关键词吧~')
      else
        callSuccess('查询专利成功');
      return response.data.data;
    } else {
      callInfo('暂无数据');
      return [];
    }
  } catch (error) {
    callError('网络错误');
    return [];
  }
}

export async function searchProject(data: {
  pageSize: number,
  pageNum: number,
  projectName: string | null,
  author: string | null,
  ratificationNumber: string | null,
  workId: string | null,
  language: string | null,
  field: string | null,
  principal: string | null,
  startDate: string | null,
  endDate: string | null,
  institutionName: string | null,
  sortOrder: string | null,
  sortField: string | null,
}): Promise<Array<any>> {
  try {
    const response = await axios.post('/work/pageProjectEs', data);
    if (response.status === 200) {
      if (Array.isArray(response.data.data) && response.data.data.length === 0)
        callInfo('暂无相关内容，换个关键词吧~')
      else
        callSuccess('查询项目成功');
      console.log(response.data.data)
      return response.data.data;
    } else {
      callInfo('暂无数据');
      return [];
    }
  } catch (error) {
    callError('网络错误');
    return [];
  }
}

export async function searchAward(data: {
  pageSize: number,
  pageNum: number,
  name: string | null,
  laureate: string | null,
  awardDate: string | null,
  sortOrder: string | null,
  sortField: string | null,
}): Promise<Array<any>> {
  try {
    const response = await axios.post('/work/pageAwardEs', data);
    if (response.status === 200) {
      if (Array.isArray(response.data.data) && response.data.data.length === 0)
        callInfo('暂无相关内容，换个关键词吧~')
      else
        callSuccess('查询奖项成功');
      return response.data.data;
    } else {
      callInfo('暂无数据');
      return [];
    }
  } catch (error) {
    callError('网络错误');
    return [];
  }
}

export async function aiGenerateQuestionSSE(aiRequest): Promise<any> {
  try {
    const response = await axios.get(`/work/ai_generate?aiRequest=${aiRequest}`);
    if (response.status === 200) {
      callSuccess('ai返回成功');
      return response.data.data;
    }
  } catch (error) {
    callInfo('ai暂无回复，请换一种描述~');
  }
}