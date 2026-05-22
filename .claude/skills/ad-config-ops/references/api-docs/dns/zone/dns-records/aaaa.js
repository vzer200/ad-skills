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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/aaaa/": {
			"description": "AAAA记录配置管理操作",
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
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"dns-record"
				],
				"summary": "get all dns-record-aaaa",
				"description": "查看AAAA记录",
				"operationId": "get_dns_record_aaaa_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_config_dns_record_aaaa_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-aaaa",
				"description": "创建AAAA记录",
				"operationId": "add_dns_record_aaaa_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-AAAA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_aaaa_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records aaaa",
					"description": "获取本地全部AAAA记录配置"
				},
				{
					"command": "list dns zone local dns-records aaaa domain_aaaa",
					"description": "获取本地指定AAAA记录domain_aaaa配置"
				},
				{
					"command": "create  dns zone local dns-records aaaa  \"domain_aaaa\" generate_ptr_record \"enable\" domain \"domain_aaaa\" zone \"ssss\" state \"enable\" type \"aaaa\" aaaa_records [ { address \"2021::1028\" ttl 60 }  ]",
					"description": "创建权威域ssss下名称为domain_aaaa的AAAA记录，其TTL为60，ip地址为1.2.3.4"
				},
				{
					"command": "modify dns zone local dns-records aaaa domain_aaaa aaaa_records [ { address \"2021::1029\" ttl 60 }  ]",
					"description": "修改本地AAAA记录domain_aaaa的ip地址为2021::1029"
				},
				{
					"command": "delete dns zone local dns-records aaaa domain_aaaa",
					"description": "删除本地AAAA记录domain_aaaa"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/aaaa/{name}": {
			"description": "AAAA记录配置管理操作",
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
				},
				{
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"dns-record"
				],
				"summary": "get specific dns-record-aaaa",
				"description": "查看指定的AAAA记录",
				"operationId": "get_dns_record_aaaa",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_aaaa_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-aaaa",
				"description": "创建一个AAAA记录",
				"operationId": "create_dns_record_aaaa",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-AAAA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_aaaa_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-aaaa",
				"description": "修改指定的AAAA记录",
				"operationId": "replace_dns_record_aaaa",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-AAAA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_aaaa_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-aaaa",
				"description": "增量修改指定的AAAA记录",
				"operationId": "edit_dns_record_aaaa",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-AAAA-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_aaaa_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-aaaa",
				"description": "删除指定的AAAA记录",
				"operationId": "delete_dns_record_aaaa",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_aaaa_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-AAAA-CONFIG": {
			"name": "DNS-RECORD-AAAA-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_aaaa"
			}
		},
		"DNS-RECORD-AAAA-PROPERTY": {
			"name": "DNS-RECORD-AAAA-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_aaaa"
			}
		},
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "DNS Config Area",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_config_dns_record_aaaa_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_aaaa_list"
			}
		},
		"operation_config_dns_record_aaaa_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_aaaa"
			}
		}
	},
	"definitions": {
		"config.dns_record_aaaa_list": {
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
						"$ref": "#/definitions/config.dns_record_aaaa"
					}
				}
			}
		},
		"config.dns_record_aaaa": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"aaaa_records"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "名称。做重复校验"
				},
				"description": {
					"type": "string",
					"description": "描述"
				},
				"state": {
					"type": "string",
					"description": "启/禁用。默认启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"domain": {
					"type": "string",
					"description": "域名，按域名格式校验，最大长度250"
				},
				"zone": {
					"type": "string",
					"description": "指定该DNS记录所属域（主服务器）",
					"example": "com"
				},
				"type": {
					"type": "string",
					"description": "类型",
					"enum": [
						"AAAA"
					],
					"default": "AAAA"
				},
				"generate_ptr_record": {
					"type": "string",
					"description": "是否生成ptr记录",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"aaaa_records": {
					"type": "array",
					"description": "AAAA记录列表",
					"items": {
						"type": "object",
						"description": "AAAA记录值",
						"required": [
							"address"
						],
						"properties": {
							"address": {
								"type": "string",
								"description": "单个IPv6地址（不能是IPv4地址）",
								"example": "2001:503:ba3e::2:30"
							},
							"ttl": {
								"type": "integer",
								"description": "TTL取值范围为[0,2147483647]，单位秒",
								"default": 60,
								"example": 60,
								"minimum": 0,
								"maximum": 2147483647
							}
						}
					},
					"minItems": 1,
					"maxItems": 10
				}
			}
		}
	}
}