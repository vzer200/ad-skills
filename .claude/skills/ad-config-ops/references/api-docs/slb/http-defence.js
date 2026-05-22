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
		"/api/ad/v3/slb/http-defence/": {
			"description": "新建、查看HTTP防护策略配置",
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
					"http-defence"
				],
				"summary": "get all http-defence",
				"description": "查看当前已有的HTTP防护策略配置信息",
				"operationId": "get_http_defence_list",
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
						"$ref": "#/responses/operation_config_http_defence_list"
					}
				}
			},
			"post": {
				"tags": [
					"http-defence"
				],
				"summary": "create new http-defence",
				"description": "新建一个HTTP防护策略配置",
				"operationId": "add_http_defence_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-DEFENCE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_defence_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb http-defence httpdef description 防护策略 slow_attack_defence { state enable connection_timeout 10 request_timeout 20 minimum_receive_rate_byte 50 } http_flood_defence { state enable policy header-insert vs_common_rule { request_rate_threshold 100 request_increase_percent_threshold 600 } url_rules [ { url_pattern_wildcard /index.html url_pattern_case_sensitive enable request_rate_threshold 60 request_increase_percent_threshold 70 } ] } action_alert enable  action_block enable",
					"description": "新建HTTP防护策略httpdef，启用慢速攻击防护，连接超时时间设置为10s，请求超时时间设置为20s，最小接收速率为50byte/s；启用泛洪攻击防护，采用插入头部的方式进行防护，虚拟服务每秒请求个数阈值设置为100，请求个数增长率阈值设置为600%，针对/index.html每秒请求个数阈值设置为60，请求个数增长率阈值设置为70%，防护方式包括告警和拦截"
				},
				{
					"command": "modify slb http-defence httpdef action_alert disable",
					"description": "禁用HTTP防护策略httpdef的攻击告警"
				},
				{
					"command": "list slb http-defence httpdef",
					"description": "查看HTTP防护策略httpdef的配置信息"
				},
				{
					"command": "delete slb http-defence httpdef",
					"description": "删除HTTP防护策略httpdef"
				}
			]
		},
		"/api/ad/v3/slb/http-defence/{name}": {
			"description": "新建、查看、修改、删除指定的HTTP防护策略配置",
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
					"http-defence"
				],
				"summary": "get specific http-defence",
				"description": "查看指定的HTTP防护策略配置",
				"operationId": "get_http_defence",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_defence_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"http-defence"
				],
				"summary": "create new http-defence",
				"description": "新建指定的HTTP防护策略配置",
				"operationId": "create_http_defence",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-DEFENCE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_defence_object"
					}
				}
			},
			"put": {
				"tags": [
					"http-defence"
				],
				"summary": "replace specific http-defence",
				"description": "修改指定的HTTP防护策略配置",
				"operationId": "replace_http_defence",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-DEFENCE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_defence_object"
					}
				}
			},
			"patch": {
				"tags": [
					"http-defence"
				],
				"summary": "modify specific http-defence",
				"description": "修改指定的HTTP防护策略配置",
				"operationId": "edit_http_defence",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-DEFENCE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_defence_object"
					}
				}
			},
			"delete": {
				"tags": [
					"http-defence"
				],
				"summary": "delete specific http-defence",
				"description": "删除指定的HTTP防护策略配置",
				"operationId": "delete_http_defence",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_defence_object"
					}
				}
			}
		}
	},
	"parameters": {
		"HTTP-DEFENCE-CONFIG": {
			"name": "HTTP-DEFENCE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.http_defence"
			}
		},
		"HTTP-DEFENCE-PROPERTY": {
			"name": "HTTP-DEFENCE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.http_defence"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "config virtual service name",
			"required": true
		}
	},
	"responses": {
		"operation_config_http_defence_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_defence_list"
			}
		},
		"operation_config_http_defence_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_defence"
			}
		}
	},
	"definitions": {
		"config.http_defence_list": {
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
						"$ref": "#/definitions/config.http_defence"
					}
				}
			}
		},
		"config.http_defence": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定HTTP防护策略的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "http_slow_ddos"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"slow_attack_defence": {
					"description": "可选参数；慢速攻击防护相关属性，默认启用。",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；慢速攻击的配置开关，enable表示启用，disable表示禁用；默认为enable。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"connection_timeout": {
							"description": "可选参数；设置连接超时时间，取值范围为[1,65535]，默认为1800，单位s。",
							"type": "integer",
							"default": 1800,
							"minimum": 1,
							"maximum": 65535,
							"example": 1800
						},
						"request_timeout": {
							"description": "可选参数；设置请求超时时间，取值范围为[1,65535]，默认为300，单位s。",
							"type": "integer",
							"default": 300,
							"minimum": 1,
							"maximum": 65535,
							"example": 300
						},
						"minimum_receive_rate_byte": {
							"description": "可选参数；设置最小传输速率时，取值范围为[1,65535]，默认为100，单位byte/s。",
							"type": "integer",
							"default": 100,
							"minimum": 1,
							"maximum": 65535,
							"example": 100
						}
					},
					"required": []
				},
				"http_flood_defence": {
					"description": "可选参数；泛洪攻击防护相关属性，默认启用。",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；泛洪攻击的配置开关，enable表示启用，disable表示禁用；默认为enable。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"policy": {
							"description": "可选参数；攻击防护策略，header-insert表示插入HTTP头部，js-inject表示注入JS脚本，默认为header-inert。",
							"type": "string",
							"enum": [
								"HEADER-INSERT",
								"JS-INJECT"
							],
							"default": "HEADER-INSERT",
							"example": "JS-INJECT"
						},
						"vs_common_rule": {
							"description": "可选参数；指定虚拟服务通用的防护条件。",
							"type": "object",
							"properties": {
								"request_rate_threshold": {
									"description": "可选参数；指定每秒请求个数阈值，默认为500。",
									"type": "integer",
									"default": 500,
									"minimum": 1,
									"maximum": 4294967295,
									"example": 500
								},
								"request_increase_percent_threshold": {
									"description": "可选参数；指定每秒请求速率增长率，默认为1000，单位%。",
									"type": "integer",
									"default": 1000,
									"minimum": 1,
									"maximum": 65535,
									"example": 1000
								}
							},
							"required": []
						},
						"url_rules": {
							"description": "URL匹配条件列表",
							"type": "array",
							"items": {
								"description": "可选参数；指定URL的防护条件。",
								"type": "object",
								"required": [
									"url_pattern_wildcard",
									"request_rate_threshold",
									"request_increase_percent_threshold"
								],
								"properties": {
									"url_pattern_wildcard": {
										"description": "必选参数；指定待防护的URL。",
										"type": "string",
										"maxLength": 255,
										"minLength": 1,
										"example": "image*"
									},
									"url_pattern_case_sensitive": {
										"description": "必选参数；区分大小写的开关，eanble表示区分大小写，disable表示不区分大小写，默认为disable。",
										"type": "string",
										"enum": [
											"ENABLE",
											"DISABLE"
										],
										"default": "DISABLE",
										"example": "ENABLE"
									},
									"request_rate_threshold": {
										"description": "必选参数；指定每秒请求个数阈值，默认为500。",
										"type": "integer",
										"minimum": 1,
										"maximum": 4294967295,
										"example": 500
									},
									"request_increase_percent_threshold": {
										"description": "必选参数；指定每秒请求速率增长率，默认为1000，单位%。",
										"type": "integer",
										"minimum": 1,
										"maximum": 65535,
										"example": 1000
									}
								}
							},
							"maxItems": 64
						}
					},
					"required": []
				},
				"action_alert": {
					"description": "可选参数，攻击告警的开关，enable表示启用告警，disable表示禁用告警，默认为enable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"action_block": {
					"description": "可选参数，攻击拦截的开关，enable表示启用拦截，disable表示禁用拦截，默认为disable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				}
			}
		}
	}
}