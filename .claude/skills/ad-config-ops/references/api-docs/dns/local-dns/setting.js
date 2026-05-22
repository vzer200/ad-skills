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
		"/api/ad/v4/dns/local-dns/setting": {
			"description": "LDNS基础配置管理操作",
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
					"local-dns-setting"
				],
				"summary": "get local-dns-setting",
				"description": "查看LDNS基础配置",
				"operationId": "get_local_dns_setting",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_dns_setting_object"
					}
				}
			},
			"put": {
				"tags": [
					"local-dns-setting"
				],
				"summary": "replace local-dns-setting",
				"description": "修改LDNS基础配置",
				"operationId": "replace_local_dns_setting",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-DNS-SETTING-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_dns_setting_object"
					}
				}
			},
			"patch": {
				"tags": [
					"local-dns-setting"
				],
				"summary": "modify ldns-setting",
				"description": "增量修改DNS基础配置",
				"operationId": "edit_local_dns_setting",
				"parameters": [
					{
						"$ref": "#/parameters/LOCAL-DNS-SETTING-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_local_dns_setting_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns local-dns setting",
					"description": "查看所有基础配置"
				},
				{
					"command": "modify dns local-dns setting cache { message_cache_capacity_mb 10 }",
					"description": "修改消息缓存大小为10"
				},
				{
					"command": "modify dns local-dns setting resolution { root_hints [ 1.1.1.1 1::1 ] }",
					"description": "修改根服务器配置"
				},
				{
					"command": "modify dns local-dns setting security { trust_anchor add [ { trust_anchor_child . 111 IN DNSKEY 256 3 5 AwEAAa5ftipeOPuJWYs2epfMNEefgaeru3QIjieACBymSaTb57huwJcq PBvlEso5WJbJr9mjuDVDM9Os69GiblfkbOc= } ] }",
					"description": "增加一个信任锚配置"
				},
				{
					"command": "modify dns local-dns setting security { access_control add [ { policy drop source_address 1.1.1.1/24 } ] }",
					"description": "增加一个访问控制策略"
				},
				{
					"command": "modify dns local-dns setting security { access_control delete [ { policy drop source_address 1.1.1.1/24 } ] }",
					"description": "删除一个访问控制策略"
				}
			]
		}
	},
	"parameters": {
		"LOCAL-DNS-SETTING-CONFIG": {
			"name": "LOCAL-DNS-SETTING-CONFIG",
			"in": "body",
			"required": true,
			"description": "LDNS基础配置",
			"schema": {
				"$ref": "#/definitions/config.local_dns_setting"
			}
		},
		"LOCAL-DNS-SETTING-PROPERTY": {
			"name": "LOCAL-DNS-SETTING-PROPERTY",
			"in": "body",
			"required": true,
			"description": "LDNS基础配置属性",
			"schema": {
				"$ref": "#/definitions/config.local_dns_setting"
			}
		}
	},
	"responses": {
		"operation_config_local_dns_setting_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.local_dns_setting"
			}
		}
	},
	"definitions": {
		"config.local_dns_setting": {
			"type": "object",
			"properties": {
				"cache": {
					"description": "缓存相关内容",
					"type": "object",
					"properties": {
						"message_cache_capacity_mb": {
							"description": "MSG缓存大小（单位：MB），取值范围[1,512]",
							"type": "integer",
							"default": 4,
							"maximum": 512,
							"minimum": 1,
							"example": 4
						},
						"resource_record_cache_capacity_mb": {
							"description": "RR缓存大小（单位：MB），取值范围[1,512]",
							"type": "integer",
							"default": 4,
							"maximum": 512,
							"minimum": 1,
							"example": 4
						},
						"key_cache_capacity_mb": {
							"type": "integer",
							"description": "密钥缓存大小（单位：MB），非必填，取值范围[1,1024]",
							"example": 4,
							"maximum": 1024,
							"minimum": 1,
							"default": 4
						},
						"negative_cache_capacity_mb": {
							"description": "否定记录缓存大小（单位：MB），取值范围[1,512]",
							"type": "integer",
							"default": 1,
							"maximum": 512,
							"minimum": 1,
							"example": 1
						},
						"cache_ttl_minimum": {
							"description": "全局缓存时间下限（单位：秒），下限为0",
							"type": "integer",
							"default": 0,
							"minimum": 0,
							"maximum": 86400,
							"example": 0
						},
						"cache_ttl_maximum": {
							"description": "全局缓存时间上限（单位：秒），上限为86400。并且所填下限值不能大于上限值",
							"type": "integer",
							"default": 86400,
							"minimum": 0,
							"maximum": 86400,
							"example": 86400
						},
						"negative_cache_ttl": {
							"description": "否定记录最大缓存时间（单位：秒），取值范围[0,86400]",
							"type": "integer",
							"default": 10800,
							"maximum": 86400,
							"minimum": 0,
							"example": 10800
						}
					}
				},
				"resolution": {
					"type": "object",
					"description": "DNS解析相关内容",
					"properties": {
						"ipv6_prefer": {
							"description": "IPv6优先。LDNS优先采用IPv6作为传输协议",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"max_query_per_second": {
							"description": "最大请求速率（QPS），取值范围[0,1000000]",
							"type": "integer",
							"default": 1024,
							"example": 1024,
							"maximum": 1000000,
							"minimum": 0
						},
						"edns_cache_capacity_byte": {
							"type": "integer",
							"description": "EDNS缓冲区大小（单位：字节），取值范围[512,65535]",
							"default": 1232,
							"example": 1232,
							"maximum": 65535,
							"minimum": 512
						},
						"root_hints": {
							"description": "根服务器地址。至少配1条，最多配置50条。默认值为 |\n198.41.0.4\n199.9.14.201\n192.33.4.12\n199.7.91.13\n192.203.230.10\n192.5.5.241\n192.112.36.4\n198.97.190.53\n192.36.148.17\n192.58.128.30\n193.0.14.129\n199.7.83.42\n202.12.27.33\n2001:503:ba3e::2:30\n2001:500:200::b\n2001:500:2::c\n2001:500:2d::d\n2001:500:a8::e\n2001:500:2f::f\n2001:500:12::d0d\n2001:500:1::53\n2001:7fe::53\n2001:503:c27::2:30\n2001:7fd::1\n2001:500:9f::42\n2001:dc3::35",
							"type": "array",
							"maxItems": 50,
							"minItems": 1,
							"items": {
								"description": "根服务器地址",
								"type": "string",
								"default": [
									"198.41.0.4",
									"199.9.14.201",
									"192.33.4.12",
									"199.7.91.13",
									"192.203.230.10",
									"192.5.5.241",
									"192.112.36.4",
									"198.97.190.53",
									"192.36.148.17",
									"192.58.128.30",
									"193.0.14.129",
									"199.7.83.42",
									"202.12.27.33",
									"2001:503:ba3e::2:30",
									"2001:500:200::b",
									"2001:500:2::c",
									"2001:500:2d::d",
									"2001:500:a8::e",
									"2001:500:2f::f",
									"2001:500:12::d0d",
									"2001:500:1::53",
									"2001:7fe::53",
									"2001:503:c27::2:30",
									"2001:7fd::1",
									"2001:500:9f::42",
									"2001:dc3::35"
								]
							}
						}
					}
				},
				"security": {
					"type": "object",
					"description": "安全相关内容",
					"properties": {
						"randomize_domain_name_case": {
							"description": "域名随机大小写（DNS-0x20）",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"access_control": {
							"description": "访问控制列表，可以不定义，最多定义50条",
							"type": "array",
							"maxItems": 50,
							"items": {
								"type": "object",
								"properties": {
									"source_address": {
										"type": "string",
										"description": "指定源地址。支持输入单个IPv4/IPv6地址，以及IPv4/IPv6子网，不支持IP范围",
										"example": "192.168.1.1/24"
									},
									"policy": {
										"type": "string",
										"description": "必选参数；allow表示允许，drop表示丢弃，deny表示拒绝，drop-non-local丢弃非本地，deny-non-local拒绝非本地",
										"enum": [
											"ALLOW",
											"DROP",
											"DENY",
											"DROP-NON-LOCAL",
											"DENY-NON-LOCAL"
										],
										"default": "ALLOW",
										"example": "ALLOW"
									}
								}
							}
						},
						"dnssec": {
							"type": "string",
							"description": "DNSSEC启/禁用，默认禁用。禁用时key_cache_capacity_mb和trust_anchor配置项均不显示",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"example": "DISABLE",
							"default": "DISABLE"
						},
						"trust_anchor": {
							"type": "array",
							"description": "信任锚列表",
							"maxItems": 100,
							"minItems": 1,
							"items": {
								"type": "object",
								"properties": {
									"trust_anchor_child": {
										"description": "信任锚记录，开启dnssec时必填",
										"type": "string",
										"default": ".       86400   IN      DNSKEY  257 3 8 AwEAAaz/tAm8yTn4Mfeh5eyI96WSVexTBAvkMgJzkKTOiW1vkIbzxeF3+/4RgWOq7HrxRixHlFlExOLAJr5emLvN7SWXgnLh4+B5xQlNVz8Og8kvArMtNROxVQuCaSnIDdD5LKyWbRd2n9WGe2R8PzgCmr3EgVLrjyBxWezF0jLHwVN8efS3rCj/EWgvIWgb9tarpVUDK/b58Da+sqqls3eNbuv7pr+eoZG+SrDK6nWeL3c6H5Apxz7LjVc1uTIdsIXxuOLYA4/ilBmSVIzuDWfdRUfhHdY6+cn8HFRm+2hM8AnXGXws9555KrUB5qihylGa8subX2Nn6UwNR1AkUTV74bU="
									},
									"domain": {
										"description": "信任锚中的域名",
										"title": "信任锚中的域名",
										"__format__description__": "长度限制为1~250个字节,必须由字母、数字、-和_组成,中间用'.'进行分隔,每段长度为1~63",
										"type": "string",
										"readOnly": true,
										"format": "trust_anchor_domain"
									},
									"ttl": {
										"description": "信任锚中的域名",
										"title": "信任锚中的记录生存时间(TTL)",
										"__format__description__": "必须为0~86400之间的整数",
										"type": "integer",
										"readOnly": true,
										"minimum": 0,
										"maximum": 86400,
										"default": 60,
										"example": 180
									},
									"class": {
										"description": "信任锚中的CLASS",
										"title": "信任锚中的CLASS",
										"__format__description__": "默认值为IN",
										"type": "string",
										"readOnly": true,
										"format": "record_class",
										"default": "IN",
										"example": "IN"
									},
									"record_type": {
										"description": "信任锚中的DNS记录类型",
										"title": "信任锚中的DNS记录类型",
										"__format__description__": "合法输入为：DS和DNSKEY",
										"type": "string",
										"readOnly": true,
										"format": "trust_anchor_domain"
									},
									"uuid": {
										"description": "信任锚中的标识符范围为0~65536",
										"title": "信任锚中的标识符",
										"__format__description__": "必须为0~65536之间的整数",
										"type": "integer",
										"readOnly": true,
										"minimum": 0,
										"maximum": 65536,
										"default": 257,
										"example": 257
									},
									"algorithm_type": {
										"description": "信任锚中的算法类型范围为0~512",
										"title": "信任锚中的算法类型",
										"__format__description__": "必须为0~512之间的整数",
										"type": "integer",
										"readOnly": true,
										"minimum": 0,
										"maximum": 512,
										"default": 3,
										"example": 3
									},
									"summary_type": {
										"description": "信任锚中的摘要类型范围为0~512",
										"title": "信任锚中的摘要类型",
										"__format__description__": "必须为0~512之间的整数",
										"type": "integer",
										"readOnly": true,
										"minimum": 0,
										"maximum": 512,
										"default": 8,
										"example": 8
									},
									"key_label": {
										"description": "信任锚中的KEY标签",
										"title": "信任锚中的KEY标签范围为0~65536",
										"__format__description__": "必须为0~65536之间的整数",
										"type": "integer",
										"readOnly": true,
										"minimum": 0,
										"maximum": 65536,
										"default": 257,
										"example": 257
									},
									"protocol": {
										"description": "信任锚中的协议范围为0~512",
										"title": "信任锚中的协议",
										"__format__description__": "必须为0~512之间的整数",
										"type": "integer",
										"readOnly": true,
										"minimum": 0,
										"maximum": 512,
										"default": 3,
										"example": 3
									},
									"value": {
										"description": "信任锚中的摘要值",
										"title": "信任锚中的摘要值",
										"__format__description__": "必须为string类型,不允许包含特殊字符& | \" ' , % < > \\ ?和中文字符",
										"type": "string",
										"readOnly": true,
										"maxLength": 3800,
										"format": "trust_anchor_value"
									},
									"secret_key": {
										"description": "信任锚中的密钥",
										"title": "信任锚中的密钥",
										"__format__description__": "必须为string类型,不允许包含特殊字符& | \" ' , % < > \\ ?和中文字符",
										"type": "string",
										"readOnly": true,
										"maxLength": 3800,
										"format": "trust_anchor_value"
									}
								}
							}
						}
					}
				}
			}
		}
	}
}