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
		"/api/ad/v3/slb/service-monitor/dns/": {
			"description": "新建、查看监视器（DNS）配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get all service-monitor-dns",
				"description": "查看当前已有的监视器（DNS）配置信息",
				"operationId": "get_service_monitor_dns_list",
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
						"$ref": "#/responses/operation_config_service_monitor_dns_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor-dns",
						"description": "查看当前已有的监视器（DNS）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/dns/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/dns/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/dns/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "http",
									"description": "example_string",
									"type": "DNS",
									"timeout": 16,
									"interval": 5,
									"err_interval": 2,
									"err_interval_state": "DISABLE",
									"records_type": "AUTO",
									"host": "*",
									"port": 0,
									"debug_mode": "DISABLE",
									"gateway_detect": "DISABLE",
									"dns_query_domain": "www.abc.com",
									"expect_dns_answer": "*"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-dns",
				"description": "新建一个监视器（DNS）配置",
				"operationId": "add_service_monitor_dns_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-DNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-dns",
						"description": "新建一个监视器（DNS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/dns/",
							"body": {
								"name": "AI_http_dns_A",
								"type": "DNS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"records_type": "AUTO",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"dns_query_domain": "www.abc.com",
								"expect_dns_answer": "*"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/dns/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/dns/的响应数据",
						"value": {
							"name": "AI_http_dns_A",
							"description": "example_string",
							"type": "DNS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"records_type": "AUTO",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"dns_query_domain": "www.abc.com",
							"expect_dns_answer": "*"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor dns dnsmonitor description DNS监视器 host 1.1.1.1 port 53 debug_mode enable dns_query_domain www.baidu.com",
					"description": "新建dns类型的监视器dnsmonitor,监视地址为1.1.1.1,监视端口为53,启用调试模式,监视域名为www.baidu.com"
				},
				{
					"command": "modify slb service-monitor dns dnsmonitor expect_dns_answer 2.2.2.2",
					"description": "修改dns监视器dnsmonitor的期望dns应答为2.2.2.2"
				},
				{
					"command": "list slb service-monitor dns dnsmonitor",
					"description": "查看dns监视器dnsmonitor的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/dns/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（DNS）配置",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get specific service-monitor-dns",
				"description": "查看指定的监视器（DNS）配置",
				"operationId": "get_service_monitor_dns",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor-dns",
						"description": "查看指定的监视器（DNS）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/dns/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/dns/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/dns/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "DNS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"records_type": "AUTO",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"dns_query_domain": "www.abc.com",
							"expect_dns_answer": "*"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-dns",
				"description": "新建指定的监视器（DNS）配置",
				"operationId": "create_service_monitor_dns",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-DNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-dns",
						"description": "新建指定的监视器（DNS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/dns/{name}",
							"body": {
								"name": "AI_http_dns_B",
								"type": "DNS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"records_type": "AUTO",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"dns_query_domain": "www.abc.com",
								"expect_dns_answer": "*"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/dns/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/dns/{name}的响应数据",
						"value": {
							"name": "AI_http_dns_B",
							"description": "example_string",
							"type": "DNS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"records_type": "AUTO",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"dns_query_domain": "www.abc.com",
							"expect_dns_answer": "*"
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-dns",
				"description": "修改指定的监视器（DNS）配置",
				"operationId": "replace_service_monitor_dns",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-DNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-monitor-dns",
						"description": "修改指定的监视器（DNS）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-monitor/dns/{name}",
							"body": {
								"name": "http",
								"type": "DNS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"records_type": "AUTO",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"dns_query_domain": "www.abc.com",
								"expect_dns_answer": "*"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-monitor/dns/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-monitor/dns/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "DNS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"records_type": "AUTO",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"dns_query_domain": "www.abc.com",
							"expect_dns_answer": "*"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-dns",
				"description": "修改指定的监视器（DNS）配置",
				"operationId": "edit_service_monitor_dns",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-DNS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-monitor-dns",
						"description": "修改指定的监视器（DNS）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-monitor/dns/{name}",
							"body": {
								"name": "http",
								"type": "DNS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"records_type": "AUTO",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"dns_query_domain": "www.abc.com",
								"expect_dns_answer": "*"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-monitor/dns/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-monitor/dns/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "DNS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"records_type": "AUTO",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"dns_query_domain": "www.abc.com",
							"expect_dns_answer": "*"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-dns",
				"description": "删除指定的监视器（DNS）配置",
				"operationId": "delete_service_monitor_dns",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-monitor-dns",
						"description": "删除指定的监视器（DNS）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-monitor/dns/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-monitor/dns/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-monitor/dns/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "DNS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"records_type": "AUTO",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"dns_query_domain": "www.abc.com",
							"expect_dns_answer": "*"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-DNS-CONFIG": {
			"name": "SERVICE-MONITOR-DNS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_dns"
			}
		},
		"SERVICE-MONITOR-DNS-PROPERTY": {
			"name": "SERVICE-MONITOR-DNS-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_dns"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_dns_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_dns_list"
			}
		},
		"operation_config_service_monitor_dns_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_dns"
			}
		}
	},
	"definitions": {
		"config.service_monitor_dns_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "配置数量上限",
					"type": "integer",
					"example": 4000
				},
				"total_pages": {
					"description": "总页数",
					"type": "integer",
					"example": 5
				},
				"page_number": {
					"description": "当前页号",
					"type": "integer",
					"example": 5
				},
				"page_size": {
					"description": "每页列表长度",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "当前项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "当前页项目数",
					"type": "integer",
					"example": 8
				},
				"items": {
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.service_monitor_dns"
					}
				}
			}
		},
		"config.service_monitor_dns": {
			"type": "object",
			"required": [
				"name",
				"dns_query_domain"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定监视器的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "只读参数；监视器类型。",
					"type": "string",
					"enum": [
						"DNS"
					],
					"default": "DNS"
				},
				"timeout": {
					"description": "可选参数；设置监视超时时间。",
					"type": "integer",
					"default": 16,
					"minimum": 1,
					"maximum": 86400,
					"example": 16
				},
				"interval": {
					"description": "可选参数；设置监视间隔时间。",
					"type": "integer",
					"default": 5,
					"minimum": 1,
					"maximum": 86400,
					"example": 5
				},
				"err_interval": {
					"description": "故障间隔时间。",
					"type": "integer",
					"default": 2,
					"example": 2,
					"maximum": 86400,
					"minimum": 1
				},
				"err_interval_state": {
					"description": "故障间隔开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"records_type": {
					"description": "请求类型",
					"type": "string",
					"enum": [
						"AUTO",
						"A",
						"AAAA",
						"CNAME"
					],
					"default": "AUTO",
					"example": "AUTO"
				},
				"host": {
					"description": "可选参数；支持ip地址和*;默认为*，表示监视节点池中的地址；当启用gateway_detect时必须指定ip地址",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "可选参数；指定监视端口；取值范围[0,65535]，默认为53",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 53
				},
				"debug_mode": {
					"description": "可选参数；调试模式开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"gateway_detect": {
					"description": "可选参数；透明监控开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"dns_query_domain": {
					"description": "必选参数；指定监控域名。",
					"type": "string",
					"maxLength": 255,
					"example": "www.abc.com"
				},
				"expect_dns_answer": {
					"description": "可选参数；指定期望的dns应答内容,默认为*,设备会查询any记录,收到任何记录应答均在线;指定ip地址时会发送A/AAAA记录;指定域名时会发送cname记录",
					"type": "string",
					"optionalEnum": [
						"*"
					],
					"maxLength": 255,
					"default": "*",
					"example": "abc.com"
				}
			}
		}
	}
}