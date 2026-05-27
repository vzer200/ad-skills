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
		"/api/ad/v3/slb/service-monitor/monitor-expression/": {
			"description": "新建、查看监视器（复合监视器）配置",
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
				"summary": "get all service-monitor-monitor-expression",
				"description": "查看当前已有的监视器（复合监视器）配置信息",
				"operationId": "get_service_monitor_monitor_expression_list",
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
						"$ref": "#/responses/operation_config_service_monitor_monitor_expression_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor-monitor-expression",
						"description": "查看当前已有的监视器（复合监视器）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/monitor-expression/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/monitor-expression/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/monitor-expression/的响应数据",
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
									"type": "MONITOR-EXPRESSION",
									"debug_mode": "DISABLE",
									"monitor_expression": "ping AND http_8080"
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
				"summary": "create new service-monitor-monitor-expression",
				"description": "新建一个监视器（复合监视器）配置",
				"operationId": "add_service_monitor_monitor_expression_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-MONITOR-EXPRESSION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_monitor_expression_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-monitor-expression",
						"description": "新建一个监视器（复合监视器）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/monitor-expression/",
							"body": {
								"name": "AI_http_monitor_expression_A",
								"type": "MONITOR-EXPRESSION",
								"debug_mode": "DISABLE",
								"monitor_expression": "ping AND http2"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/monitor-expression/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/monitor-expression/的响应数据",
						"value": {
							"name": "AI_http_monitor_expression_A",
							"description": "example_string",
							"type": "MONITOR-EXPRESSION",
							"debug_mode": "DISABLE",
							"monitor_expression": "ping AND http_8080"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor monitor-expression abc  monitor_expression  '(ping AND http) OR https' debug_mode enable",
					"description": "新建复合监视器abc,启用调试模式,监控表达式为(ping AND http) OR https"
				},
				{
					"command": "modify slb service-monitor monitor-expression abc debug_mode disable",
					"description": "禁用监视器的调试模式"
				},
				{
					"command": "list slb service-monitor monitor-expression abc",
					"description": "查看复合监视器abc的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/monitor-expression/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（复合监视器）配置",
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
				"summary": "get specific service-monitor-monitor-expression",
				"description": "查看指定的监视器（复合监视器）配置",
				"operationId": "get_service_monitor_monitor_expression",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_monitor_expression_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor-monitor-expression",
						"description": "查看指定的监视器（复合监视器）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/monitor-expression/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/monitor-expression/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/monitor-expression/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "MONITOR-EXPRESSION",
							"debug_mode": "DISABLE",
							"monitor_expression": "ping AND http_8080"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-monitor-expression",
				"description": "新建指定的监视器（复合监视器）配置",
				"operationId": "create_service_monitor_monitor_expression",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-MONITOR-EXPRESSION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_monitor_expression_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-monitor-expression",
						"description": "新建指定的监视器（复合监视器）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/monitor-expression/{name}",
							"body": {
								"name": "AI_http_monitor_expression_B",
								"type": "MONITOR-EXPRESSION",
								"debug_mode": "DISABLE",
								"monitor_expression": "ping AND http2"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/monitor-expression/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/monitor-expression/{name}的响应数据",
						"value": {
							"name": "AI_http_monitor_expression_B",
							"description": "example_string",
							"type": "MONITOR-EXPRESSION",
							"debug_mode": "DISABLE",
							"monitor_expression": "ping AND http_8080"
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-monitor-expression",
				"description": "修改指定的监视器（复合监视器）配置",
				"operationId": "replace_service_monitor_monitor_expression",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-MONITOR-EXPRESSION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_monitor_expression_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-monitor-monitor-expression",
						"description": "修改指定的监视器（复合监视器）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-monitor/monitor-expression/{name}",
							"body": {
								"name": "http",
								"type": "MONITOR-EXPRESSION",
								"debug_mode": "DISABLE",
								"monitor_expression": "ping AND http2"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-monitor/monitor-expression/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-monitor/monitor-expression/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "MONITOR-EXPRESSION",
							"debug_mode": "DISABLE",
							"monitor_expression": "ping AND http_8080"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-monitor-expression",
				"description": "修改指定的监视器（复合监视器）配置",
				"operationId": "edit_service_monitor_monitor_expression",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-MONITOR-EXPRESSION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_monitor_expression_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-monitor-monitor-expression",
						"description": "修改指定的监视器（复合监视器）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-monitor/monitor-expression/{name}",
							"body": {
								"name": "http",
								"type": "MONITOR-EXPRESSION",
								"debug_mode": "DISABLE",
								"monitor_expression": "ping AND http2"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-monitor/monitor-expression/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-monitor/monitor-expression/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "MONITOR-EXPRESSION",
							"debug_mode": "DISABLE",
							"monitor_expression": "ping AND http_8080"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-monitor-expression",
				"description": "删除指定的监视器（复合监视器）配置",
				"operationId": "delete_service_monitor_monitor_expression",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_monitor_expression_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-monitor-monitor-expression",
						"description": "删除指定的监视器（复合监视器）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-monitor/monitor-expression/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-monitor/monitor-expression/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-monitor/monitor-expression/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "MONITOR-EXPRESSION",
							"debug_mode": "DISABLE",
							"monitor_expression": "ping AND http_8080"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-MONITOR-EXPRESSION-CONFIG": {
			"name": "SERVICE-MONITOR-MONITOR-EXPRESSION-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_monitor_expression"
			}
		},
		"SERVICE-MONITOR-MONITOR-EXPRESSION-PROPERTY": {
			"name": "SERVICE-MONITOR-MONITOR-EXPRESSION-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_monitor_expression"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_monitor_expression_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_monitor_expression_list"
			}
		},
		"operation_config_service_monitor_monitor_expression_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_monitor_expression"
			}
		}
	},
	"definitions": {
		"config.service_monitor_monitor_expression_list": {
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
						"$ref": "#/definitions/config.service_monitor_monitor_expression"
					}
				}
			}
		},
		"config.service_monitor_monitor_expression": {
			"type": "object",
			"required": [
				"name",
				"monitor_expression"
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
						"MONITOR-EXPRESSION"
					],
					"default": "MONITOR-EXPRESSION"
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
				"monitor_expression": {
					"description": "必选参数；指定监视器的结果计算表达式",
					"type": "string",
					"example": "ping AND http_8080"
				}
			}
		}
	}
}