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
		"/api/ad/v3/slb/service-monitor/passive-http/": {
			"description": "新建、查看监视器（HTTP被动）配置",
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
				"summary": "get all service-monitor-passive-http",
				"description": "查看当前已有的监视器（HTTP被动）配置信息",
				"operationId": "get_service_monitor_passive_http_list",
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
						"$ref": "#/responses/operation_config_service_monitor_passive_http_list"
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-passive-http",
				"description": "新建一个监视器（HTTP被动）配置",
				"operationId": "add_service_monitor_passive_http_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-HTTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_http_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor passive-http passivehttp http_url_samples add [ www.test.com/index.html www.sangfor.com/index.html ] abnormal_status_codes add [ 404 500 ]  http_response_timeout 60 http_statistical_time 5 abnormal_http_response_threshold 100000 debug_mode enable",
					"description": "新建HTTP被动监视器passivehttp,监控url包括www.test.com/index.html和www.sangfor.com/index.html,统计异常状态码404和500,响应超时时间为60s,5秒钟内异常上限为100000"
				},
				{
					"command": "modify slb service-monitor passive-http passivehttp abnormal_status_codes delete [ 500 ]",
					"description": "去掉被动监视器passivehttp监控500状态码"
				},
				{
					"command": "list slb service-monitor passive-http passivehttp",
					"description": "查看passive-http监视器passivehttp的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/passive-http/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（HTTP被动）配置",
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
				"summary": "get specific service-monitor-passive-http",
				"description": "查看指定的监视器（HTTP被动）配置",
				"operationId": "get_service_monitor_passive_http",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_http_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-passive-http",
				"description": "新建指定的监视器（HTTP被动）配置",
				"operationId": "create_service_monitor_passive_http",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-HTTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_http_object"
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-passive-http",
				"description": "修改指定的监视器（HTTP被动）配置",
				"operationId": "replace_service_monitor_passive_http",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-HTTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_http_object"
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-passive-http",
				"description": "修改指定的监视器（HTTP被动）配置",
				"operationId": "edit_service_monitor_passive_http",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-PASSIVE-HTTP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_http_object"
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-passive-http",
				"description": "删除指定的监视器（HTTP被动）配置",
				"operationId": "delete_service_monitor_passive_http",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_passive_http_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-PASSIVE-HTTP-CONFIG": {
			"name": "SERVICE-MONITOR-PASSIVE-HTTP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_passive_http"
			}
		},
		"SERVICE-MONITOR-PASSIVE-HTTP-PROPERTY": {
			"name": "SERVICE-MONITOR-PASSIVE-HTTP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_passive_http"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_passive_http_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_list"
			}
		},
		"operation_config_service_monitor_passive_http_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_passive_http"
			}
		}
	},
	"definitions": {
		"config.service_monitor_list": {
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
						"$ref": "#/definitions/config.service_monitor"
					}
				}
			}
		},
		"config.service_monitor_passive_http": {
			"type": "object",
			"required": [
				"name",
				"http_url_samples"
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
						"PASSIVE-HTTP"
					],
					"default": "PASSIVE-HTTP"
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
				"http_url_samples": {
					"description": "必选参数；指定需要监控的url列表,最多支持10个",
					"type": "array",
					"items": {
						"type": "string",
						"description": "检查URL",
						"minLength": 1,
						"maxLength": 1024,
						"example": "www.test.com/index.html"
					},
					"minItems": 1,
					"maxItems": 10
				},
				"abnormal_status_codes": {
					"description": "可选参数；指定需要监控的异常状态码,最多支持10个",
					"type": "array",
					"items": {
						"type": "integer",
						"description": "响应状态码",
						"maximum": 599,
						"minimum": 100,
						"example": 404
					},
					"maxItems": 10,
					"example": [
						404,
						502
					]
				},
				"http_response_timeout": {
					"description": "可选参数;指定响应超时时间,默认为5s",
					"type": "integer",
					"default": 5,
					"maximum": 255,
					"minimum": 1,
					"example": 5
				},
				"http_statistical_time": {
					"description": "可选参数;指定异常统计时长,取值范围为[1, 5],默认为1,单位为s",
					"type": "integer",
					"enum": [
						1,
						2,
						3,
						4,
						5
					],
					"default": 1,
					"example": 1
				},
				"abnormal_http_response_threshold": {
					"description": "可选参数;指定异常url上限,取值范围为[1, 4294967295],默认为10000",
					"type": "integer",
					"default": 10000,
					"maximum": 4294967295,
					"minimum": 1,
					"example": 10000
				}
			}
		}
	}
}