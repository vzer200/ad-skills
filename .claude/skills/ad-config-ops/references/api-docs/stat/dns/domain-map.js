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
		"/api/ad/v3/stat/dns/domain-map/{dns_config_area}/{name}": {
			"description": "查询单个域名映射的统计信息",
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
					"domain-map"
				],
				"summary": "get  domain-map statistics",
				"description": "查询单个域名映射的统计信息",
				"operationId": "get_statistics_of_domain_map",
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
						"$ref": "#/responses/operation_stat_domain_map"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns domain-map local sadf",
					"description": "查询单个域名映射的统计信息，域名映射的名称为：sadf"
				}
			]
		},
		"/api/ad/v3/stat/dns/domain-map/{dns_config_area}": {
			"description": "查询域名映射的统计信息",
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
					"domain-map"
				],
				"summary": "get  all domain-map statistics",
				"description": "查询域名映射的统计信息",
				"operationId": "get_statistics_of_domain_map",
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
						"$ref": "#/responses/operation_stat_domain_map_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "show stat dns domain-map local",
					"description": "查询域名映射的统计信息"
				}
			]
		}
	},
	"parameters": {
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "DNS配置作用域",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_stat_domain_map_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_map_list"
			}
		},
		"operation_stat_domain_map": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.dns_map"
			}
		}
	},
	"definitions": {
		"stat.dns_map_list": {
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
						"$ref": "#/definitions/stat.dns_map"
					}
				}
			}
		},
		"stat.dns_map": {
			"type": "object",
			"properties": {
				"status": {
					"type": "string",
					"description": "域名映射的健康状态",
					"enum": [
						"normal",
						"failure",
						"busy"
					],
					"example": "normal"
				},
				"name": {
					"type": "string",
					"example": "1.1.1.1_1_TCP",
					"description": "域名映射的名称"
				},
				"area": {
					"type": "string",
					"description": "域名映射的类型",
					"enum": [
						"LOCAL",
						"GLOBAL"
					],
					"example": "GLOBAL"
				}
			}
		}
	}
}