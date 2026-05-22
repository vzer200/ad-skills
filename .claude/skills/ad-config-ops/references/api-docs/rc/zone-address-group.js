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
		"/api/ad/v3/rc/zone-address-group/": {
			"description": "地域地址集相关操作",
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
					"zone-address-group"
				],
				"summary": "get all zone-address-group",
				"description": "获取地域地址集",
				"operationId": "get_zone_address_group_list",
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
						"$ref": "#/responses/operation_config_zone_address_group_list"
					}
				}
			},
			"post": {
				"tags": [
					"zone-address-group"
				],
				"summary": "create new zone-address-group",
				"description": "新建地域地址集",
				"operationId": "add_zone_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_address_group_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"zone-address-group"
				],
				"summary": "modify zone-address-group",
				"description": "修改地域地址集",
				"operationId": "edit_zone_address_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-ADDRESS-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_address_group_list"
					}
				}
			}
		},
		"/api/ad/v3/rc/zone-address-group/{name}": {
			"description": "地域地址集相关配置",
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
					"zone-address-group"
				],
				"summary": "get specific zone-address-group",
				"description": "获取地域地址集",
				"operationId": "get_zone_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_address_group_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"zone-address-group"
				],
				"summary": "create new zone-address-group",
				"description": "新建地域地址集",
				"operationId": "create_zone_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_address_group_object"
					}
				}
			},
			"put": {
				"tags": [
					"zone-address-group"
				],
				"summary": "replace specific zone-address-group",
				"description": "修改地域地址集",
				"operationId": "replace_zone_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-ADDRESS-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_address_group_object"
					}
				}
			},
			"patch": {
				"tags": [
					"zone-address-group"
				],
				"summary": "modify specific zone-address-group",
				"description": "修改地域地址集",
				"operationId": "edit_zone_address_group",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-ADDRESS-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_address_group_object"
					}
				}
			},
			"delete": {
				"tags": [
					"zone-address-group"
				],
				"summary": "delete specific zone-address-group",
				"description": "删除地域地址集",
				"operationId": "delete_zone_address_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_address_group_object"
					}
				}
			}
		}
	},
	"parameters": {
		"ZONE-ADDRESS-GROUP-CONFIG": {
			"name": "ZONE-ADDRESS-GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.zone_address_group"
			}
		},
		"ZONE-ADDRESS-GROUP-PROPERTY": {
			"name": "ZONE-ADDRESS-GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.zone_address_group"
			}
		}
	},
	"responses": {
		"operation_config_zone_address_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.zone_address_group_list"
			}
		},
		"operation_config_zone_address_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.zone_address_group"
			}
		}
	},
	"definitions": {
		"config.zone_address_group_list": {
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
						"$ref": "#/definitions/config.zone_address_group"
					}
				}
			}
		},
		"config.zone_address_group": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "地域名",
					"example": "northeastern_zone"
				},
				"description": {
					"description": "描述",
					"type": "string"
				},
				"addresses": {
					"type": "array",
					"description": "地域地址列表",
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
					"description": "地域地址列表（IPV6）",
					"items": {
						"type": "string",
						"description": "Format: {IP-Range}",
						"example": "2001::100-2001::1000"
					},
					"maxItems": 10000,
					"minItems": 0
				}
			}
		}
	}
}