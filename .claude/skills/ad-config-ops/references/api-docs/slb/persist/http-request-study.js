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
		"/api/ad/v3/slb/persist/http-request-study/": {
			"description": "新建、查看会话保持（HTTP请求被动）配置",
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
					"persist"
				],
				"summary": "get all persist-http-request-study",
				"description": "查看已有会话保持（HTTP请求被动）配置信息列表",
				"operationId": "get_persist_http_request_study_list",
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
						"$ref": "#/responses/operation_config_persist_http_request_study_list"
					}
				}
			},
			"post": {
				"tags": [
					"persist"
				],
				"summary": "create new persist-http-request-study",
				"description": "新建会话保持（HTTP请求被动）配置",
				"operationId": "add_persist_http_request_study_list",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-HTTP-REQUEST-STUDY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_http_request_study_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb persist http-request-study abc description 123 component header header cookie keyword jsession terminator _ offset 1 timeout 10 busy_protect enable record_scope pool",
					"description": "新建HTTP请求被动会话保持abc，会话ID查找位置为HTTP头部，头部名称为cookie，查找关键字jsession，结束字符为_，偏移量为1，超时时间为10s，启用繁忙保护，作用域为pool。"
				},
				{
					"command": "modify slb persist http-request-study abc component uri",
					"description": "修改会话保持abc的会话ID查找位置为uri。"
				},
				{
					"command": "list slb persist http-request-study abc",
					"description": "查看会话保持abc的配置信息。"
				},
				{
					"command": "delete slb persist http-request-study abc",
					"description": "删除会话保持abc。"
				}
			]
		},
		"/api/ad/v3/slb/persist/http-request-study/{name}": {
			"description": "查看、新建、修改、删除会话保持（HTTP请求被动）配置",
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
					"persist"
				],
				"summary": "get specific persist-http-request-study",
				"description": "查看指定会话保持（HTTP请求被动）配置",
				"operationId": "get_persist_http_request_study",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_http_request_study_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"persist"
				],
				"summary": "create new persist-http-request-study",
				"description": "新建会话保持（HTTP请求被动）配置",
				"operationId": "create_persist_http_request_study",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-HTTP-REQUEST-STUDY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_http_request_study_object"
					}
				}
			},
			"put": {
				"tags": [
					"persist"
				],
				"summary": "replace specific persist-http-request-study",
				"description": "修改指定会话保持（HTTP请求被动）配置",
				"operationId": "replace_persist_http_request_study",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-HTTP-REQUEST-STUDY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_http_request_study_object"
					}
				}
			},
			"patch": {
				"tags": [
					"persist"
				],
				"summary": "modify specific persist-http-request-study",
				"description": "修改指定会话保持（HTTP请求被动）配置",
				"operationId": "edit_persist_http_request_study",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-HTTP-REQUEST-STUDY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_http_request_study_object"
					}
				}
			},
			"delete": {
				"tags": [
					"persist"
				],
				"summary": "delete specific persist-http-request-study",
				"description": "删除指定会话保持（HTTP请求被动）配置",
				"operationId": "delete_persist_http_request_study",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_http_request_study_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PERSIST-HTTP-REQUEST-STUDY-CONFIG": {
			"name": "PERSIST-HTTP-REQUEST-STUDY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.persist_http_request_study"
			}
		},
		"PERSIST-HTTP-REQUEST-STUDY-PROPERTY": {
			"name": "PERSIST-HTTP-REQUEST-STUDY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.persist_http_request_study"
			}
		}
	},
	"responses": {
		"operation_config_persist_http_request_study_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_http_request_study_list"
			}
		},
		"operation_config_persist_http_request_study_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_http_request_study"
			}
		}
	},
	"definitions": {
		"config.persist_http_request_study_list": {
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
						"$ref": "#/definitions/config.persist_http_request_study"
					}
				}
			}
		},
		"config.persist_http_request_study": {
			"type": "object",
			"required": [
				"name",
				"component"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定会话保持的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "cookie_passive"
				},
				"description": {
					"type": "string",
					"example": "",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "只读参数；指定会话保持类型。",
					"type": "string",
					"enum": [
						"HTTP-REQUEST-STUDY"
					],
					"default": "HTTP-REQUEST-STUDY"
				},
				"component": {
					"description": "必选参数；指定会话ID查找位置,uri表示在http请求URL中查找，header表示在HTTP头部中查找，body表示在HTTP实体内容中查找。",
					"type": "string",
					"enum": [
						"URI",
						"HEADER",
						"BODY"
					],
					"default": "HEADER",
					"example": "URI"
				},
				"header": {
					"description": "可选参数；当component指定为header时，可设置此参数来指定查找的位置，默认为空。",
					"type": "string",
					"example": "cookie"
				},
				"keyword": {
					"description": "可选参数；指定查找关键字，默认为空。",
					"type": "string",
					"default": "",
					"example": "JSESSION"
				},
				"offset": {
					"description": "可选参数；指定偏移量，取值范围为[0,255]，默认为0。",
					"type": "integer",
					"maximum": 255,
					"minimum": 0,
					"default": 0,
					"example": 9
				},
				"terminator": {
					"description": "可选参数；指定查找的结束字符，默认为空。",
					"type": "string",
					"maxLength": 31,
					"example": ";"
				},
				"timeout": {
					"description": "可选参数；指定会话保持超时时间，取值范围为[0, 34536000]，默认为86400，单位为s。",
					"type": "integer",
					"maximum": 34536000,
					"minimum": 0,
					"default": 180,
					"example": 86400
				},
				"busy_protect": {
					"description": "可选参数；指定是否启用繁忙保护，enable表示启用，disable表示禁用，默认为disable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"record_scope": {
					"description": "可选参数；指定会话保持的作用范围，pool表示在池内生效，vip表示访问相同vip均生效，global表示全局生效，默认为pool。",
					"type": "string",
					"enum": [
						"POOL",
						"VIP",
						"GLOBAL"
					],
					"default": "POOL",
					"example": "POOL"
				},
				"session_persist_synchronize": {
					"description": "可选参数；双机或集群模式下，指定会话保持同步的开关，disable表示禁用，enable表示启用；默认启用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				}
			}
		}
	}
}