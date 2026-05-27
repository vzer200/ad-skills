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
		"/api/ad/v3/slb/pre-rule/8583/": {
			"description": "新建、查看前置策略（8583）配置",
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
				"description": "查看当前已有的前置策略（8583）配置信息",
				"operationId": "get_pre_rule_8583_list",
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
						"$ref": "#/responses/operation_config_pre_rule_8583_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all pre-rule",
						"description": "查看当前已有的前置策略（8583）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/8583/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/8583/ 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/8583/的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "8583",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"tcp_stream_rule": {
								"mode": "CONTAIN",
								"case_sensitive": "DISABLE",
								"pattern": "One"
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
				"description": "新建一个前置策略（8583）配置",
				"operationId": "add_pre_rule_8583_list",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-8583-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_8583_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new pre-rule",
						"description": "新建一个前置策略（8583）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/pre-rule/8583/",
							"body": {
								"name": "AI_url-sched_A",
								"service": "8583",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_failure": "NEXT-RULE",
								"sched_pool": "web_oa_80_pool"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/pre-rule/8583/ 响应",
						"description": "返回POST /api/ad/v3/slb/pre-rule/8583/的响应数据",
						"value": {
							"name": "AI_url-sched_A",
							"description": "example_string",
							"service": "8583",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"tcp_stream_rule": {
								"mode": "CONTAIN",
								"case_sensitive": "DISABLE",
								"pattern": "One"
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
					"command": "create slb pre-rule 8583 8583_rule1 source_address { type isp-address-group ref_isp_address_group 联通（原网通） } tcp_stream_rule { mode contain pattern hello_world } action sched-pool sched_pool pool1",
					"description": "新建8583前置策略8583_rule1，匹配源地址范围类型为isp地址集，范围为联通，匹配tcp流中包含hello_world，调度到节点池pool1"
				},
				{
					"command": "modify slb pre-rule 8583 8583_rule1 sched_failure tcp-rst",
					"description": "修改8583前置策略8583_rule1，将调度失败执行动作从默认值匹配下一条改为发送rst关闭连接"
				},
				{
					"command": "list slb pre-rule 8583 8583_rule1",
					"description": "查看8583前置策略8583_rule1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/pre-rule/8583/{name}": {
			"description": "新建、查看、修改、删除指定的前置策略（8583）配置",
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
				"description": "查看指定的前置策略（8583）配置",
				"operationId": "get_pre_rule_8583",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_8583_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pre-rule",
						"description": "查看指定的前置策略（8583）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/pre-rule/8583/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/pre-rule/8583/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/pre-rule/8583/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "8583",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"tcp_stream_rule": {
								"mode": "CONTAIN",
								"case_sensitive": "DISABLE",
								"pattern": "One"
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
				"description": "新建指定的前置策略（8583）配置",
				"operationId": "create_pre_rule_8583",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-8583-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_8583_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new pre-rule",
						"description": "新建指定的前置策略（8583）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/pre-rule/8583/{name}",
							"body": {
								"name": "AI_url-sched_B",
								"service": "8583",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_failure": "NEXT-RULE",
								"sched_pool": "web_oa_80_pool"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/pre-rule/8583/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/pre-rule/8583/{name}的响应数据",
						"value": {
							"name": "AI_url-sched_B",
							"description": "example_string",
							"service": "8583",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"tcp_stream_rule": {
								"mode": "CONTAIN",
								"case_sensitive": "DISABLE",
								"pattern": "One"
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
				"description": "修改指定的前置策略（8583）配置",
				"operationId": "replace_pre_rule_8583",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-8583-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_8583_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific pre-rule",
						"description": "修改指定的前置策略（8583）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/pre-rule/8583/{name}",
							"body": {
								"name": "url-sched",
								"service": "8583",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_failure": "NEXT-RULE",
								"sched_pool": "web_oa_80_pool"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/pre-rule/8583/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/pre-rule/8583/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "8583",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"tcp_stream_rule": {
								"mode": "CONTAIN",
								"case_sensitive": "DISABLE",
								"pattern": "One"
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
				"description": "修改指定的前置策略（8583）配置",
				"operationId": "edit_pre_rule_8583",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-8583-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_8583_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific pre-rule",
						"description": "修改指定的前置策略（8583）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/pre-rule/8583/{name}",
							"body": {
								"name": "url-sched",
								"service": "8583",
								"action": "SCHED-POOL",
								"notify_status_to_vs": "ENABLE",
								"sched_failure": "NEXT-RULE",
								"sched_pool": "web_oa_80_pool"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/pre-rule/8583/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/pre-rule/8583/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "8583",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"tcp_stream_rule": {
								"mode": "CONTAIN",
								"case_sensitive": "DISABLE",
								"pattern": "One"
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
				"description": "删除指定的前置策略（8583）配置",
				"operationId": "delete_pre_rule_8583",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_8583_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific pre-rule",
						"description": "删除指定的前置策略（8583）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/pre-rule/8583/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/pre-rule/8583/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/pre-rule/8583/{name}的响应数据",
						"value": {
							"name": "url-sched",
							"description": "example_string",
							"service": "8583",
							"source_address": {
								"type": "ALL",
								"address": "192.168.1.1/24",
								"ref_custom_address_group": "{custom_address_group}",
								"ref_isp_address_group": "{isp_address_group}"
							},
							"tcp_stream_rule": {
								"mode": "CONTAIN",
								"case_sensitive": "DISABLE",
								"pattern": "One"
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
		"PRE-RULE-8583-CONFIG": {
			"name": "PRE-RULE-8583-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_8583"
			}
		},
		"PRE-RULE-8583-PROPERTY": {
			"name": "PRE-RULE-8583-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_8583"
			}
		}
	},
	"responses": {
		"operation_config_pre_rule_8583_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_8583_list"
			}
		},
		"operation_config_pre_rule_8583_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_8583"
			}
		}
	},
	"definitions": {
		"config.pre_rule_8583_list": {
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
						"$ref": "#/definitions/config.pre_rule_8583"
					}
				}
			}
		},
		"config.pre_rule_8583": {
			"type": "object",
			"required": [
				"name",
				"action"
			],
			"properties": {
				"name": {
					"description": "8583前置调度策略名称",
					"type": "string",
					"example": "url-sched"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"service": {
					"description": "服务类型",
					"type": "string",
					"enum": [
						"8583"
					],
					"default": "8583"
				},
				"source_address": {
					"description": "源地址",
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
							"description": "地址",
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
				"tcp_stream_rule": {
					"description": "8583匹配关系",
					"type": "object",
					"required": [
						"mode"
					],
					"properties": {
						"mode": {
							"description": "8583匹配关系描述",
							"type": "string",
							"enum": [
								"EQUAL",
								"NON-EQUAL",
								"CONTAIN",
								"NON-CONTAIN",
								"CONTAIN-HEXADECIMAL",
								"NON-CONTAIN-HEXADECIMAL",
								"WILDCARD",
								"NON-WILDCARD",
								"REGULAR",
								"NON-REGULAR",
								"NONE"
							],
							"example": "CONTAIN"
						},
						"case_sensitive": {
							"description": "是否区分大小写",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"pattern": {
							"description": "匹配模式",
							"type": "string",
							"minLength": 1,
							"maxLength": 255,
							"example": "One"
						}
					}
				},
				"action": {
					"description": "匹配策略后动作",
					"type": "string",
					"enum": [
						"SCHED-POOL",
						"TCP-FIN",
						"TCP-RST"
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
						"TCP-FIN",
						"TCP-RST"
					],
					"default": "NEXT-RULE"
				}
			}
		}
	}
}