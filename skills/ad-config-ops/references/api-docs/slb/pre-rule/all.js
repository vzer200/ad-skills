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
		"/api/ad/v3/slb/pre-rule/all/": {
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
					"pre-rule"
				],
				"summary": "get all pre-rule",
				"description": "",
				"operationId": "get_pre_rule_list",
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
						"$ref": "#/responses/operation_config_pre_rule_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all pre-rule",
						"description": "GET /api/ad/v3/slb/pre-rule/all/",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/all/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/all/ 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/all/的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": null,
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"tcp_stream_rule": null,
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"http_request_method_rule": "ALL",
							"http_request_version_rule": "ALL",
							"http_request_uri_rule": null,
							"http_request_header_rules": [
								"example_item"
							],
							"ssl_version_rule": "ALL",
							"ssl_variable_rules": [
								"example_item"
							],
							"action": "SCHED-POOL",
							"notify_status_to_vs": "DISABLE",
							"http_response": "200_OK",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"sched_failure_http_response": "400_Not_Found",
							"rewrite_requests": [],
							"rewrite_responses": [],
							"netns": "default",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/pre-rule/all/{name}": {
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
					"pre-rule"
				],
				"summary": "get specific pre-rule",
				"description": "",
				"operationId": "get_pre_rule",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pre-rule",
						"description": "GET /api/ad/v3/slb/pre-rule/all/{name}",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/all/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/all/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/all/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": null,
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"tcp_stream_rule": null,
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"http_request_method_rule": "ALL",
							"http_request_version_rule": "ALL",
							"http_request_uri_rule": null,
							"http_request_header_rules": [
								"example_item"
							],
							"ssl_version_rule": "ALL",
							"ssl_variable_rules": [
								"example_item"
							],
							"action": "SCHED-POOL",
							"notify_status_to_vs": "DISABLE",
							"http_response": "200_OK",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"sched_failure_http_response": "400_Not_Found",
							"rewrite_requests": [],
							"rewrite_responses": [],
							"netns": "default",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/": {
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
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"pre-rule"
				],
				"summary": "get specific virtual service referenced pre-rule",
				"description": "",
				"operationId": "get_vs_pre_rule_list",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual service referenced pre-rule",
						"description": "GET /api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/ 响应",
						"description": "返回GET /api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/的响应数据",
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
									"name": "url-sched",
									"description": "example_string",
									"service": null,
									"source_address": {
										"type": "ALL",
										"address": "192.168.1.1/24",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"destination_address": {
										"type": "ALL",
										"ref_isp_address_group": "{isp_address_group}",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"tcp_stream_rule": null,
									"dns_query_rule": {
										"type": "ALL",
										"type_value": 1,
										"domain": "*.test.com"
									},
									"http_request_method_rule": "ALL",
									"http_request_version_rule": "ALL",
									"http_request_uri_rule": null,
									"http_request_header_rules": [
										"example_item"
									],
									"ssl_version_rule": "ALL",
									"ssl_variable_rules": [
										"example_item"
									],
									"action": "SCHED-POOL",
									"notify_status_to_vs": "DISABLE",
									"http_response": "200_OK",
									"sched_pool": "web_oa_80_pool",
									"sched_failure": "NEXT-RULE",
									"sched_failure_http_response": "400_Not_Found",
									"rewrite_requests": [],
									"rewrite_responses": [],
									"netns": "default",
									"inherit_vs_service_chain": "ENABLE",
									"service_chain": "service_chain1_for_pre_rule"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/{pre_rule_name}": {
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
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "#/parameters/pre_rule_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"pre-rule"
				],
				"summary": "get specific pre-rule of virtual service",
				"description": "",
				"operationId": "get_vs_pre_rule",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pre-rule of virtual service",
						"description": "GET /api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/{pre_rule_name}\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/{pre_rule_name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/{pre_rule_name} 响应",
						"description": "返回GET /api/ad/v3/slb/virtual-service/{virtual_service_name}/pre-rule/{pre_rule_name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": null,
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"tcp_stream_rule": null,
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"http_request_method_rule": "ALL",
							"http_request_version_rule": "ALL",
							"http_request_uri_rule": null,
							"http_request_header_rules": [
								"example_item"
							],
							"ssl_version_rule": "ALL",
							"ssl_variable_rules": [
								"example_item"
							],
							"action": "SCHED-POOL",
							"notify_status_to_vs": "DISABLE",
							"http_response": "200_OK",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"sched_failure_http_response": "400_Not_Found",
							"rewrite_requests": [],
							"rewrite_responses": [],
							"netns": "default",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"PRE-RULE-ALL-CONFIG": {
			"name": "PRE-RULE-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.pre_rule"
			}
		},
		"PRE-RULE-ALL-PROPERTY": {
			"name": "PRE-RULE-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.pre_rule"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "virtual service name",
			"required": true
		},
		"pre_rule_name": {
			"name": "pre_rule_name",
			"in": "path",
			"type": "string",
			"description": "config pre-rule name",
			"required": true
		}
	},
	"responses": {
		"operation_config_pre_rule_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_list"
			}
		},
		"operation_config_pre_rule_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule"
			}
		}
	},
	"definitions": {
		"config.pre_rule_list": {
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
						"$ref": "#/definitions/config.pre_rule"
					}
				}
			}
		},
		"config.pre_rule": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "url-sched"
				},
				"description": {
					"type": "string"
				},
				"service": {
					"$ref": "/api/{common}.yaml#/definitions/config.service_type"
				},
				"source_address": {
					"type": "object",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP"
							],
							"default": "ALL",
							"example": "ALL"
						},
						"address": {
							"type": "string",
							"description": "Format: {IP} | {IP-RANGE} | {IP-SUBNET}",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"type": "string",
							"example": "{custom_address_group}"
						}
					}
				},
				"destination_address": {
					"type": "object",
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"ALL",
								"ISP-ADDRESS-GROUP",
								"CUSTOM-ADDRESS-GROUP"
							],
							"default": "ALL"
						},
						"ref_isp_address_group": {
							"type": "string",
							"example": "{isp_address_group}"
						},
						"ref_custom_address_group": {
							"type": "string",
							"example": "{custom_address_group}"
						}
					}
				},
				"tcp_stream_rule": {
					"$ref": "/api/{common}.yaml#/definitions/config.str_match_component"
				},
				"dns_query_rule": {
					"type": "object",
					"required": [
						"query_domain"
					],
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"ALL",
								"A",
								"NS",
								"CNAME",
								"SOA",
								"PTR",
								"MX",
								"TXT",
								"AAAA",
								"SPF",
								"OTHER"
							],
							"default": "ALL"
						},
						"type_value": {
							"type": "integer",
							"description": "",
							"example": 1
						},
						"domain": {
							"type": "string",
							"example": "*.test.com"
						}
					}
				},
				"http_request_method_rule": {
					"type": "string",
					"enum": [
						"ALL",
						"GET",
						"POST"
					],
					"default": "ALL"
				},
				"http_request_version_rule": {
					"type": "string",
					"enum": [
						"ALL",
						"HTTP/1.0",
						"HTTP/1.1"
					],
					"default": "ALL"
				},
				"http_request_uri_rule": {
					"$ref": "/api/{common}.yaml#/definitions/config.str_match_component"
				},
				"http_request_header_rules": {
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.http_header_match_component"
					}
				},
				"ssl_version_rule": {
					"type": "string",
					"enum": [
						"ALL",
						"V1",
						"V2",
						"V3"
					],
					"default": "ALL"
				},
				"ssl_variable_rules": {
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.ssl_match_component"
					}
				},
				"action": {
					"type": "string",
					"enum": [
						"SCHED-POOL",
						"SCHED-POOL-AND-REWRITE",
						"TCP-FIN",
						"TCP-RST",
						"HTTP-RESPONSE"
					],
					"default": "SCHED-POOL"
				},
				"notify_status_to_vs": {
					"description": "调度节点池状态是否通知vs",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"http_response": {
					"type": "string",
					"example": "200_OK"
				},
				"sched_pool": {
					"type": "string",
					"example": "web_oa_80_pool"
				},
				"sched_failure": {
					"type": "string",
					"enum": [
						"NEXT-RULE",
						"DROP",
						"TCP-FIN",
						"TCP-RST",
						"HTTP-RESPONSE"
					],
					"default": "NEXT-RULE"
				},
				"sched_failure_http_response": {
					"type": "string",
					"example": "400_Not_Found"
				},
				"rewrite_requests": {
					"type": "array",
					"items": {
						"type": "string",
						"example": "{rewrite-request}"
					}
				},
				"rewrite_responses": {
					"type": "array",
					"items": {
						"type": "string",
						"example": "{rewrite-response}"
					}
				},
				"netns": {
					"type": "string",
					"default": "default"
				},
				"inherit_vs_service_chain": {
					"type": "string",
					"description": "继承虚拟服务的服务链",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"service_chain": {
					"type": "string",
					"description": "指定当前前置策略的服务链，仅当inherit_vs_service_chain为DISABLE时生效",
					"example": "service_chain1_for_pre_rule"
				}
			}
		}
	}
}