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
		"/api/ad/v3/stat/slb/security-node": {
			"description": "获取指定安全设备状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/security_pool_name"
				}
			],
			"get": {
				"tags": [
					"security-node"
				],
				"summary": "get all security-node statistics",
				"description": "查看指定安全资源池的安全设备状态信息",
				"operationId": "get_statistics_of_security_node_list",
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
						"$ref": "#/responses/operation_stat_security_node_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-node/{security_node_name}": {
			"description": "获取指定安全资源池内的指定安全设备状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/security_node_name"
				}
			],
			"get": {
				"tags": [
					"security-node"
				],
				"summary": "get specific security-node statistics",
				"description": "查看指定安全资源池内的指定安全设备状态信息",
				"operationId": "get_statistics_of_security_node",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_security_node_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-node/{security_node_name}/{item}": {
			"description": "获取指定安全资源池内的指定安全设备的条目状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/security_node_name"
				},
				{
					"$ref": "#/parameters/stat.item_security_node"
				}
			],
			"get": {
				"tags": [
					"security-node"
				],
				"summary": "get specific security-pool security_node statistics",
				"description": "查看指定安全资源池内的指定安全设备的条目状态信息",
				"operationId": "get_statistics_of_security_pool_security_node_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_security_node_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.security_node_detail_list"
			}
		},
		"operation_stat_security_node_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.security_node_detail"
			}
		}
	},
	"parameters": {
		"security_pool_name": {
			"name": "security_pool_name",
			"in": "query",
			"type": "string",
			"description": "安全资源池名称",
			"required": false
		},
		"security_node_name": {
			"name": "security_node_name",
			"in": "path",
			"type": "string",
			"description": "安全设备名称",
			"required": true
		},
		"stat.item_security_node": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "安全设备状态统计信息（health/安全设备健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream_throughput/上行吞吐速率,downstream_throughput/下行吞吐速率,general_throughput/总吞吐速率)",
			"required": true,
			"enum": [
				"health",
				"connection",
				"connection-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		}
	},
	"definitions": {
		"stat.security_node_detail_list": {
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
						"$ref": "#/definitions/stat.security_node_detail"
					}
				}
			}
		},
		"stat.security_node_detail": {
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
					"description": "配置启/禁用状态（ENABLE-启用/DISABLE-禁用/OFFLINE-平滑退出）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"OFFLINE"
					],
					"example": "ENABLE"
				},
				"health": {
					"description": "健康状态（NORMAL-正常/FAILURE-故障）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE"
					],
					"example": "NORMAL"
				},
				"monitor_err": {
					"description": "安全设备配置的健康检查监视器的相关状态信息",
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"description": "监视器名称",
								"type": "string",
								"example": "ping"
							},
							"state": {
								"description": "监视器的监视状态",
								"type": "string",
								"enum": [
									"NORMAL",
									"FAILURE"
								],
								"example": "NORMAL"
							},
							"rs_mon_fault_type": {
								"description": "监视器当前监视状态的原因类型（NONE_FAULT-正常/NETWORK_UNAVAILABLE-网络不可达/等等）",
								"type": "string",
								"enum": [
									"NONE_FAULT",
									"NETWORK_UNAVAILABLE",
									"PORT_UNAVAILABLE",
									"<...>"
								],
								"example": "NETWORK_UNAVAILABLE"
							}
						}
					}
				},
				"address": {
					"description": "安全设备IP地址",
					"type": "string",
					"example": "192.168.1.101"
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