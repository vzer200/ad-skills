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
		"/api/ad/v3/debug/rc/crl/{name}/update": {
			"description": "更新CRL证书吊销列表操作",
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
					"crl"
				],
				"summary": "get specific crl",
				"description": "更新CRL证书吊销列表",
				"operationId": "get_crl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_crl_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug rc crl crl1 update",
					"description": "更新CRL证书吊销列表"
				}
			]
		}
	},
	"parameters": {
		"CRL-CONFIG": {
			"name": "CRL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/debug.crl"
			}
		}
	},
	"responses": {
		"operation_debug_crl_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.crl_list"
			}
		},
		"operation_debug_crl_object": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.crl"
			}
		}
	},
	"definitions": {
		"debug.crl_list": {
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
					"type": "integer",
					"example": 48,
					"description": "项目总数"
				},
				"items_offset": {
					"description": "当前项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"type": "integer",
					"example": 8,
					"description": "当前页项目数"
				},
				"items": {
					"type": "array",
					"description": "crl列表",
					"items": {
						"$ref": "#/definitions/debug.crl"
					}
				}
			}
		},
		"debug.crl": {
			"type": "object",
			"readOnly": true,
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定crl证书的名称, 在配置中必须唯一。",
					"example": "abc.com_crl"
				},
				"update": {
					"type": "string",
					"description": "必选参数；指定动作。"
				}
			}
		}
	}
}