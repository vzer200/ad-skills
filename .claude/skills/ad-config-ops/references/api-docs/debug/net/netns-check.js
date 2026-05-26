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
		"/api/ad/v3/debug/net/netns-check": {
			"description": "OPENSTACK配置一致性操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/netns_list"
				}
			],
			"post": {
				"tags": [
					"netns-check"
				],
				"summary": "netns-check",
				"description": "检查netns状态",
				"operationId": "netns_check",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_netns_status"
					}
				}
			}
		}
	},
	"parameters": {
		"netns_list": {
			"name": "netns_list",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.netns_entry"
			}
		}
	},
	"responses": {
		"operation_debug_netns_status": {
			"description": "Display netns list with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.netns_status"
			}
		}
	},
	"definitions": {
		"debug.netns_status": {
			"type": "object",
			"properties": {
				"netns_nonexists": {
					"description": "netns不存在列表",
					"type": "array",
					"items": {
						"type": "string",
						"example": "netns_A"
					}
				},
				"netns_timeouts": {
					"description": "netns超时列表",
					"type": "array",
					"items": {
						"type": "string",
						"example": "netns_A"
					}
				}
			}
		},
		"debug.netns_entry": {
			"type": "array",
			"items": {
				"type": "string",
				"example": "netns_A"
			}
		}
	}
}