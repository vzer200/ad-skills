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
		"/api/ad/v3/sys/snmp/": {
			"description": "新建、查看SNMP（V1/V2C）配置",
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
					"snmp"
				],
				"summary": "get all snmp",
				"description": "查看已有的SNMP（V1/V2C）配置",
				"operationId": "get_snmp_list",
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
						"$ref": "#/responses/operation_config_snmp_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all snmp",
						"description": "查看已有的SNMP（V1/V2C）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/snmp/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/snmp/ 响应",
						"description": "返回GET /api/ad/v3/sys/snmp/的响应数据",
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
									"name": "snmp3_admin",
									"description": "example_string",
									"state": "ENABLE",
									"community": "public",
									"pk_community": "A1B2C3D4",
									"encrypted_community": "A1B2C3D4",
									"privileges": "GET",
									"permit_source_address": {
										"type": "ALL",
										"addresses": [
											"200.200.0.123/24"
										]
									}
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"snmp"
				],
				"summary": "create new snmp",
				"description": "新建SNMP（V1/V2C）配置",
				"operationId": "add_snmp_list",
				"parameters": [
					{
						"$ref": "#/parameters/SNMP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmp_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new snmp",
						"description": "新建SNMP（V1/V2C）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/snmp/",
							"body": {
								"name": "AI_snmp3_admin_A",
								"state": "ENABLE",
								"privileges": "GET"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/snmp/ 响应",
						"description": "返回POST /api/ad/v3/sys/snmp/的响应数据",
						"value": {
							"name": "AI_snmp3_admin_A",
							"description": "example_string",
							"state": "ENABLE",
							"community": "public",
							"pk_community": "A1B2C3D4",
							"encrypted_community": "A1B2C3D4",
							"privileges": "GET",
							"permit_source_address": {
								"type": "ALL",
								"addresses": [
									"200.200.0.123/24"
								]
							}
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys snmp snmp_example description snmp_example_config community public state enable permit_source_address { type ip-address addresses [ 1.1.1.1 1::1 2.2.2.0/24 ] }",
					"description": "新建SNMP（V1/V2C），状态为启用，共同体为public，允许访问的源ip有：1.1.1.1、1::1、2.2.2.0/24"
				},
				{
					"command": "list sys snmp snmp_example",
					"description": "查看snmp_example的配置信息"
				},
				{
					"command": "modify sys snmp snmp_example permit_source_address { addresses delete [ 1.1.1.1 ] }",
					"description": "修改SNMP（V1/V2C），删除允许访问的源ip：1.1.1.1"
				},
				{
					"command": "delete sys snmp snmp_example",
					"description": "删除SNMP配置snmp_example"
				}
			]
		},
		"/api/ad/v3/sys/snmp/{name}": {
			"description": "新建、查看、修改、删除指定的SNMP（V1/V2C）配置",
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
					"snmp"
				],
				"summary": "get specific snmp",
				"description": "查看指定的SNMP（V1/V2C）配置",
				"operationId": "get_snmp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmp_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific snmp",
						"description": "查看指定的SNMP（V1/V2C）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/snmp/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/snmp/{name} 响应",
						"description": "返回GET /api/ad/v3/sys/snmp/{name}的响应数据",
						"value": {
							"name": "snmp3_admin",
							"description": "example_string",
							"state": "ENABLE",
							"community": "public",
							"pk_community": "A1B2C3D4",
							"encrypted_community": "A1B2C3D4",
							"privileges": "GET",
							"permit_source_address": {
								"type": "ALL",
								"addresses": [
									"200.200.0.123/24"
								]
							}
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"snmp"
				],
				"summary": "create new snmp",
				"description": "新建指定的SNMP（V1/V2C）配置",
				"operationId": "create_snmp",
				"parameters": [
					{
						"$ref": "#/parameters/SNMP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmp_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new snmp",
						"description": "新建指定的SNMP（V1/V2C）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/snmp/{name}",
							"body": {
								"name": "AI_snmp3_admin_B",
								"state": "ENABLE",
								"privileges": "GET"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/snmp/{name} 响应",
						"description": "返回POST /api/ad/v3/sys/snmp/{name}的响应数据",
						"value": {
							"name": "AI_snmp3_admin_B",
							"description": "example_string",
							"state": "ENABLE",
							"community": "public",
							"pk_community": "A1B2C3D4",
							"encrypted_community": "A1B2C3D4",
							"privileges": "GET",
							"permit_source_address": {
								"type": "ALL",
								"addresses": [
									"200.200.0.123/24"
								]
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"snmp"
				],
				"summary": "replace specific snmp",
				"description": "修改指定的SNMP（V1/V2C）配置",
				"operationId": "replace_snmp",
				"parameters": [
					{
						"$ref": "#/parameters/SNMP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmp_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific snmp",
						"description": "修改指定的SNMP（V1/V2C）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/snmp/{name}",
							"body": {
								"name": "snmp3_admin",
								"state": "ENABLE",
								"privileges": "GET"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/snmp/{name} 响应",
						"description": "返回PUT /api/ad/v3/sys/snmp/{name}的响应数据",
						"value": {
							"name": "snmp3_admin",
							"description": "example_string",
							"state": "ENABLE",
							"community": "public",
							"pk_community": "A1B2C3D4",
							"encrypted_community": "A1B2C3D4",
							"privileges": "GET",
							"permit_source_address": {
								"type": "ALL",
								"addresses": [
									"200.200.0.123/24"
								]
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"snmp"
				],
				"summary": "modify specific snmp",
				"description": "修改指定的SNMP（V1/V2C）配置",
				"operationId": "edit_snmp",
				"parameters": [
					{
						"$ref": "#/parameters/SNMP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmp_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific snmp",
						"description": "修改指定的SNMP（V1/V2C）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/snmp/{name}",
							"body": {
								"name": "snmp3_admin",
								"state": "ENABLE",
								"privileges": "GET"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/snmp/{name} 响应",
						"description": "返回PATCH /api/ad/v3/sys/snmp/{name}的响应数据",
						"value": {
							"name": "snmp3_admin",
							"description": "example_string",
							"state": "ENABLE",
							"community": "public",
							"pk_community": "A1B2C3D4",
							"encrypted_community": "A1B2C3D4",
							"privileges": "GET",
							"permit_source_address": {
								"type": "ALL",
								"addresses": [
									"200.200.0.123/24"
								]
							}
						}
					}
				}
			},
			"delete": {
				"tags": [
					"snmp"
				],
				"summary": "delete specific snmp",
				"description": "删除指定的SNMP（V1/V2C）配置",
				"operationId": "delete_snmp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snmp_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific snmp",
						"description": "删除指定的SNMP（V1/V2C）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/sys/snmp/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/sys/snmp/{name} 响应",
						"description": "返回DELETE /api/ad/v3/sys/snmp/{name}的响应数据",
						"value": {
							"name": "snmp3_admin",
							"description": "example_string",
							"state": "ENABLE",
							"community": "public",
							"pk_community": "A1B2C3D4",
							"encrypted_community": "A1B2C3D4",
							"privileges": "GET",
							"permit_source_address": {
								"type": "ALL",
								"addresses": [
									"200.200.0.123/24"
								]
							}
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SNMP-CONFIG": {
			"name": "SNMP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.snmp"
			}
		},
		"SNMP-PROPERTY": {
			"name": "SNMP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.snmp"
			}
		}
	},
	"responses": {
		"operation_config_snmp_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snmp_list"
			}
		},
		"operation_config_snmp_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snmp"
			}
		}
	},
	"definitions": {
		"config.snmp_list": {
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
						"$ref": "#/definitions/config.snmp"
					}
				}
			}
		},
		"config.snmp": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定SNMP（V1/V2C）配置的名称，在配置中必须唯一",
					"type": "string",
					"example": "snmp3_admin"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用于对此配置增加备注"
				},
				"state": {
					"description": "可选参数；启禁用配置，enable表示启用，disable表示禁用，默认为enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"community": {
					"description": "可选参数；SNMP共同体，默认为public",
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
				},
				"privileges": {
					"description": "可选参数；SNMP访问权限，默认为GET",
					"type": "string",
					"enum": [
						"GET"
					],
					"default": "GET",
					"example": "GET"
				},
				"permit_source_address": {
					"description": "可选参数；允许访问SNMP的源IP",
					"type": "object",
					"required": [],
					"properties": {
						"type": {
							"description": "可选参数；允许访问SNMP的源IP配置类型，all表示所有IP，ip-address表示指定IP，默认为all",
							"type": "string",
							"enum": [
								"ALL",
								"IP-ADDRESS"
							],
							"default": "ALL",
							"example": "ALL"
						},
						"addresses": {
							"description": "可选参数；允许访问的SNMP的源IP列表，当允许访问的源IP类型选择ip-address的时候此项需要配置，可填具体IP或者子网",
							"type": "array",
							"items": {
								"description": "来源",
								"type": "string",
								"example": "200.200.0.123/24"
							},
							"maxItems": 200
						}
					}
				}
			}
		}
	}
}