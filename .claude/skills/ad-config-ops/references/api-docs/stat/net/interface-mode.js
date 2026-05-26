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
		"/api/ad/v3/stat/net/interface-mode": {
			"description": "获取网口协商模式信息",
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
					"interface-mode"
				],
				"summary": "get interface-mode stat",
				"description": "获取网口协商模式信息",
				"operationId": "get_interface_mode_stat",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_interface_mode_object"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_interface_mode_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.interface_mode"
			}
		}
	},
	"definitions": {
		"stat.interface_mode": {
			"type": "object",
			"description": "网口协商模式信息",
			"additionalProperties": {
				"type": "object",
				"description": "网口协商模式属性",
				"required": [
					"mode"
				],
				"properties": {
					"current_mode": {
						"type": "string",
						"readOnly": true,
						"description": "网口当前协商模式",
						"enum": [
							"UNKNOW",
							"10BASET-HALF",
							"10BASET-FULL",
							"100BASET-HALF",
							"100BASET-FULL",
							"1000BASET-HALF",
							"1000BASET-FULL",
							"10000BASET-HALF",
							"10000BASET-FULL",
							"40000BASET-HALF",
							"40000BASET-FULL"
						],
						"default": "UNKNOW",
						"example": "1000BASET-FULL"
					},
					"supported_modes": {
						"type": "array",
						"readOnly": true,
						"description": "网口支持的协商模式",
						"items": {
							"type": "string",
							"enum": [
								"10BASET-HALF",
								"10BASET-FULL",
								"100BASET-HALF",
								"100BASET-FULL",
								"1000BASET-HALF",
								"1000BASET-FULL",
								"10000BASET-HALF",
								"10000BASET-FULL",
								"40000BASET-HALF",
								"40000BASET-FULL"
							]
						},
						"example": [
							"10000BASET-HALF",
							"10000BASET-FULL",
							"40000BASET-HALF",
							"40000BASET-FULL"
						]
					}
				}
			}
		}
	}
}