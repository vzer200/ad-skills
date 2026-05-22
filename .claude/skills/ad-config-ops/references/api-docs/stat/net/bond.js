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
		"/api/ad/v3/stat/net/bond": {
			"description": "获取bond口信息",
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
					"bond"
				],
				"summary": "get all bond statistics",
				"description": "获取bond口信息",
				"operationId": "get_statistics_of_bond_list",
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
						"$ref": "#/responses/operation_stat_bond_detail_list"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_bond_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.bond_detail_list"
			}
		},
		"operation_stat_bond_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.bond_detail"
			}
		}
	},
	"definitions": {
		"stat.bond_detail_list": {
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
						"$ref": "#/definitions/stat.bond_detail"
					}
				}
			}
		},
		"stat.bond_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"example": "bond_0",
					"description": "聚合接口的名称"
				},
				"aggregate_policy": {
					"type": "string",
					"description": "绑定策略",
					"enum": [
						"HASH",
						"ROUND-ROBIN",
						"8023AD",
						"ACTIVE-BACKUP"
					],
					"example": "HASH"
				},
				"aggregate_interfaces": {
					"type": "array",
					"description": "聚合接口绑定的网口列表",
					"items": {
						"type": "object",
						"description": "绑定的网络接口信息",
						"properties": {
							"type": {
								"type": "string",
								"description": "网络接口类型",
								"enum": [
									"PHYSICAL"
								],
								"example": "PHYSICAL"
							},
							"interface": {
								"type": "string",
								"description": "网络接口名称",
								"example": "NET2"
							}
						}
					}
				},
				"dynamic_interfaces": {
					"type": "array",
					"description": "待选的网络接口列表",
					"items": {
						"type": "object",
						"description": "待选的网络接口信息",
						"properties": {
							"type": {
								"type": "string",
								"description": "网络接口类型",
								"enum": [
									"PHYSICAL"
								],
								"example": "PHYSICAL"
							},
							"interface": {
								"type": "string",
								"description": "网络接口名称",
								"example": "NET2"
							}
						}
					}
				}
			}
		}
	}
}