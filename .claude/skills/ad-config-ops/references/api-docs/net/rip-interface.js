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
		"/api/ad/v3/net/rip-interface/": {
			"description": "rip动态路由接口配置相关操作",
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
					"rip-interface"
				],
				"summary": "get all rip-interface",
				"description": "获取rip动态路由接口配置",
				"operationId": "get_rip_interface_list",
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
						"$ref": "#/responses/operation_config_rip_interface_list"
					}
				}
			},
			"post": {
				"tags": [
					"rip-interface"
				],
				"summary": "create new rip-interface",
				"description": "",
				"operationId": "add_rip_interface_list",
				"parameters": [
					{
						"$ref": "#/parameters/RIP-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_interface_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"rip-interface"
				],
				"summary": "modify rip-interface",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_rip_interface_list",
				"parameters": [
					{
						"$ref": "#/parameters/RIP-INTERFACE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_interface_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net rip-interface",
					"description": "获取全部rip接口配置"
				},
				{
					"command": "list net rip-interface test_rip",
					"description": "获取指定rip接口test_rip配置"
				},
				{
					"command": "create net rip-interface test_md5_rip link test_wan Authentication { mode md5 key-id 55 key-string test_md5 }",
					"description": "创建名称为test_md5_rip的rip接口配置 其引用链路名称为test_wan,认证方式为MD5，keyid为55，认证码为test_md5"
				},
				{
					"command": " modify net rip-interface test_md5_rip Authentication { mode none }",
					"description": "修改rip接口配置test_md5_rip的认证方式为无"
				},
				{
					"command": "delete net rip-interface test_md5_rip",
					"description": "删除rip接口配置test_md5_rip"
				}
			]
		},
		"/api/ad/v3/net/rip-interface/{name}": {
			"description": "rip动态路由接口相关配置",
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
					"rip-interface"
				],
				"summary": "get specific rip-interface",
				"description": "",
				"operationId": "get_rip_interface",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_interface_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"rip-interface"
				],
				"summary": "create new rip-interface",
				"description": "",
				"operationId": "create_rip_interface",
				"parameters": [
					{
						"$ref": "#/parameters/RIP-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_interface_object"
					}
				}
			},
			"put": {
				"tags": [
					"rip-interface"
				],
				"summary": "replace specific rip-interface",
				"description": "",
				"operationId": "replace_rip_interface",
				"parameters": [
					{
						"$ref": "#/parameters/RIP-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_interface_object"
					}
				}
			},
			"patch": {
				"tags": [
					"rip-interface"
				],
				"summary": "modify specific rip-interface",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_rip_interface",
				"parameters": [
					{
						"$ref": "#/parameters/RIP-INTERFACE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_interface_object"
					}
				}
			},
			"delete": {
				"tags": [
					"rip-interface"
				],
				"summary": "delete specific rip-interface",
				"description": "",
				"operationId": "delete_rip_interface",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_rip_interface_object"
					}
				}
			}
		}
	},
	"parameters": {
		"RIP-INTERFACE-CONFIG": {
			"name": "RIP-INTERFACE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.rip_interface"
			}
		},
		"RIP-INTERFACE-PROPERTY": {
			"name": "RIP-INTERFACE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.rip_interface"
			}
		}
	},
	"responses": {
		"operation_config_rip_interface_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.rip_interface_list"
			}
		},
		"operation_config_rip_interface_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.rip_interface"
			}
		}
	},
	"definitions": {
		"config.rip_interface_list": {
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
						"$ref": "#/definitions/config.rip_interface"
					}
				}
			}
		},
		"config.rip_interface": {
			"type": "object",
			"required": [
				"name",
				"link"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "指定rip接口配置的名称, 在rip接口配置中必须唯一。",
					"example": "Lan_1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可以对该rip接口配置进行额外的信息补充。"
				},
				"link": {
					"type": "string",
					"description": "rip接口配置引用的系统链路，必须为已经存在的链路名称。",
					"example": "Lan_1",
					"maxLength": 511,
					"minLength": 1
				},
				"version": {
					"type": "integer",
					"description": "rip版本，合法输入为1或者2。",
					"default": 2,
					"example": 1,
					"maximum": 2,
					"minimum": 1
				},
				"Authentication": {
					"description": "rip认证配置。",
					"type": "object",
					"properties": {
						"mode": {
							"type": "string",
							"description": "rip认证类型，合法输入为NONE，PLAIN，MD5。",
							"enum": [
								"NONE",
								"PLAIN",
								"MD5"
							],
							"default": "NONE",
							"example": "MD5"
						},
						"key-id": {
							"type": "integer",
							"description": "md5认证时key id，必须为0~2147483647之间的整数。",
							"minimum": 0,
							"maximum": 2147483647
						},
						"key-string": {
							"type": "string",
							"description": "md5或者明文认证方式的认证码。",
							"minLength": 1,
							"maxLength": 16
						}
					}
				}
			}
		}
	}
}