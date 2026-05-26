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
		"/api/ad/v3/sys/alert-trap": {
			"description": "查看、修改SNMP Traps告警配置",
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
					"alert-trap"
				],
				"summary": "get alert-trap",
				"description": "查看当前已有的SNMP Traps告警配置信息",
				"operationId": "get_alert_trap",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_trap_object"
					}
				}
			},
			"put": {
				"tags": [
					"alert-trap"
				],
				"summary": "replace alert-trap",
				"description": "修改SNMP Traps告警配置",
				"operationId": "replace_alert_trap",
				"parameters": [
					{
						"$ref": "#/parameters/ALERT-TRAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_trap_object"
					}
				}
			},
			"patch": {
				"tags": [
					"alert-trap"
				],
				"summary": "modify alert-trap",
				"description": "修改SNMP Traps告警配置",
				"operationId": "edit_alert_trap",
				"parameters": [
					{
						"$ref": "#/parameters/ALERT-TRAP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_trap_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys alert-trap state enable event { cpu_usage { state enable threshold_percent 80 persist 60 } } interval 3600",
					"description": "修改SNMP Traps告警配置，设置状态为启用，当cpu使用率达到80%并持续60s触发告警，告警间隔为3600s"
				},
				{
					"command": "modify sys alert-trap state enable event { cpu_usage { state enable threshold_percent 80 persist 60 } } interval 3600",
					"description": "查看SNMP Traps告警配置"
				}
			]
		}
	},
	"parameters": {
		"ALERT-TRAP-CONFIG": {
			"name": "ALERT-TRAP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.alert_trap"
			}
		},
		"ALERT-TRAP-PROPERTY": {
			"name": "ALERT-TRAP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.alert_trap"
			}
		}
	},
	"responses": {
		"operation_config_alert_trap_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.alert_trap"
			}
		}
	},
	"definitions": {
		"config.alert_trap": {
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
					"$ref": "/api/{common}.yaml#/definitions/config.alert_event"
				},
				"interval": {
					"description": "告警间隔（1分钟-30天，单位为妙）",
					"type": "integer",
					"default": 21600,
					"maximum": 2592000,
					"minimum": 0
				}
			}
		}
	}
}