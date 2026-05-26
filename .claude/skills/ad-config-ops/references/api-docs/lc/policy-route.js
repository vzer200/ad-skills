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
		"/api/ad/v3/lc/policy-route/": {
			"description": "智能路由配置管理操作",
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
					"policy-route"
				],
				"summary": "get all policy-route",
				"description": "查看智能路由配置信息",
				"operationId": "get_policy_route_list",
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
						"$ref": "#/responses/operation_config_policy_route_list"
					}
				}
			},
			"post": {
				"tags": [
					"policy-route"
				],
				"summary": "create new policy-route",
				"description": "新建智能路由配置",
				"operationId": "add_policy_route_list",
				"parameters": [
					{
						"$ref": "#/parameters/POLICY-ROUTE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"policy-route"
				],
				"summary": "modify policy-route",
				"description": "更新智能路由配置",
				"operationId": "edit_policy_route_list",
				"parameters": [
					{
						"$ref": "#/parameters/POLICY-ROUTE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_list"
					}
				}
			}
		},
		"/api/ad/v3/lc/policy-route/{name}": {
			"description": "智能路由配置管理操作",
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
					"policy-route"
				],
				"summary": "get specific policy-route",
				"description": "查看智能路由配置信息",
				"operationId": "get_policy_route",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"policy-route"
				],
				"summary": "create new policy-route",
				"description": "新建智能路由配置",
				"operationId": "create_policy_route",
				"parameters": [
					{
						"$ref": "#/parameters/POLICY-ROUTE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_object"
					}
				}
			},
			"put": {
				"tags": [
					"policy-route"
				],
				"summary": "replace specific policy-route",
				"description": "更新智能路由配置",
				"operationId": "replace_policy_route",
				"parameters": [
					{
						"$ref": "#/parameters/POLICY-ROUTE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_object"
					}
				}
			},
			"patch": {
				"tags": [
					"policy-route"
				],
				"summary": "modify specific policy-route",
				"description": "更新智能路由配置",
				"operationId": "edit_policy_route",
				"parameters": [
					{
						"$ref": "#/parameters/POLICY-ROUTE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_object"
					}
				}
			},
			"delete": {
				"tags": [
					"policy-route"
				],
				"summary": "delete specific policy-route",
				"description": "删除智能路由配置",
				"operationId": "delete_policy_route",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_policy_route_object"
					}
				}
			}
		}
	},
	"parameters": {
		"POLICY-ROUTE-CONFIG": {
			"name": "POLICY-ROUTE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.policy_route"
			}
		},
		"POLICY-ROUTE-PROPERTY": {
			"name": "POLICY-ROUTE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.policy_route"
			}
		}
	},
	"responses": {
		"operation_config_policy_route_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.policy_route_list"
			}
		},
		"operation_config_policy_route_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.policy_route"
			}
		}
	},
	"definitions": {
		"config.policy_route_list": {
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
					"description": "智能路由列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.policy_route"
					}
				}
			}
		},
		"config.policy_route": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "game_telecom_rule",
					"description": "配置名称"
				},
				"description": {
					"type": "string",
					"description": "智能路由描述"
				},
				"default": {
					"type": "string",
					"description": "默认智能路由",
					"readOnly": true,
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				},
				"position": {
					"type": "integer",
					"description": "指定配置在配置列表中位置",
					"example": 1,
					"maximum": 65535,
					"minimum": 1
				},
				"type": {
					"type": "string",
					"description": "类型(type)字段不合法，须为[ IPV4, IPV6 ]中的一种!",
					"enum": [
						"IPV4",
						"IPV6"
					],
					"default": "IPV4",
					"example": "IPV6"
				},
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"description": "状态"
				},
				"inbound_link": {
					"type": "array",
					"description": "入口链路集合",
					"minItems": 1,
					"items": {
						"type": "string",
						"description": "Format: ALL | WAN-KIND | LAN-KIND | {LAN} | {WAN}",
						"default": "ALL",
						"example": "WAN_1"
					}
				},
				"source_address": {
					"type": "object",
					"description": "源地址",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"description": "地址类型",
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
							"description": "用户地址集",
							"type": "string",
							"example": "{custom_address_group}"
						}
					}
				},
				"destination_address": {
					"type": "object",
					"description": "目的地址",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"description": "目的地址",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP",
								"ISP-ADDRESS-GROUP",
								"DOMAIN-GROUP",
								"APPLICATION-CLASSIFICATION"
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
							"description": "用户地址集",
							"type": "string",
							"example": "{custom_address_group}"
						},
						"ref_isp_address_group": {
							"type": "string",
							"example": "{isp_address_group}",
							"description": "isp地址集"
						},
						"ref_domain_group": {
							"type": "string",
							"example": "foreign_domain_group",
							"description": "域名集"
						},
						"application_classification": {
							"description": "应用类型集合",
							"type": "array",
							"minItems": 1,
							"items": {
								"type": "string",
								"description": "应用类型",
								"enum": [
									"GAME",
									"VIDEO",
									"BANK"
								],
								"example": "GAME"
							},
							"example": [
								"GAME",
								"VIDEO",
								"BANK"
							]
						}
					}
				},
				"protocol": {
					"type": "string",
					"description": "协议条件",
					"enum": [
						"ALL",
						"TCP",
						"UDP",
						"ICMP",
						"ICMPV6",
						"OTHER"
					],
					"default": "ALL"
				},
				"protocol_number": {
					"type": "integer",
					"description": "",
					"example": 6,
					"maximum": 255,
					"minimum": 1
				},
				"source_ports": {
					"type": "string",
					"description": "Format: ALL | {PORT} | {PORT-Range}",
					"default": "0",
					"example": [
						"8080-8090"
					]
				},
				"destination_ports": {
					"type": "string",
					"description": "Format: ALL | {PORT} | {PORT-Range}",
					"default": "0",
					"example": "8080-8090"
				},
				"tos": {
					"type": "string",
					"default": "0",
					"example": "0",
					"description": "TOS,0-255"
				},
				"schedule_links": {
					"type": "array",
					"description": "出口链路集合",
					"items": {
						"type": "string",
						"description": "Format: {WAN}"
					}
				},
				"schedule_policy": {
					"type": "string",
					"description": "链路选择策略",
					"enum": [
						"ROUND-ROBIN",
						"BANDWIDTH-RATIO",
						"WEIGHTED-LEAST-FLOW",
						"LEAST-RTT",
						"HASH-SRC-IP",
						"HASH-DST-IP"
					],
					"default": "WEIGHTED-LEAST-FLOW",
					"example": "WEIGHTED-LEAST-FLOW"
				},
				"busy_protect": {
					"type": "string",
					"description": "链路繁忙保护",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"schedule_failure_policy": {
					"type": "string",
					"description": "链路调度失败动作",
					"enum": [
						"NEXT-ROUTE",
						"DROP"
					],
					"default": "NEXT-ROUTE",
					"example": "NEXT-ROUTE"
				},
				"time_plan": {
					"type": "string",
					"description": "生效时间,必须为已存在的时间计划配置,或者为NONE",
					"default": "NONE",
					"example": "NONE"
				}
			}
		}
	}
}