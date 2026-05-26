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
		"/api/ad/v3/debug/log/service-log/clear": {
			"description": "服务日志操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"service-log"
				],
				"summary": "clear service-log",
				"description": "清除服务日志",
				"operationId": "clear_service_log",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/VERIFY-OPERATOR"
					}
				]
			},
			"__sfcli_example__": [
				{
					"command": "run debug log service-log clear",
					"description": "清除服务日志"
				}
			]
		}
	}
}