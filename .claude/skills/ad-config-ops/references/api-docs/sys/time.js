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
		"/api/ad/v3/sys/time": {
			"description": "查看、修改系统时间",
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
					"time"
				],
				"summary": "get time",
				"description": "获取当前系统时间",
				"operationId": "get_time",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_object"
					}
				}
			},
			"put": {
				"tags": [
					"time"
				],
				"summary": "reset time",
				"description": "修改当前系统时间",
				"operationId": "reset time",
				"parameters": [
					{
						"$ref": "#/parameters/TIME-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_object"
					}
				}
			},
			"patch": {
				"tags": [
					"time"
				],
				"summary": "modify time",
				"description": "修改当前系统时间",
				"operationId": "edit_time",
				"parameters": [
					{
						"$ref": "#/parameters/TIME-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys time set_time \"2021-08-25 09:05:00\"",
					"description": "修改当前时间为2021-08-25 09:05:00"
				},
				{
					"command": "list sys time",
					"description": "获取当前系统时间"
				}
			]
		}
	},
	"parameters": {
		"TIME-CONFIG": {
			"name": "TIME-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.time"
			}
		},
		"TIME-PROPERTY": {
			"name": "TIME-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.time"
			}
		}
	},
	"responses": {
		"operation_config_time_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.time"
			}
		}
	},
	"definitions": {
		"config.time": {
			"type": "object",
			"required": [
				"set_time"
			],
			"properties": {
				"system_time": {
					"description": "系统时间",
					"type": "string",
					"example": "2017-08-11 12:30:05"
				},
				"set_time": {
					"description": "设置时间，格式：年-月-日 时:分:秒",
					"type": "string",
					"example": "2018-01-01 12:00:00"
				}
			}
		}
	}
}