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
		"/api/ad/v3/debug/dns/dns-map/simulator": {
			"description": "dns规则测试操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"dns-map"
				],
				"summary": "simulator dns-map result",
				"description": "获取返回上次规则测试的结果",
				"operationId": "get_last_simulator_dns_map_result",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_dns_map_simulator"
					}
				}
			},
			"post": {
				"tags": [
					"dns-map"
				],
				"summary": "simulator dns-map",
				"description": "新建dns规则测试",
				"operationId": "simulator_dns_map",
				"parameters": [
					{
						"$ref": "#/parameters/simulator_parameter"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_dns_map_simulator"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug dns dns-map simulator dns_map test local_dns 1.2.3.4",
					"description": "DNS映射规则为test,DNS映射规则IP地址为1.2.3.4时,测试映射结果"
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
				"$ref": "#/definitions/debug.dns_map_simulator"
			}
		}
	},
	"responses": {
		"operation_debug_dns_map_simulator": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.dns_map_simulator"
			}
		}
	},
	"definitions": {
		"debug.dns_map_simulator": {
			"type": "object",
			"required": [
				"dns_map",
				"local_dns"
			],
			"properties": {
				"dns_map": {
					"description": "选择测试的DNS映射规则",
					"type": "string",
					"example": "www.abc.com"
				},
				"local_dns": {
					"description": "测试DNS映射规则的IP地址",
					"type": "string",
					"example": "10.0.1.2"
				},
				"simulate_trace": {
					"description": "追踪结果",
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
								"description": "对应的规则"
							},
							"result": {
								"type": "string",
								"description": "匹配结果"
							},
							"description": {
								"type": "string",
								"description": "结果描述"
							}
						}
					}
				},
				"record_time": {
					"description": "记录时间",
					"type": "string",
					"readOnly": true,
					"example": "YYYY-MM-DD hh:mm:ss"
				}
			}
		}
	}
}