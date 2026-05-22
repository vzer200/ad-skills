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
		"/api/ad/v3/lc/dns-pre-rule/": {
			"description": "优先代理策略配置管理操作",
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
					"dns-pre-rule"
				],
				"summary": "get all dns-pre-rule",
				"description": "查看优先代理策略信息",
				"operationId": "get_dns_pre_rule_list",
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
						"$ref": "#/responses/operation_config_dns_pre_rule_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-pre-rule"
				],
				"summary": "create new dns-pre-rule",
				"description": "新建优先代理策略配置",
				"operationId": "add_dns_pre_rule_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PRE-RULE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_pre_rule_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create lc dns-pre-rule rule1 source_address { type ip-address address 192.168.100.0/24 } sched_servers [ { link wan1 server 8.8.8.8 } ]",
					"description": "新建DNS代理的优先调度策略rule1，源地址匹配192.168.100.0/24，调度到DNS服务器<wan1,8.8.8.8>"
				},
				{
					"command": "modify lc dns-pre-rule rule1 add sched_servers [ { link wan2 server 10.10.10.252 } ]",
					"description": "修改DNS代理的优先调度策略rule1，DNS服务器列表增加一个DNS服务器<wan2,10.10.10.252>"
				},
				{
					"command": "list lc dns-pre-rule",
					"description": "查看DNS代理优先调度策略的配置信息"
				}
			]
		},
		"/api/ad/v3/lc/dns-pre-rule/{name}": {
			"description": "优先代理策略配置管理操作",
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
				}
			],
			"get": {
				"tags": [
					"dns-pre-rule"
				],
				"summary": "get specific dns-pre-rule",
				"description": "查看优先代理策略信息",
				"operationId": "get_dns_pre_rule",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_pre_rule_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-pre-rule"
				],
				"summary": "create new dns-pre-rule",
				"description": "新建优先代理策略配置",
				"operationId": "create_dns_pre_rule",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PRE-RULE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_pre_rule_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-pre-rule"
				],
				"summary": "replace specific dns-pre-rule",
				"description": "更新优先代理策略配置",
				"operationId": "replace_dns_pre_rule",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PRE-RULE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_pre_rule_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-pre-rule"
				],
				"summary": "modify specific dns-pre-rule",
				"description": "更新优先代理策略配置",
				"operationId": "edit_dns_pre_rule",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PRE-RULE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_pre_rule_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-pre-rule"
				],
				"summary": "delete specific dns-pre-rule",
				"description": "删除优先代理策略配置",
				"operationId": "delete_dns_pre_rule",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_pre_rule_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-PRE-RULE-CONFIG": {
			"name": "DNS-PRE-RULE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_pre_rule"
			}
		},
		"DNS-PRE-RULE-PROPERTY": {
			"name": "DNS-PRE-RULE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_pre_rule"
			}
		}
	},
	"responses": {
		"operation_config_dns_pre_rule_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_pre_rule_list"
			}
		},
		"operation_config_dns_pre_rule_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_pre_rule"
			}
		}
	},
	"definitions": {
		"config.dns_pre_rule_list": {
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
					"description": "dns前置策略列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.dns_pre_rule"
					}
				}
			}
		},
		"config.dns_pre_rule": {
			"type": "object",
			"required": [
				"name",
				"sched_servers",
				"source_address"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；优先代理策略的名称。",
					"example": "internal_domain_prerule"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"position": {
					"type": "integer",
					"description": "可选参数；优先代理策略的位置，用于标志执行的顺序。",
					"example": 1,
					"maximum": 65535,
					"minimum": 1,
					"default": 65535
				},
				"state": {
					"type": "string",
					"description": "可选参数；记录的状态，可选值有：enalbe（启用），disable（禁用）；默认为启用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"source_address": {
					"type": "object",
					"description": "可选参数；指定优先代理策略的源IP范围。",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"description": "可选参数；源IP范围的类型：all（所有IP）、ip-address（IP地址）、custom-address-group（用户地址集）。",
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
							"description": "可选参数，地址格式：单IP、IP段、IP子网。",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"type": "string",
							"description": "可选参数，引用用户地址集的名称。",
							"example": "{custom_address_group}"
						}
					}
				},
				"query_domain": {
					"type": "object",
					"description": "可选参数，代理域名。",
					"properties": {
						"type": {
							"type": "string",
							"description": "可选参数，域名的类型，可选择的有：all（所有域名）、domain（指定域名）、（domain-group）域名集；默认为所有域名。",
							"enum": [
								"ALL",
								"DOMAIN",
								"DOMAIN-GROUP"
							],
							"default": "ALL"
						},
						"domain": {
							"type": "string",
							"description": "可选参数，指定域名，如www.test.com。",
							"example": "www.example.com"
						},
						"ref_domain_group": {
							"type": "string",
							"description": "可选参数，引用的域名集名称。",
							"example": "foreign_domain_group"
						}
					}
				},
				"sched_servers": {
					"type": "array",
					"description": "可选参数，调度的DNS服务器列表，类型为数组。",
					"minItems": 1,
					"items": {
						"type": "object",
						"description": "可选参数，DNS服务器，类型为结构体。",
						"required": [
							"link",
							"server"
						],
						"properties": {
							"link": {
								"type": "string",
								"description": "可选参数，链路名称，如wan1。",
								"example": "WAN_1"
							},
							"server": {
								"type": "string",
								"description": "可选参数，DNS服务器地址，如8.8.8.8。",
								"example": "192.168.1.254"
							}
						}
					}
				},
				"link_busy_protect": {
					"type": "string",
					"description": "可选参数，是否启用繁忙保护，可选有enable（启用）和disable（禁用），默认为启用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"sched_failure": {
					"type": "string",
					"description": "可选参数，失效动作，可选有next-rule（匹配下一条策略）和drop（丢弃），默认为匹配下一条策略。",
					"enum": [
						"NEXT-RULE",
						"DROP"
					],
					"default": "NEXT-RULE",
					"example": "NEXT-RULE"
				}
			}
		}
	}
}