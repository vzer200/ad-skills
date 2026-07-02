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
		"/api/ad/v3/debug/sys/alert-mail/verify": {
			"description": "邮件告警操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"alert-mail"
				],
				"summary": "alert-mail verify",
				"description": "测试邮件告警",
				"operationId": "alert_mail_verify",
				"x-examples": {
					"request": {
						"summary": "alert-mail verify",
						"description": "测试邮件告警",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/sys/alert-mail/verify"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/sys/alert-mail/verify 响应",
						"description": "返回POST /api/ad/v3/debug/sys/alert-mail/verify的响应数据",
						"value": {
							"ok": true
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys alert-mail verify",
					"description": "测试邮件告警"
				}
			]
		}
	}
}