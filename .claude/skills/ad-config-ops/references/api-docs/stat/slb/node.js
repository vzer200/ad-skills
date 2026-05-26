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
		"/api/ad/v3/stat/slb/pool/{pool_name}/nodes/": {
			"description": "获取指定节点池的节点状态信息",
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
					"$ref": "#/parameters/pool_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"node"
				],
				"summary": "get all node statistics",
				"description": "获取指定节点池的节点状态信息",
				"operationId": "get_statistics_of_node_list",
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
						"$ref": "#/responses/operation_stat_node_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/pool/{pool_name}/nodes/{node_name}": {
			"description": "获取指定节点池内的指定节点状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/pool_name"
				},
				{
					"$ref": "#/parameters/node_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"node"
				],
				"summary": "get specific node statistics",
				"description": "获取指定节点池内的指定节点状态信息",
				"operationId": "get_statistics_of_node",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_node_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/pool/{pool_name}/nodes/{node_name}/{item}": {
			"description": "获取指定节点池内的指定节点状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/pool_name"
				},
				{
					"$ref": "#/parameters/node_name"
				},
				{
					"$ref": "#/parameters/stat.item_node"
				}
			],
			"get": {
				"tags": [
					"node"
				],
				"summary": "get specific pool node statistics",
				"description": "获取指定节点池内的指定节点状态信息",
				"operationId": "get_statistics_of_pool_node_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_node_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.node_detail_list"
			}
		},
		"operation_stat_node_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.node_detail"
			}
		}
	},
	"parameters": {
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "虚拟服务名称",
			"required": true
		},
		"pool_name": {
			"name": "pool_name",
			"in": "path",
			"type": "string",
			"description": "节点池名称",
			"required": true
		},
		"node_name": {
			"name": "node_name",
			"in": "path",
			"type": "string",
			"description": "节点名称",
			"required": true
		},
		"stat.item_node": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "节点状态统计信息（health/节点健康状态,connection/并发连接数,connection-rate/新建连接速率,http_request_rate/HTTP请求速率,upstream_throughput/上行吞吐速率,downstream_throughput/下行吞吐速率,general_throughput/总吞吐速率)",
			"enum": [
				"health",
				"connection",
				"connection-rate",
				"http-request-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		}
	},
	"definitions": {
		"stat.node_detail_list": {
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
						"$ref": "#/definitions/stat.node_detail"
					}
				}
			}
		},
		"stat.node_detail": {
			"type": "object",
			"properties": {
				"name": {
					"description": "配置名称",
					"type": "string",
					"example": ""
				},
				"description": {
					"description": "管理标签及备注描述信息",
					"type": "string"
				},
				"state": {
					"description": "配置启/禁用状态（ENABLE-启用/DISABLE-平滑退出/OFFLINE-禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"OFFLINE"
					],
					"example": "ENABLE"
				},
				"service_host_state": {
					"description": "所属业务主机启/禁用状态（ENABLE-启用/DISABLE-平滑退出/OFFLINE-禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"OFFLINE"
					],
					"example": "ENABLE"
				},
				"health": {
					"description": "健康状态（NORMAL-正常/FAILURE-故障/BUSY-繁忙）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE",
						"BUSY"
					],
					"example": "NORMAL"
				},
				"runtime_flag": {
					"description": "运行时状态标记（DYNAMIC-DISABLE-(动态)禁用状态/PASSIVE-FAILURE-(被动健康检查)故障状态/SLOW-RAMP-温暖上线）",
					"type": "string",
					"enum": [
						"NONE",
						"DYNAMIC-DISABLE",
						"PASSIVE-FAILURE",
						"SLOW-RAMP"
					]
				},
				"failure_reason": {
					"description": "故障原因描述",
					"type": "string",
					"example": ""
				},
				"address": {
					"description": "节点IP地址",
					"type": "string",
					"example": "192.168.1.101"
				},
				"port": {
					"description": "节点端口",
					"type": "integer",
					"example": 25
				},
				"associated_domain": {
					"type": "string",
					"description": "关联域名",
					"readOnly": true,
					"example": "NONE"
				},
				"connection": {
					"description": "并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_established": {
					"description": "Established并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_rate": {
					"description": "新建连接速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"http_request_rate": {
					"description": "HTTP请求速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_throughput": {
					"description": "上行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "上/下行总吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		}
	}
}