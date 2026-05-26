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
		"/api/ad/v3/slb/ssl-client/": {
			"description": "新建、查看ssl卸载策略配置",
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
					"ssl-client"
				],
				"summary": "get all ssl-client",
				"description": "查看当前已有的ssl卸载策略配置信息",
				"operationId": "get_ssl_client_list",
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
						"$ref": "#/responses/operation_config_ssl_client_list"
					}
				}
			},
			"post": {
				"tags": [
					"ssl-client"
				],
				"summary": "create new ssl-client",
				"description": "新建一个ssl卸载策略配置",
				"operationId": "add_ssl_client_list",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-CLIENT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_client_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb ssl-client abc description ssloffload certificate_ecdsa ecdsa certificate_rsa rsa service ssl-offload-https protocols [ sslv3 tls1.0 tls1.1 tls1.2 ] protocol_disabled_policy http-response-and-deny protocol_disabled_http_response SSL协议版本未启用 cipher_suites add [ ssl_rsa_with_3des_ede_cbc_sha tls_ecdhe_ecdsa_with_aes_128_cbc_sha ] sni www.sangfor.com.cn session_ticket enable session_resume { state enable number 1700 timeout 100 } peer_auth_state enable peer_auth_certificate required peer_auth_ca ca peer_auth_chain_depth 10 peer_auth_url rule peer_auth_url_rules [ { url_pattern_wildcard /index.html action auth url_pattern_case_sensitive enable } { url_pattern_wildcard /abc.html action no-auth url_pattern_case_sensitive disable } { url_pattern_wildcard * action auth url_pattern_case_sensitive disable }] peer_auth_crls add [ crl1 ] peer_auth_fail_rules add [ { reason cert_chain_too_long action deny } { reason cert_has_expired action http-response-and-deny http_response 证书已过期 } { reason default\naction deny } ]",
					"description": "新建ssl卸载策略abc,启用所有ssl协议,协议未启用时返回指定页面,SSL加密套件为ssl_rsa_with_3des_ede_cbc_sha和tls_ecdhe_ecdsa_with_aes_128_cbc_sha,启用session_ticket和SSL会话复用,启用客户端认证,客户端证书必须,指定/index.html为客户端认证,/abc.html为无客户端认证,默认为客户端认证"
				},
				{
					"command": "modify slb ssl-client abc peer_auth_url_rules add [ { url_pattern_wildcard /test.html action no-auth url_pattern_case_sensitive disable }] peer_auth_fail_rules add [ { reason cert_is_not_trusted action deny }]",
					"description": "修改SSL卸载策略,指定url:/test.html无客户端认证,同时认证失败规则增加证书不受信任时拒绝访问"
				},
				{
					"command": "list slb ssl-client abc",
					"description": "查看SSL卸载策略abc的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/ssl-client/{name}": {
			"description": "新建、查看、修改、删除指定的ssl卸载策略配置",
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
					"ssl-client"
				],
				"summary": "get specific ssl-client",
				"description": "查看指定的ssl卸载策略配置",
				"operationId": "get_ssl_client",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_client_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ssl-client"
				],
				"summary": "create new ssl-client",
				"description": "新建指定的ssl卸载策略配置",
				"operationId": "create_ssl_client",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-CLIENT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_client_object"
					}
				}
			},
			"put": {
				"tags": [
					"ssl-client"
				],
				"summary": "replace specific ssl-client",
				"description": "修改指定的ssl卸载策略配置",
				"operationId": "replace_ssl_client",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-CLIENT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_client_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ssl-client"
				],
				"summary": "modify specific ssl-client",
				"description": "修改指定的ssl卸载策略配置",
				"operationId": "edit_ssl_client",
				"parameters": [
					{
						"$ref": "#/parameters/SSL-CLIENT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_client_object"
					}
				}
			},
			"delete": {
				"tags": [
					"ssl-client"
				],
				"summary": "delete specific ssl-client",
				"description": "删除指定的ssl卸载策略配置",
				"operationId": "delete_ssl_client",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_client_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SSL-CLIENT-CONFIG": {
			"name": "SSL-CLIENT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssl_client"
			}
		},
		"SSL-CLIENT-PROPERTY": {
			"name": "SSL-CLIENT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssl_client"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "config virtual service name",
			"required": true
		},
		"ssl_client_name": {
			"name": "ssl_client_name",
			"in": "path",
			"type": "string",
			"description": "config ssl-client name",
			"required": true
		}
	},
	"responses": {
		"operation_config_ssl_client_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_client_list"
			}
		},
		"operation_config_ssl_client_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_client"
			}
		}
	},
	"definitions": {
		"config.ssl_client_list": {
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
						"$ref": "#/definitions/config.ssl_client"
					}
				}
			}
		},
		"config.ssl_client": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定SSL卸载策略的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "ebank.test.com_ssl_offload"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"service": {
					"description": "可选参数;指定SSL策略的服务类型,ssl-offload表示基于tcp的ssl服务;ssl-offload-https表示基于http的ssl服务;默认为ssl-offload-https",
					"type": "string",
					"enum": [
						"SSL-OFFLOAD",
						"SSL-OFFLOAD-HTTPS"
					],
					"default": "SSL-OFFLOAD-HTTPS"
				},
				"certificate_ecdsa": {
					"description": "可选参数;指定ecdsa类型的服务器证书,默认为none,表示不使用ecdsa的证书",
					"type": "string",
					"maxLength": 80,
					"minLength": 1,
					"optionalEnum": [
						"NONE"
					],
					"example": "www_test_com"
				},
				"certificate_rsa": {
					"description": "可选参数;指定rsa类型的服务器证书,默认为none,表示不使用rsa的证书",
					"type": "string",
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
					"optionalEnum": [
						"NONE"
					],
					"example": "www_test_com"
				},
				"certificate_gm_encrypt": {
					"description": "国密加密证书",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"example": "www_test_com"
				},
				"protocols": {
					"description": "可选参数;指定服务端支持的ssl协议,默认为tls1.2和tls1.3",
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
					"minItems": 1,
					"maxItems": 6,
					"default": [
						"SSLV3",
						"TLS1.0",
						"TLS1.1",
						"TLS1.2",
						"TLS1.3"
					]
				},
				"protocol_disabled_policy": {
					"description": "可选参数;指定协议未启用时的策略,deny表示拒绝,http-response-and-deny表示返回指定页面[只适用于ssl-offload-https类型],默认为deny",
					"type": "string",
					"enum": [
						"DENY",
						"HTTP-RESPONSE-AND-DENY"
					],
					"default": "DENY"
				},
				"protocol_disabled_http_response": {
					"description": "可选参数;指定协议未启用时的返回页面,当protocol_disabled_policy为http-response-and-deny时该参数必填",
					"type": "string",
					"example": "302_redirect"
				},
				"cipher_suites": {
					"description": "加密算法集合",
					"type": "array",
					"uniqueItems": true,
					"items": {
						"description": "可选参数;单个加密算法",
						"$ref": "#/definitions/config.ssl_cipher_suites"
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
					"description": "可选参数;指定SNI备用名称",
					"type": "string",
					"example": "bank.abc.com"
				},
				"session_resume": {
					"description": "可选参数;指定SSL会话复用的配置,默认启用。",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数;指定SSL会话复用的状态,enable表示启用,disable表示禁用;默认为启用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"number": {
							"description": "可选参数;指定会话缓存的大小,默认为2000",
							"type": "integer",
							"default": 2000,
							"maximum": 5000,
							"minimum": 100,
							"example": 2000
						},
						"timeout": {
							"description": "可选参数;指定会话缓存的超时时间,默认为1800s",
							"type": "integer",
							"default": 1800,
							"maximum": 86400,
							"minimum": 10,
							"example": 3600
						}
					},
					"required": []
				},
				"session_ticket": {
					"description": "可选参数;指定session_ticket的状态,enable表示启用,disable表示禁用;默认为启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"peer_auth_state": {
					"description": "可选参数;指定客户端认证的状态,enable表示启用,disable表示禁用;默认为disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"peer_auth_certificate": {
					"description": "可选参数;指定客户端证书的必要性,required表示必须,optional表示可选;默认为required",
					"type": "string",
					"enum": [
						"REQUIRED",
						"OPTIONAL"
					],
					"default": "REQUIRED"
				},
				"peer_auth_url": {
					"description": "可选参数;指定客户端认证url策略,默认为all,表示所有url均为客户端认证",
					"type": "string",
					"enum": [
						"ALL",
						"RULE"
					],
					"default": "ALL"
				},
				"peer_auth_url_rules": {
					"description": "可选参数;指定url客户端认证策略,该参数是一个对象参数列表,支持add/delete进行对象的添加和删除。url_pattern_wildcard来指定url,url_pattern_case_sensitive表示是否区分大小写,action指定是否做客户端认证[auth表示需要客户端认证;no-auth表示无客户端认证]",
					"type": "array",
					"uniqueItems": true,
					"prioritySensitive": true,
					"items": {
						"description": "单个URI",
						"type": "object",
						"required": [
							"url_pattern_wildcard",
							"action"
						],
						"properties": {
							"url_pattern_wildcard": {
								"description": "URI字符串",
								"type": "string",
								"minLength": 1,
								"maxLength": 255,
								"example": "/ebank*"
							},
							"url_pattern_case_sensitive": {
								"description": "是否区分大小写",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "DISABLE",
								"example": "ENABLE"
							},
							"action": {
								"description": "是否认证",
								"type": "string",
								"enum": [
									"AUTH",
									"NO-AUTH"
								]
							}
						}
					},
					"default": [
						{
							"url_pattern_wildcard": "*",
							"action": "NO-AUTH"
						}
					],
					"maxItems": 128
				},
				"peer_auth_chain_depth": {
					"description": "可选参数;指定客户端证书链深度,取值范围为[1,32],默认为9",
					"type": "integer",
					"default": 9,
					"maximum": 32,
					"minimum": 1,
					"example": 9
				},
				"peer_auth_ca": {
					"description": "可选参数;指定CA证书",
					"type": "string",
					"maxLength": 80,
					"minLength": 1,
					"example": "ca_cert"
				},
				"peer_auth_crls": {
					"description": "可选参数;指定吊销列表",
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
				},
				"peer_auth_fail_rules": {
					"description": "可选参数;指定认证失败策略,该参数为对象参数列表,支持add/delete进行对象的添加和删除。reason指定失败原因,action指定失败动作,http_response指定返回页面;默认规则为deny",
					"type": "array",
					"uniqueItems": true,
					"items": {
						"description": "单个认证失败规则",
						"type": "object",
						"required": [
							"reason",
							"action"
						],
						"properties": {
							"reason": {
								"description": "可选参数;指定失败原因",
								"type": "string",
								"enum": [
									"CERT_SIGNATURE_FAILURE",
									"CERT_NOT_YET_VALID",
									"CERT_HAS_EXPIRED",
									"CERT_CHAIN_TOO_LONG",
									"CERTIFICATE_REVOKED",
									"CERT_IS_NOT_TRUSTED",
									"X509_V_ERR_UNHANDLED_CRITICAL_EXTENSION",
									"X509_V_ERR_NO_CERTIFICATE",
									"DEFAULT",
									"PROTOCOL_DISABLED"
								],
								"example": "CERT_HAS_EXPIRED"
							},
							"action": {
								"description": "可选参数;指定失败动作,allow表示允许继续访问,deny表示拒绝访问,http-response-and-deny表示返回指定页面",
								"type": "string",
								"enum": [
									"ALLOW",
									"DENY",
									"HTTP-RESPONSE-AND-DENY"
								],
								"default": "DENY",
								"example": "HTTP-RESPONSE-AND-DENY"
							},
							"http_response": {
								"description": "可选参数;指定返回自定义内容,action为http-response-and-deny时必选",
								"type": "string",
								"example": "302_redirect"
							}
						}
					},
					"default": [
						{
							"reason": "DEFAULT",
							"action": "DENY"
						}
					],
					"maxItems": 8
				}
			}
		},
		"config.ssl_cipher_suites": {
			"type": "string",
			"enum": [
				"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
				"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
				"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
				"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
				"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
				"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
				"TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
				"TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
				"TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
				"TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
				"TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
				"TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
				"TLS_RSA_WITH_AES_128_GCM_SHA256",
				"TLS_RSA_WITH_AES_256_GCM_SHA384",
				"TLS_RSA_WITH_AES_128_CBC_SHA256",
				"TLS_RSA_WITH_AES_256_CBC_SHA256",
				"TLS_RSA_WITH_AES_128_CBC_SHA",
				"TLS_RSA_WITH_AES_256_CBC_SHA",
				"SSL_RSA_WITH_3DES_EDE_CBC_SHA",
				"TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384",
				"TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384",
				"TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA",
				"SSL_RSA_WITH_RC4_128_SHA",
				"SSL_RSA_WITH_RC4_128_MD5",
				"SSL_RSA_WITH_DES_CBC_SHA",
				"SSL_RSA_WITH_NULL_MD5",
				"SSL_RSA_WITH_NULL_SHA",
				"TLS_RSA_WITH_CAMELLIA_128_CBC_SHA",
				"TLS_RSA_WITH_CAMELLIA_256_CBC_SHA",
				"TLS_RSA_WITH_SEED_CBC_SHA",
				"SSL_RSA_WITH_IDEA_CBC_SHA",
				"TLS1.3_AES_128_GCM_SHA256",
				"TLS1.3_AES_256_GCM_SHA384",
				"TLS1.3_CHACHA20_POLY1305_SHA256",
				"TLS1.3_AES_128_CCM_SHA256",
				"TLS1.3_AES_128_CCM_8_SHA256",
				"TLS1_TXT_ECC_SM2_WITH_SM4_128_CBC_SM3",
				"TLS1_TXT_ECDHE_SM2_WITH_SM4_128_CBC_SM3"
			]
		}
	}
}