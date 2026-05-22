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
		"/api/ad/v3/slb/pre-rule/tcp-proxy/": {
			"description": "新建、查看前置策略（TCP-L7）配置",
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
				"description": "查看当前已有的前置策略（TCP-L7）配置信息",
				"operationId": "get_pre_rule_tcp_proxy_list",
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
						"$ref": "#/responses/operation_config_pre_rule_tcp_proxy_object"
					}
				}
			},
			"post": {
				"tags": [
					"pre-rule"
				],
				"summary": "create new pre-rule",
				"description": "新建一个前置策略（TCP-L7）配置",
				"operationId": "add_pre_rule_tcp_proxy_list",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-TCP-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_tcp_proxy_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb pre-rule tcp-proxy tcp_rule1 source_address { type isp-address-group ref_isp_address_group 联通（原网通） } tcp_stream_rule { mode contain pattern hello_world } sched_pool pool1",
					"description": "新建七层tcp前置策略tcp_rule1，匹配源地址范围类型为isp地址集，范围为联通，匹配tcp流中包含hello_world，调度到节点池pool1"
				},
				{
					"command": "modify slb pre-rule tcp-proxy tcp_rule1 sched_failure tcp-rst",
					"description": "修改七层tcp前置策略tcp_rule1，将调度失败执行动作从默认值匹配下一条改为发送rst关闭连接"
				},
				{
					"command": "list slb pre-rule tcp-proxy tcp_rule1",
					"description": "查看七层tcp前置策略tcp_rule1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/pre-rule/tcp-proxy/{name}": {
			"description": "新建、查看、修改、删除指定的前置策略（TCP-L7）配置",
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
				"description": "查看指定的前置策略（TCP-L7）配置",
				"operationId": "get_pre_rule_tcp_proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_tcp_proxy_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"pre-rule"
				],
				"summary": "create new pre-rule",
				"description": "新建指定的前置策略（TCP-L7）配置",
				"operationId": "create_pre_rule_tcp_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-TCP-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_tcp_proxy_object"
					}
				}
			},
			"put": {
				"tags": [
					"pre-rule"
				],
				"summary": "replace specific pre-rule",
				"description": "修改指定的前置策略（TCP-L7）配置",
				"operationId": "replace_pre_rule_tcp_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-TCP-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_tcp_proxy_object"
					}
				}
			},
			"patch": {
				"tags": [
					"pre-rule"
				],
				"summary": "modify specific pre-rule",
				"description": "修改指定的前置策略（TCP-L7）配置",
				"operationId": "edit_pre_rule_tcp_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/PRE-RULE-TCP-PROXY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_tcp_proxy_object"
					}
				}
			},
			"delete": {
				"tags": [
					"pre-rule"
				],
				"summary": "delete specific pre-rule",
				"description": "删除指定的前置策略（TCP-L7）配置",
				"operationId": "delete_pre_rule_tcp_proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pre_rule_tcp_proxy_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PRE-RULE-TCP-PROXY-CONFIG": {
			"name": "PRE-RULE-TCP-PROXY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_tcp_proxy"
			}
		},
		"PRE-RULE-TCP-PROXY-PROPERTY": {
			"name": "PRE-RULE-TCP-PROXY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_tcp_proxy"
			}
		}
	},
	"responses": {
		"operation_config_pre_rule_tcp_proxy_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_tcp_proxy_list"
			}
		},
		"operation_config_pre_rule_tcp_proxy_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pre_rule_tcp_proxy"
			}
		}
	},
	"definitions": {
		"config.pre_rule_tcp_proxy_list": {
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
						"$ref": "#/definitions/config.pre_rule_tcp_proxy"
					}
				}
			}
		},
		"config.pre_rule_tcp_proxy": {
			"type": "object",
			"required": [
				"name"
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
					"description": "必选参数；指定前置策略的类型；七层TCP前置策略中，此字段设置为tcp-proxy。",
					"type": "string",
					"enum": [
						"TCP-PROXY"
					],
					"default": "TCP-PROXY"
				},
				"source_address": {
					"description": "可选参数；指定前置策略匹配的源地址，默认为所有源地址。",
					"type": "object",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"description": "必选参数；指定前置策略匹配的源地址类型，源IP范围的类型：all（所有IP）、ip-address（IP地址）、custom-address-group（用户地址集）、isp-address-group（ISP地址集），默认为all。",
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
							"description": "可选参数；源地址类型为ip-address时，指定具体的地址或地址范围或子网。",
							"type": "string",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"description": "可选参数；源地址类型为custom-address-group时，指定具体的用户地址集。",
							"type": "string",
							"example": "{custom_address_group}"
						},
						"ref_isp_address_group": {
							"description": "可选参数；源地址类型为isp_address_group时，指定具体的isp地址段。",
							"type": "string",
							"example": "{isp_address_group}"
						}
					}
				},
				"tcp_stream_rule": {
					"description": "可选参数；TCP代理匹配关系",
					"$ref": "/api/{common}.yaml#/definitions/config.str_match_component1"
				},
				"action": {
					"description": "可选参数；指定该前置策略匹配后的执行动作，可选的动作有：sched-pool（调度节点池）、tcp-fin（FIN关闭连接）、tcp-rst（RST关闭连接）。",
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
					"description": "可选参数；执行动作为sched-pool时，指定调度的节点池。",
					"type": "string",
					"example": "web_oa_80_pool"
				},
				"sched_failure": {
					"description": "可选参数; 执行动作为sched-pool时，指定调度失败后的执行动作，可选有：next-rule（匹配下一条）、tcp-fin（FIN关闭连接）、tcp-rst（RST关闭连接），默认为next-rule。",
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