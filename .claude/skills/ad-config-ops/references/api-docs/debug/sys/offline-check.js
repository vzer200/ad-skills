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
		"/api/ad/v3/debug/sys/offline-check": {
			"description": "离线巡检操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"offline-check task"
				],
				"summary": "offline-check task",
				"description": "开始巡检任务",
				"operationId": "start_offline_check",
				"parameters": [
					{
						"$ref": "#/parameters/START-OFFLINE-CHECK"
					}
				]
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys offline-check scene xxx",
					"description": "开始巡检设备，巡检场景为xxx"
				}
			]
		}
	},
	"parameters": {
		"START-OFFLINE-CHECK": {
			"name": "START-OFFLINE-CHECK",
			"in": "body",
			"required": true,
			"description": "JSON Config",
			"schema": {
				"$ref": "#/definitions/debug.start_offline_check"
			}
		}
	},
	"definitions": {
		"debug.start_offline_check": {
			"type": "object",
			"required": [
				"scene"
			],
			"properties": {
				"scene": {
					"type": "string",
					"referSchema": [
						"/sys/offline-check"
					],
					"description": "巡检场景名称",
					"example": "标准场景"
				}
			}
		}
	}
}