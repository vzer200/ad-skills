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
		"/api/ad/v3/sys/trap/": {
			"description": "新建、查看Trap配置",
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
					"trap"
				],
				"summary": "get all trap",
				"description": "查看已有的Trap配置",
				"operationId": "get_trap_list",
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
						"$ref": "#/responses/operation_config_trap_list"
					}
				}
			},
			"post": {
				"tags": [
					"trap"
				],
				"summary": "create new trap",
				"description": "新建Trap配置",
				"operationId": "add_trap_list",
				"parameters": [
					{
						"$ref": "#/parameters/TRAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_trap_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys trap trap_example description trap_example_desc state enable address 192.168.1.1 port 126 version v3 snmpv3 { username admin engine_id 0x010203040506adf authentication { state enable algorithm md5 password a1234567 } encrypt { state enable reuse_authentication_password disable algorithm des password a1234567 } }",
					"description": "新建Trap，状态为启用，发送地址为192.168.1.1，发送端口为126，协议版本为v3，用户名为admin，引擎id为0x010203040506adf，开启认证，认证算法为md5，认证密码为a1234567，开启加密，不使用认证密码为加密密码，加密算法为des，加密密码为a1234567"
				},
				{
					"command": "list sys trap trap_example",
					"description": "查看trap_example的配置信息"
				},
				{
					"command": "modify sys trap trap_example snmpv3 { authentication { algorithm sha } }",
					"description": "修改Trap配置，修改认证算法为sha"
				},
				{
					"command": "delete sys trap trap_example",
					"description": "删除Trap配置trap_example"
				}
			]
		},
		"/api/ad/v3/sys/trap/{name}": {
			"description": "新建、查看、修改、删除指定的Trap配置",
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
					"trap"
				],
				"summary": "get specific trap",
				"description": "查看指定的Trap配置",
				"operationId": "get_trap",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_trap_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"trap"
				],
				"summary": "create new trap",
				"description": "新建指定的Trap配置",
				"operationId": "create_trap",
				"parameters": [
					{
						"$ref": "#/parameters/TRAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_trap_object"
					}
				}
			},
			"put": {
				"tags": [
					"trap"
				],
				"summary": "replace specific trap",
				"description": "修改指定的Trap配置",
				"operationId": "replace_trap",
				"parameters": [
					{
						"$ref": "#/parameters/TRAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_trap_object"
					}
				}
			},
			"patch": {
				"tags": [
					"trap"
				],
				"summary": "modify specific trap",
				"description": "修改指定的Trap配置",
				"operationId": "edit_trap",
				"parameters": [
					{
						"$ref": "#/parameters/TRAP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_trap_object"
					}
				}
			},
			"delete": {
				"tags": [
					"trap"
				],
				"summary": "delete specific trap",
				"description": "删除指定的Trap配置",
				"operationId": "delete_trap",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_trap_object"
					}
				}
			}
		}
	},
	"parameters": {
		"TRAP-CONFIG": {
			"name": "TRAP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.trap"
			}
		},
		"TRAP-PROPERTY": {
			"name": "TRAP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.trap"
			}
		}
	},
	"responses": {
		"operation_config_trap_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.trap_list"
			}
		},
		"operation_config_trap_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.trap"
			}
		}
	},
	"definitions": {
		"config.trap_list": {
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
						"$ref": "#/definitions/config.trap"
					}
				}
			}
		},
		"config.trap": {
			"type": "object",
			"required": [
				"name",
				"address"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定Trap配置的名称，在配置中必须唯一",
					"type": "string",
					"example": "DC_SNMP_Trap_public"
				},
				"description": {
					"description": "可选参数；用于对此配置增加备注",
					"type": "string"
				},
				"state": {
					"description": "可选参数；启禁用配置，enable为启用，disable为禁用，默认为enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"trap_encode": {
					"description": "编码方式",
					"type": "string",
					"enum": [
						"UTF8",
						"GBK"
					],
					"default": "GBK",
					"example": "GBK"
				},
				"version": {
					"description": "可选参数；Trap协议版本，默认为v1",
					"type": "string",
					"enum": [
						"V1",
						"V2C",
						"V3"
					],
					"default": "V1",
					"example": "V1"
				},
				"address": {
					"description": "必选参数；Trap发送的目的IP",
					"type": "string",
					"example": "192.168.10.135"
				},
				"port": {
					"description": "可选参数；Trap发送的目的端口，默认为162",
					"type": "integer",
					"default": 162,
					"maximum": 65535,
					"minimum": 1,
					"example": 162
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
				"snmpv1v2c": {
					"description": "可选参数；当协议版本为v1或者v2c的时候需要配置此项",
					"type": "object",
					"properties": {
						"community": {
							"description": "可选参数；共同体，默认为public",
							"type": "string",
							"maxLength": 64,
							"minLength": 1,
							"example": "public"
						},
						"pk_community": {
							"description": "加密共同体",
							"type": "string",
							"example": "A1B2C3D4"
						},
						"encrypted_community": {
							"description": "加密共同体",
							"type": "string",
							"example": "A1B2C3D4"
						}
					},
					"required": []
				},
				"snmpv3": {
					"description": "可选参数；当协议版本为v3的时候需要配置此项",
					"type": "object",
					"required": [
						"username"
					],
					"properties": {
						"engine_id": {
							"description": "可选参数；SNMP引擎ID",
							"maxLength": 64,
							"type": "string",
							"example": "0x010203040506adf"
						},
						"username": {
							"description": "可选参数；用户名",
							"type": "string",
							"maxLength": 31,
							"minLength": 1,
							"example": "admin"
						},
						"authentication": {
							"description": "可选参数；配置Trap认证",
							"type": "object",
							"properties": {
								"state": {
									"description": "可选参数；启禁用认证，enable表示启用，disable表示禁用，默认为enable",
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
									"description": "加密的密码",
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
							"description": "可选参数；配置Trap加密",
							"type": "object",
							"properties": {
								"state": {
									"description": "可选参数；启禁用加密，enable为启用，disable为禁用，默认为enable",
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
								"reuse_authentication_password": {
									"description": "可选参数；是否使用认证密码作为加密密码，enable表示使用，disable表示不使用，默认为disable",
									"type": "string",
									"enum": [
										"ENABLE",
										"DISABLE"
									],
									"default": "DISABLE"
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
									"minLength": 1,
									"maxLength": 1024,
									"example": "A1B2C3D4"
								}
							},
							"required": []
						}
					}
				}
			}
		}
	}
}