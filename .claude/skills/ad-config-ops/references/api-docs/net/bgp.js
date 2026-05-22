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
		"/api/ad/v3/net/bgp": {
			"description": "bgp动态路由配置管理",
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
					"bgp"
				],
				"summary": "get bgp",
				"description": "获取bgp动态路由配置",
				"operationId": "get_bgp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bgp_object"
					}
				}
			},
			"put": {
				"tags": [
					"bgp"
				],
				"summary": "replace bgp",
				"description": "修改bgp动态路由配置",
				"operationId": "replace_bgp",
				"parameters": [
					{
						"$ref": "#/parameters/BGP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bgp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"bgp"
				],
				"summary": "modify bgp",
				"description": "修改bgp动态路由配置",
				"operationId": "edit_bgp",
				"parameters": [
					{
						"$ref": "#/parameters/BGP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bgp_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net bgp",
					"description": "查看bgp配置信息"
				},
				{
					"command": "modify net bgp networks [ 192.168.2.200/24 ]",
					"description": "bgp修改发布网段为192.168.2.200/24"
				}
			]
		}
	},
	"parameters": {
		"BGP-CONFIG": {
			"name": "BGP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.bgp"
			}
		},
		"BGP-PROPERTY": {
			"name": "BGP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.bgp"
			}
		}
	},
	"responses": {
		"operation_config_bgp_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.bgp"
			}
		}
	},
	"definitions": {
		"config.bgp": {
			"type": "object",
			"properties": {
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "bgp配置状态,enable 表示启用;disable 表示禁用。",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"route_id": {
					"type": "string",
					"description": "路由器ID，必须为IPv4地址格式。",
					"example": "6.6.6.6"
				},
				"as_number": {
					"type": "integer",
					"description": "as号，必须为1~4294967295之间的整数。",
					"example": 174,
					"maximum": 4294967295,
					"minimum": 1
				},
				"redistribute_direct_route": {
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
					"description": "ospf路由重分发状态,enable 表示启用;disable 表示禁用。",
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"neighbors": {
					"description": "邻接配置列表",
					"type": "array",
					"items": {
						"type": "object",
						"description": "单个邻居配置",
						"required": [
							"ip",
							"as_number"
						],
						"properties": {
							"ip": {
								"type": "string",
								"description": "邻居ip，必须为IPv4地址格式。",
								"example": "1.1.1.1"
							},
							"as_number": {
								"type": "integer",
								"description": "邻居as号，必须为1~4294967295之间的整数。",
								"example": 101,
								"maximum": 4294967295,
								"minimum": 1
							}
						}
					},
					"maxItems": 16
				},
				"networks": {
					"description": "运行网段配置列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "发布网段元素列表，必须为 IPv4地址/掩码 格式。",
						"example": "1.1.1.0/24"
					},
					"example": [
						"1.1.1.0/24",
						"2.2.2.0/24"
					],
					"maxItems": 64
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