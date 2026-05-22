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
		"/api/ad/v3/slb/pre-rule/any/": {
			"description": "新建、查看前置策略（Any）配置",
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
				"description": "查看当前已有的前置策略（Any）配置信息",
				"operationId": "get_pre_rule_any_list",
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
						"$ref": "#/responses/operation_config_pre_rule_any_object"
					}
				}
			},
			"post": {
				"tags": [
					"pre-rule"
				],
				"summary": "create new pre-rule",
				"description": "新建一个前置策略（Any）配置",
				"operationId": "add_pre_rule_any_list",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-ANY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_any_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb pre-rule any any_rule1 source_address { type isp-address-group ref_isp_address_group 联通（原网通） } sched_pool pool1",
					"description": "新建any前置策略any_rule1，匹配源地址范围类型为isp地址集，范围为联通，调度到节点池pool1"
				},
				{
					"command": "modify slb pre-rule any-proxy any_rule1 sched_failure drop",
					"description": "修改any前置策略any_rule1，将调度失败执行动作从默认值匹配下一条改为丢弃"
				},
				{
					"command": "list slb pre-rule any-proxy any_rule1",
					"description": "查看any前置策略any_rule1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/pre-rule/any/{name}": {
			"description": "新建、查看、修改、删除指定的前置策略（Any）配置",
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
				"description": "查看指定的前置策略（Any）配置",
				"operationId": "get_pre_rule_any",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_any_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"pre-rule"
				],
				"summary": "create new pre-rule",
				"description": "新建指定的前置策略（Any）配置",
				"operationId": "create_pre_rule_any",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-ANY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_any_object"
					}
				}
			},
			"put": {
				"tags": [
					"pre-rule"
				],
				"summary": "replace specific pre-rule",
				"description": "修改指定的前置策略（Any）配置",
				"operationId": "replace_pre_rule_any",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-ANY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_any_object"
					}
				}
			},
			"patch": {
				"tags": [
					"pre-rule"
				],
				"summary": "modify specific pre-rule",
				"description": "修改指定的前置策略（Any）配置",
				"operationId": "edit_pre_rule_any",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-ANY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_any_object"
					}
				}
			},
			"delete": {
				"tags": [
					"pre-rule"
				],
				"summary": "delete specific pre-rule",
				"description": "删除指定的前置策略（Any）配置",
				"operationId": "delete_pre_rule_any",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_any_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PRE-RULE-ANY-CONFIG": {
			"name": "PRE-RULE-ANY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_any"
			}
		},
		"PRE-RULE-ANY-PROPERTY": {
			"name": "PRE-RULE-ANY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_any"
			}
		}
	},
	"responses": {
		"operation_config_pre_rule_any_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_any_list"
			}
		},
		"operation_config_pre_rule_any_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_any"
			}
		}
	},
	"definitions": {
		"config.pre_rule_any_list": {
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
						"$ref": "#/definitions/config.pre_rule_any"
					}
				}
			}
		},
		"config.pre_rule_any": {
			"type": "object",
			"required": [
				"name",
				"sched_pool"
			],
			"properties": {
				"name": {
					"description": "ANY前置调度策略名称",
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
						"ANY"
					],
					"default": "ANY"
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
					"description": "指定当前前置策略的服务链，仅当inherit_vs_service_chain为DISBALE时生效",
					"example": "service_chain1_for_pre_rule"
				}
			}
		}
	}
}