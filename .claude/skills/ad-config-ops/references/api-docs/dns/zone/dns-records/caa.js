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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/caa/": {
			"description": "CAA记录配置管理操作",
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
				"summary": "get all dns-record-caa",
				"description": "查看CAA记录",
				"operationId": "get_dns_record_caa_list",
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
						"$ref": "#/responses/operation_config_dns_record_caa_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-caa",
				"description": "创建CAA记录",
				"operationId": "add_dns_record_caa_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CAA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_caa_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records caa",
					"description": "获取本地全部CAA记录配置"
				},
				{
					"command": "list dns zone local dns-records caa domain_caa",
					"description": "获取本地指定CAA记录domain_caa配置"
				},
				{
					"command": "create  dns zone local dns-records caa  \"domain_caa\" ttl 60 domain \"domain_caa\" zone \"ssss\" state \"enable\" type \"caa\" caa_records [ { tag \"issue\" value \"digicert.com\" }  ]",
					"description": "创建权威域ssss下名称为domain_caa的CAA记录，其标志为0，关联值为digicert.com，属性为issue"
				},
				{
					"command": "modify dns zone local dns-records caa domain_caa caa_records [ { tag \"issue\" value \"digicert.com\" flags 1 }  ]",
					"description": "修改本地CAA记录domain_caa的标志为1"
				},
				{
					"command": "delete dns zone local dns-records caa domain_caa",
					"description": "删除本地CAA记录domain_caa"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/caa/{name}": {
			"description": "CAA记录配置管理操作",
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
				"summary": "get specific dns-record-caa",
				"description": "查看指定的CAA记录",
				"operationId": "get_dns_record_caa",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_caa_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-caa",
				"description": "创建一个CAA记录",
				"operationId": "create_dns_record_caa",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CAA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_caa_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-caa",
				"description": "修改指定的CAA记录",
				"operationId": "replace_dns_record_caa",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CAA-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_caa_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-caa",
				"description": "增量修改指定的CAA记录",
				"operationId": "edit_dns_record_caa",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CAA-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_caa_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-caa",
				"description": "删除指定的CAA记录",
				"operationId": "delete_dns_record_caa",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_caa_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-CAA-CONFIG": {
			"name": "DNS-RECORD-CAA-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_caa"
			}
		},
		"DNS-RECORD-CAA-PROPERTY": {
			"name": "DNS-RECORD-CAA-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_caa"
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
		"operation_config_dns_record_caa_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_caa_list"
			}
		},
		"operation_config_dns_record_caa_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_caa"
			}
		}
	},
	"definitions": {
		"config.dns_record_caa_list": {
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
						"$ref": "#/definitions/config.dns_record_caa"
					}
				}
			}
		},
		"config.dns_record_caa": {
			"type": "object",
			"required": [
				"domain",
				"caa_records",
				"zone"
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
					"description": "TTL取值范围为[0,86400]，单位秒",
					"default": 60,
					"example": 60,
					"minimum": 0,
					"maximum": 2147483647
				},
				"type": {
					"type": "string",
					"description": "类型",
					"enum": [
						"CAA"
					],
					"default": "CAA"
				},
				"caa_records": {
					"type": "array",
					"description": "CAA记录列表",
					"items": {
						"type": "object",
						"description": "CAA记录值",
						"required": [
							"flags",
							"tag"
						],
						"properties": {
							"flags": {
								"type": "integer",
								"description": "标志，校验格式为8位无符号整数，输入范围为[0,255]",
								"minimum": 0,
								"maximum": 255
							},
							"tag": {
								"type": "string",
								"description": "属性，校验格式为string",
								"default": "issue",
								"example": "issue"
							},
							"value": {
								"type": "string",
								"description": "关联值，校验格式为string，最大长度4096，可为空",
								"default": "",
								"minLength": 0,
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