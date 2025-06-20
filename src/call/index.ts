import {ElMessage, ElNotification} from "element-plus";

export function callError(message : string){
    return ElMessage({
        //title: '发生错误',
        message: message,
        // type: 'error',
        type: 'info',
    });
}

export function callSuccess(message : string){
    return ElMessage({
        //title: '操作成功',
        message: message,
        type: 'success',
    });
}

export function callInfo(message : string){
    return ElMessage({
        //title: '提示信息',
        message: message,
        type: 'info',
    });
}

export function callWarning(message : string){
    return ElMessage({
        //title: '警告',
        message: message,
        type: 'warning',
    });
}
