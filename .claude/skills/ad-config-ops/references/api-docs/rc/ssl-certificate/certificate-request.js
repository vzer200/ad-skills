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
		"/api/ad/v3/rc/ssl-certificate/certificate-request/": {
			"description": "证书请求相关操作",
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
				"summary": "get all ssl-certificate-certificate-request",
				"description": "获取证书请求",
				"operationId": "get_ssl_certificate_certificate_request_list",
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
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_list"
					}
				}
			},
			"post": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "create new ssl-certificate-certificate-request",
				"description": "新建证书请求",
				"operationId": "add_ssl_certificate_certificate_request_list",
				"parameters": [
					{
						"$ref": "#/parameters/CERTIFICATE-REQUEST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"ssl-certificate"
				],
				"summary": "modify ssl-certificate-certificate-request",
				"description": "修改证书请求",
				"operationId": "edit_ssl_certificate_certificate_request_list",
				"parameters": [
					{
						"$ref": "#/parameters/CERTIFICATE-REQUEST-PROPERTY-MODIFY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create  rc ssl-certificate certificate-request ssl1 type certificate-request public_key_algorithm rsa public_key_length 2048 signature_algorithm sha256 subject { cn 34 c DD ou CC o DASD l DSA st SAD }  password  admin",
					"description": "新建证书请求ssl证书ssl1"
				},
				{
					"command": "modify rc ssl-certificate certificate-request ssl1 name ssl2",
					"description": "修改证书请求ssl证书ssl1名称为ssl2"
				},
				{
					"command": "delete rc ssl-certificate certificate-request ssl1",
					"description": "删除证书请求ssl证书ssl1"
				},
				{
					"command": "list rc ssl-certificate certificate-request ssl1",
					"description": "查看证书请求ssl证书ssl1"
				}
			]
		},
		"/api/ad/v3/rc/ssl-certificate/certificate-request/{name}": {
			"description": "证书请求相关操作",
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
				"summary": "get specific ssl-certificate-certificate-request",
				"description": "获取证书请求",
				"operationId": "get_ssl_certificate_certificate_request",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ssl-certificate"
				],
				"summary": "create new ssl-certificate-certificate-request",
				"description": "新建证书请求",
				"operationId": "create_ssl_certificate_certificate_request",
				"parameters": [
					{
						"$ref": "#/parameters/CERTIFICATE-REQUEST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_object"
					}
				}
			},
			"put": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "replace specific ssl-certificate-certificate-request",
				"description": "修改证书请求",
				"operationId": "replace_ssl_certificate_certificate_request",
				"parameters": [
					{
						"$ref": "#/parameters/CERTIFICATE-REQUEST-CONFIG-MODIFY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "modify specific ssl-certificate-certificate-request",
				"description": "修改证书请求",
				"operationId": "edit_ssl_certificate_certificate_request",
				"parameters": [
					{
						"$ref": "#/parameters/CERTIFICATE-REQUEST-PROPERTY-MODIFY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_object"
					}
				}
			},
			"delete": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "delete specific ssl-certificate-certificate-request",
				"description": "删除证书请求",
				"operationId": "delete_ssl_certificate_certificate_request",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_certificate_request_object"
					}
				}
			}
		},
		"/api/ad/v3/rc/ssl-certificate/certificate-request/{name}/request": {
			"description": "导出证书请求",
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
				"summary": "export specific ssl-certificate-certificate-request file",
				"description": "导出证书请求",
				"operationId": "export_ssl_certificate_certificate_request_file",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				}
			}
		},
		"/api/ad/v3/rc/ssl-certificate/certificate-request/{name}/certificate": {
			"description": "证书请求对应证书相关操作",
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
				"summary": "export specific ssl-certificate-certificate-request certificate file",
				"description": "获取证书请求对应证书",
				"operationId": "export_specific_ssl_certificate_certificate_request_certificate_file",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				}
			},
			"post": {
				"tags": [
					"ssl-certificate"
				],
				"summary": "additional ssl-certificate-certificate-request certificate",
				"description": "从证书请求新建证书",
				"operationId": "additional_ssl_certificate_certificate_request_certificate",
				"parameters": [
					{
						"$ref": "#/parameters/CERTIFICATE-REQUEST-IMPORT"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/rc/ssl-certificate/imported-certificate.yaml#/responses/operation_config_ssl_certificate_imported_certificate_object"
					}
				}
			}
		}
	},
	"parameters": {
		"CERTIFICATE-REQUEST-CONFIG": {
			"name": "CERTIFICATE-REQUEST-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_certificate_request_post"
			}
		},
		"CERTIFICATE-REQUEST-CONFIG-MODIFY": {
			"name": "CERTIFICATE-REQUEST-CONFIG-MODIFY",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_certificate_request_modify"
			}
		},
		"CERTIFICATE-REQUEST-PROPERTY-MODIFY": {
			"name": "CERTIFICATE-REQUEST-PROPERTY-MODIFY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_certificate_request_modify"
			}
		},
		"CERTIFICATE-REQUEST-IMPORT": {
			"name": "CERTIFICATE-REQUEST-CONFIG-IMPORT",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_certificate_request_import"
			}
		}
	},
	"responses": {
		"operation_config_ssl_certificate_certificate_request_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_certificate_request_list"
			}
		},
		"operation_config_ssl_certificate_certificate_request_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_certificate_request"
			}
		}
	},
	"definitions": {
		"config.ssl_certificate_certificate_request_list": {
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
						"$ref": "#/definitions/config.ssl_certificate_certificate_request"
					}
				}
			}
		},
		"config.ssl_certificate_certificate_request_post": {
			"type": "object",
			"required": [
				"name",
				"subject"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定ssl证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_cert",
					"maxLength": 80,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"type": {
					"type": "string",
					"description": "可选参数；指定ssl证书类型。",
					"enum": [
						"CERTIFICATE-REQUEST",
						"COMPLETE-CERTIFICATE"
					],
					"default": "CERTIFICATE-REQUEST",
					"example": "CERTIFICATE-REQUEST"
				},
				"subject": {
					"type": "object",
					"description": "可选参数；指定ssl证书信息。",
					"required": [
						"cn"
					],
					"properties": {
						"cn": {
							"type": "string",
							"description": "必选参数；指定通用名称。",
							"minLength": 1,
							"maxLength": 63
						},
						"c": {
							"type": "string",
							"description": "可选参数；指定国家。"
						},
						"ou": {
							"type": "string",
							"description": "可选参数；指定部门。",
							"minLength": 1,
							"maxLength": 63
						},
						"o": {
							"type": "string",
							"description": "可选参数；指定公司/机构。",
							"minLength": 1,
							"maxLength": 63
						},
						"l": {
							"type": "string",
							"description": "可选参数；指定城市。",
							"minLength": 1,
							"maxLength": 63
						},
						"st": {
							"type": "string",
							"description": "可选参数；指定省份。",
							"minLength": 1,
							"maxLength": 63
						},
						"email": {
							"type": "string",
							"description": "必选参数；指定email地址。"
						},
						"ou_list": {
							"type": "array",
							"description": "ou列表",
							"items": {
								"description": "请输入部门字段",
								"type": "string",
								"minLength": 1,
								"maxLength": 63
							},
							"maxItems": 4
						}
					}
				},
				"san_extensions": {
					"type": "array",
					"description": "SAN扩展",
					"items": {
						"description": "子结构",
						"$ref": "/api/{common}.yaml#/definitions/config.san_extensions"
					},
					"maxItems": 16
				},
				"public_key_algorithm": {
					"type": "string",
					"description": "可选参数；指定公钥类型。",
					"enum": [
						"RSA",
						"ECDSA",
						"SM2",
						"SM2-CFCA"
					],
					"default": "RSA"
				},
				"public_key_length": {
					"type": "integer",
					"description": "可选参数；指定秘钥长度。",
					"enum": [
						256,
						384,
						521,
						1024,
						2048,
						3072,
						4096
					],
					"default": 2048
				},
				"signature_algorithm": {
					"type": "string",
					"description": "可选参数；指定签名算法。",
					"enum": [
						"SHA256",
						"SHA1",
						"SM3",
						"SHA384",
						"SHA512"
					],
					"default": "SHA256"
				},
				"validity_time_year": {
					"type": "integer",
					"enum": [
						1,
						2,
						3,
						4,
						5,
						10,
						20
					],
					"description": "证书有效时间",
					"default": 5
				},
				"password": {
					"type": "string",
					"description": "可选参数；指定私钥密码。",
					"writeOnly": true
				},
				"pk_password": {
					"description": "可选参数；指定加密密码",
					"type": "string",
					"writeOnly": true
				},
				"encrypted_password": {
					"type": "string",
					"description": "可选参数；指定加密密码。"
				},
				"import_cert_type": {
					"description": "导入证书方式",
					"type": "string",
					"enum": [
						"SM2_SINGLE_CERT",
						"SM2_DOUBLE_CERT",
						"SM2_SCEP"
					],
					"default": "SM2_SINGLE_CERT",
					"example": "SM2_SINGLE_CERT"
				},
				"project": {
					"description": "项目名称",
					"type": "string",
					"maxLength": 511,
					"minLength": 1
				},
				"scep_ca": {
					"description": "scep_ca",
					"type": "object",
					"properties": {
						"ip": {
							"description": "地址",
							"type": "string",
							"example": "10.8.55.1"
						},
						"port": {
							"description": "端口",
							"type": "integer",
							"maximum": 65535,
							"minimum": 0,
							"default": 0,
							"example": 80
						}
					}
				}
			}
		},
		"config.ssl_certificate_certificate_request": {
			"type": "object",
			"required": [
				"name",
				"subject"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定ssl证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_cert",
					"maxLength": 80,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"type": {
					"type": "string",
					"description": "可选参数；指定ssl证书类型。",
					"enum": [
						"CERTIFICATE-REQUEST",
						"COMPLETE-CERTIFICATE"
					],
					"default": "CERTIFICATE-REQUEST",
					"example": "CERTIFICATE-REQUEST"
				},
				"subject": {
					"type": "object",
					"description": "必选参数；指定ssl证书信息。",
					"required": [
						"cn"
					],
					"properties": {
						"cn": {
							"type": "string",
							"description": "必选参数；指定通用名称。",
							"minLength": 1,
							"maxLength": 63
						},
						"c": {
							"type": "string",
							"description": "可选参数；指定国家。"
						},
						"ou": {
							"type": "string",
							"description": "可选参数；指定部门。",
							"minLength": 1,
							"maxLength": 63
						},
						"o": {
							"type": "string",
							"description": "可选参数；指定公司/机构。",
							"minLength": 1,
							"maxLength": 63
						},
						"l": {
							"type": "string",
							"description": "可选参数；指定城市。",
							"minLength": 1,
							"maxLength": 63
						},
						"st": {
							"type": "string",
							"description": "可选参数；指定省份。",
							"minLength": 1,
							"maxLength": 63
						},
						"email": {
							"type": "string",
							"description": "可选参数；指定email地址。"
						}
					}
				},
				"public_key_algorithm": {
					"type": "string",
					"description": "可选参数；指定公钥类型。",
					"enum": [
						"RSA",
						"ECDSA",
						"SM2",
						"SM2-CFCA"
					],
					"default": "RSA"
				},
				"public_key_length": {
					"type": "integer",
					"description": "可选参数；指定秘钥长度。",
					"enum": [
						256,
						384,
						1024,
						2048,
						4096
					],
					"default": 2048
				},
				"signature_algorithm": {
					"type": "string",
					"description": "可选参数；指定签名算法。",
					"enum": [
						"SHA256",
						"SHA1"
					],
					"default": "SHA256"
				},
				"validity_time_year": {
					"type": "integer",
					"enum": [
						1,
						2,
						3,
						4,
						5,
						10,
						20
					],
					"description": "证书有效时间",
					"default": 5
				},
				"password": {
					"type": "string",
					"description": "可选参数；指定私钥密码。",
					"writeOnly": true
				},
				"pk_password": {
					"description": "可选参数；指定加密密码",
					"type": "string",
					"writeOnly": true
				},
				"encrypted_password": {
					"type": "string",
					"description": "可选参数；指定加密密码。"
				},
				"certificate_request_pem": {
					"description": "可选参数；pem格式的证书请求。",
					"type": "string",
					"readOnly": true
				},
				"certificate_chains": {
					"type": "array",
					"description": "可选参数；指定证书链。",
					"readOnly": true,
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.certificate_detail"
					}
				},
				"project": {
					"description": "项目名称",
					"type": "string",
					"default": "common",
					"maxLength": 511,
					"minLength": 1
				}
			}
		},
		"config.ssl_certificate_certificate_request_import": {
			"type": "object",
			"required": [
				"certificate_chains"
			],
			"properties": {
				"certificate_chains": {
					"description": "证书链",
					"type": "array",
					"items": {
						"description": "证书信息",
						"type": "object",
						"required": [
							"certificate_token"
						],
						"properties": {
							"certificate_md5": {
								"description": "证书标识-MD5",
								"type": "string"
							},
							"certificate_token": {
								"description": "证书文件资源令牌",
								"type": "string"
							}
						}
					},
					"minItems": 0,
					"maxItems": 32
				},
				"name": {
					"description": "证书名字",
					"type": "string"
				}
			}
		},
		"config.ssl_certificate_certificate_request_modify": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "可选参数；指定ssl证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_cert",
					"maxLength": 80,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				}
			}
		}
	}
}