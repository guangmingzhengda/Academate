

## 批注


**接口地址**:`/api/note/comment`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "outcomeId": 0,
  "annotation": {}
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|noteRequest|NoteRequest|body|true|NoteRequest|NoteRequest|
|&emsp;&emsp;outcomeId|||false|integer(int64)||
|&emsp;&emsp;annotation|||false|object||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponse|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {},
	"message": ""
}
```




## 获得笔记


**接口地址**:`/api/note/getNote`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|outcomeId||query|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponseNoteVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||NoteVO|NoteVO|
|&emsp;&emsp;id||integer(int32)||
|&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;outcomeId||integer(int64)||
|&emsp;&emsp;annotation||object||
|&emsp;&emsp;createdAt||string(date-time)||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"id": 0,
		"userId": 0,
		"outcomeId": 0,
		"annotation": {},
		"createdAt": ""
	},
	"message": ""
}
```