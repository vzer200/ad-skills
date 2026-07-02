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
		"/api/ad/v3/sys/host/": {
			"description": "新建、查看HOSTS配置",
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
					"host"
				],
				"summary": "get all host",
				"description": "查看已有的HOSTS配置",
				"operationId": "get_host_list",
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
						"$ref": "#/responses/operation_config_host_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all host",
						"description": "查看已有的HOSTS配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/host/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/host/ 响应",
						"description": "返回GET /api/ad/v3/sys/host/的响应数据",
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
									"name": "localhost",
									"default": "NON-DEFAULT",
									"addresses": [
										"127.0.0.1"
									]
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"host"
				],
				"summary": "create new host",
				"description": "新建HOSTS配置",
				"operationId": "add_host_list",
				"parameters": [
					{
						"$ref": "#/parameters/HOST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_host_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new host",
						"description": "新建HOSTS配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/host/",
							"body": {
								"name": "AI_localhost_A",
								"default": "NON-DEFAULT",
								"addresses": [
									"127.0.0.1"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/host/ 响应",
						"description": "返回POST /api/ad/v3/sys/host/的响应数据",
						"value": {
							"name": "AI_localhost_A",
							"default": "NON-DEFAULT",
							"addresses": [
								"127.0.0.1"
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys host test addresses add [ 1.1.1.1 ]",
					"description": "新建一个主机名为test，ip地址为1.1.1.1的HOSTS配置"
				},
				{
					"command": "modify sys host test addresses [ 2.2.2.2 ]",
					"description": "修改test的HOSTS配置的ip地址为2.2.2.2"
				},
				{
					"command": "list sys host",
					"description": "查看当前HOSTS配置信息"
				}
			]
		},
		"/api/ad/v3/sys/host/{name}": {
			"description": "新建、查看、修改、删除指定的HOSTS配置",
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
					"host"
				],
				"summary": "get specific host",
				"description": "查看指定的HOSTS配置",
				"operationId": "get_host",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_host_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific host",
						"description": "查看指定的HOSTS配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/host/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/host/{name} 响应",
						"description": "返回GET /api/ad/v3/sys/host/{name}的响应数据",
						"value": {
							"name": "localhost",
							"default": "NON-DEFAULT",
							"addresses": [
								"127.0.0.1"
							]
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"host"
				],
				"summary": "create new host",
				"description": "新建指定的HOSTS配置",
				"operationId": "create_host",
				"parameters": [
					{
						"$ref": "#/parameters/HOST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_host_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new host",
						"description": "新建指定的HOSTS配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/host/{name}",
							"body": {
								"name": "AI_localhost_B",
								"default": "NON-DEFAULT",
								"addresses": [
									"127.0.0.1"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/host/{name} 响应",
						"description": "返回POST /api/ad/v3/sys/host/{name}的响应数据",
						"value": {
							"name": "AI_localhost_B",
							"default": "NON-DEFAULT",
							"addresses": [
								"127.0.0.1"
							]
						}
					}
				}
			},
			"put": {
				"tags": [
					"host"
				],
				"summary": "replace specific host",
				"description": "修改指定的HOSTS配置",
				"operationId": "replace_host",
				"parameters": [
					{
						"$ref": "#/parameters/HOST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_host_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific host",
						"description": "修改指定的HOSTS配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/host/{name}",
							"body": {
								"name": "localhost",
								"default": "NON-DEFAULT",
								"addresses": [
									"127.0.0.1"
								]
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/host/{name} 响应",
						"description": "返回PUT /api/ad/v3/sys/host/{name}的响应数据",
						"value": {
							"name": "localhost",
							"default": "NON-DEFAULT",
							"addresses": [
								"127.0.0.1"
							]
						}
					}
				}
			},
			"patch": {
				"tags": [
					"host"
				],
				"summary": "modify specific host",
				"description": "修改指定的HOSTS配置",
				"operationId": "edit_host",
				"parameters": [
					{
						"$ref": "#/parameters/HOST-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_host_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific host",
						"description": "修改指定的HOSTS配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/host/{name}",
							"body": {
								"name": "localhost",
								"default": "NON-DEFAULT",
								"addresses": [
									"127.0.0.1"
								]
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/host/{name} 响应",
						"description": "返回PATCH /api/ad/v3/sys/host/{name}的响应数据",
						"value": {
							"name": "localhost",
							"default": "NON-DEFAULT",
							"addresses": [
								"127.0.0.1"
							]
						}
					}
				}
			},
			"delete": {
				"tags": [
					"host"
				],
				"summary": "delete specific host",
				"description": "删除指定的HOSTS配置",
				"operationId": "delete_host",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_host_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific host",
						"description": "删除指定的HOSTS配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/sys/host/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/sys/host/{name} 响应",
						"description": "返回DELETE /api/ad/v3/sys/host/{name}的响应数据",
						"value": {
							"name": "localhost",
							"default": "NON-DEFAULT",
							"addresses": [
								"127.0.0.1"
							]
						}
					}
				}
			}
		}
	},
	"parameters": {
		"HOST-CONFIG": {
			"name": "HOST-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.host"
			}
		},
		"HOST-PROPERTY": {
			"name": "HOST-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.host"
			}
		}
	},
	"responses": {
		"operation_config_host_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.host_list"
			}
		},
		"operation_config_host_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.host"
			}
		}
	},
	"definitions": {
		"config.host_list": {
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
						"$ref": "#/definitions/config.host"
					}
				}
			}
		},
		"config.host": {
			"type": "object",
			"required": [
				"name",
				"addresses"
			],
			"properties": {
				"name": {
					"description": "host名称",
					"type": "string",
					"example": "localhost"
				},
				"default": {
					"type": "string",
					"description": "只读参数；默认属性",
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				},
				"addresses": {
					"description": "host对应IP",
					"type": "array",
					"items": {
						"type": "string"
					},
					"example": [
						"127.0.0.1",
						"::1"
					]
				}
			}
		}
	}
}