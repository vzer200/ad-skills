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
		"/api/ad/v3/stat/dns/local-dns/": {
			"description": "查询local-dns的统计信息",
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
					"local-dns"
				],
				"summary": "get all ldns statistics",
				"description": "查询local-dns的统计信息",
				"operationId": "get_statistics_of_local_dns_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_local_dns_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/local-dns/{local_dns}": {
			"description": "查询指定local-dns的统计信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/local_dns"
				}
			],
			"get": {
				"tags": [
					"local-dns"
				],
				"summary": "get specific local-dns statistics",
				"description": "查询local-dns的统计信息",
				"operationId": "get_statistics_of_local_dns",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_local_dns_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/local-dns-summary": {
			"description": "查询local-dns的全部统计信息",
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
					"local-dns"
				],
				"summary": "get summary local-dns tcp statistics",
				"description": "查询local-dns的全部统计信息",
				"operationId": "get_statistics_of_local_dns_summary",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_local_dns_summary"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_local_dns_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.local_dns_detail_list"
			}
		},
		"operation_stat_local_dns_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.local_dns_detail"
			}
		},
		"operation_stat_local_dns_summary": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.local_dns_summary"
			}
		}
	},
	"parameters": {
		"local_dns": {
			"name": "local_dns",
			"in": "path",
			"type": "string",
			"description": "local-dns名称",
			"required": true
		}
	},
	"definitions": {
		"stat.local_dns_detail_list": {
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
						"$ref": "#/definitions/stat.local_dns_detail"
					}
				}
			}
		},
		"stat.local_dns_detail": {
			"type": "object",
			"properties": {
				"address": {
					"type": "string",
					"description": "ip地址",
					"example": "3.1.2.4"
				},
				"query": {
					"description": "实时统计数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		},
		"stat.local_dns_summary": {
			"type": "object",
			"properties": {
				"total": {
					"description": "实时统计数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		}
	}
}