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
		"/api/ad/v3/debug/net/snat/reset": {
			"description": "SNAT命中统计数操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"snat"
				],
				"summary": "clear snat hit",
				"description": "重置SNAT命中数统计",
				"operationId": "clear_snat_hit",
				"x-examples": {
					"request": {
						"summary": "clear snat hit",
						"description": "重置SNAT命中数统计",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/net/snat/reset"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/net/snat/reset 响应",
						"description": "返回POST /api/ad/v3/debug/net/snat/reset的响应数据",
						"value": {
							"ok": true
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug net snat reset",
					"description": "重置SNAT命中数统计"
				}
			]
		}
	}
}