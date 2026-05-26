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
		"/api/ad/v3/slb/tcp-profile/all/": {
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
					"tcp-profile"
				],
				"summary": "get all tcp-profile",
				"description": "",
				"operationId": "get_tcp_profile_list",
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
						"$ref": "#/responses/operation_config_tcp_profile_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list slb tcp-profile all",
					"description": "查看所有TCP策略的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/tcp-profile/all/{name}": {
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
					"tcp-profile"
				],
				"summary": "get specific tcp-profile",
				"description": "",
				"operationId": "get_tcp_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list slb tcp-profile all abc",
					"description": "查看TCP策略abc的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/virtual-service/{virtual_service_name}/tcp-profile": {
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
					"$ref": "#/parameters/virtual_service_name"
				}
			],
			"get": {
				"tags": [
					"tcp-profile"
				],
				"summary": "get specific tcp-profile of virtual service",
				"description": "",
				"operationId": "get_vs_tcp_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_object"
					}
				}
			}
		}
	},
	"parameters": {
		"TCP-PROFILE-ALL-CONFIG": {
			"name": "TCP-PROFILE-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile"
			}
		},
		"TCP-PROFILE-ALL-PROPERTY": {
			"name": "TCP-PROFILE-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "config virtual service name",
			"required": true
		}
	},
	"responses": {
		"operation_config_tcp_profile_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_list"
			}
		},
		"operation_config_tcp_profile_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile"
			}
		}
	},
	"definitions": {
		"config.tcp_profile_list": {
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
						"$ref": "#/definitions/config.tcp_profile"
					}
				}
			}
		},
		"config.tcp_profile": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定TCP策略的名称, 在配置中必须唯一",
					"example": "DEFAULT-L4"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注"
				},
				"default": {
					"type": "string",
					"description": "只读参数；用来说明此配置是否是默认配置，是否可修改",
					"readOnly": true,
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				},
				"type": {
					"type": "string",
					"description": "可选参数；指定TCP策略的服务类型，默认为L7-PROXY",
					"enum": [
						"L3-FORWARD",
						"L4-FORWARD",
						"L7-PROXY"
					],
					"example": "L4-FORWARD"
				},
				"loose_initiation": {
					"type": "string",
					"description": "可选参数；指定是否允许传入未经过三次握手的TCP连接，enable表示启用，disable表示禁用；默认为禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"loose_close": {
					"type": "string",
					"description": "可选参数；指定是否快速关闭未经过三次握手的TCP连接，enable表示启用，disable表示禁用；默认为禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"loose_close_timeout_ms": {
					"type": "integer",
					"description": "可选参数；指定关闭的超时时间，默认为5000ms",
					"default": 5000,
					"example": 5000
				},
				"idle_timeout": {
					"type": "integer",
					"description": "可选参数；指定会话超时时间，默认为600s",
					"default": 600,
					"example": 600
				},
				"timewait_timeout_ms": {
					"type": "integer",
					"description": "可选参数；指定timewait超时时间，默认为10000ms",
					"default": 10000,
					"example": 10000
				},
				"time_stamp": {
					"type": "string",
					"description": "可选参数；指定时间戳状态，enable表示启用，disable表示禁用，strip表示抹除，rewrite表示改写，preserve表示保持不变，默认为保持不变",
					"enum": [
						"ENABLE",
						"DISABLE",
						"STRIP",
						"REWRITE",
						"PRESERVE"
					],
					"default": "PRESERVE",
					"example": "PRESERVE"
				},
				"seq_adjust": {
					"type": "string",
					"description": "可选参数；指定是否调整序列号，enable表示启用，disable表示禁用，默认为禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"syn_timeout": {
					"type": "integer",
					"description": "可选参数；指定syn超时时间，默认为75",
					"default": 75,
					"example": 75
				},
				"maximum_segment_size": {
					"type": "integer",
					"description": "可选参数；指定MSS大小，默认为1460",
					"default": 1460,
					"example": 1460
				},
				"idle_timeout_reset_connection": {
					"type": "string",
					"description": "可选参数；指定是否会话超时重置连接，enable表示启用，disable表示禁用，默认为禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"close_node_connection_with_rst": {
					"type": "string",
					"description": "可选参数；指定是否强制关闭服务端连接，enable表示启用，disable表示禁用，默认为启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"close_client_connection_with_rst": {
					"type": "string",
					"description": "可选参数；指定是否强制关闭客户端连接，enable表示启用，disable表示禁用，默认为启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"node_fault_close_connection": {
					"type": "string",
					"description": "可选参数；指定是否节点失效关闭连接，enable表示启用，disable表示禁用，默认为禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"timewait_recycle": {
					"type": "string",
					"description": "可选参数；指定是否timewait资源快速回收，enable表示启用，disable表示禁用，默认为启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"delay_ack": {
					"type": "string",
					"description": "可选参数；指定是否延迟ack，enable表示启用，disable表示禁用，默认为启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"sack_support": {
					"type": "string",
					"description": "可选参数；指定是否支持sack，enable表示启用，disable表示禁用，默认为启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"dsack_support": {
					"type": "string",
					"description": "可选参数；指定是否支持dsack，enable表示启用，disable表示禁用，默认为禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"maximum_syn_retransmission_times": {
					"type": "integer",
					"description": "可选参数；指定最大SYN重传次数，默认为15",
					"default": 15,
					"example": 15
				},
				"maximum_seg_retransmission_times": {
					"type": "integer",
					"description": "可选参数；指定分段最大重传次数，默认为15",
					"default": 15,
					"example": 15
				},
				"maximum_fin_retransmission_times": {
					"type": "integer",
					"description": "可选参数；指定Closing状态下重传次数，默认为15",
					"default": 15,
					"example": 15
				},
				"receive_window_scale": {
					"type": "integer",
					"description": "可选参数；指定窗口扩大因子，默认为2",
					"default": 2,
					"example": 2
				},
				"initial_receive_window_size": {
					"type": "integer",
					"description": "可选参数；指定初始接收窗口大小，默认为65535",
					"default": 65535,
					"example": 65535
				},
				"tcp_options": {
					"type": "array",
					"items": {
						"type": "object",
						"required": [
							"kind",
							"policy"
						],
						"properties": {
							"kind": {
								"type": "integer",
								"description": "必选参数；指定类型",
								"example": 2
							},
							"policy": {
								"type": "string",
								"description": "必选参数；指定策略，first_packet表示第一个包，each_packet表示每一个包",
								"enum": [
									"FIRST-PACKET",
									"EACH-PACKET"
								],
								"example": "FIRST-PACKET"
							}
						}
					}
				},
				"fast_tcp": {
					"type": "string",
					"description": "可选参数；指定是否tcp单边加速，enable表示启用，disable表示禁用，默认为禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"connection_pool": {
					"type": "object",
					"description": "可选参数；TCP连接池",
					"required": [
						"state"
					],
					"properties": {
						"state": {
							"type": "string",
							"description": "必选参数；指定是否启用TCP连接池，enable表示启用，disable表示禁用，默认为禁用",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"size": {
							"type": "integer",
							"description": "可选参数；指定连接池大小，默认为1024",
							"default": 1024,
							"example": 1024
						},
						"age": {
							"type": "integer",
							"description": "可选参数；指定超时时间，默认为60",
							"default": 60,
							"example": 60
						},
						"source_address_prefix": {
							"type": "integer",
							"description": "可选参数；指定源IPv4掩码，默认为0",
							"default": 0,
							"example": 24
						},
						"ipv6_source_address_prefix": {
							"type": "integer",
							"description": "可选参数；指定源IPv6掩码，默认为0",
							"default": 0,
							"example": 64
						}
					}
				},
				"service_unavailable_refuse_connection": {
					"type": "string",
					"description": "可选参数；指定虚拟服务离线策略，none表示无，reset表示重连，drop表示丢掉，默认为无",
					"enum": [
						"NONE",
						"RESET",
						"DROP"
					],
					"default": "NONE",
					"example": "NONE"
				}
			}
		}
	}
}