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
		"/api/ad/v3/stat/net/ospf-neighbors": {
			"description": "获取OSPF邻居信息",
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
					"ospf-neighbors"
				],
				"summary": "get ospf-neighbors table",
				"description": "获取OSPF邻居信息",
				"operationId": "get_ospf_neighbors_table",
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
						"$ref": "#/responses/operation_stat_ospf_neighbors_detail_list"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_ospf_neighbors_detail_list": {
			"description": "Display ospf-neighbors table with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.ospf_neighbors_detail_list"
			}
		},
		"operation_stat_ospf_neighbors_detail": {
			"description": "Display ospf-neighbors entry with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.ospf_neighbors_detail"
			}
		}
	},
	"definitions": {
		"stat.ospf_neighbors_detail_list": {
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
						"$ref": "#/definitions/stat.ospf_neighbors_detail"
					}
				}
			}
		},
		"stat.ospf_neighbors_detail": {
			"type": "object",
			"properties": {
				"route_id": {
					"type": "string",
					"description": "路由器ID",
					"example": "192.200.200.22"
				},
				"priority": {
					"type": "integer",
					"example": 10,
					"description": "优先级"
				},
				"state": {
					"type": "string",
					"example": "Full/Backup",
					"description": "邻接状态"
				},
				"timeout": {
					"type": "string",
					"example": "38.730s",
					"description": "超时时间"
				},
				"neighbor_ip": {
					"type": "string",
					"description": "邻居邻接IP",
					"example": "192.200.200.22"
				},
				"local_interface": {
					"type": "string",
					"description": "邻接网口",
					"example": "eth1/192.200.200.117"
				}
			}
		}
	}
}