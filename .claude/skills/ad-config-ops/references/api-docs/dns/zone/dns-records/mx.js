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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/mx/": {
			"description": "MX记录配置管理操作",
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
				"summary": "get all dns-record-mx",
				"description": "查看MX记录",
				"operationId": "get_dns_record_mx_list",
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
						"$ref": "#/responses/operation_config_dns_record_mx_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-mx",
				"description": "创建MX记录",
				"operationId": "add_dns_record_mx_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-MX-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_mx_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records mx",
					"description": "获取本地全部MX记录配置"
				},
				{
					"command": "list dns zone local dns-records mx domain_mx",
					"description": "获取本地指定MX记录domain_mx配置"
				},
				{
					"command": "create  dns zone local dns-records mx  \"domain_mx\" domain \"domain_mx\" zone \"ssss\" state \"enable\" type \"mx\" mx_records [ { priority 1 ttl 60 host \"test.com\" }  ]",
					"description": "创建权威域ssss下名称为domain_mx的MX记录，记录值列表中存在优先级为1，TTL为60，主机为test.com的记录"
				},
				{
					"command": "modify dns zone local dns-records mx domain_mx mx_records [ { priority 1 ttl 60 host \"test1.com\" }  ]",
					"description": "修改本地MX记录domain_mx的记录值的主机名为test1.com"
				},
				{
					"command": "delete dns zone local dns-records mx domain_mx",
					"description": "删除本地MX记录domain_mx"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/mx/{name}": {
			"description": "MX记录配置管理操作",
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
				"summary": "get specific dns-record-mx",
				"description": "查看指定的MX记录",
				"operationId": "get_dns_record_mx",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_mx_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-mx",
				"description": "创建一个MX记录",
				"operationId": "create_dns_record_mx",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-MX-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_mx_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-mx",
				"description": "修改指定的MX记录",
				"operationId": "replace_dns_record_mx",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-MX-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_mx_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-mx",
				"description": "增量修改指定的MX记录",
				"operationId": "edit_dns_record_mx",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-MX-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_mx_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-mx",
				"description": "删除指定的MX记录",
				"operationId": "delete_dns_record_mx",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_mx_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-MX-CONFIG": {
			"name": "DNS-RECORD-MX-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_mx"
			}
		},
		"DNS-RECORD-MX-PROPERTY": {
			"name": "DNS-RECORD-MX-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_mx"
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
		"operation_config_dns_record_mx_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_mx_list"
			}
		},
		"operation_config_dns_record_mx_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_mx"
			}
		}
	},
	"definitions": {
		"config.dns_record_mx_list": {
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
						"$ref": "#/definitions/config.dns_record_mx"
					}
				}
			}
		},
		"config.dns_record_mx": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"mx_records"
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
						"MX"
					],
					"default": "MX",
					"example": "MX"
				},
				"mx_records": {
					"type": "array",
					"description": "MX记录列表",
					"items": {
						"type": "object",
						"description": "MX记录值",
						"required": [
							"host",
							"priority"
						],
						"properties": {
							"host": {
								"type": "string",
								"description": "主机名，校验格式为单个域名（最大长度250）或IPv4地址"
							},
							"priority": {
								"type": "integer",
								"description": "优先级，16位无符号整数，取值范围[0,65535]",
								"default": 1,
								"example": 1,
								"minimum": 0,
								"maximum": 65535
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
					"maxItems": 7
				}
			}
		}
	}
}