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
		"/api/ad/v3/debug/dns/local-dns/block/": {
			"description": "对于LDNS地址进行封锁管理",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"local-dns"
				],
				"summary": "get all blocked local-dns",
				"description": "获取已经被手动封锁的全部LDNS地址",
				"operationId": "get_blocked_local_dns_list",
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
						"$ref": "#/responses/operation_debug_local_dns_block_list"
					}
				}
			},
			"post": {
				"tags": [
					"local-dns"
				],
				"summary": "create new local-dns block",
				"description": "手动封锁LDNS地址",
				"operationId": "add_local_dns_block",
				"parameters": [
					{
						"$ref": "#/parameters/BLOCK-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_local_dns_block"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug dns local-dns block",
					"description": "获取已经被手动封锁的全部LDNS地址配置"
				},
				{
					"command": "list debug dns local-dns block 127.0.0.1",
					"description": "获取已经被手动封锁的指定LDNS地址配置"
				},
				{
					"command": "create debug dns local-dns block source_address 127.0.0.1",
					"description": "创建source_address为127.0.0.1的被封锁LDNS地址配置"
				},
				{
					"command": " delete debug dns local-dns block 127.0.0.1",
					"description": "删除source_address为127.0.0.1的被封锁LDNS地址配置"
				}
			]
		},
		"/api/ad/v3/debug/dns/local-dns/block/{source_address}": {
			"description": "对于单个LDNS地址进行封锁管理",
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
					"$ref": "#/parameters/source_address"
				}
			],
			"get": {
				"tags": [
					"local-dns"
				],
				"summary": "get specific local-dns block",
				"description": "查看LDNS地址是否被封锁",
				"operationId": "get_local_dns_block",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_local_dns_block"
					}
				}
			},
			"delete": {
				"tags": [
					"local-dns"
				],
				"summary": "delete specific local-dns block",
				"description": "解封LDNS地址",
				"operationId": "delete_local_dns_block",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_local_dns_block"
					}
				}
			}
		}
	},
	"parameters": {
		"BLOCK-CONFIG": {
			"name": "BLOCK-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/debug.local_dns_block"
			}
		},
		"BLOCK-PROPERTY": {
			"name": "BLOCK-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/debug.local_dns_block"
			}
		},
		"source_address": {
			"name": "source_address",
			"description": "封锁的ip，格式为ipv4或者是ipv6",
			"in": "path",
			"required": true,
			"type": "string"
		}
	},
	"responses": {
		"operation_debug_local_dns_block_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.local_dns_block_list"
			}
		},
		"operation_debug_local_dns_block": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.local_dns_block"
			}
		}
	},
	"definitions": {
		"debug.local_dns_block_list": {
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
					"description": "封锁列表",
					"items": {
						"$ref": "#/definitions/debug.local_dns_block"
					}
				}
			}
		},
		"debug.local_dns_block": {
			"type": "object",
			"required": [
				"source_address"
			],
			"properties": {
				"source_address": {
					"description": "封锁的ip，格式为ipv4或者是ipv6",
					"type": "string",
					"example": "8.15.2.64"
				}
			}
		}
	}
}