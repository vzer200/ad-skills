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
		"/api/ad/v3/sys/user/": {
			"description": "新建、查看用户配置",
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
				"description": "查看已有的用户配置",
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
				"description": "新建用户配置",
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
					"command": "create sys user test role guest password root1234+",
					"description": "新建一个角色为guest，名称为test、密码为root1234+的用户"
				},
				{
					"command": "modify sys user test name test_1",
					"description": "修改test的用户名称为test_1"
				},
				{
					"command": "list sys user test_1",
					"description": "查看用户test_1的配置信息"
				}
			]
		},
		"/api/ad/v3/sys/user/{name}": {
			"description": "新建、查看、修改、删除指定的用户配置",
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
				"description": "查看指定的用户配置",
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
				"description": "新建指定的用户配置",
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
				"description": "修改指定的用户配置",
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
				"description": "修改指定的用户配置",
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
				"description": "删除指定的用户配置",
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
					"description": "用户名只能是英文字母，数字和下划线组合，长度为1～63个字符",
					"type": "string",
					"example": "admin"
				},
				"description": {
					"type": "string",
					"example": "Super Administrator",
					"description": "附加描述信息"
				},
				"state": {
					"description": "启禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"role": {
					"description": "角色类型",
					"type": "string",
					"default": "guest",
					"example": "admin"
				},
				"permit_ctl": {
					"description": "用户角色引用的权限",
					"type": "array",
					"items": {
						"description": "权限控制",
						"type": "object",
						"properties": {
							"role": {
								"description": "角色类型",
								"type": "string",
								"default": "guest",
								"example": "admin"
							},
							"project": {
								"description": "所属项目",
								"type": "string",
								"default": "ALL",
								"example": "common"
							}
						}
					},
					"minItems": 1,
					"maxItems": 16,
					"uniqueItems": true
				},
				"authentication": {
					"description": "登录认证方式",
					"type": "string",
					"enum": [
						"LOCAL-PASSWORD",
						"REMOTE-AUTHENTICATION"
					],
					"default": "LOCAL-PASSWORD"
				},
				"password": {
					"description": "密码，长度限制为8-64个字符",
					"type": "string",
					"maxLength": 64,
					"minLength": 8
				},
				"encrypted_password": {
					"description": "加密密码",
					"type": "string"
				},
				"pk_password": {
					"description": "密码，长度限制为8-64个字符",
					"type": "string"
				},
				"default": {
					"type": "string",
					"description": "只读参数；是否为默认配置",
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				},
				"certificate_authentication": {
					"description": "证书配置",
					"type": "object",
					"required": [
						"state"
					],
					"properties": {
						"state": {
							"description": "证书状态",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"certificate_sign": {
							"type": "string",
							"description": "签名证书"
						}
					}
				},
				"expiry_date": {
					"description": "用户到期时间",
					"type": "string",
					"default": "",
					"example": "2099-01-01"
				}
			}
		}
	}
}