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
		"/api/ad/v3/ha/mode": {
			"description": "设备当前高可用模式配置相关操作",
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
					"mode"
				],
				"summary": "get mode",
				"description": "获取当前设备高可用模式",
				"operationId": "get_mode",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_mode_object"
					}
				}
			},
			"put": {
				"tags": [
					"mode"
				],
				"summary": "replace mode",
				"description": "修改当前设备高可用模式",
				"operationId": "replace_mode",
				"parameters": [
					{
						"$ref": "#/parameters/HA-MODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_mode_object"
					}
				}
			},
			"patch": {
				"tags": [
					"mode"
				],
				"summary": "modify mode",
				"description": "修改当前设备高可用模式",
				"operationId": "edit_mode",
				"parameters": [
					{
						"$ref": "#/parameters/HA-MODE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_mode_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha mode",
					"description": "获取当前设备的高可用模式"
				},
				{
					"command": "modify ha mode mode ha-cluster",
					"description": "修改当前设备的高可用模式为集群模式"
				}
			]
		}
	},
	"parameters": {
		"HA-MODE-CONFIG": {
			"name": "HA-MODE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.mode"
			}
		},
		"HA-MODE-PROPERTY": {
			"name": "HA-MODE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.mode"
			}
		}
	},
	"responses": {
		"operation_config_mode_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.mode"
			}
		}
	},
	"definitions": {
		"config.mode": {
			"type": "object",
			"required": [
				"mode"
			],
			"properties": {
				"mode": {
					"description": "高可用模式，active-standby：主备模式，ha-cluster：集群模式",
					"type": "string",
					"enum": [
						"ACTIVE-STANDBY",
						"HA-CLUSTER"
					],
					"example": "HA-CLUSTER",
					"default": "ACTIVE-STANDBY"
				}
			}
		}
	}
}