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
		"/api/ad/v3/debug/sys/smtp/verify": {
			"description": "测试SMTP服务器",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"smtp"
				],
				"summary": "smtp verify",
				"description": "测试SMTP服务器",
				"operationId": "smtp_verify",
				"parameters": [
					{
						"$ref": "#/parameters/SMTP-DEBUG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_smtp_verify"
					}
				},
				"x-examples": {
					"request": {
						"summary": "smtp verify",
						"description": "测试SMTP服务器",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/sys/smtp/verify",
							"body": {
								"port": 25
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/sys/smtp/verify 响应",
						"description": "返回POST /api/ad/v3/debug/sys/smtp/verify的响应数据",
						"value": {
							"result": "FAILED",
							"description": "描述"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys smtp verify",
					"description": "测试SMTP服务器"
				}
			]
		}
	},
	"parameters": {
		"SMTP-DEBUG": {
			"name": "SMTP-DEBUG",
			"in": "body",
			"required": true,
			"description": "JSON Debug Properties",
			"schema": {
				"$ref": "#/definitions/debug.smtp_verify"
			}
		}
	},
	"responses": {
		"operation_debug_smtp_verify": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.smtp_verify_result"
			}
		}
	},
	"definitions": {
		"debug.smtp_verify": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"example": "smtp_oa_mail",
					"description": "名称, 长度限制为1~511个字节,不能包含& |  , % < > / \\等特殊字符以及首尾或连续空格,且不能为none、all、auto等关键字"
				},
				"ip_address": {
					"type": "string",
					"example": "192.168.1.102",
					"description": "服务器ip地址"
				},
				"port": {
					"type": "integer",
					"default": 25,
					"example": 25,
					"description": "服务器端口",
					"maximum": 65535,
					"minimum": 1
				},
				"authentication": {
					"type": "object",
					"description": "验证信息",
					"properties": {
						"state": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE",
							"description": "启禁用"
						},
						"username": {
							"type": "string",
							"example": "abc123@xyz.com",
							"description": "用户名",
							"minLength": 0,
							"maxLength": 63
						},
						"password": {
							"type": "string",
							"writeOnly": true,
							"example": "",
							"description": "密码，可选参数，但与pk_password与encrypted_password三者必有其一",
							"minLength": 0,
							"maxLength": 49
						},
						"encrypted_password": {
							"type": "string",
							"example": "A1B2C3D4",
							"description": "密码密文，可选参数，但与pk_password与password三者必有其一"
						},
						"pk_password": {
							"type": "string",
							"example": "A1B2C3D4",
							"description": "密码密文，可选参数，但与password与encrypted_password三者必有其一"
						}
					}
				}
			}
		},
		"debug.smtp_verify_result": {
			"type": "object",
			"required": [
				"ip_address"
			],
			"properties": {
				"result": {
					"type": "string",
					"enum": [
						"SUCCESS",
						"FAILED"
					],
					"example": "FAILED",
					"description": "结果"
				},
				"description": {
					"type": "string",
					"example": "描述",
					"description": "描述信息"
				}
			}
		}
	}
}