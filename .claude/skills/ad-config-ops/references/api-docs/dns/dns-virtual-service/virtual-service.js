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
		"/api/ad/v4/dns/dns-virtual-service/virtual-service/": {
			"description": "DNS服务配置",
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
					"virtual service"
				],
				"summary": "get all virtual service",
				"description": "查看当前已有的DNS服务配置信息",
				"operationId": "get_virtual_service_list",
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
						"$ref": "#/responses/operation_config_virtual_service_list"
					}
				}
			},
			"post": {
				"tags": [
					"virtual-service"
				],
				"summary": "create new virtual service",
				"description": "新建一个DNS服务配置",
				"operationId": "add_virtual_service_list",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-SERVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns dns-virtual-service virtual-service",
					"description": "获取全部DNS服务配置"
				},
				{
					"command": "list dns dns-virtual-service virtual-service dns_8080",
					"description": "获取指定DNS服务dns_8080配置"
				},
				{
					"command": "create dns dns-virtual-service virtual-service dns_8080 service dns-tcp vips [ 10.12.1.1 ] vports [ 8080 ] pool sangfor.com",
					"description": "创建名称为dns_8080的DNS-TCP类型DNS服务 其对外发布VIP为10.12.1.1 对外端口为8080 默认节点池为sangfor.com"
				},
				{
					"command": "modify dns dns-virtual-service virtual-service dns_8080 vips [ 192.168.0.100 ]",
					"description": "修改DNS服务dns_8080的VIP为192.168.0.100"
				},
				{
					"command": "delete dns dns-virtual-service virtual-service dns_8080",
					"description": "删除DNS服务dns_8080"
				}
			]
		},
		"/api/ad/v4/dns/dns-virtual-service/virtual-service/{name}": {
			"description": "新建、查看、修改、删除指定的DNS服务配置",
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
					"virtual-service"
				],
				"summary": "get specific virtual service",
				"description": "查看指定的DNS服务配置",
				"operationId": "get_virtual_service",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"virtual-service"
				],
				"summary": "create new virtual service",
				"description": "新建指定的DNS服务配置",
				"operationId": "add_virtual_service",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-SERVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				}
			},
			"put": {
				"tags": [
					"virtual-service"
				],
				"summary": "replace specific virtual service",
				"description": "替换指定DNS服务配置",
				"operationId": "replace_virtual_service",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-SERVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				}
			},
			"patch": {
				"tags": [
					"virtual-service"
				],
				"summary": "modify specific virtual service",
				"description": "修改指定DNS服务配置",
				"operationId": "edit_virtual_service",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-SERVICE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				}
			},
			"delete": {
				"tags": [
					"virtual service"
				],
				"summary": "delete specific virtual service",
				"description": "删除指定DNS服务配置",
				"operationId": "delete_virtual_service",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				}
			}
		}
	},
	"parameters": {
		"VIRTUAL-SERVICE-CONFIG": {
			"name": "VIRTUAL-SERVICE-CONFIG",
			"in": "body",
			"required": true,
			"description": "DNS服务配置",
			"schema": {
				"$ref": "#/definitions/config.virtual_service"
			}
		},
		"VIRTUAL-SERVICE-PROPERTY": {
			"name": "VIRTUAL-SERVICE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "DNS服务属性",
			"schema": {
				"$ref": "#/definitions/config.virtual_service"
			}
		}
	},
	"responses": {
		"operation_config_virtual_service_list": {
			"description": "DNS服务配置列表",
			"schema": {
				"$ref": "#/definitions/config.virtual_service_list"
			}
		},
		"operation_config_virtual_service_object": {
			"description": "DNS服务配置对象",
			"schema": {
				"$ref": "#/definitions/config.virtual_service"
			}
		}
	},
	"definitions": {
		"config.virtual_service_list": {
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
						"$ref": "#/definitions/config.virtual_service"
					}
				}
			}
		},
		"config.virtual_service": {
			"type": "object",
			"required": [
				"name",
				"service",
				"vips",
				"vports",
				"pool"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "指定DNS服务的名称, 在DNS服务配置中必须唯一。",
					"example": "vs_dns_53"
				},
				"description": {
					"type": "string",
					"description": "可以对该DNS服务进行额外的信息补充。"
				},
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "DNS服务的配置状态,enable 表示启用;disable 表示禁用。",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"service": {
					"description": "DNS服务类型",
					"$ref": "#/definitions/config.service_type",
					"default": "DNS-UDP"
				},
				"vips": {
					"description": "DNS服务VIP地址",
					"type": "array",
					"items": {
						"type": "string",
						"description": "指定DNS服务对外发布的 ip 地址信息, 支持单个 ip 和网络子网格式。"
					},
					"maxItems": 32,
					"minItems": 1,
					"example": [
						"10.0.1.83",
						"200.200.145.96"
					]
				},
				"inbound_links": {
					"description": "指定入口链路,待选框内容还包括网络部署-网络接口-链路IP下的内容",
					"type": "array",
					"items": {
						"description": "入口链路",
						"type": "string",
						"default": "ALL",
						"optionalEnum": [
							"ALL",
							"WAN-KIND",
							"LAN-KIND"
						],
						"example": "WAN_1"
					}
				},
				"vports": {
					"description": "DNS服务端口",
					"type": "array",
					"maxItems": 16,
					"minItems": 1,
					"items": {
						"type": "string",
						"description": "指定DNS服务对外发布的端口信息, 支持单个端口 (如:80) 和端口范围 (如:90-91)。"
					},
					"example": [
						"80-88",
						8080
					]
				},
				"pool": {
					"type": "string",
					"description": "指定DNS服务调度的默认节点池。",
					"example": "pool_1"
				},
				"pre_rules": {
					"description": "指定DNS服务的前置调度策略规则。该参数为一个对象列表, 可以通过add或者delete指令添加前置策略规则。",
					"type": "array",
					"items": {
						"type": "string",
						"description": "DNS服务引用的前置调度策略"
					},
					"maxItems": 200,
					"example": [
						"sub10_server1",
						"sub200_server2"
					]
				},
				"http_sched_mode": {
					"description": "调度方式",
					"type": "string",
					"enum": [
						"CONNECTION",
						"REQUEST"
					],
					"default": "REQUEST",
					"example": "REQUEST"
				},
				"tcp_sched_stream_cache": {
					"description": "TCP缓冲流",
					"type": "object",
					"required": [],
					"properties": {
						"state": {
							"description": "用来表示是否启用流缓存,enable 表示启用;disable表示禁用,默认禁用。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE"
						},
						"cache": {
							"description": "TCP流匹配的缓冲区大小。",
							"type": "integer",
							"maximum": 4096,
							"minimum": 1,
							"example": 10000
						},
						"terminator": {
							"description": "结束缓冲的标识字符。",
							"type": "string",
							"maxLength": 8,
							"minLength": 0,
							"example": ""
						}
					}
				},
				"https_redirect": {
					"description": "用来对ssl-offload-https类型的虚拟服务是否开启http自动跳转https。",
					"type": "object",
					"required": [
						"state"
					],
					"properties": {
						"state": {
							"description": "用来表示是否启用http跳转,enable表示启用;disable表示禁用, 默认禁用。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"http_port": {
							"description": "指定http端口,取值范围为[1,65535],默认为80。",
							"type": "integer",
							"default": 80,
							"maximum": 65535,
							"minimum": 1,
							"example": 80
						}
					}
				},
				"snat": {
					"type": "string",
					"enum": [
						"AUTO-MAP",
						"SNAT-POOL",
						"DISABLE"
					],
					"description": "用来指定DNS服务是否做SNAT地址转换, 默认auto-map;disable表示禁用;auto-map表示使用自动SNAT,系统会自动选择源地址;snat-pool: 表示使用指定的地址作为转换后的源地址;snat-vip: 表示使用访问的虚拟服务ip作为转换后的源地址。",
					"default": "AUTO-MAP"
				},
				"snat_pool": {
					"type": "string",
					"description": "指定snat转后的地址集合,当参数snat指定为snat-pool时, 该参数必选。"
				},
				"source_port": {
					"type": "string",
					"enum": [
						"PRESERVE",
						"PRESERVE-STRICT",
						"CHANGE"
					],
					"description": "指定源端口转换策略;preserve表示尝试保持源端口,preserve-strict表示严格保持源端口,change表示改变源端口,默认为change",
					"default": "PRESERVE"
				},
				"session_sync": {
					"description": "连接镜像",
					"type": "string",
					"enum": [
						"GLOBAL",
						"ENABLE",
						"DISABLE"
					],
					"default": "GLOBAL"
				},
				"dnat": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"SPECIFY"
					],
					"description": "用来指定DNS服务是否做目的地址和端口转换, 默认启用;disable表示禁用;enable表示启用;specify表示指定IP端口。",
					"default": "ENABLE"
				},
				"dport_trans": {
					"description": "是否启用端口转换",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"dnat_translated_address": {
					"type": "string",
					"description": "指定的DNAT地址",
					"example": "23.3.3.3"
				},
				"dnat_translated_port": {
					"type": "integer",
					"description": "指定的DNAT端口",
					"maximum": 65535,
					"minimum": 0,
					"example": 25,
					"default": 0
				},
				"http_profile": {
					"description": "用来指定http和ssl-offload-https类型虚拟服务的优化策略,默认为none,表示不启用。",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{http_profile}"
				},
				"sip_profile": {
					"description": "SIP协议类型服务可选关联SIP策略",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{sip_profile}"
				},
				"http2_profile_client": {
					"description": "虚拟服务引用的前端连接http2策略",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{http2-profile}"
				},
				"http2_profile_server": {
					"description": null,
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{http2-profile}"
				},
				"dns_profile": {
					"type": "string",
					"description": "针对类型为DNS-UDP或DNS-TCP的DNS服务指定DNS策略，默认为 none,表示使用默认参数。",
					"optionalEnum": [
						"NONE"
					],
					"example": "Default_DNS"
				},
				"http_defence": {
					"description": "用来指定基于http和ssl-offload-https类型服务的七层防护策略,默认为none,表示不启用。",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{http-defence}"
				},
				"tcp_profile": {
					"type": "string",
					"description": "仅针对类型为DNS-TCP的DNS服务指定TCP策略,默认为 none,表示使用默认参数。",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "Default_TCP_L7"
				},
				"qos_profile": {
					"type": "string",
					"description": "用来指定DNS服务的流量控制策略,默认为none,表示不启用。",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{qos_profile}"
				},
				"connection_limits": {
					"type": "array",
					"description": "用来指定DNS服务的连接数控制策略;该参数为一个对象列表,可以通过add或者delete指令添加并发连接数控制策略。",
					"items": {
						"description": "连接数必填字段",
						"type": "object",
						"required": [
							"source_address",
							"connection_limit"
						],
						"properties": {
							"source_address": {
								"type": "object",
								"description": "指定源地址进行连接数限制,all表示所有源地址。",
								"required": [
									"type"
								],
								"properties": {
									"type": {
										"type": "string",
										"default": "ALL",
										"enum": [
											"ALL",
											"IP-ADDRESS",
											"CUSTOM-ADDRESS-GROUP"
										],
										"description": "ip-address表示指定源地址;custom-address-group表示用户地址集;all表示所有。",
										"example": "ALL"
									},
									"address": {
										"type": "string",
										"description": "指定IP地址支持单IP、地址范围及网络号。",
										"example": "192.168.1.1/24"
									},
									"ref_custom_address_group": {
										"type": "string",
										"description": "关联用于匹配此地址条件的用户地址集。",
										"example": "{custom_address_group}"
									}
								}
							},
							"connection_limit": {
								"type": "integer",
								"description": "指定限制连接数大小。",
								"default": 0,
								"maximum": 4294967295,
								"minimum": 0,
								"example": 2000000
							},
							"connection_rate_limit": {
								"description": "最大新建数",
								"type": "integer",
								"default": 0,
								"maximum": 4294967295,
								"minimum": 0
							}
						}
					},
					"maxItems": 100,
					"example": [
						{
							"source_address": "10.1.1.1/24",
							"connection_limit": 1000000
						},
						{
							"source_address": "internal_subnet_group",
							"connection_limit": 2000000
						}
					]
				},
				"connection_limits_type": {
					"description": "连接数限制类型",
					"type": "string",
					"enum": [
						"ALL-SOURCE-IP",
						"SINGLE-SOURCE-IP"
					],
					"default": "SINGLE-SOURCE-IP",
					"example": "SINGLE-SOURCE-IP"
				},
				"ipros": {
					"type": "array",
					"description": "DNS服务引用的ipro",
					"items": {
						"type": "string",
						"description": "用来指定DNS服务的脚本分发策略;该参数为一个对象列表,可以通过add或者delete指令添加iPro脚本。"
					},
					"maxItems": 5
				},
				"icon": {
					"description": "Web控制台图标定义",
					"type": "string",
					"enum": [
						"DEFAULT",
						"ICON1",
						"ICON2",
						"ICON3",
						"ICON4",
						"ICON5",
						"ICON6",
						"ICON7",
						"ICON8",
						"ICON9",
						"ICON10",
						"ICON11",
						"ICON12",
						"ICON13",
						"ICON14",
						"ICON15",
						"ICON16",
						"ICON17",
						"ICON18",
						"ICON19",
						"ICON20",
						"ICON21",
						"ICON22",
						"ICON23",
						"ICON24",
						"ICON25",
						"ICON26",
						"ICON27",
						"ICON28",
						"ICON29",
						"ICON30",
						"ICON31",
						"ICON32",
						"ICON33",
						"ICON34",
						"ICON35"
					],
					"example": "DEFAULT"
				},
				"autolasthop": {
					"description": "对称路由",
					"type": "string",
					"enum": [
						"GLOBAL",
						"ENABLE",
						"DISABLE"
					],
					"default": "GLOBAL"
				},
				"notify_status_to_vip": {
					"type": "string",
					"description": "DNS服务状态是否通知虚拟IP",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"force_keep_alive": {
					"description": "强制客户端保持长连接,默认为enable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"location_rewrite": {
					"description": "Location重写",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				}
			}
		},
		"config.service_type": {
			"type": "string",
			"enum": [
				"DNS-TCP",
				"DNS-UDP"
			],
			"description": "指定DNS服务的类型。",
			"example": "DNS-TCP",
			"default": "DNS-UDP"
		}
	}
}