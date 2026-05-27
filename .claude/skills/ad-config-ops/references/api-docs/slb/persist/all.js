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
		"/api/ad/v3/slb/persist/all/": {
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
					"persist"
				],
				"summary": "get all persist",
				"description": "",
				"operationId": "get_persist_list",
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
						"$ref": "#/responses/operation_config_persist_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all persist",
						"description": "GET /api/ad/v3/slb/persist/all/",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/persist/all/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/persist/all/ 响应",
						"description": "返回GET /api/ad/v3/slb/persist/all/的响应数据",
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
									"name": "cookie_passive",
									"description": "",
									"type": "COOKIE-STUDY",
									"source_ipv4_netmask_length": 32,
									"source_ipv6_prefix_length": 128,
									"cookie": "sangfor_ad",
									"domain": "",
									"path": "/",
									"http_only": "DISABLE",
									"secure": "DISABLE",
									"component": "URI",
									"header": "cookie",
									"keyword": "JSESSION",
									"offset": 9,
									"terminator": ";",
									"request_seek_rules": [
										{
											"component": "URI",
											"header": "cookie",
											"keyword": "JSESSION",
											"offset": 9,
											"terminator": ";"
										}
									],
									"response_study_rules": [
										{
											"component": "HEADER",
											"header": "cookie",
											"keyword": "JSESSION",
											"offset": 9,
											"terminator": ";"
										}
									],
									"radius_attribute_id": 1,
									"timeout": 86400,
									"busy_protect": "DISABLE",
									"record_scope": "POOL",
									"session_persist_synchronize": "ENABLE",
									"netns": "default"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/persist/all/{name}": {
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
					"persist"
				],
				"summary": "get specific persist",
				"description": "",
				"operationId": "get_persist",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific persist",
						"description": "GET /api/ad/v3/slb/persist/all/{name}",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/persist/all/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/persist/all/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/persist/all/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "COOKIE-STUDY",
							"source_ipv4_netmask_length": 32,
							"source_ipv6_prefix_length": 128,
							"cookie": "sangfor_ad",
							"domain": "",
							"path": "/",
							"http_only": "DISABLE",
							"secure": "DISABLE",
							"component": "URI",
							"header": "cookie",
							"keyword": "JSESSION",
							"offset": 9,
							"terminator": ";",
							"request_seek_rules": [
								{
									"component": "URI",
									"header": "cookie",
									"keyword": "JSESSION",
									"offset": 9,
									"terminator": ";"
								}
							],
							"response_study_rules": [
								{
									"component": "HEADER",
									"header": "cookie",
									"keyword": "JSESSION",
									"offset": 9,
									"terminator": ";"
								}
							],
							"radius_attribute_id": 1,
							"timeout": 86400,
							"busy_protect": "DISABLE",
							"record_scope": "POOL",
							"session_persist_synchronize": "ENABLE",
							"netns": "default"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"PERSIST-ALL-CONFIG": {
			"name": "PERSIST-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.persist"
			}
		},
		"PERSIST-ALL-PROPERTY": {
			"name": "PERSIST-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.persist"
			}
		}
	},
	"responses": {
		"operation_config_persist_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_list"
			}
		},
		"operation_config_persist_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist"
			}
		}
	},
	"definitions": {
		"config.persist_list": {
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
						"$ref": "#/definitions/config.persist"
					}
				}
			}
		},
		"config.persist": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "cookie_passive"
				},
				"description": {
					"type": "string",
					"example": ""
				},
				"type": {
					"type": "string",
					"enum": [
						"SOURCE-IP",
						"COOKIE-INSERT",
						"COOKIE-STUDY",
						"COOKIE-REWRITE",
						"HTTP-REQUEST-STUDY",
						"HTTP-RESPONSE-STUDY",
						"RADIUS",
						"SSL-SESSIONID"
					],
					"default": "COOKIE-STUDY"
				},
				"source_ipv4_netmask_length": {
					"type": "integer",
					"default": 32,
					"example": 24
				},
				"source_ipv6_prefix_length": {
					"type": "integer",
					"default": 128,
					"example": 64
				},
				"cookie": {
					"type": "string",
					"example": "sangfor_ad"
				},
				"domain": {
					"type": "string",
					"example": ""
				},
				"path": {
					"type": "string",
					"default": "/",
					"example": "/"
				},
				"http_only": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"secure": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"component": {
					"type": "string",
					"enum": [
						"URI",
						"HEADER",
						"BODY"
					]
				},
				"header": {
					"type": "string",
					"example": "cookie"
				},
				"keyword": {
					"type": "string",
					"example": "JSESSION"
				},
				"offset": {
					"type": "integer",
					"description": "Start from the first char of keyword.",
					"example": 9
				},
				"terminator": {
					"type": "string",
					"example": ";"
				},
				"request_seek_rules": {
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"component": {
								"type": "string",
								"enum": [
									"URI",
									"HEADER",
									"BODY"
								]
							},
							"header": {
								"type": "string",
								"example": "cookie"
							},
							"keyword": {
								"type": "string",
								"example": "JSESSION"
							},
							"offset": {
								"type": "integer",
								"description": "Start from the first char of keyword.",
								"example": 9
							},
							"terminator": {
								"type": "string",
								"example": ";"
							}
						}
					}
				},
				"response_study_rules": {
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"component": {
								"type": "string",
								"enum": [
									"HEADER",
									"BODY"
								]
							},
							"header": {
								"type": "string",
								"example": "cookie"
							},
							"keyword": {
								"type": "string",
								"example": "JSESSION"
							},
							"offset": {
								"type": "integer",
								"description": "Start from the first char of keyword.",
								"example": 9
							},
							"terminator": {
								"type": "string",
								"example": ";"
							}
						}
					}
				},
				"radius_attribute_id": {
					"type": "integer",
					"default": 1,
					"example": 1
				},
				"timeout": {
					"type": "integer",
					"default": 86400,
					"example": 86400
				},
				"busy_protect": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"record_scope": {
					"type": "string",
					"enum": [
						"POOL",
						"VIP",
						"GLOBAL"
					],
					"default": "POOL",
					"example": "POOL"
				},
				"session_persist_synchronize": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"netns": {
					"type": "string",
					"default": "default"
				}
			}
		}
	}
}