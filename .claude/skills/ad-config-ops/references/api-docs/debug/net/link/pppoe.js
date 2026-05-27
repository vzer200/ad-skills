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
		"/api/ad/v3/debug/net/link/pppoe/{name}/{operation}": {
			"description": "pppoe链路播号与挂断",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "#/parameters/pppoe_operation"
				}
			],
			"post": {
				"tags": [
					"link-pppoe"
				],
				"summary": "operation link-pppoe connection",
				"description": "operation为dial时为手动拨号，operation为hangup时为手动挂断",
				"operationId": "operation_link_pppoe_connection",
				"responses": {
					"200": {
						"$ref": "/api/stat/net/link/pppoe.yaml#/responses/operation_stat_link_pppoe_status"
					}
				},
				"x-examples": {
					"request": {
						"summary": "operation link-pppoe connection",
						"description": "operation为dial时为手动拨号，operation为hangup时为手动挂断",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/net/link/pppoe/{name}/{operation}"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/net/link/pppoe/{name}/{operation} 响应",
						"description": "返回POST /api/ad/v3/debug/net/link/pppoe/{name}/{operation}的响应数据",
						"value": {
							"name": "AI_Unicom_100M_B",
							"state": "CONNECTED",
							"connected_time": 31012,
							"ip_address": "192.168.1.102",
							"netmask": "255.255.254.0",
							"gateway": "192.168.1.254",
							"dns_server_1": "8.8.8.8",
							"dns_server_2": "114.114.114.114"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug net link pppoe test dial",
					"description": "手动拨号test"
				},
				{
					"command": "run debug net link pppoe test hangup",
					"description": "手动挂断test"
				}
			]
		}
	},
	"parameters": {
		"pppoe_operation": {
			"name": "operation",
			"in": "path",
			"required": true,
			"description": "PPPoE操作类型",
			"type": "string",
			"enum": [
				"dial",
				"hangup"
			]
		}
	}
}