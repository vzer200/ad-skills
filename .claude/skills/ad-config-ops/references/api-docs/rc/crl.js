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
		"/api/ad/v3/rc/crl/": {
			"description": "crl证书配置相关操作",
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
					"crl"
				],
				"summary": "get all crl",
				"description": "获取crl证书配置",
				"operationId": "get_crl_list",
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
						"$ref": "#/responses/operation_config_crl_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all crl",
						"description": "获取crl证书配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/crl/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/crl/ 响应",
						"description": "返回GET /api/ad/v3/rc/crl/的响应数据",
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
									"name": "www.abc.com_crl",
									"description": "example_string",
									"method": "FILE",
									"file_token": "example_string",
									"url": "http://",
									"username": "example_string",
									"password": "example_string",
									"pk_password": "A1B2C3D4",
									"encrypted_password": "A1B2C3D4",
									"timeout": 10,
									"interval": 21600,
									"retry_times": 3,
									"network": "AUTO"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"crl"
				],
				"summary": "create new crl",
				"description": "新建crl证书配置",
				"operationId": "add_crl_list",
				"parameters": [
					{
						"$ref": "#/parameters/CRL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_crl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new crl",
						"description": "新建crl证书配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/crl/",
							"body": {
								"name": "AI_www.abc.com_crl_A",
								"method": "FILE",
								"url": "http://",
								"timeout": 10,
								"interval": 21600,
								"retry_times": 3,
								"network": "AUTO"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/crl/ 响应",
						"description": "返回POST /api/ad/v3/rc/crl/的响应数据",
						"value": {
							"name": "AI_www.abc.com_crl_A",
							"description": "example_string",
							"method": "FILE",
							"file_token": "example_string",
							"url": "http://",
							"username": "example_string",
							"password": "example_string",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"timeout": 10,
							"interval": 21600,
							"retry_times": 3,
							"network": "AUTO"
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"crl"
				],
				"summary": "modify crl",
				"description": "修改crl证书配置",
				"operationId": "edit_crl_list",
				"parameters": [
					{
						"$ref": "#/parameters/CRL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_crl_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify crl",
						"description": "修改crl证书配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/crl/",
							"body": {
								"name": "www.abc.com_crl",
								"method": "FILE",
								"url": "http://",
								"timeout": 10,
								"interval": 21600,
								"retry_times": 3,
								"network": "AUTO"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/crl/ 响应",
						"description": "返回PATCH /api/ad/v3/rc/crl/的响应数据",
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
									"name": "www.abc.com_crl",
									"description": "example_string",
									"method": "FILE",
									"file_token": "example_string",
									"url": "http://",
									"username": "example_string",
									"password": "example_string",
									"pk_password": "A1B2C3D4",
									"encrypted_password": "A1B2C3D4",
									"timeout": 10,
									"interval": 21600,
									"retry_times": 3,
									"network": "AUTO"
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create  rc crl  crl1 url \"http://www.baidu.com\" timeout 10 interval 21600 retry_times 3 method http",
					"description": "新建crl证书crl1，获取方式http，路径http://www.baidu.com，下载间隔21600分钟，超时时间10分钟，重试次数3次。"
				},
				{
					"command": "modify rc crl crl1 name crl2 description test  method ftp url \"ftp://admin:admin@192.168.0.1/file\" interval 60 timeout 10 retry_times 3",
					"description": "修改crl证书crl1名称为crl2，描述信息test，获取方式ftp，路径ftp://admin:admin@192.168.0.1/file，下载间隔60分钟，超时时间10分钟，重试次数3次。"
				},
				{
					"command": "delete rc crl crl1",
					"description": "删除ca证书ca1"
				},
				{
					"command": "list rc crl crl1",
					"description": "查看ca证书ca1"
				}
			]
		},
		"/api/ad/v3/rc/crl/{name}": {
			"description": "crl证书配置相关操作",
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
					"crl"
				],
				"summary": "get specific crl",
				"description": "获取crl证书配置",
				"operationId": "get_crl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_crl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific crl",
						"description": "获取crl证书配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/rc/crl/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/rc/crl/{name} 响应",
						"description": "返回GET /api/ad/v3/rc/crl/{name}的响应数据",
						"value": {
							"name": "www.abc.com_crl",
							"description": "example_string",
							"method": "FILE",
							"file_token": "example_string",
							"url": "http://",
							"username": "example_string",
							"password": "example_string",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"timeout": 10,
							"interval": 21600,
							"retry_times": 3,
							"network": "AUTO"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"crl"
				],
				"summary": "create new crl",
				"description": "新建crl证书配置",
				"operationId": "create_crl",
				"parameters": [
					{
						"$ref": "#/parameters/CRL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_crl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new crl",
						"description": "新建crl证书配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/rc/crl/{name}",
							"body": {
								"name": "AI_www.abc.com_crl_B",
								"method": "FILE",
								"url": "http://",
								"timeout": 10,
								"interval": 21600,
								"retry_times": 3,
								"network": "AUTO"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/rc/crl/{name} 响应",
						"description": "返回POST /api/ad/v3/rc/crl/{name}的响应数据",
						"value": {
							"name": "AI_www.abc.com_crl_B",
							"description": "example_string",
							"method": "FILE",
							"file_token": "example_string",
							"url": "http://",
							"username": "example_string",
							"password": "example_string",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"timeout": 10,
							"interval": 21600,
							"retry_times": 3,
							"network": "AUTO"
						}
					}
				}
			},
			"put": {
				"tags": [
					"crl"
				],
				"summary": "replace specific crl",
				"description": "修改crl证书配置",
				"operationId": "replace_crl",
				"parameters": [
					{
						"$ref": "#/parameters/CRL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_crl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific crl",
						"description": "修改crl证书配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/rc/crl/{name}",
							"body": {
								"name": "www.abc.com_crl",
								"method": "FILE",
								"url": "http://",
								"timeout": 10,
								"interval": 21600,
								"retry_times": 3,
								"network": "AUTO"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/rc/crl/{name} 响应",
						"description": "返回PUT /api/ad/v3/rc/crl/{name}的响应数据",
						"value": {
							"name": "www.abc.com_crl",
							"description": "example_string",
							"method": "FILE",
							"file_token": "example_string",
							"url": "http://",
							"username": "example_string",
							"password": "example_string",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"timeout": 10,
							"interval": 21600,
							"retry_times": 3,
							"network": "AUTO"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"crl"
				],
				"summary": "modify specific crl",
				"description": "修改crl证书配置",
				"operationId": "edit_crl",
				"parameters": [
					{
						"$ref": "#/parameters/CRL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_crl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific crl",
						"description": "修改crl证书配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/rc/crl/{name}",
							"body": {
								"name": "www.abc.com_crl",
								"method": "FILE",
								"url": "http://",
								"timeout": 10,
								"interval": 21600,
								"retry_times": 3,
								"network": "AUTO"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/rc/crl/{name} 响应",
						"description": "返回PATCH /api/ad/v3/rc/crl/{name}的响应数据",
						"value": {
							"name": "www.abc.com_crl",
							"description": "example_string",
							"method": "FILE",
							"file_token": "example_string",
							"url": "http://",
							"username": "example_string",
							"password": "example_string",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"timeout": 10,
							"interval": 21600,
							"retry_times": 3,
							"network": "AUTO"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"crl"
				],
				"summary": "delete specific crl",
				"description": "删除crl证书配置",
				"operationId": "delete_crl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_crl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific crl",
						"description": "删除crl证书配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/rc/crl/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/rc/crl/{name} 响应",
						"description": "返回DELETE /api/ad/v3/rc/crl/{name}的响应数据",
						"value": {
							"name": "www.abc.com_crl",
							"description": "example_string",
							"method": "FILE",
							"file_token": "example_string",
							"url": "http://",
							"username": "example_string",
							"password": "example_string",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"timeout": 10,
							"interval": 21600,
							"retry_times": 3,
							"network": "AUTO"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"CRL-CONFIG": {
			"name": "CRL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.crl"
			}
		},
		"CRL-PROPERTY": {
			"name": "CRL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.crl"
			}
		}
	},
	"responses": {
		"operation_config_crl_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.crl_list"
			}
		},
		"operation_config_crl_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.crl"
			}
		}
	},
	"definitions": {
		"config.crl_list": {
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
						"$ref": "#/definitions/config.crl"
					}
				}
			}
		},
		"config.crl": {
			"type": "object",
			"required": [
				"name",
				"method"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定crl证书的名称, 在配置中必须唯一。",
					"example": "www.abc.com_crl",
					"maxLength": 80,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"method": {
					"type": "string",
					"description": "必选参数；指定获取方式。",
					"enum": [
						"HTTP",
						"FTP",
						"LDAP",
						"FILE"
					],
					"example": "FILE"
				},
				"file_token": {
					"type": "string",
					"description": "Token of file-resource."
				},
				"url": {
					"type": "string",
					"description": "必选参数；指定获取路径。",
					"example": "ftp://10.0.1.100/crl/1",
					"maxLength": 1024,
					"minLength": 1,
					"default": "http://"
				},
				"username": {
					"type": "string",
					"description": "指定用户名。",
					"maxLength": 31,
					"minLength": 0
				},
				"password": {
					"type": "string",
					"description": "指定密码。",
					"writeOnly": true,
					"maxLength": 24
				},
				"pk_password": {
					"type": "string",
					"description": "指定加密密码",
					"example": "A1B2C3D4"
				},
				"encrypted_password": {
					"type": "string",
					"description": "指定加密密码。",
					"example": "A1B2C3D4"
				},
				"timeout": {
					"type": "integer",
					"description": "必选参数；指定超时时间。",
					"default": 10,
					"example": 10,
					"maximum": 3600,
					"minimum": 10
				},
				"interval": {
					"type": "integer",
					"description": "必选参数；指定获取时间间隔。",
					"default": 21600,
					"example": 21600,
					"maximum": 2592000,
					"minimum": 60
				},
				"retry_times": {
					"type": "integer",
					"description": "必选参数；指定重试次数。",
					"default": 3,
					"example": 3,
					"maximum": 20,
					"minimum": 0
				},
				"network": {
					"type": "string",
					"description": "可选参数；选择的网络。",
					"enum": [
						"MANAGE_NET",
						"SERVICE_NET",
						"AUTO"
					],
					"default": "AUTO",
					"example": "AUTO"
				}
			}
		}
	}
}