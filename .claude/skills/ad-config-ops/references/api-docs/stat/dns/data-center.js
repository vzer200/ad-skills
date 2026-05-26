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
		"/api/ad/v3/stat/dns/data-center/": {
			"description": "查询数据中心统计信息",
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
					"$ref": "/api/{common}.yaml#/parameters/trend"
				}
			],
			"get": {
				"tags": [
					"data-center"
				],
				"summary": "get all data-center statistics",
				"description": "查询数据中心统计信息",
				"operationId": "get_statistics_of_data_center_list",
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
						"$ref": "#/responses/operation_stat_data_center_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/data-center/{name}": {
			"description": "查询指定数据中心的统计信息",
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
					"$ref": "/api/{common}.yaml#/parameters/trend"
				}
			],
			"get": {
				"tags": [
					"data-center"
				],
				"summary": "get specific data-center statistics",
				"description": "查询指定数据中心的统计信息",
				"operationId": "get_statistics_of_data_center",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_data_center_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/data-center/{name}/{item}": {
			"description": "查询指定数据中心的统计信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/stat.item_data_center"
				}
			],
			"get": {
				"tags": [
					"data-center"
				],
				"summary": "get specific data-center statistics",
				"description": "查询指定数据中心的统计信息",
				"operationId": "get_statistics_of_data_center_trend",
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
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_data_center_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.data_center_detail_list"
			}
		},
		"operation_stat_data_center_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.data_center_detail"
			}
		}
	},
	"parameters": {
		"stat.item_data_center": {
			"name": "item",
			"in": "path",
			"type": "string",
			"enum": [
				"connection",
				"connection-rate",
				"general-throughput"
			]
		}
	},
	"definitions": {
		"stat.data_center_detail_list": {
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
						"$ref": "#/definitions/stat.data_center_detail"
					}
				}
			}
		},
		"stat.data_center_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "数据中心的名称",
					"example": "local_dc"
				},
				"site": {
					"type": "string",
					"description": "指定数据中心是本地还是远端",
					"enum": [
						"LOCAL",
						"REMOTE"
					]
				},
				"health": {
					"type": "string",
					"description": "指定数据中心当前健康状态（NORMAL-正常/FAILURE-故障）",
					"enum": [
						"NORMAL",
						"FAILURE"
					],
					"example": "NORMAL"
				},
				"vip_pool": {
					"type": "object",
					"description": "虚拟IP池健康状态",
					"properties": {
						"local": {
							"type": "string",
							"description": "本地虚拟IP池健康状态（NORMAL-正常/UNUSUAL-空闲/UNKNOWN-未知/FAILURE-故障）",
							"enum": [
								"NORMAL",
								"UNUSUAL",
								"FAILURE",
								"UNKNOWN"
							],
							"example": "NORMAL"
						},
						"global": {
							"type": "string",
							"description": "全局虚拟IP池健康状态（NORMAL-正常/UNUSUAL-空闲/UNKNOWN-未知/FAILURE-故障）",
							"enum": [
								"NORMAL",
								"UNUSUAL",
								"FAILURE",
								"UNKNOWN"
							],
							"example": "NORMAL"
						}
					}
				},
				"failure_reason": {
					"type": "string",
					"description": "显示虚拟服务和虚拟IP池相关的告警信息",
					"example": ""
				},
				"alert_events": {
					"type": "array",
					"description": "告警事件",
					"items": {
						"type": "object",
						"description": "告警事件",
						"properties": {
							"type": {
								"type": "string",
								"description": "告警事件类型，如虚拟服务、本地设备",
								"enum": [
									"VIRTUAL-SERVICE",
									"LOCAL-DEVICE"
								]
							},
							"level": {
								"type": "string",
								"description": "事件级别，如正常、告警、错误",
								"enum": [
									"NORMAL",
									"WARN",
									"ERROR"
								]
							},
							"name": {
								"description": "告警事件名称",
								"type": "string",
								"example": "http_8080"
							},
							"message": {
								"description": "告警事件信息",
								"type": "string",
								"example": "All Node Unavailable."
							}
						}
					}
				},
				"local_device": {
					"type": "array",
					"description": "本地设备信息",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"type": "string",
								"description": "本地数据中心名称",
								"example": "dc1_ad2"
							},
							"virtual_services": {
								"type": "array",
								"description": "虚拟服务名称",
								"items": {
									"type": "string"
								},
								"example": [
									"vs_portal_80",
									"vs_oa_8080"
								]
							}
						}
					}
				},
				"query": {
					"description": "数据统计结果",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				}
			}
		}
	}
}