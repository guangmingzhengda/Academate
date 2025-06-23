

## 搜索科研人员


**接口地址**:`/api/user/search`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "userName": "",
  "field": "",
  "researchTitle": "",
  "institution": "",
  "current": 0,
  "pageSize": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userSearchRequest|UserSearchRequest|body|true|UserSearchRequest|UserSearchRequest|
|&emsp;&emsp;userName|||false|string||
|&emsp;&emsp;field|||false|string||
|&emsp;&emsp;researchTitle|||false|string||
|&emsp;&emsp;institution|||false|string||
|&emsp;&emsp;current|||false|integer(int32)||
|&emsp;&emsp;pageSize|||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponsePageResultUserDetailVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||PageResultUserDetailVO|PageResultUserDetailVO|
|&emsp;&emsp;pageNum||integer(int64)||
|&emsp;&emsp;pageSize||integer(int64)||
|&emsp;&emsp;total||integer(int64)||
|&emsp;&emsp;list||array|UserDetailVO|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;account||string||
|&emsp;&emsp;&emsp;&emsp;email||string||
|&emsp;&emsp;&emsp;&emsp;institution||string||
|&emsp;&emsp;&emsp;&emsp;field||string||
|&emsp;&emsp;&emsp;&emsp;profile||string||
|&emsp;&emsp;&emsp;&emsp;avatar||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;researchOutcomes||array|ResearchOutcomeVO|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;outcomeId||integer||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;type||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;title||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;authors||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;journal||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;volume||integer||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;issue||integer||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;pages||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;publishDate||integer||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;doi||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;url||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;patentNumber||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;authorOrder||integer||
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
				"id": 0,
				"account": "",
				"email": "",
				"institution": "",
				"field": "",
				"profile": "",
				"avatar": "",
				"createTime": "",
				"researchOutcomes": [
					{
						"outcomeId": 0,
						"type": "",
						"title": "",
						"authors": "",
						"journal": "",
						"volume": 0,
						"issue": 0,
						"pages": "",
						"publishDate": 0,
						"doi": "",
						"url": "",
						"patentNumber": "",
						"authorOrder": 0
					}
				]
			}
		]
	},
	"message": ""
}
```