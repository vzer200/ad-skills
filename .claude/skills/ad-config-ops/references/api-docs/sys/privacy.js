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
		"/api/ad/v3/sys/privacy": {
			"description": "查看、修改隐私政策配置",
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
					"privacy"
				],
				"summary": "get privacy",
				"description": "查看当前已有的隐私政策配置信息",
				"operationId": "get_privacy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_privacy_object"
					}
				}
			},
			"put": {
				"tags": [
					"privacy"
				],
				"summary": "replace privacy",
				"description": "修改隐私政策配置",
				"operationId": "replace_privacy",
				"parameters": [
					{
						"$ref": "#/parameters/PRIVACY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_privacy_object"
					}
				}
			},
			"patch": {
				"tags": [
					"privacy"
				],
				"summary": "modify privacy",
				"description": "修改隐私政策配置",
				"operationId": "edit_privacy",
				"parameters": [
					{
						"$ref": "#/parameters/PRIVACY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_privacy_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys privacy",
					"description": "查看隐私政策是否启用"
				},
				{
					"command": "modify sys privacy customer_experience_improvement_program disable",
					"description": "禁用隐私政策"
				}
			]
		}
	},
	"parameters": {
		"PRIVACY-CONFIG": {
			"name": "PRIVACY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.privacy"
			}
		},
		"PRIVACY-PROPERTY": {
			"name": "PRIVACY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.privacy"
			}
		}
	},
	"responses": {
		"operation_config_privacy_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.privacy"
			}
		}
	},
	"definitions": {
		"config.privacy": {
			"type": "object",
			"properties": {
				"customer_experience_improvement_program": {
					"description": "是否启用隐私政策",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				}
			}
		}
	}
}