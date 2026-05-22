module.exports ={
	"swagger": "2.0",
	"info": {
		"$ref": "/api/{common}.yaml#/info"
	},
	"host": {
		"$ref": "/api/{common}.yaml#/host"
	},
	"basePath": {
		"$ref": "/api/{common}.yaml#/basePath"
	},
	"schemes": {
		"$ref": "/api/{common}.yaml#/schemes"
	},
	"consumes": {
		"$ref": "/api/{common}.yaml#/consumes"
	},
	"produces": {
		"$ref": "/api/{common}.yaml#/produces"
	},
	"securityDefinitions": {
		"basic_auth": {
			"$ref": "/api/{common}.yaml#/securityDefinitions/basic_auth"
		},
		"token_auth": {
			"$ref": "/api/{common}.yaml#/securityDefinitions/token_auth"
		}
	},
	"paths": {
		"/api/ad/v3/debug/slb/virtual-service/{name}/http-cache/defect-analysis": {
			"description": "HTTP缓存缺失分析结果操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"http-cache"
				],
				"summary": "get http-cache defect-analysis result",
				"description": "获取虚拟服务HTTP缓存缺失分析结果",
				"operationId": "get_http_cache_defect_analysis_result",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_http_cache_defect_analysis_list"
					}
				}
			},
			"post": {
				"tags": [
					"http-cache"
				],
				"summary": "start http-cache defect-analysis",
				"description": "启动虚拟服务HTTP缓存缺失分析任务",
				"operationId": "start_http_cache_defect_analysis",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-CACHE-ANALYSIS-DEBUG"
					}
				]
			},
			"delete": {
				"tags": [
					"http-cache"
				],
				"summary": "stop http-cache defect-analysis",
				"description": "停止虚拟服务HTTP缓存缺失分析任务",
				"operationId": "stop_http_cache_defect_analysis"
			},
			"__sfcli_example__": [
				{
					"command": "list debug slb virtual-service vs1 http-cache defect-analysis",
					"description": "获取虚拟服务名称vs1的为HTTP缓存分析结果"
				},
				{
					"command": "create debug slb virtual-service vs1 http-cache defect-analysis",
					"description": "启动虚拟服务vs1的HTTP缓存分析任务"
				},
				{
					"command": "delete debug slb virtual-service vs1 http-cache defect-analysis",
					"description": "停止虚拟服务vs1的HTTP缓存分析任务"
				}
			]
		}
	},
	"parameters": {
		"HTTP-CACHE-ANALYSIS-DEBUG": {
			"name": "HTTP-CACHE-ANALYSIS-DEBUG",
			"in": "body",
			"required": true,
			"description": "JSON Debug",
			"schema": {
				"$ref": "#/definitions/debug.http_cache_defect_analysis_parameter"
			}
		}
	},
	"responses": {
		"operation_debug_http_cache_defect_analysis_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.http_cache_defect_analysis_list"
			}
		}
	},
	"definitions": {
		"debug.http_cache_defect_analysis_parameter": {
			"type": "object",
			"properties": {
				"source_address": {
					"type": "string",
					"example": "192.168.1.103",
					"description": "源IP，源IP必须为合法的IPv4或IPv6地址,也可以为空"
				},
				"url_pattern": {
					"type": "string",
					"default": "*",
					"example": "*",
					"description": "url匹配，URL匹配最长支持255个字符,不能包含非法字符,支持通配符*",
					"maxLength": 255
				}
			}
		},
		"debug.http_cache_defect_analysis_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "配置数量上限",
					"type": "integer",
					"example": 4000
				},
				"total_pages": {
					"description": "总页数",
					"type": "integer",
					"example": 5
				},
				"page_number": {
					"description": "当前页号",
					"type": "integer",
					"example": 5
				},
				"page_size": {
					"description": "每页列表长度",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "当前项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "当前页项目数",
					"type": "integer",
					"example": 8
				},
				"items": {
					"description": "http缓存缺失分析列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.http_cache_defect_analysis"
					}
				}
			}
		},
		"debug.http_cache_defect_analysis": {
			"type": "object",
			"properties": {
				"id": {
					"type": "integer",
					"example": 1,
					"description": "缓存id"
				},
				"url": {
					"type": "string",
					"example": "/mail/index.html",
					"description": "http虚拟服务缓存的url"
				},
				"failure": {
					"type": "integer",
					"example": "108",
					"description": "缺失次数"
				},
				"detail": {
					"type": "string",
					"description": "缓存缺失原因详情"
				}
			}
		}
	}
}