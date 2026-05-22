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
		"/api/ad/v3/stat/lc/policy-route/": {
			"description": "获取智能路由统计信息",
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
					"policy-route"
				],
				"summary": "get all policy-route statistics",
				"description": "获取智能路由统计信息",
				"operationId": "get_statistics_of_policy_route_list",
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
						"$ref": "#/responses/operation_stat_policy_route_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/lc/policy-route/{name}": {
			"description": "获取指定智能路由统计信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				}
			],
			"get": {
				"tags": [
					"policy-route"
				],
				"summary": "get specific policy-route statistics",
				"description": "获取指定智能路由统计信息",
				"operationId": "get_statistics_of_policy_route",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_policy_route_detail"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_policy_route_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.policy_route_detail_list"
			}
		},
		"operation_stat_policy_route_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.policy_route_detail"
			}
		},
		"operation_stat_policy_route_application_throughput_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.policy_route_application_throughput_list"
			}
		},
		"operation_stat_policy_route_isp_throughput_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.policy_route_isp_throughput_list"
			}
		}
	},
	"definitions": {
		"stat.policy_route_detail_list": {
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
						"$ref": "#/definitions/stat.policy_route_detail"
					}
				}
			}
		},
		"stat.policy_route_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "智能路由名称",
					"example": "policy_route_game_to_china_telecom"
				},
				"link": {
					"type": "object",
					"description": "链路名称",
					"properties": {
						"total": {
							"type": "integer",
							"description": "链路总数"
						},
						"health": {
							"type": "object",
							"description": "链路健康状态（normal-正常/busy-繁忙/failure-故障）",
							"properties": {
								"normal": {
									"type": "array",
									"description": "链路正常",
									"items": {
										"type": "string"
									}
								},
								"busy": {
									"type": "array",
									"description": "链路繁忙",
									"items": {
										"type": "string"
									}
								},
								"failure": {
									"type": "array",
									"description": "链路故障",
									"items": {
										"type": "string"
									}
								}
							}
						}
					}
				},
				"hit": {
					"description": "策略命中统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_data": {
					"description": "上行数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_data": {
					"description": "下行数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_data_rate": {
					"description": "上行速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_data_rate": {
					"description": "下行速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_packet": {
					"description": "上行数据包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_packet": {
					"description": "下行数据包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_packet_rate": {
					"description": "上行数据包速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_packet_rate": {
					"description": "下行数据包速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		}
	}
}