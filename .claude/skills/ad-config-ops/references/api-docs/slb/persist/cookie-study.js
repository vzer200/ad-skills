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
		"/api/ad/v3/slb/persist/cookie-study/": {
			"description": "新建、查看会话保持（被动cookie）配置",
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
				"summary": "get all persist-cookie-study",
				"description": "查看已有会话保持（被动cookie）配置信息列表",
				"operationId": "get_persist_cookie_study_list",
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
						"$ref": "#/responses/operation_config_persist_cookie_study_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all persist-cookie-study",
						"description": "查看已有会话保持（被动cookie）配置信息列表",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/persist/cookie-study/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/persist/cookie-study/ 响应",
						"description": "返回GET /api/ad/v3/slb/persist/cookie-study/的响应数据",
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
									"cookie": "sangfor_ad",
									"secure": "DISABLE",
									"cookie_encryption": {
										"state": "DISABLE",
										"accept_plaintext": "ENABLE",
										"password": "abcd1234",
										"pk_password": "A1B2C3D4",
										"encrypted_password": "A1B2C3D4"
									},
									"session_persist_synchronize": "ENABLE",
									"timeout": 180,
									"busy_protect": "ENABLE",
									"record_scope": "POOL"
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
				"summary": "create new persist-cookie-study",
				"description": "新建会话保持（被动cookie）配置",
				"operationId": "add_persist_cookie_study_list",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-STUDY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_study_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new persist-cookie-study",
						"description": "新建会话保持（被动cookie）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/persist/cookie-study/",
							"body": {
								"name": "AI_cookie_passive_cookie_study_A",
								"type": "COOKIE-STUDY",
								"cookie": "sangfor_ad",
								"secure": "DISABLE",
								"session_persist_synchronize": "ENABLE",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/persist/cookie-study/ 响应",
						"description": "返回POST /api/ad/v3/slb/persist/cookie-study/的响应数据",
						"value": {
							"name": "AI_cookie_passive_cookie_study_A",
							"description": "",
							"type": "COOKIE-STUDY",
							"cookie": "sangfor_ad",
							"secure": "DISABLE",
							"cookie_encryption": {
								"state": "DISABLE",
								"accept_plaintext": "ENABLE",
								"password": "abcd1234",
								"pk_password": "A1B2C3D4",
								"encrypted_password": "A1B2C3D4"
							},
							"session_persist_synchronize": "ENABLE",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb persist cookie-study cookitest cookie abcdefg record_scope global cookie_encryption { state enable password 123456 accept_plaintext enable } busy_protect enable",
					"description": "新建被动cookie会话保持,Cookie名称为abcdefg,记录范围为全局,同时启用cookie加密,兼容明文cookie"
				},
				{
					"command": "modify slb persist cookie-study cookitest record_scope pool",
					"description": "修改会话保持的记录范围为pool"
				},
				{
					"command": "list slb persist cookie-study cookitest",
					"description": "查看会话保持cookitest的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/persist/cookie-study/{name}": {
			"description": "查看、新建、修改、删除会话保持（被动cookie）配置",
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
				"summary": "get specific persist-cookie-study",
				"description": "查看指定会话保持（被动cookie）配置",
				"operationId": "get_persist_cookie_study",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_study_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific persist-cookie-study",
						"description": "查看指定会话保持（被动cookie）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/persist/cookie-study/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/persist/cookie-study/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/persist/cookie-study/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "COOKIE-STUDY",
							"cookie": "sangfor_ad",
							"secure": "DISABLE",
							"cookie_encryption": {
								"state": "DISABLE",
								"accept_plaintext": "ENABLE",
								"password": "abcd1234",
								"pk_password": "A1B2C3D4",
								"encrypted_password": "A1B2C3D4"
							},
							"session_persist_synchronize": "ENABLE",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"persist"
				],
				"summary": "create new persist-cookie-study",
				"description": "新建会话保持（被动cookie）配置",
				"operationId": "create_persist_cookie_study",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-STUDY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_study_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new persist-cookie-study",
						"description": "新建会话保持（被动cookie）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/persist/cookie-study/{name}",
							"body": {
								"name": "AI_cookie_passive_cookie_study_B",
								"type": "COOKIE-STUDY",
								"cookie": "sangfor_ad",
								"secure": "DISABLE",
								"session_persist_synchronize": "ENABLE",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/persist/cookie-study/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/persist/cookie-study/{name}的响应数据",
						"value": {
							"name": "AI_cookie_passive_cookie_study_B",
							"description": "",
							"type": "COOKIE-STUDY",
							"cookie": "sangfor_ad",
							"secure": "DISABLE",
							"cookie_encryption": {
								"state": "DISABLE",
								"accept_plaintext": "ENABLE",
								"password": "abcd1234",
								"pk_password": "A1B2C3D4",
								"encrypted_password": "A1B2C3D4"
							},
							"session_persist_synchronize": "ENABLE",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL"
						}
					}
				}
			},
			"put": {
				"tags": [
					"persist"
				],
				"summary": "replace specific persist-cookie-study",
				"description": "修改指定会话保持（被动cookie）配置",
				"operationId": "replace_persist_cookie_study",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-STUDY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_study_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific persist-cookie-study",
						"description": "修改指定会话保持（被动cookie）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/persist/cookie-study/{name}",
							"body": {
								"name": "cookie_passive",
								"type": "COOKIE-STUDY",
								"cookie": "sangfor_ad",
								"secure": "DISABLE",
								"session_persist_synchronize": "ENABLE",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/persist/cookie-study/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/persist/cookie-study/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "COOKIE-STUDY",
							"cookie": "sangfor_ad",
							"secure": "DISABLE",
							"cookie_encryption": {
								"state": "DISABLE",
								"accept_plaintext": "ENABLE",
								"password": "abcd1234",
								"pk_password": "A1B2C3D4",
								"encrypted_password": "A1B2C3D4"
							},
							"session_persist_synchronize": "ENABLE",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"persist"
				],
				"summary": "modify specific persist-cookie-study",
				"description": "修改指定会话保持（被动cookie）配置",
				"operationId": "edit_persist_cookie_study",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-COOKIE-STUDY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_study_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific persist-cookie-study",
						"description": "修改指定会话保持（被动cookie）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/persist/cookie-study/{name}",
							"body": {
								"name": "cookie_passive",
								"type": "COOKIE-STUDY",
								"cookie": "sangfor_ad",
								"secure": "DISABLE",
								"session_persist_synchronize": "ENABLE",
								"timeout": 180,
								"busy_protect": "ENABLE",
								"record_scope": "POOL"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/persist/cookie-study/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/persist/cookie-study/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "COOKIE-STUDY",
							"cookie": "sangfor_ad",
							"secure": "DISABLE",
							"cookie_encryption": {
								"state": "DISABLE",
								"accept_plaintext": "ENABLE",
								"password": "abcd1234",
								"pk_password": "A1B2C3D4",
								"encrypted_password": "A1B2C3D4"
							},
							"session_persist_synchronize": "ENABLE",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"persist"
				],
				"summary": "delete specific persist-cookie-study",
				"description": "删除指定会话保持（被动cookie）配置",
				"operationId": "delete_persist_cookie_study",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_cookie_study_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific persist-cookie-study",
						"description": "删除指定会话保持（被动cookie）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/persist/cookie-study/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/persist/cookie-study/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/persist/cookie-study/{name}的响应数据",
						"value": {
							"name": "cookie_passive",
							"description": "",
							"type": "COOKIE-STUDY",
							"cookie": "sangfor_ad",
							"secure": "DISABLE",
							"cookie_encryption": {
								"state": "DISABLE",
								"accept_plaintext": "ENABLE",
								"password": "abcd1234",
								"pk_password": "A1B2C3D4",
								"encrypted_password": "A1B2C3D4"
							},
							"session_persist_synchronize": "ENABLE",
							"timeout": 180,
							"busy_protect": "ENABLE",
							"record_scope": "POOL"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"PERSIST-COOKIE-STUDY-CONFIG": {
			"name": "PERSIST-COOKIE-STUDY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_study"
			}
		},
		"PERSIST-COOKIE-STUDY-PROPERTY": {
			"name": "PERSIST-COOKIE-STUDY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_study"
			}
		}
	},
	"responses": {
		"operation_config_persist_cookie_study_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_study_list"
			}
		},
		"operation_config_persist_cookie_study_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_cookie_study"
			}
		}
	},
	"definitions": {
		"config.persist_cookie_study_list": {
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
						"$ref": "#/definitions/config.persist_cookie_study"
					}
				}
			}
		},
		"config.persist_cookie_study": {
			"type": "object",
			"required": [
				"name",
				"cookie"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定会话保持的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "cookie_passive"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。",
					"example": ""
				},
				"type": {
					"description": "只读字段;指定会话保持的类型",
					"type": "string",
					"enum": [
						"COOKIE-STUDY"
					],
					"default": "COOKIE-STUDY"
				},
				"cookie": {
					"description": "可选参数;指定待学习的cookie名称",
					"type": "string",
					"maxLength": 31,
					"minLength": 1,
					"example": "sangfor_ad"
				},
				"secure": {
					"description": "安全属性",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"cookie_encryption": {
					"description": "可选参数；指定cookie加密的配置:state表示启用禁用开关,accept_plaintext表示兼容明文,password表示加密密码,默认不启用",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；指定cookie加密的开关，disable表示禁用，enable表示启用；默认禁用。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"accept_plaintext": {
							"description": "可选参数;指定是否兼容明文cookie,disable表示禁用，enable表示启用；默认启用。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"password": {
							"description": "可选参数;指定cookie加密密码",
							"type": "string",
							"maxLength": 64,
							"minLength": 8,
							"example": "abcd1234"
						},
						"pk_password": {
							"description": "加密密码，可写(控制台)",
							"type": "string",
							"maxLength": 1024,
							"minLength": 1,
							"example": "A1B2C3D4"
						},
						"encrypted_password": {
							"description": "可选参数;指定已加密的cookie加密密码",
							"type": "string",
							"maxLength": 1024,
							"minLength": 1,
							"example": "A1B2C3D4"
						}
					}
				},
				"session_persist_synchronize": {
					"description": "会话保持同步",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"timeout": {
					"description": "可选参数；设置会话保持超时时间。取值范围为[0,31536000],默认为180",
					"type": "integer",
					"default": 180,
					"maximum": 31536000,
					"minimum": 0,
					"example": 86400
				},
				"busy_protect": {
					"description": "可选参数；指定繁忙保护的开关，disable表示禁用，enable表示启用；默认启用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"record_scope": {
					"description": "可选参数;指定会话保持的作用范围,pool表示在池内生效,vip表示访问相同vip均生效,global表示全局生效,默认为pool",
					"type": "string",
					"enum": [
						"POOL",
						"VIP",
						"GLOBAL"
					],
					"default": "POOL",
					"example": "POOL"
				}
			}
		}
	}
}