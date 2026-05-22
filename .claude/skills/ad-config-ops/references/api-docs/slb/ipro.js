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
		"/api/ad/v3/slb/ipro/": {
			"description": "新建、查看IPRO脚本配置",
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
					"ipro"
				],
				"summary": "get all ipro",
				"description": "查看当前已有的IPRO脚本配置信息",
				"operationId": "get_ipro_list",
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
						"$ref": "#/responses/operation_config_ipro_list"
					}
				}
			},
			"post": {
				"tags": [
					"ipro"
				],
				"summary": "create new ipro",
				"description": "新建一个IPRO脚本配置",
				"operationId": "add_ipro_list",
				"parameters": [
					{
						"$ref": "#/parameters/IPRO-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ipro_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb ipro ipro_1 language script_lua script script_content",
					"description": "新建一个脚本内容为script_content脚本语言为lua的ipro脚本ipro_1"
				},
				{
					"command": "modify slb ipro ipro_1 name ipro_2",
					"description": "修改ipro_1脚本的名称为ipro_2"
				},
				{
					"command": "list slb ipro ipro_2",
					"description": "查看ipro_2脚本的内容"
				}
			]
		},
		"/api/ad/v3/slb/ipro/{name}": {
			"description": "新建、查看、修改、删除指定的IPRO脚本配置",
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
					"ipro"
				],
				"summary": "get specific ipro",
				"description": "查看指定的IPRO脚本配置",
				"operationId": "get_ipro",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ipro_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ipro"
				],
				"summary": "create new ipro",
				"description": "新建指定的IPRO脚本配置",
				"operationId": "create_ipro",
				"parameters": [
					{
						"$ref": "#/parameters/IPRO-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ipro_object"
					}
				}
			},
			"put": {
				"tags": [
					"ipro"
				],
				"summary": "replace specific ipro",
				"description": "修改指定的IPRO脚本配置",
				"operationId": "replace_ipro",
				"parameters": [
					{
						"$ref": "#/parameters/IPRO-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ipro_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ipro"
				],
				"summary": "modify specific ipro",
				"description": "修改指定的IPRO脚本配置",
				"operationId": "edit_ipro",
				"parameters": [
					{
						"$ref": "#/parameters/IPRO-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ipro_object"
					}
				}
			},
			"delete": {
				"tags": [
					"ipro"
				],
				"summary": "delete specific ipro",
				"description": "删除指定的IPRO脚本配置",
				"operationId": "delete_ipro",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ipro_object"
					}
				}
			}
		}
	},
	"parameters": {
		"IPRO-CONFIG": {
			"name": "IPRO-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ipro"
			}
		},
		"IPRO-PROPERTY": {
			"name": "IPRO-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ipro"
			}
		}
	},
	"responses": {
		"operation_config_ipro_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ipro_list"
			}
		},
		"operation_config_ipro_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ipro"
			}
		}
	},
	"definitions": {
		"config.ipro_list": {
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
						"$ref": "#/definitions/config.ipro"
					}
				}
			}
		},
		"config.ipro": {
			"type": "object",
			"required": [
				"name",
				"script"
			],
			"properties": {
				"name": {
					"description": "iPro配置名称",
					"type": "string",
					"example": "mblb"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注",
					"example": ""
				},
				"language": {
					"type": "string",
					"description": "脚本类型",
					"enum": [
						"SCRIPT_LUA",
						"SCRIPT_TCL"
					],
					"example": "SCRIPT_LUA",
					"default": "SCRIPT_LUA"
				},
				"script": {
					"description": "脚本内容,最长限制1M",
					"type": "string",
					"maxLength": 1048576,
					"example": ""
				}
			}
		}
	}
}