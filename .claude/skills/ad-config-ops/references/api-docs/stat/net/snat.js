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
		"/api/ad/v3/stat/net/snat/": {
			"description": "获取SNAT统计信息",
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
					"snat"
				],
				"summary": "get all snat",
				"description": "获取SNAT统计信息",
				"operationId": "get_snat_list",
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
						"$ref": "#/responses/operation_stat_snat_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/snat/{name}": {
			"description": "获取指定SNAT统计信息",
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
					"snat"
				],
				"summary": "get specific snat",
				"description": "获取指定SNAT统计信息",
				"operationId": "get_snat",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_snat_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SNAT-CONFIG": {
			"name": "SNAT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/stat.snat"
			}
		}
	},
	"responses": {
		"operation_stat_snat_list": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.snat_list"
			}
		},
		"operation_stat_snat_object": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.snat"
			}
		}
	},
	"definitions": {
		"stat.snat_list": {
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
						"$ref": "#/definitions/stat.snat"
					}
				}
			}
		},
		"stat.snat": {
			"type": "object",
			"readOnly": true,
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "snat_wan",
					"description": "SNAT名称"
				},
				"hit": {
					"description": "SNAT匹配次数实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				}
			}
		}
	}
}