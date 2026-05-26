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
		"/api/ad/v3/stat/dns/domain/": {
			"description": "查询所有域名的统计信息",
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
					"domain"
				],
				"summary": "get all domain statistics",
				"description": "",
				"operationId": "get_statistics_of_dns_domain_list",
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
						"$ref": "#/responses/operation_stat_dns_domain_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/domain/{domain}": {
			"description": "查询指定域名的统计信息",
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
					"$ref": "#/parameters/domain"
				}
			],
			"get": {
				"tags": [
					"domain"
				],
				"summary": "get specific domain statistics",
				"description": "查询指定域名的统计信息",
				"operationId": "get_statistics_of_dns_domain",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_domain_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/domain/{domain}/query": {
			"description": "查询指定域名请求次数信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/domain"
				}
			],
			"get": {
				"tags": [
					"domain"
				],
				"summary": "get specific domain query statistics",
				"description": "查询指定域名请求次数信息",
				"operationId": "get_statistics_of_dns_domain_query_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/domain/{domain}/ldns/": {
			"description": "查询域名ldns信息",
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
					"$ref": "#/parameters/domain"
				}
			],
			"get": {
				"tags": [
					"domain"
				],
				"summary": "get specific domain ldns statistics",
				"description": "查询域名ldns信息",
				"operationId": "get_statistics_of_dns_domain_ldns",
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
						"$ref": "#/responses/operation_stat_dns_domain_ldns_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/domain-each/{item}": {
			"description": "查询域名统计趋势",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/domain"
				}
			],
			"get": {
				"tags": [
					"domain"
				],
				"summary": "get each domain query statistics",
				"description": "查询域名统计趋势",
				"operationId": "get_statistics_of_each_domain_query_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/domain-each/query": {
			"description": "查询domain-each统计信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/domain"
				}
			],
			"get": {
				"tags": [
					"domain"
				],
				"summary": "get each domain query statistics",
				"description": "查询domain-each统计信息",
				"operationId": "get_statistics_of_each_domain_query_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/domain-summary": {
			"description": "查询domain总计信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/domain"
				}
			],
			"get": {
				"tags": [
					"domain"
				],
				"summary": "get summary domain statistics",
				"description": "查询domain总计信息",
				"operationId": "get_summary_statistics_of_domain",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_dns_domain_summary"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_dns_domain_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_domain_detail_list"
			}
		},
		"operation_stat_dns_domain_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_domain_detail"
			}
		},
		"operation_stat_dns_domain_ldns_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_domain_ldns_list"
			}
		},
		"operation_stat_dns_domain_summary": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_domain_summary"
			}
		}
	},
	"parameters": {
		"domain": {
			"name": "domain",
			"in": "path",
			"type": "string",
			"description": "statistic domain name",
			"required": true
		}
	},
	"definitions": {
		"stat.dns_domain_detail_list": {
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
						"$ref": "#/definitions/stat.dns_domain_detail"
					}
				}
			}
		},
		"stat.dns_domain_detail": {
			"type": "object",
			"description": "域名查询详情",
			"properties": {
				"domain": {
					"type": "string",
					"example": "www.abc.com",
					"description": "查询的域名"
				},
				"query_rate": {
					"description": "实时统计数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		},
		"stat.dns_domain_ldns_list": {
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
						"$ref": "#/definitions/stat.dns_domain_ldns"
					}
				}
			}
		},
		"stat.dns_domain_ldns": {
			"type": "object",
			"description": "ldns域名",
			"properties": {
				"address": {
					"description": "ip地址",
					"type": "string",
					"example": "3.1.2.4"
				},
				"query": {
					"description": "数据统计结果",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		},
		"stat.dns_domain_summary": {
			"type": "object",
			"description": "域名查询概览",
			"properties": {
				"active": {
					"description": "数据统计结果",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"total": {
					"description": "数据统计结果",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"query_rate": {
					"description": "数据统计结果",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		}
	}
}