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
		"/api/ad/v3/log/blackbox-log/export": {
			"description": "导出黑盒日志",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"blackbox-log"
				],
				"summary": "export blackbox-log",
				"description": "导出未加密的黑盒日志",
				"operationId": "export_blackbox_log_list",
				"parameters": [
					{
						"$ref": "#/parameters/from"
					},
					{
						"$ref": "#/parameters/to"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			},
			"post": {
				"tags": [
					"blackbox-log"
				],
				"summary": "export encrypted blackbox-log",
				"description": "导出加密的黑盒日志",
				"operationId": "export_encrypted_blackbox_log_list",
				"parameters": [
					{
						"$ref": "#/parameters/blackbox-log-export"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "save log blackbox-log export from 2019-07-01 to 2019-07-02",
					"description": "下载从2019-07-01到2019-07-02的黑盒日志"
				}
			]
		}
	},
	"parameters": {
		"from": {
			"name": "from",
			"in": "query",
			"type": "string",
			"required": false,
			"description": "可选参数；起始时间；格式: YYYY-MM-DD"
		},
		"to": {
			"name": "to",
			"in": "query",
			"type": "string",
			"required": false,
			"description": "可选参数；结束时间；不填写时，默认在起始时间后加7天；格式: YYYY-MM-DD"
		},
		"blackbox-log-export": {
			"name": "blackbox-log-export",
			"in": "body",
			"required": true,
			"description": "导出黑盒配置",
			"schema": {
				"$ref": "#/definitions/config.export_black_box"
			}
		}
	},
	"definitions": {
		"config.export_black_box": {
			"type": "object",
			"properties": {
				"pk_password": {
					"description": "可选参数，但与password必有其一; 加密密码，字符串类型",
					"writeOnly": true,
					"type": "string"
				},
				"password": {
					"description": "可选参数，但与pk_password必有其一; 密码，长度限制为8-64个字符",
					"type": "string",
					"writeOnly": true,
					"maxLength": 64,
					"minLength": 8
				},
				"from": {
					"description": "可选参数；起始时间；格式: YYYY-MM-DD",
					"type": "string",
					"example": "2020-08-15"
				},
				"to": {
					"description": "可选参数；结束时间；不填写时，默认在起始时间后加7天；格式: YYYY-MM-DD",
					"type": "string",
					"example": "2020-08-21"
				}
			}
		}
	}
}