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
		"/api/ad/v3/debug/slb/http-rewrite/reset": {
			"description": "HTTP改写策略命中计数操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"post": {
				"tags": [
					"http-rewrite"
				],
				"summary": "clear http-rewrite hit",
				"description": "重置HTTP改写策略命中计数",
				"operationId": "clear_http_rewrite_hit",
				"x-examples": {
					"request": {
						"summary": "clear http-rewrite hit",
						"description": "重置HTTP改写策略命中计数",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/slb/http-rewrite/reset"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/slb/http-rewrite/reset 响应",
						"description": "返回POST /api/ad/v3/debug/slb/http-rewrite/reset的响应数据",
						"value": {
							"ok": true
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug slb http-rewrite reset",
					"description": "重置HTTP改写策略命中计数"
				}
			]
		}
	}
}