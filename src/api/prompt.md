

## 热门推荐


**接口地址**:`/api/recommendation/popular`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|pageSize||query|true|integer(int64)||
|pageNum||query|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponsePageResultResourceOutcomeSearchVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||PageResultResourceOutcomeSearchVO|PageResultResourceOutcomeSearchVO|
|&emsp;&emsp;pageNum||integer(int64)||
|&emsp;&emsp;pageSize||integer(int64)||
|&emsp;&emsp;total||integer(int64)||
|&emsp;&emsp;list||array|ResourceOutcomeSearchVO|
|&emsp;&emsp;&emsp;&emsp;outcomeId||integer||
|&emsp;&emsp;&emsp;&emsp;type||string||
|&emsp;&emsp;&emsp;&emsp;title||string||
|&emsp;&emsp;&emsp;&emsp;authors||string||
|&emsp;&emsp;&emsp;&emsp;journal||string||
|&emsp;&emsp;&emsp;&emsp;publishDate||string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"pageNum": 0,
		"pageSize": 0,
		"total": 0,
		"list": [
			{
				"outcomeId": 0,
				"type": "",
				"title": "",
				"authors": "",
				"journal": "",
				"publishDate": ""
			}
		]
	},
	"message": ""
}
```