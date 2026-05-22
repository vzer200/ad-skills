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
		"/api/ad/v3/slb/persist/source-ip/": {
			"description": "新建、查看会话保持（SourceIP）配置",
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
				"summary": "get all persist-source-ip",
				"description": "查看已有会话保持（SourceIP）配置信息列表",
				"operationId": "get_persist_source_ip_list",
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
						"$ref": "#/responses/operation_config_persist_source_ip_list"
					}
				}
			},
			"post": {
				"tags": [
					"persist"
				],
				"summary": "create new persist-source-ip",
				"description": "新建会话保持（SourceIP）配置",
				"operationId": "add_persist_source_ip_list",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SOURCE-IP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_source_ip_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb persist source-ip srcip source_ipv4_netmask_length 32 source_ipv6_prefix_length 128 record_scope global busy_protect enable",
					"description": "新建源地址会话保持srcip,作用域为全局,启用繁忙保护,ipv4掩码为32,ipv6掩码为128"
				},
				{
					"command": "modify slb persist source-ip srcip source_ipv4_netmask_length 255.255.255.0",
					"description": "修改源IP会话保持的IPv4的掩码为24位"
				},
				{
					"command": "list slb persist source-ip srcip",
					"description": "查看会话保持srcip的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/persist/source-ip/{name}": {
			"description": "查看、新建、修改、删除会话保持（SourceIP）配置",
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
				"summary": "get specific persist-source-ip",
				"description": "查看指定会话保持（SourceIP）配置",
				"operationId": "get_persist_source_ip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_source_ip_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"persist"
				],
				"summary": "create new persist-source-ip",
				"description": "新建会话保持（SourceIP）配置",
				"operationId": "create_persist_source_ip",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SOURCE-IP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_source_ip_object"
					}
				}
			},
			"put": {
				"tags": [
					"persist"
				],
				"summary": "replace specific persist-source-ip",
				"description": "修改指定会话保持（SourceIP）配置",
				"operationId": "replace_persist_source_ip",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SOURCE-IP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_source_ip_object"
					}
				}
			},
			"patch": {
				"tags": [
					"persist"
				],
				"summary": "modify specific persist-source-ip",
				"description": "修改指定会话保持（SourceIP）配置",
				"operationId": "edit_persist_source_ip",
				"parameters": [
					{
						"$ref": "#/parameters/PERSIST-SOURCE-IP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_source_ip_object"
					}
				}
			},
			"delete": {
				"tags": [
					"persist"
				],
				"summary": "delete specific persist-source-ip",
				"description": "删除指定会话保持（SourceIP）配置",
				"operationId": "delete_persist_source_ip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_persist_source_ip_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PERSIST-SOURCE-IP-CONFIG": {
			"name": "PERSIST-SOURCE-IP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.persist_source_ip"
			}
		},
		"PERSIST-SOURCE-IP-PROPERTY": {
			"name": "PERSIST-SOURCE-IP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.persist_source_ip"
			}
		}
	},
	"responses": {
		"operation_config_persist_source_ip_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_source_ip_list"
			}
		},
		"operation_config_persist_source_ip_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.persist_source_ip"
			}
		}
	},
	"definitions": {
		"config.persist_source_ip_list": {
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
						"$ref": "#/definitions/config.persist_source_ip"
					}
				}
			}
		},
		"config.persist_source_ip": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定会话保持的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "cookie_passive"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。",
					"example": ""
				},
				"type": {
					"description": "只读字段;指定会话保持的类型",
					"type": "string",
					"enum": [
						"SOURCE-IP"
					],
					"default": "SOURCE-IP"
				},
				"source_ipv4_netmask_length": {
					"description": "可选参数;指定IPv4源地址的掩码,支持IPv4掩码格式和数字,默认为32",
					"type": "string",
					"default": "32",
					"example": "32"
				},
				"source_ipv6_prefix_length": {
					"description": "可选参数;指定IPv6源地址的掩码,支持IPv6掩码格式和数字,默认为128",
					"type": "string",
					"default": "128",
					"example": "128"
				},
				"timeout": {
					"description": "可选参数；设置会话保持超时时间。取值范围为[0,31536000],默认为86400",
					"type": "integer",
					"default": 180,
					"maximum": 31536000,
					"minimum": 0,
					"example": 86400
				},
				"busy_protect": {
					"description": "可选参数；指定繁忙保护的开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"record_scope": {
					"description": "可选参数;指定会话保持的作用范围,pool表示在池内生效,vip表示访问相同vip均生效,global表示全局生效,默认为pool",
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