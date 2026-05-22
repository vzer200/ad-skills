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
		"/api/ad/v3/stat/net/lldp-neighbors": {
			"description": "获取LLDP邻居信息",
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
					"lldp-neighbors"
				],
				"summary": "get all lldp-neighbors table",
				"description": "获取LLDP邻居信息",
				"operationId": "get_lldp_neighbors_table",
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
						"$ref": "#/responses/operation_stat_lldp_neighbors_detail_list"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_lldp_neighbors_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.lldp_neighbors_detail_list"
			}
		},
		"operation_stat_lldp_neighbors_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.lldp_neighbors_detail"
			}
		}
	},
	"definitions": {
		"stat.lldp_neighbors_detail_list": {
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
						"$ref": "#/definitions/stat.lldp_neighbors_detail"
					}
				}
			}
		},
		"stat.lldp_neighbors_detail": {
			"type": "object",
			"properties": {
				"device": {
					"type": "string",
					"description": "网口名称",
					"example": "eth2"
				},
				"system_name": {
					"type": "string",
					"description": "系统名称",
					"example": "localhost"
				},
				"chassis_id": {
					"type": "string",
					"description": "邻居ID",
					"example": "fe:fc:fe:7a:75:b1"
				},
				"system_descr": {
					"type": "string",
					"description": "系统描述",
					"example": "sangfor_ad_os"
				},
				"mgmt_ips": {
					"type": "string",
					"description": "管理地址",
					"example": "10.82.77.7"
				},
				"port_id": {
					"type": "string",
					"description": "接口ID",
					"example": "fe:fc:fe:7a:75:b1"
				},
				"port_descr": {
					"type": "string",
					"description": "接口描述",
					"example": "eth0"
				},
				"ttl": {
					"type": "integer",
					"description": "TTL",
					"example": 120
				}
			}
		}
	}
}