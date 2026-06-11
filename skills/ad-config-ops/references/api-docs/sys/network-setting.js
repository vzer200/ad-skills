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
				},
				"x-examples": {
					"request": {
						"summary": "get network-setting",
						"description": "查看当前已有的网络参数配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/network-setting"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/network-setting 响应",
						"description": "返回GET /api/ad/v3/sys/network-setting的响应数据",
						"value": {
							"route_forwarding": {
								"wan_inbound_traffic": "DISABLE",
								"symmetric_routing": "ENABLE",
								"icmp_echo_reply": "ENABLE",
								"icmp_ttl_equals_zero": "ENABLE",
								"loose_initiation": "ENABLE"
							},
							"connection_setting": {
								"statistical_method": "COMPLETED",
								"throughput_statistic_method": "WAN_LINK_STATISTIC"
							},
							"tcp_protocol": {
								"time_stamp": "DISABLE",
								"nat_time_stamp": "PRESERVE",
								"nat_seq_adjust": "DISABLE",
								"nat_seq_local_adjust": "ENABLE",
								"port_reuse": "ENABLE",
								"time_stamp_seq_adjust": "ENABLE"
							},
							"performance_setting": {
								"soft_distribution": "ENABLE",
								"cross_numa_bond_opt_enable": "DISABLE",
								"low_latency": "DISABLE",
								"bond_dpu_opt_enable": "ENABLE"
							},
							"snat_port_exhaustion_warn_setting": {
								"state": "ENABLE",
								"threshold": 80,
								"interval": 30
							},
							"dynamic_route": {
								"default_route_learn_switch": "DISABLE",
								"dynamic_route_backend_config_switch": "DISABLE",
								"vip_route_delay_distribute_interval": 125,
								"snat_route_delay_distribute_interval": 120
							},
							"alg": {
								"ftp": "ENABLE",
								"h323": "ENABLE",
								"pptp": "ENABLE",
								"sip": "ENABLE",
								"tftp": "ENABLE"
							},
							"interface_setting": {
								"hw_bypass_enable": "DISABLE"
							},
							"connection_optimize": {
								"client_conn_keep_alive": "DISABLE"
							}
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "replace network-setting",
						"description": "修改网络参数配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/network-setting",
							"body": {}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/network-setting 响应",
						"description": "返回PUT /api/ad/v3/sys/network-setting的响应数据",
						"value": {
							"route_forwarding": {
								"wan_inbound_traffic": "DISABLE",
								"symmetric_routing": "ENABLE",
								"icmp_echo_reply": "ENABLE",
								"icmp_ttl_equals_zero": "ENABLE",
								"loose_initiation": "ENABLE"
							},
							"connection_setting": {
								"statistical_method": "COMPLETED",
								"throughput_statistic_method": "WAN_LINK_STATISTIC"
							},
							"tcp_protocol": {
								"time_stamp": "DISABLE",
								"nat_time_stamp": "PRESERVE",
								"nat_seq_adjust": "DISABLE",
								"nat_seq_local_adjust": "ENABLE",
								"port_reuse": "ENABLE",
								"time_stamp_seq_adjust": "ENABLE"
							},
							"performance_setting": {
								"soft_distribution": "ENABLE",
								"cross_numa_bond_opt_enable": "DISABLE",
								"low_latency": "DISABLE",
								"bond_dpu_opt_enable": "ENABLE"
							},
							"snat_port_exhaustion_warn_setting": {
								"state": "ENABLE",
								"threshold": 80,
								"interval": 30
							},
							"dynamic_route": {
								"default_route_learn_switch": "DISABLE",
								"dynamic_route_backend_config_switch": "DISABLE",
								"vip_route_delay_distribute_interval": 125,
								"snat_route_delay_distribute_interval": 120
							},
							"alg": {
								"ftp": "ENABLE",
								"h323": "ENABLE",
								"pptp": "ENABLE",
								"sip": "ENABLE",
								"tftp": "ENABLE"
							},
							"interface_setting": {
								"hw_bypass_enable": "DISABLE"
							},
							"connection_optimize": {
								"client_conn_keep_alive": "DISABLE"
							}
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "modify network-setting",
						"description": "修改网络参数配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/network-setting",
							"body": {}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/network-setting 响应",
						"description": "返回PATCH /api/ad/v3/sys/network-setting的响应数据",
						"value": {
							"route_forwarding": {
								"wan_inbound_traffic": "DISABLE",
								"symmetric_routing": "ENABLE",
								"icmp_echo_reply": "ENABLE",
								"icmp_ttl_equals_zero": "ENABLE",
								"loose_initiation": "ENABLE"
							},
							"connection_setting": {
								"statistical_method": "COMPLETED",
								"throughput_statistic_method": "WAN_LINK_STATISTIC"
							},
							"tcp_protocol": {
								"time_stamp": "DISABLE",
								"nat_time_stamp": "PRESERVE",
								"nat_seq_adjust": "DISABLE",
								"nat_seq_local_adjust": "ENABLE",
								"port_reuse": "ENABLE",
								"time_stamp_seq_adjust": "ENABLE"
							},
							"performance_setting": {
								"soft_distribution": "ENABLE",
								"cross_numa_bond_opt_enable": "DISABLE",
								"low_latency": "DISABLE",
								"bond_dpu_opt_enable": "ENABLE"
							},
							"snat_port_exhaustion_warn_setting": {
								"state": "ENABLE",
								"threshold": 80,
								"interval": 30
							},
							"dynamic_route": {
								"default_route_learn_switch": "DISABLE",
								"dynamic_route_backend_config_switch": "DISABLE",
								"vip_route_delay_distribute_interval": 125,
								"snat_route_delay_distribute_interval": 120
							},
							"alg": {
								"ftp": "ENABLE",
								"h323": "ENABLE",
								"pptp": "ENABLE",
								"sip": "ENABLE",
								"tftp": "ENABLE"
							},
							"interface_setting": {
								"hw_bypass_enable": "DISABLE"
							},
							"connection_optimize": {
								"client_conn_keep_alive": "DISABLE"
							}
						}
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
						},
						"throughput_statistic_method": {
							"description": "系统网络吞吐统计方式",
							"type": "string",
							"enum": [
								"WAN_LINK_STATISTIC",
								"ALL_LINK_STATISTIC"
							],
							"default": "WAN_LINK_STATISTIC",
							"example": "WAN_LINK_STATISTIC"
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
							"description": "管数分离模式开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"bond_dpu_opt_enable": {
							"description": "bond dpu优化开关",
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
				"snat_port_exhaustion_warn_setting": {
					"type": "object",
					"description": "snat端口枯竭告警设置",
					"required": [],
					"properties": {
						"state": {
							"type": "string",
							"description": "snat源端口枯竭告警开关",
							"title": "snat源端口枯竭告警开关",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"type": "integer",
							"description": "snat源端口枯竭告警阈值，最大100%，最小值50%",
							"title": "snat源端口枯竭告警阈值",
							"default": 80,
							"maximum": 100,
							"minimum": 50,
							"example": 80
						},
						"interval": {
							"type": "integer",
							"description": "snat源端口枯竭告警间隔，最大值600s，最小值1s",
							"title": "snat源端口枯竭告警间隔",
							"default": 30,
							"maximum": 600,
							"minimum": 1,
							"example": 30
						}
					}
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
						},
						"dynamic_route_backend_config_switch": {
							"description": "动态路由后台配置开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"vip_route_delay_distribute_interval": {
							"description": "虚拟IP路由注入延迟时长，最大值1200s，最小值10s",
							"type": "integer",
							"default": 125,
							"maximum": 1200,
							"minimum": 1,
							"example": 125
						},
						"snat_route_delay_distribute_interval": {
							"description": "SNAT地址集路由注入延迟时长，最大值1200s，最小值10s",
							"type": "integer",
							"default": 120,
							"maximum": 1200,
							"minimum": 1,
							"example": 120
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
				"interface_setting": {
					"description": "网口配置",
					"type": "object",
					"properties": {
						"hw_bypass_enable": {
							"description": "网口bypass",
							"type": "string",
							"enum": [
								"ENABLE",
								"FORCE-ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						}
					}
				},
				"connection_optimize": {
					"description": "连接优化设置",
					"type": "object",
					"properties": {
						"client_conn_keep_alive": {
							"description": "客户端连接优化",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						}
					}
				}
			}
		}
	}
}