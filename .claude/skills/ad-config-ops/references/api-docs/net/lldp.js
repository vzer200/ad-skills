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
		"/api/ad/v3/net/lldp": {
			"description": "查看、修改lldp全局配置",
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
					"lldp"
				],
				"summary": "get lldp",
				"description": "查看lldp全局配置",
				"operationId": "get_lldp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_lldp_object"
					}
				}
			},
			"put": {
				"tags": [
					"lldp"
				],
				"summary": "replace lldp",
				"description": "替换lldp全局配置",
				"operationId": "replace_lldp",
				"parameters": [
					{
						"$ref": "#/parameters/LLDP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_lldp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"lldp"
				],
				"summary": "modify lldp",
				"description": "修改lldp全局配置",
				"operationId": "edit_lldp",
				"parameters": [
					{
						"$ref": "#/parameters/LLDP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_lldp_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify net lldp  state enable",
					"description": "打开lldp全局开关"
				}
			]
		}
	},
	"parameters": {
		"LLDP-CONFIG": {
			"name": "LLDP-CONFIG",
			"in": "body",
			"required": true,
			"description": "lldp配置",
			"schema": {
				"$ref": "#/definitions/config.lldp"
			}
		},
		"LLDP-PROPERTY": {
			"name": "LLDP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "lldp属性",
			"schema": {
				"$ref": "#/definitions/config.lldp"
			}
		}
	},
	"responses": {
		"operation_config_lldp_object": {
			"description": "lldp配置对象",
			"schema": {
				"$ref": "#/definitions/config.lldp"
			}
		}
	},
	"definitions": {
		"config.lldp": {
			"type": "object",
			"properties": {
				"state": {
					"description": "LLDP状态",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"tx_interval": {
					"description": "消息发送间隔时间",
					"type": "integer",
					"default": 30,
					"maximum": 65535,
					"minimum": 1,
					"example": 30
				},
				"tx_hold": {
					"description": "消息持有时间",
					"type": "integer",
					"default": 4,
					"maximum": 65535,
					"minimum": 1,
					"example": 4
				},
				"max_neighbors": {
					"description": "每接口最大邻居个数",
					"type": "integer",
					"default": 32,
					"maximum": 65535,
					"minimum": 1,
					"example": 32
				}
			}
		}
	}
}