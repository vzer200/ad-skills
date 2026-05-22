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
		"/api/ad/v3/sys/network-setting": {
			"description": "查看、修改网络参数配置",
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
					"network-setting"
				],
				"summary": "get network-setting",
				"description": "查看当前已有的网络参数配置信息",
				"operationId": "get_network_setting",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_network_setting_object"
					}
				}
			},
			"put": {
				"tags": [
					"network-setting"
				],
				"summary": "replace network-setting",
				"description": "修改网络参数配置",
				"operationId": "replace_network_setting",
				"parameters": [
					{
						"$ref": "#/parameters/NETWORK-SETTING-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_network_setting_object"
					}
				}
			},
			"patch": {
				"tags": [
					"network-setting"
				],
				"summary": "modify network-setting",
				"description": "修改网络参数配置",
				"operationId": "edit_network_setting",
				"parameters": [
					{
						"$ref": "#/parameters/NETWORK-SETTING-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_network_setting_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys network-setting tcp_protocol { time_stamp enable }",
					"description": "修改当前网络参数配置，启用系统时间戳选项"
				},
				{
					"command": "list sys network-setting",
					"description": "查看当前网络参数配置信息"
				}
			]
		}
	},
	"parameters": {
		"NETWORK-SETTING-CONFIG": {
			"name": "NETWORK-SETTING-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.network_setting"
			}
		},
		"NETWORK-SETTING-PROPERTY": {
			"name": "NETWORK-SETTING-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.network_setting"
			}
		}
	},
	"responses": {
		"operation_config_network_setting_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.network_setting"
			}
		}
	},
	"definitions": {
		"config.network_setting": {
			"type": "object",
			"properties": {
				"route_forwarding": {
					"description": "路由转发设置",
					"type": "object",
					"properties": {
						"wan_inbound_traffic": {
							"description": "WAN口入站路由转发",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"symmetric_routing": {
							"description": "对称路由模式",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"icmp_echo_reply": {
							"description": "允许ping本端",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"icmp_ttl_equals_zero": {
							"description": "允许traceroute/tracert",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"loose_initiation": {
							"description": "允许非SYN建立会话",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "DISABLE"
						}
					},
					"required": []
				},
				"connection_setting": {
					"description": "连接数配置",
					"type": "object",
					"properties": {
						"statistical_method": {
							"description": "连接数统计方式",
							"type": "string",
							"enum": [
								"ESTABLISHED",
								"COMPLETED"
							],
							"default": "COMPLETED",
							"example": "COMPLETED"
						}
					},
					"required": []
				},
				"tcp_protocol": {
					"description": "时间戳设置",
					"type": "object",
					"properties": {
						"time_stamp": {
							"description": "tcp时间戳设置",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"nat_time_stamp": {
							"description": "tcp转发包时间戳设置",
							"type": "string",
							"enum": [
								"STRIP",
								"REWRITE",
								"PRESERVE"
							],
							"default": "PRESERVE",
							"example": "PRESERVE"
						},
						"nat_seq_adjust": {
							"description": "转发包调整序列号",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"nat_seq_local_adjust": {
							"description": "系统序列号调整",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"port_reuse": {
							"description": "4/7层端口复用优化算法开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"time_stamp_seq_adjust": {
							"description": "SNAT时自动调整时间戳/序列号",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						}
					},
					"required": []
				},
				"performance_setting": {
					"description": "性能参数设置",
					"type": "object",
					"properties": {
						"soft_distribution": {
							"description": "软分发开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "DISABLE"
						},
						"cross_numa_bond_opt_enable": {
							"description": "bond优化开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"low_latency": {
							"description": "快速响应模式开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						}
					},
					"required": []
				},
				"dynamic_route": {
					"description": "动态路由设置",
					"type": "object",
					"properties": {
						"default_route_learn_switch": {
							"description": "默认路由学习开关",
							"__format__description__": "合法输入为ENABLE和DISABLE",
							"title": "默认路由学习开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						}
					}
				},
				"alg": {
					"description": "ALG穿透",
					"type": "object",
					"properties": {
						"ftp": {
							"description": "ftp开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"h323": {
							"description": "h323开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"pptp": {
							"description": "pptp开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"sip": {
							"description": "sip开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"tftp": {
							"description": "tftp开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						}
					},
					"required": []
				},
				"snat_port_exhaustion_warn_setting": {
					"description": "snat端口枯竭告警设置",
					"type": "object",
					"properties": {
						"state": {
							"description": "snat源端口枯竭告警开关",
							"__format__description__": "合法输入为ENABLE和DISABLE",
							"title": "snat源端口枯竭告警开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"description": "snat源端口枯竭告警开关",
							"__format__description__": "阈值百分比，最大100%，最小值1%",
							"title": "snat源端口枯竭告警阈值",
							"type": "integer",
							"default": 80,
							"example": 80,
							"maximum": 100,
							"minimum": 1
						},
						"interval": {
							"description": "nat源端口枯竭告警间隔",
							"__format__description__": "告警间隔，最大值600s，最小值1s",
							"title": "nat源端口枯竭告警间隔",
							"type": "integer",
							"default": 30,
							"example": 30,
							"maximum": 600,
							"minimum": 1
						}
					}
				}
			}
		}
	}
}