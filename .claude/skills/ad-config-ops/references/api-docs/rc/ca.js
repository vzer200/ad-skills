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
		"/api/ad/v3/rc/ca/": {
			"description": "ca证书配置相关操作",
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
					"ca"
				],
				"summary": "get all ca",
				"description": "获取ca证书配置",
				"operationId": "get_ca_list",
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
						"$ref": "#/responses/operation_config_ca_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all ca",
						"description": "获取ca证书配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/ca/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/ca/ 响应",
						"description": "返回GET /api/ad/v3/rc/ca/的响应数据",
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
									"certificate_chains": [
										"example_item"
									]
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"ca"
				],
				"summary": "create new ca",
				"description": "新建ca证书配置",
				"operationId": "add_ca_list",
				"parameters": [
					{
						"$ref": "#/parameters/CA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ca_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new ca",
						"description": "新建ca证书配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/ca/",
							"body": {
								"name": "AI_www.abc.com_cert_A",
								"certificate_chains": [
									"example_item"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/ca/ 响应",
						"description": "返回POST /api/ad/v3/rc/ca/的响应数据",
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
									"certificate_chains": [
										"example_item"
									]
								}
							]
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"ca"
				],
				"summary": "modify ca",
				"description": "修改ca证书配置",
				"operationId": "edit_ca_list",
				"parameters": [
					{
						"$ref": "#/parameters/CA-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ca_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify ca",
						"description": "修改ca证书配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/ca/",
							"body": {
								"name": "www.abc.com_cert",
								"certificate_chains": [
									"example_item"
								]
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/ca/ 响应",
						"description": "返回PATCH /api/ad/v3/rc/ca/的响应数据",
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
									"certificate_chains": [
										"example_item"
									]
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create  rc ca ca1  certificate_chains [ { certificate_token \"cert_1563415899.949823/ca1/ca1.crt\" }  ]",
					"description": "新建ca证书ca1，引用证书cert_1563415899.949823/ca1/ca1.crt。"
				},
				{
					"command": "modify rc ca ca1 name ca2  description test certificate_chains [ { certificate_token \"cert_1563362733.5795884/ca2/ca2.crt\" } ]",
					"description": "修改ca证书ca1名称为ca2，引用证书cert_1563362733.5795884/ca2/ca2.crt"
				},
				{
					"command": "delete rc ca ca1",
					"description": "删除ca证书ca1"
				},
				{
					"command": "list rc ca ca1",
					"description": "查看ca证书ca1"
				}
			]
		},
		"/api/ad/v3/rc/ca/{name}": {
			"description": "ca证书配置相关配置",
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
					"ca"
				],
				"summary": "get specific ca",
				"description": "获取ca证书配置",
				"operationId": "get_ca",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ca_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific ca",
						"description": "获取ca证书配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/ca/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/ca/{name} 响应",
						"description": "返回GET /api/ad/v3/rc/ca/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"certificate_chains": [
								"example_item"
							]
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ca"
				],
				"summary": "create new ca",
				"description": "新建ca证书配置",
				"operationId": "create_ca",
				"parameters": [
					{
						"$ref": "#/parameters/CA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ca_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new ca",
						"description": "新建ca证书配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/ca/{name}",
							"body": {
								"name": "AI_www.abc.com_cert_B",
								"certificate_chains": [
									"example_item"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/ca/{name} 响应",
						"description": "返回POST /api/ad/v3/rc/ca/{name}的响应数据",
						"value": {
							"name": "AI_www.abc.com_cert_B",
							"description": "example_string",
							"certificate_chains": [
								"example_item"
							]
						}
					}
				}
			},
			"put": {
				"tags": [
					"ca"
				],
				"summary": "replace specific ca",
				"description": "修改ca证书配置",
				"operationId": "replace_ca",
				"parameters": [
					{
						"$ref": "#/parameters/CA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ca_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific ca",
						"description": "修改ca证书配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/rc/ca/{name}",
							"body": {
								"name": "www.abc.com_cert",
								"certificate_chains": [
									"example_item"
								]
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/rc/ca/{name} 响应",
						"description": "返回PUT /api/ad/v3/rc/ca/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"certificate_chains": [
								"example_item"
							]
						}
					}
				}
			},
			"patch": {
				"tags": [
					"ca"
				],
				"summary": "modify specific ca",
				"description": "修改ca证书配置",
				"operationId": "edit_ca",
				"parameters": [
					{
						"$ref": "#/parameters/CA-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ca_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific ca",
						"description": "修改ca证书配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/ca/{name}",
							"body": {
								"name": "www.abc.com_cert",
								"certificate_chains": [
									"example_item"
								]
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/ca/{name} 响应",
						"description": "返回PATCH /api/ad/v3/rc/ca/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"certificate_chains": [
								"example_item"
							]
						}
					}
				}
			},
			"delete": {
				"tags": [
					"ca"
				],
				"summary": "delete specific ca",
				"description": "删除ca证书配置",
				"operationId": "delete_ca",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ca_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific ca",
						"description": "删除ca证书配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/rc/ca/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/rc/ca/{name} 响应",
						"description": "返回DELETE /api/ad/v3/rc/ca/{name}的响应数据",
						"value": {
							"name": "www.abc.com_cert",
							"description": "example_string",
							"certificate_chains": [
								"example_item"
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/rc/ca/{name}/certificate": {
			"description": "导出CA证书",
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
					"ca"
				],
				"summary": "export specific ca certificate file",
				"description": "导出CA证书",
				"operationId": "export_ca_certificate_file",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				},
				"x-examples": {
					"request": {
						"summary": "export specific ca certificate file",
						"description": "导出CA证书",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/ca/{name}/certificate"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/ca/{name}/certificate 响应",
						"description": "返回GET /api/ad/v3/rc/ca/{name}/certificate的响应数据",
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
		"CA-CONFIG": {
			"name": "CA-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ca"
			}
		},
		"CA-PROPERTY": {
			"name": "CA-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ca"
			}
		}
	},
	"responses": {
		"operation_config_ca_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ca_list"
			}
		},
		"operation_config_ca_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ca_view"
			}
		}
	},
	"definitions": {
		"config.ca_list": {
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
						"$ref": "#/definitions/config.ca_view"
					}
				}
			}
		},
		"config.ca": {
			"type": "object",
			"required": [
				"name",
				"certificate_chains"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定ca证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_cert",
					"maxLength": 80,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"certificate_chains": {
					"type": "array",
					"description": "必选参数；指定引用ca证书文件的路径。",
					"items": {
						"description": "证书信息",
						"$ref": "/api/{common}.yaml#/definitions/config.certificate_fingerprint_with_token"
					},
					"minItems": 1,
					"maxItems": 256
				}
			}
		},
		"config.ca_view": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定ca证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_cert"
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"certificate_chains": {
					"type": "array",
					"description": "指定引用ca证书文件的路径。",
					"readOnly": true,
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.certificate_detail_with_token"
					}
				}
			}
		}
	}
}