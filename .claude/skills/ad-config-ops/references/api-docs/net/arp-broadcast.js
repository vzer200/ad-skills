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
		"/api/ad/v3/net/arp-broadcast": {
			"description": "ARP广播配置管理操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				}
			],
			"get": {
				"tags": [
					"arp-broadcast"
				],
				"summary": "get arp-broadcast",
				"description": "arp广播配置获取",
				"operationId": "get_arp_broadcast",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_broadcast_object"
					}
				}
			},
			"put": {
				"tags": [
					"arp-broadcast"
				],
				"summary": "replace arp-broadcast",
				"description": "arp广播配置修改",
				"operationId": "replace_arp_broadcast",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-BROADCAST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_broadcast_object"
					}
				}
			},
			"patch": {
				"tags": [
					"arp-broadcast"
				],
				"summary": "modify arp-broadcast",
				"description": "arp广播配置修改",
				"operationId": "edit_arp_broadcast",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-BROADCAST-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_broadcast_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify net arp-broadcast broadcast_interval_min 6",
					"description": "修改ARP广播时间为6分钟"
				}
			]
		}
	},
	"parameters": {
		"ARP-BROADCAST-CONFIG": {
			"name": "ARP-BROADCAST-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.arp_broadcast"
			}
		},
		"ARP-BROADCAST-PROPERTY": {
			"name": "ARP-BROADCAST-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.arp_broadcast"
			}
		}
	},
	"responses": {
		"operation_config_arp_broadcast_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.arp_broadcast"
			}
		}
	},
	"definitions": {
		"config.arp_broadcast": {
			"type": "object",
			"properties": {
				"broadcast_interval_min": {
					"type": "integer",
					"description": "广播时间设置，单位是分钟，必须为5~3600之间的整数。",
					"default": 5,
					"example": 5,
					"maximum": 3600,
					"minimum": 5
				}
			}
		}
	}
}