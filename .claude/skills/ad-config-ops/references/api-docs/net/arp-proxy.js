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
		"/api/ad/v3/net/arp-proxy/": {
			"description": "ARP代理配置管理",
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
					"arp-proxy"
				],
				"summary": "get all arp-proxy",
				"description": "ARP代理配置获取",
				"operationId": "get_arp_proxy_list",
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
						"$ref": "#/responses/operation_config_arp_proxy_list"
					}
				}
			},
			"post": {
				"tags": [
					"arp-proxy"
				],
				"summary": "create new arp-proxy",
				"description": "新建ARP代理配置",
				"operationId": "add_arp_proxy_list",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_proxy_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"arp-proxy"
				],
				"summary": "modify arp-proxy",
				"description": "修改ARP代理配置",
				"operationId": "edit_arp_proxy_list",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-PROXY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_proxy_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net arp-proxy",
					"description": "获取全部arp/ND配置"
				},
				{
					"command": "list net arp-proxy test_arp",
					"description": "获取指定test_arp配置"
				},
				{
					"command": "create net arp-proxy test_arp addresses [ 6.3.3.3 ] links [ test_wan ]",
					"description": "创建名称为test_arp的ARP/ND代理配置"
				},
				{
					"command": " modify net arp-proxy test_arp addresses [ 192.168.23.6 ]",
					"description": "修改arp/nd代理test_arp配置代理IP为192.168.23.6"
				},
				{
					"command": "delete net arp-proxy test_arp",
					"description": "删除arp/nd代理dnat_8080"
				}
			]
		},
		"/api/ad/v3/net/arp-proxy/{name}": {
			"description": "ARP代理配置管理",
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
					"arp-proxy"
				],
				"summary": "get specific arp-proxy",
				"description": "获取ARP代理配置",
				"operationId": "get_arp-proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_proxy_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"arp-proxy"
				],
				"summary": "create new arp-proxy",
				"description": "新建ARP代理配置",
				"operationId": "create_arp-proxy",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_proxy_object"
					}
				}
			},
			"put": {
				"tags": [
					"arp-proxy"
				],
				"summary": "replace specific arp-proxy",
				"description": "修改ARP代理配置",
				"operationId": "replace_arp-proxy",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_proxy_object"
					}
				}
			},
			"patch": {
				"tags": [
					"arp-proxy"
				],
				"summary": "modify specific arp-proxy",
				"description": "修改ARP代理配置",
				"operationId": "edit_arp-proxy",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-PROXY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_proxy_object"
					}
				}
			},
			"delete": {
				"tags": [
					"arp-proxy"
				],
				"summary": "delete specific arp-proxy",
				"description": "删除ARP代理配置",
				"operationId": "delete_arp-proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_proxy_object"
					}
				}
			}
		}
	},
	"parameters": {
		"ARP-PROXY-CONFIG": {
			"name": "ARP-PROXY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.arp_proxy"
			}
		},
		"ARP-PROXY-PROPERTY": {
			"name": "ARP-PROXY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.arp_proxy"
			}
		}
	},
	"responses": {
		"operation_config_arp_proxy_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.arp_proxy_list"
			}
		},
		"operation_config_arp_proxy_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.arp_proxy"
			}
		}
	},
	"definitions": {
		"config.arp_proxy_list": {
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
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.arp_proxy"
					}
				}
			}
		},
		"config.arp_proxy": {
			"type": "object",
			"required": [
				"name",
				"addresses",
				"links"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "ARP/DN的名称, 在ARP/ND配置中必须唯一。",
					"example": "vip_200.200.0.1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可以对该ARP/ND配置进行额外的信息补充。"
				},
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "ARP/ND的配置状态,enable 表示启用;disable 表示禁用。",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"addresses": {
					"description": "代理地址列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "指定IP地址支持单IP、地址范围及网络号。",
						"example": "200.200.0.1-200.200.0.10"
					},
					"minItems": 1,
					"maxItems": 2048
				},
				"links": {
					"description": "出接口列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "出接口，可选择自动出接口或者指定出接口。",
						"default": "AUTO",
						"example": "WAN_2"
					},
					"maxItems": 100,
					"minItems": 1,
					"example": [
						"AUTO"
					]
				}
			}
		}
	}
}