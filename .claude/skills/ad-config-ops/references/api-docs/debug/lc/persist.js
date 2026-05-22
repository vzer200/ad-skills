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
		"/api/ad/v3/debug/lc/persist/": {
			"description": "智能能路由会话保持操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/address"
				}
			],
			"get": {
				"tags": [
					"persist"
				],
				"summary": "get persist",
				"description": "查询智能能路由会话保持",
				"operationId": "get_persist",
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
						"$ref": "#/responses/operation_debug_persist_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug lc persist address 1.2.3.4",
					"description": "查询ip地址为1.2.3.4的智能能路由会话保持记录"
				}
			]
		},
		"/api/ad/v3/debug/lc/persist/clear": {
			"description": "智能能路由会话保持操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/persist_clear_parameter"
				}
			],
			"post": {
				"description": "清除智能能路由会话保持",
				"tags": [
					"persist"
				],
				"summary": "clear persist",
				"operationId": "clear_persist"
			},
			"__sfcli_example__": [
				{
					"command": "run debug lc persist clear destination_address 1.1.1.1 source_address 2.2.2.2",
					"description": "清除目的地址是1.1.1.1源地址是2.2.2.2的智能路由会话保持记录"
				}
			]
		}
	},
	"parameters": {
		"address": {
			"name": "address",
			"in": "query",
			"type": "string",
			"description": "Format: {IP} | {IP-SUBNET}",
			"required": true,
			"example": "192.168.100.234"
		},
		"persist_clear_parameter": {
			"name": "persist_clear_parameter",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.persist_clear"
			}
		}
	},
	"responses": {
		"operation_debug_persist_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.persist_list"
			}
		}
	},
	"definitions": {
		"debug.persist_list": {
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
					"description": "会话保持列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.persist"
					}
				}
			}
		},
		"debug.persist": {
			"type": "object",
			"properties": {
				"source_address": {
					"type": "string",
					"description": "源ip地址，必须为单个IPv4,IPv6地址或IPv4,IPv6子网",
					"example": "192.168.1.12/24"
				},
				"destination_address": {
					"type": "string",
					"description": "目的地址，必须为单个IPv4,IPv6地址或IPv4,IPv6子网",
					"example": "200.200.0.123/24",
					"required": true
				},
				"outbound_link": {
					"description": "出接口",
					"type": "string",
					"example": "WAN_2"
				},
				"timeout": {
					"description": "智能路由会话保持的超时时间",
					"type": "float",
					"example": 102.1
				}
			}
		},
		"debug.persist_clear": {
			"type": "object",
			"properties": {
				"source_address": {
					"type": "string",
					"description": "源ip地址，必须为单个IPv4,IPv6地址或IPv4,IPv6子网",
					"example": "192.168.1.12/24",
					"required": true
				},
				"destination_address": {
					"type": "string",
					"description": "源ip地址，必须为单个IPv4,IPv6地址或IPv4,IPv6子网",
					"example": "200.200.0.123/24",
					"required": true
				}
			}
		}
	}
}