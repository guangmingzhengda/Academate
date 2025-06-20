import axios from "axios";
import { callSuccess, callError, callInfo, callWarning } from "@/call";

export async function sendAuthCode(code: string): Promise<void> {
  try {
    const response = await axios.get(
      `/author_profile/orcid_claim?code=${code}`
    );
    if (response.status === 200) {
      // callSuccess("send authCode successfully");
      return;
    } else {
      // callError("Failed to send authCode:" + response.status);
      return Promise.reject("Failed to send authCode:" + response.status);
    }
  } catch (error) {
    // callError("Error sending authCode:" + error);
    return Promise.reject("Error sending authCode:" + error);
  }
}

export async function uploadFile(authorId: number) {
  try {
    const response = await axios.get(`/author_profile/claim_access`);
    console.log("uploadFile:" + response.data);
    if (response.status === 200 && response.data.code != 0) {
      callInfo("您无法进行认证，可能是已经提交过认证文件，请耐心等待管理员审核~");
      return;
    }
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    fileInput.addEventListener("change", (event) =>
      handleFile(event, authorId)
    );
    fileInput.click();
  } catch (error) {
    return Promise.reject("Error uploading file:" + error);
  }
}

export async function handleFile(event, authorId: number) {
  const file = event.target.files[0];
  const formData = new FormData();
  const fileUploadData = new FormData();
  formData.append("file", file);
  try {
    const response = await axios.post(
      "/author_profile/upload_material",
      formData
    );
    console.log(response.data);
    const keyData = {
      name: "ok",
      policy: response.data.data.encodedPolicy,
      OSSAccessKeyId: response.data.data.accessKeyId,
      success_action_status: "200",
      signature: response.data.data.postSignature,
      key: response.data.data.objectName,
      "Content-Disposition": `attachment; filename=${response.data.data.objectName.replace(
        "claimMaterial/",
        ""
      )}.pdf`,
    };
    for (let key in keyData) {
      fileUploadData.append(key, keyData[key]);
    }
    fileUploadData.append("file", file);
    //
    const imgAxios = axios.create({ baseURL: "/postFile" });
    const responseFile = await imgAxios.post(``, fileUploadData);
    if (responseFile.status === 200) {
      try {
        const response = await axios.get(
          `/author_profile/claim_request?authorId=${authorId}`
        );
        if (response.status === 200) {
          callSuccess("上传认证文件成功！请耐心等待管理员审核~");
          return;
        } else {
          callInfo("出错啦：上传文件失败或门户已被认证");
          return Promise.reject("Failed to send authCode:" + response.status);
        }
      } catch (error) {
        return Promise.reject("Error sending authCode:" + error);
      }
    }
  } catch (error) {
    //console.error(error);
  }
}
