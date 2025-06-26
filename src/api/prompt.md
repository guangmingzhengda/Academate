

## 成果元数据更新


**接口地址**:`/api/research_outcome/update_meta`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "outcomeId": 0,
  "type": "",
  "title": "",
  "authors": "",
  "journal": "",
  "volume": 0,
  "issue": 0,
  "pages": 0,
  "publishDate": "",
  "doi": "",
  "patentNumber": "",
  "abstractContent": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|researchOutcomeMetaUpdateRequest|ResearchOutcomeMetaUpdateRequest|body|true|ResearchOutcomeMetaUpdateRequest|ResearchOutcomeMetaUpdateRequest|
|&emsp;&emsp;outcomeId|||false|integer(int64)||
|&emsp;&emsp;type|||false|string||
|&emsp;&emsp;title|||false|string||
|&emsp;&emsp;authors|||false|string||
|&emsp;&emsp;journal|||false|string||
|&emsp;&emsp;volume|||false|integer(int32)||
|&emsp;&emsp;issue|||false|integer(int32)||
|&emsp;&emsp;pages|||false|integer(int64)||
|&emsp;&emsp;publishDate|||false|string(date-time)||
|&emsp;&emsp;doi|||false|string||
|&emsp;&emsp;patentNumber|||false|string||
|&emsp;&emsp;abstractContent|||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponseLong|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||integer(int64)|integer(int64)|
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"message": ""
}
```