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
		"/api/ad/v3/slb/pre-rule/sip/": {
			"description": "新建、查看前置策略（SIP）配置",
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
				"description": "查看当前已有的前置策略（SIP）配置信息",
				"operationId": "get_pre_rule_sip_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_config_pre_rule_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all pre-rule",
						"description": "查看当前已有的前置策略（SIP）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/sip/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/sip/ 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/sip/的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "SIP",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE"
						}
					}
				}
			},
			"post": {
				"tags": [
					"pre-rule"
				],
				"summary": "create new pre-rule",
				"description": "新建一个前置策略（SIP）配置",
				"operationId": "add_pre_rule_sip_list",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new pre-rule",
						"description": "新建一个前置策略（SIP）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/pre-rule/sip/",
							"body": {
								"name": "AI_url-sched_A",
								"service": "SIP",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/pre-rule/sip/ 响应",
						"description": "返回POST /api/ad/v3/slb/pre-rule/sip/的响应数据",
						"value": {
							"name": "AI_url-sched_A",
							"description": "example_string",
							"service": "SIP",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb pre-rule sip sip_rule1 source_address { type ip-address address 192.168.1.0-192.168.1.254 } sched_pool pool1",
					"description": "新建sip前置策略sip_rule1，匹配源地址范围为192.168.1.0-192.168.1.254，调度到节点池pool1"
				},
				{
					"command": "modify slb pre-rule sip sip_rule1 sched_pool pool2",
					"description": "修改sip前置策略sip_rule1，调度节点池改为pool2"
				},
				{
					"command": "list slb pre-rule sip sip_rule1",
					"description": "查看sip前置策略sip_rule1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/pre-rule/sip/{name}": {
			"description": "新建、查看、修改、删除指定的前置策略（SIP）配置",
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
				"description": "查看指定的前置策略（SIP）配置",
				"operationId": "get_pre_rule_sip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pre-rule",
						"description": "查看指定的前置策略（SIP）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/sip/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/sip/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/sip/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "SIP",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE"
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
				"description": "新建指定的前置策略（SIP）配置",
				"operationId": "create_pre_rule_sip",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new pre-rule",
						"description": "新建指定的前置策略（SIP）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/pre-rule/sip/{name}",
							"body": {
								"name": "AI_url-sched_B",
								"service": "SIP",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/pre-rule/sip/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/pre-rule/sip/{name}的响应数据",
						"value": {
							"name": "AI_url-sched_B",
							"description": "example_string",
							"service": "SIP",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE"
						}
					}
				}
			},
			"put": {
				"tags": [
					"pre-rule"
				],
				"summary": "replace specific pre-rule",
				"description": "修改指定的前置策略（SIP）配置",
				"operationId": "replace_pre_rule_sip",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific pre-rule",
						"description": "修改指定的前置策略（SIP）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/pre-rule/sip/{name}",
							"body": {
								"name": "url-sched",
								"service": "SIP",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/pre-rule/sip/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/pre-rule/sip/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "SIP",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"pre-rule"
				],
				"summary": "modify specific pre-rule",
				"description": "修改指定的前置策略（SIP）配置",
				"operationId": "edit_pre_rule_sip",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-SIP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific pre-rule",
						"description": "修改指定的前置策略（SIP）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/pre-rule/sip/{name}",
							"body": {
								"name": "url-sched",
								"service": "SIP",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_pool": "web_oa_80_pool",
								"sched_failure": "NEXT-RULE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/pre-rule/sip/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/pre-rule/sip/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "SIP",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"pre-rule"
				],
				"summary": "delete specific pre-rule",
				"description": "删除指定的前置策略（SIP）配置",
				"operationId": "delete_pre_rule_sip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific pre-rule",
						"description": "删除指定的前置策略（SIP）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/pre-rule/sip/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/pre-rule/sip/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/pre-rule/sip/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "SIP",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"destination_address": {
								"type": "ALL",
								"ref_isp_address_group": "{isp_address_group}",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"action": "SCHED-POOL",
							"notify_status_to_vs": "ENABLE",
							"sched_pool": "web_oa_80_pool",
							"sched_failure": "NEXT-RULE"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"PRE-RULE-SIP-CONFIG": {
			"name": "PRE-RULE-SIP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_sip"
			}
		},
		"PRE-RULE-SIP-PROPERTY": {
			"name": "PRE-RULE-SIP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_sip"
			}
		}
	},
	"responses": {
		"operation_config_pre_rule_sip_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_sip_list"
			}
		},
		"operation_config_pre_rule_sip_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_sip"
			}
		}
	},
	"definitions": {
		"config.pre_rule_sip_list": {
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
						"$ref": "#/definitions/config.pre_rule_sip"
					}
				}
			}
		},
		"config.pre_rule_sip": {
			"type": "object",
			"required": [
				"name",
				"sched_pool"
			],
			"properties": {
				"name": {
					"description": "sip前置调度策略名称",
					"type": "string",
					"example": "url-sched"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"service": {
					"description": "类型",
					"type": "string",
					"enum": [
						"SIP"
					],
					"default": "SIP"
				},
				"source_address": {
					"description": "源IP范围",
					"type": "object",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"description": "IP类型",
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
							"description": "Format: {IP} | {IP-RANGE} | {IP-SUBNET}",
							"type": "string",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"description": "引用用户地址集",
							"type": "string",
							"example": "{custom_address_group}"
						},
						"ref_isp_address_group": {
							"description": "ISP地址段",
							"type": "string",
							"example": "{isp_address_group}"
						}
					}
				},
				"destination_address": {
					"description": "目的地址",
					"type": "object",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"description": "地址类型",
							"type": "string",
							"enum": [
								"ALL",
								"ISP-ADDRESS-GROUP",
								"CUSTOM-ADDRESS-GROUP"
							],
							"default": "ALL",
							"example": "ALL"
						},
						"ref_isp_address_group": {
							"description": "ISP地址段",
							"type": "string",
							"example": "{isp_address_group}"
						},
						"ref_custom_address_group": {
							"description": "用户地址集",
							"type": "string",
							"example": "{custom_address_group}"
						}
					}
				},
				"action": {
					"description": "匹配策略后动作",
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
					"description": "调度节点池",
					"type": "string",
					"example": "web_oa_80_pool"
				},
				"sched_failure": {
					"description": "调度失败动作",
					"type": "string",
					"enum": [
						"NEXT-RULE",
						"DROP"
					],
					"default": "NEXT-RULE"
				}
			}
		}
	}
}