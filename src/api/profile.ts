import axios from "axios";
import { callSuccess, callError, callInfo, callWarning } from "@/call";
import { List, number } from "echarts";

export interface Profile {
  id: number;
  orcid: string | null;
  name: string;
  worksCount: number;
  citedByCount: number;
  institution: {
    id: number;
    name: string;
    identification: string;
  } | null;
  subfieldList: string[];
}

export async function getProfileDetail(id: number): Promise<Profile> {
  try {
    const response = await axios.get(`/author/detail?id=${id}`);
    if (response.status === 200) {
      // callSuccess("fetch profile successfully");
      // BUG: 注意返回值的层次结构，不确定的console.log一下看看
      return response.data.data;
    } else {
      // callError("Failed to fetch profile:" + response.status);
      callInfo("当前学者门户不存在，将返回首页");
      setTimeout(() => {
        window.location.href = "/home";
      }, 1500);
      return Promise.reject("Failed to fetch profile:" + response.status);
    }
  } catch (error) {
    // callError("Error fetching profile:" + error);
    callInfo("当前学者门户不存在，将返回首页");
    setTimeout(() => {
      window.location.href = "/home";
    }, 1500);
    return Promise.reject("Error fetching profile:" + error);
  }
}

export async function getUserAuthorId(id: number): Promise<Number> {
  try {
    const response = await axios.get(`/user/info?id=${id}`);
    if (response.status === 200) {
      // callSuccess("fetch userAuthorId successfully");
      return response.data.data.authorId;
    } else {
      // callError("Failed to fetch userAuthorId:" + response.status);
      return Promise.reject("Failed to fetch userAuthorId:" + response.status);
    }
  } catch (error) {
    // callError("Error fetching userAuthorId:" + error);
    return Promise.reject("Error fetching userAuthorId:" + error);
  }
}

export async function getUserAvatar(id: number): Promise<string> {
  try {
    const response = await axios.get(`/user/info?id=${id}`);
    if (response.status === 200) {
      // callSuccess("fetch userAuthorId successfully");
      return response.data.data.avatar;
    } else {
      // callError("Failed to fetch userAuthorId:" + response.status);
      return Promise.reject("Failed to fetch userAuthorId:" + response.status);
    }
  } catch (error) {
    // callError("Error fetching userAuthorId:" + error);
    return Promise.reject("Error fetching userAuthorId:" + error);
  }
}

export async function getAuthorUserId(id: number): Promise<Number> {
  try {
    const response = await axios.get(`/user/author-user-id?authorId=${id}`);
    if (response.status === 200) {
      console.log(response);
      return response.data.data;
    } else {
      return Promise.reject("Failed to fetch userAuthorId:" + response.status);
    }
  } catch (error) {
    return Promise.reject("Error fetching userAuthorId:" + error);
  }
}

export interface Article {
  articleOutlineVO: {
    id: number;
    title: string;
    citedByCount: number;
    publicationDate: string;
    abstractText: string;
    authorNameList: string[];
    type: string[];
    subfield: string;
  };
  hidden: boolean;
}

export interface Patent {
  patentOutlineVO: {
    id: number;
    applicationId: string;
    applicationDate: string;
    category: string[];
    abstractText: string;
    name: string;
    authorNameList: string[];
    subfield: string;
    keywords: string;
  };
  hidden: boolean;
}

export interface Project {
  projectOutlineVO: {
    id: number;
    ratificationNumber: string;
    name: string;
    startDate: string;
    endDate: string;
    institutionName: string;
    authorNameList: string[];
    subfield: string;
    keywords: string;
  };
  hidden: boolean;
}

export interface Award {
  awardOutlineVO: {
    id: number;
    name: string;
    awardDate: string;
    authorNameList: string[];
    subfield: string;
    keywords: string;
  };
  hidden: boolean;
}

export async function getLists(
  authorId: number,
  type: string,
  pageSize: number,
  pageNum: number,
  isCurrentUser: boolean
): Promise<{ list: []; total: number }> {
  try {
    const requestBody = {
      authorId: authorId,
      type: type,
      pageSize: pageSize,
      pageNum: pageNum,
    };
    const response = await axios.post(
      isCurrentUser ? `/author_profile/my-list` : `/author_profile/list`,
      requestBody
    );
    if (response.status === 200) {
      // callSuccess("fetch article successfully");
      // console.log(response.data);
      if (type === "article") {
        return {
          list: response.data.data.authorArticleList,
          total: response.data.data.total,
        };
      } else if (type === "patent") {
        return {
          list: response.data.data.authorPatentList,
          total: response.data.data.total,
        };
      } else if (type === "project") {
        return {
          list: response.data.data.authorProjectList,
          total: response.data.data.total,
        };
      } else {
        return {
          list: response.data.data.authorAwardList,
          total: response.data.data.total,
        };
      }
    } else {
      // callError("Failed to fetch article:" + response.status);
      return Promise.reject("Failed to fetch article:" + response.status);
    }
  } catch (error) {
    // callError("Error fetching article:" + error);
    return Promise.reject("Error fetching article:" + error);
  }
}

export async function hideItem(requestBody: {
  authorId: number;
  workId: number;
}): Promise<void> {
  try {
    const response = await axios.post(`/author_profile/hide`, requestBody);
    if (response.status === 200) {
      // callSuccess("hide item successfully");
      return response.data;
    } else {
      // callError("Failed to hide item:" + response.status);
      return Promise.reject("Failed to hide item:" + response.status);
    }
  } catch (error) {
    // callError("Error hidding item:" + error);
    return Promise.reject("Error hidding item:" + error);
  }
}

export async function showHiddenItem(requestBody: {
  authorId: number;
  workId: number;
}): Promise<void> {
  try {
    const response = await axios.post(`/author_profile/show`, requestBody);
    if (response.status === 200) {
      // callSuccess("show item successfully");
      return response.data;
    } else {
      // callError("Failed to show item:" + response.status);
      return Promise.reject("Failed to show item:" + response.status);
    }
  } catch (error) {
    // callError("Error showing item:" + error);
    return Promise.reject("Error showing item:" + error);
  }
}

// 以下为统计分析界面相关
export interface Pub {
  year: number;
  counts: number;
}

export interface Quo {
  year: string;
  count: number;
}

export async function getPublication(id: number): Promise<Pub[]> {
  try {
    const response = await axios.get(`/author/authorPublish?id=${id}`);
    if (response.status === 200) {
      return response.data.data;
    } else {
      // callError("Failed to get publication:" + response.status);
      return Promise.reject("Failed to get publication:" + response.status);
    }
  } catch (error) {
    // callError("Error geting publication:" + error);
    return Promise.reject("Error geting publication:" + error);
  }
}

export async function getQuoted(id: number): Promise<Quo[]> {
  try {
    const response = await axios.get(`/author/authorCitation?id=${id}`);
    if (response.status === 200) {
      // console.log(response.data);
      return response.data.data;
    } else {
      // callError("Failed to get quoted:" + response.status);
      return Promise.reject("Failed to get quoted:" + response.status);
    }
  } catch (error) {
    // callError("Error geting quoted:" + error);
    return Promise.reject("Error geting quoted:" + error);
  }
}
