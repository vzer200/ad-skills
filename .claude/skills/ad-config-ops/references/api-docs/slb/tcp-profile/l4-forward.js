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
		"/api/ad/v3/slb/tcp-profile/l4-forward/": {
			"description": "新建、查看四层tcp策略配置",
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
				"description": "查看当前已有的四层tcp策略配置信息",
				"operationId": "get_tcp_profile_l4_forward_list",
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
						"$ref": "#/responses/operation_config_tcp_profile_l4_forward_list"
					}
				}
			},
			"post": {
				"tags": [
					"tcp-profile"
				],
				"summary": "create new tcp-profile",
				"description": "新建一个四层tcp策略配置",
				"operationId": "add_tcp_profile_l4_forward_list",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L4-FORWARD-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l4_forward_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb tcp-profile l4-forward abc description l4-tcp type l4-forward idle_timeout 600 idle_timeout_reset_connection enable loose_close enable loose_close_timeout_ms 600 loose_initiation enable node_fault_close_connection enable seq_adjust enable service_unavailable_refuse_connection drop time_stamp preserve timewait_timeout_ms 600",
					"description": "新建四层tcp策略abc，会话超时时间为600s，启用会话超时重置连接，启用任意FIN释放会话，关闭延时为600ms，启用允许非SYN建立会话，启用节点无效关闭连接，启用调整序列号，虚拟服务离线策略为DROP，时间戳保持不变，TIME_WAIT超时时间为600ms"
				},
				{
					"command": "modify slb tcp-profile l3-forward abc loose_close disable",
					"description": "修改四层TCP策略abc，禁用任意FIN释放会话"
				},
				{
					"command": "list slb tcp-profile l4-forward abc",
					"description": "查看四层TCP策略abc的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/tcp-profile/l4-forward/{name}": {
			"description": "新建、查看、修改、删除指定的四层tcp策略配置",
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
				"description": "查看指定的四层tcp策略配置",
				"operationId": "get_tcp_profile_l4_forward",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l4_forward_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"tcp-profile"
				],
				"summary": "create new tcp-profile",
				"description": "新建指定的四层tcp策略配置",
				"operationId": "create_tcp_profile_l4_forward",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L4-FORWARD-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l4_forward_object"
					}
				}
			},
			"put": {
				"tags": [
					"tcp-profile"
				],
				"summary": "replace specific tcp-profile",
				"description": "修改指定的四层tcp策略配置",
				"operationId": "replace_tcp_profile_l4_forward",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L4-FORWARD-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l4_forward_object"
					}
				}
			},
			"patch": {
				"tags": [
					"tcp-profile"
				],
				"summary": "modify specific tcp-profile",
				"description": "修改指定的四层tcp策略配置",
				"operationId": "edit_tcp_profile_l4_forward",
				"parameters": [
					{
						"$ref": "#/parameters/TCP-PROFILE-L4-FORWARD-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l4_forward_object"
					}
				}
			},
			"delete": {
				"tags": [
					"tcp-profile"
				],
				"summary": "delete specific tcp-profile",
				"description": "删除指定的四层tcp策略配置",
				"operationId": "delete_tcp_profile_l4_forward",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tcp_profile_l4_forward_object"
					}
				}
			}
		}
	},
	"parameters": {
		"TCP-PROFILE-L4-FORWARD-CONFIG": {
			"name": "TCP-PROFILE-L4-FORWARD-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l4_forward"
			}
		},
		"TCP-PROFILE-L4-FORWARD-PROPERTY": {
			"name": "TCP-PROFILE-L4-FORWARD-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l4_forward"
			}
		}
	},
	"responses": {
		"operation_config_tcp_profile_l4_forward_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l4_forward_list"
			}
		},
		"operation_config_tcp_profile_l4_forward_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tcp_profile_l4_forward"
			}
		}
	},
	"definitions": {
		"config.tcp_profile_l4_forward_list": {
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
						"$ref": "#/definitions/config.tcp_profile_l4_forward"
					}
				}
			}
		},
		"config.tcp_profile_l4_forward": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定TCP策略的名称, 在配置中必须唯一",
					"type": "string",
					"example": "DEFAULT-L4"
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
					"description": "可选参数；指定TCP策略的服务类型，默认为L4-FORWARD",
					"type": "string",
					"enum": [
						"L4-FORWARD"
					],
					"default": "L4-FORWARD",
					"example": "L4-FORWARD"
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
					"description": "可选参数；指定会话超时时间，默认为600s",
					"type": "integer",
					"default": 300,
					"maximum": 604800,
					"minimum": 1,
					"example": 600
				},
				"maximum_segment_size": {
					"description": "MSS",
					"type": "integer",
					"default": 1460,
					"maximum": 1460,
					"minimum": 536,
					"example": 1460
				},
				"timewait_timeout_ms": {
					"description": "可选参数；指定timewait超时时间，默认为10000ms",
					"type": "integer",
					"default": 10000,
					"maximum": 600000,
					"minimum": 0,
					"example": 10000
				},
				"idle_timeout_reset_connection": {
					"description": "可选参数；指定是否会话超时重置连接，enable表示启用，disable表示禁用，默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
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
				"time_stamp": {
					"description": "可选参数；指定时间戳状态，strip表示抹除，rewrite表示改写，preserve表示保持不变，默认为保持不变",
					"type": "string",
					"enum": [
						"STRIP",
						"REWRITE",
						"PRESERVE"
					],
					"default": "PRESERVE",
					"example": "PRESERVE"
				},
				"seq_adjust": {
					"description": "可选参数；指定是否调整序列号，enable表示启用，disable表示禁用，默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
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
				}
			}
		}
	}
}