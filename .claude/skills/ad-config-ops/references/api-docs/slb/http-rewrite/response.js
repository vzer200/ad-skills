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
		"/api/ad/v3/slb/http-rewrite/response/": {
			"description": "新建、查看HTTP改写策略（应答改写）配置",
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
				"summary": "get all http-rewrite-response",
				"description": "查看HTTP改写策略（应答改写）配置",
				"operationId": "get_http_rewrite_response_list",
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
						"$ref": "#/responses/operation_config_http_rewrite_response_list"
					}
				}
			},
			"post": {
				"tags": [
					"http-rewrite"
				],
				"summary": "create new http-rewrite-response",
				"description": "新建HTTP改写策略（应答改写）配置",
				"operationId": "add_http_rewrite_response_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-RESPONSE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_response_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb http-rewrite response http_rewrite_response description http_rewrite_response_desc type rewrite-response source_address { type all } http_request_method post http_response_state_code { mode equal pattern 200 } action modify-http-body body_operation { pattern jpg replace png } rewrite_encode base64-encode",
					"description": "新建HTTP应答改写策略，当HTTP请求为post请求，HTTP应答应答码为200的时候将实体中的jpg改为png，改写的内容用base64编码"
				},
				{
					"command": "list slb http-rewrite response http_rewrite_response",
					"description": "查看HTTP应答改写策略http_rewrite_response"
				},
				{
					"command": "modify slb http-rewrite response http_rewrite_response http_request_method get",
					"description": "修改HTTP应带改写策略http_rewrite_response，设置HTTP请求的类型为GET"
				},
				{
					"command": "delete slb http-rewrite response http_rewrite_response",
					"description": "删除HTTP应答改写策略http_rewrite_response"
				}
			]
		},
		"/api/ad/v3/slb/http-rewrite/response/{name}": {
			"description": "新建、查看、修改、删除指定的HTTP改写策略（应答改写）配置",
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
				"summary": "get specific http-rewrite-response",
				"description": "查看指定的HTTP改写策略（应答改写）配置",
				"operationId": "get_http_rewrite_response",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_response_object"
					}
				}
			},
			"post": {
				"tags": [
					"http-rewrite"
				],
				"summary": "create new http-rewrite-response",
				"description": "新建指定的HTTP改写策略（应答改写）配置",
				"operationId": "create_http_rewrite_response",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-RESPONSE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_response_object"
					}
				}
			},
			"put": {
				"tags": [
					"http-rewrite"
				],
				"summary": "replace specific http-rewrite-response",
				"description": "修改指定的HTTP改写策略（应答改写）配置",
				"operationId": "replace_http_rewrite_response",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-RESPONSE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_response_object"
					}
				}
			},
			"patch": {
				"tags": [
					"http-rewrite"
				],
				"summary": "modify specific http-rewrite-response",
				"description": "修改指定的HTTP改写策略（应答改写）配置",
				"operationId": "edit_http_rewrite_response",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-REWRITE-RESPONSE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_response_object"
					}
				}
			},
			"delete": {
				"tags": [
					"http-rewrite"
				],
				"summary": "delete specific http-rewrite-response",
				"description": "删除指定的HTTP改写策略（应答改写）配置",
				"operationId": "delete_http_rewrite_response",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_response_object"
					}
				}
			}
		}
	},
	"parameters": {
		"HTTP-REWRITE-RESPONSE-CONFIG": {
			"name": "HTTP-REWRITE-RESPONSE-CONFIG",
			"in": "body",
			"required": true,
			"description": "HTTP改写策略（应答改写）JSON格式配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_response"
			}
		},
		"HTTP-REWRITE-RESPONSE-PROPERTY": {
			"name": "HTTP-REWRITE-RESPONSE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "HTTP改写策略（应答改写）JSON格式配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_response"
			}
		}
	},
	"responses": {
		"operation_config_http_rewrite_response_list": {
			"description": "返回给前端的HTTP改写策略（应答改写）配置列表的JSON格式参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_response_list"
			}
		},
		"operation_config_http_rewrite_response_object": {
			"description": "返回给前端的HTTP改写策略（应答改写）配置的JSON格式参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_response"
			}
		}
	},
	"definitions": {
		"config.http_rewrite_response_list": {
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
						"$ref": "#/definitions/config.http_rewrite_response"
					}
				}
			}
		},
		"config.http_rewrite_response": {
			"type": "object",
			"required": [
				"name",
				"action"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定HTTP应答改写配置的名称，在配置中必须唯一",
					"type": "string",
					"example": "url-sched"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用于对此配置增加备注"
				},
				"type": {
					"description": "可选参数；改写配置的类型，rewrite-response为请求改写，默认为rewrite-response",
					"type": "string",
					"enum": [
						"REWRITE-RESPONSE"
					],
					"default": "REWRITE-RESPONSE",
					"example": "REWRITE-RESPONSE"
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
				"http_response_version": {
					"description": "可选参数；HTTP应答协议版本，all表示所有，http/1.0表示1.0版本的应答，http/1.1表示1.1版本的应答，默认为all",
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
				"http_response_state_code": {
					"description": "可选参数；HTTP应答码",
					"$ref": "/api/{common}.yaml#/definitions/config.str_match_component"
				},
				"http_response_header_rules": {
					"description": "可选参数；HTTP应答头部匹配规则列表",
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.http_header_match_component"
					},
					"maxItems": 4
				},
				"action": {
					"description": "必选参数；改写动作，modify-http-uri表示改写URI，insert-http-header表示插入头部，remove-http-header表示删除头部，modify-http-header表示改写头部，modify-http-body表示实体改写",
					"type": "string",
					"enum": [
						"INSERT-HTTP-HEADER",
						"REMOVE-HTTP-HEADER",
						"MODIFY-HTTP-HEADER",
						"MODIFY-HTTP-BODY",
						"HTTP-RESPONSE"
					]
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
				"http_response": {
					"description": "动作引用的自定义页面",
					"type": "string",
					"example": "200_OK"
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