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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/all/": {
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
				},
				{
					"$ref": "#/parameters/dns_record_type_search"
				},
				{
					"$ref": "#/parameters/dns_zone_search"
				}
			],
			"get": {
				"tags": [
					"dns-record"
				],
				"summary": "get all dns-record-all",
				"description": "查看所有记录",
				"operationId": "get_dns_record_all_list",
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
						"$ref": "#/responses/operation_config_dns_record_all_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records all",
					"description": "获取本地全部记录配置"
				}
			]
		}
	},
	"parameters": {
		"DNS-RECORD-ALL-CONFIG": {
			"name": "DNS-RECORD-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_all"
			}
		},
		"DNS-RECORD-ALL-PROPERTY": {
			"name": "DNS-RECORD-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_all"
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
		},
		"dns_record_type_search": {
			"name": "dns_record_type_search",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "提供DNS记录类型筛选，ALL代表所有类型。 注意【DNS记录类型筛选】和【域筛选】二者取交集；而自定义搜索是独立的",
			"enum": [
				"A",
				"CNAME",
				"MX",
				"NS",
				"PTR",
				"SRV",
				"TXT",
				"AAAA",
				"DS",
				"NAPTR",
				"CAA",
				"HINFO",
				"DNAME",
				"SOA",
				"ALL"
			]
		},
		"dns_zone_search": {
			"name": "dns_zone_search",
			"in": "path",
			"required": true,
			"description": "对DNS记录按域筛选,以及域删除时使用",
			"type": "array",
			"items": {
				"type": "string"
			}
		}
	},
	"responses": {
		"operation_config_dns_record_all_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_all_list"
			}
		},
		"operation_config_dns_record_all_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_all"
			}
		}
	},
	"definitions": {
		"config.dns_record_all_list": {
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
						"$ref": "#/definitions/config.dns_record_all"
					}
				}
			}
		},
		"config.dns_record_all": {
			"type": "object",
			"required": [
				"domain",
				"zone"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "名称"
				},
				"description": {
					"type": "string"
				},
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					]
				},
				"domain": {
					"type": "string",
					"description": "域名，按域名格式校验。"
				},
				"zone": {
					"type": "string",
					"description": "指定该DNS记录所属域",
					"example": "com"
				},
				"generate_ptr_record": {
					"type": "string",
					"description": "生成PTR记录",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"ttl": {
					"type": "integer",
					"description": "所有DNS记录的TTL取值范围均为[0, 2147483647]，单位秒",
					"default": 60
				},
				"type": {
					"type": "string",
					"description": "所有DNS记录类型（SOA记录可在DNS记录TAB中查看/编辑，但不能在DNS记录中创建，而是在新建域时创建）",
					"enum": [
						"A",
						"CNAME",
						"MX",
						"NS",
						"PTR",
						"SRV",
						"TXT",
						"AAAA",
						"DS",
						"NAPTR",
						"CAA",
						"HINFO",
						"DNAME",
						"SOA"
					]
				},
				"a_records": {
					"type": "array",
					"description": "A记录，至少配置1条，最多配置10条",
					"items": {
						"type": "object",
						"required": [
							"address"
						],
						"properties": {
							"address": {
								"type": "string",
								"description": "单个IPv4地址 (不能是IPv6地址）",
								"example": "192.168.1.7"
							},
							"ttl": {
								"type": "integer",
								"description": "TTL输入范围为[0,2147483647]，单位秒",
								"default": 60,
								"example": 60
							}
						}
					}
				},
				"cname_records": {
					"type": "string",
					"description": "别名记录，校验格式仅为域名。必须且只能配置1条"
				},
				"mx_records": {
					"type": "array",
					"description": "MX记录，至少配置1条，最多配置7条",
					"items": {
						"type": "object",
						"required": [
							"host"
						],
						"properties": {
							"host": {
								"type": "string",
								"description": "主机名，校验格式为单个域名或IPv4地址"
							},
							"priority": {
								"type": "integer",
								"description": "优先级，16位无符号整数，取值范围[0,65535]",
								"default": 1,
								"example": 1
							},
							"ttl": {
								"type": "integer",
								"description": "TTL取值范围为[0,2147483647]，单位秒",
								"default": 60,
								"example": 60
							}
						}
					}
				},
				"ns_records": {
					"type": "array",
					"description": "NS记录，至少配置1条，最多配置7条",
					"items": {
						"type": "object",
						"properties": {
							"domain": {
								"type": "string",
								"description": "校验格式为单个域名",
								"example": "ns1.www.baidu.com"
							}
						}
					}
				},
				"ptr_records": {
					"type": "array",
					"items": {
						"type": "object",
						"description": "最多配置512条",
						"required": [
							"domain"
						],
						"properties": {
							"domain": {
								"type": "string",
								"description": "正向域名，校验格式为单个域名或单个IPv4地址"
							},
							"ttl": {
								"type": "integer",
								"description": "TTL取值范围为[0,2147483647]，单位秒",
								"default": 60,
								"example": 60
							}
						}
					}
				},
				"srv_records": {
					"type": "array",
					"description": "SRV记录，至少配置1条，最多配置7条",
					"items": {
						"type": "object",
						"required": [
							"address",
							"port"
						],
						"properties": {
							"address": {
								"description": "主机名，校验格式为单个域名或单个IPv4地址",
								"type": "string",
								"example": "192.168.1.212"
							},
							"port": {
								"description": "端口,16位无符号整数，取值范围[0,65535]",
								"type": "integer"
							},
							"priority": {
								"description": "优先级,16位无符号整数，取值范围[0,65535]",
								"type": "integer",
								"default": 1,
								"example": 1
							},
							"weight": {
								"description": "权重,16位无符号整数，取值范围[0,65535]",
								"type": "integer",
								"default": 10,
								"example": 10
							},
							"ttl": {
								"description": "TTL取值范围为[0,2147483647]，单位秒",
								"type": "integer",
								"default": 60,
								"example": 60
							}
						}
					}
				},
				"txt_records": {
					"type": "array",
					"description": "TXT记录，至少配置1条，最多配置7条",
					"items": {
						"type": "string",
						"description": "TXT记录值，校验格式为string, 最大长度4096"
					}
				},
				"aaaa_records": {
					"type": "array",
					"description": "AAAA记录，至少配置1条，最多配置10条",
					"items": {
						"type": "object",
						"required": [
							"address"
						],
						"properties": {
							"address": {
								"type": "string",
								"description": "单个IPv6地址（不能是IPv4地址）",
								"example": "2001:503:ba3e::2:30"
							},
							"ttl": {
								"type": "integer",
								"description": "TTL取值范围为[0,2147483647]，单位秒",
								"default": 60,
								"example": 60
							}
						}
					}
				},
				"ds_records": {
					"type": "array",
					"description": "DS记录，至少配置1条，最多配置7条",
					"items": {
						"type": "object",
						"required": [
							"key_tag",
							"algorithm",
							"digest_type"
						],
						"properties": {
							"key_tag": {
								"type": "integer",
								"description": "密钥标签，校验格式为16位无符号整数，输入范围[0,65535]"
							},
							"algorithm": {
								"type": "integer",
								"description": "算法，校验格式为int，输入范围[0,255]"
							},
							"digest_type": {
								"type": "integer",
								"description": "摘要类型，校验格式为int，输入范围[0,255]"
							},
							"digest": {
								"type": "string",
								"description": "摘要，校验格式为string，最大长度4096，可为空"
							}
						}
					}
				},
				"naptr_records": {
					"type": "array",
					"description": "NAPTR记录，至少配置1条，最多配置7条",
					"items": {
						"type": "object",
						"required": [
							"order",
							"priority",
							"replacement"
						],
						"properties": {
							"order": {
								"type": "integer",
								"description": "次序，校验格式为int，取值范围[0,65535]",
								"default": 1,
								"example": 1
							},
							"priority": {
								"type": "integer",
								"description": "优先级，校验格式为int，取值范围[0,65535]",
								"default": 1,
								"example": 1
							},
							"flags": {
								"type": "string",
								"description": "标志，可输入A-Z和0-9，校验格式为string，长度0-255，可为空"
							},
							"service": {
								"type": "string",
								"description": "服务参数，校验格式为string，长度0-255，可为空。"
							},
							"regular_expression": {
								"type": "string",
								"description": "替换表达式，校验格式为string，长度0-255，可为空"
							},
							"replacement": {
								"type": "string",
								"description": "下一个查询域名，校验格式为string"
							}
						}
					}
				},
				"caa_records": {
					"type": "array",
					"description": "CAA记录，至少配置1条，最多配置7条",
					"items": {
						"type": "object",
						"required": [
							"flags"
						],
						"properties": {
							"flags": {
								"type": "integer",
								"description": "标志，校验格式为8位无符号整数，输入范围为[0,255]"
							},
							"tag": {
								"type": "string",
								"description": "属性，校验格式为string",
								"enum": [
									"ISSUE",
									"ISSUEWILD",
									"IODEF"
								],
								"default": "ISSUE",
								"example": "ISSUE"
							},
							"value": {
								"type": "string",
								"description": "关联值，校验格式为string，最大长度4096，可为空"
							}
						}
					}
				},
				"hinfo_records": {
					"type": "array",
					"description": "HINFO记录，至少配置1条，最多配置7条",
					"items": {
						"type": "object",
						"properties": {
							"cpu": {
								"type": "string",
								"description": "cpu信息，校验格式为string，长度0-255，可为空"
							},
							"os": {
								"type": "string",
								"description": "操作系统信息，校验格式为string，长度0-255，可为空"
							}
						}
					}
				},
				"dname_records": {
					"type": "string",
					"description": "dname记录，校验格式为域名或IPv4。必须且只能配置1条"
				}
			}
		}
	}
}