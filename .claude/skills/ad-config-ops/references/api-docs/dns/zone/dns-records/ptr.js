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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/ptr/": {
			"description": "PTR记录配置管理操作",
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
				"summary": "get all dns-record-ptr",
				"description": "查看PTR记录",
				"operationId": "get_dns_record_ptr_list",
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
						"$ref": "#/responses/operation_config_dns_record_ptr_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-ptr",
				"description": "创建PTR记录",
				"operationId": "add_dns_record_ptr_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-PTR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ptr_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records ptr",
					"description": "获取本地全部PTR记录配置"
				},
				{
					"command": "list dns zone local dns-records ptr domain_ptr",
					"description": "获取本地指定PTR记录domain_ptr配置"
				},
				{
					"command": "create  dns zone local dns-records ptr  \"domain_ptr\" domain \"11.22.33.44\" zone \"in-addr.arpa\" state \"enable\" type \"ptr\" ptr_records [ { ttl 60 domain \"www.test.com\" }  ]",
					"description": "创建权威域in-addr.arpa下名称为domain_ptr的PTR记录，其TTL为60，记录值列表中存在www.test.com记录值"
				},
				{
					"command": "modify dns zone local dns-records ptr domain_ptr ptr_records [ { ttl 60 domain \"www.test1.com\" }  ]",
					"description": "修改本地PTR记录domain_ptr的记录值的域名为www.test1.com"
				},
				{
					"command": "delete dns zone local dns-records ptr domain_ptr",
					"description": "删除本地PTR记录domain_ptr"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/ptr/{name}": {
			"description": "PTR记录配置管理操作",
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
				"summary": "get specific dns-record-ptr",
				"description": "查看指定的PTR记录",
				"operationId": "get_dns_record_ptr",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ptr_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-ptr",
				"description": "创建一个PTR记录",
				"operationId": "create_dns_record_ptr",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-PTR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ptr_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-ptr",
				"description": "修改指定的PTR记录",
				"operationId": "replace_dns_record_ptr",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-PTR-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ptr_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-ptr",
				"description": "增量修改指定的PTR记录",
				"operationId": "edit_dns_record_ptr",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-PTR-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ptr_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-ptr",
				"description": "删除指定的PTR记录",
				"operationId": "delete_dns_record_ptr",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_ptr_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-PTR-CONFIG": {
			"name": "DNS-RECORD-PTR-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ptr"
			}
		},
		"DNS-RECORD-PTR-PROPERTY": {
			"name": "DNS-RECORD-PTR-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ptr"
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
		"operation_config_dns_record_ptr_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ptr_list"
			}
		},
		"operation_config_dns_record_ptr_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_ptr"
			}
		}
	},
	"definitions": {
		"config.dns_record_ptr_list": {
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
						"$ref": "#/definitions/config.dns_record_ptr"
					}
				}
			}
		},
		"config.dns_record_ptr": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"ptr_records"
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
					"description": "反向域名，按域名格式校验。"
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
						"PTR"
					],
					"default": "PTR",
					"example": "PTR"
				},
				"ptr_records": {
					"type": "array",
					"description": "PTR记录列表",
					"items": {
						"type": "object",
						"description": "PTR记录值",
						"required": [
							"domain"
						],
						"properties": {
							"domain": {
								"type": "string",
								"description": "正向域名，校验格式为单个域名（最大长度250）"
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
					"maxItems": 512
				}
			}
		}
	}
}