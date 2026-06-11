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
		"/api/ad/v3/rc/data-group/": {
			"description": "数据组配置相关操作",
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
					"data-group"
				],
				"summary": "get all data-group",
				"description": "获取数据组配置",
				"operationId": "get_data_group_list",
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
						"$ref": "#/responses/operation_config_data_group_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all data-group",
						"description": "获取数据组配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/data-group/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/data-group/ 响应",
						"description": "返回GET /api/ad/v3/rc/data-group/的响应数据",
						"value": {
							"maximum_items": 500,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "data_group",
									"description": "example_string",
									"type": "DG_STRING",
									"data": [
										{
											"key": "example_string",
											"value": "example_string"
										}
									]
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"data-group"
				],
				"summary": "create new data-group",
				"description": "新建数据组配置",
				"operationId": "add_data_group_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new data-group",
						"description": "新建数据组配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/data-group/",
							"body": {
								"name": "AI_data_group_A",
								"type": "DG_STRING"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/data-group/ 响应",
						"description": "返回POST /api/ad/v3/rc/data-group/的响应数据",
						"value": {
							"name": "AI_data_group_A",
							"description": "example_string",
							"type": "DG_STRING",
							"data": [
								{
									"key": "example_string",
									"value": "example_string"
								}
							]
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"data-group"
				],
				"summary": "modify data-group",
				"description": "修改数据组配置",
				"operationId": "edit_data_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_group_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify data-group",
						"description": "修改数据组配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/data-group/",
							"body": {
								"name": "data_group",
								"type": "DG_STRING"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/data-group/ 响应",
						"description": "返回PATCH /api/ad/v3/rc/data-group/的响应数据",
						"value": {
							"maximum_items": 500,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "data_group",
									"description": "example_string",
									"type": "DG_STRING",
									"data": [
										{
											"key": "example_string",
											"value": "example_string"
										}
									]
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create rc data-group dg_name type dg_string data [ { key \"k1\" value \"v1\"} { key \"k2\" } ]",
					"description": "新建名字为dg_name，类型为字符串，包含两条数据k1->v1和k2的数据组。"
				},
				{
					"command": "modify rc data-group dg_name type dg_string data [ { key k1 } { key k2 value v2 } ]",
					"description": "修改数据组dg_name的数据为k1和k2->v2"
				},
				{
					"command": "delete rc data-group dg_name",
					"description": "删除名字叫dg_name的数据组"
				},
				{
					"command": "list rc data-group dg_name",
					"description": "查看数据组dg_name的内容"
				}
			]
		},
		"/api/ad/v3/rc/data-group/{name}": {
			"description": "数据组配置相关配置",
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
					"data-group"
				],
				"summary": "get specific data-group",
				"description": "获取数据组配置",
				"operationId": "get_data_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific data-group",
						"description": "获取数据组配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/data-group/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/data-group/{name} 响应",
						"description": "返回GET /api/ad/v3/rc/data-group/{name}的响应数据",
						"value": {
							"name": "data_group",
							"description": "example_string",
							"type": "DG_STRING",
							"data": [
								{
									"key": "example_string",
									"value": "example_string"
								}
							]
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"data-group"
				],
				"summary": "create new isp-address-group",
				"description": "新建数据组配置",
				"operationId": "create_data_group",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new isp-address-group",
						"description": "新建数据组配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/data-group/{name}",
							"body": {
								"name": "AI_data_group_B",
								"type": "DG_STRING"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/data-group/{name} 响应",
						"description": "返回POST /api/ad/v3/rc/data-group/{name}的响应数据",
						"value": {
							"name": "AI_data_group_B",
							"description": "example_string",
							"type": "DG_STRING",
							"data": [
								{
									"key": "example_string",
									"value": "example_string"
								}
							]
						}
					}
				}
			},
			"put": {
				"tags": [
					"data-group"
				],
				"summary": "replace specific data-group",
				"description": "修改数据组配置",
				"operationId": "replace_data_group",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific data-group",
						"description": "修改数据组配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/rc/data-group/{name}",
							"body": {
								"name": "data_group",
								"type": "DG_STRING"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/rc/data-group/{name} 响应",
						"description": "返回PUT /api/ad/v3/rc/data-group/{name}的响应数据",
						"value": {
							"name": "data_group",
							"description": "example_string",
							"type": "DG_STRING",
							"data": [
								{
									"key": "example_string",
									"value": "example_string"
								}
							]
						}
					}
				}
			},
			"patch": {
				"tags": [
					"data-group"
				],
				"summary": "modify specific data-group",
				"description": "修改数据组配置",
				"operationId": "edit_data_group",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific data-group",
						"description": "修改数据组配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/data-group/{name}",
							"body": {
								"name": "data_group",
								"type": "DG_STRING"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/data-group/{name} 响应",
						"description": "返回PATCH /api/ad/v3/rc/data-group/{name}的响应数据",
						"value": {
							"name": "data_group",
							"description": "example_string",
							"type": "DG_STRING",
							"data": [
								{
									"key": "example_string",
									"value": "example_string"
								}
							]
						}
					}
				}
			},
			"delete": {
				"tags": [
					"data-group"
				],
				"summary": "delete specific data-group",
				"description": "删除数据组配置",
				"operationId": "delete_data_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific data-group",
						"description": "删除数据组配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/rc/data-group/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/rc/data-group/{name} 响应",
						"description": "返回DELETE /api/ad/v3/rc/data-group/{name}的响应数据",
						"value": {
							"name": "data_group",
							"description": "example_string",
							"type": "DG_STRING",
							"data": [
								{
									"key": "example_string",
									"value": "example_string"
								}
							]
						}
					}
				}
			}
		}
	},
	"parameters": {
		"DATA-GROUP-CONFIG": {
			"name": "DATA-GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.data_group"
			}
		},
		"DATA-GROUP-PROPERTY": {
			"name": "DATA-GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.data_group"
			}
		}
	},
	"responses": {
		"operation_config_data_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.data_group_list"
			}
		},
		"operation_config_data_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.data_group"
			}
		}
	},
	"definitions": {
		"config.data_group_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "配置数量上限",
					"type": "integer",
					"example": 500
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
						"$ref": "#/definitions/config.data_group"
					}
				}
			}
		},
		"config.data_group": {
			"type": "object",
			"required": [
				"name",
				"type"
			],
			"properties": {
				"name": {
					"description": "自定义数据组",
					"example": "data_group",
					"primaryKey": true,
					"type": "string"
				},
				"description": {
					"description": "描述信息",
					"type": "string"
				},
				"type": {
					"default": "DG_STRING",
					"description": "key类型",
					"enum": [
						"DG_STRING",
						"DG_INTEGER",
						"DG_ADDRESS"
					],
					"example": "DG_STRING",
					"type": "string"
				},
				"data": {
					"description": "数据",
					"items": {
						"description": "数据组条目",
						"properties": {
							"key": {
								"description": "键",
								"maxLength": 65535,
								"type": "string"
							},
							"value": {
								"description": "值",
								"maxLength": 65535,
								"type": "string"
							}
						},
						"required": [
							"key"
						],
						"type": "object"
					},
					"maxItems": 500,
					"minItems": 0,
					"type": "array"
				}
			}
		}
	}
}