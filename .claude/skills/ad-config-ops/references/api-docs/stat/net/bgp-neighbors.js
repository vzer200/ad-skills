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
		"/api/ad/v3/stat/net/bgp-neighbors": {
			"description": "获取bgp邻居表",
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
					"bgp-neighbors"
				],
				"summary": "get bgp-neighbors table",
				"description": "获取bgp邻居表",
				"operationId": "get_bgp_neighbors_table",
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
						"$ref": "#/responses/operation_stat_bgp_neighbors_detail_list"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_bgp_neighbors_detail_list": {
			"description": "Display bgp-neighbors table with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.bgp_neighbors_detail_list"
			}
		},
		"operation_stat_bgp_neighbors_detail": {
			"description": "Display bgp-neighbors entry with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.bgp_neighbors_detail"
			}
		}
	},
	"definitions": {
		"stat.bgp_neighbors_detail_list": {
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
						"$ref": "#/definitions/stat.bgp_neighbors_detail"
					}
				}
			}
		},
		"stat.bgp_neighbors_detail": {
			"type": "object",
			"properties": {
				"neighbor_ip": {
					"type": "string",
					"description": "邻居IP",
					"example": "192.200.200.22"
				},
				"neighbor_as": {
					"type": "integer",
					"description": "邻居信息",
					"example": 421354
				},
				"communication_state": {
					"type": "string",
					"description": "当前状态",
					"example": "Established(00:00:08)"
				},
				"local_address": {
					"type": "string",
					"description": "本地地址",
					"example": "192.200.200.117:179"
				},
				"neighbor_address": {
					"type": "string",
					"description": "邻居地址",
					"example": "192.200.200.22:43500"
				},
				"type": {
					"type": "string",
					"description": "邻居类型",
					"example": "EBGP"
				}
			}
		}
	}
}