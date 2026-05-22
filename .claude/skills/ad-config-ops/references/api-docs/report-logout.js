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
		"/api/ad/v3/report-logout": {
			"description": "报表登出",
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
				"description": "报表登出",
				"operationId": "logout",
				"parameters": [
					{
						"$ref": "#/parameters/JSON-LOGOUT"
					}
				]
			}
		}
	},
	"parameters": {
		"JSON-LOGOUT": {
			"name": "JSON-LOGOUT",
			"in": "body",
			"required": true,
			"description": "JSON Login Object",
			"schema": {
				"$ref": "#/definitions/json.logout"
			}
		}
	},
	"definitions": {
		"json.logout": {
			"type": "object",
			"required": [
				"username",
				"source_ip"
			],
			"properties": {
				"username": {
					"type": "string",
					"description": "用户名",
					"example": "admin"
				},
				"source_ip": {
					"type": "string",
					"description": "客户端ip",
					"example": "1.1.1.1"
				}
			}
		}
	}
}