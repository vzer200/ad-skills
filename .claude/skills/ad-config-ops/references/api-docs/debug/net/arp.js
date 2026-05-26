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
		"/api/ad/v3/debug/net/arp/discover": {
			"description": "获取ARP/ND操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/arp_discover_parameter"
				}
			],
			"post": {
				"tags": [
					"arp"
				],
				"summary": "arp discover",
				"description": "批量获取ARP/ND",
				"operationId": "arp_discover",
				"parameters": [
					{
						"$ref": "#/parameters/arp_discover_parameter"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_arp_discover"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug net arp discover link wan ip_address 192.168.2.100",
					"description": "批量获取ARP/ND"
				}
			]
		}
	},
	"parameters": {
		"arp_discover_parameter": {
			"name": "arp_discover_parameter",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.arp_discover_parameter"
			}
		}
	},
	"responses": {
		"operation_debug_arp_discover": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.arp_discover_result"
			}
		}
	},
	"definitions": {
		"debug.arp_discover_parameter": {
			"type": "object",
			"required": [
				"link",
				"ip_address"
			],
			"properties": {
				"link": {
					"type": "string",
					"description": "必选参数；指定系统链路, 可以是wan或lan",
					"example": "wan_1"
				},
				"ip_address": {
					"type": "string",
					"description": "必选参数；指定地址范围，可以是单个ip地址，ip地址范围，子网",
					"example": "192.168.1.12-192.168.2.1"
				}
			}
		},
		"debug.arp_discover_result": {
			"type": "object",
			"readOnly": true,
			"properties": {
				"arp_records": {
					"description": "arp记录",
					"type": "array",
					"items": {
						"type": "object",
						"description": "通过arp获取到的邻居记录",
						"properties": {
							"ip_address": {
								"type": "string",
								"description": "ip地址",
								"example": "192.168.1.12"
							},
							"mac_address": {
								"type": "string",
								"description": "mac地址",
								"example": "00:10:b4:12:65:34"
							},
							"link": {
								"description": "系统链路",
								"type": "string",
								"example": "WAN_2"
							}
						}
					}
				}
			}
		}
	}
}