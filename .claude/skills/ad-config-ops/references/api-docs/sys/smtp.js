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
		"/api/ad/v3/sys/smtp/": {
			"description": "新建、查看SMTP服务器配置",
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
					"smtp"
				],
				"summary": "get all smtp",
				"description": "查看已有的SMTP服务器配置",
				"operationId": "get_smtp_list",
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
						"$ref": "#/responses/operation_config_smtp_list"
					}
				}
			},
			"post": {
				"tags": [
					"smtp"
				],
				"summary": "create new smtp",
				"description": "新建SMTP服务器配置",
				"operationId": "add_smtp_list",
				"parameters": [
					{
						"$ref": "#/parameters/SMTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_smtp_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys smtp smtp_example description smtp_example_desc ip_address 192.168.1.1 port 25 authentication { state enable username admin password a1234567 }",
					"description": "新建SMTP服务器smtp_example，服务器地址为192.168.1.1，端口为25，开启验证用户名和密码，用户名为admin，密码为a1234567"
				},
				{
					"command": "list sys smtp smtp_example",
					"description": "查看smtp_example的配置信息"
				},
				{
					"command": "modify sys smtp smtp_example ip_address 192.168.2.1",
					"description": "修改SMTP服务器smtp_example的地址为192.168.2.1"
				},
				{
					"command": "delete sys smtp smtp_example",
					"description": "删除SMTP服务器配置smtp_example"
				}
			]
		},
		"/api/ad/v3/sys/smtp/{name}": {
			"description": "新建、查看、修改、删除指定的SMTP服务器配置",
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
					"smtp"
				],
				"summary": "get specific smtp",
				"description": "查看指定的SMTP服务器配置",
				"operationId": "get_smtp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_smtp_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"smtp"
				],
				"summary": "create new smtp",
				"description": "新建指定的SMTP服务器配置",
				"operationId": "create_smtp",
				"parameters": [
					{
						"$ref": "#/parameters/SMTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_smtp_object"
					}
				}
			},
			"put": {
				"tags": [
					"smtp"
				],
				"summary": "replace specific smtp",
				"description": "修改指定的SMTP服务器配置",
				"operationId": "replace_smtp",
				"parameters": [
					{
						"$ref": "#/parameters/SMTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_smtp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"smtp"
				],
				"summary": "modify specific smtp",
				"description": "修改指定的SMTP服务器配置",
				"operationId": "edit_smtp",
				"parameters": [
					{
						"$ref": "#/parameters/SMTP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_smtp_object"
					}
				}
			},
			"delete": {
				"tags": [
					"smtp"
				],
				"summary": "delete specific smtp",
				"description": "删除指定的SMTP服务器配置",
				"operationId": "delete_smtp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_smtp_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SMTP-CONFIG": {
			"name": "SMTP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.smtp"
			}
		},
		"SMTP-PROPERTY": {
			"name": "SMTP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.smtp"
			}
		}
	},
	"responses": {
		"operation_config_smtp_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.smtp_list"
			}
		},
		"operation_config_smtp_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.smtp"
			}
		}
	},
	"definitions": {
		"config.smtp_list": {
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
						"$ref": "#/definitions/config.smtp"
					}
				}
			}
		},
		"config.smtp": {
			"type": "object",
			"required": [
				"name",
				"ip_address"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定SMTP配置的名称，在配置中必须唯一",
					"type": "string",
					"example": "smtp_oa_mail"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用于对此配置增加备注",
					"example": ""
				},
				"ip_address": {
					"description": "必选参数；指定SMTP主机地址",
					"type": "string",
					"example": "192.168.1.102"
				},
				"port": {
					"description": "可选参数；指定SMTP端口，默认为25",
					"type": "integer",
					"maximum": 65535,
					"minimum": 1,
					"default": 25,
					"example": 25
				},
				"network": {
					"description": "选择的网络",
					"type": "string",
					"enum": [
						"MANAGE_NET",
						"SERVICE_NET",
						"AUTO"
					],
					"default": "AUTO",
					"example": "AUTO"
				},
				"ssl": {
					"description": "SSL加密传输",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"authentication": {
					"description": "可选参数；配置验证的用户名和密码",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；启禁用验证用户名和密码，enable表示验证，disable表示不验证，默认为disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"username": {
							"description": "可选参数；验证用户名",
							"type": "string",
							"minLength": 0,
							"maxLength": 63,
							"example": "abc123@xyz.com"
						},
						"password": {
							"description": "可选参数；验证密码，password和encrypted_password只能选填一个",
							"type": "string",
							"minLength": 1,
							"maxLength": 49,
							"example": ""
						},
						"pk_password": {
							"description": "密码",
							"type": "string",
							"example": ""
						},
						"encrypted_password": {
							"description": "可选参数；验证密码，该密码为AD加密后返回的密码，password和encrypted_password只能选填一个",
							"type": "string",
							"example": "A1B2C3D4"
						}
					},
					"required": []
				}
			}
		}
	}
}