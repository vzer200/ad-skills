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
		"/api/ad/v3/token/": {
			"description": "会话令牌管理（注：api请求时需携带身份验证信息。例如，如果选择授权类型 Basic Auth，需要提供用户名和密码）",
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
					"token"
				],
				"summary": "get all token",
				"description": "查询会话令牌列表",
				"operationId": "get_token_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/token"
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
						"$ref": "#/responses/operation_config_token_list"
					}
				}
			},
			"post": {
				"tags": [
					"token"
				],
				"summary": "create new token",
				"description": "创建新的新的会话令牌",
				"operationId": "add_token_list",
				"parameters": [
					{
						"$ref": "#/parameters/TOKEN-LOGIN"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_token_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list token",
					"description": "获取全部会话令牌"
				},
				{
					"command": "create token username server_name password 123456 client_name aa",
					"description": "创建令牌 其用户名称为：server_name 密码：123456 主机名称：aa"
				}
			]
		},
		"/api/ad/v3/token/{name}": {
			"description": "创建、查询、删除指定会话令牌",
			"parameters": [
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
					"token"
				],
				"summary": "get specific token",
				"description": "查询指定会话令牌",
				"operationId": "get_token",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/token"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_token_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"token"
				],
				"summary": "create new token",
				"description": "创建指定的名称的会话令牌",
				"operationId": "create_token",
				"parameters": [
					{
						"$ref": "#/parameters/TOKEN-LOGIN"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_token_object"
					}
				}
			},
			"delete": {
				"tags": [
					"token"
				],
				"summary": "delete specific token",
				"description": "删除指定名称的会话令牌",
				"operationId": "delete_token",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/token"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_token_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list token ee052d2a-a858-11e9-8cf9-00900b477ec0",
					"description": "获取名称为ee052d2a-a858-11e9-8cf9-00900b477ec0的令牌"
				},
				{
					"command": "delete token ee052d2a-a858-11e9-8cf9-00900b477ec0",
					"description": "删除名称为delete token ee052d2a-a858-11e9-8cf9-00900b477ec0的令牌"
				}
			]
		},
		"/api/ad/v3/refresh-token": {
			"description": "更新指定的会话令牌",
			"parameters": [
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
			"post": {
				"deprecated": true,
				"tags": [
					"token"
				],
				"summary": "refresh new token",
				"description": "更新指定的会话令牌",
				"operationId": "refresh_token",
				"parameters": [
					{
						"$ref": "#/parameters/TOKEN-REFRESH"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_token_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify refresh-token ee052d2a-a858-11e9-8cf9-00900b477ec0",
					"description": "更新名称为ee052d2a-a858-11e9-8cf9-00900b477ec0的令牌"
				}
			]
		}
	},
	"parameters": {
		"TOKEN-CONFIG": {
			"name": "TOKEN-CONFIG",
			"in": "body",
			"required": true,
			"description": "令牌配置",
			"schema": {
				"$ref": "#/definitions/config.token"
			}
		},
		"TOKEN-LOGIN": {
			"name": "TOKEN-LOGIN",
			"in": "body",
			"required": false,
			"description": "登录令牌属性",
			"schema": {
				"$ref": "#/definitions/token.login"
			}
		},
		"TOKEN-REFRESH": {
			"name": "TOKEN-REFRESH",
			"in": "body",
			"required": true,
			"description": "更新令牌配置",
			"schema": {
				"$ref": "#/definitions/config.refresh"
			}
		}
	},
	"responses": {
		"operation_config_token_list": {
			"description": "令牌配置列表",
			"schema": {
				"$ref": "#/definitions/config.token_list"
			}
		},
		"operation_config_token_object": {
			"description": "令牌配置对象",
			"schema": {
				"$ref": "#/definitions/config.token"
			}
		}
	},
	"definitions": {
		"config.token_list": {
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
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.token"
					}
				}
			}
		},
		"config.token": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"readOnly": true,
					"description": "令牌",
					"example": "1A2B3C4D5E6F"
				},
				"client_name": {
					"description": "主机名称",
					"type": "string",
					"readOnly": true,
					"example": "Web_Console_7.0.5"
				},
				"user_name": {
					"description": "用户名称，必须已存在",
					"type": "string",
					"readOnly": true,
					"example": "admin"
				},
				"role_name": {
					"description": "角色名称",
					"type": "string",
					"readOnly": true,
					"example": "admin"
				},
				"source_address": {
					"description": "源地址",
					"type": "string",
					"readOnly": true,
					"example": "192.168.100.12"
				},
				"timeout": {
					"description": "超时时间",
					"type": "integer",
					"readOnly": true,
					"example": 600
				},
				"create_timestamp": {
					"description": "令牌创建时间戳",
					"type": "integer",
					"readOnly": true,
					"example": 1520534455
				},
				"access_timestamp": {
					"description": "令牌访问时间戳",
					"type": "integer",
					"readOnly": true,
					"example": 1520535129
				},
				"expired_timestamp": {
					"description": "令牌到期时间戳",
					"type": "integer",
					"readOnly": true,
					"example": 1520535729
				}
			}
		},
		"token.login": {
			"type": "object",
			"required": [
				"username",
				"client_name"
			],
			"properties": {
				"name": {
					"type": "string",
					"readOnly": true,
					"description": "令牌",
					"example": "1A2B3C4D5E6F"
				},
				"client_name": {
					"description": "主机名称",
					"type": "string",
					"readOnly": true,
					"example": "Web_Console_7.0.5"
				},
				"username": {
					"description": "用户名称，必须已存在",
					"type": "string",
					"readOnly": true,
					"example": "admin"
				},
				"password": {
					"type": "string",
					"example": "ADCDEF",
					"description": "用户密码"
				},
				"pk_password": {
					"description": "用户密码的加密格式",
					"type": "string",
					"example": ""
				},
				"source_address": {
					"description": "源地址",
					"type": "string",
					"example": "192.168.100.12"
				},
				"signature": {
					"description": "签名",
					"type": "string"
				},
				"signature_time": {
					"description": "签名时间戳",
					"type": "integer",
					"example": "1564588800"
				}
			}
		},
		"config.refresh": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "需要刷新的令牌名称",
					"example": "1A2B3C4D5E6F"
				}
			}
		}
	}
}