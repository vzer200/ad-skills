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
		"/api/ad/v3/slb/tcp-profile/l3-forward/": {
			"description": "新建、查看三层tcp策略配置",
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
				"description": "查看当前已有的三层tcp策略配置信息",
				"operationId": "get_tcp_profile_l3_forward_list",
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
						"$ref": "#/responses/operation_config_tcp_profile_l3_forward_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all tcp-profile",
						"description": "查看当前已有的三层tcp策略配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/tcp-profile/l3-forward/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/tcp-profile/l3-forward/ 响应",
						"description": "返回GET /api/ad/v3/slb/tcp-profile/l3-forward/的响应数据",
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
									"name": "DEFAULT-L3",
									"description": "example_string",
									"default": "NON-DEFAULT",
									"type": "L3-FORWARD",
									"loose_initiation": "ENABLE",
									"loose_close": "DISABLE",
									"loose_close_timeout_ms": 5000,
									"idle_timeout": 300,
									"timewait_timeout_ms": 10000,
									"idle_timeout_reset_connection": "DISABLE",
									"syn_flood": {
										"state": "GLOBAL",
										"packet_pre_second_threshold": 4096
									},
									"l3_node_fault_close_connection": "ENABLE",
									"flow_offload": "ENABLE",
									"flow_offload_delay": 8,
									"tcp_option_address": {
										"state": "DISABLE",
										"toa_tcp_option_kind": 120,
										"toa_insert_mode": "HANDSHAKE_PACK",
										"toa_insert_format": "ONLY_IP",
										"toa_cover_opt_state": "DISABLE"
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
				"summary": "create new tcp-profile",
				"description": "新建一个三层tcp策略配置",
				"operationId": "add_tcp_profile_l3_forward_list",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L3-FORWARD-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l3_forward_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new tcp-profile",
						"description": "新建一个三层tcp策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/tcp-profile/l3-forward/",
							"body": {
								"name": "AI_DEFAULT-L3_A",
								"default": "NON-DEFAULT",
								"type": "L3-FORWARD",
								"loose_initiation": "ENABLE",
								"loose_close": "DISABLE",
								"loose_close_timeout_ms": 5000,
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"idle_timeout_reset_connection": "DISABLE",
								"l3_node_fault_close_connection": "ENABLE",
								"flow_offload": "ENABLE",
								"flow_offload_delay": 8
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/tcp-profile/l3-forward/ 响应",
						"description": "返回POST /api/ad/v3/slb/tcp-profile/l3-forward/的响应数据",
						"value": {
							"name": "AI_DEFAULT-L3_A",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L3-FORWARD",
							"loose_initiation": "ENABLE",
							"loose_close": "DISABLE",
							"loose_close_timeout_ms": 5000,
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"idle_timeout_reset_connection": "DISABLE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							},
							"l3_node_fault_close_connection": "ENABLE",
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8,
							"tcp_option_address": {
								"state": "DISABLE",
								"toa_tcp_option_kind": 120,
								"toa_insert_mode": "HANDSHAKE_PACK",
								"toa_insert_format": "ONLY_IP",
								"toa_cover_opt_state": "DISABLE"
							}
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb tcp-profile l3-forward abc description l3-tcp type l3-forward idle_timeout 600 idle_timeout_reset_connection enable loose_close enable loose_close_timeout_ms 600 loose_initiation enable timewait_timeout_ms 10000",
					"description": "新建三层tcp策略abc，会话超时时间为600s，启用会话超时重置连接，启用任意FIN释放会话，关闭延时为600ms，启用允许非SYN建立会话，TIME_WAIT超时时间为10000ms"
				},
				{
					"command": "modify slb tcp-profile l3-forward abc loose_close disable",
					"description": "修改三层TCP策略abc，禁用任意FIN释放会话"
				},
				{
					"command": "list slb tcp-profile l3-forward abc",
					"description": "查看三层TCP策略abc的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/tcp-profile/l3-forward/{name}": {
			"description": "新建、查看、修改、删除指定的三层tcp策略配置",
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
				"description": "查看指定的三层tcp策略配置",
				"operationId": "get_tcp_profile_l3_forward",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l3_forward_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific tcp-profile",
						"description": "查看指定的三层tcp策略配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/tcp-profile/l3-forward/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/tcp-profile/l3-forward/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/tcp-profile/l3-forward/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L3",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L3-FORWARD",
							"loose_initiation": "ENABLE",
							"loose_close": "DISABLE",
							"loose_close_timeout_ms": 5000,
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"idle_timeout_reset_connection": "DISABLE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							},
							"l3_node_fault_close_connection": "ENABLE",
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8,
							"tcp_option_address": {
								"state": "DISABLE",
								"toa_tcp_option_kind": 120,
								"toa_insert_mode": "HANDSHAKE_PACK",
								"toa_insert_format": "ONLY_IP",
								"toa_cover_opt_state": "DISABLE"
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
				"summary": "create new tcp-profile",
				"description": "新建指定的三层tcp策略配置",
				"operationId": "create_tcp_profile_l3_forward",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L3-FORWARD-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l3_forward_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new tcp-profile",
						"description": "新建指定的三层tcp策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/tcp-profile/l3-forward/{name}",
							"body": {
								"name": "AI_DEFAULT-L3_B",
								"default": "NON-DEFAULT",
								"type": "L3-FORWARD",
								"loose_initiation": "ENABLE",
								"loose_close": "DISABLE",
								"loose_close_timeout_ms": 5000,
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"idle_timeout_reset_connection": "DISABLE",
								"l3_node_fault_close_connection": "ENABLE",
								"flow_offload": "ENABLE",
								"flow_offload_delay": 8
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/tcp-profile/l3-forward/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/tcp-profile/l3-forward/{name}的响应数据",
						"value": {
							"name": "AI_DEFAULT-L3_B",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L3-FORWARD",
							"loose_initiation": "ENABLE",
							"loose_close": "DISABLE",
							"loose_close_timeout_ms": 5000,
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"idle_timeout_reset_connection": "DISABLE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							},
							"l3_node_fault_close_connection": "ENABLE",
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8,
							"tcp_option_address": {
								"state": "DISABLE",
								"toa_tcp_option_kind": 120,
								"toa_insert_mode": "HANDSHAKE_PACK",
								"toa_insert_format": "ONLY_IP",
								"toa_cover_opt_state": "DISABLE"
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"tcp-profile"
				],
				"summary": "replace specific tcp-profile",
				"description": "修改指定的三层tcp策略配置",
				"operationId": "replace_tcp_profile_l3_forward",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L3-FORWARD-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l3_forward_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific tcp-profile",
						"description": "修改指定的三层tcp策略配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/tcp-profile/l3-forward/{name}",
							"body": {
								"name": "DEFAULT-L3",
								"default": "NON-DEFAULT",
								"type": "L3-FORWARD",
								"loose_initiation": "ENABLE",
								"loose_close": "DISABLE",
								"loose_close_timeout_ms": 5000,
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"idle_timeout_reset_connection": "DISABLE",
								"l3_node_fault_close_connection": "ENABLE",
								"flow_offload": "ENABLE",
								"flow_offload_delay": 8
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/tcp-profile/l3-forward/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/tcp-profile/l3-forward/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L3",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L3-FORWARD",
							"loose_initiation": "ENABLE",
							"loose_close": "DISABLE",
							"loose_close_timeout_ms": 5000,
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"idle_timeout_reset_connection": "DISABLE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							},
							"l3_node_fault_close_connection": "ENABLE",
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8,
							"tcp_option_address": {
								"state": "DISABLE",
								"toa_tcp_option_kind": 120,
								"toa_insert_mode": "HANDSHAKE_PACK",
								"toa_insert_format": "ONLY_IP",
								"toa_cover_opt_state": "DISABLE"
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"tcp-profile"
				],
				"summary": "modify specific tcp-profile",
				"description": "修改指定的三层tcp策略配置",
				"operationId": "edit_tcp_profile_l3_forward",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L3-FORWARD-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l3_forward_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific tcp-profile",
						"description": "修改指定的三层tcp策略配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/tcp-profile/l3-forward/{name}",
							"body": {
								"name": "DEFAULT-L3",
								"default": "NON-DEFAULT",
								"type": "L3-FORWARD",
								"loose_initiation": "ENABLE",
								"loose_close": "DISABLE",
								"loose_close_timeout_ms": 5000,
								"idle_timeout": 300,
								"timewait_timeout_ms": 10000,
								"idle_timeout_reset_connection": "DISABLE",
								"l3_node_fault_close_connection": "ENABLE",
								"flow_offload": "ENABLE",
								"flow_offload_delay": 8
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/tcp-profile/l3-forward/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/tcp-profile/l3-forward/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L3",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L3-FORWARD",
							"loose_initiation": "ENABLE",
							"loose_close": "DISABLE",
							"loose_close_timeout_ms": 5000,
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"idle_timeout_reset_connection": "DISABLE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							},
							"l3_node_fault_close_connection": "ENABLE",
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8,
							"tcp_option_address": {
								"state": "DISABLE",
								"toa_tcp_option_kind": 120,
								"toa_insert_mode": "HANDSHAKE_PACK",
								"toa_insert_format": "ONLY_IP",
								"toa_cover_opt_state": "DISABLE"
							}
						}
					}
				}
			},
			"delete": {
				"tags": [
					"tcp-profile"
				],
				"summary": "delete specific tcp-profile",
				"description": "删除指定的三层tcp策略配置",
				"operationId": "delete_tcp_profile_l3_forward",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l3_forward_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific tcp-profile",
						"description": "删除指定的三层tcp策略配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/tcp-profile/l3-forward/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/tcp-profile/l3-forward/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/tcp-profile/l3-forward/{name}的响应数据",
						"value": {
							"name": "DEFAULT-L3",
							"description": "example_string",
							"default": "NON-DEFAULT",
							"type": "L3-FORWARD",
							"loose_initiation": "ENABLE",
							"loose_close": "DISABLE",
							"loose_close_timeout_ms": 5000,
							"idle_timeout": 300,
							"timewait_timeout_ms": 10000,
							"idle_timeout_reset_connection": "DISABLE",
							"syn_flood": {
								"state": "GLOBAL",
								"packet_pre_second_threshold": 4096
							},
							"l3_node_fault_close_connection": "ENABLE",
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8,
							"tcp_option_address": {
								"state": "DISABLE",
								"toa_tcp_option_kind": 120,
								"toa_insert_mode": "HANDSHAKE_PACK",
								"toa_insert_format": "ONLY_IP",
								"toa_cover_opt_state": "DISABLE"
							}
						}
					}
				}
			}
		}
	},
	"parameters": {
		"TCP-PROFILE-L3-FORWARD-CONFIG": {
			"name": "TCP-PROFILE-L3-FORWARD-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l3_forward"
			}
		},
		"TCP-PROFILE-L3-FORWARD-PROPERTY": {
			"name": "TCP-PROFILE-L3-FORWARD-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l3_forward"
			}
		}
	},
	"responses": {
		"operation_config_tcp_profile_l3_forward_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l3_forward_list"
			}
		},
		"operation_config_tcp_profile_l3_forward_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l3_forward"
			}
		}
	},
	"definitions": {
		"config.tcp_profile_l3_forward_list": {
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
						"$ref": "#/definitions/config.tcp_profile_l3_forward"
					}
				}
			}
		},
		"config.tcp_profile_l3_forward": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定TCP策略的名称, 在配置中必须唯一",
					"type": "string",
					"example": "DEFAULT-L3"
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
					"description": "可选参数；指定TCP策略的服务类型，默认为L3-FORWARD",
					"type": "string",
					"enum": [
						"L3-FORWARD"
					],
					"default": "L3-FORWARD",
					"example": "L3-FORWARD"
				},
				"loose_initiation": {
					"description": "可选参数；指定是否允许传入未经过三次握手的TCP连接，enable表示启用，disable表示禁用；默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"loose_close": {
					"description": "可选参数；指定是否快速关闭未经过三次握手的TCP连接，enable表示启用，disable表示禁用；默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"loose_close_timeout_ms": {
					"description": "可选参数；指定关闭的超时时间，默认为5000ms",
					"type": "integer",
					"default": 5000,
					"maximum": 600000,
					"minimum": 0,
					"example": 500
				},
				"idle_timeout": {
					"description": "可选参数；指定会话超时时间，默认为300s",
					"type": "integer",
					"default": 300,
					"maximum": 604800,
					"minimum": 1,
					"example": 600
				},
				"timewait_timeout_ms": {
					"description": "TIME_WAIT超时时间",
					"type": "integer",
					"default": 10000,
					"maximum": 600000,
					"minimum": 0,
					"example": 10000
				},
				"idle_timeout_reset_connection": {
					"description": "可选参数；指定timewait超时时间，默认为10000ms",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
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
				},
				"l3_node_fault_close_connection": {
					"description": "三层节点失效时是否关闭连接",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"flow_offload": {
					"description": "硬件加速开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"flow_offload_delay": {
					"description": "延迟下发流表, 必须为0~128之间的整数",
					"type": "integer",
					"default": 8,
					"maximum": 128,
					"minimum": 0
				},
				"tcp_option_address": {
					"type": "object",
					"description": "TOA功能",
					"title": "TOA功能",
					"required": [],
					"properties": {
						"state": {
							"type": "string",
							"description": "TOA功能启禁用状态",
							"title": "TOA启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"toa_tcp_option_kind": {
							"type": "integer",
							"description": "TOA插入tcp option的kind(十进制)，必须为1~254之间的整数,且不能是RFC规定的常用无二义性kind",
							"title": "TOA tcp option kind",
							"maximum": 254,
							"minimum": 1,
							"default": 120,
							"example": 120
						},
						"toa_insert_mode": {
							"type": "string",
							"description": "TOA插入方式，合法输入为HANDSHAKE_PACK和PER_PACK",
							"title": "TOA插入方式",
							"enum": [
								"HANDSHAKE_PACK",
								"PER_PACK"
							],
							"default": "HANDSHAKE_PACK",
							"example": "HANDSHAKE_PACK"
						},
						"toa_insert_format": {
							"type": "string",
							"description": "TOA插入内容，合法输入为ONLY_IP、PORT_AND_IP和IP_AND_PORT",
							"title": "TOA插入内容",
							"enum": [
								"ONLY_IP",
								"PORT_AND_IP",
								"IP_AND_PORT"
							],
							"default": "ONLY_IP",
							"example": "ONLY_IP"
						},
						"toa_cover_opt_state": {
							"type": "string",
							"description": "是否覆盖客户端TOA选项",
							"title": "覆盖客户端TOA启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						}
					}
				}
			}
		}
	}
}