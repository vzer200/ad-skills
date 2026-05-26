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
		"/api/ad/v3/stat/net/link/pppoe/": {
			"description": "获取所有pppoe链路详细统计信息",
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
					"link-pppoe"
				],
				"summary": "get status of all link-pppoe",
				"description": "获取所有pppoe链路详细统计信息",
				"operationId": "get_all_link_pppoe_status",
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
						"$ref": "#/responses/operation_stat_link_pppoe_status_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/pppoe/{name}": {
			"description": "获取指定pppoe链路详细统计信息",
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
					"link-pppoe"
				],
				"summary": "get status of link-pppoe",
				"description": "获取指定pppoe链路链路详细统计信息",
				"operationId": "get_link_pppoe_status",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_link_pppoe_status"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_link_pppoe_status_list": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_pppoe_status_list"
			}
		},
		"operation_stat_link_pppoe_status": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_pppoe_status"
			}
		}
	},
	"definitions": {
		"stat.link_pppoe_status_list": {
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
						"$ref": "#/definitions/stat.link_pppoe_status"
					}
				}
			}
		},
		"stat.link_pppoe_status": {
			"type": "object",
			"readOnly": true,
			"properties": {
				"name": {
					"type": "string",
					"example": "Unicom_100M",
					"description": "链路名称"
				},
				"state": {
					"type": "string",
					"description": "当前链路状态（CONNECTED-已连接，DISCONNECT-未连接，CONNECTING-连接中）",
					"enum": [
						"CONNECTED",
						"DISCONNECT",
						"CONNECTING"
					]
				},
				"connected_time": {
					"type": "integer",
					"example": 31012,
					"description": "连接时间"
				},
				"ip_address": {
					"type": "string",
					"example": "192.168.1.102",
					"description": "IP地址"
				},
				"netmask": {
					"type": "string",
					"example": "255.255.254.0",
					"description": "掩码"
				},
				"gateway": {
					"type": "string",
					"example": "192.168.1.254",
					"description": "网关IP"
				},
				"dns_server_1": {
					"type": "string",
					"example": "8.8.8.8",
					"description": "DNS服务器地址"
				},
				"dns_server_2": {
					"type": "string",
					"example": "114.114.114.114",
					"description": "DNS服务器地址"
				}
			}
		}
	}
}