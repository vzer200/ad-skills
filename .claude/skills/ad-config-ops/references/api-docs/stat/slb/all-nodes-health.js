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
		"/api/ad/v3/stat/slb/nodes/": {
			"description": "获取节点状态信息",
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
					"node"
				],
				"summary": "get all nodes health",
				"description": "获取节点状态信息",
				"operationId": "get_health_status_of_node_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_stat_node_health_status_list"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_node_health_status_list": {
			"description": "Display health status with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.node_detail_list"
			}
		},
		"operation_stat_node_detail": {
			"description": "Display health status with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.node_detail"
			}
		}
	},
	"definitions": {
		"stat.node_detail_list": {
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
						"$ref": "#/definitions/stat.node_detail"
					}
				}
			}
		},
		"stat.node_detail": {
			"type": "object",
			"properties": {
				"health": {
					"description": "健康状态（NORMAL-正常/FAILURE-故障/BUSY-繁忙）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE",
						"BUSY"
					],
					"example": "NORMAL"
				},
				"pool": {
					"description": "所属节点池名称",
					"type": "string",
					"example": "pool1"
				},
				"name": {
					"description": "节点名称",
					"type": "string",
					"example": "nodeA"
				},
				"netns": {
					"description": "所属的netns名称",
					"type": "string",
					"example": "netns1"
				},
				"address": {
					"description": "节点IP地址",
					"type": "string",
					"example": "192.168.1.101"
				},
				"port": {
					"description": "节点端口",
					"type": "integer",
					"example": 25
				}
			}
		}
	}
}