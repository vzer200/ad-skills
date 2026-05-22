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
		"/api/ad/v3/slb/persist/cookie-rewrite/": {
			"description": "新建、查看会话保持（改写cookie）配置",
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
					"persist"
				],
				"summary": "get all persist-cookie-rewrite-cookie-rewrite",
				"description": "查看已有会话保持（改写cookie）配置信息列表",
				"operationId": "get_persist_cookie_rewrite_cookie_rewrite_list",
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
						"$ref": "#/responses/operation_config_persist_cookie_rewrite_cookie_rewrite_list"
					}
				}
			},
			"post": {
				"tags": [
					"persist"
				],
				"summary": "create new persist-cookie-rewrite-cookie-rewrite",
				"description": "新建会话保持（改写cookie）配置",
				"operationId": "add_persist_cookie_rewrite_cookie_rewrite_list",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-REWRITE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_rewrite_cookie_rewrite_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb persist cookie-rewrite cookitest cookie abcdefg http_only enable cookie_encryption { state enable password 123456 accept_plaintext enable } secure enable busy_protect enable",
					"description": "新建cookie改写的会话保持,Cookie名称为abcdefg,启用httponly和secure,同时启用cookie加密,兼容明文cookie"
				},
				{
					"command": "modify slb persist cookie-rewrite cookitest cookie_encryption { state disable }",
					"description": "修改改写cookie会话保持不进行cookie加密"
				},
				{
					"command": "list slb persist cookie-rewrite cookitest",
					"description": "查看会话保持cookitest的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/persist/cookie-rewrite/{name}": {
			"description": "查看、新建、修改、删除会话保持（改写cookie）配置",
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
					"persist"
				],
				"summary": "get specific persist-cookie-rewrite-cookie-rewrite",
				"description": "查看指定会话保持（改写cookie）配置",
				"operationId": "get_persist_cookie_rewrite_cookie_rewrite",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_rewrite_cookie_rewrite_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"persist"
				],
				"summary": "create new persist-cookie-rewrite-cookie-rewrite",
				"description": "新建会话保持（改写cookie）配置",
				"operationId": "create_persist_cookie_rewrite_cookie_rewrite",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-REWRITE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_rewrite_cookie_rewrite_object"
					}
				}
			},
			"put": {
				"tags": [
					"persist"
				],
				"summary": "replace specific persist-cookie-rewrite-cookie-rewrite",
				"description": "修改指定会话保持（改写cookie）配置",
				"operationId": "replace_persist_cookie_rewrite_cookie_rewrite",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-REWRITE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_rewrite_cookie_rewrite_object"
					}
				}
			},
			"patch": {
				"tags": [
					"persist"
				],
				"summary": "modify specific persist-cookie-rewrite-cookie-rewrite",
				"description": "修改指定会话保持（改写cookie）配置",
				"operationId": "edit_persist_cookie_rewrite_cookie_rewrite",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-REWRITE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_rewrite_cookie_rewrite_object"
					}
				}
			},
			"delete": {
				"tags": [
					"persist"
				],
				"summary": "delete specific persist-cookie-rewrite-cookie-rewrite",
				"description": "删除指定会话保持（改写cookie）配置",
				"operationId": "delete_persist_cookie_rewrite_cookie_rewrite",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_rewrite_cookie_rewrite_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PERSIST-COOKIE-REWRITE-CONFIG": {
			"name": "PERSIST-COOKIE-REWRITE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON格式的配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_rewrite"
			}
		},
		"PERSIST-COOKIE-REWRITE-PROPERTY": {
			"name": "PERSIST-COOKIE-REWRITE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON格式的配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_rewrite"
			}
		}
	},
	"responses": {
		"operation_config_persist_cookie_rewrite_cookie_rewrite_list": {
			"description": "返回给前端的配置列表的JSON格式参数属性",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_rewrite_list"
			}
		},
		"operation_config_persist_cookie_rewrite_cookie_rewrite_object": {
			"description": "返回给前端的配置的JSON格式参数属性",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_rewrite"
			}
		}
	},
	"definitions": {
		"config.persist_cookie_rewrite_list": {
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
						"$ref": "#/definitions/config.persist_cookie_rewrite"
					}
				}
			}
		},
		"config.persist_cookie_rewrite": {
			"type": "object",
			"required": [
				"name",
				"cookie"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定会话保持的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "cookie_passive"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。",
					"example": ""
				},
				"type": {
					"description": "只读字段;指定会话保持的类型",
					"type": "string",
					"enum": [
						"COOKIE-REWRITE"
					],
					"default": "COOKIE-REWRITE"
				},
				"cookie": {
					"description": "可选参数;指定改写cookie的名称",
					"type": "string",
					"maxLength": 31,
					"minLength": 1,
					"example": "sangfor_ad"
				},
				"http_only": {
					"description": "可选参数；指定httponly的开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"secure": {
					"description": "可选参数；指定secure的开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"cookie_encryption": {
					"description": "可选参数；指定cookie加密的配置:state表示启用禁用开关,accept_plaintext表示兼容明文,password表示加密密码,默认不启用",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；指定cookie加密的开关，disable表示禁用，enable表示启用；默认禁用。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"accept_plaintext": {
							"description": "可选参数;指定是否兼容明文cookie,disable表示禁用，enable表示启用；默认启用。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"password": {
							"description": "可选参数;指定cookie加密密码",
							"type": "string",
							"maxLength": 64,
							"minLength": 8,
							"example": "abcd1234"
						},
						"pk_password": {
							"description": "加密密码，可写(控制台)",
							"type": "string",
							"maxLength": 1024,
							"minLength": 1,
							"example": "A1B2C3D4"
						},
						"encrypted_password": {
							"description": "可选参数;指定已加密的cookie加密密码",
							"type": "string",
							"maxLength": 1024,
							"minLength": 1,
							"example": "A1B2C3D4"
						}
					}
				},
				"session_persist_synchronize": {
					"description": "会话保持同步",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"busy_protect": {
					"description": "可选参数；指定繁忙保护的开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				}
			}
		}
	}
}