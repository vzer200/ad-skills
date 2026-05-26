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
		"/api/ad/v3/slb/service-monitor/passive-tcp/": {
			"description": "新建、查看监视器（TCP被动）配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get all service-monitor-passive-tcp",
				"description": "查看当前已有的监视器（TCP被动）配置信息",
				"operationId": "get_service_monitor_passive_tcp_list",
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
						"$ref": "#/responses/operation_config_service_monitor_passive_tcp_list"
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-passive-tcp",
				"description": "新建一个监视器（TCP被动）配置",
				"operationId": "add_service_monitor_passive_tcp_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-TCP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_tcp_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor passive-tcp tcppassive statistical_time  30 statistical_object rst-packet rst_packet_threshold 100 action busy-protect  busy_protect { protect_time 60 set_offline_when_protect_fail enable retry_times 5 }",
					"description": "新建TCP被动类型监视器tcppassive,统计时间为30s,监视类型为RST关闭连接,上限值为100个;动作为过载保护,保护时间为60s，经过5次统计后依然过载则将节点设置为离线状态"
				},
				{
					"command": "modify slb service-monitor passive-tcp tcppassive statistical_object zero-window zero_window_percent 30",
					"description": "修改监视器tcppassive的监视类型为零窗口,上限值为30%"
				},
				{
					"command": "list slb service-monitor passive-tcp tcppassive",
					"description": "查看passive-tcp监视器tcppassive的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/passive-tcp/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（TCP被动）配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get specific service-monitor-passive-tcp",
				"description": "查看指定的监视器（TCP被动）配置",
				"operationId": "get_service_monitor_passive_tcp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_tcp_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-passive-tcp",
				"description": "新建指定的监视器（TCP被动）配置",
				"operationId": "create_service_monitor_passive_tcp",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-TCP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_tcp_object"
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-passive-tcp",
				"description": "修改指定的监视器（TCP被动）配置",
				"operationId": "replace_service_monitor_passive_tcp",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-TCP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_tcp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-passive-tcp",
				"description": "修改指定的监视器（TCP被动）配置",
				"operationId": "edit_service_monitor_passive_tcp",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-TCP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_tcp_object"
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-passive-tcp",
				"description": "删除指定的监视器（TCP被动）配置",
				"operationId": "delete_service_monitor_passive_tcp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_tcp_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-PASSIVE-TCP-CONFIG": {
			"name": "SERVICE-MONITOR-PASSIVE-TCP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_passive_tcp"
			}
		},
		"SERVICE-MONITOR-PASSIVE-TCP-PROPERTY": {
			"name": "SERVICE-MONITOR-PASSIVE-TCP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_passive_tcp"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_passive_tcp_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_passive_tcp_list"
			}
		},
		"operation_config_service_monitor_passive_tcp_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_passive_tcp"
			}
		}
	},
	"definitions": {
		"config.service_monitor_passive_tcp_list": {
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
						"$ref": "#/definitions/config.service_monitor_passive_tcp"
					}
				}
			}
		},
		"config.service_monitor_passive_tcp": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定监视器的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "只读参数；监视器类型。",
					"type": "string",
					"enum": [
						"PASSIVE-TCP"
					],
					"default": "PASSIVE-TCP"
				},
				"debug_mode": {
					"description": "可选参数；调试模式开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"statistical_time": {
					"description": "可选参数;指定统计时间,取值范围为[1,255],默认为10",
					"type": "integer",
					"default": 10,
					"maximum": 255,
					"minimum": 1,
					"example": 10
				},
				"statistical_object": {
					"description": "可选参数;指定监视类型,包括rst-packet和zero-window,默认为rst-packet",
					"type": "string",
					"enum": [
						"RST-PACKET",
						"ZERO-WINDOW"
					],
					"default": "RST-PACKET"
				},
				"rst_packet_threshold": {
					"description": "可选参数;指定RST关闭连接上限,取值范围为[1,4294967295],默认为100000",
					"type": "integer",
					"default": 100000,
					"maximum": 4294967295,
					"minimum": 1,
					"example": 100000
				},
				"zero_window_percent": {
					"description": "可选参数;指定零窗口数据包百分比,取值范围为[1,100],默认为40,单位为%",
					"type": "integer",
					"default": 40,
					"maximum": 100,
					"minimum": 1,
					"example": 40
				},
				"action": {
					"description": "可选参数;指定异常动作,包括busy-protect和set-offline,默认为busy-protect",
					"type": "string",
					"enum": [
						"BUSY-PROTECT",
						"SET-OFFLINE"
					],
					"default": "BUSY-PROTECT",
					"example": "BUSY-PROTECT"
				},
				"busy_protect": {
					"description": "可选参数;指定过载保护相关属性：protect_time表示保护时间,retry_time表示尝试次数,set_offline_when_protect_fail表示经过指定尝试次数后是否将节点置为离线",
					"type": "object",
					"required": [],
					"properties": {
						"protect_time": {
							"description": "保护时间",
							"type": "integer",
							"default": 30,
							"maximum": 3600,
							"minimum": 1,
							"example": 30
						},
						"retry_times": {
							"description": "尝试次数",
							"type": "integer",
							"default": 4,
							"maximum": 255,
							"minimum": 1,
							"example": 4
						},
						"set_offline_when_protect_fail": {
							"description": "过载保护无效后节点离线",
							"type": "string",
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