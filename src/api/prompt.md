

## 成果搜索


**接口地址**:`/api/research_outcome/search/`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|key||query|false|string||
|notMine||query|true|boolean||
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
|&emsp;&emsp;&emsp;&emsp;publishDate||integer||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"pageNum": 0, // 页码，从 1 开始
		"pageSize": 0, // 一页有多少条目
		"total": 0, // 一共有多少数据，需要根据这个计算一共多少页
		"list": [
			{
				"outcomeId": 11,
				"type": "技术报告",
				"title": "告报术技",
				"authors": "王远铭，尹邦熙",
				"journal": "",
				"publishDate": null
			}
		]
	},
	"message": ""
}
```