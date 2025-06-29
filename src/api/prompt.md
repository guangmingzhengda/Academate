

## 获取用户关系网络


**接口地址**:`/api/knowledge-graph/network`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||query|false|integer(int64)||
|institution||query|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|BaseResponseKnowledgeGraphVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||KnowledgeGraphVO|KnowledgeGraphVO|
|&emsp;&emsp;nodes||array|KnowledgeGraphNode|
|&emsp;&emsp;&emsp;&emsp;id||string||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;institution||string||
|&emsp;&emsp;&emsp;&emsp;influence||integer||
|&emsp;&emsp;&emsp;&emsp;category||integer||
|&emsp;&emsp;&emsp;&emsp;field||string||
|&emsp;&emsp;links||array|KnowledgeGraphLink|
|&emsp;&emsp;&emsp;&emsp;source||string||
|&emsp;&emsp;&emsp;&emsp;target||string||
|message||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"nodes": [
			{
				"id": "",
				"name": "",
				"institution": "",
				"influence": 0,
				"category": 0,
				"field": ""
			}
		],
		"links": [
			{
				"source": "",
				"target": ""
			}
		]
	},
	"message": ""
}
```


数据示例：

```
{
  "nodes": [
    { "id": "1", "name": "张伟", "institution": "清华大学", "influence": 150, "category": 0, "field": "人工智能" },
    { "id": "2", "name": "李娜", "institution": "北京大学", "influence": 120, "category": 0, "field": "生物医学" },
    { "id": "3", "name": "王强", "institution": "清华大学", "influence": 200, "category": 0, "field": "计算机视觉" },
    { "id": "4", "name": "刘洋", "institution": "复旦大学", "influence": 90, "category": 0, "field": "材料科学" },
    { "id": "5", "name": "陈静", "institution": "北京大学", "influence": 180, "category": 0, "field": "神经科学" },
    { "id": "6", "name": "Robert Smith", "institution": "Stanford University", "influence": 250, "category": 0, "field": "人工智能" },
    { "id": "7", "name": "Emily Jones", "institution": "MIT", "influence": 220, "category": 0, "field": "量子计算" },
    { "id": "8", "name": "赵敏", "institution": "复旦大学", "influence": 110, "category": 0, "field": "生物医学" },
    { "id": "9", "name": "周平", "institution": "清华大学", "influence": 130, "category": 0, "field": "人工智能" },
    { "id": "10", "name": "吴磊", "institution": "Stanford University", "influence": 190, "category": 0, "field": "神经科学" },
    { "id": "11", "name": "孙蕾", "institution": "北京大学", "influence": 160, "category": 0, "field": "量子计算" },
    { "id": "12", "name": "林浩", "institution": "MIT", "influence": 140, "category": 0, "field": "人工智能" },
    { "id": "13", "name": "Grace Lee", "institution": "Stanford University", "influence": 210, "category": 0, "field": "材料科学" },
    { "id": "14", "name": "王芳", "institution": "复旦大学", "influence": 100, "category": 0, "field": "神经科学" },
    { "id": "15", "name": "李强", "institution": "清华大学", "influence": 170, "category": 0, "field": "量子计算" },
    { "id": "16", "name": "赵云", "institution": "北京大学", "influence": 155, "category": 0, "field": "人工智能" },
    { "id": "17", "name": "Alex Kim", "institution": "MIT", "influence": 180, "category": 0, "field": "材料科学" },
    { "id": "18", "name": "李明", "institution": "复旦大学", "influence": 125, "category": 0, "field": "计算机视觉" },

    { "id": "清华大学", "name": "清华大学", "influence": 250, "category": 1 },
    { "id": "北京大学", "name": "北京大学", "influence": 215, "category": 1 },
    { "id": "复旦大学", "name": "复旦大学", "influence": 225, "category": 1 },
    { "id": "Stanford University", "name": "Stanford University", "influence": 250, "category": 1 },
    { "id": "MIT", "name": "MIT", "influence": 290, "category": 1 }
  ],
  "links": [
    { "source": "1", "target": "3" },
    { "source": "1", "target": "9" },
    { "source": "1", "target": "15" },
    { "source": "2", "target": "5" },
    { "source": "2", "target": "11" },
    { "source": "2", "target": "16" },
    { "source": "3", "target": "9" },
    { "source": "3", "target": "15" },
    { "source": "4", "target": "8" },
    { "source": "4", "target": "14" },
    { "source": "4", "target": "18" },
    { "source": "5", "target": "11" },
    { "source": "5", "target": "16" },
    { "source": "6", "target": "10" },
    { "source": "6", "target": "13" },
    { "source": "6", "target": "12" },
    { "source": "7", "target": "12" },
    { "source": "7", "target": "17" },
    { "source": "8", "target": "14" },
    { "source": "9", "target": "15" },
    { "source": "10", "target": "13" },
    { "source": "11", "target": "16" },
    { "source": "12", "target": "17" },
    { "source": "13", "target": "17" },
    { "source": "14", "target": "18" },
    { "source": "15", "target": "1" },
    { "source": "17", "target": "7" },
    { "source": "18", "target": "4" },

    { "source": "1", "target": "清华大学" },
    { "source": "3", "target": "清华大学" },
    { "source": "9", "target": "清华大学" },
    { "source": "15", "target": "清华大学" },
    { "source": "2", "target": "北京大学" },
    { "source": "5", "target": "北京大学" },
    { "source": "11", "target": "北京大学" },
    { "source": "16", "target": "北京大学" },
    { "source": "4", "target": "复旦大学" },
    { "source": "8", "target": "复旦大学" },
    { "source": "14", "target": "复旦大学" },
    { "source": "18", "target": "复旦大学" },
    { "source": "6", "target": "Stanford University" },
    { "source": "10", "target": "Stanford University" },
    { "source": "13", "target": "Stanford University" },
    { "source": "7", "target": "MIT" },
    { "source": "12", "target": "MIT" },
    { "source": "17", "target": "MIT" }
  ]
} 
```