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
		"/api/ad/v3/stat/lc/dns-proxy": {
			"description": "获取DNS代理统计信息",
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
					"dns-proxy"
				],
				"summary": "get all dns-proxy statistics",
				"description": "获取DNS代理统计信息",
				"operationId": "get_statistics_of_dns_proxy_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_proxy"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_dns_proxy": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_proxy"
			}
		}
	},
	"definitions": {
		"stat.dns_proxy": {
			"type": "object",
			"properties": {
				"dns_servers": {
					"type": "array",
					"description": "dns服务器列表",
					"items": {
						"type": "object",
						"properties": {
							"link": {
								"type": "string",
								"description": "链路名称",
								"example": "wan_1"
							},
							"server": {
								"type": "string",
								"description": "服务器IP地址",
								"example": "192.168.1.1"
							},
							"health": {
								"type": "string",
								"description": "服务器健康状态（NORMAL-正常/FAILURE-故障）",
								"enum": [
									"NORMAL",
									"FAILURE"
								],
								"example": "NORMAL"
							}
						}
					}
				}
			}
		}
	}
}