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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/dname/": {
			"description": "DNAME记录配置管理操作",
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
				"summary": "get all dns-record-dname",
				"description": "查看DNAME记录",
				"operationId": "get_dns_record_dname_list",
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
						"$ref": "#/responses/operation_config_dns_record_dname_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-dname",
				"description": "创建一个DNAME记录",
				"operationId": "add_dns_record_dname_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DNAME-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_dname_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records dname",
					"description": "获取本地全部DNAME记录配置"
				},
				{
					"command": "list dns zone local dns-records dname domain_dname",
					"description": "获取本地指定DNAME记录domain_dname配置"
				},
				{
					"command": "create  dns zone local dns-records dname  \"domain_dname\" ttl 60 dname_records \"test.com\" domain \"domain_dname\" zone \"ssss\" state \"enable\" type \"dname\"",
					"description": "创建权威域ssss下名称为domain_dname的DNAME记录，其记录值为test.com"
				},
				{
					"command": "modify dns zone local dns-records dname domain_dname dname_records \"test1.com\"",
					"description": "修改本地DNAME记录domain_dname的记录值为test1.com"
				},
				{
					"command": "delete dns zone local dns-records dname domain_dname",
					"description": "删除本地A记录domain_dname"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/dname/{name}": {
			"description": "DNAME记录配置管理操作",
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
				"summary": "get specific dns-record-dname",
				"description": "查看指定的DNAME记录",
				"operationId": "get_dns_record_dname",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_dname_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-dname",
				"description": "创建一个DNAME记录",
				"operationId": "create_dns_record_dname",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DNAME-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_dname_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-dname",
				"description": "修改指定的DNAME记录",
				"operationId": "replace_dns_record_dname",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DNAME-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_dname_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-dname",
				"description": "增量修改指定的DNAME记录",
				"operationId": "edit_dns_record_dname",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-DNAME-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_dname_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-dname",
				"description": "删除指定的DNAME记录",
				"operationId": "delete_dns_record_dname",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_dname_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-DNAME-CONFIG": {
			"name": "DNS-RECORD-DNAME-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_dname"
			}
		},
		"DNS-RECORD-DNAME-PROPERTY": {
			"name": "DNS-RECORD-DNAME-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_dname"
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
		"operation_config_dns_record_dname_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_dname_list"
			}
		},
		"operation_config_dns_record_dname_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_dname"
			}
		}
	},
	"definitions": {
		"config.dns_record_dname_list": {
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
						"$ref": "#/definitions/config.dns_record_dname"
					}
				}
			}
		},
		"config.dns_record_dname": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"dname_records"
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
					"description": "类型",
					"type": "string",
					"enum": [
						"DNAME"
					],
					"default": "DNAME",
					"example": "DNAME"
				},
				"dname_records": {
					"type": "string",
					"description": "dname记录，校验格式为域名（最大长度250）。必须且只能配置1条",
					"minLength": 1,
					"maxLength": 250
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
		}
	}
}