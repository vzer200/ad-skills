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
		"/api/ad/v3/net/ospf": {
			"description": "ospf全局配置相关操作",
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
					"ospf"
				],
				"summary": "get ospf",
				"description": "获取ospf全局配置",
				"operationId": "get_ospf",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_object"
					}
				}
			},
			"put": {
				"tags": [
					"ospf"
				],
				"summary": "replace ospf",
				"description": "修改ospf全局配置",
				"operationId": "replace_ospf",
				"parameters": [
					{
						"$ref": "#/parameters/OSPF-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ospf"
				],
				"summary": "modify ospf",
				"description": "修改ospf全局配置",
				"operationId": "edit_ospf",
				"parameters": [
					{
						"$ref": "#/parameters/OSPF-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net ospf",
					"description": "查看ospf全局配置信息"
				},
				{
					"command": "modify net ospf networks add [ 192.168.2.200/24 ]",
					"description": "ospf全局配置添加一个运行网段192.168.2.200/24"
				}
			]
		}
	},
	"parameters": {
		"OSPF-CONFIG": {
			"name": "OSPF-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ospf"
			}
		},
		"OSPF-PROPERTY": {
			"name": "OSPF-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ospf"
			}
		}
	},
	"responses": {
		"operation_config_ospf_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ospf"
			}
		}
	},
	"definitions": {
		"config.ospf": {
			"type": "object",
			"properties": {
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "ospf全局配置状态,enable 表示启用;disable 表示禁用。",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"route_id": {
					"type": "string",
					"description": "路由器ID，必须为IPv4地址格式。",
					"example": "6.6.6.6"
				},
				"area_id": {
					"type": "string",
					"description": "区域id，必须为字符串类型的0~4294967295之间的整数或点分十进制。",
					"example": "0",
					"default": "0"
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
				"redistribute_rip": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "RIP路由重分发状态,enable 表示启用;disable 表示禁用。",
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"metric_type_1_value": {
					"type": "integer",
					"description": "metric type1是的metric值，必须为0~16777214之间的整数。",
					"example": 10,
					"maximum": 16777214,
					"minimum": 0
				},
				"networks": {
					"description": "ospf发布网段列表",
					"type": "array",
					"items": {
						"type": "string",
						"example": "1.1.1.0/24",
						"description": "发布网段元素列表，必须为 IPv4地址/掩码 格式。"
					},
					"example": [
						"1.1.1.0/24",
						"2.2.2.0/24"
					],
					"maxItems": 16
				},
				"connected_route_redispatch": {
					"description": "直连路由重分发",
					"__format__description__": "合法输入为ENABLE和DISABLE",
					"title": "直连路由重分发",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"metric_type": {
					"description": "metric type",
					"__format__description__": "合法输入为1或者2",
					"title": "Metric-type",
					"type": "integer",
					"default": 2,
					"maximum": 2,
					"minimum": 1,
					"example": 1
				},
				"metric_value": {
					"description": "metric value",
					"__format__description__": "必须为0~65535之间的整数",
					"title": "Metric-value",
					"type": "integer",
					"maximum": 65535,
					"minimum": 0,
					"default": 20,
					"example": 20
				},
				"accept_non_as_route": {
					"description": "接受自治系统外部路由开关",
					"__format__description__": "合法输入为ENABLE和DISABLE",
					"title": "接受自治系统外部路由",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"area_type": {
					"description": "区域类型",
					"__format__description__": "合法输入为NORMAL,STUB,TOTALLY-STUB和NSSA,TOTALLY-NSSA",
					"title": "区域类型",
					"type": "string",
					"enum": [
						"NORMAL",
						"STUB",
						"TOTALLY-STUB",
						"NSSA",
						"TOTALLY-NSSA"
					],
					"default": "NORMAL",
					"example": "NORMAL"
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