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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/ds/": {
			"description": "DS记录配置管理操作",
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
				"summary": "get all dns-record-ds",
				"description": "查看DS记录",
				"operationId": "get_dns_record_ds_list",
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
						"$ref": "#/responses/operation_config_dns_record_ds_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-ds",
				"description": "创建一个DS记录",
				"operationId": "add_dns_record_ds_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ds_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records ds",
					"description": "获取本地全部DS记录配置"
				},
				{
					"command": "list dns zone local dns-records ds domain_ds",
					"description": "获取本地指定DS记录domain_ds配置"
				},
				{
					"command": "create  dns zone local dns-records ds  \"domain_ds\" ttl 60 domain \"domain_ds\" zone \"ssss\" state \"enable\" type \"ds\" ds_records [ { key_tag 21198 algorithm 7 digest_type 1 digest \"7AD782EBEF783E30D275CB1F1CB32FA8BB303DFF\" }  ]",
					"description": "创建权威域ssss下名称为domain_ds的DS记录，其TTL为60，记录值的密钥标签为21198，算法为7，摘要类型为1，摘要为7AD782EBEF783E30D275CB1F1CB32FA8BB303DFF"
				},
				{
					"command": "modify dns zone local dns-records ds domain_ds ds_records add [ { key_tag 21198 algorithm 7 digest_type 1 digest \"20EC15729A6C59B20CE9FAF5D9DDE12F6BB1E29B\"} ]",
					"description": "修改本地DS记录domain_ds的记录值列表，增加密钥标签为21198，算法为7，摘要类型为1，摘要为20EC15729A6C59B20CE9FAF5D9DDE12F6BB1E29B的记录值"
				},
				{
					"command": "delete dns zone local dns-records ds domain_ds",
					"description": "删除本地DS记录domain_ds"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/ds/{name}": {
			"description": "DS记录配置管理操作",
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
				"summary": "get specific dns-record-ds",
				"description": "查看指定的DS记录",
				"operationId": "get_dns_record_ds",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ds_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-ds",
				"description": "创建一个DS记录",
				"operationId": "create_dns_record_ds",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ds_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-ds",
				"description": "修改指定的DS记录",
				"operationId": "replace_dns_record_ds",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ds_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-ds",
				"description": "增量修改指定的DS记录",
				"operationId": "edit_dns_record_ds",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ds_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-ds",
				"description": "删除指定的DS记录",
				"operationId": "delete_dns_record_ds",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ds_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-DS-CONFIG": {
			"name": "DNS-RECORD-DS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ds"
			}
		},
		"DNS-RECORD-DS-PROPERTY": {
			"name": "DNS-RECORD-DS-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ds"
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
		"operation_config_dns_record_ds_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ds_list"
			}
		},
		"operation_config_dns_record_ds_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ds"
			}
		}
	},
	"definitions": {
		"config.dns_record_ds_list": {
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
						"$ref": "#/definitions/config.dns_record_ds"
					}
				}
			}
		},
		"config.dns_record_ds": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"ds_records"
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
				"ttl": {
					"type": "integer",
					"description": "TTL取值范围为[0,2147483647]，单位秒",
					"default": 60,
					"example": 60,
					"minimum": 0,
					"maximum": 2147483647
				},
				"type": {
					"type": "string",
					"description": "类型",
					"enum": [
						"DS"
					],
					"default": "DS"
				},
				"ds_records": {
					"type": "array",
					"description": "DS记录列表",
					"items": {
						"type": "object",
						"description": "DS记录值",
						"required": [
							"key_tag",
							"algorithm",
							"digest_type",
							"digest"
						],
						"properties": {
							"key_tag": {
								"type": "integer",
								"description": "密钥标签，校验格式为16位无符号整数，输入范围[0,65535]",
								"minimum": 0,
								"maximum": 65535
							},
							"algorithm": {
								"type": "integer",
								"description": "算法，校验格式为int，输入范围[0,255]",
								"minimum": 0,
								"maximum": 255
							},
							"digest_type": {
								"type": "integer",
								"description": "摘要类型，校验格式为int，输入范围[0,255]",
								"minimum": 0,
								"maximum": 255
							},
							"digest": {
								"type": "string",
								"description": "摘要，校验格式为string，最大长度4096，可为空",
								"minLength": 1,
								"maxLength": 4096
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