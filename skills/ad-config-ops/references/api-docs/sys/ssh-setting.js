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
		"/api/ad/v3/sys/ssh-setting": {
			"description": "查看、修改SSH命令行配置",
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
					"ssh-setting"
				],
				"summary": "get ssh-setting",
				"description": "查看当前已有的SSH命令行配置信息",
				"operationId": "get_ssh_setting",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_setting_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get ssh-setting",
						"description": "查看当前已有的SSH命令行配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/ssh-setting"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/ssh-setting 响应",
						"description": "返回GET /api/ad/v3/sys/ssh-setting的响应数据",
						"value": {
							"ssh_console": {
								"cipher_suites": [
									"AES256_CTR"
								],
								"keyex_suites": [
									"CURVE25519_SHA256"
								],
								"ssl_ciphers": [
									"AES256-GCM-SHA384"
								],
								"mac_suites": [
									"UMAC_128_ETM_AT_OPENSSH.COM"
								],
								"session_timeout": 600,
								"ssh_port": 22
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"ssh-setting"
				],
				"summary": "replace ssh-setting",
				"description": "修改SSH命令行配置",
				"operationId": "replace_ssh_setting",
				"parameters": [
					{
						"$ref": "#/parameters/SSH-SETTING-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_setting_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace ssh-setting",
						"description": "修改SSH命令行配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/ssh-setting",
							"body": {}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/ssh-setting 响应",
						"description": "返回PUT /api/ad/v3/sys/ssh-setting的响应数据",
						"value": {
							"ssh_console": {
								"cipher_suites": [
									"AES256_CTR"
								],
								"keyex_suites": [
									"CURVE25519_SHA256"
								],
								"ssl_ciphers": [
									"AES256-GCM-SHA384"
								],
								"mac_suites": [
									"UMAC_128_ETM_AT_OPENSSH.COM"
								],
								"session_timeout": 600,
								"ssh_port": 22
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"ssh-setting"
				],
				"summary": "modify ssh-setting",
				"description": "修改SSH命令行配置",
				"operationId": "edit_ssh_setting",
				"parameters": [
					{
						"$ref": "#/parameters/SSH-SETTING-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_setting_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify ssh-setting",
						"description": "修改SSH命令行配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/ssh-setting",
							"body": {}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/ssh-setting 响应",
						"description": "返回PATCH /api/ad/v3/sys/ssh-setting的响应数据",
						"value": {
							"ssh_console": {
								"cipher_suites": [
									"AES256_CTR"
								],
								"keyex_suites": [
									"CURVE25519_SHA256"
								],
								"ssl_ciphers": [
									"AES256-GCM-SHA384"
								],
								"mac_suites": [
									"UMAC_128_ETM_AT_OPENSSH.COM"
								],
								"session_timeout": 600,
								"ssh_port": 22
							}
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys ssh-setting ssh_console { session_timeout 86400 ssh_port 22345 }",
					"description": "修改当前SSH命令行配置，开启ssh命令行，设置会话超时时间为86400秒，ssh命令行端口为22345"
				},
				{
					"command": "list sys ssh-setting",
					"description": "查看当前SSH命令行配置信息"
				}
			]
		}
	},
	"parameters": {
		"SSH-SETTING-CONFIG": {
			"name": "SSH-SETTING-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssh_setting"
			}
		},
		"SSH-SETTING-PROPERTY": {
			"name": "SSH-SETTING-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssh_setting"
			}
		}
	},
	"responses": {
		"operation_config_ssh_setting_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssh_setting"
			}
		}
	},
	"definitions": {
		"config.ssh_setting": {
			"description": "ssh会话超时时间",
			"properties": {
				"ssh_console": {
					"description": "ssh控制台配置",
					"properties": {
						"cipher_suites": {
							"default": [
								"AES256_CTR",
								"AES192_CTR",
								"AES128_CTR",
								"CHACHA20_POLY1305_AT_OPENSSH.COM",
								"AES256_GCM_AT_OPENSSH.COM",
								"AES128_GCM_AT_OPENSSH.COM"
							],
							"description": "SSH加密算法集合",
							"items": {
								"description": "单个SSH加密算法",
								"enum": [
									"AES256_CTR",
									"AES192_CTR",
									"AES128_CTR",
									"CHACHA20_POLY1305_AT_OPENSSH.COM",
									"AES256_GCM_AT_OPENSSH.COM",
									"AES128_GCM_AT_OPENSSH.COM"
								],
								"type": "string"
							},
							"type": "array",
							"uniqueItems": true,
							"minItems": 1
						},
						"keyex_suites": {
							"default": [
								"CURVE25519_SHA256",
								"CURVE25519_SHA256_AT_LIBSSH.ORG",
								"ECDH_SHA2_NISTP521",
								"ECDH_SHA2_NISTP384",
								"ECDH_SHA2_NISTP256",
								"DIFFIE_HELLMAN_GROUP_EXCHANGE_SHA256",
								"DIFFIE_HELLMAN_GROUP18_SHA512",
								"DIFFIE_HELLMAN_GROUP16_SHA512",
								"DIFFIE_HELLMAN_GROUP14_SHA256",
								"DIFFIE_HELLMAN_GROUP14_SHA1"
							],
							"description": "SSH密钥交换算法集合",
							"items": {
								"description": "单个SSH密钥交换算法",
								"enum": [
									"CURVE25519_SHA256",
									"CURVE25519_SHA256_AT_LIBSSH.ORG",
									"ECDH_SHA2_NISTP521",
									"ECDH_SHA2_NISTP384",
									"ECDH_SHA2_NISTP256",
									"DIFFIE_HELLMAN_GROUP_EXCHANGE_SHA256",
									"DIFFIE_HELLMAN_GROUP18_SHA512",
									"DIFFIE_HELLMAN_GROUP16_SHA512",
									"DIFFIE_HELLMAN_GROUP14_SHA256",
									"DIFFIE_HELLMAN_GROUP14_SHA1"
								],
								"type": "string"
							},
							"type": "array",
							"uniqueItems": true,
							"minItems": 1
						},
						"ssl_ciphers": {
							"default": [
								"AES256-GCM-SHA384"
							],
							"description": "web控制台密码套件",
							"items": {
								"description": "单个web控制台密码套件",
								"enum": [
									"AES256-GCM-SHA384",
									"AES128-GCM-SHA256",
									"AES256-SHA256",
									"AES128-SHA256",
									"AES256-SHA",
									"AES128-SHA",
									"ECDHE-RSA-AES128-GCM-SHA256",
									"ECDHE-ECDSA-AES128-GCM-SHA256",
									"ECDHE-RSA-AES256-GCM-SHA384",
									"ECDHE-ECDSA-AES256-GCM-SHA384",
									"ECDHE-ECDSA-CHACHA20-POLY1305",
									"ECDHE-RSA-CHACHA20-POLY1305",
									"ECDHE-RSA-AES128-SHA256",
									"ECDHE-ECDSA-AES128-SHA256",
									"ECDHE-RSA-AES128-SHA",
									"ECDHE-ECDSA-AES128-SHA",
									"ECDHE-RSA-AES256-SHA384",
									"ECDHE-ECDSA-AES256-SHA384",
									"ECDHE-RSA-AES256-SHA",
									"ECDHE-ECDSA-AES256-SHA"
								],
								"type": "string",
								"default": "AES256-GCM-SHA384"
							},
							"type": "array",
							"minItems": 1
						},
						"mac_suites": {
							"default": [
								"UMAC_128_ETM_AT_OPENSSH.COM",
								"UMAC_64_ETM_AT_OPENSSH.COM",
								"HMAC_SHA2_512_ETM_AT_OPENSSH.COM",
								"HMAC_SHA2_256_ETM_AT_OPENSSH.COM",
								"HMAC_SHA1_ETM_AT_OPENSSH.COM",
								"UMAC_128_AT_OPENSSH.COM",
								"UMAC_64_AT_OPENSSH.COM",
								"HMAC_SHA2_512",
								"HMAC_SHA2_256",
								"HMAC_SHA1"
							],
							"description": "SSH MAC算法集合",
							"items": {
								"description": "单个SSH MAC算法",
								"enum": [
									"UMAC_128_ETM_AT_OPENSSH.COM",
									"UMAC_64_ETM_AT_OPENSSH.COM",
									"HMAC_SHA2_512_ETM_AT_OPENSSH.COM",
									"HMAC_SHA2_256_ETM_AT_OPENSSH.COM",
									"HMAC_SHA1_ETM_AT_OPENSSH.COM",
									"UMAC_128_AT_OPENSSH.COM",
									"UMAC_64_AT_OPENSSH.COM",
									"HMAC_SHA2_512",
									"HMAC_SHA2_256",
									"HMAC_SHA1"
								],
								"type": "string"
							},
							"type": "array",
							"uniqueItems": true,
							"minItems": 1
						},
						"session_timeout": {
							"default": 600,
							"description": "ssh会话超时时间",
							"example": 600,
							"maximum": 86400,
							"minimum": 60,
							"type": "integer"
						},
						"ssh_port": {
							"default": 22,
							"description": "ssh会话端口",
							"example": 22,
							"maximum": 65535,
							"minimum": 1,
							"type": "integer"
						}
					},
					"type": "object"
				}
			},
			"required": [],
			"type": "object"
		}
	}
}