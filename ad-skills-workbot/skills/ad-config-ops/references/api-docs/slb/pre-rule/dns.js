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
		"/api/ad/v3/slb/pre-rule/dns/": {
			"description": "新建、查看前置策略（DNS）配置",
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
				"description": "查看当前已有的前置策略（DNS）配置信息",
				"operationId": "get_pre_rule_dns_list",
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
						"$ref": "#/responses/operation_config_pre_rule_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all pre-rule",
						"description": "查看当前已有的前置策略（DNS）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/dns/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/dns/ 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/dns/的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "DNS",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			},
			"post": {
				"tags": [
					"pre-rule"
				],
				"summary": "create new pre-rule",
				"description": "新建一个前置策略（DNS）配置",
				"operationId": "add_pre_rule_dns_list",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-DNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new pre-rule",
						"description": "新建一个前置策略（DNS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/pre-rule/dns/",
							"body": {
								"name": "AI_url-sched_A",
								"service": "DNS",
								"dns_query_rule": {
									"type": "ALL",
									"domain": "*.test.com"
								},
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE",
								"inherit_vs_service_chain": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/pre-rule/dns/ 响应",
						"description": "返回POST /api/ad/v3/slb/pre-rule/dns/的响应数据",
						"value": {
							"name": "AI_url-sched_A",
							"description": "example_string",
							"service": "DNS",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb pre-rule dns abc dns_query_rule { type all domain bbb.com } sched_pool xxx",
					"description": "新建DNS前置策略abc，查询类型为ALL，查询域名为bbb.com，调度到节点池xxx"
				},
				{
					"command": "modify slb pre-rule dns abc source_address { type isp-address-group ref_isp_address_group 电信 }",
					"description": "修改DNS前置策略，源地址匹配条件修改为源IP范围为ISP地址类型，地址集为电信"
				},
				{
					"command": "list slb pre-rule dns abc",
					"description": "查看DNS前置策略abc的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/pre-rule/dns/{name}": {
			"description": "新建、查看、修改、删除指定的前置策略（DNS）配置",
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
				"description": "查看指定的前置策略（DNS）配置",
				"operationId": "get_pre_rule_dns",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pre-rule",
						"description": "查看指定的前置策略（DNS）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/dns/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/dns/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/dns/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "DNS",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"pre-rule"
				],
				"summary": "create new pre-rule",
				"description": "新建指定的前置策略（DNS）配置",
				"operationId": "create_pre_rule_dns",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-DNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new pre-rule",
						"description": "新建指定的前置策略（DNS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/pre-rule/dns/{name}",
							"body": {
								"name": "AI_url-sched_B",
								"service": "DNS",
								"dns_query_rule": {
									"type": "ALL",
									"domain": "*.test.com"
								},
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE",
								"inherit_vs_service_chain": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/pre-rule/dns/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/pre-rule/dns/{name}的响应数据",
						"value": {
							"name": "AI_url-sched_B",
							"description": "example_string",
							"service": "DNS",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			},
			"put": {
				"tags": [
					"pre-rule"
				],
				"summary": "replace specific pre-rule",
				"description": "修改指定的前置策略（DNS）配置",
				"operationId": "replace_pre_rule_dns",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-DNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific pre-rule",
						"description": "修改指定的前置策略（DNS）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/pre-rule/dns/{name}",
							"body": {
								"name": "url-sched",
								"service": "DNS",
								"dns_query_rule": {
									"type": "ALL",
									"domain": "*.test.com"
								},
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE",
								"inherit_vs_service_chain": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/pre-rule/dns/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/pre-rule/dns/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "DNS",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"pre-rule"
				],
				"summary": "modify specific pre-rule",
				"description": "修改指定的前置策略（DNS）配置",
				"operationId": "edit_pre_rule_dns",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-DNS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific pre-rule",
						"description": "修改指定的前置策略（DNS）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/pre-rule/dns/{name}",
							"body": {
								"name": "url-sched",
								"service": "DNS",
								"dns_query_rule": {
									"type": "ALL",
									"domain": "*.test.com"
								},
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE",
								"inherit_vs_service_chain": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/pre-rule/dns/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/pre-rule/dns/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "DNS",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"pre-rule"
				],
				"summary": "delete specific pre-rule",
				"description": "删除指定的前置策略（DNS）配置",
				"operationId": "delete_pre_rule_dns",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_dns_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific pre-rule",
						"description": "删除指定的前置策略（DNS）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/pre-rule/dns/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/pre-rule/dns/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/pre-rule/dns/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "DNS",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"dns_query_rule": {
								"type": "ALL",
								"type_value": 1,
								"domain": "*.test.com"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE",
							"inherit_vs_service_chain": "ENABLE",
							"service_chain": "service_chain1_for_pre_rule"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"PRE-RULE-DNS-CONFIG": {
			"name": "PRE-RULE-DNS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_dns"
			}
		},
		"PRE-RULE-DNS-PROPERTY": {
			"name": "PRE-RULE-DNS-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_dns"
			}
		}
	},
	"responses": {
		"operation_config_pre_rule_dns_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_dns_list"
			}
		},
		"operation_config_pre_rule_dns_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_dns"
			}
		}
	},
	"definitions": {
		"config.pre_rule_dns_list": {
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
						"$ref": "#/definitions/config.pre_rule_dns"
					}
				}
			}
		},
		"config.pre_rule_dns": {
			"type": "object",
			"required": [
				"name",
				"dns_query_rule",
				"sched_pool"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定前置策略的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "url-sched"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"service": {
					"description": "必选参数；指定前置策略的类型；DNS前置策略中，此字段设置为dns。",
					"type": "string",
					"enum": [
						"DNS"
					],
					"default": "DNS"
				},
				"source_address": {
					"description": "可选参数; 指定前置策略匹配的源地址，默认为所有源地址。",
					"type": "object",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"description": "必选参数; 指定前置策略匹配的源地址类型，源IP范围的类型：all（所有IP）、ip-address（IP地址）、custom-address-group（用户地址集）、isp-address-group（ISP地址集），默认为all。",
							"type": "string",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP",
								"ISP-ADDRESS-GROUP"
							],
							"default": "ALL",
							"example": "ALL"
						},
						"address": {
							"description": "可选参数; 源地址类型为ip-address时，指定具体的IP地址或地址范围或子网。",
							"type": "string",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"description": "可选参数; 源地址类型为custom_address_group时，指定具体的用户地址集。",
							"type": "string",
							"example": "{custom_address_group}"
						},
						"ref_isp_address_group": {
							"description": "可选参数; 源地址类型为isp_address_group时，指定具体的isp地址段。",
							"type": "string",
							"example": "{isp_address_group}"
						}
					}
				},
				"dns_query_rule": {
					"description": "必选参数；DNS前置策略的高级匹配条件，可以配置查询类型和查询域名。",
					"type": "object",
					"required": [
						"type",
						"domain"
					],
					"properties": {
						"type": {
							"description": "必选参数；指定前置策略匹配的DNS类型，可选类型有：all、a、ns、cname、soa、ptr、mx、txt、aaaa、spf、other。",
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
							]
						},
						"type_value": {
							"description": "可选参数；自定义查询类型，如果查询类型选择other时，必须配置此项，该值为整数。",
							"type": "integer",
							"maximum": 255,
							"minimum": 0,
							"example": 1
						},
						"domain": {
							"description": "必选参数；指定前置策略匹配的查询域名。",
							"type": "string",
							"example": "*.test.com"
						}
					}
				},
				"action": {
					"description": "可选参数；指定该前置策略匹配后的执行动作，默认并只有一个动作为调度节点池，值为sched-pool。",
					"type": "string",
					"enum": [
						"SCHED-POOL"
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
					"default": "ENABLE"
				},
				"sched_pool": {
					"description": "必选参数; 执行动作为sched-pool时，指定调度的节点池。",
					"type": "string",
					"example": "web_oa_80_pool"
				},
				"sched_failure": {
					"description": "可选参数; 执行动作为sched-pool时，指定调度失败后的执行动作，可选有：next-rule（匹配下一条），drop（丢弃），默认为next-rule。",
					"type": "string",
					"enum": [
						"NEXT-RULE",
						"DROP"
					],
					"default": "NEXT-RULE"
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