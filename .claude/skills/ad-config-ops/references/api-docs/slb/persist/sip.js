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
		"/api/ad/v3/slb/persist/sip/": {
			"description": "新建、查看会话保持（SIP）配置",
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
				"summary": "get all persist-sip",
				"description": "查看已有会话保持（SIP）配置信息列表",
				"operationId": "get_persist_sip_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_config_persist_sip_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all persist-sip",
						"description": "查看已有会话保持（SIP）配置信息列表",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/persist/sip/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/persist/sip/ 响应",
						"description": "返回GET /api/ad/v3/slb/persist/sip/的响应数据",
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
									"type": "SIP",
									"method": "CALL-ID",
									"timeout": 180,
									"busy_protect": "ENABLE",
									"record_scope": "POOL",
									"session_persist_synchronize": "ENABLE"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"persist"
				],
				"summary": "create new persist-sip",
				"description": "新建会话保持（SIP）配置",
				"operationId": "add_persist_sip_list",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new persist-sip",
						"description": "新建会话保持（SIP）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/persist/sip/",
							"body": {
								"name": "AI_cookie_passive_sip_A",
								"type": "SIP",
								"method": "CALL-ID",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL",
								"session_persist_synchronize": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/persist/sip/ 响应",
						"description": "返回POST /api/ad/v3/slb/persist/sip/的响应数据",
						"value": {
							"name": "AI_cookie_passive_sip_A",
							"description": "",
							"type": "SIP",
							"method": "CALL-ID",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL",
							"session_persist_synchronize": "ENABLE"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb persist sip testsip method call-id record_scope global busy_protect enable",
					"description": "新建sip会话保持testsip,模式为call-id,作用域为全局,启用繁忙保护"
				},
				{
					"command": "modify slb persist sip testsip name testsip1",
					"description": "修改testsip会话保持的名称为testsip1"
				},
				{
					"command": "list slb persist sip testsip",
					"description": "查看会话保持testsip的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/persist/sip/{name}": {
			"description": "查看、新建、修改、删除会话保持（SIP）配置",
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
				"summary": "get specific persist-sip",
				"description": "查看指定会话保持（SIP）配置",
				"operationId": "get_persist_sip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific persist-sip",
						"description": "查看指定会话保持（SIP）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/persist/sip/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/persist/sip/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/persist/sip/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "SIP",
							"method": "CALL-ID",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL",
							"session_persist_synchronize": "ENABLE"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"persist"
				],
				"summary": "create new persist-sip",
				"description": "新建会话保持（SIP）配置",
				"operationId": "create_persist_sip",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new persist-sip",
						"description": "新建会话保持（SIP）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/persist/sip/{name}",
							"body": {
								"name": "AI_cookie_passive_sip_B",
								"type": "SIP",
								"method": "CALL-ID",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL",
								"session_persist_synchronize": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/persist/sip/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/persist/sip/{name}的响应数据",
						"value": {
							"name": "AI_cookie_passive_sip_B",
							"description": "",
							"type": "SIP",
							"method": "CALL-ID",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL",
							"session_persist_synchronize": "ENABLE"
						}
					}
				}
			},
			"put": {
				"tags": [
					"persist"
				],
				"summary": "replace specific persist-sip",
				"description": "修改指定会话保持（SIP）配置",
				"operationId": "replace_persist_sip",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific persist-sip",
						"description": "修改指定会话保持（SIP）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/persist/sip/{name}",
							"body": {
								"name": "cookie_passive",
								"type": "SIP",
								"method": "CALL-ID",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL",
								"session_persist_synchronize": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/persist/sip/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/persist/sip/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "SIP",
							"method": "CALL-ID",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL",
							"session_persist_synchronize": "ENABLE"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"persist"
				],
				"summary": "modify specific persist-sip",
				"description": "修改指定会话保持（SIP）配置",
				"operationId": "edit_persist_sip",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SIP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific persist-sip",
						"description": "修改指定会话保持（SIP）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/persist/sip/{name}",
							"body": {
								"name": "cookie_passive",
								"type": "SIP",
								"method": "CALL-ID",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL",
								"session_persist_synchronize": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/persist/sip/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/persist/sip/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "SIP",
							"method": "CALL-ID",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL",
							"session_persist_synchronize": "ENABLE"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"persist"
				],
				"summary": "delete specific persist-sip",
				"description": "删除指定会话保持（SIP）配置",
				"operationId": "delete_persist_sip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_sip_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific persist-sip",
						"description": "删除指定会话保持（SIP）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/persist/sip/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/persist/sip/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/persist/sip/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "SIP",
							"method": "CALL-ID",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL",
							"session_persist_synchronize": "ENABLE"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"PERSIST-SIP-CONFIG": {
			"name": "PERSIST-SIP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.persist_sip"
			}
		},
		"PERSIST-SIP-PROPERTY": {
			"name": "PERSIST-SIP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.persist_sip"
			}
		}
	},
	"responses": {
		"operation_config_persist_sip_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_sip_list"
			}
		},
		"operation_config_persist_sip_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_sip"
			}
		}
	},
	"definitions": {
		"config.persist_sip_list": {
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
						"$ref": "#/definitions/config.persist_sip"
					}
				}
			}
		},
		"config.persist_sip": {
			"type": "object",
			"required": [
				"name",
				"method"
			],
			"properties": {
				"name": {
					"description": "会话保持名称",
					"type": "string",
					"example": "cookie_passive"
				},
				"description": {
					"type": "string",
					"example": "",
					"description": "可选参数；用于对此配置增加备注"
				},
				"type": {
					"description": "类型",
					"type": "string",
					"enum": [
						"SIP"
					],
					"default": "SIP"
				},
				"method": {
					"description": "类型",
					"type": "string",
					"enum": [
						"CALL-ID"
					],
					"default": "CALL-ID"
				},
				"timeout": {
					"description": "超时时间，单位为秒",
					"type": "integer",
					"default": 180,
					"maximum": 31536000,
					"minimum": 0,
					"example": 86400
				},
				"busy_protect": {
					"description": "繁忙保护",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"record_scope": {
					"description": "记录范围",
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
					"description": "可选参数；双机或集群模式下，指定会话保持同步的开关，disable表示禁用，enable表示启用；默认启用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				}
			}
		}
	}
}