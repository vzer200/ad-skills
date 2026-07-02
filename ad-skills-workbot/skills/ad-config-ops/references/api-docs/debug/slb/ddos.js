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
				},
				"x-examples": {
					"request": {
						"summary": "generate virtual-service ddos report",
						"description": "导出DDoS攻击记录\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/export",
							"body": {
								"date": "20160718",
								"vports": [
									"80"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/export 响应",
						"description": "返回POST /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/export的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
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
				],
				"x-examples": {
					"request": {
						"summary": "clear virtual-service ddos",
						"description": "清除DDoS攻击记录\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/clear",
							"body": {
								"date": "20160718",
								"vports": [
									"80"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/clear 响应",
						"description": "返回POST /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/ddos/clear的响应数据",
						"value": {
							"ok": true
						}
					}
				}
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