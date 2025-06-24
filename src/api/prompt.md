

## 拉取所有消息


**接口地址**:`/api/message/pull`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponseArrayListMessageVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|MessageVO|
|&emsp;&emsp;messageId||integer(int64)||
|&emsp;&emsp;senderId||integer(int64)||
|&emsp;&emsp;receiverId||integer(int64)||
|&emsp;&emsp;message||string||
|&emsp;&emsp;sentAt||string(date-time)||
|&emsp;&emsp;projectId||integer(int64)||
|&emsp;&emsp;status||string||
|&emsp;&emsp;isAccepted||string||
|&emsp;&emsp;avatar||string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"messageId": 0,
			"senderId": 0,
			"receiverId": 0,
			"message": "",
			"sentAt": "",
			"projectId": 0,
			"status": "",
			"isAccepted": "",
			"avatar": ""
		}
	],
	"message": ""
}
```