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
		"/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/export": {
			"description": "导出DDoS攻击记录",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/virtual_service_name"
				}
			],
			"post": {
				"tags": [
					"http-defence"
				],
				"summary": "generate virtual-service ddos report",
				"description": "导出DDoS攻击记录",
				"operationId": "generate_virtual_service_ddos_report",
				"parameters": [
					{
						"$ref": "#/parameters/DDOS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			}
		},
		"/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/clear": {
			"description": "清除DDoS攻击记录操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/virtual_service_name"
				}
			],
			"post": {
				"tags": [
					"http-defence"
				],
				"summary": "clear virtual-service ddos",
				"description": "清除DDoS攻击记录",
				"operationId": "clear_virtual_service_ddos",
				"parameters": [
					{
						"$ref": "#/parameters/DDOS-CONFIG"
					}
				]
			},
			"__sfcli_example__": [
				{
					"command": " run  debug slb virtual-service vs1 ddos clear date 2021-08-18",
					"description": "清除虚拟服务vs1时间为2021-08-18的ddos日志"
				}
			]
		}
	},
	"parameters": {
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"required": true,
			"description": "Support 'ALL' or specific virtual-service config name"
		},
		"DDOS-CONFIG": {
			"name": "DDOS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/debug.ddos_date"
			}
		}
	},
	"definitions": {
		"debug.ddos_date": {
			"type": "object",
			"required": [
				"date"
			],
			"properties": {
				"date": {
					"type": "string",
					"description": "日期，Format: YYYYMMDD",
					"example": "20160718"
				}
			}
		}
	}
}