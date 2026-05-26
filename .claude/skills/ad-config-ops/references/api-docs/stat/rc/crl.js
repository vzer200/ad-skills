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
		"/api/ad/v3/stat/rc/crl/": {
			"description": "获取所有证书吊销列表详情",
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
			"get": {
				"tags": [
					"crl"
				],
				"summary": "get all crl",
				"description": "获取所有证书吊销列表详情",
				"operationId": "get_crl_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_crl_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/rc/crl/{name}": {
			"description": "获取指定证书吊销列表详情",
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
			"get": {
				"tags": [
					"crl"
				],
				"summary": "get specific crl",
				"description": "获取指定证书吊销列表详情",
				"operationId": "get_crl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_crl_object"
					}
				}
			}
		}
	},
	"parameters": {
		"CRL-CONFIG": {
			"name": "CRL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/stat.crl"
			}
		}
	},
	"responses": {
		"operation_stat_crl_list": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.crl_list"
			}
		},
		"operation_stat_crl_object": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.crl"
			}
		},
		"operation_stat_crl_summary": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.crl_summary"
			}
		}
	},
	"definitions": {
		"stat.crl_list": {
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
					"type": "array",
					"items": {
						"$ref": "#/definitions/stat.crl"
					}
				}
			}
		},
		"stat.crl": {
			"type": "object",
			"readOnly": true,
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "abc.com_crl",
					"description": "CRL名称"
				},
				"description": {
					"type": "string",
					"description": "CRL描述信息"
				},
				"update": {
					"type": "object",
					"description": "CRL更新状态",
					"properties": {
						"last_time": {
							"type": "integer",
							"description": "CRL上一次更新时间"
						},
						"result": {
							"type": "string",
							"description": "CRL更新结果",
							"enum": [
								"NONE",
								"SUCCESS",
								"FAILED",
								"DOWNLOADING"
							]
						},
						"description": {
							"type": "string",
							"description": "CRL更新状态描述信息"
						}
					}
				},
				"crl": {
					"type": "object",
					"description": "CRL信息",
					"properties": {
						"file_size_byte": {
							"type": "integer",
							"description": "CRL文件大小"
						},
						"crl_entry_count": {
							"type": "integer",
							"description": "文件数"
						}
					}
				}
			}
		},
		"stat.crl_summary": {
			"type": "object",
			"description": "CRL概览信息",
			"readOnly": true,
			"properties": {
				"crl_cache_used": {
					"description": "CRL已使用缓存",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"crl_cache_capacity": {
					"description": "CRL缓存容量",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"crl_entry_count": {
					"description": "CRL个数统计",
					"type": "integer"
				}
			}
		}
	}
}