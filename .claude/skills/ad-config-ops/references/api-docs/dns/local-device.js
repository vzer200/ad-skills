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
		"/api/ad/v3/dns/local-device/": {
			"description": "DNS本地服务设备配置管理操作",
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
					"local-device"
				],
				"summary": "get all local-device",
				"description": "查看DNS本地服务设备配置",
				"operationId": "get_local_device_list",
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
						"$ref": "#/responses/operation_config_local_device_list"
					}
				}
			},
			"post": {
				"tags": [
					"local-device"
				],
				"summary": "create new local-device",
				"description": "创建DNS本地服务设备",
				"operationId": "add_local_device_list",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-DEVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_device_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"local-device"
				],
				"summary": "modify local-device",
				"description": "修改DNS本地服务设备",
				"operationId": "edit_local_device_list",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-DEVICE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_device_list"
					}
				}
			}
		},
		"/api/ad/v3/dns/local-device/{name}": {
			"description": "DNS本地服务设备配置管理操作",
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
					"local-device"
				],
				"summary": "查看指定已有的本地服务设备",
				"description": "查看指定已有的本地服务设备",
				"operationId": "get_local_device",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_device_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"local-device"
				],
				"summary": "create new local-device",
				"description": "创建DNS本地服务设备",
				"operationId": "create_local_device",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-DEVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_device_object"
					}
				}
			},
			"put": {
				"tags": [
					"local-device"
				],
				"summary": "replace specific local-device",
				"description": "修改DNS本地服务设备",
				"operationId": "replace_local_device",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-DEVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_device_object"
					}
				}
			},
			"patch": {
				"tags": [
					"local-device"
				],
				"summary": "modify specific local-device",
				"description": "增量修改指定已有的DNS本地服务设备",
				"operationId": "edit_local_device",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-DEVICE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_device_object"
					}
				}
			},
			"delete": {
				"tags": [
					"local-device"
				],
				"summary": "delete specific local-device",
				"description": "删除指定已有的本地DNS设备",
				"operationId": "delete_local_device",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_device_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns local-device test_dns_device",
					"description": "查看DNS服务设备配置，名称为：test_dns_device"
				},
				{
					"command": "create dns local-device new_local_device addresses add [10.2.3.6] description creat_device port 1616",
					"description": "创建DNS服务设备 名称：new_local_device 地址：10.2.3.6 端口：1616"
				},
				{
					"command": "modify dns local-device new_local_device name modify_local_device addresses [10.2.3.60] port 161",
					"description": "修改DNS服务设备，修改后名称：modify_local_device 修改后地址：10.2.3.60 修改后端口：161"
				},
				{
					"command": "delete dns local-device modify_local_device",
					"description": "删除DNS服务设备，名称：modify_local_device"
				}
			]
		}
	},
	"parameters": {
		"LOCAL-DEVICE-CONFIG": {
			"name": "LOCAL-DEVICE-CONFIG",
			"in": "body",
			"required": true,
			"description": "DNS本地服务设备配置",
			"schema": {
				"$ref": "#/definitions/config.local_device"
			}
		},
		"LOCAL-DEVICE-PROPERTY": {
			"name": "LOCAL-DEVICE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "DNS本地服务设备属性",
			"schema": {
				"$ref": "#/definitions/config.local_device"
			}
		}
	},
	"responses": {
		"operation_config_local_device_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.local_device_list"
			}
		},
		"operation_config_local_device_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.local_device"
			}
		}
	},
	"definitions": {
		"config.local_device_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "项目数量最大值",
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
					"description": "页面大小",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "项目长度",
					"type": "integer",
					"example": 8
				},
				"items": {
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.local_device"
					}
				}
			}
		},
		"config.local_device": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "DNS本地服务设备名称，必须唯一",
					"type": "string",
					"example": "localhost"
				},
				"description": {
					"description": "DNS本地服务设备描述信息",
					"type": "string"
				},
				"state": {
					"description": "DNS本地服务设备状态，只读属性，在线或离线",
					"type": "string",
					"readOnly": true,
					"enum": [
						"ONLINE",
						"OFFLINE"
					],
					"example": "ONLINE",
					"default": "ONLINE"
				},
				"addresses": {
					"type": "array",
					"description": "DNS本地服务设备地址列表",
					"items": {
						"description": "DNS本地服务设备IP地址",
						"type": "string",
						"example": "200.200.1.1"
					},
					"maxItems": 8,
					"minItems": 0
				},
				"port": {
					"description": "DNS本地服务端口，默认为161",
					"type": "integer",
					"default": 161,
					"example": 161,
					"maximum": 65535,
					"minimum": 1
				},
				"password": {
					"description": "密码，长度限制为8~64个字符或为空",
					"type": "string",
					"writeOnly": true
				},
				"pk_password": {
					"description": "加密密码",
					"type": "string",
					"writeOnly": true
				},
				"encrypted_password": {
					"description": "加密密码",
					"type": "string"
				}
			}
		}
	}
}