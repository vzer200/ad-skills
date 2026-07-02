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
		"/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/": {
			"description": "DNSSEC密钥配置管理操作",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"dnssec-key"
				],
				"summary": "get all dnssec-key",
				"description": "查看DNSSEC密钥配置",
				"operationId": "get_dnssec_key_list",
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
						"$ref": "#/responses/operation_config_dnssec_key_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all dnssec-key",
						"description": "查看DNSSEC密钥配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/ 响应",
						"description": "返回GET /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/的响应数据",
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
									"name": "dnssec_key_1",
									"description": "example_string",
									"key_type": "ZONE-SIGNING-KEY",
									"algorithm": "RSA/SHA1",
									"bit_width": 1024,
									"ttl": 86400
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "",
					"description": ""
				}
			],
			"post": {
				"tags": [
					"dnssec-key"
				],
				"summary": "create new dnssec-key",
				"description": "创建一个DNSSEC密钥配置",
				"operationId": "add_dnssec_key_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNSSEC-KEY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnssec_key_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new dnssec-key",
						"description": "创建一个DNSSEC密钥配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/",
							"body": {
								"name": "AI_dnssec_key_1_A",
								"key_type": "ZONE-SIGNING-KEY",
								"algorithm": "RSA/SHA1",
								"bit_width": 1024,
								"ttl": 86400
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/ 响应",
						"description": "返回POST /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/的响应数据",
						"value": {
							"name": "AI_dnssec_key_1_A",
							"description": "example_string",
							"key_type": "ZONE-SIGNING-KEY",
							"algorithm": "RSA/SHA1",
							"bit_width": 1024,
							"ttl": 86400
						}
					}
				}
			}
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}": {
			"description": "DNSSEC密钥配置管理操作",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"dnssec-key"
				],
				"summary": "get specific dnssec-key",
				"description": "查看指定的DNSSEC密钥配置",
				"operationId": "get_dnssec_key",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnssec_key_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific dnssec-key",
						"description": "查看指定的DNSSEC密钥配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name} 响应",
						"description": "返回GET /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}的响应数据",
						"value": {
							"name": "dnssec_key_1",
							"description": "example_string",
							"key_type": "ZONE-SIGNING-KEY",
							"algorithm": "RSA/SHA1",
							"bit_width": 1024,
							"ttl": 86400
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dnssec-key"
				],
				"summary": "create new dnssec-key",
				"description": "创建一个DNSSEC密钥",
				"operationId": "create_dnssec_key",
				"parameters": [
					{
						"$ref": "#/parameters/DNSSEC-KEY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnssec_key_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new dnssec-key",
						"description": "创建一个DNSSEC密钥",
						"value": {
							"method": "POST",
							"path": "/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}",
							"body": {
								"name": "AI_dnssec_key_1_B",
								"key_type": "ZONE-SIGNING-KEY",
								"algorithm": "RSA/SHA1",
								"bit_width": 1024,
								"ttl": 86400
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name} 响应",
						"description": "返回POST /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}的响应数据",
						"value": {
							"name": "AI_dnssec_key_1_B",
							"description": "example_string",
							"key_type": "ZONE-SIGNING-KEY",
							"algorithm": "RSA/SHA1",
							"bit_width": 1024,
							"ttl": 86400
						}
					}
				}
			},
			"put": {
				"tags": [
					"dnssec-key"
				],
				"summary": "replace specific dnssec-key",
				"description": "修改指定的DNSSEC密钥",
				"operationId": "replace_dnssec_key",
				"parameters": [
					{
						"$ref": "#/parameters/DNSSEC-KEY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnssec_key_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific dnssec-key",
						"description": "修改指定的DNSSEC密钥",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}",
							"body": {
								"name": "dnssec_key_1",
								"key_type": "ZONE-SIGNING-KEY",
								"algorithm": "RSA/SHA1",
								"bit_width": 1024,
								"ttl": 86400
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name} 响应",
						"description": "返回PUT /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}的响应数据",
						"value": {
							"name": "dnssec_key_1",
							"description": "example_string",
							"key_type": "ZONE-SIGNING-KEY",
							"algorithm": "RSA/SHA1",
							"bit_width": 1024,
							"ttl": 86400
						}
					}
				}
			},
			"patch": {
				"tags": [
					"dnssec-key"
				],
				"summary": "modify specific dnssec-key",
				"description": "增量修改指定的DNSSEC密钥",
				"operationId": "edit_dnssec_key",
				"parameters": [
					{
						"$ref": "#/parameters/DNSSEC-KEY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnssec_key_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific dnssec-key",
						"description": "增量修改指定的DNSSEC密钥",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}",
							"body": {
								"name": "dnssec_key_1",
								"key_type": "ZONE-SIGNING-KEY",
								"algorithm": "RSA/SHA1",
								"bit_width": 1024,
								"ttl": 86400
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name} 响应",
						"description": "返回PATCH /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}的响应数据",
						"value": {
							"name": "dnssec_key_1",
							"description": "example_string",
							"key_type": "ZONE-SIGNING-KEY",
							"algorithm": "RSA/SHA1",
							"bit_width": 1024,
							"ttl": 86400
						}
					}
				}
			},
			"delete": {
				"tags": [
					"dnssec-key"
				],
				"summary": "delete specific dnssec-key",
				"description": "删除指定的DNSSEC密钥",
				"operationId": "delete_dnssec_key",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnssec_key_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific dnssec-key",
						"description": "删除指定的DNSSEC密钥",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name} 响应",
						"description": "返回DELETE /api/ad/v4/dns/zone/{dns_config_area}/dnssec-key/{name}的响应数据",
						"value": {
							"name": "dnssec_key_1",
							"description": "example_string",
							"key_type": "ZONE-SIGNING-KEY",
							"algorithm": "RSA/SHA1",
							"bit_width": 1024,
							"ttl": 86400
						}
					}
				}
			}
		}
	},
	"parameters": {
		"DNSSEC-KEY-CONFIG": {
			"name": "DNSSEC-KEY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dnssec_key"
			}
		},
		"DNSSEC-KEY-PROPERTY": {
			"name": "DNSSEC-KEY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dnssec_key"
			}
		},
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "全局和本地区域",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_config_dnssec_key_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dnssec_key_list"
			}
		},
		"operation_config_dnssec_key_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dnssec_key"
			}
		}
	},
	"definitions": {
		"config.dnssec_key_list": {
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
						"$ref": "#/definitions/config.dnssec_key"
					}
				}
			}
		},
		"config.dnssec_key": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定DNSSEC密钥的名称, 在配置中必须唯一。[1,63]最大63个英文字符,禁忌空白/逗号/引号/单引号",
					"example": "dnssec_key_1"
				},
				"description": {
					"type": "string",
					"description": "配置描述信息。[1,63]最大63个英文字符，禁忌空白/逗号/引号/单引号"
				},
				"key_type": {
					"type": "string",
					"description": "密钥类型，默认类型为ZSK密钥。",
					"enum": [
						"ZONE-SIGNING-KEY",
						"KEY-SIGNING-KEY"
					],
					"default": "ZONE-SIGNING-KEY",
					"example": "ZONE-SIGNING-KEY"
				},
				"algorithm": {
					"type": "string",
					"description": "加密算法，默认RSA/SHA1。",
					"enum": [
						"RSA/SHA1",
						"RSA/SHA256",
						"RSA/SHA512"
					],
					"default": "RSA/SHA1",
					"example": "RSA/SHA1"
				},
				"bit_width": {
					"type": "integer",
					"description": "密钥位宽设置，默认1024。可选值为1024,2048,4096",
					"enum": [
						1024,
						2048,
						4096
					],
					"default": 1024,
					"example": 1024
				},
				"ttl": {
					"type": "integer",
					"description": "ttl取值范围为[0,86400]，单位秒",
					"default": 86400,
					"example": 86400,
					"minimum": 0,
					"maximum": 86400
				}
			}
		}
	}
}