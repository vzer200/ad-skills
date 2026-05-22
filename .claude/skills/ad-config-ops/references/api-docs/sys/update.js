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
		"/api/ad/v3/sys/update": {
			"description": "查看、修改自动更新配置",
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
					"update"
				],
				"summary": "get update",
				"description": "查看当前已有的自动更新配置信息",
				"operationId": "get_update",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_update_object"
					}
				}
			},
			"put": {
				"tags": [
					"update"
				],
				"summary": "replace update",
				"description": "修改自动更新配置",
				"operationId": "replace_update",
				"parameters": [
					{
						"$ref": "#/parameters/UPDATE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_update_object"
					}
				}
			},
			"patch": {
				"tags": [
					"update"
				],
				"summary": "modify update",
				"description": "修改自动更新配置",
				"operationId": "edit_update",
				"parameters": [
					{
						"$ref": "#/parameters/UPDATE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_update_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys update",
					"description": "查看[自动更新]的配置信息"
				},
				{
					"command": "modify sys update system_patch_update enable application_identification_update enable application_identification_frequency daily foreign_domain_group_update enable foreign_domain_group_frequency monthly isp_address_group_update enable isp_address_group_frequency monthly",
					"description": "更新[自动更新]的配置；启用系统自动更新；启用应用规则库（application_identification_update）自动更新，更新间隔时间设置为一天；启用域名地址集（foreign_domain_group_update）自动更新，更新间隔时间设置为一个月；启用ISP地址集（isp_address_group_update）自动更新，更新间隔时间设置为一个月"
				}
			]
		}
	},
	"parameters": {
		"UPDATE-CONFIG": {
			"name": "UPDATE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.update"
			}
		},
		"UPDATE-PROPERTY": {
			"name": "UPDATE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.update"
			}
		}
	},
	"responses": {
		"operation_config_update_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.update"
			}
		}
	},
	"definitions": {
		"config.update": {
			"type": "object",
			"properties": {
				"system_patch_update": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）；是否启用系统自动更新，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"isp_address_group_update": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）；是否启用ISP地址集自动更新，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"isp_address_group_frequency": {
					"description": "可选参数；ISP地址集自动更新时间间隔（daily-天/weekly-周/monthly-月），默认为周",
					"type": "string",
					"enum": [
						"DAILY",
						"WEEKLY",
						"MONTHLY"
					],
					"default": "WEEKLY"
				},
				"foreign_domain_group_update": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）；是否启用域名地址集自动更新，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"foreign_domain_group_frequency": {
					"description": "可选参数；域名地址集自动更新时间间隔（daily-天/weekly-周/monthly-月），默认为周",
					"type": "string",
					"enum": [
						"DAILY",
						"WEEKLY",
						"MONTHLY"
					],
					"default": "WEEKLY"
				},
				"application_identification_update": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）；是否启用应用规则库自动更新，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"application_identification_frequency": {
					"description": "可选参数；应用规则库自动更新时间间隔（daily-天/weekly-周/monthly-月），默认为周",
					"type": "string",
					"enum": [
						"DAILY",
						"WEEKLY",
						"MONTHLY"
					],
					"default": "WEEKLY"
				}
			}
		}
	}
}