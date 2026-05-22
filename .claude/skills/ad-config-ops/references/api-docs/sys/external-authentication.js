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
		"/api/ad/v3/sys/external-authentication": {
			"description": "查看、修改外部认证配置",
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
					"external-authentication"
				],
				"summary": "get external-authentication",
				"description": "查看外部认证当前配置",
				"operationId": "get_external_authentication",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_external_authentication_object"
					}
				}
			},
			"put": {
				"tags": [
					"external-authentication"
				],
				"summary": "replace external-authentication",
				"description": "修改外部认证配置",
				"operationId": "replace_external_authentication",
				"parameters": [
					{
						"$ref": "#/parameters/EXTERNAL-AUTHENTICATION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_external_authentication_object"
					}
				}
			},
			"patch": {
				"tags": [
					"external-authentication"
				],
				"summary": "modify external-authentication",
				"description": "修改外部认证配置",
				"operationId": "edit_external_authentication",
				"parameters": [
					{
						"$ref": "#/parameters/EXTERNAL-AUTHENTICATION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_external_authentication_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys external-authentication state enable method radius radius { host 1.1.1.1 port 1812 shared_secret root1234+ }",
					"description": "修改外部认证配置，启用外部认证，使用认证方法为radius，外部认证服务器为1.1.1.1，端口为1812，共享秘钥为root1234+"
				},
				{
					"command": "list sys external-authentication",
					"description": "查看当前外部认证配置信息"
				}
			]
		}
	},
	"parameters": {
		"EXTERNAL-AUTHENTICATION-CONFIG": {
			"name": "EXTERNAL-AUTHENTICATION-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.external_authentication"
			}
		},
		"EXTERNAL-AUTHENTICATION-PROPERTY": {
			"name": "EXTERNAL-AUTHENTICATION-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.external_authentication"
			}
		}
	},
	"responses": {
		"operation_config_external_authentication_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.external_authentication"
			}
		}
	},
	"definitions": {
		"config.external_authentication": {
			"type": "object",
			"properties": {
				"state": {
					"description": "启禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"method": {
					"description": "类型",
					"type": "string",
					"enum": [
						"RADIUS",
						"LDAP",
						"TACACS"
					]
				},
				"radius": {
					"description": "radius认证",
					"type": "object",
					"required": [
						"host"
					],
					"properties": {
						"auth_policy": {
							"description": "radius认证优先级设置",
							"type": "string",
							"enum": [
								"LOCAL-FIRST",
								"EXTERNAL-FIRST"
							],
							"example": "LOCAL-FIRST"
						},
						"nas_ip_address": {
							"description": "radius认证的NAS-IP地址",
							"type": "string",
							"example": "192.168.1.1"
						},
						"host": {
							"description": "主机地址",
							"type": "string",
							"example": "192.168.1.1"
						},
						"port": {
							"description": "端口范围",
							"type": "integer",
							"default": 1812,
							"maximum": 65535,
							"minimum": 1,
							"example": 1812
						},
						"shared_secret": {
							"description": "共享密钥",
							"type": "string",
							"maxLength": 128,
							"minLength": 1,
							"example": ""
						},
						"pk_shared_secret": {
							"description": "共享密钥",
							"type": "string",
							"example": ""
						},
						"encrypted_shared_secret": {
							"description": "共享密钥-加密",
							"type": "string",
							"example": "A1B2C3D4"
						},
						"authorization_id": {
							"description": "Read a role name from the specific attribute, except ID 0.",
							"type": "integer",
							"default": 0,
							"maximum": 255,
							"minimum": 0,
							"example": 0
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
						"alternate_server_host": {
							"description": "备份主机地址",
							"type": "string",
							"minLength": 0,
							"example": "192.168.1.1"
						},
						"alternate_server_port": {
							"description": "备份主机端口范围",
							"type": "integer",
							"default": 1812,
							"maximum": 65535,
							"minimum": 0,
							"example": 1812
						},
						"alternate_server_shared_secret": {
							"description": "备份主机共享密钥",
							"type": "string",
							"maxLength": 128,
							"minLength": 0,
							"example": ""
						},
						"pk_alternate_server_shared_secret": {
							"description": "备份主机共享密钥",
							"type": "string",
							"example": ""
						},
						"encrypted_alternate_server_shared_secret": {
							"description": "备份主机共享密钥-加密",
							"type": "string",
							"example": "A1B2C3D4"
						}
					}
				},
				"ldap": {
					"description": "ldap认证",
					"type": "object",
					"required": [
						"host",
						"directory_tree"
					],
					"properties": {
						"host": {
							"description": "主机地址",
							"type": "string",
							"example": "192.168.1.1"
						},
						"port": {
							"description": "端口",
							"type": "integer",
							"default": 389,
							"maximum": 65535,
							"minimum": 1,
							"example": 389
						},
						"ssl": {
							"description": "SSL通讯",
							"type": "object",
							"properties": {
								"state": {
									"description": "是否启用ssl通讯",
									"type": "string",
									"enum": [
										"ENABLE",
										"DISABLE"
									],
									"default": "DISABLE",
									"example": "DISABLE"
								},
								"ca": {
									"description": "证书名称",
									"type": "string",
									"maxLength": 80,
									"minLength": 1,
									"default": "NONE",
									"example": "NONE"
								},
								"certificate": {
									"description": "证书名称",
									"type": "string",
									"default": "NONE",
									"optionalEnum": [
										"NONE"
									],
									"maxLength": 80,
									"minLength": 1,
									"example": "NONE"
								}
							},
							"required": []
						},
						"directory_tree": {
							"description": "目录树",
							"type": "string",
							"maxLength": 256,
							"minLength": 1,
							"example": "/user"
						},
						"search_mode": {
							"description": "搜索方式",
							"type": "string",
							"enum": [
								"SEARCH-ANONYMOUS",
								"SEARCH-SPECIFIC-DN",
								"VERIFY-LOGIN"
							],
							"default": "SEARCH-ANONYMOUS",
							"example": "VERIFY-LOGIN"
						},
						"verify_login_template": {
							"description": "用户名扩展-登录账户",
							"type": "string",
							"maxLength": 256,
							"minLength": 1,
							"example": "${user}"
						},
						"specific_dn": {
							"description": "域用户-绑定账户",
							"type": "string",
							"maxLength": 128,
							"minLength": 1
						},
						"specific_dn_password": {
							"description": "域用户密码-绑定账户-更新密码",
							"type": "string",
							"maxLength": 128,
							"minLength": 1
						},
						"pk_specific_dn_password": {
							"description": "域用户密码-绑定账户-更新密码",
							"type": "string"
						},
						"encrypted_specific_dn_password": {
							"description": "域用户密码-绑定账户-加密密码",
							"type": "string",
							"example": "A1B2C3D4"
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
						}
					}
				},
				"tacacs": {
					"description": "tacacs认证",
					"type": "object",
					"required": [
						"host",
						"role_name"
					],
					"properties": {
						"auth_policy": {
							"description": "tacacs认证优先级设置",
							"type": "string",
							"enum": [
								"LOCAL-FIRST",
								"EXTERNAL-FIRST"
							],
							"example": "LOCAL-FIRST"
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
						"role_name": {
							"description": "引用的角色名称",
							"type": "string",
							"example": "guest"
						},
						"host": {
							"description": "主机地址",
							"type": "string",
							"example": "192.168.1.1"
						},
						"port": {
							"description": "端口范围",
							"type": "integer",
							"default": 49,
							"maximum": 65535,
							"minimum": 1,
							"example": 49
						},
						"shared_secret": {
							"description": "共享密钥",
							"type": "string",
							"maxLength": 128,
							"minLength": 0,
							"example": ""
						},
						"pk_shared_secret": {
							"description": "共享密钥",
							"type": "string",
							"example": "A1B2C3D4"
						},
						"encrypted_shared_secret": {
							"description": "共享密钥-加密",
							"type": "string",
							"example": "A1B2C3D4"
						},
						"tacacs_agreement": {
							"description": "采用协议",
							"type": "string",
							"default": "TACACS_PAP",
							"enum": [
								"TACACS_PAP",
								"TACACS_CHAP"
							],
							"example": "TACACS_PAP"
						},
						"author_service": {
							"description": "主机授权服务",
							"maxLength": 128,
							"type": "string",
							"default": "",
							"example": "ppp"
						},
						"author_protocol": {
							"description": "主机授权协议",
							"maxLength": 128,
							"type": "string",
							"default": "",
							"example": "ip"
						},
						"alternate_server_host": {
							"description": "备份主机地址",
							"type": "string",
							"minLength": 0,
							"example": "192.168.1.1"
						},
						"alternate_server_port": {
							"description": "备份主机端口范围",
							"type": "integer",
							"default": 49,
							"maximum": 65535,
							"minimum": 0,
							"example": 49
						},
						"alternate_server_shared_secret": {
							"description": "备份主机共享密钥",
							"type": "string",
							"maxLength": 128,
							"minLength": 0,
							"example": ""
						},
						"pk_alternate_server_shared_secret": {
							"description": "备份主机共享密钥",
							"type": "string",
							"example": "A1B2C3D4"
						},
						"encrypted_alternate_server_shared_secret": {
							"description": "备份主机共享密钥-加密",
							"type": "string",
							"example": "A1B2C3D4"
						},
						"alternate_tacacs_agreement": {
							"description": "采用协议",
							"type": "string",
							"default": "TACACS_PAP",
							"enum": [
								"TACACS_PAP",
								"TACACS_CHAP"
							],
							"example": "TACACS_PAP"
						},
						"alternate_author_service": {
							"description": "备机授权服务",
							"maxLength": 128,
							"type": "string",
							"default": "",
							"example": "ppp"
						},
						"alternate_author_protocol": {
							"description": "备机授权协议",
							"maxLength": 128,
							"type": "string",
							"default": "",
							"example": "ip"
						}
					}
				}
			}
		}
	}
}