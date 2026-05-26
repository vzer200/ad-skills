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
		"/api/ad/v3/debug/net/session/": {
			"description": "系统会话记录操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/address"
				},
				{
					"$ref": "#/parameters/srcaddr"
				},
				{
					"$ref": "#/parameters/dstaddr"
				},
				{
					"$ref": "#/parameters/srcport"
				},
				{
					"$ref": "#/parameters/dstport"
				},
				{
					"$ref": "#/parameters/protocol"
				},
				{
					"$ref": "#/parameters/virtual_service"
				},
				{
					"$ref": "#/parameters/session_id"
				}
			],
			"get": {
				"tags": [
					"session"
				],
				"summary": "retrieve session",
				"description": "查询系统会话记录",
				"operationId": "retrieve_session",
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
						"$ref": "#/responses/operation_debug_session_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug net session dstport 8888 protocol 17 virtual_service abc session_id 123",
					"description": "查询目的端口为8888，协议类型为tcp，虚拟服务为abc，session_id为123连接会话"
				}
			]
		},
		"/api/ad/v3/debug/net/session/clear": {
			"description": "系统会话记录操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/session_clear_parameter"
				}
			],
			"post": {
				"tags": [
					"session"
				],
				"summary": "remove session",
				"description": "清理系统会话记录",
				"operationId": "remove_session"
			},
			"__sfcli_example__": [
				{
					"command": "run debug net session clear srcaddr 192.168.1.1 srcport 8888 dstaddr 192.168.2.2 dstport 9999 protocol tcp virtual_service abc session_id 123",
					"description": "连接会话查询，指定源IP为192.168.1.1，源端口为8888，目的IP为192.168.2.2，目的端口为8888，协议类型为tcp，虚拟服务为abc，session_id为123"
				}
			]
		}
	},
	"parameters": {
		"address": {
			"name": "address",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "192.168.100.234",
			"description": "ip地址"
		},
		"srcaddr": {
			"name": "srcaddr",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "192.168.100.234-192.168.100.255",
			"description": "可选参数；指定源IP地址，可以为单个IP地址，IP地址范围"
		},
		"dstaddr": {
			"name": "dstaddr",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "192.168.100.234-192.168.100.255",
			"description": "可选参数；指定目的IP地址，可以为单个IP地址，IP地址范围"
		},
		"srcport": {
			"name": "srcport",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "1000-1008",
			"description": "可选参数；指定源端口，可以为单个端口，端口范围"
		},
		"dstport": {
			"name": "dstport",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "1000-1008",
			"description": "可选参数；指定目的端口，可以为单个端口，端口范围"
		},
		"protocol": {
			"name": "protocol",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "17 | TCP",
			"description": "可选参数；指定协议类型，可以为协议名称，协议号"
		},
		"virtual_service": {
			"name": "virtual_service",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "web_portal_442",
			"description": "可选参数；指定虚拟服务"
		},
		"session_id": {
			"name": "session_id",
			"in": "query",
			"type": "integer",
			"required": false,
			"example": 10513,
			"description": "可选参数；指定session_id"
		},
		"session_clear_parameter": {
			"name": "session_clear_parameter",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.session_clear_parameter"
			}
		}
	},
	"responses": {
		"operation_debug_session_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.session_list"
			}
		}
	},
	"definitions": {
		"debug.session_list": {
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
					"description": "session列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.session"
					}
				}
			}
		},
		"debug.session": {
			"type": "object",
			"properties": {
				"client_source_address": {
					"type": "string",
					"example": "10.0.1.2",
					"description": "客户端源IP地址，可以为单个IP地址，IP地址范围"
				},
				"client_source_port": {
					"type": "integer",
					"example": 11568,
					"description": "客户端源端口，可以为单个端口，端口范围"
				},
				"client_destination_address": {
					"type": "string",
					"example": "2.20.1.89",
					"description": "客户端目的IP地址，可以为单个IP地址，IP地址范围"
				},
				"client_destination_port": {
					"type": "integer",
					"example": 80,
					"description": "客户端目的端口，可以为单个端口，端口范围"
				},
				"protocol": {
					"type": "string",
					"example": "tcp",
					"description": "协议类型，可以为协议名称，协议号"
				},
				"server_source_address": {
					"type": "string",
					"example": "10.0.1.2",
					"description": "服务器源IP地址，可以为单个IP地址，IP地址范围"
				},
				"server_source_port": {
					"type": "integer",
					"example": 11568,
					"description": "服务器源端口，可以为单个端口，端口范围"
				},
				"server_destination_address": {
					"type": "string",
					"example": "2.20.1.89",
					"description": "服务器目的IP地址，可以为单个IP地址，IP地址范围"
				},
				"server_destination_port": {
					"type": "integer",
					"example": 80,
					"description": "服务器目的端口，可以为单个端口，端口范围"
				},
				"virtual_service": {
					"type": "string",
					"example": "2.20.1.89",
					"description": "虚拟服务"
				},
				"timeout": {
					"type": "integer",
					"example": 57,
					"description": "超时时间"
				},
				"session_id": {
					"type": "integer",
					"example": 102513,
					"description": "session序号"
				}
			}
		},
		"debug.session_clear_parameter": {
			"type": "object",
			"properties": {
				"srcaddr": {
					"type": "string",
					"description": "可选参数；指定源IP地址，可以为单个IP地址，IP地址范围",
					"example": "10.0.1.2-10.0.1.10"
				},
				"srcport": {
					"type": "string",
					"description": "可选参数；指定源端口，可以为单个端口，端口范围",
					"example": "11568-11570"
				},
				"dstaddr": {
					"type": "string",
					"description": "可选参数；指定目的IP地址，可以为单个IP地址，IP地址范围",
					"example": "10.0.1.2-10.0.1.10"
				},
				"dstport": {
					"type": "string",
					"description": "可选参数；指定目的端口，可以为单个端口，端口范围",
					"example": "11568-11570"
				},
				"protocol": {
					"type": "string",
					"description": "可选参数；指定协议类型，可以为协议名称，协议号",
					"example": "tcp | 6"
				},
				"virtual_service": {
					"type": "string",
					"description": "可选参数；指定虚拟服务",
					"example": "2.20.1.89"
				},
				"session_id": {
					"type": "integer",
					"description": "可选参数；指定session_id",
					"example": 102513
				}
			}
		}
	}
}