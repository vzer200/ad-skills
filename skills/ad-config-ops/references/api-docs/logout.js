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
		"session_auth": {
			"$ref": "/api/{common}.yaml#/securityDefinitions/session_auth"
		}
	},
	"paths": {
		"/api/ad/v3/logout": {
			"description": "控制台登出",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/session"
				}
			],
			"post": {
				"tags": [
					"logout"
				],
				"summary": "logout",
				"description": "控制台登出",
				"operationId": "logout",
				"x-examples": {
					"request": {
						"summary": "logout",
						"description": "控制台登出",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/logout"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/logout 响应",
						"description": "返回POST /api/ad/v3/logout的响应数据",
						"value": {
							"ok": true
						}
					}
				}
			}
		}
	}
}