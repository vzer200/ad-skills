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
		"/api/ad/v3/sys/report-setting": {
			"description": "查看、修改报表设置",
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
					"report-setting"
				],
				"summary": "get report-setting",
				"description": "查看当前已有的报表设置信息",
				"operationId": "get_report_setting",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_setting_object"
					}
				}
			},
			"put": {
				"tags": [
					"report-setting"
				],
				"summary": "replace report-setting",
				"description": "修改报表设置",
				"operationId": "replace_report_setting",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-SETTING-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_setting_object"
					}
				}
			},
			"patch": {
				"tags": [
					"report-setting"
				],
				"summary": "modify report-setting",
				"description": "修改报表设置",
				"operationId": "edit_report_setting",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-SETTING-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_setting_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys report-setting",
					"description": "查看报表设置"
				},
				{
					"command": "modify sys report-setting state enable response_timeout 10 clear_earliest_data_day 5 disk_usage_threshold 20",
					"description": "启用报表设置，全局查询策略中，设置报表响应时间为10s；报表清除策略中，磁盘空间极限设置为20%， 自动删除最前面5天的报表数据"
				}
			]
		}
	},
	"parameters": {
		"REPORT-SETTING-CONFIG": {
			"name": "REPORT-SETTING-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.report_setting"
			}
		},
		"REPORT-SETTING-PROPERTY": {
			"name": "REPORT-SETTING-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.report_setting"
			}
		}
	},
	"responses": {
		"operation_config_report_setting_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.report_setting"
			}
		}
	},
	"definitions": {
		"config.report_setting": {
			"type": "object",
			"properties": {
				"state": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）；是否启用报表设置，默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"response_timeout": {
					"description": "可选参数；设置报表响应时间，单位为s，默认为8s",
					"type": "integer",
					"default": 8,
					"maximum": 30,
					"minimum": 4,
					"example": 8
				},
				"disk_usage_threshold": {
					"description": "可选参数；设置磁盘空间极限，单位为%，默认为45%",
					"type": "integer",
					"default": 45,
					"maximum": 50,
					"minimum": 20,
					"example": 45
				},
				"clear_earliest_data_day": {
					"description": "可选参数；自动删除最前面报表数据天数，单位为天，默认为3天；即自动删除最前面3天报表数据",
					"type": "integer",
					"default": 3,
					"maximum": 365,
					"minimum": 1,
					"example": 3
				}
			}
		}
	}
}