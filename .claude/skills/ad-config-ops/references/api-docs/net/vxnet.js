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
		"/api/ad/v3/net/vxnet/": {
			"description": "vxnet配置相关操作",
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
					"vxnet"
				],
				"summary": "get all vxnet",
				"description": "获取vxnet配置",
				"operationId": "get_vxnet_list",
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
						"$ref": "#/responses/operation_config_vxnet_list"
					}
				}
			},
			"post": {
				"tags": [
					"vxnet"
				],
				"summary": "create new vxnet",
				"description": "新建vxnet配置",
				"operationId": "add_vxnet_list",
				"parameters": [
					{
						"$ref": "#/parameters/VXNET-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vxnet_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"vxnet"
				],
				"summary": "modify vxnet",
				"description": "修改vxnet配置",
				"operationId": "edit_vxnet_list",
				"parameters": [
					{
						"$ref": "#/parameters/VXNET-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vxnet_list"
					}
				}
			}
		},
		"/api/ad/v3/net/vxnet/{name}": {
			"description": "vxnet配置相关操作",
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
					"vxnet"
				],
				"summary": "get specific vxnet",
				"description": "修改vxnet配置",
				"operationId": "get_vxnet",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vxnet_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"vxnet"
				],
				"summary": "create new vxnet",
				"description": "新建vxnet配置",
				"operationId": "create_vxnet",
				"parameters": [
					{
						"$ref": "#/parameters/VXNET-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vxnet_object"
					}
				}
			},
			"put": {
				"tags": [
					"vxnet"
				],
				"summary": "replace specific vxnet",
				"description": "修改vxnet配置",
				"operationId": "replace_vxnet",
				"parameters": [
					{
						"$ref": "#/parameters/VXNET-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vxnet_object"
					}
				}
			},
			"patch": {
				"tags": [
					"vxnet"
				],
				"summary": "modify specific vxnet",
				"description": "修改vxnet配置",
				"operationId": "edit_vxnet",
				"parameters": [
					{
						"$ref": "#/parameters/VXNET-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vxnet_object"
					}
				}
			},
			"delete": {
				"tags": [
					"vxnet"
				],
				"summary": "delete specific vxnet",
				"description": "删除vxnet配置",
				"operationId": "delete_vxnet",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vxnet_object"
					}
				}
			}
		}
	},
	"parameters": {
		"VXNET-CONFIG": {
			"name": "VXNET-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.vxnet"
			}
		},
		"VXNET-PROPERTY": {
			"name": "VXNET-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.vxnet"
			}
		}
	},
	"responses": {
		"operation_config_vxnet_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.vxnet_list"
			}
		},
		"operation_config_vxnet_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.vxnet"
			}
		}
	},
	"definitions": {
		"config.vxnet_list": {
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
						"$ref": "#/definitions/config.vxnet"
					}
				}
			}
		},
		"config.vxnet": {
			"type": "object",
			"required": [
				"name",
				"vteps_port"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；名称",
					"example": "myvxnet",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；描述",
					"example": "myvxnet belongs to someone"
				},
				"vteps_ip": {
					"description": "绑定的远端IP",
					"type": "array",
					"items": {
						"description": "远端IP",
						"type": "string",
						"example": "23.2.2.2"
					},
					"maxItems": 255
				},
				"vteps_port": {
					"description": "监听端口",
					"type": "integer",
					"default": 4789,
					"example": 4789,
					"minimum": 1,
					"maximum": 65535
				},
				"vxlan_domain": {
					"description": "vxlan域",
					"type": "integer",
					"default": 0,
					"minimum": 0,
					"maximum": 9
				}
			}
		}
	}
}