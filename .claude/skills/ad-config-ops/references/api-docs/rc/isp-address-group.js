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
		"/api/ad/v3/rc/isp-address-group/": {
			"description": "ISP地址集配置相关操作",
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
					"isp-address-group"
				],
				"summary": "get all isp-address-group",
				"description": "获取ISP地址集配置",
				"operationId": "get_isp_address_group_list",
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
						"$ref": "#/responses/operation_config_isp_address_group_list"
					}
				}
			},
			"post": {
				"tags": [
					"isp-address-group"
				],
				"summary": "create new isp-address-group",
				"description": "新建ISP地址集配置",
				"operationId": "add_isp_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/ISP-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_isp_address_group_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"isp-address-group"
				],
				"summary": "modify isp-address-group",
				"description": "修改ISP地址集配置",
				"operationId": "edit_isp_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/ISP-ADDRESS-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_isp_address_group_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create  rc isp-address-group unicom addresses [ 1.0.1.0-1.0.3.255 1.0.8.0-1.0.15.255 ] addresses_ipv6 [ 2408:84f6::-2408:84f6:ffff:ffff:: 2408:84f7::-2408:84f7:ffff:ffff:: ]",
					"description": "新建isp地址集unicom，带ipv4和ipv6地址。"
				},
				{
					"command": "modify  rc isp-address-group unicom name Unicom  addresses [ 2.0.1.0-2.0.3.255 2.0.8.0-2.0.15.255 ] addresses_ipv6 [ 2409:84f6::-2409:84f6:ffff:ffff:: 2409:84f7::-2409:84f7:ffff:ffff:: ]",
					"description": "修改isp地址集unicom为Unicom，修改ipv4和ipv6地址。"
				},
				{
					"command": "delete rc isp-address-group unicom",
					"description": "删除isp地址集unicom"
				},
				{
					"command": "list rc isp-address-group unicom",
					"description": "查看isp地址集unicom"
				}
			]
		},
		"/api/ad/v3/rc/isp-address-group/{name}": {
			"description": "ISP地址集配置相关配置",
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
					"isp-address-group"
				],
				"summary": "get specific isp-address-group",
				"description": "获取ISP地址集配置",
				"operationId": "get_isp_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_isp_address_group_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"isp-address-group"
				],
				"summary": "create new isp-address-group",
				"description": "新建ISP地址集配置",
				"operationId": "create_isp_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/ISP-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_isp_address_group_object"
					}
				}
			},
			"put": {
				"tags": [
					"isp-address-group"
				],
				"summary": "replace specific isp-address-group",
				"description": "修改ISP地址集配置",
				"operationId": "replace_isp_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/ISP-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_isp_address_group_object"
					}
				}
			},
			"patch": {
				"tags": [
					"isp-address-group"
				],
				"summary": "modify specific isp-address-group",
				"description": "修改ISP地址集配置",
				"operationId": "edit_isp_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/ISP-ADDRESS-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_isp_address_group_object"
					}
				}
			},
			"delete": {
				"tags": [
					"isp-address-group"
				],
				"summary": "delete specific isp-address-group",
				"description": "删除ISP地址集配置",
				"operationId": "delete_isp_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_isp_address_group_object"
					}
				}
			}
		}
	},
	"parameters": {
		"ISP-ADDRESS-GROUP-CONFIG": {
			"name": "ISP-ADDRESS-GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.isp_address_group"
			}
		},
		"ISP-ADDRESS-GROUP-PROPERTY": {
			"name": "ISP-ADDRESS-GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.isp_address_group"
			}
		}
	},
	"responses": {
		"operation_config_isp_address_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.isp_address_group_list"
			}
		},
		"operation_config_isp_address_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.isp_address_group"
			}
		}
	},
	"definitions": {
		"config.isp_address_group_list": {
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
						"$ref": "#/definitions/config.isp_address_group"
					}
				}
			}
		},
		"config.isp_address_group": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定isp地址集的名称, 在配置中必须唯一。",
					"example": "China Telecom"
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
						"description": "Format: {IP-Range}",
						"example": "192.168.1.100-192.168.1.200"
					},
					"maxItems": 10000,
					"minItems": 0
				},
				"addresses_ipv6": {
					"type": "array",
					"description": "可选参数（和addresses不能同时为空）；指定地址集ipv4地址范围。",
					"items": {
						"type": "string",
						"description": "Format: {IP-Range}",
						"example": "2001::100-2001::1000"
					},
					"maxItems": 10000,
					"minItems": 0
				},
				"whois": {
					"type": "array",
					"description": "可选参数；指定所属服务商信息列表。",
					"items": {
						"description": "所属服务商信息。",
						"type": "string",
						"example": "MAINT-CHINANET"
					},
					"maxItems": 5
				},
				"default": {
					"type": "string",
					"description": "合法输入为NON-DEFAULT、READONLY和MODIFIABLE",
					"title": "默认值",
					"readOnly": true,
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				}
			}
		}
	}
}