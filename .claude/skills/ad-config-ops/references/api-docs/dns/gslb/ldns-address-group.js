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
		"/api/ad/v4/dns/gslb/{dns_config_area}/ldns-address-group/": {
			"description": "本地DNS集合配置管理操作",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"ldns-address-group"
				],
				"summary": "get all ldns-address-group",
				"description": "查看本地DNS集合配置",
				"operationId": "get_ldns_address_group_list",
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
						"$ref": "#/responses/operation_config_ldns_address_group_list"
					}
				}
			},
			"post": {
				"tags": [
					"ldns-address-group"
				],
				"summary": "create new ldns-address-group",
				"description": "创建本地DNS集合配置",
				"operationId": "add_ldns_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/LDNS-ADDRESS_GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ldns_address_group_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"ldns-address-group"
				],
				"summary": "modify ldns-address-group",
				"description": "增量修改本地DNS集合配置",
				"operationId": "edit_ldns_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/LDNS-ADDRESS_GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ldns_address_group_list"
					}
				}
			}
		},
		"/api/ad/v4/dns/gslb/{dns_config_area}/ldns-address-group/{name}": {
			"description": "指定本地DNS集合配置管理操作",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"ldns-address-group"
				],
				"summary": "get specific ldns-address-group",
				"description": "查看指定已有的本地DNS集合配置",
				"operationId": "get_ldns_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ldns_address_group_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ldns-address-group"
				],
				"summary": "create new ldns-address-group",
				"description": "创建本地DNS集合配置",
				"operationId": "create_ldns_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/LDNS-ADDRESS_GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ldns_address_group_object"
					}
				}
			},
			"put": {
				"tags": [
					"ldns-address-group"
				],
				"summary": "replace specific ldns-address-group",
				"description": "修改指定本地DNS集合配置",
				"operationId": "replace_ldns_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/LDNS-ADDRESS_GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ldns_address_group_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ldns-address-group"
				],
				"summary": "modify specific ldns-address-group",
				"description": "增量修改指定本地DNS集合配置",
				"operationId": "edit_ldns_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/LDNS-ADDRESS_GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ldns_address_group_object"
					}
				}
			},
			"delete": {
				"tags": [
					"ldns-address-group"
				],
				"summary": "delete specific ldns-address-group",
				"description": "删除指定本地DNS集合配置",
				"operationId": "delete_ldns_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ldns_address_group_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns gslb global ldns-address-group ldns_global",
					"description": "查看全局区域的本地DNS集合配置，名称为：ldns_global"
				},
				{
					"command": "list dns gslb local ldns-address-group ldns_local",
					"description": "查看本地区域的本地DNS集合配置，名称为：ldns_local"
				},
				{
					"command": "create dns gslb global ldns-address-group ldns_global description create_ldns addresses add [ 192.3.5.2 20.20.20.2-20.20.20.20 ] addresses_ipv6 [10::100 20::1-20::20]",
					"description": "创建全局区域的本地DNS集合配置 名称：ldns_global IPV4地址：单个地址192.3.5.2和IP地址段20.20.20.2-20.20.20.20 IPV6地址：单个地址10::100和IP地址段20::1-20::20"
				},
				{
					"command": "create dns gslb local ldns-address-group ldns_local description create_ldns addresses add [ 168.3.5.1 120.20.20.2-120.20.20.20 ] addresses_ipv6 [30::100 80::1-80::20]",
					"description": "创建本地区域的本地DNS集合配置 名称：ldns_local IPV4地址：单个地址168.3.5.1和IP地址段120.20.20.2-120.20.20.20 IPV6地址：单个地址30::100和IP地址段80::1-80::20"
				},
				{
					"command": "modify dns gslb global ldns-address-group ldns_global name new_ldns_global description modify_ldns addresses delete [ 192.3.5.2-192.3.5.2] addresses_ipv6 add [ 50::20 ]",
					"description": "修改全局区域的本地DNS集合配置，修改后名称：new_ldns_global 删除其IPV4地址：192.3.5.2-192.3.5.2 添加其IPV6地址：50::20"
				},
				{
					"command": "modify dns gslb local ldns-address-group ldns_local name new_ldns_local description modify_ldns addresses delete [ 168.3.5.1-168.3.5.1] addresses_ipv6 add [ 60::20 ]",
					"description": "修改本地区域的本地DNS集合配置，修改后名称：new_ldns_local 删除其IPV4地址：168.3.5.1-168.3.5.1 添加其IPV6地址：60::20"
				},
				{
					"command": "delete dns gslb global ldns-address-group new_ldns_global",
					"description": "删除全局区域的本地DNS集合配置，名称：new_ldns_global"
				},
				{
					"command": "delete dns gslb local ldns-address-group new_ldns_local",
					"description": "删除本地区域的本地DNS集合配置，名称：new_ldns_local"
				}
			]
		}
	},
	"parameters": {
		"LDNS-ADDRESS_GROUP-CONFIG": {
			"name": "LDNS-ADDRESS_GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "本地DNS集合配置",
			"schema": {
				"$ref": "#/definitions/config.ldns_address_group"
			}
		},
		"LDNS-ADDRESS_GROUP-PROPERTY": {
			"name": "LDNS-ADDRESS_GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "本地DNS集合配置属性",
			"schema": {
				"$ref": "#/definitions/config.ldns_address_group"
			}
		},
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "本地和全局区域",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_config_ldns_address_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ldns_address_group_list"
			}
		},
		"operation_config_ldns_address_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ldns_address_group"
			}
		}
	},
	"definitions": {
		"config.ldns_address_group_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "项目数量最大值",
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
					"description": "页面大小",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "项目长度",
					"type": "integer",
					"example": 8
				},
				"items": {
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.ldns_address_group"
					}
				}
			}
		},
		"config.ldns_address_group": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "本地DNS集合名称",
					"type": "string",
					"example": "abc.com"
				},
				"description": {
					"description": "本地DNS集合描述信息",
					"type": "string"
				},
				"addresses": {
					"description": "本地DNS地址集",
					"type": "array",
					"items": {
						"type": "string",
						"description": "本地DNS集合地址，可以是单个地址、IP段，最多10000个",
						"example": "10.0.12.34"
					},
					"maxItems": 10000,
					"minItems": 0
				},
				"addresses_ipv6": {
					"description": "IPv6地址集",
					"type": "array",
					"items": {
						"type": "string",
						"description": "本地DNS集合IPv6地址，最多10000个",
						"example": "1::2"
					},
					"maxItems": 10000,
					"minItems": 0
				}
			}
		}
	}
}