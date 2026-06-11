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
		"/api/ad/v3/sys/partition/": {
			"description": "新建、查看磁盘分区",
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
					"partition"
				],
				"summary": "get all partition",
				"description": "查看已有的磁盘分区",
				"operationId": "get_partition_list",
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
						"$ref": "#/responses/operation_config_partition_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all partition",
						"description": "查看已有的磁盘分区",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/partition/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/partition/ 响应",
						"description": "返回GET /api/ad/v3/sys/partition/的响应数据",
						"value": {
							"maximum_items": 4000,
							"available_space": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "ad7.0.8",
									"description": "base partition",
									"specification": "min",
									"software_image": "ad7.0.8"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"partition"
				],
				"summary": "create new partition",
				"description": "新建磁盘分区",
				"operationId": "add_partition_list",
				"parameters": [
					{
						"$ref": "#/parameters/PARTITION-INSTALL"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_partition_object"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new partition",
						"description": "新建磁盘分区",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/partition/",
							"body": {
								"name": "AI_ad7.0.8_A"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/partition/ 响应",
						"description": "返回POST /api/ad/v3/sys/partition/的响应数据",
						"value": {
							"name": "AI_ad7.0.8_A",
							"description": "base partition",
							"specification": "min",
							"software_image": "ad7.0.8"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys partition",
					"description": "查看所有磁盘分区"
				},
				{
					"command": "create sys partition test software_image AD7.0.8(20180628_B) specification 标准",
					"description": "创建以AD7.0.8(20180628_B)为镜像，磁盘容量为标准（100G）的磁盘分区"
				},
				{
					"command": "modify sys partition test description test",
					"description": "修改磁盘分区描述为test（只允许修改描述字段）"
				},
				{
					"command": " delete sys partition test username admin password zxczxc",
					"description": "删除磁盘分区test，需要输入用户名和密码"
				},
				{
					"command": " delete sys partition test  username admin prompt_password",
					"description": "删除磁盘分区test，需要输入用户名和密码；当输入prompt_password后，按回车后输密码，密码不明文显示在屏幕上"
				}
			]
		},
		"/api/ad/v3/sys/partition/{name}": {
			"description": "查看、修改、删除指定的磁盘分区",
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
					"partition"
				],
				"summary": "get specific partition",
				"description": "查看指定的磁盘分区",
				"operationId": "get_partition",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_partition_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific partition",
						"description": "查看指定的磁盘分区",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/partition/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/partition/{name} 响应",
						"description": "返回GET /api/ad/v3/sys/partition/{name}的响应数据",
						"value": {
							"name": "ad7.0.8",
							"description": "base partition",
							"specification": "min",
							"software_image": "ad7.0.8"
						}
					}
				}
			},
			"put": {
				"tags": [
					"partition"
				],
				"summary": "replace specific partition",
				"description": "修改指定的磁盘分区",
				"operationId": "replace_partition",
				"parameters": [
					{
						"$ref": "#/parameters/PARTITION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_partition_object"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific partition",
						"description": "修改指定的磁盘分区",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/partition/{name}",
							"body": {
								"name": "ad7.0.8",
								"specification": "min",
								"software_image": "ad7.0.8"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/partition/{name} 响应",
						"description": "返回PUT /api/ad/v3/sys/partition/{name}的响应数据",
						"value": {
							"name": "ad7.0.8",
							"description": "base partition",
							"specification": "min",
							"software_image": "ad7.0.8"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"partition"
				],
				"summary": "modify specific partition",
				"description": "修改指定的磁盘分区",
				"operationId": "edit_partition",
				"parameters": [
					{
						"$ref": "#/parameters/PARTITION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_partition_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific partition",
						"description": "修改指定的磁盘分区",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/partition/{name}",
							"body": {
								"name": "ad7.0.8",
								"specification": "min",
								"software_image": "ad7.0.8"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/partition/{name} 响应",
						"description": "返回PATCH /api/ad/v3/sys/partition/{name}的响应数据",
						"value": {
							"name": "ad7.0.8",
							"description": "base partition",
							"specification": "min",
							"software_image": "ad7.0.8"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"partition"
				],
				"summary": "delete specific partition",
				"description": "删除指定的磁盘分区",
				"operationId": "delete_partition",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/VERIFY-OPERATOR"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_partition_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific partition",
						"description": "删除指定的磁盘分区",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/sys/partition/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/sys/partition/{name} 响应",
						"description": "返回DELETE /api/ad/v3/sys/partition/{name}的响应数据",
						"value": {
							"name": "ad7.0.8",
							"description": "base partition",
							"specification": "min",
							"software_image": "ad7.0.8"
						}
					}
				}
			}
		},
		"/api/ad/v3/sys/partition/{name}/reinstall": {
			"description": "重新安装指定的磁盘分区",
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
			"post": {
				"tags": [
					"partition"
				],
				"summary": "reinstall specific partition",
				"description": "重新安装指定的磁盘分区",
				"operationId": "reinstall_partition",
				"parameters": [
					{
						"$ref": "#/parameters/PARTITION-REINSTALL"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_partition_object"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				},
				"x-examples": {
					"request": {
						"summary": "reinstall specific partition",
						"description": "重新安装指定的磁盘分区",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/partition/{name}/reinstall",
							"body": {
								"name": "AI_ad7.0.8_B",
								"software_image": "ad7.0.8_customize.iso",
								"specification": "Minimum"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/partition/{name}/reinstall 响应",
						"description": "返回POST /api/ad/v3/sys/partition/{name}/reinstall的响应数据",
						"value": {
							"name": "AI_ad7.0.8_B",
							"description": "base partition",
							"specification": "min",
							"software_image": "ad7.0.8"
						}
					}
				}
			}
		},
		"/api/ad/v3/sys/partition/{name}/export-log": {
			"description": "导出指定的磁盘分区日志",
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
			"post": {
				"tags": [
					"partition"
				],
				"summary": "export log from specific partition",
				"description": "导出指定的磁盘分区日志",
				"operationId": "export_partition_log",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				},
				"x-examples": {
					"request": {
						"summary": "export log from specific partition",
						"description": "导出指定的磁盘分区日志",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/partition/{name}/export-log"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/partition/{name}/export-log 响应",
						"description": "返回POST /api/ad/v3/sys/partition/{name}/export-log的响应数据",
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
		"PARTITION-CONFIG": {
			"name": "PARTITION-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.partition"
			}
		},
		"PARTITION-PROPERTY": {
			"name": "PARTITION-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.partition"
			}
		},
		"PARTITION-INSTALL": {
			"name": "PARTITION-INSTALL",
			"in": "body",
			"required": true,
			"description": "JSON Install",
			"schema": {
				"$ref": "#/definitions/config.partition_install"
			}
		},
		"PARTITION-REINSTALL": {
			"name": "PARTITION-REINSTALL",
			"in": "body",
			"required": true,
			"description": "JSON Reinstall",
			"schema": {
				"$ref": "#/definitions/config.partition_reinstall"
			}
		}
	},
	"responses": {
		"operation_config_partition_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.partition_list"
			}
		},
		"operation_config_partition_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.partition"
			}
		}
	},
	"definitions": {
		"config.partition_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "配置数量上限",
					"type": "integer",
					"example": 4000
				},
				"available_space": {
					"type": "integer",
					"description": "可用空间",
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
						"$ref": "#/definitions/config.partition"
					}
				}
			}
		},
		"config.partition_install": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；分区名称",
					"example": "ad7.0.8"
				},
				"description": {
					"type": "string",
					"description": "可选参数；分区描述及备忘信息",
					"example": "base partition"
				},
				"software_image": {
					"type": "string",
					"description": "必选参数；选择要安装的软件镜像",
					"example": "ad7.0.8_customize.iso"
				},
				"specification": {
					"type": "string",
					"description": "必选参数；指定安装规格名称（标准-容量100G/高容量-容量200G）",
					"example": "Minimum"
				}
			}
		},
		"config.partition_reinstall": {
			"type": "object",
			"required": [
				"name",
				"software_image",
				"specification"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "分区名称",
					"example": "ad7.0.8"
				},
				"description": {
					"type": "string",
					"description": "分区描述及备忘信息",
					"example": "base partition"
				},
				"software_image": {
					"type": "string",
					"description": "选择要安装的软件镜像",
					"example": "ad7.0.8_customize.iso"
				},
				"specification": {
					"type": "string",
					"description": "指定安装规格名称（默认为标准规格）",
					"example": "Minimum"
				},
				"username": {
					"type": "string",
					"description": "用户名称",
					"example": "admin"
				},
				"password": {
					"type": "string",
					"description": "重装分区需要当前用户输入密码",
					"example": "admin"
				},
				"pk_password": {
					"type": "string",
					"description": "用户输入密码的加密格式",
					"example": ""
				},
				"anyOf": {
					"description": "password与pk_password二者选其一"
				}
			}
		},
		"config.partition": {
			"type": "object",
			"required": [
				"name",
				"software_image",
				"specification"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "分区名称",
					"example": "ad7.0.8"
				},
				"description": {
					"type": "string",
					"description": "分区描述及备忘信息",
					"example": "base partition"
				},
				"specification": {
					"type": "string",
					"description": "指定安装规格名称（默认为标准规格）",
					"example": "min"
				},
				"software_image": {
					"description": "选择要安装的软件镜像",
					"type": "string",
					"example": "ad7.0.8"
				}
			}
		}
	}
}