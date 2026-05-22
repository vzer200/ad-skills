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
		"/api/ad/v3/sys/alert-ras": {
			"description": "查看、修改RAS告警配置",
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
					"alert-ras"
				],
				"summary": "get alert-ras",
				"description": "查看当前已有的RAS告警配置信息",
				"operationId": "get_alert_ras",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_ras_object"
					}
				}
			},
			"put": {
				"tags": [
					"alert-ras"
				],
				"summary": "replace alert-ras",
				"description": "修改RAS告警配置",
				"operationId": "replace_alert_ras",
				"parameters": [
					{
						"$ref": "#/parameters/ALERT-RAS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_ras_object"
					}
				}
			},
			"patch": {
				"tags": [
					"alert-ras"
				],
				"summary": "modify alert-ras",
				"description": "修改RAS告警配置",
				"operationId": "edit_alert_ras",
				"parameters": [
					{
						"$ref": "#/parameters/ALERT-RAS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_ras_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys alert-ras state enable event { pcie_failure enable memory_failure enable }",
					"description": "修改RAS告警配置，设置状态为启用，启用PCIE设备告警，启用内存故障告警"
				},
				{
					"command": "list sys alert-ras",
					"description": "查看RAS告警配置"
				}
			]
		}
	},
	"parameters": {
		"ALERT-RAS-CONFIG": {
			"name": "ALERT-RAS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.alert_ras"
			}
		},
		"ALERT-RAS-PROPERTY": {
			"name": "ALERT-RAS-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.alert_ras"
			}
		}
	},
	"responses": {
		"operation_config_alert_ras_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.alert_ras"
			}
		}
	},
	"definitions": {
		"config.alert_ras": {
			"type": "object",
			"properties": {
				"state": {
					"description": "可选参数；启禁用Trap告警，enable表示启用，disable表示禁用，默认为enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"event": {
					"description": "可选参数；告警触发事件",
					"$ref": "/api/{common}.yaml#/definitions/config.ras_alert_event"
				}
			}
		}
	}
}