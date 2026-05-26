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
		"/api/ad/v3/sys/report-mail": {
			"description": "查看、修改报表自动生成配置",
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
					"report-mail"
				],
				"summary": "get report-mail",
				"description": "查看当前已有的报表自动生成配置信息",
				"operationId": "get_report_mail",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_mail_object"
					}
				}
			},
			"put": {
				"tags": [
					"report-mail"
				],
				"summary": "replace report-mail",
				"description": "修改报表自动生成配置",
				"operationId": "replace_report_mail",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-MAIL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_mail_object"
					}
				}
			},
			"patch": {
				"tags": [
					"report-mail"
				],
				"summary": "modify report-mail",
				"description": "修改报表自动生成配置",
				"operationId": "edit_report_mail",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-MAIL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_mail_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys report-mail",
					"description": "查看报表"
				},
				{
					"command": "modify sys report-mail smtp test mail_from adc@example.com receipt_to abc@ex.com title test",
					"description": "配置报表自动生成设置，配置stmp服务器为test, 邮件发送方为adc@example.com， 邮件接收方为abc@ex.com，标题为test"
				}
			]
		}
	},
	"parameters": {
		"REPORT-MAIL-CONFIG": {
			"name": "REPORT-MAIL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.report_mail"
			}
		},
		"REPORT-MAIL-PROPERTY": {
			"name": "REPORT-MAIL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.report_mail"
			}
		}
	},
	"responses": {
		"operation_config_report_mail_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.report_mail"
			}
		}
	},
	"definitions": {
		"config.report_mail": {
			"type": "object",
			"properties": {
				"smtp": {
					"description": "可选参数；指定stmp服务器，默认值为none",
					"type": "string",
					"default": "NONE",
					"example": "NONE | {SMTP}"
				},
				"title": {
					"type": "string",
					"example": "DC_operate_report",
					"description": "可选参数；指定邮件标题",
					"maxLength": 255,
					"minLength": 0
				},
				"receipt_to": {
					"description": "可选参数；指定邮件的发送方",
					"type": "string",
					"maxLength": 255,
					"example": "abc@company.com"
				},
				"mail_from": {
					"description": "可选参数；指定邮件的接收方",
					"type": "string",
					"maxLength": 255,
					"example": "abc@company.com"
				}
			}
		}
	}
}