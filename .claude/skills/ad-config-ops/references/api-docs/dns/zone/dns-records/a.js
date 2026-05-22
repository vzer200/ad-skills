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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/a/": {
			"description": "A记录配置管理操作",
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
				"summary": "get all dns-record-a",
				"description": "查看A记录",
				"operationId": "get_dns_record_a_list",
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
						"$ref": "#/responses/operation_config_dns_record_a_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-a",
				"description": "创建一个A记录",
				"operationId": "add_dns_record_a_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-A-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_a_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records a",
					"description": "获取本地全部A记录配置"
				},
				{
					"command": "list dns zone local dns-records a domain_a",
					"description": "获取本地指定A记录domain_a配置"
				},
				{
					"command": "create  dns zone local dns-records a  \"domain_a\" generate_ptr_record \"enable\" domain \"domain_a\" zone \"ssss\" state \"enable\" type \"a\" a_records [ { ttl 60 address \"1.2.3.4\" }  ]",
					"description": "创建权威域ssss下名称为domain_a的A记录，其TTL为60，ip地址为1.2.3.4"
				},
				{
					"command": "modify dns zone local dns-records a domain_a a_records [ { ttl 60 address \"5.6.7.8\" } ]",
					"description": "修改本地A记录domain_a的ip地址为5.6.7.8"
				},
				{
					"command": "delete dns zone local dns-records a domain_a",
					"description": "删除本地A记录domain_a"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/a/{name}": {
			"description": "A记录配置管理操作",
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
				"summary": "get specific dns-record-a",
				"description": "查看指定的A记录",
				"operationId": "get_dns_record_a",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_a_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-a",
				"description": "创建一个A记录",
				"operationId": "create_dns_record_a",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-A-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_a_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-a",
				"description": "修改指定A记录配置",
				"operationId": "replace_dns_record_a",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-A-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_a_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-a",
				"description": "增量修改指定A记录配置",
				"operationId": "edit_dns_record_a",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-A-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_a_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-a",
				"description": "删除指定的A记录",
				"operationId": "delete_dns_record_a",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_a_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-A-CONFIG": {
			"name": "DNS-RECORD-A-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_a"
			}
		},
		"DNS-RECORD-A-PROPERTY": {
			"name": "DNS-RECORD-A-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_a"
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
		"operation_config_dns_record_a_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_a_list"
			}
		},
		"operation_config_dns_record_a_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_a"
			}
		}
	},
	"definitions": {
		"config.dns_record_a_list": {
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
						"$ref": "#/definitions/config.dns_record_a"
					}
				}
			}
		},
		"config.dns_record_a": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"a_records"
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
						"A"
					],
					"default": "A"
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
				"a_records": {
					"type": "array",
					"description": "A记录列表",
					"items": {
						"type": "object",
						"description": "A记录值",
						"required": [
							"address"
						],
						"properties": {
							"address": {
								"type": "string",
								"description": "单个IPv4地址 (不能是IPv6地址）",
								"example": "192.168.1.7"
							},
							"ttl": {
								"type": "integer",
								"description": "TTL输入范围为[0,2147483647]，单位秒",
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