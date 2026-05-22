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
		"/api/ad/v4/dns/zone/{dns_config_area}/zone/": {
			"description": "权威域配置管理操作",
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
					"$ref": "#/parameters/dns_zone_operation"
				}
			],
			"get": {
				"tags": [
					"zone"
				],
				"summary": "get all zone",
				"description": "查看域",
				"operationId": "get_zone_list",
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
						"$ref": "#/responses/operation_config_zone_list"
					}
				}
			},
			"post": {
				"tags": [
					"zone"
				],
				"summary": "create new zone",
				"description": "创建一个权威域配置",
				"operationId": "add_zone_list",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local zone",
					"description": "获取本地全部权威域配置"
				},
				{
					"command": "list list dns zone local ssss",
					"description": "获取本地指定权威域ssss配置"
				},
				{
					"command": "create  dns zone local zone  \"ssss\" state \"enable\" role \"master\" peer_address [ { address \"6.8.6.181\" port 53 tsig_key \"fwe\" policy \"notify\" }  { address \"6.8.6.180\" port 53 tsig_key \"NONE\" policy \"notify\" }  ]  dnssec { }  soa_record { master_server \"fsaf\" email \"fds\" serial_number 5 refresh_interval 10800 retry_interval 3600 expire_time 604800 ttl 60 negative_ttl 86400 }",
					"description": "创建名称为ssss的权威域，其角色为主服务器"
				},
				{
					"command": "modify dns zone local zone ssss state disable",
					"description": "修改本地权威域ssss的启禁用状态为禁用"
				},
				{
					"command": "delete dns zone local zone ssss",
					"description": "删除本地权威域ssss"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/zone/{name}": {
			"description": "权威域配置管理操作",
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
				},
				{
					"$ref": "#/parameters/dns_zone_operation"
				}
			],
			"get": {
				"tags": [
					"zone"
				],
				"summary": "get specific zone",
				"description": "查看指定的权威域配置",
				"operationId": "get_zone",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"zone"
				],
				"summary": "create new zone",
				"description": "创建一个权威域",
				"operationId": "create_zone",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_object"
					}
				}
			},
			"put": {
				"tags": [
					"zone"
				],
				"summary": "replace specific zone",
				"description": "修改指定的权威域",
				"operationId": "replace_zone",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_object"
					}
				}
			},
			"patch": {
				"tags": [
					"zone"
				],
				"summary": "modify specific zone",
				"description": "增量修改指定的权威域配置",
				"operationId": "edit_zone",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_object"
					}
				}
			},
			"delete": {
				"tags": [
					"zone"
				],
				"summary": "delete specific zone",
				"description": "删除指定的权威域",
				"operationId": "delete_zone",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_object"
					}
				}
			}
		},
		"/api/ad/v4/debug/dns/zone/{dns_config_area}/synchronize": {
			"description": "同步权威域",
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
			"post": {
				"tags": [
					"zone"
				],
				"summary": "synchronize records from master server to slave servers",
				"description": "同步主服务器的记录到辅服务器",
				"operationId": "synchronize_records",
				"parameters": [
					{
						"$ref": "#/parameters/ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_zone_object"
					}
				}
			}
		}
	},
	"parameters": {
		"ZONE-CONFIG": {
			"name": "ZONE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.zone"
			}
		},
		"ZONE-PROPERTY": {
			"name": "ZONE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.zone"
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
		"dns_zone_operation": {
			"name": "dns_zone_operation",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "域导入/导出标识",
			"enum": [
				"import",
				"export"
			]
		}
	},
	"responses": {
		"operation_config_zone_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.zone_list"
			}
		},
		"operation_config_zone_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.zone"
			}
		}
	},
	"definitions": {
		"config.zone_list": {
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
						"$ref": "#/definitions/config.zone"
					}
				}
			}
		},
		"config.zone": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "域。校验为域名格式,最大长度200。可以输入形如www.jd.com或com或a.com等",
					"example": "www.jd.com"
				},
				"state": {
					"description": "域整体启/禁用，默认启用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"role": {
					"type": "string",
					"description": "角色。包括主服务器MASTER和辅服务器SLAVE",
					"enum": [
						"MASTER",
						"SLAVE"
					],
					"default": "MASTER",
					"example": "MASTER"
				},
				"peer_address": {
					"type": "array",
					"description": "通知/接收。可以不定义，最多定义5条。",
					"items": {
						"type": "object",
						"description": "通知/接收列表",
						"required": [
							"address"
						],
						"properties": {
							"address": {
								"type": "string",
								"description": "主（辅）服务器地址。其校验格式为单个IPv4/IPv6地址",
								"example": "192.168.1.17"
							},
							"port": {
								"type": "integer",
								"description": "必须为1~65535之间的整数",
								"default": 53,
								"example": 53,
								"minimum": 1,
								"maximum": 65535
							},
							"tsig_key": {
								"type": "string",
								"description": "TSIG密钥。下拉单选，选项内容为用户已创建的tsig密钥名称，默认为NONE",
								"example": "tsig_key_1"
							},
							"policy": {
								"type": "string",
								"description": "动作。SLAVE服务器可选择NOTIFY和RECEIVE动作；而MASTER服务器默认仅支持NOTIFY，无policy配置项",
								"enum": [
									"NOTIFY",
									"RECEIVE"
								],
								"default": "RECEIVE",
								"example": "NOTIFY"
							}
						}
					},
					"minItems": 0,
					"maxItems": 5
				},
				"dnssec": {
					"type": "object",
					"description": "DNSSEC。只有主服务器有该部分配置项。",
					"properties": {
						"state": {
							"type": "string",
							"description": "启/禁用状态。默认禁用，对应DNSSEC配置项都不显示。当启用时显示",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"ds_record_hash_algorithm": {
							"type": "string",
							"description": "DS记录哈希算法",
							"enum": [
								"SHA1",
								"SHA256"
							],
							"default": "SHA1",
							"example": "SHA1"
						},
						"nsec3_lterations": {
							"type": "integer",
							"default": 1,
							"example": 1,
							"description": "NSEC3迭代，取值范围为[1,65535]",
							"minimum": 1,
							"maximum": 65535
						},
						"zone_signing_key": {
							"type": "array",
							"description": "ZSK密钥。下拉多选（至少选1个，最多选3个），选项内容为用户所创建的ZSK类型的DNSSEC密钥名称，默认为NONE",
							"items": {
								"type": "string",
								"description": "ZSK密钥"
							},
							"example": "zsk密钥_1，zsk密钥_2，zsk密钥_3",
							"default": [],
							"maxItems": 3
						},
						"key_signing_key": {
							"type": "array",
							"description": "KSK密钥。下拉多选（至少选1个，最多选3个），选项内容为用户所创建的KSK类型的DNSSEC密钥名称，默认为NONE",
							"items": {
								"type": "string",
								"description": "KSK密钥"
							},
							"example": "ksk密钥_1，ksk密钥_2",
							"default": [],
							"maxItems": 3
						},
						"signature_refresh_perios_day": {
							"type": "integer",
							"description": "签名更新间隔，取值范围为[7,1000]，单位天",
							"default": 14,
							"example": 14,
							"minimum": 7,
							"maximum": 1000
						},
						"signature_valid_period_day": {
							"type": "integer",
							"description": "签名有效时间，取值范围为[10,1000]，单位天，并且数值必须大于签名更新间隔",
							"default": 21,
							"example": 21,
							"minimum": 10,
							"maximum": 1000
						}
					}
				},
				"soa_record": {
					"type": "object",
					"description": "只有主服务器有该部分配置项。",
					"required": [
						"master_server",
						"email",
						"serial_number"
					],
					"properties": {
						"master_server": {
							"type": "string",
							"description": "源主机，格式校验时为域名（最大长度250）或IPv4地址",
							"example": "ns1.domain.com"
						},
						"email": {
							"type": "string",
							"description": "电子邮件,为电子邮件标准格式,并且将邮件中的“@”替换为“.”"
						},
						"serial_number": {
							"type": "integer",
							"description": "序列号，取值范围为[0,4294967295]",
							"minimum": 0,
							"maximum": 4294967295
						},
						"refresh_interval": {
							"type": "integer",
							"description": "刷新时间，取值范围为[0,2147483647]，单位秒",
							"default": 10800,
							"example": 10800,
							"minimum": 0,
							"maximum": 2147483647
						},
						"retry_interval": {
							"type": "integer",
							"description": "重试时间，取值范围为[0,2147483647]，单位秒",
							"default": 3600,
							"example": 3600,
							"minimum": 0,
							"maximum": 2147483647
						},
						"expire_time": {
							"type": "integer",
							"description": "到期时间，取值范围为[0,2147483647]，单位秒",
							"default": 604800,
							"example": 604800,
							"minimum": 0,
							"maximum": 2147483647
						},
						"ttl": {
							"type": "integer",
							"description": "TTL值，取值范围为[0, 2147483647]，单位秒",
							"default": 60,
							"example": 60,
							"minimum": 0,
							"maximum": 2147483647
						},
						"negative_ttl": {
							"type": "integer",
							"description": "否定记录缓存时间，取值范围为[0, 2147483647]，单位秒",
							"default": 86400,
							"example": 86400,
							"minimum": 0,
							"maximum": 2147483647
						}
					}
				}
			}
		}
	}
}