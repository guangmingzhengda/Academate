

## 成果版权确认


**接口地址**:`/api/research_outcome/confirm_copyright`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "outcomeId": 0,
  "agreeUrl": true
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|outcomeCopyrightConfirmRequest|OutcomeCopyrightConfirmRequest|body|true|OutcomeCopyrightConfirmRequest|OutcomeCopyrightConfirmRequest|
|&emsp;&emsp;outcomeId|||false|integer(int64)||
|&emsp;&emsp;agreeUrl|||false|boolean||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponseVoid|


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