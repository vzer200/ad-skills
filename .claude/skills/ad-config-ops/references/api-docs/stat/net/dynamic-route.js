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
		"/api/ad/v3/stat/net/dynamic-route": {
			"description": "获取动态路由统计信息",
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
					"dynamic-route"
				],
				"summary": "get dynamic-route table",
				"description": "获取动态路由统计信息",
				"operationId": "get_dynamic_route_table",
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
						"$ref": "#/responses/operation_stat_dynamic_route_detail_list"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_dynamic_route_detail_list": {
			"description": "Display dynamic-route table with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dynamic_route_detail_list"
			}
		},
		"operation_stat_dynamic_route_detail": {
			"description": "Display dynamic-route entry with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dynamic_route_detail"
			}
		}
	},
	"definitions": {
		"stat.dynamic_route_detail_list": {
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
						"$ref": "#/definitions/stat.dynamic_route_detail"
					}
				}
			}
		},
		"stat.dynamic_route_detail": {
			"type": "object",
			"properties": {
				"destination": {
					"type": "string",
					"description": "目的地址",
					"example": "200.200.200.0/24"
				},
				"next_hop": {
					"type": "string",
					"description": "下一跳地址",
					"example": "200.200.100.254"
				},
				"outbound_link": {
					"type": "string",
					"description": "出接口链路名称",
					"example": "wan_china_unicom_1"
				},
				"protocol": {
					"type": "string",
					"description": "路由协议",
					"example": "BGP"
				},
				"cost": {
					"type": "integer",
					"description": "代价值",
					"example": 100
				}
			}
		}
	}
}