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
		"/api/ad/v3/sys/alert-mail": {
			"description": "查看、修改邮件告警配置",
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
					"alert-mail"
				],
				"summary": "get alert-mail",
				"description": "查看当前已有的邮件告警配置信息",
				"operationId": "get_alert_mail",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_mail_object"
					}
				}
			},
			"put": {
				"tags": [
					"alert-mail"
				],
				"summary": "replace alert-mail",
				"description": "修改邮件告警配置",
				"operationId": "replace_alert_mail",
				"parameters": [
					{
						"$ref": "#/parameters/ALERT-MAIL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_mail_object"
					}
				}
			},
			"patch": {
				"tags": [
					"alert-mail"
				],
				"summary": "modify alert-mail",
				"description": "修改邮件告警配置",
				"operationId": "edit_alert_mail",
				"parameters": [
					{
						"$ref": "#/parameters/ALERT-MAIL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_alert_mail_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys alert-mail state enable event { cpu_usage { state enable threshold_percent 80 persist 60 } log_content_match { state enable keyword alert } } smtp smtp_example title alert_mail mail_from from@sangfor.com receipt_to to@sangfor.com interval 3600",
					"description": "修改邮件告警配置，设置状态为启用，当cpu使用率达到80%并持续60s触发告警，当日志包含关键字alert触发告警，SMTP服务器为smtp_example，邮件标题为alert_mail，发件人为from@sangfor.com，收件人为to@sangfor.com，邮件发送间隔为3600s"
				},
				{
					"command": "list sys alert-mail",
					"description": "查看邮件告警配置"
				}
			]
		}
	},
	"parameters": {
		"ALERT-MAIL-CONFIG": {
			"name": "ALERT-MAIL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.alert_mail"
			}
		},
		"ALERT-MAIL-PROPERTY": {
			"name": "ALERT-MAIL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.alert_mail"
			}
		}
	},
	"responses": {
		"operation_config_alert_mail_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.alert_mail"
			}
		}
	},
	"definitions": {
		"config.alert_mail": {
			"type": "object",
			"properties": {
				"state": {
					"description": "可选参数；启禁用邮件告警，enable表示启用，disable表示禁用，默认为enable",
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
				"smtp": {
					"description": "可选参数；SMTP服务器",
					"type": "string",
					"example": "{smtp}"
				},
				"title": {
					"type": "string",
					"description": "可选参数；告警邮件标题",
					"example": "AD1_Alert",
					"maxLength": 255,
					"minLength": 1
				},
				"receipt_to": {
					"description": "可选参数；收件人",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"example": "abc@company.com"
				},
				"mail_from": {
					"description": "可选参数；发件人",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"example": "abc@company.com"
				},
				"interval": {
					"description": "可选参数；邮件发送频率",
					"type": "integer",
					"default": 60,
					"maximum": 3600,
					"minimum": 1,
					"example": 60
				}
			}
		}
	}
}