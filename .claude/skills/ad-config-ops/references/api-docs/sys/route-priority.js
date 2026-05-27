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
		"/sys/route-priority": {
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/force"
				}
			],
			"get": {
				"tags": [
					"route-priority"
				],
				"summary": "get route-priority",
				"description": "",
				"operationId": "get_route_priority",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_route_priority_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get route-priority",
						"description": "GET /sys/route-priority",
						"value": {
							"method": "GET",
							"path": "/sys/route-priority"
						}
					},
					"response": {
						"summary": "GET /sys/route-priority 响应",
						"description": "返回GET /sys/route-priority的响应数据",
						"value": {
							"proute_higher_than_main": "DISABLE",
							"routes": [
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY"
							],
							"state": "DISABLE"
						}
					}
				}
			},
			"put": {
				"tags": [
					"route-priority"
				],
				"summary": "replace route-priority",
				"description": "",
				"operationId": "replace_route_priority",
				"parameters": [
					{
						"$ref": "#/parameters/network_setting_parameter"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_route_priority_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace route-priority",
						"description": "PUT /sys/route-priority",
						"value": {
							"method": "PUT",
							"path": "/sys/route-priority",
							"body": {
								"proute_higher_than_main": "DISABLE",
								"routes": [
									"STATIC_PRIORITY",
									"STATIC_PRIORITY",
									"STATIC_PRIORITY",
									"STATIC_PRIORITY",
									"STATIC_PRIORITY"
								],
								"state": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /sys/route-priority 响应",
						"description": "返回PUT /sys/route-priority的响应数据",
						"value": {
							"proute_higher_than_main": "DISABLE",
							"routes": [
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY"
							],
							"state": "DISABLE"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"route-priority"
				],
				"summary": "modify route-priority",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_route_priority",
				"parameters": [
					{
						"$ref": "#/parameters/network_setting_parameter"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_route_priority_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify route-priority",
						"description": "The PATCH method updates specific properties of one config.",
						"value": {
							"method": "PATCH",
							"path": "/sys/route-priority",
							"body": {
								"proute_higher_than_main": "DISABLE",
								"routes": [
									"STATIC_PRIORITY",
									"STATIC_PRIORITY",
									"STATIC_PRIORITY",
									"STATIC_PRIORITY",
									"STATIC_PRIORITY"
								],
								"state": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /sys/route-priority 响应",
						"description": "返回PATCH /sys/route-priority的响应数据",
						"value": {
							"proute_higher_than_main": "DISABLE",
							"routes": [
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY",
								"STATIC_PRIORITY"
							],
							"state": "DISABLE"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"network_setting_parameter": {
			"name": "network_setting_parameter",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/config.network_setting"
			}
		},
		"force": {
			"name": "force",
			"in": "query",
			"required": false,
			"description": "Force recover package of different hardware.",
			"type": "boolean",
			"default": false,
			"example": false
		}
	},
	"responses": {
		"operation_config_route_priority_object": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.network_setting"
			}
		}
	},
	"definitions": {
		"config.network_setting": {
			"description": "路由优先级调整",
			"properties": {
				"proute_higher_than_main": {
					"default": "DISABLE",
					"description": "设置非默认智能路由优先级比主路由表高的开关",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "DISABLE",
					"type": "string"
				},
				"routes": {
					"description": "主路由表优先级",
					"items": {
						"description": "主路由表路由优先级",
						"enum": [
							"STATIC_PRIORITY",
							"EBGP_PRIORITY",
							"OSPF_PRIORITY",
							"RIP_PRIORITY",
							"IBGP_PRIORITY"
						],
						"type": "string"
					},
					"maxItems": 5,
					"minItems": 5,
					"type": "array",
					"uniqueItems": true
				},
				"state": {
					"default": "DISABLE",
					"description": "路由优先级调整开关",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "DISABLE",
					"type": "string"
				}
			},
			"required": [
				"state",
				"proute_higher_than_main",
				"routes"
			],
			"type": "object"
		}
	}
}