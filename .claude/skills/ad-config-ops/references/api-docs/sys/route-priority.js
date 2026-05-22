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
			"type": "object",
			"properties": {
				"connection_setting": {
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"proute_higher_than_main": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"route": {
							"type": "array",
							"example": "[STATIC_PRIORITY, EBGP_PRIORITY, OSPF_PRIORITY, RIP_PRIORITY, IBGP_PRIORITY]",
							"items": {
								"type": "object",
								"properties": {
									"operation": {
										"type": "string"
									},
									"object": {
										"type": "string",
										"example": "STATIC_PRIORITY"
									},
									"result": {
										"type": "string",
										"enum": [
											"STATIC_PRIORITY",
											"EBGP_PRIORITY",
											"OSPF_PRIORITY",
											"RIP_PRIORITY",
											"IBGP_PRIORITY"
										],
										"example": "STATIC_PRIORITY"
									},
									"description": {
										"type": "string"
									}
								}
							}
						}
					}
				}
			}
		}
	}
}