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
		"/api/ad/v3/version": {
			"description": "获取当前版本信息",
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
					"version"
				],
				"summary": "get version info",
				"description": "获取当前版本信息",
				"operationId": "get_version_info",
				"parameters": [
					{
						"$ref": "#/parameters/VERSION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_version"
					}
				}
			}
		}
	},
	"parameters": {
		"VERSION-CONFIG": {
			"name": "VERSION-CONFIG",
			"in": "body",
			"required": true,
			"description": "获取版本参数",
			"schema": {
				"$ref": "#/definitions/config.version"
			}
		}
	},
	"responses": {
		"operation_config_version": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.version"
			}
		}
	},
	"definitions": {
		"config.version": {
			"type": "object",
			"properties": {
				"system": {
					"type": "string",
					"example": "7.0.5",
					"description": "获取当前系统版本"
				},
				"api": {
					"type": "string",
					"example": "v3",
					"description": "获取当前系统api版本"
				},
				"compatible": {
					"type": "array",
					"description": "当前系统兼容的api版本",
					"items": {
						"type": "string",
						"example": "v1",
						"description": "api版本列表"
					},
					"example": [
						"v2",
						"v1"
					]
				},
				"package": {
					"type": "string",
					"example": "BUILD20180730",
					"description": "系统软件包日期"
				},
				"modules": {
					"type": "array",
					"description": "模块信息",
					"items": {
						"type": "string",
						"example": "GCS_PRODUCT1.2.0",
						"description": "模块名称列表"
					}
				},
				"patch_tags": {
					"type": "array",
					"description": "补丁信息",
					"items": {
						"type": "string",
						"description": "补丁名称列表",
						"example": "Custom-built (1 10-10-10 10:10:10)-i-abc(101010101010)-xyz-AD-2010101001"
					}
				}
			}
		}
	}
}