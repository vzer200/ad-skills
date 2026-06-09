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
		"/api/ad/v3/debug/sys/report-task/{name}/generator": {
			"description": "生成定制报表操作",
			"post": {
				"tags": [
					"report-task"
				],
				"summary": "generate pdf report by report-task",
				"description": "生成定制报表",
				"operationId": "generate_report_task",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-TASK-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				},
				"x-examples": {
					"request": {
						"summary": "generate pdf report by report-task",
						"description": "生成定制报表",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/sys/report-task/{name}/generator",
							"body": {
								"from": "20180110",
								"to": "20180210"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/sys/report-task/{name}/generator 响应",
						"description": "返回POST /api/ad/v3/debug/sys/report-task/{name}/generator的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys report-task 默认样式 generator from 2021-07-20 to 2021-08-19",
					"description": "生成从2021-07-20到2021-08-19的默认样式的报表"
				}
			]
		}
	},
	"parameters": {
		"REPORT-TASK-PROPERTY": {
			"name": "REPORT-TASK-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config",
			"schema": {
				"$ref": "#/definitions/debug.report_task_generate_parameter"
			}
		}
	},
	"definitions": {
		"debug.report_task_generate_parameter": {
			"type": "object",
			"required": [
				"from",
				"to"
			],
			"properties": {
				"from": {
					"type": "string",
					"description": "Format: YYYYMMDD",
					"example": "20180110"
				},
				"to": {
					"type": "string",
					"description": "Format: YYYYMMDD",
					"example": "20180210"
				}
			}
		}
	}
}