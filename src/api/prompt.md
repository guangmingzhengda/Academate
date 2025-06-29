

## AI生成文献摘要流式响应


**接口地址**:`/api/research_outcome/summarize-stream`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "literatureId": 0,
  "prompt": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|summarizeRequest|SummarizeRequest|body|true|SummarizeRequest|SummarizeRequest|
|&emsp;&emsp;literatureId|||false|integer(int64)||
|&emsp;&emsp;prompt|||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|SseEmitter|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|timeout||integer(int64)|integer(int64)|


**响应示例**:
```javascript
{
	"timeout": 0
}
```