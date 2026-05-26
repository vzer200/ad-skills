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
		"/api/ad/v3/lc/dns-intranet-record/txt/": {
			"description": "DNS txt记录配置管理操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				}
			],
			"get": {
				"tags": [
					"dns-intranet-record"
				],
				"summary": "get all dns-intranet-record-txt",
				"description": "查看DNS txt记录信息",
				"operationId": "get_dns_intranet_record_txt_list",
				"parameters": [
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
						"$ref": "#/responses/operation_config_dns_intranet_record_txt_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-intranet-record"
				],
				"summary": "create new dns-intranet-record-txt",
				"description": "新建DNS txt记录信息",
				"operationId": "add_dns_intranet_record_txt_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-INTRANET-RECORD-TXT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_intranet_record_txt_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create lc dns-intranet-record txt www.test.com txt_record ‘spf1 include:spf.test.com -all’ ",
					"description": "新建内网DNS记录——TXT记录，域名为www.test.com，TXT值记录列表为‘spf1 include:spf.test.com -all’。"
				},
				{
					"command": " modify  lc dns-intranet-record txt www.test.com txt_record 'spf2 include:spf.test.com -all'",
					"description": "修改内网DNS记录-TXT记录，针对域名为www.test.com，修改TXT值记录列表为‘spf2 include:spf.test.com -all’。"
				},
				{
					"command": "list lc dns-intranet-record txt www.test.com",
					"description": "查看内网DNS记录TXT记录www.test.com的配置信息"
				}
			]
		},
		"/api/ad/v3/lc/dns-intranet-record/txt/{name}": {
			"description": "DNS txt记录配置管理操作",
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
				}
			],
			"get": {
				"tags": [
					"dns-intranet-record"
				],
				"summary": "get specific dns-intranet-record-txt",
				"description": "查看DNS txt记录信息",
				"operationId": "get_dns_intranet_record_txt",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_intranet_record_txt_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-intranet-record"
				],
				"summary": "create new dns-intranet-record-txt",
				"description": "新建DNS txt记录信息",
				"operationId": "create_dns_intranet_record_txt",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-INTRANET-RECORD-TXT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_intranet_record_txt_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-intranet-record"
				],
				"summary": "replace specific dns-intranet-record-txt",
				"description": "更新DNS txt记录信息",
				"operationId": "replace_dns_intranet_record_txt",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-INTRANET-RECORD-TXT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_intranet_record_txt_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-intranet-record"
				],
				"summary": "modify specific dns-intranet-record-txt",
				"description": "更新DNS txt记录信息",
				"operationId": "edit_dns_intranet_record_txt",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-INTRANET-RECORD-TXT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_intranet_record_txt_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-intranet-record"
				],
				"summary": "delete specific dns-intranet-record-txt",
				"description": "删除DNS txt记录信息",
				"operationId": "delete_dns_intranet_record_txt",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_intranet_record_txt_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-INTRANET-RECORD-TXT-CONFIG": {
			"name": "DNS-INTRANET-RECORD-TXT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_intranet_record_txt"
			}
		},
		"DNS-INTRANET-RECORD-TXT-PROPERTY": {
			"name": "DNS-INTRANET-RECORD-TXT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_intranet_record_txt"
			}
		}
	},
	"responses": {
		"operation_config_dns_intranet_record_txt_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_intranet_record_txt_list"
			}
		},
		"operation_config_dns_intranet_record_txt_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_intranet_record_txt"
			}
		}
	},
	"definitions": {
		"config.dns_intranet_record_txt_list": {
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
					"description": "dns txt内网记录列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.dns_intranet_record_txt"
					}
				}
			}
		},
		"config.dns_intranet_record_txt": {
			"type": "object",
			"required": [
				"name",
				"txt_record"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；内网DNS记录——TXT记录的域名。",
					"example": "localhost"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"state": {
					"type": "string",
					"description": "可选参数；记录的状态，可选值有：enalbe（启用），disable（禁用）；默认为启用。",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"type": {
					"type": "string",
					"description": "可选参数；记录的类型，TXT记录的类型为txt。",
					"enum": [
						"TXT"
					],
					"default": "TXT"
				},
				"txt_record": {
					"type": "string",
					"description": "必选参数；TXT值记录列表，类型为字符串，如v=‘spf1 include:spf.test.com -all’。",
					"maxLength": 255,
					"minLength": 1
				},
				"ttl": {
					"type": "integer",
					"description": "可选参数；TXT记录的TTL，类型为整数，单位是秒，默认是60。",
					"default": 0,
					"example": 60,
					"maximum": 86400,
					"minimum": 0
				}
			}
		}
	}
}