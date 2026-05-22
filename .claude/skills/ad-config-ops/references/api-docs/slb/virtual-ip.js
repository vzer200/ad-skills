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
		"/api/ad/v3/slb/virtual-ip/": {
			"description": "新建、查看虚拟IP配置",
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
					"virtual-ip"
				],
				"summary": "get all virtual-ip",
				"description": "查看当前已有的虚拟IP配置信息",
				"operationId": "get_virtual-ip_list",
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
						"$ref": "#/responses/operation_config_virtual_ip_list"
					}
				}
			},
			"post": {
				"tags": [
					"virtual-ip"
				],
				"summary": "create new virtual-ip",
				"description": "新建一个虚拟IP配置",
				"operationId": "add_virtual-ip_list",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-IP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_ip_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb virtual-ip test_virtual_ip description 描述信息 vip 1.1.1.1",
					"description": "创建名称为test_virtual_ip的virtual-ip."
				},
				{
					"command": "modify slb virtual-ip test_virtual_ip distribute_policy any-associated-vs-available",
					"description": "修改名称为test_virtual_ip的虚拟ip的发布条件为任意虚拟服务可用。"
				},
				{
					"command": "list slb virtual-ip test_virtual_ip",
					"description": "查看test_virtual_ip的配置信息"
				},
				{
					"command": "delete slb virtual-ip test_virtual_ip",
					"description": "删除名称为test_virtual_ip的配置。"
				},
				{
					"command": "delete slb virtual-ip all",
					"description": "删除所有virtual-ip配置。"
				}
			]
		},
		"/api/ad/v3/slb/virtual-ip/{name}": {
			"description": "新建、查看、修改、删除指定的虚拟IP配置",
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
					"virtual-ip"
				],
				"summary": "get specific virtual-ip",
				"description": "查看指定的虚拟IP配置",
				"operationId": "get_virtual-ip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_ip_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"virtual-ip"
				],
				"summary": "create new virtual-ip",
				"description": "新建指定的虚拟IP配置",
				"operationId": "create_virtual-ip",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-IP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_ip_object"
					}
				}
			},
			"put": {
				"tags": [
					"virtual-ip"
				],
				"summary": "replace specific virtual-ip",
				"description": "修改指定的虚拟IP配置",
				"operationId": "replace_virtual-ip",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-IP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_ip_object"
					}
				}
			},
			"patch": {
				"tags": [
					"virtual-ip"
				],
				"summary": "modify specific virtual-ip",
				"description": "修改指定的虚拟IP配置",
				"operationId": "edit_virtual-ip",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-IP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_ip_object"
					}
				}
			},
			"delete": {
				"tags": [
					"virtual-ip"
				],
				"summary": "delete specific virtual-ip",
				"description": "删除指定的虚拟IP配置",
				"operationId": "delete_virtual-ip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_ip_object"
					}
				}
			}
		}
	},
	"parameters": {
		"VIRTUAL-IP-CONFIG": {
			"name": "VIRTUAL-IP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.virtual_ip"
			}
		},
		"VIRTUAL-IP-PROPERTY": {
			"name": "VIRTUAL-IP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.virtual_ip"
			}
		}
	},
	"responses": {
		"operation_config_virtual_ip_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.virtual_ip_list"
			}
		},
		"operation_config_virtual_ip_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.virtual_ip"
			}
		}
	},
	"definitions": {
		"config.virtual_ip_list": {
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
						"$ref": "#/definitions/config.virtual_ip"
					}
				}
			}
		},
		"config.virtual_ip": {
			"type": "object",
			"required": [
				"name",
				"vip"
			],
			"properties": {
				"name": {
					"description": "虚拟IP名称",
					"type": "string",
					"example": "10.0.0.0_25"
				},
				"description": {
					"type": "string",
					"description": "用来对此配置增加额外的备注。"
				},
				"vs_flow_state": {
					"description": "虚拟服务流量启/禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"vip": {
					"description": "vip",
					"type": "string",
					"example": "10.0.1.234"
				},
				"arp_nd_reply": {
					"description": "arp代理启用或禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"DEFAULT"
					],
					"default": "DEFAULT",
					"example": "ENABLE"
				},
				"icmp_echo_reply": {
					"description": "icmp echo触发条件",
					"type": "string",
					"enum": [
						"DISABLE",
						"ANY-ASSOCIATED-VS-AVAILABLE",
						"ALL-ASSOCIATED-VS-AVAILABLE",
						"ALWAYS",
						"DEFAULT"
					],
					"default": "DEFAULT",
					"example": "ALWAYS"
				},
				"distribute_policy": {
					"description": "路由注入触发条件",
					"type": "string",
					"enum": [
						"DISABLE",
						"ANY-ASSOCIATED-VS-AVAILABLE",
						"ALL-ASSOCIATED-VS-AVAILABLE",
						"ALWAYS"
					],
					"default": "DISABLE",
					"example": "ANY-ASSOCIATED-VS-AVAILABLE"
				},
				"cost": {
					"description": "路由代价值",
					"type": "integer",
					"default": 10,
					"maximum": 65535,
					"minimum": 1,
					"example": 10
				},
				"conn_limit": {
					"description": "连接数限制",
					"type": "integer",
					"default": 0,
					"maximum": 4294967295,
					"minimum": 0,
					"example": 10
				},
				"auto_delete": {
					"description": "虚拟IP自动删除启用或禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"avaliable_policy": {
					"description": "虚拟IP在线条件",
					"type": "string",
					"enum": [
						"ANY-ASSOCIATED-VS-AVAILABLE",
						"ALL-ASSOCIATED-VS-AVAILABLE",
						"ALWAYS"
					],
					"default": "ANY-ASSOCIATED-VS-AVAILABLE",
					"example": "ANY-ASSOCIATED-VS-AVAILABLE"
				},
				"inbound_links": {
					"description": "入口链路集合",
					"type": "array",
					"items": {
						"description": "入口链路",
						"type": "string",
						"example": "WAN_1"
					}
				}
			}
		}
	}
}