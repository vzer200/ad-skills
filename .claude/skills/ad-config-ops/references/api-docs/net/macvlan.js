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
		"/api/ad/v3/net/macvlan/": {
			"description": "macvlan配置相关操作",
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
					"macvlan"
				],
				"summary": "get all macvlan",
				"description": "获取macvlan配置",
				"operationId": "get_macvlan_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_config_macvlan_list"
					}
				}
			},
			"post": {
				"tags": [
					"macvlan"
				],
				"summary": "create new macvlan",
				"description": "新建macvlan配置",
				"operationId": "add_macvlan_list",
				"parameters": [
					{
						"$ref": "#/parameters/MACVLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_macvlan_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"macvlan"
				],
				"summary": "modify macvlan",
				"description": "修改macvlan配置",
				"operationId": "edit_macvlan_list",
				"parameters": [
					{
						"$ref": "#/parameters/MACVLAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_macvlan_list"
					}
				}
			}
		},
		"/api/ad/v3/net/macvlan/{name}": {
			"description": "macvlan配置相关操作",
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
					"macvlan"
				],
				"summary": "get specific macvlan",
				"description": "获取macvlan配置",
				"operationId": "get_macvlan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_macvlan_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"macvlan"
				],
				"summary": "create new macvlan",
				"description": "新建macvlan配置",
				"operationId": "create_macvlan",
				"parameters": [
					{
						"$ref": "#/parameters/MACVLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_macvlan_object"
					}
				}
			},
			"put": {
				"tags": [
					"macvlan"
				],
				"summary": "replace specific macvlan",
				"description": "修改macvlan配置",
				"operationId": "replace_macvlan",
				"parameters": [
					{
						"$ref": "#/parameters/MACVLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_macvlan_object"
					}
				}
			},
			"patch": {
				"tags": [
					"macvlan"
				],
				"summary": "modify specific macvlan",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_macvlan",
				"parameters": [
					{
						"$ref": "#/parameters/MACVLAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_macvlan_object"
					}
				}
			},
			"delete": {
				"tags": [
					"macvlan"
				],
				"summary": "delete specific macvlan",
				"description": "",
				"operationId": "delete_macvlan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_macvlan_object"
					}
				}
			}
		}
	},
	"parameters": {
		"MACVLAN-CONFIG": {
			"name": "MACVLAN-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.macvlan"
			}
		},
		"MACVLAN-PROPERTY": {
			"name": "MACVLAN-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.macvlan"
			}
		}
	},
	"responses": {
		"operation_config_macvlan_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.macvlan_list"
			}
		},
		"operation_config_macvlan_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.macvlan"
			}
		}
	},
	"definitions": {
		"config.macvlan_list": {
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
						"$ref": "#/definitions/config.macvlan"
					}
				}
			}
		},
		"config.macvlan": {
			"type": "object",
			"required": [
				"name",
				"type"
			],
			"properties": {
				"name": {
					"description": "必选参数；macvlan名称",
					"type": "string",
					"example": "mymacvlan",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"description": "可选参数；描述",
					"type": "string",
					"example": "macvlan1 belongs to netns1",
					"default": "macvlan1 belongs to netns1"
				},
				"state": {
					"description": "可选参数；状态",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"type": {
					"description": "必选参数；类型",
					"type": "string",
					"enum": [
						"FLAT",
						"VLAN",
						"VXLAN"
					],
					"default": "FLAT",
					"example": "VXLAN"
				},
				"segment_id": {
					"description": "可选参数；macvlan的segment_id",
					"type": "integer",
					"default": 0,
					"example": 0,
					"minimum": 0,
					"maximum": 16777215
				},
				"mac_address": {
					"description": "mac地址",
					"type": "string",
					"example": "00:fe:ff:ff:ff:ff"
				},
				"mac_addr": {
					"description": "mac地址",
					"type": "string",
					"example": "00:22:22:22:22:22"
				}
			}
		}
	}
}