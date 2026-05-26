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
		"/api/ad/v3/debug/sys/maintenance/{operation}": {
			"description": "执行系统维护操作",
			"parameters": [
				{
					"$ref": "#/parameters/maintenance_operation"
				},
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
				"tags": [
					"maintenance"
				],
				"summary": "start a maintenance operation",
				"operationId": "start_maintenance_operation",
				"description": "执行系统维护操作",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/VERIFY-OPERATOR"
					}
				],
				"responses": {
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys maintenance poweroff",
					"description": "执行系统关机"
				},
				{
					"command": "run debug sys maintenance reboot",
					"description": "执行系统重启"
				},
				{
					"command": "run debug sys maintenance restart-service",
					"description": "执行系统重启服务"
				}
			]
		}
	},
	"parameters": {
		"maintenance_operation": {
			"name": "operation",
			"in": "path",
			"required": true,
			"description": "Maintenance operation",
			"type": "string",
			"enum": [
				"restart-service",
				"reboot",
				"poweroff"
			]
		}
	}
}