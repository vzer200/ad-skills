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
		"/api/ad/v3/slb/tcp-profile/l7-proxy/": {
			"description": "新建、查看七层tcp策略配置",
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
				"summary": "get all tcp-profile-l7-proxy",
				"description": "查看当前已有的七层tcp策略配置信息",
				"operationId": "get_tcp_profile_l7_proxy_list",
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
						"$ref": "#/responses/operation_config_tcp_profile_l7_proxy_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all tcp-profile-l7-proxy",
						"description": "查看当前已有的七层tcp策略配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/tcp-profile/l7-proxy/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/tcp-profile/l7-proxy/ 响应",
						"description": "返回GET /api/ad/v3/slb/tcp-profile/l7-proxy/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "DEFAULT-L7",
									"description": "example_string",
									"default": "NON-DEFAULT",
									"type": "L7-PROXY",
									"idle_timeout": 300,
									"timewait_timeout_ms": 10000,
									"lastack_close_timeout_ms": 0,
									"syn_timeout": 75,
									"zero_window_timeout": 20,
									"keep_alive_interval": 60,
									"maximum_segment_size": 1460,
									"auto_adjust_mss": {
										"state": "ENABLE",
										"back_maximum_segment_size": 1460
									},
									"time_stamp": "ENABLE",
									"reset_invalid_connection": "ENABLE",
									"close_node_connection_with_rst": "ENABLE",
									"close_client_connection_with_rst": "ENABLE",
									"node_fault_close_connection": "DISABLE",
									"timewait_recycle": "ENABLE",
									"delay_ack": "DISABLE",
									"sack_support": "ENABLE",
									"dsack_support": "DISABLE",
									"maximum_syn_retransmission_times": 8,
									"maximum_seg_retransmission_times": 8,
									"maximum_fin_retransmission_times": 8,
									"min_retran_time": 250,
									"receive_window_scale": 0,
									"initial_receive_window_size": 65535,
									"tcp_options": [
										{
											"kind": 2,
											"policy": "FIRST-PACKET"
										}
									],
									"fast_tcp": "DISABLE",
									"connection_pool": {
										"state": "DISABLE",
										"size": 10000,
										"age": 60,
										"source_address_prefix": 0,
										"ipv6_source_address_prefix": 0
									},
									"service_unavailable_refuse_connection": "NONE",
									"syn_flood": {
										"state": "GLOBAL",
										"packet_pre_second_threshold": 4096
									}
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"tcp-profile"
				],
				"summary": "create new tcp-profile-l7-proxy",
				"description": "新建一个七层tcp策略配置",
				"operationId": "add_tcp_profile_l7_proxy_list",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L7-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l7_proxy_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new tcp-profile-l7-proxy",
						"description": "新建一个七层tcp策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/tcp-profile/l7-proxy/",
							"body": {
								"name": "AI_DEFAULT-L7_A",
								"default": "NON-DEFAULT",
								"type": "L7-PROXY",
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"lastack_close_timeout_ms": 0,
								"syn_timeout": 75,
								"zero_window_timeout": 20,
								"keep_alive_interval": 60,
								"maximum_segment_size": 1460,
								"time_stamp": "ENABLE",
								"reset_invalid_connection": "ENABLE",
								"close_node_connection_with_rst": "ENABLE",
								"close_client_connection_with_rst": "ENABLE",
								"node_fault_close_connection": "DISABLE",
								"timewait_recycle": "ENABLE",
								"delay_ack": "DISABLE",
								"sack_support": "ENABLE",
								"dsack_support": "DISABLE",
								"maximum_syn_retransmission_times": 8,
								"maximum_seg_retransmission_times": 8,
								"maximum_fin_retransmission_times": 8,
								"min_retran_time": 250,
								"receive_window_scale": 0,
								"initial_receive_window_size": 65535,
								"fast_tcp": "DISABLE",
								"service_unavailable_refuse_connection": "NONE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/tcp-profile/l7-proxy/ 响应",
						"description": "返回POST /api/ad/v3/slb/tcp-profile/l7-proxy/的响应数据",
						"value": {
							"name": "AI_DEFAULT-L7_A",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L7-PROXY",
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"lastack_close_timeout_ms": 0,
							"syn_timeout": 75,
							"zero_window_timeout": 20,
							"keep_alive_interval": 60,
							"maximum_segment_size": 1460,
							"auto_adjust_mss": {
								"state": "ENABLE",
								"back_maximum_segment_size": 1460
							},
							"time_stamp": "ENABLE",
							"reset_invalid_connection": "ENABLE",
							"close_node_connection_with_rst": "ENABLE",
							"close_client_connection_with_rst": "ENABLE",
							"node_fault_close_connection": "DISABLE",
							"timewait_recycle": "ENABLE",
							"delay_ack": "DISABLE",
							"sack_support": "ENABLE",
							"dsack_support": "DISABLE",
							"maximum_syn_retransmission_times": 8,
							"maximum_seg_retransmission_times": 8,
							"maximum_fin_retransmission_times": 8,
							"min_retran_time": 250,
							"receive_window_scale": 0,
							"initial_receive_window_size": 65535,
							"tcp_options": [
								{
									"kind": 2,
									"policy": "FIRST-PACKET"
								}
							],
							"fast_tcp": "DISABLE",
							"connection_pool": {
								"state": "DISABLE",
								"size": 10000,
								"age": 60,
								"source_address_prefix": 0,
								"ipv6_source_address_prefix": 0
							},
							"service_unavailable_refuse_connection": "NONE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							}
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb tcp-profile l7-proxy abc type l7-proxy description l7-tcp maximum_segment_size 1460 syn_timeout 60 idle_timeout 600 fast_tcp enable service_unavailable_refuse_connection drop close_client_connection_with_rst enable close_node_connection_with_rst enable connection_pool { state enable size 1000 age 6000 source_address_prefix 24 ipv6_source_address_prefix 64 } time_stamp enable timewait_recycle enable node_fault_close_connection enable delay_ack enable sack_support enable dsack_support enable reset_invalid_connection enable timewait_timeout_ms 6000 maximum_syn_retransmission_times 10 maximum_seg_retransmission_times 10 receive_window_scale 10 initial_receive_window_size 65535 maximum_fin_retransmission_times 15",
					"description": "新建七层tcp策略abc，MMS为1460，SYN超时时间为60s，空闲超时时间为600s，启用TCP单边加速，虚拟服务离线策略为DROP，启用客户端强制关闭连接，启用服务端强制关闭连接，启用TCP连接池，连接池大小为1000，超时时间为6000，IPv4源IP掩码为24，IPv6源IP前缀为64，启用时间戳，启用TIME_WAIT资源快速回收，启用节点失效关闭连接，启用延迟ACK，启用支持SACK，启用支持DSACK，启用重置无效连接，TIME_WAIT超时时间为6000，最大SYN重传次数为10，分段最大重传次数为10，窗口扩大因子为10，初始接收窗口大小为65535，Closing状态下重传次数为15"
				},
				{
					"command": "modify slb tcp-profile l7-proxy abc fast_tcp disable",
					"description": "修改七层TCP策略abc，禁用TCP单边加速"
				},
				{
					"command": "list slb tcp-profile l7-forward abc",
					"description": "查看七层TCP策略abc的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/tcp-profile/l7-proxy/{name}": {
			"description": "新建、查看、修改、删除指定的七层tcp策略配置",
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
				"summary": "get specific tcp-profile-l7-proxy",
				"description": "查看指定的七层tcp策略配置",
				"operationId": "get_tcp_profile_l7_proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l7_proxy_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific tcp-profile-l7-proxy",
						"description": "查看指定的七层tcp策略配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/tcp-profile/l7-proxy/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/tcp-profile/l7-proxy/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/tcp-profile/l7-proxy/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L7",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L7-PROXY",
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"lastack_close_timeout_ms": 0,
							"syn_timeout": 75,
							"zero_window_timeout": 20,
							"keep_alive_interval": 60,
							"maximum_segment_size": 1460,
							"auto_adjust_mss": {
								"state": "ENABLE",
								"back_maximum_segment_size": 1460
							},
							"time_stamp": "ENABLE",
							"reset_invalid_connection": "ENABLE",
							"close_node_connection_with_rst": "ENABLE",
							"close_client_connection_with_rst": "ENABLE",
							"node_fault_close_connection": "DISABLE",
							"timewait_recycle": "ENABLE",
							"delay_ack": "DISABLE",
							"sack_support": "ENABLE",
							"dsack_support": "DISABLE",
							"maximum_syn_retransmission_times": 8,
							"maximum_seg_retransmission_times": 8,
							"maximum_fin_retransmission_times": 8,
							"min_retran_time": 250,
							"receive_window_scale": 0,
							"initial_receive_window_size": 65535,
							"tcp_options": [
								{
									"kind": 2,
									"policy": "FIRST-PACKET"
								}
							],
							"fast_tcp": "DISABLE",
							"connection_pool": {
								"state": "DISABLE",
								"size": 10000,
								"age": 60,
								"source_address_prefix": 0,
								"ipv6_source_address_prefix": 0
							},
							"service_unavailable_refuse_connection": "NONE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							}
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"tcp-profile"
				],
				"summary": "create new tcp-profile-l7-proxy",
				"description": "新建指定的七层tcp策略配置",
				"operationId": "create_tcp_profile_l7_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L7-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l7_proxy_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new tcp-profile-l7-proxy",
						"description": "新建指定的七层tcp策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/tcp-profile/l7-proxy/{name}",
							"body": {
								"name": "AI_DEFAULT-L7_B",
								"default": "NON-DEFAULT",
								"type": "L7-PROXY",
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"lastack_close_timeout_ms": 0,
								"syn_timeout": 75,
								"zero_window_timeout": 20,
								"keep_alive_interval": 60,
								"maximum_segment_size": 1460,
								"time_stamp": "ENABLE",
								"reset_invalid_connection": "ENABLE",
								"close_node_connection_with_rst": "ENABLE",
								"close_client_connection_with_rst": "ENABLE",
								"node_fault_close_connection": "DISABLE",
								"timewait_recycle": "ENABLE",
								"delay_ack": "DISABLE",
								"sack_support": "ENABLE",
								"dsack_support": "DISABLE",
								"maximum_syn_retransmission_times": 8,
								"maximum_seg_retransmission_times": 8,
								"maximum_fin_retransmission_times": 8,
								"min_retran_time": 250,
								"receive_window_scale": 0,
								"initial_receive_window_size": 65535,
								"fast_tcp": "DISABLE",
								"service_unavailable_refuse_connection": "NONE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/tcp-profile/l7-proxy/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/tcp-profile/l7-proxy/{name}的响应数据",
						"value": {
							"name": "AI_DEFAULT-L7_B",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L7-PROXY",
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"lastack_close_timeout_ms": 0,
							"syn_timeout": 75,
							"zero_window_timeout": 20,
							"keep_alive_interval": 60,
							"maximum_segment_size": 1460,
							"auto_adjust_mss": {
								"state": "ENABLE",
								"back_maximum_segment_size": 1460
							},
							"time_stamp": "ENABLE",
							"reset_invalid_connection": "ENABLE",
							"close_node_connection_with_rst": "ENABLE",
							"close_client_connection_with_rst": "ENABLE",
							"node_fault_close_connection": "DISABLE",
							"timewait_recycle": "ENABLE",
							"delay_ack": "DISABLE",
							"sack_support": "ENABLE",
							"dsack_support": "DISABLE",
							"maximum_syn_retransmission_times": 8,
							"maximum_seg_retransmission_times": 8,
							"maximum_fin_retransmission_times": 8,
							"min_retran_time": 250,
							"receive_window_scale": 0,
							"initial_receive_window_size": 65535,
							"tcp_options": [
								{
									"kind": 2,
									"policy": "FIRST-PACKET"
								}
							],
							"fast_tcp": "DISABLE",
							"connection_pool": {
								"state": "DISABLE",
								"size": 10000,
								"age": 60,
								"source_address_prefix": 0,
								"ipv6_source_address_prefix": 0
							},
							"service_unavailable_refuse_connection": "NONE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"tcp-profile"
				],
				"summary": "replace specific tcp-profile-l7-proxy",
				"description": "修改指定的七层tcp策略配置",
				"operationId": "replace_tcp_profile_l7_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L7-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l7_proxy_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific tcp-profile-l7-proxy",
						"description": "修改指定的七层tcp策略配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/tcp-profile/l7-proxy/{name}",
							"body": {
								"name": "DEFAULT-L7",
								"default": "NON-DEFAULT",
								"type": "L7-PROXY",
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"lastack_close_timeout_ms": 0,
								"syn_timeout": 75,
								"zero_window_timeout": 20,
								"keep_alive_interval": 60,
								"maximum_segment_size": 1460,
								"time_stamp": "ENABLE",
								"reset_invalid_connection": "ENABLE",
								"close_node_connection_with_rst": "ENABLE",
								"close_client_connection_with_rst": "ENABLE",
								"node_fault_close_connection": "DISABLE",
								"timewait_recycle": "ENABLE",
								"delay_ack": "DISABLE",
								"sack_support": "ENABLE",
								"dsack_support": "DISABLE",
								"maximum_syn_retransmission_times": 8,
								"maximum_seg_retransmission_times": 8,
								"maximum_fin_retransmission_times": 8,
								"min_retran_time": 250,
								"receive_window_scale": 0,
								"initial_receive_window_size": 65535,
								"fast_tcp": "DISABLE",
								"service_unavailable_refuse_connection": "NONE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/tcp-profile/l7-proxy/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/tcp-profile/l7-proxy/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L7",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L7-PROXY",
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"lastack_close_timeout_ms": 0,
							"syn_timeout": 75,
							"zero_window_timeout": 20,
							"keep_alive_interval": 60,
							"maximum_segment_size": 1460,
							"auto_adjust_mss": {
								"state": "ENABLE",
								"back_maximum_segment_size": 1460
							},
							"time_stamp": "ENABLE",
							"reset_invalid_connection": "ENABLE",
							"close_node_connection_with_rst": "ENABLE",
							"close_client_connection_with_rst": "ENABLE",
							"node_fault_close_connection": "DISABLE",
							"timewait_recycle": "ENABLE",
							"delay_ack": "DISABLE",
							"sack_support": "ENABLE",
							"dsack_support": "DISABLE",
							"maximum_syn_retransmission_times": 8,
							"maximum_seg_retransmission_times": 8,
							"maximum_fin_retransmission_times": 8,
							"min_retran_time": 250,
							"receive_window_scale": 0,
							"initial_receive_window_size": 65535,
							"tcp_options": [
								{
									"kind": 2,
									"policy": "FIRST-PACKET"
								}
							],
							"fast_tcp": "DISABLE",
							"connection_pool": {
								"state": "DISABLE",
								"size": 10000,
								"age": 60,
								"source_address_prefix": 0,
								"ipv6_source_address_prefix": 0
							},
							"service_unavailable_refuse_connection": "NONE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"tcp-profile"
				],
				"summary": "modify specific tcp-profile-l7-proxy",
				"description": "修改指定的七层tcp策略配置",
				"operationId": "edit_tcp_profile_l7_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L7-PROXY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l7_proxy_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific tcp-profile-l7-proxy",
						"description": "修改指定的七层tcp策略配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/tcp-profile/l7-proxy/{name}",
							"body": {
								"name": "DEFAULT-L7",
								"default": "NON-DEFAULT",
								"type": "L7-PROXY",
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"lastack_close_timeout_ms": 0,
								"syn_timeout": 75,
								"zero_window_timeout": 20,
								"keep_alive_interval": 60,
								"maximum_segment_size": 1460,
								"time_stamp": "ENABLE",
								"reset_invalid_connection": "ENABLE",
								"close_node_connection_with_rst": "ENABLE",
								"close_client_connection_with_rst": "ENABLE",
								"node_fault_close_connection": "DISABLE",
								"timewait_recycle": "ENABLE",
								"delay_ack": "DISABLE",
								"sack_support": "ENABLE",
								"dsack_support": "DISABLE",
								"maximum_syn_retransmission_times": 8,
								"maximum_seg_retransmission_times": 8,
								"maximum_fin_retransmission_times": 8,
								"min_retran_time": 250,
								"receive_window_scale": 0,
								"initial_receive_window_size": 65535,
								"fast_tcp": "DISABLE",
								"service_unavailable_refuse_connection": "NONE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/tcp-profile/l7-proxy/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/tcp-profile/l7-proxy/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L7",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L7-PROXY",
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"lastack_close_timeout_ms": 0,
							"syn_timeout": 75,
							"zero_window_timeout": 20,
							"keep_alive_interval": 60,
							"maximum_segment_size": 1460,
							"auto_adjust_mss": {
								"state": "ENABLE",
								"back_maximum_segment_size": 1460
							},
							"time_stamp": "ENABLE",
							"reset_invalid_connection": "ENABLE",
							"close_node_connection_with_rst": "ENABLE",
							"close_client_connection_with_rst": "ENABLE",
							"node_fault_close_connection": "DISABLE",
							"timewait_recycle": "ENABLE",
							"delay_ack": "DISABLE",
							"sack_support": "ENABLE",
							"dsack_support": "DISABLE",
							"maximum_syn_retransmission_times": 8,
							"maximum_seg_retransmission_times": 8,
							"maximum_fin_retransmission_times": 8,
							"min_retran_time": 250,
							"receive_window_scale": 0,
							"initial_receive_window_size": 65535,
							"tcp_options": [
								{
									"kind": 2,
									"policy": "FIRST-PACKET"
								}
							],
							"fast_tcp": "DISABLE",
							"connection_pool": {
								"state": "DISABLE",
								"size": 10000,
								"age": 60,
								"source_address_prefix": 0,
								"ipv6_source_address_prefix": 0
							},
							"service_unavailable_refuse_connection": "NONE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							}
						}
					}
				}
			},
			"delete": {
				"tags": [
					"tcp-profile"
				],
				"summary": "delete specific tcp-profile-l7-proxy",
				"description": "删除指定的七层tcp策略配置",
				"operationId": "delete_tcp_profile_l7_proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l7_proxy_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific tcp-profile-l7-proxy",
						"description": "删除指定的七层tcp策略配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/tcp-profile/l7-proxy/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/tcp-profile/l7-proxy/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/tcp-profile/l7-proxy/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L7",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L7-PROXY",
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"lastack_close_timeout_ms": 0,
							"syn_timeout": 75,
							"zero_window_timeout": 20,
							"keep_alive_interval": 60,
							"maximum_segment_size": 1460,
							"auto_adjust_mss": {
								"state": "ENABLE",
								"back_maximum_segment_size": 1460
							},
							"time_stamp": "ENABLE",
							"reset_invalid_connection": "ENABLE",
							"close_node_connection_with_rst": "ENABLE",
							"close_client_connection_with_rst": "ENABLE",
							"node_fault_close_connection": "DISABLE",
							"timewait_recycle": "ENABLE",
							"delay_ack": "DISABLE",
							"sack_support": "ENABLE",
							"dsack_support": "DISABLE",
							"maximum_syn_retransmission_times": 8,
							"maximum_seg_retransmission_times": 8,
							"maximum_fin_retransmission_times": 8,
							"min_retran_time": 250,
							"receive_window_scale": 0,
							"initial_receive_window_size": 65535,
							"tcp_options": [
								{
									"kind": 2,
									"policy": "FIRST-PACKET"
								}
							],
							"fast_tcp": "DISABLE",
							"connection_pool": {
								"state": "DISABLE",
								"size": 10000,
								"age": 60,
								"source_address_prefix": 0,
								"ipv6_source_address_prefix": 0
							},
							"service_unavailable_refuse_connection": "NONE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							}
						}
					}
				}
			}
		}
	},
	"parameters": {
		"TCP-PROFILE-L7-PROXY-CONFIG": {
			"name": "TCP-PROFILE-L7-PROXY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l7_proxy"
			}
		},
		"TCP-PROFILE-L7-PROXY-PROPERTY": {
			"name": "TCP-PROFILE-L7-PROXY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l7_proxy"
			}
		}
	},
	"responses": {
		"operation_config_tcp_profile_l7_proxy_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l7_proxy_list"
			}
		},
		"operation_config_tcp_profile_l7_proxy_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l7_proxy"
			}
		}
	},
	"definitions": {
		"config.tcp_profile_l7_proxy_list": {
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
						"$ref": "#/definitions/config.tcp_profile_l7_proxy"
					}
				}
			}
		},
		"config.tcp_profile_l7_proxy": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定TCP策略的名称, 在配置中必须唯一",
					"type": "string",
					"example": "DEFAULT-L7"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注"
				},
				"default": {
					"type": "string",
					"description": "只读参数；默认属性",
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				},
				"type": {
					"description": "可选参数；指定TCP策略的服务类型，默认为L7-PROXY",
					"type": "string",
					"enum": [
						"L7-PROXY"
					],
					"default": "L7-PROXY"
				},
				"idle_timeout": {
					"description": "可选参数；指定会话超时时间，默认为600s",
					"type": "integer",
					"default": 300,
					"maximum": 604800,
					"minimum": 1,
					"example": 600
				},
				"timewait_timeout_ms": {
					"description": "可选参数；指定timewait超时时间，默认为10000ms",
					"type": "integer",
					"default": 10000,
					"maximum": 600000,
					"minimum": 0,
					"example": 10000
				},
				"lastack_close_timeout_ms": {
					"description": "lastack关闭连接后超时时间",
					"type": "integer",
					"default": 0,
					"maximum": 600000,
					"minimum": 0,
					"example": 10000
				},
				"syn_timeout": {
					"description": "可选参数；指定syn超时时间，默认为75",
					"type": "integer",
					"default": 75,
					"maximum": 180,
					"minimum": 30,
					"example": 75
				},
				"zero_window_timeout": {
					"description": "零窗口超时时间",
					"type": "integer",
					"default": 20,
					"maximum": 65535,
					"minimum": 1,
					"example": 20
				},
				"keep_alive_interval": {
					"description": "keep alive探测间隔",
					"type": "integer",
					"default": 60,
					"maximum": 604800,
					"minimum": 0,
					"example": 60
				},
				"maximum_segment_size": {
					"description": "可选参数；指定MSS大小，默认为1460",
					"type": "integer",
					"default": 1460,
					"maximum": 1460,
					"minimum": 536,
					"example": 1460
				},
				"auto_adjust_mss": {
					"description": "自动调整前后端MSS大小",
					"type": "object",
					"properties": {
						"state": {
							"description": "是否开启自动调整MSS",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"back_maximum_segment_size": {
							"description": "后端MSS大小,关闭MSS自动调整时，后端连接设置的MSS值",
							"type": "integer",
							"default": 1460,
							"maximum": 1460,
							"minimum": 536
						}
					}
				},
				"time_stamp": {
					"description": "可选参数；指定时间戳状态，enable表示启用，disable表示禁用，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"reset_invalid_connection": {
					"description": "七层虚拟服务首包非syn的新连接rst",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"close_node_connection_with_rst": {
					"description": "可选参数；指定是否强制关闭服务端连接，enable表示启用，disable表示禁用，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"close_client_connection_with_rst": {
					"description": "可选参数；指定是否强制关闭客户端连接，enable表示启用，disable表示禁用，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"node_fault_close_connection": {
					"description": "可选参数；指定是否节点失效关闭连接，enable表示启用，disable表示禁用，默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"timewait_recycle": {
					"description": "可选参数；指定是否timewait资源快速回收，enable表示启用，disable表示禁用，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"delay_ack": {
					"description": "可选参数；指定是否延迟ack，enable表示启用，disable表示禁用，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"sack_support": {
					"description": "可选参数；指定是否支持sack，enable表示启用，disable表示禁用，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"dsack_support": {
					"description": "可选参数；指定是否支持dsack，enable表示启用，disable表示禁用，默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"maximum_syn_retransmission_times": {
					"description": "可选参数；指定最大SYN重传次数，默认为15",
					"type": "integer",
					"default": 8,
					"maximum": 30,
					"minimum": 0,
					"example": 15
				},
				"maximum_seg_retransmission_times": {
					"description": "可选参数；指定分段最大重传次数，默认为15",
					"type": "integer",
					"default": 8,
					"maximum": 30,
					"minimum": 0,
					"example": 15
				},
				"maximum_fin_retransmission_times": {
					"description": "可选参数；指定Closing状态下重传次数，默认为15",
					"type": "integer",
					"default": 8,
					"maximum": 30,
					"minimum": 0,
					"example": 15
				},
				"min_retran_time": {
					"description": "最小重传时间",
					"type": "integer",
					"default": 250,
					"maximum": 65535,
					"minimum": 0,
					"example": 250
				},
				"receive_window_scale": {
					"description": "可选参数；指定窗口扩大因子，默认为2",
					"type": "integer",
					"default": 0,
					"maximum": 14,
					"minimum": 0,
					"example": 2
				},
				"initial_receive_window_size": {
					"description": "可选参数；指定初始接收窗口大小，默认为65535",
					"type": "integer",
					"default": 65535,
					"maximum": 65535,
					"minimum": 1460,
					"example": 65535
				},
				"tcp_options": {
					"description": "可选参数；指定tcp_options",
					"type": "array",
					"items": {
						"description": "tcp_options",
						"type": "object",
						"required": [
							"kind",
							"policy"
						],
						"properties": {
							"kind": {
								"description": "必选参数；指定类型",
								"type": "integer",
								"maximum": 255,
								"minimum": 1,
								"example": 2
							},
							"policy": {
								"description": "必选参数；指定策略，first_packet表示第一个包，each_packet表示每一个包",
								"type": "string",
								"enum": [
									"FIRST-PACKET",
									"EACH-PACKET"
								],
								"default": "FIRST-PACKET",
								"example": "FIRST-PACKET"
							}
						}
					},
					"maxItems": 255
				},
				"fast_tcp": {
					"description": "可选参数；指定是否tcp单边加速，enable表示启用，disable表示禁用，默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"connection_pool": {
					"description": "可选参数；TCP连接池",
					"type": "object",
					"required": [],
					"properties": {
						"state": {
							"description": "必选参数；指定是否启用TCP连接池，enable表示启用，disable表示禁用，默认为禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"size": {
							"description": "可选参数；指定连接池大小，默认为10000",
							"type": "integer",
							"default": 10000,
							"maximum": 64000,
							"minimum": 1,
							"example": 10000
						},
						"age": {
							"description": "可选参数；指定超时时间，默认为60",
							"type": "integer",
							"default": 60,
							"maximum": 86400,
							"minimum": 60,
							"example": 60
						},
						"source_address_prefix": {
							"description": "可选参数；指定源IPv4掩码，默认为0",
							"type": "integer",
							"default": 0,
							"maximum": 32,
							"minimum": 0,
							"example": 24
						},
						"ipv6_source_address_prefix": {
							"description": "可选参数；指定源IPv6掩码，默认为0",
							"type": "integer",
							"default": 0,
							"maximum": 128,
							"minimum": 0,
							"example": 64
						}
					}
				},
				"service_unavailable_refuse_connection": {
					"description": "可选参数；指定虚拟服务离线策略，none表示无，reset表示重连，drop表示丢掉，默认为无",
					"type": "string",
					"enum": [
						"NONE",
						"RESET",
						"DROP"
					],
					"default": "NONE",
					"example": "NONE"
				},
				"syn_flood": {
					"description": "synflood防护",
					"type": "object",
					"properties": {
						"state": {
							"description": "synflood防护启禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE",
								"GLOBAL"
							],
							"default": "GLOBAL"
						},
						"packet_pre_second_threshold": {
							"description": "syncookie触发阈值, 必须为0~2147483647之间的整数",
							"type": "integer",
							"default": 4096,
							"minimum": 0,
							"maximum": 2147483647
						}
					}
				}
			}
		}
	}
}