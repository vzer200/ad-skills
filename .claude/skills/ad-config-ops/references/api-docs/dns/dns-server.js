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
		"/api/ad/v3/dns/dns-server": {
			"description": "DNS服务器配置管理操作",
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
					"dns-server"
				],
				"summary": "get dns-server",
				"description": "查看DNS服务器",
				"operationId": "get_dns_server",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_server_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-server"
				],
				"summary": "replace dns-server",
				"description": "修改DNS服务器",
				"operationId": "replace_dns_server",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-SERVER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_server_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-server"
				],
				"summary": "modify dns-server",
				"description": "增量修改DNS服务器",
				"operationId": "edit_dns_server",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-SERVER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_server_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns dns-server all_properties",
					"description": "查看DNS服务器全部属性"
				},
				{
					"command": "modify dns dns-server addresses [10.10.10.100] dns_detect { method icmp result_age 100 timeout 30 } port 553 state enable unknown_domain_policy proxy",
					"description": "修改DNS服务器配置，修改地址为：10.10.10.100 修改端口为：553 修改探测方式为：icmp(PING方式)，修改探测缓存时间为：100 修改tance超时时间为：30 修改不存在域名处理方式为：代理"
				}
			]
		}
	},
	"parameters": {
		"DNS-SERVER-CONFIG": {
			"name": "DNS-SERVER-CONFIG",
			"in": "body",
			"required": true,
			"description": "DNS服务器配置",
			"schema": {
				"$ref": "#/definitions/config.dns_server"
			}
		},
		"DNS-SERVER-PROPERTY": {
			"name": "DNS-SERVER-PROPERTY",
			"in": "body",
			"required": true,
			"description": "DNS服务器配置属性",
			"schema": {
				"$ref": "#/definitions/config.dns_server"
			}
		}
	},
	"responses": {
		"operation_config_dns_server_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_server"
			}
		}
	},
	"definitions": {
		"config.dns_server": {
			"type": "object",
			"properties": {
				"state": {
					"description": "DNS服务器使能状态，默认ENABLE",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"addresses": {
					"type": "array",
					"description": "DNS服务器设备地址列表",
					"items": {
						"description": "DNS服务器IP地址，必须是链路上的IP",
						"type": "string",
						"example": "6.200.11.1"
					},
					"maxItems": 16
				},
				"port": {
					"description": "DNS服务器端口，默认为53",
					"type": "integer",
					"default": 53,
					"example": 53,
					"maximum": 65535,
					"minimum": 1
				},
				"unknown_domain_policy": {
					"description": "不存在的域名处理，默认是拒绝",
					"type": "string",
					"enum": [
						"IGNORE",
						"REFUSE",
						"PROXY"
					],
					"default": "REFUSE",
					"example": "PROXY"
				},
				"dns_detect": {
					"type": "object",
					"description": "DNS探测配置",
					"properties": {
						"method": {
							"description": "DNS探测方式，PING方式、DNS根查询、DNS反向查询，默认是PTR-QUERY",
							"type": "string",
							"enum": [
								"ICMP",
								"NS-QUERY",
								"PTR-QUERY"
							],
							"default": "PTR-QUERY"
						},
						"timeout": {
							"description": "探测超时时间，默认为2",
							"type": "integer",
							"default": 2,
							"example": 2,
							"maximum": 60,
							"minimum": 1
						},
						"result_age": {
							"description": "探测结果缓存时间，默认为10800",
							"type": "integer",
							"default": 10800,
							"example": 10800,
							"maximum": 86400,
							"minimum": 60
						}
					}
				}
			}
		}
	}
}