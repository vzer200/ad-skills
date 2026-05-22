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
		"/api/ad/v3/debug/ha/active-standby/switch": {
			"description": "双机主备操作",
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
			"post": {
				"description": "切换双机主备",
				"tags": [
					"active-standby"
				],
				"summary": "switch active-standby",
				"operationId": "switch_active_standby",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_active_standby_switch"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug ha active-standby switch",
					"description": "切换双机主备"
				}
			]
		},
		"/api/ad/v3/debug/ha/active-standby/reset_failure_status": {
			"description": "备机故障操作",
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
			"post": {
				"description": "重置备机故障状态",
				"tags": [
					"active-standby"
				],
				"summary": "reset failure status of device",
				"operationId": "reset_failure_status",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_active_standby_reset_failure_status"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug ha active-standby reset_failure_status",
					"description": "重置备机故障状态"
				}
			]
		},
		"/api/ad/v3/debug/ha/active-standby/reset_failsafe_status/{device}": {
			"description": "零流量检测故障状态操作",
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
					"$ref": "#/parameters/device"
				}
			],
			"post": {
				"description": "重置零流量检测故障状态",
				"tags": [
					"active-standby"
				],
				"summary": "reset failsafe status of device",
				"operationId": "reset_failsafe_status",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_active_standby_reset_failure_status"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug ha active-standby reset_failsafe_status local",
					"description": "重置零流量检测故障状态"
				}
			]
		}
	},
	"parameters": {
		"device": {
			"name": "device",
			"in": "path",
			"required": false,
			"description": "Device location on Active Standby Mode",
			"type": "string",
			"enum": [
				"local",
				"peer"
			],
			"default": "local"
		}
	},
	"responses": {
		"operation_debug_active_standby_switch": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.active_standby_switch"
			}
		},
		"operation_debug_active_standby_reset_failure_status": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.active_standby_reset_failure_status"
			}
		}
	},
	"definitions": {
		"debug.active_standby_switch": {
			"type": "object",
			"properties": {
				"original": {
					"description": "原始状态",
					"$ref": "/api/stat/ha/active-standby.yaml#/definitions/stat.active_standby"
				},
				"current": {
					"description": "当前状态",
					"$ref": "/api/stat/ha/active-standby.yaml#/definitions/stat.active_standby"
				}
			}
		},
		"debug.active_standby_reset_failure_status": {
			"type": "object",
			"properties": {
				"original": {
					"description": "原始状态",
					"$ref": "/api/stat/ha/active-standby.yaml#/definitions/stat.active_standby"
				},
				"current": {
					"description": "当前状态",
					"$ref": "/api/stat/ha/active-standby.yaml#/definitions/stat.active_standby"
				}
			}
		}
	}
}