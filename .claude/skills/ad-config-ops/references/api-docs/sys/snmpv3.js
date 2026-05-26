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
		"/api/ad/v3/sys/snmpv3/": {
			"description": "新建、查看SNMP（V3）配置",
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
					"snmpv3"
				],
				"summary": "get all snmpv3",
				"description": "查看已有的SNMP（V3）配置",
				"operationId": "get_snmpv3_list",
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
						"$ref": "#/responses/operation_config_snmpv3_list"
					}
				}
			},
			"post": {
				"tags": [
					"snmpv3"
				],
				"summary": "create new snmpv3",
				"description": "新建SNMP（V3）配置",
				"operationId": "add_snmpv3_list",
				"parameters": [
					{
						"$ref": "#/parameters/SNMPV3-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmpv3_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys snmpv3 snmpv3_example description snmpv3_config_desc state enable username admin privileges get-and-set authentication { state enable algorithm md5 password a1234567 } encrypt { state enable algorithm des password 1234567a reuse_authentication_password disable }",
					"description": "新建SNMP（V3），状态为启用，用户名为admin，权限为读写，启用认证，认证算法为md5，认证密码为a1234567，启用加密，不使用认证密码为加密密码，加密算法为des，加密密码为1234567a"
				},
				{
					"command": "list sys snmpv3 snmpv3_example",
					"description": "查看snmp_example的配置信息"
				},
				{
					"command": "modify sys snmpv3 snmpv3_example authentication { state disable }",
					"description": "修改SNMP（V3），禁用认证"
				},
				{
					"command": "delete sys snmpv3 snmpv3_example",
					"description": "删除SNMP（V3）配置snmpv3_example"
				}
			]
		},
		"/api/ad/v3/sys/snmpv3/{name}": {
			"description": "新建、查看、修改、删除指定的SNMP（V3）配置",
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
					"snmpv3"
				],
				"summary": "get specific snmpv3",
				"description": "查看指定的SNMP（V3）配置",
				"operationId": "get_snmpv3",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmpv3_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"snmpv3"
				],
				"summary": "create new snmpv3",
				"description": "新建指定的SNMP（V3）配置",
				"operationId": "create_snmpv3",
				"parameters": [
					{
						"$ref": "#/parameters/SNMPV3-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmpv3_object"
					}
				}
			},
			"put": {
				"tags": [
					"snmpv3"
				],
				"summary": "replace specific snmpv3",
				"description": "修改指定的SNMP（V3）配置",
				"operationId": "replace_snmpv3",
				"parameters": [
					{
						"$ref": "#/parameters/SNMPV3-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmpv3_object"
					}
				}
			},
			"patch": {
				"tags": [
					"snmpv3"
				],
				"summary": "modify specific snmpv3",
				"description": "修改指定的SNMP（V3）配置",
				"operationId": "edit_snmpv3",
				"parameters": [
					{
						"$ref": "#/parameters/SNMPV3-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmpv3_object"
					}
				}
			},
			"delete": {
				"tags": [
					"snmpv3"
				],
				"summary": "delete specific snmpv3",
				"description": "删除指定的SNMP（V3）配置",
				"operationId": "delete_snmpv3",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmpv3_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SNMPV3-CONFIG": {
			"name": "SNMPV3-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.snmpv3"
			}
		},
		"SNMPV3-PROPERTY": {
			"name": "SNMPV3-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.snmpv3"
			}
		}
	},
	"responses": {
		"operation_config_snmpv3_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snmpv3_list"
			}
		},
		"operation_config_snmpv3_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snmpv3"
			}
		}
	},
	"definitions": {
		"config.snmpv3_list": {
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
						"$ref": "#/definitions/config.snmpv3"
					}
				}
			}
		},
		"config.snmpv3": {
			"type": "object",
			"required": [
				"name",
				"username"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定SNMP（V3）配置的名称，在配置中必须唯一",
					"type": "string",
					"example": "snmp3_admin"
				},
				"description": {
					"description": "可选参数；用于对此配置增加备注",
					"type": "string"
				},
				"state": {
					"description": "可选参数；启禁用配置，enable表示启用，disable表示禁用，默认为enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"username": {
					"description": "必选参数；配置用户名",
					"type": "string",
					"minLength": 1,
					"maxLength": 31,
					"example": "admin"
				},
				"privileges": {
					"description": "可选参数；SNMP（V3）访问权限，get表示只读，get-and-set表示读写，默认为get",
					"type": "string",
					"enum": [
						"GET",
						"GET-AND-SET"
					],
					"default": "GET",
					"example": "GET"
				},
				"authentication": {
					"description": "可选参数；配置SNMP（V3）认证",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；启禁用SNMP（V3）认证，enable为启用，disable为禁用，默认为disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"algorithm": {
							"description": "可选参数；认证算法，默认为md5",
							"type": "string",
							"enum": [
								"MD5",
								"SHA"
							],
							"default": "SHA",
							"example": "MD5"
						},
						"password": {
							"description": "可选参数；认证密码，当启用认证时，password和encrypted_password必须选填一个",
							"passwdDesc": "authentication password",
							"type": "string",
							"minLength": 8,
							"maxLength": 64,
							"example": ""
						},
						"pk_password": {
							"description": "加密后的密码",
							"passwdDesc": "authentication password",
							"type": "string",
							"example": ""
						},
						"encrypted_password": {
							"description": "可选参数；认证密码，该密码为AD加密后返回的密码，当启用认证时，password和encrypted_password必须选填一个",
							"type": "string",
							"maxLength": 1024,
							"example": "A1B2C3D4"
						}
					},
					"required": []
				},
				"encrypt": {
					"description": "可选参数；配置SNMP（V3）加密",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；启禁用加密，enable为启用，disable为禁用，默认为disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"algorithm": {
							"description": "可选参数；加密算法，默认为des",
							"type": "string",
							"enum": [
								"DES",
								"AES"
							],
							"default": "AES",
							"example": "DES"
						},
						"password": {
							"description": "可选参数；加密密码，当启用加密时，password和encrypted_password只能选填一个",
							"passwdDesc": "encrypt password",
							"type": "string",
							"minLength": 8,
							"maxLength": 64,
							"example": ""
						},
						"pk_password": {
							"description": "加密后的密码",
							"passwdDesc": "encrypt password",
							"type": "string",
							"example": ""
						},
						"encrypted_password": {
							"description": "可选参数；加密密码，该密码为AD加密后返回的密码，当启用加密时，password和encrypted_password只能选填一个",
							"type": "string",
							"maxLength": 1024,
							"example": "A1B2C3D4"
						},
						"reuse_authentication_password": {
							"description": "可选参数；是否使用认证密码作为加密密码，enable表示使用，disable表示不使用，默认为disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE"
						}
					},
					"required": []
				}
			}
		}
	}
}