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
		"/api/ad/v4/dns/local-dns/response-policy-zones/": {
			"description": "RPZ防火墙配置管理操作",
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
					"response-policy-zones"
				],
				"summary": "get all response-policy-zones",
				"description": "查看RPZ防火墙配置",
				"operationId": "get_response_policy_zones_list",
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
						"$ref": "#/responses/operation_config_response_policy_zones_list"
					}
				}
			},
			"post": {
				"tags": [
					"response-policy-zones"
				],
				"summary": "create new response-policy-zones",
				"description": "创建一个RPZ防火墙",
				"operationId": "add_response_policy_zones_list",
				"parameters": [
					{
						"$ref": "#/parameters/RESPONSE-POLICY-ZONES-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_response_policy_zones_object"
					}
				}
			}
		},
		"/api/ad/v4/dns/local-dns/response-policy-zones/{name}": {
			"description": "RPZ防火墙单个配置管理操作",
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
					"response-policy-zones"
				],
				"summary": "get specific response-policy-zones",
				"description": "查看指定已有的RPZ防火墙",
				"operationId": "get_response_policy_zones",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_response_policy_zones_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"response-policy-zones"
				],
				"summary": "create new response-policy-zones",
				"description": "创建一个RPZ防火墙",
				"operationId": "create_response_policy_zones",
				"parameters": [
					{
						"$ref": "#/parameters/RESPONSE-POLICY-ZONES-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_response_policy_zones_object"
					}
				}
			},
			"put": {
				"tags": [
					"response-policy-zones"
				],
				"summary": "replace specific response-policy-zones",
				"description": "修改指定已有名称的RPZ防火墙",
				"operationId": "replace_response_policy_zones",
				"parameters": [
					{
						"$ref": "#/parameters/RESPONSE-POLICY-ZONES-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_response_policy_zones_object"
					}
				}
			},
			"patch": {
				"tags": [
					"response-policy-zones"
				],
				"summary": "modify specific response-policy-zones",
				"description": "增量修改指定已有的RPZ防火墙",
				"operationId": "edit_response_policy_zones",
				"parameters": [
					{
						"$ref": "#/parameters/RESPONSE-POLICY-ZONES-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_response_policy_zones_object"
					}
				}
			},
			"delete": {
				"tags": [
					"response-policy-zones"
				],
				"summary": "delete specific response-policy-zones",
				"description": "删除指定已有的RPZ防火墙",
				"operationId": "delete_response_policy_zones",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_response_policy_zones_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns local-dns response-policy-zones",
					"description": "查看所有RPZ配置"
				},
				{
					"command": "create dns local-dns response-policy-zones test cname_record 111 rewrite_action drop record [ { record_child \"test.com 11 IN A 1.1.1.1\" } ]",
					"description": "创建一个名叫test的RPZ防火墙配置"
				},
				{
					"command": "modify  dns local-dns response-policy-zones test cname_record 111 rewrite_action drop record [ { record_child \"test.com IN CNAME rpz-drop.\" } ]",
					"description": "修改名为test的RPZ防火墙配置"
				},
				{
					"command": "delete dns local-dns response-policy-zones test",
					"description": "删除test转发域配置"
				}
			]
		}
	},
	"parameters": {
		"RESPONSE-POLICY-ZONES-CONFIG": {
			"name": "RESPONSE-POLICY-ZONES-CONFIG",
			"in": "body",
			"required": true,
			"description": "RPZ防火墙配置",
			"schema": {
				"$ref": "#/definitions/config.response_policy_zones"
			}
		},
		"RESPONSE-POLICY-ZONES-PROPERTY": {
			"name": "RESPONSE-POLICY-ZONES-PROPERTY",
			"in": "body",
			"required": true,
			"description": "RPZ防火墙属性",
			"schema": {
				"$ref": "#/definitions/config.response_policy_zones"
			}
		}
	},
	"responses": {
		"operation_config_response_policy_zones_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.response_policy_zones_list"
			}
		},
		"operation_config_response_policy_zones_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.response_policy_zones"
			}
		}
	},
	"definitions": {
		"config.response_policy_zones_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "项目数量最大值",
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
					"description": "页面大小",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "项目长度",
					"type": "integer",
					"example": 8
				},
				"items": {
					"type": "array",
					"description": "项目列表",
					"items": {
						"$ref": "#/definitions/config.response_policy_zones"
					}
				}
			}
		},
		"config.response_policy_zones": {
			"type": "object",
			"required": [
				"name",
				"record"
			],
			"properties": {
				"name": {
					"description": "RPZ防火墙的域，校验为域名格式",
					"type": "string",
					"example": "com",
					"maxLength": 200,
					"minLength": 1
				},
				"record": {
					"description": "RPZ防火墙记录内容",
					"type": "array",
					"maxItems": 50,
					"minItems": 1,
					"items": {
						"type": "object",
						"description": "RPZ记录列表",
						"properties": {
							"record_child": {
								"description": "RFC标准的防火墙记录,如“example.com IN CNAME *. ;NODATA”",
								"type": "string",
								"example": "example.com IN CNAME *. ;NODATA"
							},
							"domain": {
								"description": "防火墙记录中的域名",
								"title": "防火墙记录中的域名",
								"__format__description__": "长度限制为1~250个字节,必须由字母、数字、-和_组成,中间用'.'进行分隔,每段长度为1~63",
								"type": "string",
								"readOnly": true,
								"format": "dns_domain"
							},
							"ttl": {
								"description": "TTL超时时间范围为0-86400",
								"title": "DNS记录中的记录生存时间(TTL)",
								"__format__description__": "必须为0~86400之间的整数",
								"type": "integer",
								"readOnly": true,
								"minimum": 0,
								"maximum": 86400,
								"default": 60,
								"example": 180
							},
							"class": {
								"description": "DNS记录中的CLASS",
								"title": "DNS记录中的CLASS",
								"__format__description__": "默认值为IN",
								"type": "string",
								"readOnly": true,
								"format": "record_class",
								"default": "IN",
								"example": "IN"
							},
							"record_type": {
								"description": "DNS记录中的DNS记录类型",
								"title": "DNS记录中的DNS记录类型",
								"__format__description__": "合法输入为：A、AAAA、CNAME、MX、TXT、NS、SOA和SRV(不区分大小写)",
								"type": "string",
								"readOnly": true,
								"format": "string"
							},
							"v4": {
								"description": "A记录中的IPV4地址",
								"title": "A记录中的IPV4地址",
								"__format__description__": "必须为IPV4地址",
								"type": "string",
								"readOnly": true,
								"format": "string",
								"oneOf": {
									"format": "ipv4"
								}
							},
							"v6": {
								"description": "AAAA记录中的IPV6地址",
								"title": "AAAA记录中的IPV6地址",
								"__format__description__": "必须为IPV6地址",
								"type": "string",
								"readOnly": true,
								"format": "string",
								"oneOf": {
									"format": "ipv6"
								}
							},
							"policy": {
								"description": "防火墙动作",
								"title": "防火墙动作",
								"__format__description__": "合法输入为：'.' '*.' 'rpz-passthru.'和'rpz-drop.'",
								"readOnly": true,
								"type": "string",
								"format": "rpz_policy"
							}
						}
					}
				},
				"rewrite_action": {
					"description": "改写动作",
					"type": "string",
					"enum": [
						"NONE",
						"NXDOMAIN",
						"NODATA",
						"DROP",
						"CNAME"
					],
					"default": "NONE",
					"example": "NONE"
				},
				"cname_record": {
					"description": "CNAME记录，仅当改写动作选择CNAME时显示",
					"type": "string",
					"example": "www.baidu.com"
				}
			}
		}
	}
}