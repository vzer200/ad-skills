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
		"/api/ad/v3/slb/user/": {
			"description": "新建、查看访问控制用户配置",
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
					"user"
				],
				"summary": "get all user",
				"description": "查看当前已有的访问控制用户配置信息",
				"operationId": "get_user_list",
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
						"$ref": "#/responses/operation_config_user_list"
					}
				}
			},
			"post": {
				"tags": [
					"user"
				],
				"summary": "create new user",
				"description": "新建一个访问控制用户配置",
				"operationId": "add_user_list",
				"parameters": [
					{
						"$ref": "#/parameters/USER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_user_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb user test password 12345678 state enable description 测试用户",
					"description": "新建应用负载的访问帐户test。"
				},
				{
					"command": "modify slb user test state disable",
					"description": "禁用应用负载的访问帐户test。"
				},
				{
					"command": "list slb user test",
					"description": "查看应用负载的访问帐户test信息。"
				},
				{
					"command": "delete slb user test",
					"description": "删除应用负载的访问帐户test。"
				}
			]
		},
		"/api/ad/v3/slb/user/{name}": {
			"description": "新建、查看、修改、删除指定的访问控制用户配置",
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
					"user"
				],
				"summary": "get specific user",
				"description": "查看指定的访问控制用户配置",
				"operationId": "get_user",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_user_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"user"
				],
				"summary": "create new user",
				"description": "新建指定的访问控制用户配置",
				"operationId": "create_user",
				"parameters": [
					{
						"$ref": "#/parameters/USER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_user_object"
					}
				}
			},
			"put": {
				"tags": [
					"user"
				],
				"summary": "replace specific user",
				"description": "修改指定的访问控制用户配置",
				"operationId": "replace_user",
				"parameters": [
					{
						"$ref": "#/parameters/USER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_user_object"
					}
				}
			},
			"patch": {
				"tags": [
					"user"
				],
				"summary": "modify specific user",
				"description": "修改指定的访问控制用户配置",
				"operationId": "edit_user",
				"parameters": [
					{
						"$ref": "#/parameters/USER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_user_object"
					}
				}
			},
			"delete": {
				"tags": [
					"user"
				],
				"summary": "delete specific user",
				"description": "删除指定的访问控制用户配置",
				"operationId": "delete_user",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_user_object"
					}
				}
			}
		}
	},
	"parameters": {
		"USER-CONFIG": {
			"name": "USER-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.user"
			}
		},
		"USER-PROPERTY": {
			"name": "USER-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.user"
			}
		}
	},
	"responses": {
		"operation_config_user_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.user_list"
			}
		},
		"operation_config_user_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.user"
			}
		}
	},
	"definitions": {
		"config.user_list": {
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
						"$ref": "#/definitions/config.user"
					}
				}
			}
		},
		"config.user": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定用户名称, 在配置中必须唯一。",
					"type": "string",
					"example": "home_page_acp"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"state": {
					"description": "可选参数；指定用户状态，disable表示禁用，enable表示启用；默认enable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"password": {
					"description": "必选参数;指定用户密码。",
					"type": "string",
					"maxLength": 64,
					"minLength": 8
				},
				"encrypted_password": {
					"description": "可选参数;已加密的用户密码。",
					"type": "string"
				},
				"pk_password": {
					"description": "加密密码",
					"type": "string"
				}
			}
		}
	}
}