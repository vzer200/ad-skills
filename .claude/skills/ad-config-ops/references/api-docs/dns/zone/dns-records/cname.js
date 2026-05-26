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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/cname/": {
			"description": "CNAME记录配置管理操作",
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
				"summary": "get all dns-record-cname",
				"description": "查看CNAME记录",
				"operationId": "get_dns_record_cname_list",
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
						"$ref": "#/responses/operation_config_dns_record_cname_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-cname",
				"description": "创建一个CNAME记录",
				"operationId": "add_dns_record_cname_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CNAME-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_cname_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records cname",
					"description": "获取本地全部CNAME记录配置"
				},
				{
					"command": "list dns zone local dns-records cname domain_cname",
					"description": "获取本地指定CNAME记录domain_cname配置"
				},
				{
					"command": "create  dns zone local dns-records cname  \"domain_cname\" ttl 60 cname_records \"test.com\" domain \"domain_cname\" zone \"ssss\" state \"enable\" type \"cname\"",
					"description": "创建权威域ssss下名称为domain_cname的CNAME记录，其记录值为test.com"
				},
				{
					"command": "modify dns zone local dns-records cname domain_cname cname_records \"test1.com\"",
					"description": "修改本地CNAME记录domain_cname的记录值为test1.com"
				},
				{
					"command": "delete dns zone local dns-records cname domain_cname",
					"description": "删除本地A记录domain_cname"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/cname/{name}": {
			"description": "CNAME记录配置管理操作",
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
				"summary": "get specific dns-record-cname",
				"description": "查看指定的CNAME记录",
				"operationId": "get_dns_record_cname",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_cname_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-cname",
				"description": "创建一个CNAME记录",
				"operationId": "create_dns_record_cname",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CNAME-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_cname_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-cname",
				"description": "修改指定的CNAME记录",
				"operationId": "replace_dns_record_cname",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CNAME-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_cname_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-cname",
				"description": "增量修改指定的CNAME记录",
				"operationId": "edit_dns_record_cname",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-CNAME-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_cname_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-cname",
				"description": "删除指定的CNAME记录",
				"operationId": "delete_dns_record_cname",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_cname_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns dns-record global cname test.global.com",
					"description": "查看全局域名CNAME记录，域名为：test.global.com"
				},
				{
					"command": "list dns dns-record local cname test.local.com",
					"description": "查看本地域名CNAME记录，域名为：test.local.com"
				},
				{
					"command": "create dns dns-record global cname test.cname.global.com  description 域名CNAME记录 state enable ttl 22 type cname cname_records add [ test_other.cname.global.com]",
					"description": "新建全局域名CNAME记录 域名为：test.cname.global.com 别名记录：test_other.cname.global.com"
				},
				{
					"command": "create dns dns-record local cname test.cname.local.com  description 域名CNAME记录 state enable ttl 22 type cname cname_records add [ test_other.cname.local.com]",
					"description": "新建本地域名CNAME记录 域名为：test.cname.local.com 别名记录：test_other.cname.local.com"
				},
				{
					"command": "modify dns dns-record global cname test.cname.global.com name test_new.cname.global.com state disable description 修改CNAME type cname cname_records add [ test_add.cname.global.com]",
					"description": "修改全局域名CNAME记录 修改前域名：test.cname.global.com 修改后域名：test_new.cname.global.com 新增别名记录：test_add.cname.global.com"
				},
				{
					"command": "modify dns dns-record local cname test.cname.local.com name test_new.cname.local.com state disable description 修改CNAME type cname cname_records add [ test_add.cname.local.com]",
					"description": "修改本地域名CNAME记录 修改前域名：test.cname.local.com 修改后域名：test_new.cname.local.com 新增别名记录：test_add.cname.local.com"
				},
				{
					"command": " delete dns dns-record global cname test_new.cname.global.com",
					"description": "删除全局域名CNAME记录 域名为：test_new.cname.global.com"
				},
				{
					"command": " delete dns dns-record local cname test_new.cname.local.com",
					"description": "删除本地域名CNAME记录 域名为：test_new.cname.local.com"
				}
			]
		}
	},
	"parameters": {
		"DNS-RECORD-CNAME-CONFIG": {
			"name": "DNS-RECORD-CNAME-CONFIG",
			"in": "body",
			"required": true,
			"description": "域名CNAME记录配置",
			"schema": {
				"$ref": "#/definitions/config.dns_record_cname"
			}
		},
		"DNS-RECORD-CNAME-PROPERTY": {
			"name": "DNS-RECORD-CNAME-PROPERTY",
			"in": "body",
			"required": true,
			"description": "域名CNAME记录属性",
			"schema": {
				"$ref": "#/definitions/config.dns_record_cname"
			}
		},
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "本地或者全局",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_config_dns_record_cname_list": {
			"description": "域名CNAME记录列表",
			"schema": {
				"$ref": "#/definitions/config.dns_record_cname_list"
			}
		},
		"operation_config_dns_record_cname_object": {
			"description": "域名CNAME记录对象",
			"schema": {
				"$ref": "#/definitions/config.dns_record_cname"
			}
		}
	},
	"definitions": {
		"config.dns_record_cname_list": {
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
						"$ref": "#/definitions/config.dns_record_cname"
					}
				}
			}
		},
		"config.dns_record_cname": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"cname_records"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "名称。做重复校验"
				},
				"type": {
					"type": "string",
					"description": "类型",
					"enum": [
						"CNAME"
					],
					"default": "CNAME"
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
				"cname_records": {
					"type": "string",
					"description": "别名记录，校验格式仅为域名（最大长度250）。必须且只能配置1条",
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