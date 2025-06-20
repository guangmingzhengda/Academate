import axios from "axios";
import { callSuccess, callError, callInfo, callWarning } from "@/call";
import { List } from "echarts";
interface ResponseData {
  code: number;
  data: List;
}
//获取收藏夹列表
export async function get_favourite_list(userId, pageNum, pageSize): Promise<any> {
  try {
    const response = await axios.get(`/favorites/list?userId=${userId}&pageNum=${pageNum}&pageSize=${pageSize}`);
    if (response.status === 200) {
      //callSuccess('获取收藏夹列表成功');
      return response.data.data.list;
    }
  } catch (error) {
    //console.log('there are some errors in get_favourite_list');
  }
}
//新建收藏夹
export async function new_favourites(data: {
  name: string,
}) {
  try {
    const response = await axios.post('/favorites/create', data);
    if (response.status === 200) {
      //console.log(response.data)
      //callSuccess('新建成功');
    } else {
      //callError('网络错误');
    }
  } catch (error) {
    //console.log('there are some errors in register');
  }
}
//获取收藏夹内容
export async function get_favourite_content(favoritesId, pageNum, pageSize, type): Promise<any> {
  try {
    const response = await axios.get(`/favorites/content?favoritesId=${favoritesId}&pageNum=${pageNum}&pageSize=${pageSize}&type=${type}`);
    if (response.status === 200) {
      //callSuccess('获取收藏夹内容成功');
      return response.data.data;
    } else {
      //callError('网络错误');
    }
  } catch (error) {
    //console.log('there are some errors in get_favourite_content');
  }
}
//删除收藏夹内容
export async function delete_favourite_content(workId) {
  try {
    const response = await axios.get(`/favorites/delete_work?workId=${workId}`);
    if (response.status === 200) {
      callSuccess('删除收藏成功');
    } else {
      callError('网络错误');
    }
  } catch (error) {
    //console.log('there are some errors in delete_favourite_content');
  }
}
//删除收藏夹列表
export async function delete_favourite_list(data: {
  favoritesId: number,
}) {
  try {
    const response = await axios.post('/favorites/delete', data);
    if (response.status === 200) {
      callSuccess('删除收藏夹成功');
    } else {
      //callError('网络错误');
    }
  } catch (error) {
    //console.log('there are some errors in register');
  }
}
//获取个人信息
export async function getUserAuthorId(id: number): Promise<any> {
  try {
    const response = await axios.get(`/user/info?id=${id}`);
    if (response.status === 200) {
      // callSuccess("fetch userAuthorId successfully");
      return response.data.data;
    } else {
      //callError("Failed to fetch userAuthorId:" + response.status);
      return Promise.reject("Failed to fetch userAuthorId:" + response.status);
    }
  } catch (error) {
    //callError("Error fetching userAuthorId:" + error);
    return Promise.reject("Error fetching userAuthorId:" + error);
  }
}
//上传头像
export async function post_avatar(): Promise<any> {
  try {
    const response = await axios.post('/user/uploadAvatar');
    if (response.status === 200) {
      //callSuccess('上传头像成功');
      return response.data.data;
    } else {
      //callError('网络错误');
    }
  } catch (error) {
    //console.log('there are some errors in post_avatar');
  }
}

export function uploadAvatar() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".jpg, .png";
  fileInput.addEventListener("change", handleImage);
  fileInput.click();
}

export async function handleImage(event) {
  const file = event.target.files[0];
  const formData = new FormData();
  const fileUploadData = new FormData();
  formData.append('file', file);
  try {

    // const response = await axios.post('/user/uploadAvatar', formData, {
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    // });
    const response = await axios.post('/user/uploadAvatar', formData);
    console.log(response.data);
    const keyData = {
      "name": 'ok',
      "policy": response.data.data.encodedPolicy,
      "OSSAccessKeyId": response.data.data.accessKeyId,
      "success_action_status": '200',
      "signature": response.data.data.postSignature,
      "key": response.data.data.objectName,
      "Content-Disposition": `attachment; filename=${response.data.data.objectName.replace('avatar/', '')}.png`
    };

    for (let key in keyData) {
      fileUploadData.append(key, keyData[key]);
    }
    fileUploadData.append('file', file);

    const imgAxios = axios.create({ baseURL: '/postFile' });

    // const responseImage = await imgAxios.post(``,
    // fileUploadData, {
    //     'Content-Type': 'application/x-www-form-urlencoded'
    // });
    const responseImage = await imgAxios.post(``, fileUploadData);
    if (responseImage.status === 200) {
      callSuccess('头像上传成功');
      setTimeout(() => {
        location.reload();
      }, 1000);
    }

  } catch (error) {
    //console.error(error);
  }
}

export async function add_favourite(data: {
  favoritesId: number,
  workId: number,
}): Promise<Array<any>> {
  try {
    const response = await axios.post('/favorites/add_work', data);
    console.log(response.status)
    if (response.status === 200) {
      console.log(response.data)
      if (response.data.code == 1) {
        callSuccess('添加成功');
        return response.data.data;
      }
      else {
        callSuccess('添加成功');
        return [];
      }
    } else {
      callError('网络错误');
      return [];
    }
  } catch (error) {
    //console.log('there are some errors in register');
    return [];
  }
}

export async function remove_favourite(data: {
  workId: number,
}): Promise<Array<any>> {
  try {
    const response = await axios.post('/favorites/delete_work', data);
    if (response.status === 200) {
      if (response.data.code == 1) {
        callSuccess('删除成功');
        return response.data.data;
      }
      else {
        callError(response.data.msg);
        return [];
      }
    } else {
      callError('网络错误');
      return [];
    }
  } catch (error) {
    //console.log('there are some errors in register');
    return [];
  }
}