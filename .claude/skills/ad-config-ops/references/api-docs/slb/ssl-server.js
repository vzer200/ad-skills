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
		"/api/ad/v3/slb/ssl-server/": {
			"description": "新建、查看ssl加密策略配置",
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
					"ssl-server"
				],
				"summary": "get all ssl-server",
				"description": "查看当前已有的ssl加密策略配置信息",
				"operationId": "get_ssl_server_list",
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
						"$ref": "#/responses/operation_config_ssl_server_list"
					}
				}
			},
			"post": {
				"tags": [
					"ssl-server"
				],
				"summary": "create new ssl-server",
				"description": "新建一个ssl加密策略配置",
				"operationId": "add_ssl_server_list",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-SERVER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_server_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb ssl-server test_1 certificate abc protocols [ sslv3 tls1.0 tls1.1 tls1.2 ]  session_resume { state enable number 1700 timeout 100 }",
					"description": "新建SSL加密策略test_1,启用所有ssl协议,启用SSL会话复用"
				},
				{
					"command": "modify slb ssl-server test_1 name test_2",
					"description": "修改SSL加密策略名称为test_2"
				},
				{
					"command": "list slb ssl-server test_1",
					"description": "查看SSL加密策略test_1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/ssl-server/{name}": {
			"description": "新建、查看、修改、删除指定的ssl加密策略配置",
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
					"ssl-server"
				],
				"summary": "get specific ssl-server",
				"description": "查看指定的ssl加密策略配置",
				"operationId": "get_ssl_server",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_server_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ssl-server"
				],
				"summary": "create new ssl-server",
				"description": "新建指定的ssl加密策略配置",
				"operationId": "create_ssl_server",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-SERVER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_server_object"
					}
				}
			},
			"put": {
				"tags": [
					"ssl-server"
				],
				"summary": "replace specific ssl-server",
				"description": "修改指定的ssl加密策略配置",
				"operationId": "replace_ssl_server",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-SERVER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_server_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ssl-server"
				],
				"summary": "modify specific ssl-server",
				"description": "修改指定的ssl加密策略配置",
				"operationId": "edit_ssl_server",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-SERVER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_server_object"
					}
				}
			},
			"delete": {
				"tags": [
					"ssl-server"
				],
				"summary": "delete specific ssl-server",
				"description": "删除指定的ssl加密策略配置",
				"operationId": "delete_ssl_server",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_server_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SSL-SERVER-CONFIG": {
			"name": "SSL-SERVER-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssl_server"
			}
		},
		"SSL-SERVER-PROPERTY": {
			"name": "SSL-SERVER-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssl_server"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "config virtual service name",
			"required": true
		},
		"ssl_server_name": {
			"name": "ssl_server_name",
			"in": "path",
			"type": "string",
			"description": "config ssl-client name",
			"required": true
		}
	},
	"responses": {
		"operation_config_ssl_server_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_server_list"
			}
		},
		"operation_config_ssl_server_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_server"
			}
		}
	},
	"definitions": {
		"config.ssl_server_list": {
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
						"$ref": "#/definitions/config.ssl_server"
					}
				}
			}
		},
		"config.ssl_server": {
			"type": "object",
			"description": "Only One type of certificate working as SSL client (PRI: ecdsa/rsa), or set all certificate properties to NONE.",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "SSL加密名称",
					"type": "string",
					"example": "ssl_client"
				},
				"description": {
					"type": "string",
					"description": "SSL加密策略描述信息"
				},
				"certificate": {
					"description": "证书名称，Format: NONE | {certificate}",
					"type": "string",
					"default": "NONE",
					"maxLength": 80,
					"minLength": 1,
					"optionalEnum": [
						"NONE"
					],
					"example": "www_test_com"
				},
				"certificate_gm_sign": {
					"description": "国密签名证书",
					"type": "string",
					"default": "NONE",
					"optionalEnum": [
						"NONE"
					],
					"example": "www_test_com"
				},
				"certificate_gm_encrypt": {
					"description": "国密加密证书",
					"type": "string",
					"default": "NONE",
					"optionalEnum": [
						"NONE"
					],
					"example": "www_test_com"
				},
				"protocols": {
					"description": "启用协议集合",
					"type": "array",
					"items": {
						"description": "单个协议",
						"type": "string",
						"enum": [
							"SSLV3",
							"TLS1.0",
							"TLS1.1",
							"TLS1.2",
							"TLS1.3",
							"GM1.1"
						]
					},
					"default": [
						"TLS1.2",
						"TLS1.3"
					],
					"minItems": 1,
					"maxItems": 6
				},
				"cipher_suites": {
					"description": "加密算法集合",
					"type": "array",
					"uniqueItems": true,
					"items": {
						"description": "可选参数;单个加密算法",
						"$ref": "/api/slb/ssl-client.yaml#/definitions/config.ssl_cipher_suites"
					},
					"default": [
						"TLS1.3_AES_128_GCM_SHA256",
						"TLS1.3_AES_256_GCM_SHA384",
						"TLS1.3_CHACHA20_POLY1305_SHA256",
						"TLS1.3_AES_128_CCM_SHA256",
						"TLS1.3_AES_128_CCM_8_SHA256",
						"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
						"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
						"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
						"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
						"TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
						"TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
						"TLS_RSA_WITH_AES_128_GCM_SHA256",
						"TLS_RSA_WITH_AES_256_GCM_SHA384",
						"TLS_RSA_WITH_AES_128_CBC_SHA256",
						"TLS_RSA_WITH_AES_256_CBC_SHA256",
						"TLS1_TXT_ECC_SM2_WITH_SM4_128_CBC_SM3",
						"TLS1_TXT_ECDHE_SM2_WITH_SM4_128_CBC_SM3"
					],
					"minItems": 1,
					"maxItems": 38
				},
				"sni": {
					"description": "服务器名称",
					"type": "string",
					"example": "bank.abc.com"
				},
				"session_resume": {
					"description": "会话复用",
					"type": "object",
					"properties": {
						"state": {
							"description": "会话复用启用或禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"number": {
							"description": "缓存会话数量",
							"type": "integer",
							"default": 2000,
							"maximum": 5000,
							"minimum": 100,
							"example": 2000
						},
						"timeout": {
							"description": "缓存超时时间",
							"type": "integer",
							"default": 1800,
							"maximum": 86400,
							"minimum": 10,
							"example": 3600
						}
					},
					"required": []
				},
				"peer_auth_state": {
					"description": "服务端认证状态",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"peer_auth_chain_depth": {
					"description": "证书链深度",
					"type": "integer",
					"default": 9,
					"maximum": 32,
					"minimum": 1,
					"example": 9
				},
				"peer_auth_ca_cert": {
					"description": "CA证书",
					"type": "string",
					"maxLength": 80,
					"minLength": 1,
					"example": "ca_cert"
				},
				"peer_auth_crls": {
					"description": "CRL集合",
					"type": "array",
					"items": {
						"description": "单个CRL",
						"maxLength": 80,
						"minLength": 1,
						"type": "string"
					},
					"maxItems": 32,
					"example": [
						"crl_web_1",
						"crl_app_2"
					]
				}
			}
		}
	}
}