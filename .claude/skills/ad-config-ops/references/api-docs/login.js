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
	"paths": {
		"/api/ad/v3/login": {
			"description": "控制台登录",
			"post": {
				"tags": [
					"login"
				],
				"summary": "login",
				"description": "控制台登录",
				"operationId": "login",
				"parameters": [
					{
						"$ref": "#/parameters/JSON-LOGIN"
					}
				],
				"responses": {
					"200": {
						"description": "Successfully authenticated. The session ID is returned in a cookie named [session_id].\n",
						"headers": {
							"Set-Cookie": {
								"type": "string",
								"example": "session_id=0938d86a-a02d-11e8-99aa-000c29b45d7e; Path=/; HttpOnly; Secure;"
							}
						}
					}
				}
			}
		}
	},
	"parameters": {
		"JSON-LOGIN": {
			"name": "JSON-LOGIN",
			"in": "body",
			"required": true,
			"description": "JSON Login Object",
			"schema": {
				"$ref": "#/definitions/json.login"
			}
		}
	},
	"definitions": {
		"json.login": {
			"type": "object",
			"required": [
				"username"
			],
			"properties": {
				"username": {
					"type": "string",
					"example": "admin",
					"description": "登录用户名"
				},
				"password": {
					"type": "string",
					"example": "ADCDEF",
					"description": "登录密码的明文密码"
				},
				"pk_password": {
					"description": "登录密码的加密密码, password和pk_password二选一",
					"type": "string",
					"example": ""
				},
				"signature": {
					"description": "签名",
					"type": "string"
				},
				"signature_time": {
					"description": "签名时间戳",
					"type": "integer",
					"example": "1564588800"
				}
			}
		}
	}
}