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
		"/api/ad/v4/dns/local-dns/local-zone/": {
			"description": "本地域配置管理操作",
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
					"local-zone"
				],
				"summary": "get all local-zone",
				"description": "查看本地域配置",
				"operationId": "get_local_zone_list",
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
						"$ref": "#/responses/operation_config_local_zone_list"
					}
				}
			},
			"post": {
				"tags": [
					"local-zone"
				],
				"summary": "create new local-zone",
				"description": "创建一个本地域",
				"operationId": "add_local_zone_list",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_zone_object"
					}
				}
			}
		},
		"/api/ad/v4/dns/local-dns/local-zone/{name}": {
			"description": "LDNS本地域单条记录相关",
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
					"local-zone"
				],
				"summary": "get specific local-zone",
				"description": "查看指定已有的LDNS本地域",
				"operationId": "get_local_zone",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_zone_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"local-zone"
				],
				"summary": "create new local-zone",
				"description": "创建一个LDNS本地域",
				"operationId": "create_local_zone",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_zone_object"
					}
				}
			},
			"put": {
				"tags": [
					"local-zone"
				],
				"summary": "replace specific local-zone",
				"description": "修改指定已有名称的LDNS本地域",
				"operationId": "replace_local_zone",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_zone_object"
					}
				}
			},
			"patch": {
				"tags": [
					"local-zone"
				],
				"summary": "modify specific local_zone",
				"description": "增量修改指定已有的LDNS本地域",
				"operationId": "edit_local_zone",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-ZONE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_zone_object"
					}
				}
			},
			"delete": {
				"tags": [
					"local-zone"
				],
				"summary": "delete specific local-zone",
				"description": "删除指定已有的LDNS本地域",
				"operationId": "delete_local_zone",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_zone_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns local-dns local-zone",
					"description": "查看所有本地配置"
				},
				{
					"command": "create dns local-dns local-zone test policy static record [ { record_child \"a.test 120 IN A 1.1.1.1\" } ]",
					"description": "增加一条本地配置"
				},
				{
					"command": "delete dns local-dns local-zone test",
					"description": "删除test配置"
				},
				{
					"command": "modify dns local-dns local-zone test policy refuse",
					"description": "修改test配置"
				}
			]
		}
	},
	"parameters": {
		"LOCAL-ZONE-CONFIG": {
			"name": "LOCAL-ZONE-CONFIG",
			"in": "body",
			"required": true,
			"description": "LDNS本地域配置",
			"schema": {
				"$ref": "#/definitions/config.local_zone"
			}
		},
		"LOCAL-ZONE-PROPERTY": {
			"name": "LOCAL-ZONE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "LDNS本地域属性",
			"schema": {
				"$ref": "#/definitions/config.local_zone"
			}
		}
	},
	"responses": {
		"operation_config_local_zone_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.local_zone_list"
			}
		},
		"operation_config_local_zone_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.local_zone"
			}
		}
	},
	"definitions": {
		"config.local_zone_list": {
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
					"description": "项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.local_zone"
					}
				}
			}
		},
		"config.local_zone": {
			"type": "object",
			"required": [
				"name",
				"record"
			],
			"properties": {
				"name": {
					"description": "LDNS本地域，按域名格式校验，最大长度200",
					"type": "string",
					"example": "com",
					"maxLength": 200,
					"minLength": 1
				},
				"record": {
					"type": "array",
					"maxItems": 200,
					"minItems": 1,
					"description": "记录内容",
					"items": {
						"type": "object",
						"description": "记录列表",
						"properties": {
							"record_child": {
								"description": "RFC标准的DNS记录：“域名 TTL class DNS记录类型 DNS记录值”，校验时域名按域名格式，TTL输入范围[0,86400]，class须为IN，DNS记录类型为A/AAAA/CNAME/MX/TXT/NS/SOA/SRV",
								"type": "string",
								"example": "a.com 60 IN A 192.168.1.1"
							},
							"domain": {
								"description": "DNS记录中的域名",
								"title": "DNS记录中的域名",
								"__format__description__": "长度限制为1~200个字节,由字母、数字、-、_和.组成,每段长度为1~63,不支持通配符*",
								"type": "string",
								"readOnly": true,
								"format": "zone_domain"
							},
							"ttl": {
								"description": "TTL超时时间范围为0-86400",
								"title": "DNS记录中的记录生存时间(TTL)",
								"__format__description__": "必须为0~86400之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "zone_domain",
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
							"host": {
								"description": "LDNS记录中的主机名",
								"title": "LDNS记录中的主机名",
								"__format__description__": "长度限制为1~253个字节,只能由字母、数字、中划线-、下划线_和.组成",
								"type": "string",
								"readOnly": true,
								"format": "host_name"
							},
							"soa_host": {
								"description": "SOA记录中的电子邮件",
								"title": "SOA记录中的电子邮件",
								"__format__description__": "长度限制为1~253个字节,只能由字母、数字、中划线-、下划线_和.组成",
								"type": "string",
								"readOnly": true,
								"format": "host_name"
							},
							"serial": {
								"description": "soa记录的序列号",
								"title": "soa记录的序列号",
								"__format__description__": "必须为0~4294967295之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "record_class",
								"minimum": 0,
								"maximum": 4294967295
							},
							"refresh_interval": {
								"description": "soa记录的刷新时间",
								"title": "soa记录的刷新时间",
								"__format__description__": "必须为0~4294967295之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "record_class",
								"minimum": 0,
								"maximum": 4294967295
							},
							"retry_delay": {
								"description": "soa记录的重试时间",
								"title": "soa记录的重试时间",
								"__format__description__": "必须为0~4294967295之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "integer",
								"minimum": 0,
								"maximum": 4294967295
							},
							"expire_time": {
								"description": "soa记录的到期时间",
								"title": "soa记录的到期时间",
								"__format__description__": "必须为0~4294967295之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "integer",
								"minimum": 0,
								"maximum": 4294967295
							},
							"min_ttl": {
								"description": "soa记录的最小记录生存时间",
								"title": "soa记录的最小记录生存时间",
								"__format__description__": "必须为0~86400之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "integer",
								"minimum": 0,
								"maximum": 86400
							},
							"port": {
								"description": "srv记录的端口",
								"title": "srv记录的端口",
								"__format__description__": "必须为0~65535之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "integer",
								"minimum": 0,
								"maximum": 65535,
								"example": 80
							},
							"priority": {
								"description": "记录的优先级",
								"title": "srv记录的优先级",
								"__format__description__": "必须为0~100之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "integer",
								"minimum": 0,
								"maximum": 100
							},
							"weight": {
								"description": "srv记录的权重",
								"title": "srv记录的权重",
								"__format__description__": "必须为0~100之间的整数",
								"type": "integer",
								"readOnly": true,
								"format": "integer",
								"minimum": 0,
								"maximum": 100
							},
							"txt": {
								"description": "txt记录的记录值",
								"title": "txt记录的记录值",
								"__format__description__": "长度限制为1~255个字节,不允许包含特殊字符& | \" ' , % < > / \\ ?和中文字符",
								"type": "string",
								"readOnly": true,
								"format": "record_txt",
								"maxLength": 255,
								"minLength": 1
							}
						}
					}
				},
				"policy": {
					"description": "失败动作",
					"type": "string",
					"enum": [
						"DENY",
						"REDIRECT",
						"REFUSE",
						"STATIC",
						"TRANSPARENT",
						"TYPETRANSPARENT"
					],
					"default": "DENY",
					"example": "DENY"
				}
			}
		}
	}
}