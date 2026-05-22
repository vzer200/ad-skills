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
		"/api/ad/v3/slb/http-rewrite/all/": {
			"description": "查看所有HTTP改写策略的已有配置信息",
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
				"summary": "get all http-rewrite",
				"description": "查看所有HTTP改写策略的已有配置信息",
				"operationId": "get_http_rewrite_list",
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
						"$ref": "#/responses/operation_config_http_rewrite_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list slb http-rewrite all",
					"description": "查看所有HTTP改写配置"
				},
				{
					"command": "list slb http-rewrite all insert_header",
					"description": "查看insert_header的配置"
				}
			]
		},
		"/api/ad/v3/slb/http-rewrite/all/{name}": {
			"description": "查看指定的HTTP改写策略的配置信息",
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
				"summary": "get specific http-rewrite",
				"description": "查看指定的HTTP改写策略的配置信息",
				"operationId": "get_http_rewrite",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_rewrite_object"
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
			"description": "HTTP改写策略（请求改写）JSON格式配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_request"
			}
		},
		"HTTP-REWRITE-REQUEST-PROPERTY": {
			"name": "HTTP-REWRITE-REQUEST-PROPERTY",
			"in": "body",
			"required": true,
			"description": "HTTP改写策略（请求改写）JSON格式配置参数属性",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_request"
			}
		}
	},
	"responses": {
		"operation_config_http_rewrite_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite_list"
			}
		},
		"operation_config_http_rewrite_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_rewrite"
			}
		}
	},
	"definitions": {
		"config.http_rewrite_list": {
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
						"$ref": "#/definitions/config.http_rewrite"
					}
				}
			}
		},
		"config.http_rewrite": {
			"type": "object",
			"required": [
				"name",
				"action"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "url-sched"
				},
				"description": {
					"type": "string"
				},
				"type": {
					"type": "string",
					"enum": [
						"REWRITE-REQUEST",
						"REWRITE-RESPONSE"
					],
					"example": "rewrite-request"
				},
				"source_address": {
					"type": "object",
					"required": [
						"type"
					],
					"properties": {
						"type": {
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
							"type": "string",
							"description": "Format: {IP} | {IP-RANGE} | {IP-SUBNET}",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"type": "string",
							"example": "{custom_address_group}"
						}
					}
				},
				"http_request_method": {
					"type": "string",
					"enum": [
						"ALL",
						"GET",
						"POST"
					],
					"default": "ALL"
				},
				"http_request_version": {
					"type": "string",
					"enum": [
						"ALL",
						"HTTP/1.0",
						"HTTP/1.1"
					],
					"default": "ALL"
				},
				"http_request_uri_rule": {
					"description": "可选参数；http请求请求URI规则",
					"$ref": "/api/{common}.yaml#/definitions/config.str_match_component"
				},
				"http_request_header_rules": {
					"description": "可选参数；http请求头部规则",
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.http_header_match_component"
					}
				},
				"ssl_version_rule": {
					"type": "string",
					"enum": [
						"V1",
						"V2",
						"V3"
					],
					"default": "ALL"
				},
				"ssl_variable_rules": {
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.ssl_match_component"
					}
				},
				"http_response_version": {
					"type": "string",
					"enum": [
						"ALL",
						"HTTP/1.0",
						"HTTP/1.1"
					],
					"default": "ALL"
				},
				"http_response_state_code": {
					"$ref": "/api/{common}.yaml#/definitions/config.str_match_component"
				},
				"http_response_header_rules": {
					"type": "array",
					"items": {
						"$ref": "/api/{common}.yaml#/definitions/config.http_header_match_component"
					}
				},
				"action": {
					"type": "string",
					"enum": [
						"MODIFY-HTTP-URI",
						"INSERT-HTTP-HEADER",
						"REMOVE-HTTP-HEADER",
						"MODIFY-HTTP-HEADER",
						"MODIFY-HTTP-BODY",
						"REPLACE-HTTP-CONTENT"
					]
				},
				"uri_operation": {
					"type": "object",
					"required": [
						"pattern"
					],
					"properties": {
						"pattern": {
							"type": "string",
							"example": "http://www.testA.com"
						},
						"replace": {
							"type": "string",
							"example": "https://www.testB.com"
						}
					}
				},
				"status_operation": {
					"type": "object",
					"properties": {
						"pattern": {
							"type": "string",
							"description": "",
							"example": ""
						},
						"replace": {
							"type": "string",
							"description": "",
							"example": ""
						}
					}
				},
				"header_operation": {
					"type": "object",
					"required": [
						"header"
					],
					"properties": {
						"header": {
							"type": "string",
							"description": "Use to match the HTTP Header that will be rewrite on INSERT/REMOVE/MODIFY operation.",
							"example": "X-FORWARDED-FOR"
						},
						"pattern": {
							"type": "string",
							"description": "",
							"example": ""
						},
						"replace": {
							"type": "string",
							"description": "",
							"example": "${client_ip}"
						}
					}
				},
				"body_operation": {
					"type": "object",
					"required": [
						"pattern"
					],
					"properties": {
						"pattern": {
							"type": "string",
							"example": "http://www.testA.com"
						},
						"replace": {
							"type": "string",
							"example": "https://www.testB.com"
						}
					}
				},
				"rewrite_encode": {
					"type": "string",
					"enum": [
						"PLAIN",
						"URL-ENCODE",
						"BASE64-ENCODE"
					],
					"default": "PLAIN"
				},
				"replace_http_content": {
					"type": "string",
					"default": "302 Moved Temporarily"
				},
				"netns": {
					"type": "string",
					"default": "default"
				}
			}
		}
	}
}