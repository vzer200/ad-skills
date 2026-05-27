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
		"/api/ad/v3/slb/service-monitor/external-monitor/": {
			"description": "新建、查看监视器（外部监视器）配置",
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
				"summary": "get all service-monitor-external-monitor",
				"description": "查看当前已有的监视器（外部监视器）配置信息",
				"operationId": "get_service_monitor_external_monitor_list",
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
						"$ref": "#/responses/operation_config_service_monitor_external_monitor_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor-external-monitor",
						"description": "查看当前已有的监视器（外部监视器）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/external-monitor/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/external-monitor/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/external-monitor/的响应数据",
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
									"type": "EXTERNAL-MONITOR",
									"timeout": 16,
									"interval": 5,
									"err_interval": 2,
									"err_interval_state": "DISABLE",
									"debug_mode": "DISABLE",
									"cli_command": "/usr/bin/check_app_each_thread.py"
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
				"summary": "create new service-monitor-external-monitor",
				"description": "新建一个监视器（外部监视器）配置",
				"operationId": "add_service_monitor_external_monitor_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-EXTERNAL-MONITOR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_external_monitor_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-external-monitor",
						"description": "新建一个监视器（外部监视器）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/external-monitor/",
							"body": {
								"name": "AI_http_external_monitor_A",
								"type": "EXTERNAL-MONITOR",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"debug_mode": "DISABLE",
								"cli_command": "/usr/bin/check_app_each_thread.py"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/external-monitor/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/external-monitor/的响应数据",
						"value": {
							"name": "AI_http_external_monitor_A",
							"description": "example_string",
							"type": "EXTERNAL-MONITOR",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"debug_mode": "DISABLE",
							"cli_command": "/usr/bin/check_app_each_thread.py"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor external-monitor abcd cli_command 'java /usr/ad/monitor/http.class ${rs_ip} ${rs_port}'",
					"description": "新建外部监视器,执行监视语句java /usr/ad/monitor/http.class ${rs_ip} ${rs_port}"
				},
				{
					"command": "modify slb service-monitor external-monitor abcd  debug_mode enable",
					"description": "启用监视器的调试模式"
				},
				{
					"command": "list slb service-monitor external-monitor abcd",
					"description": "查看外部监视器的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/external-monitor/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（外部监视器）配置",
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
				"summary": "get specific service-monitor-external-monitor",
				"description": "查看指定的监视器（外部监视器）配置",
				"operationId": "get_service_monitor_external_monitor",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_external_monitor_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor-external-monitor",
						"description": "查看指定的监视器（外部监视器）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/external-monitor/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/external-monitor/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/external-monitor/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "EXTERNAL-MONITOR",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"debug_mode": "DISABLE",
							"cli_command": "/usr/bin/check_app_each_thread.py"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-external-monitor",
				"description": "新建指定的监视器（外部监视器）配置",
				"operationId": "create_service_monitor_external_monitor",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-EXTERNAL-MONITOR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_external_monitor_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-external-monitor",
						"description": "新建指定的监视器（外部监视器）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/external-monitor/{name}",
							"body": {
								"name": "AI_http_external_monitor_B",
								"type": "EXTERNAL-MONITOR",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"debug_mode": "DISABLE",
								"cli_command": "/usr/bin/check_app_each_thread.py"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/external-monitor/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/external-monitor/{name}的响应数据",
						"value": {
							"name": "AI_http_external_monitor_B",
							"description": "example_string",
							"type": "EXTERNAL-MONITOR",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"debug_mode": "DISABLE",
							"cli_command": "/usr/bin/check_app_each_thread.py"
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-external-monitor",
				"description": "修改指定的监视器（外部监视器）配置",
				"operationId": "replace_service_monitor_external_monitor",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-EXTERNAL-MONITOR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_external_monitor_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-monitor-external-monitor",
						"description": "修改指定的监视器（外部监视器）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-monitor/external-monitor/{name}",
							"body": {
								"name": "http",
								"type": "EXTERNAL-MONITOR",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"debug_mode": "DISABLE",
								"cli_command": "/usr/bin/check_app_each_thread.py"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-monitor/external-monitor/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-monitor/external-monitor/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "EXTERNAL-MONITOR",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"debug_mode": "DISABLE",
							"cli_command": "/usr/bin/check_app_each_thread.py"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-external-monitor",
				"description": "修改指定的监视器（外部监视器）配置",
				"operationId": "edit_service_monitor_external_monitor",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-EXTERNAL-MONITOR-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_external_monitor_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-monitor-external-monitor",
						"description": "修改指定的监视器（外部监视器）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-monitor/external-monitor/{name}",
							"body": {
								"name": "http",
								"type": "EXTERNAL-MONITOR",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"debug_mode": "DISABLE",
								"cli_command": "/usr/bin/check_app_each_thread.py"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-monitor/external-monitor/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-monitor/external-monitor/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "EXTERNAL-MONITOR",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"debug_mode": "DISABLE",
							"cli_command": "/usr/bin/check_app_each_thread.py"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-external-monitor",
				"description": "删除指定的监视器（外部监视器）配置",
				"operationId": "delete_service_monitor_external_monitor",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_external_monitor_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-monitor-external-monitor",
						"description": "删除指定的监视器（外部监视器）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-monitor/external-monitor/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-monitor/external-monitor/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-monitor/external-monitor/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "EXTERNAL-MONITOR",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"debug_mode": "DISABLE",
							"cli_command": "/usr/bin/check_app_each_thread.py"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-EXTERNAL-MONITOR-CONFIG": {
			"name": "SERVICE-MONITOR-EXTERNAL-MONITOR-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_external_monitor"
			}
		},
		"SERVICE-MONITOR-EXTERNAL-MONITOR-PROPERTY": {
			"name": "SERVICE-MONITOR-EXTERNAL-MONITOR-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_external_monitor"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_external_monitor_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_external_monitor_list"
			}
		},
		"operation_config_service_monitor_external_monitor_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_external_monitor"
			}
		}
	},
	"definitions": {
		"config.service_monitor_external_monitor_list": {
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
						"$ref": "#/definitions/config.service_monitor_external_monitor"
					}
				}
			}
		},
		"config.service_monitor_external_monitor": {
			"type": "object",
			"required": [
				"name",
				"cli_command"
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
						"EXTERNAL-MONITOR"
					],
					"default": "EXTERNAL-MONITOR"
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
				"cli_command": {
					"description": "必选参数；指定监视语句,外部脚本必须先上传到后台",
					"type": "string",
					"minLength": 1,
					"maxLength": 1024,
					"example": "/usr/bin/check_app_each_thread.py"
				}
			}
		}
	}
}