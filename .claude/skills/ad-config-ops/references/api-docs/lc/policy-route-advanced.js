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
		"/api/ad/v3/lc/policy-route-advanced": {
			"description": "智能路由-出入站高级配置管理操作",
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
					"policy-route-advanced"
				],
				"summary": "get policy-route-advanced",
				"description": "查看智能路由-出入站高级配置信息",
				"operationId": "get_policy_route_advanced",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_advanced_object"
					}
				}
			},
			"put": {
				"tags": [
					"policy-route-advanced"
				],
				"summary": "replace policy-route-advanced",
				"description": "更新智能路由-出入站高级配置",
				"operationId": "replace_policy_route_advanced",
				"parameters": [
					{
						"$ref": "#/parameters/POLICY-ROUTE-ADVANCED-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_advanced_object"
					}
				}
			},
			"patch": {
				"tags": [
					"policy-route-advanced"
				],
				"summary": "modify policy-route-advanced",
				"description": "更新智能路由-出入站高级配置",
				"operationId": "edit_policy_route_advanced",
				"parameters": [
					{
						"$ref": "#/parameters/POLICY-ROUTE-ADVANCED-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_advanced_object"
					}
				}
			}
		}
	},
	"parameters": {
		"POLICY-ROUTE-ADVANCED-CONFIG": {
			"name": "POLICY-ROUTE-ADVANCED-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.policy_route_advanced"
			}
		},
		"POLICY-ROUTE-ADVANCED-PROPERTY": {
			"name": "POLICY-ROUTE-ADVANCED-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.policy_route_advanced"
			}
		}
	},
	"responses": {
		"operation_config_policy_route_advanced_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.policy_route_advanced"
			}
		}
	},
	"definitions": {
		"config.policy_route_advanced": {
			"type": "object",
			"properties": {
				"persist": {
					"description": "出站会话保持",
					"type": "object",
					"properties": {
						"subnet_mask": {
							"description": "子网掩码",
							"type": "string",
							"default": "255.255.255.0",
							"example": "255.255.255.0"
						},
						"v6_prefix_length": {
							"type": "integer",
							"default": 64,
							"example": 64,
							"description": "ipv6掩码长度",
							"minimum": 0,
							"maximum": 128
						},
						"timeout": {
							"description": "超时时间",
							"type": "integer",
							"default": 1800,
							"example": 1800,
							"maximum": 86400,
							"minimum": 1
						}
					}
				},
				"detect_rtt": {
					"type": "object",
					"description": "动态就近性",
					"properties": {
						"method": {
							"type": "string",
							"description": "其他协议探测方法",
							"enum": [
								"ICMP",
								"UDP"
							],
							"default": "ICMP",
							"example": "ICMP"
						},
						"result_cache_subnet_mask": {
							"type": "string",
							"default": "255.255.255.0",
							"example": "255.255.255.0",
							"description": "缓存子网掩码"
						},
						"ipv6_result_cache_prefix_length": {
							"description": "IPv6缓存前缀长度",
							"type": "integer",
							"default": 64,
							"example": 64,
							"maximum": 128,
							"minimum": 0
						},
						"result_cache_timeout": {
							"description": "缓存超时时间",
							"type": "integer",
							"default": 3600,
							"example": 3600,
							"maximum": 86400,
							"minimum": 10
						}
					}
				}
			}
		}
	}
}