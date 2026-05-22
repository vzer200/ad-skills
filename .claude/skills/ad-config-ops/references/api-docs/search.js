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
		"/api/ad/v3/search": {
			"description": "创建一个异步查询工作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
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
					"search"
				],
				"summary": "create a search job",
				"description": "创建一个异步查询工作",
				"operationId": "create_search_job",
				"parameters": [
					{
						"$ref": "#/parameters/SEARCH-ORDER"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_search_result"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			}
		}
	},
	"parameters": {
		"SEARCH-ORDER": {
			"name": "SEARCH-ORDER",
			"in": "body",
			"required": true,
			"description": "Search task",
			"schema": {
				"$ref": "#/definitions/config.search_order"
			}
		}
	},
	"responses": {
		"operation_config_search_result": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.search_result"
			}
		}
	},
	"definitions": {
		"config.search_order": {
			"type": "object",
			"required": [
				"keyword",
				"resources",
				"mode",
				"case_sensitive"
			],
			"properties": {
				"resource": {
					"type": "string",
					"description": "要查询的已存在的配置路由"
				},
				"mode": {
					"type": "string",
					"description": "查询的模式",
					"enum": [
						"EQUAL",
						"CONTAIN",
						"WILDCARD",
						"REGULAR",
						"RULE"
					],
					"default": "RULE",
					"example": "RULE"
				},
				"case_sensitive": {
					"type": "string",
					"description": "是否区分大小写",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"keyword": {
					"type": "string",
					"description": "查询的关键字",
					"example": "192.168.100.104"
				}
			}
		},
		"config.search_result": {
			"type": "object",
			"required": [
				"keyword"
			],
			"properties": {
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"results": {
					"type": "array",
					"description": "查询结果",
					"items": {
						"type": "object",
						"description": "查询结果列表",
						"properties": {
							"resource": {
								"type": "string",
								"description": "要查询的内容",
								"example": "/net/link/wan/"
							},
							"items": {
								"type": "array",
								"description": "查询返回结果",
								"items": {
									"type": "object",
									"description": "Response Match Object\n  <perime_key>:\n    type: string\n    example: \"WAN_1\"\n  <matched_properity_1>:\n    type: integer\n    example: 1\n  <matched_properity_2>:\n    type: array\n    items:\n      type: string\n      example: \"ping_monitor_1\"\n  <...>:\n    type: string\n"
								}
							}
						}
					}
				}
			}
		}
	}
}