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
		"/api/ad/v3/lc/dns-intranet-record/all/": {
			"description": "DNS 所有记录配置管理操作",
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
					"dns-intranet-record"
				],
				"summary": "get all dns-intranet-record",
				"description": "查看DNS 所有配置记录",
				"operationId": "get_dns_intranet_record_list",
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
						"$ref": "#/responses/operation_config_dns_intranet_record_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list lc dns-intranet-record all’ ",
					"description": "查看所有内网DNS记录的配置信息"
				}
			]
		},
		"/api/ad/v3/lc/dns-intranet-record/all/{name}": {
			"description": "DNS 所有记录配置管理操作",
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
				"deprecated": true,
				"tags": [
					"dns-intranet-record"
				],
				"summary": "get specific dns-intranet-record",
				"description": "查看单个DNS 配置记录",
				"operationId": "get_dns_record",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_intranet_record_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-INTRANET-RECORD-ALL-CONFIG": {
			"name": "DNS-INTRANET-RECORD-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record"
			}
		},
		"DNS-INTRANET-RECORD-ALL-PROPERTY": {
			"name": "DNS-INTRANET-RECORD-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record"
			}
		}
	},
	"responses": {
		"operation_config_dns_intranet_record_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_intranet_record_list"
			}
		},
		"operation_config_dns_intranet_record_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record"
			}
		}
	},
	"definitions": {
		"config.dns_intranet_record_list": {
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
					"description": "内网dns记录列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.dns_record"
					}
				}
			}
		},
		"config.dns_record": {
			"type": "object",
			"required": [
				"name",
				"state",
				"type"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "localhost",
					"description": "dns记录名称"
				},
				"description": {
					"type": "string",
					"description": "dns记录描述信息"
				},
				"state": {
					"type": "string",
					"description": "dns记录状态",
					"enum": [
						"ENABLE",
						"DISABLE"
					]
				},
				"type": {
					"type": "string",
					"description": "dns记录类型",
					"enum": [
						"A",
						"AAAA",
						"MX",
						"CNAME",
						"TXT"
					],
					"example": "A"
				},
				"a_records": {
					"type": "array",
					"description": "dns A记录",
					"items": {
						"type": "object",
						"properties": {
							"address": {
								"description": "IP地址",
								"type": "string"
							},
							"ttl": {
								"description": "dns记录ttl",
								"type": "integer"
							}
						}
					}
				},
				"aaaa_records": {
					"type": "array",
					"description": "dns AAAA记录",
					"items": {
						"type": "object",
						"properties": {
							"address": {
								"description": "IP地址",
								"type": "string"
							},
							"ttl": {
								"description": "dns记录ttl",
								"type": "integer"
							}
						}
					}
				},
				"mx_records": {
					"type": "array",
					"description": "dns MX记录",
					"items": {
						"type": "object",
						"properties": {
							"host": {
								"description": "主机",
								"type": "string"
							},
							"priority": {
								"description": "优先级",
								"type": "integer"
							},
							"ttl": {
								"description": "dns记录ttl",
								"type": "integer"
							}
						}
					}
				},
				"cname_records": {
					"type": "array",
					"description": "dns CNAME记录",
					"items": {
						"type": "string"
					}
				},
				"txt_record": {
					"type": "string",
					"description": "dns TXT记录"
				},
				"ttl": {
					"type": "integer",
					"default": 0,
					"description": "dns记录ttl"
				}
			}
		}
	}
}