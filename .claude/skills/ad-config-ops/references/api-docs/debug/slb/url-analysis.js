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
		"/api/ad/v3/debug/slb/url-analysis": {
			"description": "虚拟服务URL分析操作",
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
				}
			],
			"post": {
				"tags": [
					"url-analysis"
				],
				"summary": "url-analysis",
				"description": "执行虚拟服务URL分析",
				"operationId": "url_analysis",
				"parameters": [
					{
						"$ref": "#/parameters/URL-ANALYSIS-DEBUG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_url_analysis_list"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			}
		}
	},
	"parameters": {
		"URL-ANALYSIS-DEBUG": {
			"name": "URL-ANALYSIS-DEBUG",
			"in": "body",
			"required": true,
			"description": "JSON Debug",
			"schema": {
				"$ref": "#/definitions/debug.url_analysis_parameter"
			}
		}
	},
	"responses": {
		"operation_debug_url_analysis_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.url_analysis_list"
			}
		}
	},
	"definitions": {
		"debug.url_analysis_parameter": {
			"type": "object",
			"required": [
				"virtual_service",
				"pool",
				"source_address"
			],
			"properties": {
				"virtual_service": {
					"type": "string",
					"example": "vs_http_portal",
					"description": "虚拟服务名"
				},
				"pool": {
					"type": "string",
					"example": "pool_http_portal",
					"description": "节点池"
				},
				"source_address": {
					"type": "string",
					"example": "192.168.1.103",
					"description": "源地址"
				},
				"timeout": {
					"type": "integer",
					"default": 60,
					"example": 60,
					"description": "URL统计时间: 30-600",
					"maximum": 600,
					"minimum": 30
				},
				"count": {
					"type": "integer",
					"default": 50,
					"example": 50,
					"description": "URL统计数量: 1-255",
					"maximum": 255,
					"minimum": 1
				},
				"exclude_urls": {
					"description": "排除的url",
					"type": "array",
					"maxItems": 10,
					"items": {
						"type": "string",
						"example": "index.html",
						"description": "url地址, 长度限制为1~255个字节"
					}
				}
			}
		},
		"debug.url_analysis_list": {
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
					"description": "url分析列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.url_analysis"
					}
				}
			}
		},
		"debug.url_analysis": {
			"type": "object",
			"properties": {
				"id": {
					"type": "integer",
					"example": 1,
					"description": "url分析项id"
				},
				"url": {
					"type": "string",
					"example": "/mail/index.html",
					"description": "分析url"
				},
				"access_times": {
					"type": "integer",
					"example": "108",
					"description": "访问次数"
				},
				"timeout_times": {
					"type": "integer",
					"example": 8912001,
					"description": "超时次数"
				},
				"response": {
					"type": "string",
					"example": "",
					"description": "响应"
				},
				"detail": {
					"type": "string",
					"description": "详细信息"
				}
			}
		}
	}
}