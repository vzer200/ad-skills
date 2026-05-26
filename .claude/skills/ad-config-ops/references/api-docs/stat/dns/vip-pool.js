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
		"/api/ad/v3/stat/dns/vip-pool/": {
			"description": "查询虚拟IP池的统计信息",
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
					"vip-pool"
				],
				"summary": "get all vip-pool statistics",
				"description": "查询虚拟IP池的统计信息",
				"operationId": "get_statistics_of_dns_vip_pool_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_vip_pool_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns vip-pool",
					"description": "查询虚拟IP池的统计信息"
				}
			]
		},
		"/api/ad/v3/stat/dns/vip-pool/local": {
			"description": "查询本地虚拟IP池的统计信息",
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
					"vip-pool"
				],
				"summary": "get local vip-pool statistics",
				"description": "查询本地虚拟IP池的统计信息",
				"operationId": "get_statistics_of_local_dns_vip_pool_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_vip_pool_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns vip-pool local",
					"description": "查询本地虚拟IP池的统计信息"
				}
			]
		},
		"/api/ad/v3/stat/dns/vip-pool/global": {
			"description": "查询全局虚拟IP池的统计信息",
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
					"vip-pool"
				],
				"summary": "get global vip-pool statistics",
				"description": "查询全局虚拟IP池的统计信息",
				"operationId": "get_statistics_of_global_dns_vip_pool_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_vip_pool_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns vip-pool global",
					"description": "查询全局虚拟IP池的统计信息"
				}
			]
		},
		"/api/ad/v3/stat/dns/vip-pool/single/{dns_config_area}/{name}": {
			"description": "查询虚拟IP池的状态信息",
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
					"vip-pool"
				],
				"summary": "get vip-pool state",
				"description": "查询虚拟IP池的状态信息",
				"operationId": "get_state_of_dns_vip_pool_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_vip_pool_single"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns vip-pool single local hhh",
					"description": "查询虚拟IP池的状态信息,虚拟IP池的名称为：hhh"
				}
			]
		},
		"/api/ad/v3/stat/dns/vip-pool/{dns_config_area}/{name}": {
			"description": "查询指定虚拟IP池的统计信息",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"vip-pool"
				],
				"summary": "get specific vip-pool statistics",
				"description": "查询指定虚拟IP池的统计信息",
				"operationId": "get_statistics_of_dns_vip_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_vip_pool"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns vip-pool local hhh",
					"description": "查询指定虚拟IP池的统计信息，虚拟IP池的名称为：hhh"
				}
			]
		},
		"/api/ad/v3/stat/dns/vip-pool/{dns_config_area}/{name}/vips/": {
			"description": "查询指定虚拟IP池的指定vip的统计信息",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"vip-pool"
				],
				"summary": "get specific vip-pool statistics",
				"description": "查询指定虚拟IP池的指定vip的统计信息",
				"operationId": "get_statistics_of_dns_vip_pool",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_vip_pool_vip_detail_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns vip-pool local hhh vips",
					"description": "查询指定虚拟IP池的指定vip的统计信息，虚拟IP池的名称为：hhh"
				}
			]
		}
	},
	"parameters": {
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "DNS配置作用域",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_stat_dns_vip_pool_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_vip_pool_list"
			}
		},
		"operation_stat_dns_vip_pool_single": {
			"description": "Display state with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_vip_pool_single"
			}
		},
		"operation_stat_dns_vip_pool": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_vip_pool"
			}
		},
		"operation_stat_dns_vip_pool_vip_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_vip_pool_vip_detail_list"
			}
		}
	},
	"definitions": {
		"stat.dns_vip_pool_list": {
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
						"$ref": "#/definitions/stat.dns_vip_pool"
					}
				}
			}
		},
		"stat.dns_vip_pool_single": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"example": "vip_pool_1",
					"description": "虚拟IP池的名称"
				},
				"vip_pool_health": {
					"type": "string",
					"example": "normal",
					"description": "虚拟IP池的状态"
				},
				"area": {
					"type": "string",
					"description": "虚拟IP池类型",
					"enum": [
						"LOCAL",
						"GLOBAL"
					],
					"example": "GLOBAL"
				},
				"items": {
					"type": "array",
					"items": {
						"$ref": "#/definitions/stat.dns_vip_pool_info"
					}
				}
			}
		},
		"stat.dns_vip_pool_info": {
			"type": "object",
			"properties": {
				"ip": {
					"type": "string",
					"example": "1.1.1.1",
					"description": "虚拟IP的IP"
				},
				"offline_reason": {
					"type": "string",
					"example": "ONLINE_STATE_MONITOR_OFF",
					"description": "虚拟IP的离线原因"
				},
				"proto": {
					"type": "integer",
					"description": "虚拟IP的协议",
					"enum": [
						6,
						11
					],
					"example": 6
				},
				"port": {
					"type": "integer",
					"description": "虚拟IP的端口",
					"example": 6
				},
				"health": {
					"type": "string",
					"description": "虚拟IP的健康状态",
					"enum": [
						"normal",
						"failure",
						"busy"
					],
					"example": "normal"
				},
				"name": {
					"type": "string",
					"example": "1.1.1.1_1_TCP",
					"description": "虚拟IP的名称"
				}
			}
		},
		"stat.dns_vip_pool": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"example": "vip_pool_1",
					"description": "虚拟IP池的名称"
				},
				"area": {
					"type": "string",
					"description": "虚拟IP池类型",
					"enum": [
						"LOCAL",
						"GLOBAL"
					],
					"example": "GLOBAL"
				},
				"vip": {
					"type": "object",
					"description": "虚拟IP",
					"properties": {
						"total": {
							"type": "integer",
							"description": "虚拟IP的数量",
							"example": 4
						},
						"health": {
							"type": "object",
							"description": "虚拟IP的健康状态",
							"properties": {
								"normal": {
									"type": "array",
									"items": {
										"type": "string"
									},
									"description": "虚拟IP正常",
									"example": [
										"192.168.1.1:8080",
										"192.168.1.2:8080",
										"192.168.1.3:8080"
									]
								},
								"busy": {
									"type": "array",
									"description": "虚拟IP繁忙",
									"items": {
										"type": "string"
									},
									"example": [
										"192.168.1.1:8080",
										"192.168.1.2:8080",
										"192.168.1.3:8080"
									]
								},
								"failure": {
									"type": "array",
									"description": "虚拟IP故障",
									"items": {
										"type": "string"
									},
									"example": [
										"192.168.1.4:80"
									]
								}
							}
						}
					}
				}
			}
		},
		"stat.dns_vip_pool_vip_detail_list": {
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
						"$ref": "#/definitions/stat.dns_vip_pool_vip_detail"
					}
				}
			}
		},
		"stat.dns_vip_pool_vip_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "虚拟ip名称",
					"example": "192.168.1.1:8080"
				},
				"health": {
					"type": "string",
					"description": "虚拟ip健康状态（NORMAL-正常/BUSY-繁忙/FAILURE-故障）",
					"enum": [
						"NORMAL",
						"BUSY",
						"FAILURE"
					],
					"example": "NORMAL"
				},
				"failure_reason": {
					"type": "string",
					"description": "虚拟ip故障原因",
					"example": ""
				},
				"connection": {
					"description": "连接数实时统计数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_throughput": {
					"description": "上行吞吐量实时统计数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行量吞吐实时统计数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		}
	}
}