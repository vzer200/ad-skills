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
		"/api/ad/v3/slb/http2-profile/": {
			"description": "新建、查看HTTP2策略配置",
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
					"http2-profile"
				],
				"summary": "get all http2-profile",
				"description": "查看当前已有的HTTP2策略配置信息",
				"operationId": "get_http2_profile_list",
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
						"$ref": "#/responses/operation_config_http2_profile_list"
					}
				}
			},
			"post": {
				"tags": [
					"http2-profile"
				],
				"summary": "create new http2-profile",
				"description": "新建一个HTTP2策略配置",
				"operationId": "add_http2_profile_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP2-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http2_profile_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb http2-profile test_http2 description 描述信息 max_concurrent_num 10 idle_connection_timeout 300",
					"description": "新建HTTP2策略test_http2, 设置每连接最大流数量为10个，空闲超时时间为300秒"
				},
				{
					"command": "modify slb http2-profile test_http2 max_concurrent_num 5 idle_connection_timeout 200",
					"description": "修改HTTP2策略test_http2, 设置每连接最大流数量为5个，空闲超时时间为200秒"
				},
				{
					"command": "list slb http2-profile test_http2",
					"description": "查看HTTP2策略test_http2的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/http2-profile/{name}": {
			"description": "新建、查看、修改、删除指定的HTTP2策略配置",
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
					"http2-profile"
				],
				"summary": "get specific http2-profile",
				"description": "查看指定的HTTP2策略配置",
				"operationId": "get_http2_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http2_profile_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"http2-profile"
				],
				"summary": "create new http2-profile",
				"description": "新建指定的HTTP2策略配置",
				"operationId": "create_http2_profile",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP2-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http2_profile_object"
					}
				}
			},
			"put": {
				"tags": [
					"http2-profile"
				],
				"summary": "replace specific http2-profile",
				"description": "修改指定的HTTP2策略配置",
				"operationId": "replace_http2_profile",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP2-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http2_profile_object"
					}
				}
			},
			"patch": {
				"tags": [
					"http2-profile"
				],
				"summary": "modify specific http2-profile",
				"description": "修改指定的HTTP2策略配置",
				"operationId": "edit_http2_profile",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP2-PROFILE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http2_profile_object"
					}
				}
			},
			"delete": {
				"tags": [
					"http2-profile"
				],
				"summary": "delete specific http2-profile",
				"description": "删除指定的HTTP2策略配置",
				"operationId": "delete_http2_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http2_profile_object"
					}
				}
			}
		}
	},
	"parameters": {
		"HTTP2-PROFILE-CONFIG": {
			"name": "HTTP2-PROFILE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.http2_profile"
			}
		},
		"HTTP2-PROFILE-PROPERTY": {
			"name": "HTTP2-PROFILE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.http2_profile"
			}
		}
	},
	"responses": {
		"operation_config_http2_profile_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http2_profile_list"
			}
		},
		"operation_config_http2_profile_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http2_profile"
			}
		}
	},
	"definitions": {
		"config.http2_profile_list": {
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
						"$ref": "#/definitions/config.http2_profile"
					}
				}
			}
		},
		"config.http2_profile": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定HTTP2策略的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "cache_compress"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"max_concurrent_num": {
					"description": "可选参数; 指定最大并发流数量。",
					"type": "integer",
					"default": 10,
					"maximum": 256,
					"minimum": 1,
					"example": 10
				},
				"idle_connection_timeout": {
					"description": "可选参数; 指定空闲连接超时时间。",
					"type": "integer",
					"default": 300,
					"maximum": 4294967295,
					"minimum": 1,
					"example": 300
				},
				"enable_insert_header": {
					"description": "可选参数; 是否允许插入头部。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"insert_header": {
					"description": "可选参数; 插入头部名称。",
					"type": "string",
					"maxLength": 63,
					"minLength": 1,
					"default": "X-HTTP2",
					"example": "X-HTTP2"
				},
				"receive_window": {
					"description": "可选参数; 指定接收窗口大小。",
					"type": "integer",
					"default": 32,
					"maximum": 128,
					"minimum": 16,
					"example": 32
				},
				"header_table_size": {
					"description": "可选参数; 头部表大小。",
					"type": "integer",
					"default": 4096,
					"maximum": 65535,
					"minimum": 1,
					"example": 4096
				}
			}
		}
	}
}