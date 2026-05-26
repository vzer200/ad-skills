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
		"/api/ad/v3/net/rip": {
			"description": "rip动态路由全局配置相关操作",
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
					"rip"
				],
				"summary": "get rip",
				"description": "获取rip动态路由全局配置",
				"operationId": "get_rip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_object"
					}
				}
			},
			"put": {
				"tags": [
					"rip"
				],
				"summary": "replace rip",
				"description": "修改rip动态路由全局配置",
				"operationId": "replace_rip",
				"parameters": [
					{
						"$ref": "#/parameters/RIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_object"
					}
				}
			},
			"patch": {
				"tags": [
					"rip"
				],
				"summary": "modify rip",
				"description": "修改rip动态路由全局配置",
				"operationId": "edit_rip",
				"parameters": [
					{
						"$ref": "#/parameters/RIP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net rip",
					"description": "查看rip全局配置信息"
				},
				{
					"command": "modify net rip networks [ 192.162.3.200/24 ]",
					"description": "修改rip全局配置运行网段为192.168.3.200/24"
				}
			]
		}
	},
	"parameters": {
		"RIP-CONFIG": {
			"name": "RIP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.rip"
			}
		},
		"RIP-PROPERTY": {
			"name": "RIP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.rip"
			}
		}
	},
	"responses": {
		"operation_config_rip_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.rip"
			}
		}
	},
	"definitions": {
		"config.rip": {
			"type": "object",
			"required": [
				"state"
			],
			"properties": {
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "rip全局配置状态,enable 表示启用;disable 表示禁用。",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"redistribute_default_route": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "默认路由强制重分发状态,enable 表示启用;disable 表示禁用。",
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"redistribute_static_route": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "静态路由重分发状态,enable 表示启用;disable 表示禁用。",
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"redistribute_ospf": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "OSPF路由重分发状态,enable 表示启用;disable 表示禁用。",
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"networks": {
					"type": "array",
					"description": "发布网段元素列表，必须为 IPv4地址/掩码 格式。",
					"items": {
						"description": "发布网段元素",
						"type": "string",
						"example": "1.1.1.0/24"
					},
					"example": [
						"1.1.1.0/24",
						"2.2.2.0/24"
					],
					"maxItems": 16
				},
				"log_level": {
					"description": "日志等级",
					"__format__description__": "合法输入为NONE,ERR,WARNING,INFO,NOTICE,DEBUG",
					"title": "日志等级",
					"type": "string",
					"enum": [
						"NONE",
						"ERR",
						"WARNING",
						"INFO",
						"NOTICE",
						"DEBUG"
					],
					"default": "INFO",
					"example": "NONE"
				}
			}
		}
	}
}