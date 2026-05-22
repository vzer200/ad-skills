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
		"/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/pool/{pool_name}/persist": {
			"description": "虚拟服务节点池会话保持操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "#/parameters/pool_name"
				},
				{
					"$ref": "#/parameters/source_address"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"persist"
				],
				"summary": "retrieve pool persist",
				"description": "查询虚拟服务节点池会话保持",
				"operationId": "retrieve_persist",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_persist"
					}
				}
			}
		},
		"/api/ad/v3/debug/slb/persist/": {
			"description": "虚拟服务会话保持记录操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/record_value"
				},
				{
					"$ref": "#/parameters/destination_address"
				},
				{
					"$ref": "#/parameters/destination_port"
				},
				{
					"$ref": "#/parameters/pool"
				},
				{
					"$ref": "#/parameters/node_address"
				},
				{
					"$ref": "#/parameters/node_port"
				}
			],
			"get": {
				"tags": [
					"persist"
				],
				"summary": "get slb persist",
				"description": "查询虚拟服务会话保持记录",
				"operationId": "get_slb_persist",
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
						"$ref": "#/responses/operation_debug_slb_persist_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug slb persist",
					"description": "查询虚拟服务会话保持记录"
				}
			]
		},
		"/api/ad/v3/debug/slb/persist/clear": {
			"description": "虚拟服务会话保持记录操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/slb_persist_clear_parameter"
				}
			],
			"post": {
				"tags": [
					"persist"
				],
				"summary": "clear slb persist",
				"description": "清除虚拟服务会话保持记录",
				"operationId": "clear_slb_persist"
			}
		}
	},
	"parameters": {
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"required": true,
			"example": "vs_http_80",
			"description": "虚拟服务名称"
		},
		"pool_name": {
			"name": "pool_name",
			"in": "path",
			"type": "string",
			"required": true,
			"example": "pool_web_portal_80",
			"description": "节点池名称"
		},
		"source_address": {
			"name": "source_address",
			"in": "query",
			"type": "string",
			"required": true,
			"example": "192.168.100.234",
			"description": "源ip地址"
		},
		"record_value": {
			"name": "record_value",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "10.86.15.2",
			"description": "会话保持记录匹配值"
		},
		"destination_address": {
			"name": "destination_address",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "192.168.100.234",
			"description": "目的IP"
		},
		"destination_port": {
			"name": "destination_port",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "1000",
			"description": "目的端口"
		},
		"pool": {
			"name": "pool",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "pool_web_80",
			"description": "记录所属节点池"
		},
		"node_address": {
			"name": "node_address",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "192.168.100.234",
			"description": "保持节点IP地址"
		},
		"node_port": {
			"name": "node_port",
			"in": "query",
			"type": "string",
			"required": false,
			"example": "1000",
			"description": "保持节点端口"
		},
		"slb_persist_clear_parameter": {
			"name": "slb_persist_clear_parameter",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.slb_persist_clear"
			}
		}
	},
	"responses": {
		"operation_debug_persist": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.persist"
			}
		},
		"operation_debug_slb_persist_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.slb_persist_list"
			}
		}
	},
	"definitions": {
		"debug.persist": {
			"type": "object",
			"properties": {
				"pool": {
					"type": "string",
					"example": "pool_web_portal_80",
					"description": "记录所属节点池"
				},
				"node": {
					"type": "string",
					"example": "10.0.1.2:8080",
					"description": "记录所属节点"
				},
				"subnet": {
					"type": "string",
					"example": "200.200.100.0/24",
					"description": "记录子网"
				},
				"timeout": {
					"type": "integer",
					"example": 3549,
					"description": "记录超时时间"
				},
				"netns": {
					"type": "string",
					"default": "default",
					"description": "记录所属netns"
				}
			}
		},
		"debug.slb_persist_list": {
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
						"$ref": "#/definitions/debug.slb_persist"
					}
				}
			}
		},
		"debug.slb_persist": {
			"type": "object",
			"properties": {
				"persist": {
					"type": "string",
					"description": "会话保持配置名称",
					"example": "cookie-rewrite"
				},
				"type": {
					"type": "string",
					"description": "会话保持类型",
					"enum": [
						"COOKIE",
						"SOURCE-ADDRESS",
						"RADIUS",
						"HTTP-PASSIVE",
						"SESSION-ID"
					],
					"example": "COOKIE"
				},
				"search_type": {
					"description": "会话保持记录匹配值类型",
					"type": "string",
					"example": "PS_KEY"
				},
				"record_ip": {
					"description": "会话保持记录匹配IP",
					"type": "string",
					"example": "200.200.0.1"
				},
				"record_port": {
					"description": "会话保持记录匹配端口",
					"type": "integer",
					"example": 8080
				},
				"record_value": {
					"description": "会话保持记录匹配值",
					"type": "string",
					"example": "10.86.15.2"
				},
				"destination_address": {
					"description": "访问目的IP",
					"type": "string",
					"example": "200.200.0.1"
				},
				"destination_port": {
					"description": "访问目的端口",
					"type": "integer",
					"example": 8080
				},
				"pool": {
					"description": "记录所属节点池",
					"type": "string",
					"example": "pool_web_portal_80"
				},
				"node_ip": {
					"description": "保持节点IP地址",
					"type": "string",
					"example": "192.168.1.10"
				},
				"node_port": {
					"description": "保持节点端口",
					"type": "integer",
					"example": 8080
				},
				"timeout": {
					"description": "记录超时时间",
					"type": "integer",
					"example": 24
				},
				"application_group": {
					"description": "记录应用组",
					"type": "integer",
					"example": 8080
				}
			}
		},
		"debug.slb_persist_clear": {
			"type": "object",
			"properties": {
				"record_value": {
					"description": "会话保持记录匹配值",
					"type": "string",
					"example": "10.86.15.2"
				},
				"destination_address": {
					"description": "访问目的IP",
					"type": "string",
					"example": "200.200.0.1"
				},
				"destination_port": {
					"description": "访问目的端口",
					"type": "integer",
					"example": 8080
				},
				"pool": {
					"description": "记录所属节点池",
					"type": "string",
					"example": "pool_web_portal_80"
				},
				"node_ip": {
					"description": "保持节点IP地址",
					"type": "string",
					"example": "192.168.1.10"
				},
				"node_port": {
					"description": "保持节点端口",
					"type": "integer",
					"example": 8080
				}
			}
		}
	}
}