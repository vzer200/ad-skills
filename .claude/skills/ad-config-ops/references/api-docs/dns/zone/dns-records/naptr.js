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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/naptr/": {
			"description": "NAPTR记录配置管理操作",
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
				"summary": "get all dns-record-naptr",
				"description": "查看NAPTR记录",
				"operationId": "get_dns_record_naptr_list",
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
						"$ref": "#/responses/operation_config_dns_record_naptr_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-naptr",
				"description": "创建NAPTR记录",
				"operationId": "add_dns_record_naptr_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-NAPTR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_naptr_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records naptr",
					"description": "获取本地全部NAPTR记录配置"
				},
				{
					"command": "list dns zone local dns-records naptr domain_naptr",
					"description": "获取本地指定NAPTR记录domain_naptr配置"
				},
				{
					"command": "create  dns zone local dns-records naptr  \"domain_naptr\" ttl 60 domain \"domain_naptr\" zone \"ssss\" state \"enable\" type \"naptr\" naptr_records [ { order 100 priority 10 flags \"S\" service \"SIP+D2U\" regular_expression \"\\!^.\\$\\!sip:customer-service\\@example.com\\!\" replacement \"_sip._udp.example.com\" }  ]",
					"description": "创建权威域ssss下名称为domain_naptr的NAPTR记录，其TTL为60，记录值列表中存在优先级为10，次序为100，标志位S，服务参数为SIP+D2U，替换表达式为\"\\!^.\\$\\!sip:customer-service\\@example.com\\!\"，查询域名为_sip._udp.example.com的记录值"
				},
				{
					"command": "modify dns zone local dns-records naptr domain_naptr state disable",
					"description": "修改本地NAPTR记录domain_naptr的启禁用状态为禁用"
				},
				{
					"command": "delete dns zone local dns-records naptr domain_naptr",
					"description": "删除本地NAPTR记录domain_naptr"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/naptr/{name}": {
			"description": "NAPTR记录配置管理操作",
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
				"summary": "get specific dns-record-naptr",
				"description": "查看指定的NAPTR记录",
				"operationId": "get_dns_record_naptr",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_naptr_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-naptr",
				"description": "创建一个NAPTR记录",
				"operationId": "create_dns_record_naptr",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-NAPTR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_naptr_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-naptr",
				"description": "修改指定的NAPTR记录",
				"operationId": "replace_dns_record_naptr",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-NAPTR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_naptr_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-naptr",
				"description": "增量修改指定的NAPTR记录",
				"operationId": "edit_dns_record_naptr",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-NAPTR-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_naptr_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-naptr",
				"description": "删除指定的NAPTR记录",
				"operationId": "delete_dns_record_naptr",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_naptr_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-NAPTR-CONFIG": {
			"name": "DNS-RECORD-NAPTR-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_naptr"
			}
		},
		"DNS-RECORD-NAPTR-PROPERTY": {
			"name": "DNS-RECORD-NAPTR-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_naptr"
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
		"operation_config_dns_record_naptr_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_naptr_list"
			}
		},
		"operation_config_dns_record_naptr_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_naptr"
			}
		}
	},
	"definitions": {
		"config.dns_record_naptr_list": {
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
						"$ref": "#/definitions/config.dns_record_naptr"
					}
				}
			}
		},
		"config.dns_record_naptr": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"naptr_records"
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
						"NAPTR"
					],
					"default": "NAPTR"
				},
				"ttl": {
					"type": "integer",
					"description": "TTL取值范围为[0,2147483647]，单位秒",
					"default": 60,
					"example": 60,
					"minimum": 0,
					"maximum": 2147483647
				},
				"naptr_records": {
					"type": "array",
					"description": "NAPTR记录列表",
					"items": {
						"type": "object",
						"description": "NAPTR记录值",
						"required": [
							"order",
							"priority",
							"replacement"
						],
						"properties": {
							"order": {
								"type": "integer",
								"description": "次序，校验格式为int，取值范围[0,65535]",
								"default": 1,
								"example": 1,
								"minimum": 0,
								"maximum": 65535
							},
							"priority": {
								"type": "integer",
								"description": "优先级，校验格式为int，取值范围[0,65535]",
								"default": 1,
								"example": 1,
								"minimum": 0,
								"maximum": 65535
							},
							"flags": {
								"type": "string",
								"description": "标志，可输入A-Z和0-9，校验格式为string，长度0-255，可为空",
								"default": "",
								"example": "",
								"minLength": 0,
								"maxLength": 255
							},
							"service": {
								"type": "string",
								"description": "服务参数，校验格式为string，长度0-255，可为空。",
								"default": "",
								"minLength": 0,
								"maxLength": 255
							},
							"regular_expression": {
								"type": "string",
								"description": "替换表达式，校验格式为string，长度0-255，可为空",
								"default": "",
								"minLength": 0,
								"maxLength": 255
							},
							"replacement": {
								"type": "string",
								"description": "下一个查询域名，校验格式为string，最大长度为250"
							}
						}
					},
					"minItems": 1,
					"maxItems": 7
				}
			}
		}
	}
}