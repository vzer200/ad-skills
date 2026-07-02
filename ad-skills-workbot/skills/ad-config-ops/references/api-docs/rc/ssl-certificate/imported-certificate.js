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
		"/api/ad/v3/rc/ssl-certificate/imported-certificate/": {
			"description": "证书导入配置相关操作",
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
					"$ref": "/api/{common}.yaml#/parameters/project"
				}
			],
			"get": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "get all ssl-certificate-imported-certificate",
				"description": "获取证书导入配置",
				"operationId": "get_ssl_certificate_imported_certificate_list",
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
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all ssl-certificate-imported-certificate",
						"description": "获取证书导入配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/ssl-certificate/imported-certificate/ 响应",
						"description": "返回GET /api/ad/v3/rc/ssl-certificate/imported-certificate/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "www.abc.com_cert",
									"description": "example_string",
									"type": "IMPORTED-CERTIFICATE",
									"subject": {
										"cn": "example_string",
										"c": "example_string",
										"ou": "example_string",
										"o": "example_string",
										"l": "example_string",
										"st": "example_string",
										"email": "example_string"
									},
									"public_key_algorithm": "RSA",
									"public_key_length": 256,
									"signature_algorithm": "SHA256",
									"validity_not_before": "example_string",
									"validity_not_after": "example_string",
									"password": "example_string",
									"encrypted_password": "example_string",
									"certificate_chains": [
										"example_item"
									],
									"project": "common"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "create new ssl-certificate-imported-certificate",
				"description": "新建证书导入配置",
				"operationId": "add_ssl_certificate_imported_certificate_list",
				"parameters": [
					{
						"$ref": "#/parameters/IMPORTED-CERTIFICATE-IMPORT"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new ssl-certificate-imported-certificate",
						"description": "新建证书导入配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/",
							"body": {
								"name": "AI_www.abc.com_cert_A",
								"type": "IMPORTED-CERTIFICATE",
								"cert_type": "ONE_CERT",
								"certificate_chains": [
									"example_item"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/ssl-certificate/imported-certificate/ 响应",
						"description": "返回POST /api/ad/v3/rc/ssl-certificate/imported-certificate/的响应数据",
						"value": {
							"name": "AI_www.abc.com_cert_A",
							"description": "example_string",
							"type": "IMPORTED-CERTIFICATE",
							"subject": {
								"cn": "example_string",
								"c": "example_string",
								"ou": "example_string",
								"o": "example_string",
								"l": "example_string",
								"st": "example_string",
								"email": "example_string"
							},
							"public_key_algorithm": "RSA",
							"public_key_length": 256,
							"signature_algorithm": "SHA256",
							"validity_not_before": "example_string",
							"validity_not_after": "example_string",
							"password": "example_string",
							"encrypted_password": "example_string",
							"certificate_chains": [
								"example_item"
							],
							"project": "common"
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"ssl-certificate"
				],
				"summary": "modify ssl-certificate-imported-certificate",
				"description": "修改证书导入配置",
				"operationId": "edit_ssl_certificate_imported_certificate_list",
				"parameters": [
					{
						"$ref": "#/parameters/IMPORTED-CERTIFICATE-PROPERTY-MODIFY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify ssl-certificate-imported-certificate",
						"description": "修改证书导入配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/",
							"body": {
								"name": "www.abc.com_cert",
								"project": "common"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/ssl-certificate/imported-certificate/ 响应",
						"description": "返回PATCH /api/ad/v3/rc/ssl-certificate/imported-certificate/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "www.abc.com_cert",
									"description": "example_string",
									"type": "IMPORTED-CERTIFICATE",
									"subject": {
										"cn": "example_string",
										"c": "example_string",
										"ou": "example_string",
										"o": "example_string",
										"l": "example_string",
										"st": "example_string",
										"email": "example_string"
									},
									"public_key_algorithm": "RSA",
									"public_key_length": 256,
									"signature_algorithm": "SHA256",
									"validity_not_before": "example_string",
									"validity_not_after": "example_string",
									"password": "example_string",
									"encrypted_password": "example_string",
									"certificate_chains": [
										"example_item"
									],
									"project": "common"
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create rc ssl-certificate imported-certificate ssl1 certificate_chains [ { certificate_token \"ssl1/server.crt\" }  { private_key_token \"ssl2/server.key\" }  ]",
					"description": "新建从文件导入ssl证书ssl1，证书ssl1/server.crt，私钥ssl2/server.key"
				},
				{
					"command": "modify rc ssl-certificate imported-certificate ssl1 name ssl2 certificate_chains [ { certificate_token \"ssl2/server.crt\" }  { private_key_token \"ssl2/server.key\" }  ]",
					"description": "修改从文件导入ssl证书ssl1名称为ssl2，证书ssl2/server.crt，私钥ssl2/server.key"
				},
				{
					"command": "delete rc ssl-certificate imported-certificate ssl1",
					"description": "删除从文件导入ssl证书ssl1"
				},
				{
					"command": "list rc ssl-certificate imported-certificate ssl1",
					"description": "查看从文件导入ssl证书ssl1"
				}
			]
		},
		"/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}": {
			"description": "证书导入配置相关操作",
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
					"$ref": "/api/{common}.yaml#/parameters/project"
				}
			],
			"get": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "get specific ssl-certificate-imported-certificate",
				"description": "获取证书导入配置",
				"operationId": "get_ssl_certificate_imported_certificate",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific ssl-certificate-imported-certificate",
						"description": "获取证书导入配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/ssl-certificate/imported-certificate/{name} 响应",
						"description": "返回GET /api/ad/v3/rc/ssl-certificate/imported-certificate/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"type": "IMPORTED-CERTIFICATE",
							"subject": {
								"cn": "example_string",
								"c": "example_string",
								"ou": "example_string",
								"o": "example_string",
								"l": "example_string",
								"st": "example_string",
								"email": "example_string"
							},
							"public_key_algorithm": "RSA",
							"public_key_length": 256,
							"signature_algorithm": "SHA256",
							"validity_not_before": "example_string",
							"validity_not_after": "example_string",
							"password": "example_string",
							"encrypted_password": "example_string",
							"certificate_chains": [
								"example_item"
							],
							"project": "common"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ssl-certificate"
				],
				"summary": "create new ssl-certificate-imported-certificate",
				"description": "新建证书导入配置",
				"operationId": "create_ssl_certificate_imported_certificate",
				"parameters": [
					{
						"$ref": "#/parameters/IMPORTED-CERTIFICATE-IMPORT"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new ssl-certificate-imported-certificate",
						"description": "新建证书导入配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}",
							"body": {
								"name": "AI_www.abc.com_cert_B",
								"type": "IMPORTED-CERTIFICATE",
								"cert_type": "ONE_CERT",
								"certificate_chains": [
									"example_item"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/ssl-certificate/imported-certificate/{name} 响应",
						"description": "返回POST /api/ad/v3/rc/ssl-certificate/imported-certificate/{name}的响应数据",
						"value": {
							"name": "AI_www.abc.com_cert_B",
							"description": "example_string",
							"type": "IMPORTED-CERTIFICATE",
							"subject": {
								"cn": "example_string",
								"c": "example_string",
								"ou": "example_string",
								"o": "example_string",
								"l": "example_string",
								"st": "example_string",
								"email": "example_string"
							},
							"public_key_algorithm": "RSA",
							"public_key_length": 256,
							"signature_algorithm": "SHA256",
							"validity_not_before": "example_string",
							"validity_not_after": "example_string",
							"password": "example_string",
							"encrypted_password": "example_string",
							"certificate_chains": [
								"example_item"
							],
							"project": "common"
						}
					}
				}
			},
			"put": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "replace specific ssl-certificate-imported-certificate",
				"description": "修改证书导入配置",
				"operationId": "replace_ssl_certificate_imported_certificate",
				"parameters": [
					{
						"$ref": "#/parameters/IMPORTED-CERTIFICATE-CONFIG-MODIFY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific ssl-certificate-imported-certificate",
						"description": "修改证书导入配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}",
							"body": {
								"name": "www.abc.com_cert",
								"project": "common"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/rc/ssl-certificate/imported-certificate/{name} 响应",
						"description": "返回PUT /api/ad/v3/rc/ssl-certificate/imported-certificate/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"type": "IMPORTED-CERTIFICATE",
							"subject": {
								"cn": "example_string",
								"c": "example_string",
								"ou": "example_string",
								"o": "example_string",
								"l": "example_string",
								"st": "example_string",
								"email": "example_string"
							},
							"public_key_algorithm": "RSA",
							"public_key_length": 256,
							"signature_algorithm": "SHA256",
							"validity_not_before": "example_string",
							"validity_not_after": "example_string",
							"password": "example_string",
							"encrypted_password": "example_string",
							"certificate_chains": [
								"example_item"
							],
							"project": "common"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "modify specific ssl-certificate-imported-certificate",
				"description": "修改证书导入配置",
				"operationId": "edit_ssl_certificate_imported_certificate",
				"parameters": [
					{
						"$ref": "#/parameters/IMPORTED-CERTIFICATE-PROPERTY-MODIFY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific ssl-certificate-imported-certificate",
						"description": "修改证书导入配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}",
							"body": {
								"name": "www.abc.com_cert",
								"project": "common"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/ssl-certificate/imported-certificate/{name} 响应",
						"description": "返回PATCH /api/ad/v3/rc/ssl-certificate/imported-certificate/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"type": "IMPORTED-CERTIFICATE",
							"subject": {
								"cn": "example_string",
								"c": "example_string",
								"ou": "example_string",
								"o": "example_string",
								"l": "example_string",
								"st": "example_string",
								"email": "example_string"
							},
							"public_key_algorithm": "RSA",
							"public_key_length": 256,
							"signature_algorithm": "SHA256",
							"validity_not_before": "example_string",
							"validity_not_after": "example_string",
							"password": "example_string",
							"encrypted_password": "example_string",
							"certificate_chains": [
								"example_item"
							],
							"project": "common"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "delete specific ssl-certificate-imported-certificate",
				"description": "删除证书导入配置",
				"operationId": "delete_ssl_certificate_imported_certificate",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_imported_certificate_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific ssl-certificate-imported-certificate",
						"description": "删除证书导入配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/rc/ssl-certificate/imported-certificate/{name} 响应",
						"description": "返回DELETE /api/ad/v3/rc/ssl-certificate/imported-certificate/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"type": "IMPORTED-CERTIFICATE",
							"subject": {
								"cn": "example_string",
								"c": "example_string",
								"ou": "example_string",
								"o": "example_string",
								"l": "example_string",
								"st": "example_string",
								"email": "example_string"
							},
							"public_key_algorithm": "RSA",
							"public_key_length": 256,
							"signature_algorithm": "SHA256",
							"validity_not_before": "example_string",
							"validity_not_after": "example_string",
							"password": "example_string",
							"encrypted_password": "example_string",
							"certificate_chains": [
								"example_item"
							],
							"project": "common"
						}
					}
				}
			}
		},
		"/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}/certificate": {
			"description": "证书导入的证书相关操作",
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
					"$ref": "/api/{common}.yaml#/parameters/project"
				}
			],
			"get": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "import specific ssl-certificate-imported-certificate certificate file",
				"description": "查看导入的证书详情",
				"operationId": "import_ssl_certificate_imported_certificate_certificate_file",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				},
				"x-examples": {
					"request": {
						"summary": "import specific ssl-certificate-imported-certificate certificate file",
						"description": "查看导入的证书详情",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/ssl-certificate/imported-certificate/{name}/certificate"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/ssl-certificate/imported-certificate/{name}/certificate 响应",
						"description": "返回GET /api/ad/v3/rc/ssl-certificate/imported-certificate/{name}/certificate的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"IMPORTED-CERTIFICATE-CONFIG-MODIFY": {
			"name": "IMPORTED-CERTIFICATE-CONFIG-MODIFY",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_imported_certificate_modify"
			}
		},
		"IMPORTED-CERTIFICATE-PROPERTY-MODIFY": {
			"name": "IMPORTED-CERTIFICATE-PROPERTY-MODIFY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_imported_certificate_modify"
			}
		},
		"IMPORTED-CERTIFICATE-IMPORT": {
			"name": "IMPORTED-CERTIFICATE-CONFIG-IMPORT",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_imported_certificate_import"
			}
		}
	},
	"responses": {
		"operation_config_ssl_certificate_imported_certificate_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_imported_certificate_list"
			}
		},
		"operation_config_ssl_certificate_imported_certificate_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_imported_certificate"
			}
		}
	},
	"definitions": {
		"config.ssl_certificate_imported_certificate_list": {
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
						"$ref": "#/definitions/config.ssl_certificate_imported_certificate"
					}
				}
			}
		},
		"config.ssl_certificate_imported_certificate": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定ssl证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_cert"
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"type": {
					"type": "string",
					"description": "可选参数；指定ssl证书类型。",
					"readOnly": true,
					"enum": [
						"IMPORTED-CERTIFICATE"
					],
					"default": "IMPORTED-CERTIFICATE",
					"example": "IMPORTED-CERTIFICATE"
				},
				"subject": {
					"type": "object",
					"description": "指定ssl证书信息。",
					"readOnly": true,
					"properties": {
						"cn": {
							"type": "string",
							"description": "指定通用名称。",
							"readOnly": true
						},
						"c": {
							"type": "string",
							"description": "指定国家。",
							"readOnly": true
						},
						"ou": {
							"type": "string",
							"description": "指定部门。",
							"readOnly": true
						},
						"o": {
							"type": "string",
							"description": "指定公司/机构。",
							"readOnly": true
						},
						"l": {
							"type": "string",
							"description": "指定城市。",
							"readOnly": true
						},
						"st": {
							"type": "string",
							"description": "指定省份。",
							"readOnly": true
						},
						"email": {
							"type": "string",
							"description": "指定email地址。",
							"readOnly": true
						}
					}
				},
				"public_key_algorithm": {
					"type": "string",
					"description": "指定公钥类型。",
					"enum": [
						"RSA",
						"ECDSA"
					],
					"readOnly": true
				},
				"public_key_length": {
					"type": "integer",
					"description": "指定秘钥长度。",
					"enum": [
						256,
						384,
						1024,
						2048,
						4096
					],
					"readOnly": true
				},
				"signature_algorithm": {
					"type": "string",
					"description": "指定签名算法。",
					"enum": [
						"SHA256",
						"SHA1"
					],
					"readOnly": true,
					"default": "SHA256"
				},
				"validity_not_before": {
					"type": "string",
					"description": "指定证书有效起开始时间。",
					"readOnly": true
				},
				"validity_not_after": {
					"type": "string",
					"description": "指定证书有效起结束时间。",
					"readOnly": true
				},
				"password": {
					"type": "string",
					"description": "指定私钥加密密码。",
					"writeOnly\"": true
				},
				"encrypted_password": {
					"type": "string",
					"description": "可选参数；指定加密密码。"
				},
				"certificate_chains": {
					"type": "array",
					"description": "指定证书链。",
					"readOnly": true,
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.certificate_detail"
					}
				},
				"project": {
					"description": "项目名称",
					"type": "string",
					"default": "common"
				}
			}
		},
		"config.ssl_certificate_imported_certificate_import": {
			"type": "object",
			"required": [
				"name",
				"certificate_chains"
			],
			"properties": {
				"name": {
					"description": "证书名称",
					"type": "string",
					"example": "www.abc.com_cert",
					"maxLength": 80,
					"minLength": 1
				},
				"description": {
					"description": "证书描述",
					"type": "string"
				},
				"type": {
					"description": "证书类型",
					"type": "string",
					"enum": [
						"IMPORTED-CERTIFICATE"
					],
					"default": "IMPORTED-CERTIFICATE",
					"example": "IMPORTED-CERTIFICATE"
				},
				"cert_type": {
					"description": "导入证书类型",
					"type": "string",
					"enum": [
						"ONE_CERT",
						"SM2_DOUBLE_CERTS",
						"SM2_CFCA_DOUBLE_CERTS"
					],
					"default": "ONE_CERT",
					"example": "ONE_CERT"
				},
				"password": {
					"description": "指定私钥加密密码",
					"type": "string",
					"writeOnly": true
				},
				"pk_password": {
					"description": "指定加密的私钥加密密码",
					"type": "string",
					"writeOnly": true
				},
				"encrypted_password": {
					"description": "指定加密的私钥加密密码",
					"type": "string"
				},
				"certificate_chains": {
					"description": "证书链",
					"type": "array",
					"items": {
						"description": "证书信息",
						"$ref": "/api/{common}.yaml#/definitions/config.certificate_private_key_with_token"
					},
					"minItems": 1,
					"maxItems": 33
				},
				"key_list": {
					"description": "证书导入文件列表",
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.sm2_certificate_private_key_with_token"
					},
					"minItems": 1,
					"maxItems": 33,
					"required": [
						"file_token"
					]
				},
				"project": {
					"description": "项目名称",
					"type": "string",
					"maxLength": 511,
					"minLength": 1
				}
			}
		},
		"config.ssl_certificate_imported_certificate_modify": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "可选参数；指定ssl证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_cert"
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"password": {
					"type": "string",
					"description": "可选参数；指定私钥加密密码。",
					"writeOnly": true
				},
				"encrypted_password": {
					"description": "可选参数；指定加密的私钥加密密码",
					"type": "string"
				},
				"project": {
					"description": "项目名称",
					"type": "string",
					"default": "common"
				}
			}
		}
	}
}