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
		"/api/ad/v3/stat/slb/service-chain": {
			"description": "获取服务链状态信息",
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
					"service-chain"
				],
				"summary": "get all service-chain statistics",
				"description": "查看服务链状态信息",
				"operationId": "get_statistics_of_service_chain_list",
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
						"$ref": "#/responses/operation_stat_service_chain_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/service-chain/{name}": {
			"description": "获取指定服务链状态信息",
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
					"service-chain"
				],
				"summary": "get specific service-chain statistics",
				"description": "查看指定服务链状态信息",
				"operationId": "get_statistics_of_service_chain",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_service_chain_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/service-chain-summary": {
			"description": "获取服务链概览信息",
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
					"service-chain"
				],
				"summary": "get specific service-chain statistics",
				"description": "查看服务链概览信息",
				"operationId": "get_statistics_of_service_chain",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_service_chain_summary"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_service_chain_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.service_chain_detail_list"
			}
		},
		"operation_stat_service_chain_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.service_chain_detail"
			}
		},
		"operation_stat_service_chain_summary": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.service_chain_summary"
			}
		}
	},
	"definitions": {
		"stat.service_chain_detail_list": {
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
						"$ref": "#/definitions/stat.service_chain_detail"
					}
				}
			}
		},
		"stat.service_chain_detail": {
			"type": "object",
			"properties": {
				"name": {
					"description": "配置名称",
					"type": "string",
					"example": "chain_1"
				},
				"description": {
					"description": "管理标签及备注描述信息",
					"type": "string"
				},
				"health": {
					"description": "健康状态（NORMAL-正常/FAILURE-故障/ALERT-告警）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE",
						"ALERT"
					],
					"example": "NORMAL"
				},
				"health_reason": {
					"description": "当前服务链健康状态的原因",
					"type": "string"
				}
			}
		},
		"stat.service_chain_summary": {
			"type": "object",
			"properties": {
				"service_chain_count": {
					"type": "object",
					"description": "服务链统计信息",
					"properties": {
						"total": {
							"type": "integer",
							"description": "服务链个数"
						},
						"health": {
							"type": "object",
							"description": "健康状态（NORMAL-正常/FAILURE-故障/ALERT-告警）",
							"properties": {
								"normal": {
									"type": "integer",
									"description": "健康"
								},
								"failure": {
									"type": "integer",
									"description": "故障"
								},
								"alert": {
									"type": "integer",
									"description": "告警"
								}
							}
						}
					}
				}
			}
		}
	}
}