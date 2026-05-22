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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/txt/": {
			"description": "TXT记录配置管理操作",
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
				"summary": "get all dns-record-txt",
				"description": "查看TXT记录",
				"operationId": "get_dns_record_txt_list",
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
						"$ref": "#/responses/operation_config_dns_record_txt_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-txt",
				"description": "创建TXT记录",
				"operationId": "add_dns_record_txt_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-TXT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_txt_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records txt",
					"description": "获取本地全部TXT记录配置"
				},
				{
					"command": "list dns zone local dns-records txt domain_txt",
					"description": "获取本地指定TXT记录domain_txt配置"
				},
				{
					"command": "create  dns zone local dns-records txt  \"domain_txt\" ttl 60 txt_records [ \"abc\" ]  domain \"domain_txt\" zone \"ssss\" state \"enable\" type \"txt\"",
					"description": "创建权威域ssss下名称为domain_txt的TXT记录，其TTL为60，记录值列表中存在cpu为i7，os为linux的记录值"
				},
				{
					"command": "modify dns zone local dns-records txt domain_txt txt_records add [ \"edf\" ]",
					"description": "增加本地TXT记录domain_txt的记录值edf"
				},
				{
					"command": "delete dns zone local dns-records txt domain_txt",
					"description": "删除本地TXT记录domain_txt"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/txt/{name}": {
			"description": "TXT记录配置管理操作",
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
				"summary": "get specific dns-record-txt",
				"description": "查看指定的TXT记录",
				"operationId": "get_dns_record_txt",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_txt_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-txt",
				"description": "创建一个TXT记录",
				"operationId": "create_dns_record_txt",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-TXT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_txt_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-txt",
				"description": "修改指定的TXT记录",
				"operationId": "replace_dns_record_txt",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-TXT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_txt_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-txt",
				"description": "增量修改指定的TXT记录",
				"operationId": "edit_dns_record_txt",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-TXT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_txt_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-txt",
				"description": "删除指定的TXT记录",
				"operationId": "delete_dns_record_txt",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_txt_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-TXT-CONFIG": {
			"name": "DNS-RECORD-TXT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_txt"
			}
		},
		"DNS-RECORD-TXT-PROPERTY": {
			"name": "DNS-RECORD-TXT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_txt"
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
		"operation_config_dns_record_txt_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_txt_list"
			}
		},
		"operation_config_dns_record_txt_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_txt"
			}
		}
	},
	"definitions": {
		"config.dns_record_txt_list": {
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
						"$ref": "#/definitions/config.dns_record_txt"
					}
				}
			}
		},
		"config.dns_record_txt": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"txt_records"
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
						"TXT"
					],
					"default": "TXT"
				},
				"ttl": {
					"type": "integer",
					"description": "TTL取值范围为[0,2147483647]，单位秒",
					"default": 60,
					"example": 60,
					"minimum": 0,
					"maximum": 2147483647
				},
				"txt_records": {
					"type": "array",
					"description": "TXT记录列表",
					"items": {
						"type": "string",
						"description": "TXT记录值",
						"minLength": 0,
						"maxLength": 255
					},
					"minItems": 1,
					"maxItems": 7
				}
			}
		}
	}
}