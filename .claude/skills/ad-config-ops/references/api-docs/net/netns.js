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
		"/api/ad/v3/net/netns/": {
			"description": "netns配置相关操作",
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
					"netns"
				],
				"summary": "get all netns",
				"description": "获取netns配置",
				"operationId": "get_netns_list",
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
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/project"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_list"
					}
				}
			},
			"post": {
				"tags": [
					"netns"
				],
				"summary": "create new netns",
				"description": "新建netns配置",
				"operationId": "add_netns_list",
				"parameters": [
					{
						"$ref": "#/parameters/NETNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"netns"
				],
				"summary": "modify netns",
				"description": "修改netns配置",
				"operationId": "edit_netns_list",
				"parameters": [
					{
						"$ref": "#/parameters/NETNS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_list"
					}
				}
			}
		},
		"/api/ad/v3/net/netns/{name}": {
			"description": "netns配置相关操作",
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
					"netns"
				],
				"summary": "get specific netns",
				"description": "获取netns配置",
				"operationId": "get_netns",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/project"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"netns"
				],
				"summary": "create new netns",
				"description": "新建netns配置",
				"operationId": "create_netns",
				"parameters": [
					{
						"$ref": "#/parameters/NETNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_object"
					}
				}
			},
			"put": {
				"tags": [
					"netns"
				],
				"summary": "replace specific netns",
				"description": "修改netns配置",
				"operationId": "replace_netns",
				"parameters": [
					{
						"$ref": "#/parameters/NETNS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_object"
					}
				}
			},
			"patch": {
				"tags": [
					"netns"
				],
				"summary": "modify specific netns",
				"description": "修改netns配置",
				"operationId": "edit_netns",
				"parameters": [
					{
						"$ref": "#/parameters/NETNS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_object"
					}
				}
			},
			"delete": {
				"tags": [
					"netns"
				],
				"summary": "delete specific netns",
				"description": "删除netns配置",
				"operationId": "delete_netns",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/force"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_netns_object"
					}
				}
			}
		}
	},
	"parameters": {
		"NETNS-CONFIG": {
			"name": "NETNS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.netns"
			}
		},
		"NETNS-PROPERTY": {
			"name": "NETNS-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.netns"
			}
		}
	},
	"responses": {
		"operation_config_netns_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.netns_list"
			}
		},
		"operation_config_netns_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.netns"
			}
		}
	},
	"definitions": {
		"config.netns_list": {
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
						"$ref": "#/definitions/config.netns"
					}
				}
			}
		},
		"config.netns": {
			"type": "object",
			"required": [
				"name",
				"project"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；名称",
					"example": "mynetns",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；描述",
					"example": "this netns belongs to someone",
					"default": "this netns belongs to someone"
				},
				"state": {
					"description": "可选参数；状态",
					"type": "string",
					"enum": [
						"DISABLE",
						"ENABLE"
					],
					"example": "DISABLE",
					"default": "ENABLE"
				},
				"appgroup": {
					"description": "可选参数；应用组ID",
					"type": "string",
					"example": "myappgroup",
					"maxLength": 511,
					"minLength": 1
				},
				"project": {
					"type": "string",
					"description": "必选参数；项目名称",
					"example": "myproject",
					"maxLength": 511,
					"minLength": 1
				},
				"new_conns_limit": {
					"description": "可选参数；项目允许的新建连接上限",
					"type": "integer",
					"example": 80,
					"minimum": 0
				},
				"cur_conns_limit": {
					"description": "可选参数；项目允许的并发连接数上限",
					"type": "integer",
					"example": 80,
					"minimum": 0
				},
				"throughput_limit": {
					"type": "integer",
					"example": 80,
					"description": "可选参数；项目允许的吞吐上限",
					"minimum": 0
				}
			}
		}
	}
}