import axios from "axios";
import {callSuccess, callError, callInfo, callWarning} from "@/call";

export async function register(data : {
    userAccount:string,
    userPassword: string,
    checkPassword:string,
    captcha:string,
    email:string,
}) :Promise<boolean> {
    try {
        // console.log(data);
        const response = await axios.post('/user/register', data);
        if (response.status === 200)
        {
            if (response.data.code == 0) {
                callSuccess('注册成功');
                return true;
            }
            else
            {
                callError(response.data.message);
                return false;
            }
        }
        else {
            // callError('网络错误');
            return false;
        }
    }

    catch (error)
    {
        return false;
    }
}

export async function sendEmail(email : string){
    try {
        const response = await axios.post('/user/sendmail', {
            email: email
        });
        if (response.status === 200)
        {
            if (response.data.code == 0) callSuccess('发送成功');
            else {
                // callError(response.data.message);
            }
        }
        else {
            // callError('网络错误');
        }
    } catch (error) {
    }
}

export async function resetPassword(data: {
    email: string,
    verificationCode: string,
    password: string
}): Promise<boolean> {
    try {
        // 根据API文档构造请求体
        const requestData = {
            email: data.email,
            newPassword: data.password,
            captcha: data.verificationCode
        };
        
        console.log('找回密码请求数据:', requestData);
        
        const response = await axios.post('/user/update_password/verify', requestData);
        console.log('找回密码响应:', response.data);
        
        if (response.status === 200) {
            if (response.data.code == 0) {
                callSuccess('新密码设置成功');
                return true;
            } else {
                callError(response.data.message || '密码修改失败');
                return false;
            }
        } else {
            callError('网络错误');
            return false;
        }
    } catch (error: any) {
        console.error('找回密码错误:', error);
        if (error.response) {
            callError(error.response.data?.message || '密码修改失败');
        } else if (error.request) {
            callError('网络连接错误');
        } else {
            callError('密码修改失败，请重试');
        }
        return false;
    }
}
