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
		"/api/ad/v3/debug/net/netns-alarm": {
			"description": "OPENSTACK发送告警信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/NETNS-LIST"
				}
			],
			"post": {
				"tags": [
					"netns-alarm"
				],
				"summary": "netns-alarm",
				"description": "根据提供的netns列表发送告警",
				"operationId": "netns_alarm"
			}
		}
	},
	"parameters": {
		"NETNS-LIST": {
			"name": "NETNS-LIST",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.netns_entry"
			}
		}
	},
	"definitions": {
		"debug.netns_entry": {
			"type": "object",
			"properties": {
				"netns_timeouts": {
					"description": "netns超时列表",
					"type": "array",
					"items": {
						"type": "string",
						"example": "netns_A",
						"description": "超时时间，超时的告警"
					}
				},
				"netns_fail_retry": {
					"type": "array",
					"description": "失败重试的告警",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"description": "错误配置名称",
								"type": "string",
								"example": "loadbalancerA-xxxxxxxx"
							},
							"error_item_type": {
								"description": "错误配置关联类型",
								"type": "string",
								"example": "listener"
							},
							"error_item_name": {
								"description": "错误配置关联名称",
								"type": "string",
								"example": "listenerA-XXXXXXXXX"
							},
							"error_count": {
								"description": "错误配置重试次数",
								"type": "integer",
								"example": "3"
							}
						}
					}
				}
			}
		}
	}
}