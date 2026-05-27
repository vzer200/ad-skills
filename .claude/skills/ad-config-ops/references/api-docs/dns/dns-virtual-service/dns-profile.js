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
		"/api/ad/v4/dns/dns-virtual-service/dns-profile/": {
			"description": "DNS策略配置管理操作",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"dns-profile"
				],
				"summary": "get all dns-profile",
				"description": "查看当前已有的DNS策略配置信息",
				"operationId": "get_dns_profile_list",
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
						"$ref": "#/responses/operation_config_dns_profile_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all dns-profile",
						"description": "查看当前已有的DNS策略配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v4/dns/dns-virtual-service/dns-profile/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v4/dns/dns-virtual-service/dns-profile/ 响应",
						"description": "返回GET /api/ad/v4/dns/dns-virtual-service/dns-profile/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "dns_profile_1",
									"description": "这是一个DNS策略",
									"module_gslb": "ENABLE",
									"module_zone": "ENABLE",
									"module_ldns": "DISABLE",
									"module_proxy": "DISABLE",
									"policy": "REFUSE",
									"return_ip": "example_string",
									"record_rotate": "ENABLE",
									"edns_cache_capacity_byte": 1232,
									"edns_client_subnet_insert": "DISABLE",
									"access_control": [
										{
											"source_address": {
												"type": "ALL",
												"address": "192.168.1.1/24",
												"ref_custom_address_group": "{custom_address_group}"
											},
											"domain": "www.jd.com",
											"record_type": "ALL",
											"query_limit": 17770
										}
									],
									"alert": "ENABLE"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"dns-profile"
				],
				"summary": "create new dns-profile",
				"description": "新建一个DNS策略配置",
				"operationId": "add_virtual_dns_profile_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new dns-profile",
						"description": "新建一个DNS策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v4/dns/dns-virtual-service/dns-profile/",
							"body": {
								"name": "AI_dns_profile_1_A",
								"module_gslb": "ENABLE",
								"module_zone": "ENABLE",
								"module_ldns": "DISABLE",
								"module_proxy": "DISABLE",
								"policy": "REFUSE",
								"edns_cache_capacity_byte": 1232,
								"edns_client_subnet_insert": "DISABLE",
								"alert": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v4/dns/dns-virtual-service/dns-profile/ 响应",
						"description": "返回POST /api/ad/v4/dns/dns-virtual-service/dns-profile/的响应数据",
						"value": {
							"name": "AI_dns_profile_1_A",
							"description": "这是一个DNS策略",
							"module_gslb": "ENABLE",
							"module_zone": "ENABLE",
							"module_ldns": "DISABLE",
							"module_proxy": "DISABLE",
							"policy": "REFUSE",
							"return_ip": "example_string",
							"record_rotate": "ENABLE",
							"edns_cache_capacity_byte": 1232,
							"edns_client_subnet_insert": "DISABLE",
							"access_control": [
								{
									"source_address": {
										"type": "ALL",
										"address": "192.168.1.1/24",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"domain": "www.jd.com",
									"record_type": "ALL",
									"query_limit": 17770
								}
							],
							"alert": "ENABLE"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns dns-virtual-service dns-profile",
					"description": "获取全部DNS策略配置"
				},
				{
					"command": "list dns dns-virtual-service dns-profile dnsprofile1",
					"description": "获取指定DNS策略dnsprofile1配置"
				},
				{
					"command": "create dns dns-virtual-service dns-profile dnsprofile1",
					"description": "创建名称为dnsprofile1的DNS策略"
				},
				{
					"command": "modify dns dns-virtual-service dns-profile dnsprofile1 policy refuse",
					"description": "修改DNS策略dnsprofile1的policy为refuse"
				},
				{
					"command": "delete dns dns-virtual-service dns-profile dnsprofile1",
					"description": "删除DNS策略dnsprofile1"
				}
			]
		},
		"/api/ad/v4/dns/dns-virtual-service/dns-profile/{name}": {
			"description": "新建、查看、修改、删除指定的DNS策略配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"dns-profile"
				],
				"summary": "get specific dns-profile",
				"description": "查看指定DNS策略配置",
				"operationId": "get_dns_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific dns-profile",
						"description": "查看指定DNS策略配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v4/dns/dns-virtual-service/dns-profile/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v4/dns/dns-virtual-service/dns-profile/{name} 响应",
						"description": "返回GET /api/ad/v4/dns/dns-virtual-service/dns-profile/{name}的响应数据",
						"value": {
							"name": "dns_profile_1",
							"description": "这是一个DNS策略",
							"module_gslb": "ENABLE",
							"module_zone": "ENABLE",
							"module_ldns": "DISABLE",
							"module_proxy": "DISABLE",
							"policy": "REFUSE",
							"return_ip": "example_string",
							"record_rotate": "ENABLE",
							"edns_cache_capacity_byte": 1232,
							"edns_client_subnet_insert": "DISABLE",
							"access_control": [
								{
									"source_address": {
										"type": "ALL",
										"address": "192.168.1.1/24",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"domain": "www.jd.com",
									"record_type": "ALL",
									"query_limit": 17770
								}
							],
							"alert": "ENABLE"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-profile"
				],
				"summary": "create new dns-profile",
				"description": "新建指定的DNS策略配置",
				"operationId": "add_dns_profile",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new dns-profile",
						"description": "新建指定的DNS策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v4/dns/dns-virtual-service/dns-profile/{name}",
							"body": {
								"name": "AI_dns_profile_1_B",
								"module_gslb": "ENABLE",
								"module_zone": "ENABLE",
								"module_ldns": "DISABLE",
								"module_proxy": "DISABLE",
								"policy": "REFUSE",
								"edns_cache_capacity_byte": 1232,
								"edns_client_subnet_insert": "DISABLE",
								"alert": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v4/dns/dns-virtual-service/dns-profile/{name} 响应",
						"description": "返回POST /api/ad/v4/dns/dns-virtual-service/dns-profile/{name}的响应数据",
						"value": {
							"name": "AI_dns_profile_1_B",
							"description": "这是一个DNS策略",
							"module_gslb": "ENABLE",
							"module_zone": "ENABLE",
							"module_ldns": "DISABLE",
							"module_proxy": "DISABLE",
							"policy": "REFUSE",
							"return_ip": "example_string",
							"record_rotate": "ENABLE",
							"edns_cache_capacity_byte": 1232,
							"edns_client_subnet_insert": "DISABLE",
							"access_control": [
								{
									"source_address": {
										"type": "ALL",
										"address": "192.168.1.1/24",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"domain": "www.jd.com",
									"record_type": "ALL",
									"query_limit": 17770
								}
							],
							"alert": "ENABLE"
						}
					}
				}
			},
			"put": {
				"tags": [
					"dns-profile"
				],
				"summary": "replace specific dns-profile",
				"description": "修改指定的DNS策略配置",
				"operationId": "replace_dns_profile",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific dns-profile",
						"description": "修改指定的DNS策略配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v4/dns/dns-virtual-service/dns-profile/{name}",
							"body": {
								"name": "dns_profile_1",
								"module_gslb": "ENABLE",
								"module_zone": "ENABLE",
								"module_ldns": "DISABLE",
								"module_proxy": "DISABLE",
								"policy": "REFUSE",
								"edns_cache_capacity_byte": 1232,
								"edns_client_subnet_insert": "DISABLE",
								"alert": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v4/dns/dns-virtual-service/dns-profile/{name} 响应",
						"description": "返回PUT /api/ad/v4/dns/dns-virtual-service/dns-profile/{name}的响应数据",
						"value": {
							"name": "dns_profile_1",
							"description": "这是一个DNS策略",
							"module_gslb": "ENABLE",
							"module_zone": "ENABLE",
							"module_ldns": "DISABLE",
							"module_proxy": "DISABLE",
							"policy": "REFUSE",
							"return_ip": "example_string",
							"record_rotate": "ENABLE",
							"edns_cache_capacity_byte": 1232,
							"edns_client_subnet_insert": "DISABLE",
							"access_control": [
								{
									"source_address": {
										"type": "ALL",
										"address": "192.168.1.1/24",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"domain": "www.jd.com",
									"record_type": "ALL",
									"query_limit": 17770
								}
							],
							"alert": "ENABLE"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"dns-profile"
				],
				"summary": "modify specific dns-profile",
				"description": "修改指定的DNS策略配置",
				"operationId": "edit_dns_profile",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-PROFILE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific dns-profile",
						"description": "修改指定的DNS策略配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v4/dns/dns-virtual-service/dns-profile/{name}",
							"body": {
								"name": "dns_profile_1",
								"module_gslb": "ENABLE",
								"module_zone": "ENABLE",
								"module_ldns": "DISABLE",
								"module_proxy": "DISABLE",
								"policy": "REFUSE",
								"edns_cache_capacity_byte": 1232,
								"edns_client_subnet_insert": "DISABLE",
								"alert": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v4/dns/dns-virtual-service/dns-profile/{name} 响应",
						"description": "返回PATCH /api/ad/v4/dns/dns-virtual-service/dns-profile/{name}的响应数据",
						"value": {
							"name": "dns_profile_1",
							"description": "这是一个DNS策略",
							"module_gslb": "ENABLE",
							"module_zone": "ENABLE",
							"module_ldns": "DISABLE",
							"module_proxy": "DISABLE",
							"policy": "REFUSE",
							"return_ip": "example_string",
							"record_rotate": "ENABLE",
							"edns_cache_capacity_byte": 1232,
							"edns_client_subnet_insert": "DISABLE",
							"access_control": [
								{
									"source_address": {
										"type": "ALL",
										"address": "192.168.1.1/24",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"domain": "www.jd.com",
									"record_type": "ALL",
									"query_limit": 17770
								}
							],
							"alert": "ENABLE"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"dns-profile"
				],
				"summary": "delete specific dns-profile",
				"description": "删除指定的DNS策略配置",
				"operationId": "delete_dns_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific dns-profile",
						"description": "删除指定的DNS策略配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v4/dns/dns-virtual-service/dns-profile/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v4/dns/dns-virtual-service/dns-profile/{name} 响应",
						"description": "返回DELETE /api/ad/v4/dns/dns-virtual-service/dns-profile/{name}的响应数据",
						"value": {
							"name": "dns_profile_1",
							"description": "这是一个DNS策略",
							"module_gslb": "ENABLE",
							"module_zone": "ENABLE",
							"module_ldns": "DISABLE",
							"module_proxy": "DISABLE",
							"policy": "REFUSE",
							"return_ip": "example_string",
							"record_rotate": "ENABLE",
							"edns_cache_capacity_byte": 1232,
							"edns_client_subnet_insert": "DISABLE",
							"access_control": [
								{
									"source_address": {
										"type": "ALL",
										"address": "192.168.1.1/24",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"domain": "www.jd.com",
									"record_type": "ALL",
									"query_limit": 17770
								}
							],
							"alert": "ENABLE"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-PROFILE-CONFIG": {
			"name": "DNS-PROFILE-CONFIG",
			"in": "body",
			"required": true,
			"description": "DNS策略配置",
			"schema": {
				"$ref": "#/definitions/config.dns_profile"
			}
		},
		"DNS-PROFILE-PROPERTY": {
			"name": "DNS-PROFILE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "DNS策略属性",
			"schema": {
				"$ref": "#/definitions/config.dns_profile"
			}
		}
	},
	"responses": {
		"operation_config_dns_profile_list": {
			"description": "DNS策略配置列表",
			"schema": {
				"$ref": "#/definitions/config.dns_profile_list"
			}
		},
		"operation_config_dns_profile_object": {
			"description": "DNS策略配置对象",
			"schema": {
				"$ref": "#/definitions/config.dns_profile"
			}
		}
	},
	"definitions": {
		"config.dns_profile_list": {
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
					"items": {
						"$ref": "#/definitions/config.dns_profile"
					}
				}
			}
		},
		"config.dns_profile": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "指定DNS策略的名称, 在DNS策略配置中必须唯一。",
					"example": "dns_profile_1"
				},
				"description": {
					"type": "string",
					"description": "对该DNS策略进行额外的信息补充。",
					"example": "这是一个DNS策略"
				},
				"module_gslb": {
					"description": "GSLB功能模块",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"module_zone": {
					"description": "权威域功能模块",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"module_ldns": {
					"description": "LDNS功能模块",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"module_proxy": {
					"description": "DNS代理功能模块",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"policy": {
					"description": "失败动作，默认为拒绝。",
					"type": "string",
					"enum": [
						"DROP",
						"REFUSE",
						"NXDOMAIN",
						"RETURN-IP"
					],
					"default": "REFUSE",
					"example": "REFUSE"
				},
				"return_ip": {
					"type": "string",
					"description": "对应失败动作中的RETURN-IP，校验格式为单个IPv4/IPv6地址"
				},
				"record_rotate": {
					"type": "string",
					"description": "应答记录轮转",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE"
				},
				"edns_cache_capacity_byte": {
					"type": "integer",
					"description": "EDNS缓冲区大小（单位：字节），取值范围[512,65535]",
					"maximum": 65535,
					"minimum": 512,
					"default": 1232,
					"example": 1232
				},
				"edns_client_subnet_insert": {
					"type": "string",
					"description": "ECS插入，默认禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"access_control": {
					"type": "array",
					"maxItems": 100,
					"description": "用来指定DNS策略的ACL策略，最多配置100条; 该参数为一个对象列表,可以通过add或者delete指令添加并发连接数控制策略。",
					"items": {
						"type": "object",
						"description": "连接数必填字段",
						"required": [
							"source_address",
							"domain",
							"query_limit"
						],
						"properties": {
							"source_address": {
								"type": "object",
								"description": "指定源地址进行连接数限制",
								"required": [
									"type"
								],
								"properties": {
									"type": {
										"type": "string",
										"enum": [
											"ALL",
											"IP-ADDRESS",
											"CUSTOM-ADDRESS-GROUP"
										],
										"description": "ip-address表示指定源地址，为IPv4/IPv6格式; custom-address-group表示选择用户地址集; all表示所有。",
										"example": "ALL",
										"default": "ALL"
									},
									"address": {
										"type": "string",
										"description": "指定IP地址支持单IP、地址范围及网络号。",
										"example": "192.168.1.1/24"
									},
									"ref_custom_address_group": {
										"type": "string",
										"description": "关联用于匹配此地址条件的用户地址集,下拉框选项为用户已配置的用户地址集。",
										"example": "{custom_address_group}"
									}
								}
							},
							"domain": {
								"type": "string",
								"description": "指定所要限制的域名，按域名格式",
								"example": "www.jd.com"
							},
							"record_type": {
								"type": "string",
								"description": "指定所要限制的DNS记录类型。注意此处有一个类型为ANY代表返回若干记录; ALL代表所有类型",
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
									"ANY",
									"ALL"
								],
								"default": "ALL",
								"example": "ALL"
							},
							"query_limit": {
								"type": "integer",
								"description": "指定DNS请求限制速率（单位：次/秒）。取值范围为[0,1000000]",
								"maximum": 1000000,
								"minimum": 0,
								"example": 17770
							}
						}
					}
				},
				"alert": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "ACL/DDOS告警,ENABLE 表示启用;DISABLE 表示禁用。",
					"default": "ENABLE",
					"example": "ENABLE"
				}
			}
		}
	}
}