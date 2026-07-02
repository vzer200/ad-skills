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
		"/api/ad/v3/slb/service-monitor/tcp-half-open/": {
			"description": "新建、查看监视器（TCP半连接）配置",
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
				"summary": "get all service-monitor-tcp-half-open",
				"description": "查看当前已有的监视器（TCP半连接）配置信息",
				"operationId": "get_service_monitor_tcp_half_open_list",
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
						"$ref": "#/responses/operation_config_service_monitor_tcp_half_open_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor-tcp-half-open",
						"description": "查看当前已有的监视器（TCP半连接）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/tcp-half-open/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/tcp-half-open/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/tcp-half-open/的响应数据",
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
									"name": "http",
									"description": "example_string",
									"type": "TCP-HALF-OPEN",
									"timeout": 16,
									"interval": 5,
									"err_interval": 2,
									"err_interval_state": "DISABLE",
									"host": "*",
									"port": 0,
									"debug_mode": "DISABLE",
									"gateway_detect": "DISABLE"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-tcp-half-open",
				"description": "新建一个监视器（TCP半连接）配置",
				"operationId": "add_service_monitor_tcp_half_open_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-TCP-HALF-OPEN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_tcp_half_open_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-tcp-half-open",
						"description": "新建一个监视器（TCP半连接）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/tcp-half-open/",
							"body": {
								"name": "AI_http_tcp_half_open_A",
								"type": "TCP-HALF-OPEN",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/tcp-half-open/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/tcp-half-open/的响应数据",
						"value": {
							"name": "AI_http_tcp_half_open_A",
							"description": "example_string",
							"type": "TCP-HALF-OPEN",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor tcp-half-open tcphalf description 半连接监视器 host * port 90 debug_mode enable",
					"description": "新建tcp半连接类型的监视器tcphalf,监视端口为90,启用调试模式"
				},
				{
					"command": "modify slb service-monitor tcp-half-open tcphalf host 4.4.4.4",
					"description": "修改tcp半连接监视器tcphalf的监视主机为4.4.4.4"
				},
				{
					"command": "list slb service-monitor tcp-half-open tcphalf",
					"description": "查看tcp半连接监视器tcphalf的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/tcp-half-open/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（TCP半连接）配置",
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
				"summary": "get specific service-monitor-tcp-half-open",
				"description": "查看指定的监视器（TCP半连接）配置",
				"operationId": "get_service_monitor_tcp_half_open",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_tcp_half_open_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor-tcp-half-open",
						"description": "查看指定的监视器（TCP半连接）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/tcp-half-open/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/tcp-half-open/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/tcp-half-open/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "TCP-HALF-OPEN",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-tcp-half-open",
				"description": "新建指定的监视器（TCP半连接）配置",
				"operationId": "create_service_monitor_tcp_half_open",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-TCP-HALF-OPEN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_tcp_half_open_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-tcp-half-open",
						"description": "新建指定的监视器（TCP半连接）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/tcp-half-open/{name}",
							"body": {
								"name": "AI_http_tcp_half_open_B",
								"type": "TCP-HALF-OPEN",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/tcp-half-open/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/tcp-half-open/{name}的响应数据",
						"value": {
							"name": "AI_http_tcp_half_open_B",
							"description": "example_string",
							"type": "TCP-HALF-OPEN",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE"
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-tcp-half-open",
				"description": "修改指定的监视器（TCP半连接）配置",
				"operationId": "replace_service_monitor_tcp_half_open",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-TCP-HALF-OPEN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_tcp_half_open_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-monitor-tcp-half-open",
						"description": "修改指定的监视器（TCP半连接）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-monitor/tcp-half-open/{name}",
							"body": {
								"name": "http",
								"type": "TCP-HALF-OPEN",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-monitor/tcp-half-open/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-monitor/tcp-half-open/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "TCP-HALF-OPEN",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-tcp-half-open",
				"description": "修改指定的监视器（TCP半连接）配置",
				"operationId": "edit_service_monitor_tcp_half_open",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-TCP-HALF-OPEN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_tcp_half_open_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-monitor-tcp-half-open",
						"description": "修改指定的监视器（TCP半连接）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-monitor/tcp-half-open/{name}",
							"body": {
								"name": "http",
								"type": "TCP-HALF-OPEN",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-monitor/tcp-half-open/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-monitor/tcp-half-open/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "TCP-HALF-OPEN",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-tcp-half-open",
				"description": "删除指定的监视器（TCP半连接）配置",
				"operationId": "delete_service_monitor_tcp_half_open",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_tcp_half_open_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-monitor-tcp-half-open",
						"description": "删除指定的监视器（TCP半连接）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-monitor/tcp-half-open/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-monitor/tcp-half-open/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-monitor/tcp-half-open/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "TCP-HALF-OPEN",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-TCP-HALF-OPEN-CONFIG": {
			"name": "SERVICE-MONITOR-TCP-HALF-OPEN-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_tcp_half_open"
			}
		},
		"SERVICE-MONITOR-TCP-HALF-OPEN-PROPERTY": {
			"name": "SERVICE-MONITOR-TCP-HALF-OPEN-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_tcp_half_open"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_tcp_half_open_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_tcp_half_open_list"
			}
		},
		"operation_config_service_monitor_tcp_half_open_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_tcp_half_open"
			}
		}
	},
	"definitions": {
		"config.service_monitor_tcp_half_open_list": {
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
						"$ref": "#/definitions/config.service_monitor_tcp_half_open"
					}
				}
			}
		},
		"config.service_monitor_tcp_half_open": {
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
						"TCP-HALF-OPEN"
					],
					"default": "TCP-HALF-OPEN"
				},
				"timeout": {
					"description": "可选参数；设置监视超时时间。",
					"type": "integer",
					"default": 16,
					"minimum": 1,
					"maximum": 86400,
					"example": 16
				},
				"interval": {
					"description": "可选参数；设置监视间隔时间。",
					"type": "integer",
					"default": 5,
					"minimum": 1,
					"maximum": 86400,
					"example": 5
				},
				"err_interval": {
					"description": "故障间隔时间。",
					"type": "integer",
					"default": 2,
					"example": 2,
					"maximum": 86400,
					"minimum": 1
				},
				"err_interval_state": {
					"description": "故障间隔开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"host": {
					"description": "可选参数；支持ip地址和*;默认为*，表示监视节点池中的地址；当启用gateway_detect时必须指定ip地址",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "可选参数；指定监视端口；取值范围[0,65535]，默认为0，表示使用节点池中节点的端口",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 0
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
				"gateway_detect": {
					"description": "可选参数；透明监控开关，disable表示禁用，enable表示启用；默认禁用。",
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