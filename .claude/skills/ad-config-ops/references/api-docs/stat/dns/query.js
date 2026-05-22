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
		"/api/ad/v3/stat/dns/query/": {
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
					"query"
				],
				"summary": "get all query statistics",
				"description": "查询所有域名的统计信息",
				"operationId": "get_statistics_of_dns_query_list",
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
						"$ref": "#/responses/operation_stat_dns_query"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/query/{item}": {
			"description": "查询指定类型域名的统计信息",
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
					"query"
				],
				"summary": "get one query statistics",
				"description": "查询查询指定类型域名的统计信息",
				"operationId": "get_statistics_of_dns_query_list",
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
						"$ref": "#/responses/operation_stat_dns_query"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_dns_query": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_query"
			}
		}
	},
	"definitions": {
		"stat.dns_query": {
			"type": "object",
			"properties": {
				"protocol": {
					"type": "object",
					"description": "域名查询使用的协议",
					"properties": {
						"tcp_query_rate": {
							"description": "tcp协议查询实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"udp_query_rate": {
							"description": "udp协议查询实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						}
					}
				},
				"result": {
					"type": "object",
					"description": "域名查询结果",
					"properties": {
						"success": {
							"description": "查询成功的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"failed": {
							"description": "查询失败的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						}
					}
				},
				"type": {
					"type": "object",
					"description": "DNS记录类型",
					"properties": {
						"a_record": {
							"description": "A记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"ns_record": {
							"description": "NS记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"mx_record": {
							"description": "MX记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"cname_record": {
							"description": "CNAME记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"soa_record": {
							"description": "SOA记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"srv_record": {
							"description": "SRV记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"ptr_record": {
							"description": "PTR记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"txt_record": {
							"description": "TXT记录查询的实时统计数据",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						}
					}
				}
			}
		}
	}
}