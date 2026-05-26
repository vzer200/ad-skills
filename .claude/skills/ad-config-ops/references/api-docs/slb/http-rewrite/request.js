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
		"/api/ad/v3/slb/http-rewrite/request/": {
			"description": "新建、查看HTTP改写策略（请求改写）配置",
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
					"http-rewrite"
				],
				"summary": "get all http-rewrite-request",
				"description": "查看当前已有的HTTP改写策略（请求改写）配置信息",
				"operationId": "get_http_rewrite_request_list",
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
						"$ref": "#/responses/operation_config_http_rewrite_request_list"
					}
				}
			},
			"post": {
				"tags": [
					"http-rewrite"
				],
				"summary": "create new http-rewrite-request",
				"description": "新建一个HTTP改写策略（请求改写）配置",
				"operationId": "add_http_rewrite_request_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-REQUEST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_request_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb http-rewrite request http_request_rewrite_example type rewrite-request description http_request_rewrite_desc source_address { type ip-address address 192.168.1.1-192.168.1.254 } http_request_method get action insert-http-header header_operation { header Rewrite replace True } rewrite_encode url-encode",
					"description": "新建HTTP请求改写策略，当HTTP请求方法为GET方法，源IP在192.168.1.1-192.168.1.254范围内的时候，插入头部Rewrite: True，插入的内容用URL编码"
				},
				{
					"command": "list slb http-rewrite request http_request_rewrite_example",
					"description": "查看HTTP改写策略http_request_rewrite_example的配置信息"
				},
				{
					"command": "modify slb http-rewrite request http_request_rewrite_example action modify-http-body body_operation { pattern jpg replace png }",
					"description": "修改HTTP改写策略http_request_rewrite_example的动作为实体改写，将jpg改为png"
				},
				{
					"command": "delete slb http-rewrite request http_request_rewrite_example",
					"description": "删除HTTP改写策略http_request_rewrite_example"
				}
			]
		},
		"/api/ad/v3/slb/http-rewrite/request/{name}": {
			"description": "新建、查看、修改、删除指定的HTTP改写策略（请求改写）配置",
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
					"http-rewrite"
				],
				"summary": "get specific http-rewrite-request",
				"description": "查看指定的HTTP改写策略（请求改写）配置",
				"operationId": "get_http_rewrite_request",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_request_object"
					}
				}
			},
			"post": {
				"tags": [
					"http-rewrite"
				],
				"summary": "create new http-rewrite-request",
				"description": "新建指定的HTTP改写策略（请求改写）配置",
				"operationId": "create_http_rewrite_request",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-REQUEST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_request_object"
					}
				}
			},
			"put": {
				"tags": [
					"http-rewrite"
				],
				"summary": "replace specific http-rewrite-request",
				"description": "修改指定的HTTP改写策略（请求改写）配置",
				"operationId": "replace_http_rewrite_request",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-REQUEST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_request_object"
					}
				}
			},
			"patch": {
				"tags": [
					"http-rewrite"
				],
				"summary": "modify specific http-rewrite-request",
				"description": "修改指定的HTTP改写策略（请求改写）配置",
				"operationId": "edit_http_rewrite_request",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-REQUEST-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_request_object"
					}
				}
			},
			"delete": {
				"tags": [
					"http-rewrite"
				],
				"summary": "delete specific http-rewrite-request",
				"description": "删除指定的HTTP改写策略（请求改写）配置",
				"operationId": "delete_http_rewrite_request",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_request_object"
					}
				}
			}
		}
	},
	"parameters": {
		"HTTP-REWRITE-REQUEST-CONFIG": {
			"name": "HTTP-REWRITE-REQUEST-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON格式的配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_request"
			}
		},
		"HTTP-REWRITE-REQUEST-PROPERTY": {
			"name": "HTTP-REWRITE-REQUEST-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON格式的配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_request"
			}
		}
	},
	"responses": {
		"operation_config_http_rewrite_request_list": {
			"description": "返回给前端的配置列表的JSON格式参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_request_list"
			}
		},
		"operation_config_http_rewrite_request_object": {
			"description": "返回给前端的配置的JSON格式参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_request"
			}
		}
	},
	"definitions": {
		"config.http_rewrite_request_list": {
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
						"$ref": "#/definitions/config.http_rewrite_request"
					}
				}
			}
		},
		"config.http_rewrite_request": {
			"type": "object",
			"required": [
				"name",
				"action"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定HTTP请求改写配置的名称，在配置中必须唯一",
					"type": "string",
					"example": "url-sched"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用于对此配置增加备注"
				},
				"type": {
					"description": "可选参数；改写配置的类型，rewrite-request为请求改写，默认为rewrite-request",
					"type": "string",
					"enum": [
						"REWRITE-REQUEST"
					],
					"default": "REWRITE-REQUEST",
					"example": "REWRITE-REQUEST"
				},
				"source_address": {
					"description": "可选参数；设置改写策略适用的源IP范围",
					"type": "object",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"description": "可选参数；设置源IP范围的类型，all表示所有ip，ip-address表示ip地址（范围），custom-address-group表示用户地址集，默认为all",
							"type": "string",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP"
							],
							"default": "ALL",
							"example": "ALL"
						},
						"address": {
							"description": "可选参数；指定源IP范围，可填具体的IP、IP地址段、子网段",
							"type": "string",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"description": "可选参数；当源IP范围类型为用户地址集时用来指定使用的用户地址集",
							"type": "string",
							"example": "{custom_address_group}"
						}
					}
				},
				"http_request_method": {
					"description": "可选参数；HTTP请求类型，all表示所有，get表示GET请求，post表示POST请求，默认为all",
					"type": "string",
					"enum": [
						"GET",
						"POST",
						"ALL"
					],
					"default": "ALL"
				},
				"http_request_version": {
					"description": "可选参数；HTTP请求协议版本，all表示所有，http/1.0表示1.0版本的请求，http/1.1表示1.1版本的请求，默认为all",
					"type": "string",
					"enum": [
						"HTTP/1.0",
						"HTTP/1.1",
						"ALL"
					],
					"default": "ALL"
				},
				"http_request_uri_rule": {
					"description": "可选参数；http请求URI规则",
					"$ref": "/api/{common}.yaml#/definitions/config.str_match_component"
				},
				"http_request_header_rules": {
					"description": "可选参数；HTTP请求头部匹配规则列表",
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.http_header_match_component"
					},
					"maxItems": 4
				},
				"ssl_version_rule": {
					"description": "可选参数；SSL协议版本，all表示所有，默认为all",
					"type": "string",
					"enum": [
						"ALL",
						"V1",
						"V2",
						"V3"
					],
					"default": "ALL"
				},
				"ssl_variable_rules": {
					"description": "可选参数；SSL证书变量匹配规则列表",
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.ssl_match_component"
					}
				},
				"action": {
					"description": "必选参数；改写动作，modify-http-uri表示改写URI，insert-http-header表示插入头部，remove-http-header表示删除头部，modify-http-header表示改写头部，modify-http-body表示实体改写",
					"type": "string",
					"enum": [
						"MODIFY-HTTP-URI",
						"INSERT-HTTP-HEADER",
						"REMOVE-HTTP-HEADER",
						"MODIFY-HTTP-HEADER",
						"MODIFY-HTTP-BODY",
						"HTTP-RESPONSE"
					]
				},
				"uri_operation": {
					"description": "可选参数；URI改写操作，当动作为URI改写的时候需要配置此项",
					"type": "object",
					"required": [
						"pattern"
					],
					"properties": {
						"pattern": {
							"description": "可选参数；URI改写范围",
							"type": "string",
							"maxLength": 255,
							"minLength": 1,
							"example": "http://www.testA.com"
						},
						"replace": {
							"description": "可选参数；URI匹配改写内容",
							"type": "string",
							"maxLength": 255,
							"example": "https://www.testB.com"
						}
					}
				},
				"header_operation": {
					"description": "可选参数；头部修改操作，当动作为插入头部、删除头部或这改写头部的时候需要配置此项",
					"type": "object",
					"required": [
						"header"
					],
					"properties": {
						"header": {
							"description": "可选参数；需要修改（插入/删除/改写）的头部名称",
							"type": "string",
							"example": "X-FORWARDED-FOR"
						},
						"pattern": {
							"description": "可选参数；改写动作为（插入/删除/改写）头部的时候此参数不需要配置",
							"type": "string",
							"maxLength": 255,
							"minLength": 1,
							"example": ""
						},
						"replace": {
							"description": "可选参数；头部（插入/删除/改写）的内容",
							"type": "string",
							"maxLength": 255,
							"example": "${client_ip}"
						}
					}
				},
				"body_operation": {
					"description": "可选参数；实体改写操作，当动作为实体改写的时候需要配置此项",
					"type": "object",
					"required": [
						"pattern"
					],
					"properties": {
						"pattern": {
							"description": "可选参数；实体改写范围",
							"type": "string",
							"maxLength": 255,
							"minLength": 1,
							"example": "http://www.testA.com"
						},
						"replace": {
							"description": "可选参数；实体改写内容",
							"type": "string",
							"maxLength": 255,
							"example": "https://www.testB.com"
						}
					}
				},
				"rewrite_encode": {
					"description": "可选参数；改写内容使用的编码，plain表示原文，url-encode表示URL编码，base64-encode表示base64编码",
					"type": "string",
					"enum": [
						"PLAIN",
						"URL-ENCODE",
						"BASE64-ENCODE"
					],
					"default": "PLAIN"
				}
			}
		}
	}
}