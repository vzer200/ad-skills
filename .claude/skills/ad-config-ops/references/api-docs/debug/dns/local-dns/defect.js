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
		"/api/ad/v3/debug/dns/local-dns/defect/": {
			"description": "管理LDNS缺失记录",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/from"
				},
				{
					"$ref": "#/parameters/to"
				}
			],
			"get": {
				"tags": [
					"local-dns"
				],
				"summary": "retrieve all local-dns",
				"description": "获取LDBS缺失记录",
				"operationId": "retrieve_local_dns_list",
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
						"$ref": "#/responses/operation_debug_local_dns_defect_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug dns local-dns defect",
					"description": "获取LDBS缺失记录"
				}
			]
		},
		"/api/ad/v3/debug/dns/local-dns/defect/clear": {
			"description": "管理LDNS缺失记录",
			"post": {
				"tags": [
					"local-dns"
				],
				"summary": "create job: clear local-dns-defect",
				"description": "清空LDBS缺失记录",
				"operationId": "clear_local_dns_defect"
			},
			"__sfcli_example__": [
				{
					"command": "run debug dns local-dns defect clear",
					"description": "清空LDBS缺失记录"
				}
			]
		}
	},
	"parameters": {
		"from": {
			"name": "from",
			"in": "query",
			"type": "string",
			"required": true,
			"description": "Time Format: YYYYMMDDhhmmss",
			"example": "20170104184536"
		},
		"to": {
			"name": "to",
			"in": "query",
			"type": "string",
			"required": true,
			"description": "Time Format: YYYYMMDDhhmmss",
			"example": "20170104184536"
		}
	},
	"responses": {
		"operation_debug_local_dns_defect_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.local_dns_defect_list"
			}
		}
	},
	"definitions": {
		"debug.local_dns_defect_list": {
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
					"description": "LDBS缺失记录列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.local_dns_defect_entry"
					}
				}
			}
		},
		"debug.local_dns_defect_entry": {
			"type": "object",
			"properties": {
				"timestamp": {
					"description": "LDBS缺失记录时间",
					"type": "integer"
				},
				"source_address": {
					"description": "LDBS缺失记录源ip地址",
					"type": "string",
					"example": "8.15.2.64"
				},
				"zone_attribute": {
					"description": "LDBS缺失记录区域属性",
					"type": "string",
					"enum": [
						"KNOWN",
						"UNKNOWN"
					],
					"example": "Guangdong"
				},
				"isp_attribute": {
					"description": "LDBS缺失记录ips属性",
					"type": "string\n- \"KNOWN\"\n- \"UNKNOWN\"",
					"example": "UNKNOWN"
				}
			}
		}
	}
}