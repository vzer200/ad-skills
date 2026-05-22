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
		"/api/ad/v3/debug/lc/policy-route/simulator": {
			"description": "智能路由规则操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"policy-route"
				],
				"summary": "simulator policy-route result",
				"description": "获取上一次智能路由规则测试结果",
				"operationId": "get_last_simulator_policy_route_result",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_policy_route_simulator"
					}
				}
			},
			"post": {
				"tags": [
					"policy-route"
				],
				"summary": "simulator policy-route",
				"description": "测试智能路由规则",
				"operationId": "simulator_policy_route",
				"parameters": [
					{
						"$ref": "#/parameters/simulator_parameter"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_policy_route_simulator"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug lc policy-route simulator",
					"description": "获取上一次智能路由规则测试结果"
				},
				{
					"command": "create debug lc policy-route simulator source_address 1.1.1.1 destination_address 2.2.2.2 inbound_link lan1",
					"description": "测试源ip是1.1.1.1目的地址是2.2.2.2入接口是lan1时智能路由的结果"
				}
			]
		},
		"/api/ad/v3/debug/lc/policy-route/reset": {
			"description": "重置智能路由匹配次数操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"description": "重置智能路由匹配次数",
				"tags": [
					"policy-route"
				],
				"summary": "clear policy-route hit",
				"operationId": "clear_policy_route_hit"
			},
			"__sfcli_example__": [
				{
					"command": "run debug lc policy-route reset",
					"description": "重置智能路由匹配次数"
				}
			]
		}
	},
	"parameters": {
		"simulator_parameter": {
			"name": "simulator_parameter",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.policy_route_simulator"
			}
		}
	},
	"responses": {
		"operation_debug_policy_route_simulator": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.policy_route_simulator_resp"
			}
		}
	},
	"definitions": {
		"debug.policy_route_simulator": {
			"type": "object",
			"required": [
				"source_address",
				"destination_address"
			],
			"properties": {
				"source_address": {
					"type": "string",
					"description": "源ip地址，格式是ip地址格式",
					"example": "192.168.1.12"
				},
				"source_port": {
					"type": "integer",
					"example": 8080,
					"description": "源端口",
					"minimum": 1,
					"maximum": 65535
				},
				"destination_address": {
					"type": "string",
					"description": "源ip地址，格式是ip地址格式",
					"example": "200.1.5.102"
				},
				"destination_port": {
					"type": "integer",
					"example": 8080,
					"description": "目的端口",
					"minimum": 1,
					"maximum": 65535
				},
				"inbound_link": {
					"type": "string",
					"description": "入接口，格式为LOCAL-SYSTEM或者链路的名字",
					"example": "china_telenet_1"
				},
				"protocol": {
					"description": "协议类型",
					"type": "string",
					"enum": [
						"TCP",
						"UDP",
						"ICMP",
						"OTHER"
					],
					"default": "TCP"
				},
				"protocol_number": {
					"type": "integer",
					"description": "协议号",
					"example": 6,
					"default": 0
				},
				"tos": {
					"description": "流量传输标识,tos值，必须为0~255之间的整数",
					"type": "integer",
					"default": 0,
					"example": 0,
					"minimum": 0,
					"maximum": 255
				},
				"simulate_trace": {
					"description": "模拟跟踪结果",
					"type": "array",
					"readOnly": true,
					"items": {
						"type": "object",
						"properties": {
							"operation": {
								"type": "string",
								"description": "操作"
							},
							"object": {
								"type": "string",
								"example": "DEFAULT",
								"description": "对应的规则"
							},
							"result": {
								"type": "string",
								"description": "匹配结果",
								"example": "SUEECSS"
							},
							"description": {
								"description": "结果描述",
								"type": "string"
							}
						}
					}
				}
			}
		},
		"debug.policy_route_simulator_resp": {
			"type": "object",
			"properties": {
				"source_address": {
					"type": "string",
					"description": "源ip地址，格式是ip地址格式",
					"example": "192.168.1.12"
				},
				"source_port": {
					"type": "integer",
					"example": 8080,
					"description": "源端口",
					"minimum": 1,
					"maximum": 65535
				},
				"destination_address": {
					"type": "string",
					"description": "源ip地址，格式是ip地址格式",
					"example": "200.1.5.102"
				},
				"destination_port": {
					"type": "integer",
					"example": 8080,
					"description": "目的端口",
					"minimum": 1,
					"maximum": 65535
				},
				"inbound_link": {
					"type": "string",
					"description": "入接口，格式为LOCAL-SYSTEM或者链路的名字",
					"example": "china_telenet_1"
				},
				"protocol": {
					"description": "协议类型",
					"type": "string",
					"enum": [
						"TCP",
						"UDP",
						"ICMP",
						"OTHER"
					],
					"default": "TCP"
				},
				"protocol_number": {
					"type": "integer",
					"description": "协议号",
					"example": 6,
					"default": 0
				},
				"tos": {
					"description": "流量传输标识,tos值，必须为0~255之间的整数",
					"type": "integer",
					"default": 0,
					"example": 0,
					"minimum": 0,
					"maximum": 255
				},
				"simulate_trace": {
					"description": "模拟跟踪结果",
					"type": "array",
					"readOnly": true,
					"items": {
						"type": "object",
						"properties": {
							"operation": {
								"type": "string",
								"description": "操作"
							},
							"object": {
								"type": "string",
								"example": "DEFAULT",
								"description": "对应的规则"
							},
							"result": {
								"type": "string",
								"description": "匹配结果",
								"example": "SUEECSS"
							},
							"description": {
								"description": "结果描述",
								"type": "string"
							}
						}
					}
				},
				"record_time": {
					"type": "string",
					"description": "记录时间，格式为YYYY-MM-DD hh:mm:ss",
					"example": "2021-08-18 02:29:28"
				}
			}
		}
	}
}