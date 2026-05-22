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
		"/api/ad/v3/rc/ssl-certificate/all/": {
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
				"summary": "get all ssl-certificate-all",
				"description": "",
				"operationId": "get_ssl_certificate_all_list",
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
						"$ref": "#/responses/operation_config_ssl_certificate_all_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list rc ssl-certificate all",
					"description": "查看ssl证书列表"
				},
				{
					"command": "list rc ssl-certificate all [ name ]",
					"description": "筛选查看ssl证书名称"
				},
				{
					"command": "list rc ssl-certificate all ssl1",
					"description": "查看ssl证书ssl1信息"
				}
			]
		},
		"/api/ad/v3/rc/ssl-certificate/all/{name}": {
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
				"summary": "get specific ssl-certificate-all",
				"description": "",
				"operationId": "get_ssl_certificate_all",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssl_certificate_all_object"
					}
				}
			}
		},
		"/api/ad/v3/rc/ssl-certificate/all/{name}/request": {
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
				"summary": "export specific ssl-certificate-all file",
				"description": "",
				"operationId": "export_ssl_certificate_all_file",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				}
			}
		},
		"/api/ad/v3/rc/ssl-certificate/all/{name}/certificate/": {
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
				"summary": "export specific ssl-certificate-all certificate file",
				"description": "",
				"operationId": "export_specific_ssl_certificate_all_certificate_file",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				}
			}
		}
	},
	"parameters": {
		"SSL-CERTIFICATE-ALL-CONFIG": {
			"name": "SSL-CERTIFICATE-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_all"
			}
		},
		"SSL-CERTIFICATE-ALL-PROPERTY": {
			"name": "SSL-CERTIFICATE-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_all"
			}
		},
		"cn": {
			"name": "cn",
			"in": "path",
			"required": true,
			"type": "string"
		}
	},
	"responses": {
		"operation_config_ssl_certificate_all_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_all_list"
			}
		},
		"operation_config_ssl_certificate_all_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssl_certificate_all"
			}
		}
	},
	"definitions": {
		"config.ssl_certificate_all_list": {
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
						"$ref": "#/definitions/config.ssl_certificate_all"
					}
				}
			}
		},
		"config.ssl_certificate_all": {
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
					"enum": [
						"SELF-SIGNED",
						"IMPORTED-CERTIFICATE",
						"COMPLETE-CERTIFICATE",
						"CERTIFICATE-REQUEST"
					],
					"example": "CERTIFICATE-REQUEST"
				},
				"subject": {
					"type": "object",
					"description": "可选参数；指定ssl证书详细信息。",
					"required": [
						"cn",
						"c",
						"ou",
						"o",
						"l",
						"st"
					],
					"properties": {
						"cn": {
							"type": "string",
							"description": "必选参数；指定通用名称。"
						},
						"c": {
							"type": "string",
							"description": "必选参数；指定国家。"
						},
						"ou": {
							"type": "string",
							"description": "必选参数；指定部门。"
						},
						"o": {
							"type": "string",
							"description": "必选参数；指定公司/机构。"
						},
						"l": {
							"type": "string",
							"description": "必选参数；指定城市。"
						},
						"st": {
							"type": "string",
							"description": "必选参数；指定省份。"
						},
						"email": {
							"type": "string",
							"description": "必选参数；指定email地址。"
						}
					}
				},
				"public_key_algorithm": {
					"type": "string",
					"description": "可选参数；指定公钥类型。",
					"enum": [
						"RSA",
						"ECDSA"
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
					"default": "2048"
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
				"validity_not_before": {
					"type": "string",
					"description": "可选参数；指定证书有效起开始时间。",
					"readOnly": true
				},
				"validity_not_after": {
					"type": "string",
					"description": "可选参数；指定证书有效起结束时间。",
					"readOnly": true
				},
				"password": {
					"type": "string",
					"description": "可选参数；指定私钥加密密码。",
					"writeOnly": true
				},
				"encrypted_password": {
					"type": "string",
					"description": "可选参数；确认密码。"
				},
				"certificate_chains": {
					"type": "array",
					"description": "可选参数；指定证书链。",
					"readOnly": true,
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.certificate_detail"
					}
				},
				"certificate_request_pem": {
					"type": "string",
					"readOnly": true
				},
				"project": {
					"type": "string",
					"default": "common"
				}
			}
		}
	}
}