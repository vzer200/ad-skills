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
		"/api/ad/v3/net/link-monitor/all/": {
			"description": "链路健康检查配置管理操作",
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
					"link-monitor"
				],
				"summary": "get all link-monitor",
				"description": "查看链路健康检查配置",
				"operationId": "get_link_monitor_list",
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
						"$ref": "#/responses/operation_config_link_monitor_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net link-monitor all",
					"description": "查看所有类型的监视器配置(包含所有icmp、所有icmpv6、所有tcp类型)"
				},
				{
					"command": "list net link-monitor all ping",
					"description": "查看icmp类型的所有监视器配置"
				},
				{
					"command": "list net link-monitor all ping6",
					"description": "查看icmpv6类型的所有监视器配置"
				},
				{
					"command": "list net link-monitor all http ",
					"description": "常http类型的所有监视器配置"
				},
				{
					"command": "list net link-monitor all [ timeout type] ",
					"description": "查看所有类型监视器配置里的类型和 timeout配置"
				}
			]
		},
		"/api/ad/v3/net/link-monitor/all/{name}": {
			"description": "指定链路健康检查配置管理操作",
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
					"link-monitor"
				],
				"summary": "get specific link-monitor",
				"description": "查看指定链路健康检查配置",
				"operationId": "get_link_monitor",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_object"
					}
				}
			}
		}
	},
	"parameters": {
		"LINK-MONITOR-ALL-CONFIG": {
			"name": "LINK-MONITOR-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "链路健康检查配置",
			"schema": {
				"$ref": "#/definitions/config.link_monitor"
			}
		},
		"LINK-MONITOR-ALL-PROPERTY": {
			"name": "LINK-MONITOR-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "链路健康检查属性",
			"schema": {
				"$ref": "#/definitions/config.link_monitor"
			}
		}
	},
	"responses": {
		"operation_config_link_monitor_list": {
			"description": "链路健康检查列表",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_list"
			}
		},
		"operation_config_link_monitor_object": {
			"description": "链路健康检查对象",
			"schema": {
				"$ref": "#/definitions/config.link_monitor"
			}
		}
	},
	"definitions": {
		"config.link_monitor_list": {
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
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.link_monitor"
					}
				}
			}
		},
		"config.link_monitor": {
			"type": "object",
			"required": [
				"name",
				"type"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string"
				},
				"type": {
					"type": "string",
					"enum": [
						"ICMP",
						"ICMPV6",
						"CONNECT-TCP"
					],
					"example": "CONNECT-TCP"
				},
				"timeout": {
					"type": "integer",
					"default": 16,
					"example": 16
				},
				"interval": {
					"type": "integer",
					"default": 5,
					"example": 5
				},
				"debug_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"port": {
					"type": "integer",
					"default": 0,
					"example": 8080
				},
				"send_content": {
					"type": "string",
					"example": "GET / HTTP/1.1"
				},
				"receive_cache_size": {
					"type": "integer",
					"default": 2048,
					"example": 4096
				},
				"receive_content_match": {
					"type": "string",
					"example": "200"
				},
				"send_content_before_disconnect": {
					"type": "string"
				},
				"hexadecimal_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				}
			}
		}
	}
}