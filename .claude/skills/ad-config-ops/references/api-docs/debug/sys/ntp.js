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
		"/api/ad/v3/debug/sys/ntp": {
			"description": "系统ntp同步操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"ntp"
				],
				"summary": "ntp",
				"description": "立即同步NTP时间",
				"operationId": "refresh_system_time_from_ntp",
				"parameters": [
					{
						"$ref": "#/parameters/NTP-DEBUG"
					}
				]
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys ntp ntp 1.1.1.1",
					"description": "从服务器1.1.1.1同步时间"
				}
			]
		}
	},
	"parameters": {
		"NTP-DEBUG": {
			"name": "NTP-DEBUG",
			"in": "body",
			"required": true,
			"description": "JSON Debug Properties",
			"schema": {
				"$ref": "#/definitions/debug.ntp"
			}
		}
	},
	"definitions": {
		"debug.ntp": {
			"type": "object",
			"properties": {
				"ntp": {
					"type": "string",
					"example": "time.nist.gov",
					"description": "ntp服务器，可以填ip获取域名"
				}
			}
		}
	}
}