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
		"/api/ad/v3/sys/ntp": {
			"description": "查看、修改NTP配置",
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
					"ntp"
				],
				"summary": "get ntp",
				"description": "查看当前已有的NTP配置信息",
				"operationId": "get_ntp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ntp_object"
					}
				}
			},
			"put": {
				"tags": [
					"ntp"
				],
				"summary": "replace ntp",
				"description": "修改NTP配置",
				"operationId": "replace_ntp",
				"parameters": [
					{
						"$ref": "#/parameters/NTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ntp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ntp"
				],
				"summary": "modify ntp",
				"description": "修改NTP配置",
				"operationId": "edit_ntp",
				"parameters": [
					{
						"$ref": "#/parameters/NTP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ntp_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys ntp ntp_preferred 1.1.1.1 interval 5",
					"description": "修改当前NTP配置，设置ntp服务器ip为1.1.1.1，同步间隔为5秒"
				},
				{
					"command": "list sys ntp",
					"description": "查看当前NTP配置信息"
				}
			]
		}
	},
	"parameters": {
		"NTP-CONFIG": {
			"name": "NTP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ntp"
			}
		},
		"NTP-PROPERTY": {
			"name": "NTP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ntp"
			}
		}
	},
	"responses": {
		"operation_config_ntp_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ntp"
			}
		}
	},
	"definitions": {
		"config.ntp": {
			"type": "object",
			"properties": {
				"state": {
					"description": "自动网络时间同步（ENABLE-启用/DISABLE-禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"ntp_preferred": {
					"description": "时间服务器",
					"type": "string",
					"default": "time.nist.gov",
					"example": "time.nist.gov"
				},
				"ntp_alternate": {
					"description": "备份服务器",
					"type": "string",
					"default": "",
					"example": "192.168.10.145"
				},
				"interval": {
					"description": "同步间隔",
					"type": "integer",
					"maximum": 604800,
					"minimum": 1,
					"default": 1800,
					"example": 1800
				},
				"network": {
					"description": "选择的网络",
					"type": "string",
					"enum": [
						"MANAGE_NET",
						"SERVICE_NET",
						"AUTO"
					],
					"default": "AUTO",
					"example": "AUTO"
				}
			}
		}
	}
}