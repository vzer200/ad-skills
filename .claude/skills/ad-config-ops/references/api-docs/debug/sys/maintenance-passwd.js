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
		"/api/ad/v3/debug/sys/maintenance-passwd": {
			"description": "后台维护密码操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"maintenance-passwd"
				],
				"summary": "maintenance-passwd",
				"description": "修改后台维护密码",
				"operationId": "maintenance_passwd",
				"parameters": [
					{
						"$ref": "#/parameters/maintenance-passwd"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_maintenance_passwd"
					}
				}
			},
			"get": {
				"tags": [
					"maintenance-passwd"
				],
				"summary": "maintenance-passwd",
				"description": "查询是否设置后台维护密码",
				"operationId": "maintenance_passwd",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_maintenance_passwd"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys maintenance-passwd username admin password test ssh_password test",
					"description": "使用用户名admin密码test设置后台ssh密码为test"
				}
			]
		}
	},
	"parameters": {
		"maintenance-passwd": {
			"name": "maintenance-passwd",
			"in": "body",
			"required": true,
			"description": "JSON maintenance-passwd Properties",
			"schema": {
				"$ref": "#/definitions/debug.maintenance-passwd"
			}
		}
	},
	"responses": {
		"operation_debug_maintenance_passwd": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.maintenance_passwd_result"
			}
		}
	},
	"definitions": {
		"debug.maintenance-passwd": {
			"type": "object",
			"properties": {
				"username": {
					"type": "string",
					"example": "admin",
					"description": "验证系统用户名"
				},
				"password": {
					"type": "string",
					"example": "test",
					"description": "验证系统明文密码，password和pk_password二者必选其一",
					"writeOnly": true
				},
				"pk_password": {
					"type": "string",
					"example": "rnvL3VOlD",
					"description": "验证系统加密密码，password和pk_password二者必选其一",
					"writeOnly": true
				},
				"ssh_password": {
					"type": "string",
					"example": "test",
					"description": "验证系统明文密码，ssh_password和pk_ssh_password二者必选其一",
					"maxLength": 64,
					"minLength": 8
				},
				"pk_ssh_password": {
					"type": "string",
					"example": "rnvL3VOlD",
					"description": "验证系统加密密码，ssh_password和pk_ssh_password二者必选其一",
					"writeOnly": true
				}
			}
		},
		"debug.maintenance_passwd_result": {
			"type": "object",
			"properties": {
				"has_set_passwd": {
					"type": "string",
					"example": "false",
					"description": "后台是否设置密码"
				}
			}
		}
	}
}