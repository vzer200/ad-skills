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
		"/api/ad/v3/sys/banner/": {
			"description": "查看登录提示语",
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
					"banner"
				],
				"summary": "get all banner",
				"description": "查看登录提示语",
				"operationId": "get_banner_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_banner_list"
					}
				}
			},
			"put": {
				"tags": [
					"banner"
				],
				"summary": "replace specific banner",
				"description": "修改登录提示语",
				"operationId": "replace_banner",
				"parameters": [
					{
						"$ref": "#/parameters/LOG-TEMPLATE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_banner_object"
					}
				}
			},
			"patch": {
				"tags": [
					"banner"
				],
				"summary": "modify specific banner",
				"description": "修改登录提示语",
				"operationId": "edit_banner",
				"parameters": [
					{
						"$ref": "#/parameters/LOG-TEMPLATE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_banner_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys banner",
					"description": "查看登录提示语"
				},
				{
					"command": "modify sys banner banner_tip \"登录提示语\"",
					"description": "修改登录提示语"
				}
			]
		}
	},
	"parameters": {
		"LOG-TEMPLATE-CONFIG": {
			"name": "LOG-TEMPLATE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.banner"
			}
		},
		"LOG-TEMPLATE-PROPERTY": {
			"name": "LOG-TEMPLATE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.banner"
			}
		}
	},
	"responses": {
		"operation_config_banner_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.banner"
			}
		}
	},
	"definitions": {
		"config.banner": {
			"type": "object",
			"properties": {
				"banner_tip": {
					"description": "登录提示语",
					"type": "string",
					"maxLength": 16384
				}
			}
		}
	}
}