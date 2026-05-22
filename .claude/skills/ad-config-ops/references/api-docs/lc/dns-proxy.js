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
		"/api/ad/v3/lc/dns-proxy": {
			"description": "DNS代理配置管理操作",
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
					"dns-proxy"
				],
				"summary": "get dns-proxy",
				"description": "查看DNS代理配置信息",
				"operationId": "get_dns_proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_proxy_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-proxy"
				],
				"summary": "replace dns-proxy",
				"description": "更新DNS代理配置",
				"operationId": "replace_dns_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_proxy_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-proxy"
				],
				"summary": "modify dns-proxy",
				"description": "更新DNS代理配置",
				"operationId": "edit_dns_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PROXY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_proxy_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": " modify lc dns-proxy state enable dns_servers add [ { link wan1 server 1.1.1.100 weight 10 } { link wan2 server 2.2.2.100 weight 20 } ]",
					"description": "启用DNS代理，添加2个DNS服务器，1.1.1.100绑定链路wan1，权重为10， 2.2.2.100绑定链路wan2，权重为20。"
				},
				{
					"command": " list lc dns-proxy",
					"description": "查看DNS代理的配置信息"
				}
			]
		}
	},
	"parameters": {
		"DNS-PROXY-CONFIG": {
			"name": "DNS-PROXY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_proxy"
			}
		},
		"DNS-PROXY-PROPERTY": {
			"name": "DNS-PROXY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_proxy"
			}
		}
	},
	"responses": {
		"operation_config_dns_proxy_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_proxy"
			}
		}
	},
	"definitions": {
		"config.dns_proxy": {
			"type": "object",
			"properties": {
				"state": {
					"type": "string",
					"description": "可选参数；DNS代理的状态，可选值有：enalbe（启用），disable（禁用）；默认为禁用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"proxy_source_address": {
					"description": "可选参数；代理内网网段，可选值有：all（所有网段），subnet（部分网段）；默认为所有网段。",
					"type": "string",
					"enum": [
						"ALL",
						"SUBNET"
					],
					"default": "ALL",
					"example": "SUBNET"
				},
				"proxy_source_address_subnet": {
					"description": "可选参数；网段列表，类型为数组。",
					"type": "array",
					"maxItems": 16,
					"items": {
						"type": "string",
						"description": "可选参数；IP网段，必须为子网格式，如1.1.1.0/24。",
						"example": "2.2.2.0/24"
					},
					"example": [
						"1.1.1.0/24",
						"2.2.2.0/24"
					]
				},
				"proxy_destination": {
					"type": "string",
					"description": "可选参数；代理目标范围，可选的有all（全部dns请求）、link-dns-servers（dns服务器列表）、pre-rule-and_intranet-record(指定域名)，默认为全部dns请求。",
					"enum": [
						"ALL",
						"LINK-DNS-SERVERS",
						"PRE-RULE-AND-INTRANET-RECORD"
					],
					"default": "LINK-DNS-SERVERS"
				},
				"listen_ipv4": {
					"type": "string",
					"description": "可选参数；IPv4监听地址，如1.1.1.1。",
					"example": "1.1.1.1"
				},
				"listen_ipv6": {
					"type": "string",
					"description": "可选参数；IPv6监听地址，如2001::78。",
					"example": "2001::78"
				},
				"listen_port": {
					"type": "integer",
					"description": "可选参数；监听端口，默认为5353。",
					"default": 5353,
					"example": 5353,
					"minimum": 1,
					"maximum": 65535
				},
				"dns_cache": {
					"type": "object",
					"description": "可选参数；DNS缓存配置。",
					"properties": {
						"state": {
							"type": "string",
							"description": "可选参数；DNS缓存状态，可选值有：enalbe（启用），disable（禁用）；默认为禁用。",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"age": {
							"type": "integer",
							"description": "可选参数；DNS缓存时间，单位为秒，默认是7200。",
							"default": 7200,
							"example": 7200,
							"maximum": 172800,
							"minimum": 1
						}
					}
				},
				"persist": {
					"type": "string",
					"description": "可选参数；会话保持状态，可选值有：enalbe（启用），disable（禁用）；默认为启用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"concurrent_query": {
					"type": "string",
					"description": "可选参数；并发查询状态，可选值有：enalbe（启用），disable（禁用）；默认为禁用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"schedule_policy": {
					"type": "string",
					"description": "可选参数；DNS服务器选择策略，可选值有：round-robin（轮询）、weighted_round-robin（加权轮询）、weighted-least-flow（加权最小流量）、priority（优先级）；默认为轮询。",
					"enum": [
						"ROUND-ROBIN",
						"WEIGHTED-ROUND-ROBIN",
						"WEIGHTED-LEAST-FLOW",
						"PRIOROTY"
					],
					"default": "ROUND-ROBIN",
					"example": "ROUND-ROBIN"
				},
				"pre_rule": {
					"type": "string",
					"description": "可选参数；优先代理策略状态，可选值有：enalbe（启用），disable（禁用）；默认为禁用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"link_busy_protect": {
					"type": "string",
					"description": "可选参数；链路繁忙保护状态，可选值有：enalbe（启用），disable（禁用）；默认为禁用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"health_detect_domains": {
					"type": "array",
					"description": "可选参数；监视域名列表，类型为数组。",
					"maxItems": 8,
					"minItems": 0,
					"items": {
						"type": "string",
						"description": "可选参数；监视域名，如www.baidu.com。"
					},
					"example": [
						"www.baidu.com",
						"www.sina.com.cn"
					]
				},
				"dns_6to4_query": {
					"type": "object",
					"description": "可选参数；DNS64配置。",
					"properties": {
						"state": {
							"type": "string",
							"description": "可选参数；DNS64配置的状态，可选值有：enalbe（启用），disable（禁用）；默认为禁用。",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"ipv6_address_prefix": {
							"type": "string",
							"description": "可选参数；DNS64配置的IPv6前缀，默认为64:ff9b::。",
							"default": "64:ff9b::",
							"example": "64:ff9b::"
						},
						"method": {
							"type": "string",
							"description": "可选参数；DNS64配置的代理方式，可选值有：response-first(响应优先)、aaaa-record-first（AAAA记录优先）、a-record-first(仅A记录)；默认为响应优先。",
							"enum": [
								"RESPONSE-FIRST",
								"AAAA-RECORD-FIRST",
								"A-RECORD-ONLY"
							],
							"default": "RESPONSE-FIRST",
							"example": "RESPONSE-FIRST"
						},
						"response_rewrite": {
							"type": "string",
							"description": "可选参数；DNS64配置的附加域改写，可选值有：ipv4-only(仅IPv4)、ipv6-only(仅IPv6)、any(所有)、disable（禁用）；默认为所有。",
							"enum": [
								"IPV4-ONLY",
								"IPV6-ONLY",
								"ANY",
								"DISABLE"
							],
							"default": "ANY",
							"example": "ANY"
						}
					}
				},
				"dns_servers": {
					"type": "array",
					"description": "可选参数；DNS代理的DSN服务器列表，类型为数组。",
					"maxItems": 200,
					"items": {
						"type": "object",
						"description": "可选参数；DNS代理的DNS服务器，需要配置链路、DNS服务器和权重。",
						"required": [
							"link",
							"weight"
						],
						"properties": {
							"type": {
								"description": "手动生成还是自动生成的",
								"type": "string",
								"enum": [
									"DYNAMIC",
									"MANUAL"
								],
								"default": "MANUAL"
							},
							"link": {
								"type": "string",
								"description": "可选参数；DNS服务器绑定的链路，如wan1。",
								"example": "wan_1"
							},
							"server": {
								"type": "string",
								"description": "可选参数；DNS服务器的地址，如8.8.8.8。",
								"example": "192.168.1.1"
							},
							"weight": {
								"type": "integer",
								"description": "可选参数；DNS服务器的权重，默认为10。",
								"default": 10,
								"example": 10,
								"maximum": 100,
								"minimum": 1
							}
						}
					}
				}
			}
		}
	}
}