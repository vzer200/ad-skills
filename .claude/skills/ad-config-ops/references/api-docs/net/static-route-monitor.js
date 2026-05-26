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
		"/api/ad/v3/net/static-route-monitor": {
			"description": "静态路由监视器配置相关操作",
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
					"static-route-monitor"
				],
				"summary": "get static-route-monitor",
				"description": "获取静态路由监视器配置",
				"operationId": "get_static_route_monitor",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_static_route_monitor_object"
					}
				}
			},
			"put": {
				"tags": [
					"static-route-monitor"
				],
				"summary": "replace static-route-monitor",
				"description": "修改静态路由监视器配置",
				"operationId": "replace_static_route_monitor",
				"parameters": [
					{
						"$ref": "#/parameters/STATIC-ROUTE-MONITOR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_static_route_monitor_object"
					}
				}
			},
			"patch": {
				"tags": [
					"static-route-monitor"
				],
				"summary": "modify static-route-monitor",
				"description": "修改静态路由监视器配置",
				"operationId": "edit_static_route_monitor",
				"parameters": [
					{
						"$ref": "#/parameters/STATIC-ROUTE-MONITOR-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_static_route_monitor_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net static-route-monitor",
					"description": "查看静态路由监视器配置信息"
				},
				{
					"command": " modify net static-route-monitor arp_response_timeout 3",
					"description": "修改静态路由监视器健康参数应答超时时间为3"
				}
			]
		}
	},
	"parameters": {
		"STATIC-ROUTE-MONITOR-CONFIG": {
			"name": "STATIC-ROUTE-MONITOR-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.static_route_monitor"
			}
		},
		"STATIC-ROUTE-MONITOR-PROPERTY": {
			"name": "STATIC-ROUTE-MONITOR-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.static_route_monitor"
			}
		}
	},
	"responses": {
		"operation_config_static_route_monitor_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.static_route_monitor"
			}
		}
	},
	"definitions": {
		"config.static_route_monitor": {
			"type": "object",
			"required": [
				"arp_response_timeout",
				"arp_request_interval"
			],
			"properties": {
				"arp_response_timeout": {
					"description": "应答超时时间",
					"type": "integer",
					"default": 16,
					"example": 16,
					"maximum": 255,
					"minimum": 1
				},
				"arp_request_interval": {
					"description": "ARP探测间隔",
					"type": "integer",
					"default": 5,
					"example": 5,
					"maximum": 255,
					"minimum": 1
				}
			}
		}
	}
}