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
		"/api/ad/v3/debug/ha/application-group/{name}/switch": {
			"description": "应用组主备操作",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				}
			],
			"post": {
				"description": "切换应用组主备",
				"tags": [
					"application-group"
				],
				"summary": "switch a application-group",
				"operationId": "switch_application_group",
				"parameters": [
					{
						"$ref": "#/parameters/APPLICATION-GROUP-DEBUG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_application_group_switch_result"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug ha application-group app1 switch target_member dev_D",
					"description": "切换应用组app1的生效设备至dev_D"
				}
			]
		}
	},
	"parameters": {
		"APPLICATION-GROUP-DEBUG": {
			"name": "APPLICATION-GROUP-DEBUG",
			"in": "body",
			"required": true,
			"description": "JSON Debug Properties",
			"schema": {
				"$ref": "#/definitions/debug.application_group_switch"
			}
		}
	},
	"responses": {
		"operation_debug_application_group_switch_result": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.application_group_switch_result"
			}
		}
	},
	"definitions": {
		"debug.application_group_switch": {
			"type": "object",
			"properties": {
				"target_member": {
					"description": "必须为已存在的成员设备名称,或者为AUTO自动选择设备，Format: AUTO | {member}",
					"type": "string",
					"default": "AUTO"
				}
			}
		},
		"debug.application_group_switch_result": {
			"type": "object",
			"properties": {
				"original": {
					"description": "原始状态",
					"$ref": "/api/stat/ha/application-group.yaml#/definitions/stat.application_group_detail"
				},
				"current": {
					"description": "当前状态",
					"$ref": "/api/stat/ha/application-group.yaml#/definitions/stat.application_group_detail"
				}
			}
		}
	}
}