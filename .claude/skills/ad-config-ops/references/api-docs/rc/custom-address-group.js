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
		"/api/ad/v3/rc/custom-address-group/": {
			"description": "用户地址集配置相关操作",
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
					"custom-address-group"
				],
				"summary": "get all custom-address-group",
				"description": "获取用户地址集配置",
				"operationId": "get_custom_address_group_list",
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
						"$ref": "#/responses/operation_config_custom_address_group_list"
					},
					"404": {
						"$ref": "/api/{common}.yaml#/responses/default"
					}
				}
			},
			"post": {
				"tags": [
					"custom-address-group"
				],
				"summary": "create new custom-address-group",
				"description": "新建用户地址集配置",
				"operationId": "add_custom_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/CUSTOM-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_custom_address_group_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"custom-address-group"
				],
				"summary": "modify custom-address-group",
				"description": "修改用户地址集配置",
				"operationId": "edit_custom_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/CUSTOM-ADDRESS-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_custom_address_group_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create  rc custom-address-group custom1 addresses [ 1.0.1.0-1.0.3.255 1.0.8.0-1.0.15.255 ] addresses_ipv6 [ 2408:84f6::-2408:84f6:ffff:ffff:: 2408:84f7::-2408:84f7:ffff:ffff:: ]",
					"description": "新建用户地址集custom1，带ipv4和ipv6地址。"
				},
				{
					"command": "modify  rc custom-address-group custom1 name custom2  addresses [ 2.0.1.0-2.0.3.255 2.0.8.0-2.0.15.255 ] addresses_ipv6 [ 2409:84f6::-2409:84f6:ffff:ffff:: 2409:84f7::-2409:84f7:ffff:ffff:: ]",
					"description": "修改用户地址集custom1为custom2，修改ipv4和ipv6地址。"
				},
				{
					"command": "delete rc custom-address-group custom1",
					"description": "删除用户地址集custom1"
				},
				{
					"command": "list rc custom-address-group custom1",
					"description": "查看用户地址集custom1"
				}
			]
		},
		"/api/ad/v3/rc/custom-address-group/{name}": {
			"description": "用户地址集配置相关操作",
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
					"custom-address-group"
				],
				"summary": "get specific custom-address-group",
				"description": "获取用户地址集配置",
				"operationId": "get_custom_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_custom_address_group_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"custom-address-group"
				],
				"summary": "create new custom-address-group",
				"description": "新建用户地址集配置",
				"operationId": "create_custom_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/CUSTOM-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_custom_address_group_object"
					}
				}
			},
			"put": {
				"tags": [
					"custom-address-group"
				],
				"summary": "replace specific custom-address-group",
				"description": "修改用户地址集配置",
				"operationId": "replace_custom_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/CUSTOM-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_custom_address_group_object"
					}
				}
			},
			"patch": {
				"tags": [
					"custom-address-group"
				],
				"summary": "modify specific custom-address-group",
				"description": "修改用户地址集配置",
				"operationId": "edit_custom_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/CUSTOM-ADDRESS-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_custom_address_group_object"
					}
				}
			},
			"delete": {
				"tags": [
					"custom-address-group"
				],
				"summary": "delete specific custom-address-group",
				"description": "删除用户地址集配置",
				"operationId": "delete_custom_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_custom_address_group_object"
					}
				},
				"externalDocs": {
					"description": "JSON Schema",
					"url": "./schema/rc/config.custom_address_group_list.json"
				}
			}
		}
	},
	"parameters": {
		"CUSTOM-ADDRESS-GROUP-CONFIG": {
			"name": "CUSTOM-ADDRESS-GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.custom_address_group"
			}
		},
		"CUSTOM-ADDRESS-GROUP-PROPERTY": {
			"name": "CUSTOM-ADDRESS-GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.custom_address_group"
			}
		}
	},
	"responses": {
		"operation_config_custom_address_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.custom_address_group_list"
			}
		},
		"operation_config_custom_address_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.custom_address_group"
			}
		}
	},
	"definitions": {
		"config.custom_address_group_list": {
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
						"$ref": "#/definitions/config.custom_address_group"
					}
				}
			}
		},
		"config.custom_address_group": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定用户地址集的名称, 在配置中必须唯一。",
					"example": "ip_set_1"
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"addresses": {
					"type": "array",
					"description": "可选参数（和addresses_ipv6不能同时为空）；指定地址集ipv4地址范围。",
					"items": {
						"type": "string",
						"description": "Format: {IP-Address} | {IP-Range} | {IP-Subnet}",
						"example": "192.168.1.100-192.168.1.200"
					},
					"maxItems": 100,
					"minItems": 0
				},
				"addresses_ipv6": {
					"type": "array",
					"description": "可选参数（和addresses不能同时为空）；指定地址集ipv4地址范围。",
					"items": {
						"type": "string",
						"description": "Format: {IP-Address} | {IP-Range} | {IP-Subnet}",
						"example": "2001::100-2001::1000"
					},
					"maxItems": 100,
					"minItems": 0
				}
			}
		}
	}
}