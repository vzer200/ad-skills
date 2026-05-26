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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/hinfo/": {
			"description": "HINFO记录配置管理操作",
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
				"summary": "get all dns-record-hinfo",
				"description": "查看HINFO记录",
				"operationId": "get_dns_record_hinfo_list",
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
						"$ref": "#/responses/operation_config_dns_record_hinfo_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-hinfo",
				"description": "创建HINFO记录",
				"operationId": "add_dns_record_hinfo_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-HINFO-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_hinfo_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records hinfo",
					"description": "获取本地全部HINFO记录配置"
				},
				{
					"command": "list dns zone local dns-records hinfo domain_hinfo",
					"description": "获取本地指定HINFO记录domain_hinfo配置"
				},
				{
					"command": "create  dns zone local dns-records hinfo  \"domain_hinfo\" ttl 60 domain \"domain_hinfo\" zone \"ssss\" state \"enable\" type \"hinfo\" hinfo_records [ { cpu \"i7\" os \"linux\" }  ]",
					"description": "创建权威域ssss下名称为domain_hinfo的HINFO记录，其TTL为60，记录值列表中存在cpu为i7，os为linux的记录值"
				},
				{
					"command": "modify dns zone local dns-records hinfo domain_hinfo hinfo_records [ { cpu \"i9\" os \"linux\" }  ]",
					"description": "修改本地HINFO记录domain_hinfo的记录值的cpu为i9"
				},
				{
					"command": "delete dns zone local dns-records hinfo domain_hinfo",
					"description": "删除本地HINFO记录domain_hinfo"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/hinfo/{name}": {
			"description": "HINFO记录配置管理操作",
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
				"summary": "get specific dns-record-hinfo",
				"description": "修改指定的HINFO记录",
				"operationId": "get_dns_record_hinfo",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_hinfo_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-hinfo",
				"description": "创建一个HINFO记录",
				"operationId": "create_dns_record_hinfo",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-HINFO-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_hinfo_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-hinfo",
				"description": "修改指定的HINFO记录",
				"operationId": "replace_dns_record_hinfo",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-HINFO-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_hinfo_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-hinfo",
				"description": "增量修改指定的HINFO记录",
				"operationId": "edit_dns_record_hinfo",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-HINFO-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_hinfo_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-hinfo",
				"description": "删除指定的HINFO记录",
				"operationId": "delete_dns_record_hinfo",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_hinfo_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-HINFO-CONFIG": {
			"name": "DNS-RECORD-HINFO-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_hinfo"
			}
		},
		"DNS-RECORD-HINFO-PROPERTY": {
			"name": "DNS-RECORD-HINFO-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_hinfo"
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
		"operation_config_dns_record_hinfo_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_hinfo_list"
			}
		},
		"operation_config_dns_record_hinfo_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_hinfo"
			}
		}
	},
	"definitions": {
		"config.dns_record_hinfo_list": {
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
						"$ref": "#/definitions/config.dns_record_hinfo"
					}
				}
			}
		},
		"config.dns_record_hinfo": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"hinfo_records"
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
						"HINFO"
					],
					"default": "HINFO"
				},
				"hinfo_records": {
					"type": "array",
					"description": "HINFO记录列表",
					"items": {
						"type": "object",
						"description": "HINFO记录值",
						"properties": {
							"cpu": {
								"type": "string",
								"description": "cpu信息，校验格式为string，长度0-255，可为空",
								"default": "",
								"minLength": 0,
								"maxLength": 255
							},
							"os": {
								"type": "string",
								"description": "操作系统信息，校验格式为string，长度0-255，可为空",
								"default": "",
								"minLength": 0,
								"maxLength": 255
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