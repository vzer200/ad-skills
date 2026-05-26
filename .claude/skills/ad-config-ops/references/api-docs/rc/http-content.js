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
		"/api/ad/v3/rc/http-content/": {
			"description": "自定义内容配置相关操作",
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
					"http-content"
				],
				"summary": "get all http-content",
				"description": "获取自定义内容配置",
				"operationId": "get_http_content_list",
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
						"$ref": "#/responses/operation_config_http_content_list"
					}
				}
			},
			"post": {
				"tags": [
					"http-content"
				],
				"summary": "create new http-content",
				"description": "新建自定义内容配置",
				"operationId": "add_http_content_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-CONTENT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_content_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"http-content"
				],
				"summary": "modify http-content",
				"description": "修改自定义内容配置",
				"operationId": "edit_http_content_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-CONTENT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_content_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create  rc http-content 200 http_header \"HTTP/1.0 200 OK\\nContent-Type: text/html\\nConnection: Close\\nServer: Microsoft-IIS/7.5\"",
					"description": "新建自定义内容200。"
				},
				{
					"command": "modify  rc http-content 200 name 201 http_header \"HTTP/1.0 201 OK\\nContent-Type: text/html\\nConnection: Close\\nServer: Microsoft-IIS/7.5\"",
					"description": "修改自定义内容200为201。"
				},
				{
					"command": "delete rc http-content 200",
					"description": "删除自定义内容200"
				},
				{
					"command": "list rc http-content 200",
					"description": "查看自定义内容200"
				}
			]
		},
		"/api/ad/v3/rc/http-content/{name}": {
			"description": "自定义内容配置相关操作",
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
					"http-content"
				],
				"summary": "get specific http-content",
				"description": "获取自定义内容配置",
				"operationId": "get_http_content",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_content_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"http-content"
				],
				"summary": "create new http-content",
				"description": "新建自定义内容配置",
				"operationId": "create_http_content",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-CONTENT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_content_object"
					}
				}
			},
			"put": {
				"tags": [
					"http-content"
				],
				"summary": "replace specific http-content",
				"description": "修改自定义内容配置",
				"operationId": "replace_http_content",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-CONTENT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_content_object"
					}
				}
			},
			"patch": {
				"tags": [
					"http-content"
				],
				"summary": "modify specific http-content",
				"description": "修改自定义内容配置",
				"operationId": "edit_http_content",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-CONTENT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_content_object"
					}
				}
			},
			"delete": {
				"tags": [
					"http-content"
				],
				"summary": "delete specific http-content",
				"description": "删除自定义内容配置",
				"operationId": "delete_http_content",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_content_object"
					}
				}
			}
		}
	},
	"parameters": {
		"HTTP-CONTENT-CONFIG": {
			"name": "HTTP-CONTENT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.http_content"
			}
		},
		"HTTP-CONTENT-PROPERTY": {
			"name": "HTTP-CONTENT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.http_content"
			}
		}
	},
	"responses": {
		"operation_config_http_content_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_content_list"
			}
		},
		"operation_config_http_content_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_content"
			}
		}
	},
	"definitions": {
		"config.http_content_list": {
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
						"$ref": "#/definitions/config.http_content"
					}
				}
			}
		},
		"config.http_content": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定自定义内容的名称, 在配置中必须唯一。",
					"example": "200_OK"
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"http_header": {
					"type": "string",
					"description": "可选参数；指定自定义内容head信息。",
					"example": ""
				},
				"http_body": {
					"type": "string",
					"description": "可选参数；指定自定义内容body信息。",
					"example": ""
				}
			}
		}
	}
}