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
		"/api/ad/v4/dns/gslb/{dns_config_area}/domain-map/": {
			"description": "域名映射配置管理操作",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"domain_map"
				],
				"summary": "get all domain_map",
				"description": "查看域名映射",
				"operationId": "get_domain_map_list",
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
						"$ref": "#/responses/operation_config_domain_map_list"
					}
				}
			},
			"post": {
				"tags": [
					"domain_map"
				],
				"summary": "create new domain_map",
				"description": "创建域名映射",
				"operationId": "add_domain_map_list",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-MAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_map_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"domain_map"
				],
				"summary": "modify domain_map",
				"description": "修改域名映射",
				"operationId": "edit_domain_map_list",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-MAP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_map_list"
					}
				}
			}
		},
		"/api/ad/v4/dns/gslb/{dns_config_area}/domain-map/{name}": {
			"description": "dns映射配置管理操作",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"domain_map"
				],
				"summary": "get specific domain_map",
				"description": "查看指定已有的域名映射",
				"operationId": "get_domain_map",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_map_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"domain_map"
				],
				"summary": "create new domain_map",
				"description": "创建域名映射",
				"operationId": "create_domain_map",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-MAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_map_object"
					}
				}
			},
			"put": {
				"tags": [
					"domain_map"
				],
				"summary": "replace specific domain_map",
				"description": "修改指定已有的域名映射",
				"operationId": "replace_domain_map",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-MAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_map_object"
					}
				}
			},
			"patch": {
				"tags": [
					"domain_map"
				],
				"summary": "modify specific domain_map",
				"description": "增量指定已有的修改域名映射",
				"operationId": "edit_domain_map",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-MAP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_map_object"
					}
				}
			},
			"delete": {
				"tags": [
					"domain_map"
				],
				"summary": "delete specific domain_map",
				"description": "删除指定已有的域名映射",
				"operationId": "delete_domain_map",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_map_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns gslb global domain_map global_map",
					"description": "查看全局域名映射配置，映射名称为：global_map"
				},
				{
					"command": "list dns gslb local domain_map local_map",
					"description": "查看本地域名映射配置，映射名称为：local_map"
				},
				{
					"command": "create dns gslb global domain-map \"global_map\" ttl 60 type \"ipv6\" state \"enable\" edns_client_subnet \"disable\" method \"topology\" persist 300 domains [ \"www.test.com\" ] vip_pools [ { vip_pool \"ipv6测试\" }  ] topologys [ { ldns_address_group \"sss\" vip_pool \"ipv6测试\" state \"enable\" }  ]",
					"description": "创建全局域名映射配置，映射名称为：global_map 域名：www.test.com 调度策略：静态就近性 会话保持：300 ttl 60 引用的虚拟IP池：ipv6测试 静态就近性策略：[ { LDNS集合 sss 虚拟IP池 ipv6测试 } ]"
				},
				{
					"command": "create dns gslb local domain-map \"local_map\" ttl 60 type \"ipv4\" state \"enable\" edns_client_subnet \"disable\" method \"round-robin\" persist 300 domains [ \"www.a.com\" ] vip_pools [ { vip_pool \"local_pool\" }  ]",
					"description": "创建本地域名映射配置，映射名称为：local_map 域名：www.a.com ttl 60 状态：启用 ECS优先：启用 调度策略：轮询 会话保持：300 引用的虚拟IP池：local_pool"
				},
				{
					"command": "modify dns gslb global domain_map global_map name new_global_map description modify_global domains add [ new_global.com ] method round-robin persist 300 ttl 120 state disable type ipv4 vip_pools add [ global_new_pool ]",
					"description": "修改全局域名映射配置，修改映射名称为：new_global_map 添加域名：new_global.com 修改调度策略为：轮询 修改会话保持：300 添加引用的虚拟IP池：global_new_pool"
				},
				{
					"command": "modify dns gslb local domain_map local_map name new_local_map description modify_local domains add [ new_local.com ] method round-robin persist 300 ttl 120 state disable type ipv4 vip_pools add [ local_new_pool ]",
					"description": "修改本地域名映射配置，修改映射名称为：new_local_map 添加域名：new_local.com 修改调度策略为：轮询 修改会话保持：300 添加引用的虚拟IP池：local_new_pool"
				},
				{
					"command": "delete dns gslb global domain_map new_global_map",
					"description": "删除全局域名映射配置，映射名称为：new_global_map"
				},
				{
					"command": "delete dns gslb local domain_map new_local_map",
					"description": "删除本地域名映射配置，映射名称为：new_local_map"
				}
			]
		}
	},
	"parameters": {
		"DOMAIN-MAP-CONFIG": {
			"name": "DOMAIN-MAP-CONFIG",
			"in": "body",
			"required": true,
			"description": "域名映射配置",
			"schema": {
				"$ref": "#/definitions/config.domain_map"
			}
		},
		"DOMAIN-MAP-PROPERTY": {
			"name": "DOMAIN-MAP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "域名映射配置属性",
			"schema": {
				"$ref": "#/definitions/config.domain_map"
			}
		},
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "本地和全局区域",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_config_domain_map_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.domain_map_list"
			}
		},
		"operation_config_domain_map_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.domain_map"
			}
		}
	},
	"definitions": {
		"config.domain_map_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "项目数量最大值",
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
					"description": "页面大小",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "项目长度",
					"type": "integer",
					"example": 8
				},
				"items": {
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.domain_map"
					}
				}
			}
		},
		"config.domain_map": {
			"type": "object",
			"required": [
				"name",
				"domains",
				"vip_pools"
			],
			"properties": {
				"name": {
					"description": "域名映射名称，不冲突",
					"type": "string",
					"example": "abc.com"
				},
				"description": {
					"description": "域名映射描述信息",
					"type": "string"
				},
				"state": {
					"description": "域名映射状态信息，默认ENABLE",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"type": {
					"description": "域名映射类型，默认IPV4",
					"type": "string",
					"enum": [
						"IPV4",
						"IPV6"
					],
					"default": "IPV4",
					"example": "IPV4"
				},
				"domains": {
					"description": "域名策略列表",
					"type": "array",
					"items": {
						"description": "域名名称",
						"type": "string",
						"example": "www.abc.com"
					},
					"maxItems": 200,
					"minItems": 1,
					"example": [
						"www.abc.com",
						"mail.abc.com",
						"bbs.abc.com"
					]
				},
				"method": {
					"description": "域名映射调度策略，有轮询、加权轮询、静态就近性、优先级 默认为TOPOLOGY",
					"type": "string",
					"enum": [
						"ROUND-ROBIN",
						"WEIGHTED-ROUND-ROBIN",
						"TOPOLOGY",
						"PRIORITY"
					],
					"default": "TOPOLOGY",
					"example": "TOPOLOGY"
				},
				"edns_client_subnet": {
					"type": "string",
					"description": "客户端优先，启用时，优先使用客户端的真实源IP。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"persist": {
					"description": "会话保持时间，默认300",
					"type": "integer",
					"default": 300,
					"example": 300,
					"minimum": 0,
					"maximum": 86400
				},
				"ttl": {
					"description": "TTL值，必须为0~86400之间的整数",
					"type": "integer",
					"default": 60,
					"minimum": 0,
					"maximum": 86400
				},
				"vip_pools": {
					"description": "虚拟IP池列表",
					"type": "array",
					"items": {
						"description": "虚拟IP池",
						"type": "object",
						"required": [
							"vip_pool"
						],
						"properties": {
							"vip_pool": {
								"description": "虚拟IP池，必须已存在",
								"type": "string",
								"example": "web_vpool"
							},
							"weight": {
								"description": "权重",
								"type": "integer",
								"default": 10,
								"example": 10,
								"minimum": 1,
								"maximum": 100
							},
							"priority": {
								"description": "优先级",
								"type": "integer",
								"default": 10,
								"minimum": 1,
								"maximum": 100
							}
						}
					},
					"maxItems": 8,
					"minItems": 1
				},
				"topologys": {
					"description": "静态就近性列表配置",
					"type": "array",
					"items": {
						"description": "静态就近性列表",
						"type": "object",
						"properties": {
							"vip_pool": {
								"description": "虚拟IP池，必须已存在",
								"type": "string",
								"example": "web_vpool"
							},
							"ldns_address_group": {
								"description": "LDNS集合名称，必须已存在",
								"type": "string",
								"example": "web_vgroup"
							},
							"state": {
								"description": "本条静态就近性配置启禁用，默认ENABLE",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "ENABLE",
								"example": "ENABLE"
							}
						}
					},
					"maxItems": 1000,
					"minItems": 0
				}
			}
		}
	}
}