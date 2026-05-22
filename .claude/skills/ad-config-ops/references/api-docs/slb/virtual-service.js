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
		"/api/ad/v3/slb/virtual-service/": {
			"description": "新建、查看虚拟服务配置",
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
				"description": "查看当前已有的虚拟服务配置信息",
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
					"virtual service"
				],
				"summary": "create new virtual service",
				"description": "新建一个虚拟服务配置",
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
					"command": "list slb virtual-service",
					"description": "获取全部虚拟服务配置"
				},
				{
					"command": "list slb virtual-service http_8080",
					"description": "获取指定虚拟服务http_8080配置"
				},
				{
					"command": "create slb virtual-service http_8080 service http vips [ 10.4.32.56 ] vports [ 8080 ] pool sangfor.com",
					"description": "创建名称为http_8080的HTTP类型虚拟服务 其对外发布VIP为10.4.32.56 对外端口为8080 默认节点池为sangfor.com"
				},
				{
					"command": "modify slb virtual-service http_8080 vips [ 192.168.0.100 ]",
					"description": "修改虚拟服务http_8080的VIP为192.168.0.100"
				},
				{
					"command": "delete slb virtual-service http_8080",
					"description": "删除虚拟服务http_8080"
				}
			]
		},
		"/api/ad/v3/slb/virtual-service/{name}": {
			"description": "新建、查看、修改、删除指定的虚拟服务配置",
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
					"virtual service"
				],
				"summary": "get specific virtual service",
				"description": "查看指定的虚拟服务配置",
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
					"virtual service"
				],
				"summary": "create new virtual service",
				"description": "新建指定的虚拟服务配置",
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
					"virtual service"
				],
				"summary": "replace specific virtual service",
				"description": "修改指定的虚拟服务配置",
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
					"virtual service"
				],
				"summary": "modify specific virtual service",
				"description": "修改指定的虚拟服务配置",
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
				"description": "删除指定的虚拟服务配置",
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
			"description": "虚拟服务配置",
			"schema": {
				"$ref": "#/definitions/config.virtual_service"
			}
		},
		"VIRTUAL-SERVICE-PROPERTY": {
			"name": "VIRTUAL-SERVICE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "虚拟服务属性",
			"schema": {
				"$ref": "#/definitions/config.virtual_service"
			}
		}
	},
	"responses": {
		"operation_config_virtual_service_list": {
			"description": "虚拟服务配置列表",
			"schema": {
				"$ref": "#/definitions/config.virtual_service_list"
			}
		},
		"operation_config_virtual_service_object": {
			"description": "虚拟服务配置对象",
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
				"pool"
			],
			"properties": {
				"name": {
					"description": "指定虚拟服务的名称, 在虚拟服务配置中必须唯一。",
					"type": "string",
					"example": "vs_http_80"
				},
				"description": {
					"type": "string",
					"description": "可以对该虚拟服务进行额外的信息补充。"
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
				"state": {
					"description": "虚拟服务的配置状态,enable 表示启用;disable 表示禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"service": {
					"description": "虚拟服务类型",
					"$ref": "#/definitions/config.service_type",
					"default": "HTTP"
				},
				"vips": {
					"description": "虚拟服务VIP地址",
					"type": "array",
					"items": {
						"description": "指定虚拟服务对外发布的 ip 地址信息, 支持单个 ip 和网络子网格式。",
						"type": "string"
					},
					"maxItems": 32,
					"minItems": 1,
					"example": [
						"10.0.1.83",
						"200.200.145.96"
					]
				},
				"vports": {
					"description": "虚拟服务端口",
					"type": "array",
					"items": {
						"description": "指定虚拟服务对外发布的端口信息, 支持单个端口 (如:80) 和端口范围 (如:90-91)。",
						"type": "string"
					},
					"maxItems": 16,
					"minItems": 1,
					"example": [
						"80-88",
						"8080"
					]
				},
				"ftp_data_port": {
					"description": "ftp数据端口",
					"type": "integer",
					"maximum": 65535,
					"minimum": 0,
					"example": 20
				},
				"service_chain": {
					"description": "指定虚拟服务关联的安全服务链。",
					"type": "string",
					"example": "service_chain1"
				},
				"pool": {
					"description": "指定虚拟服务调度的默认节点池。",
					"type": "string",
					"example": "web_oa_pool"
				},
				"pre_rules": {
					"description": "指定虚拟服务的前置调度策略规则。该参数为一个对象列表, 可以通过add或者delete指令添加前置策略规则。",
					"type": "array",
					"items": {
						"description": "虚拟服务引用的前置调度策略",
						"type": "string"
					},
					"maxItems": 200,
					"example": [
						"sub10_server1",
						"sub200_server2"
					]
				},
				"http_sched_mode": {
					"description": "指定http和ssl-offload-https类型的虚拟服务调度方式。connection: 按连接调度;request: 按每个请求进行调度。",
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
					"description": "用来指定虚拟服务是否做SNAT地址转换, 默认auto-map;disable表示禁用;auto-map表示使用自动SNAT,系统会自动选择源地址;snat-pool: 表示使用指定的地址作为转换后的源地址;snat-vip: 表示使用访问的虚拟服务ip作为转换后的源地址。",
					"type": "string",
					"enum": [
						"AUTO-MAP",
						"SNAT-POOL",
						"SNAT-VIP",
						"DISABLE"
					],
					"default": "AUTO-MAP"
				},
				"snat_pool": {
					"description": "指定snat转后的地址集合,当参数snat指定为snat-pool时, 该参数必选。",
					"type": "string"
				},
				"source_port": {
					"description": "指定源端口转换策略;preserve表示尝试保持源端口,preserve-strict表示严格保持源端口,change表示改变源端口,默认为change",
					"type": "string",
					"enum": [
						"PRESERVE",
						"PRESERVE-STRICT",
						"CHANGE"
					],
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
					"description": "vs状态是否通知vip",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"inbound_links": {
					"description": "入口链路集合",
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
				"ssl_client_profiles": {
					"description": "SSL卸载策略",
					"type": "array",
					"items": {
						"description": "用来指定基于ssl-offload-https和ssl-offload服务的SSL相关参数;当服务类型为上述两种类型时为必选参数。",
						"type": "string"
					},
					"maxItems": 50
				},
				"sni_bypass": {
					"description": "SNI BYPASS服务开关，启用后客户端ClientHello SNI不匹配卸载策略时，将BYPASS客户端流量",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"sni_bypass_log": {
					"description": "SNI BYPASS日志开关，启用后打印BYPASS日志到SYSLOG服务器，需提前配置日志服务器并启用SSL日志设备",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"sni_expire": {
					"description": "等待客户端ClientHello SNI的超时时间，单位毫秒",
					"type": "integer",
					"maximum": 604800000,
					"minimum": 1,
					"default": 10000,
					"example": 10000
				},
				"sni_expire_action": {
					"description": "等待客户端ClientHello SNI超时后执行的动作",
					"type": "string",
					"enum": [
						"BYPASS",
						"REJECT"
					],
					"default": "BYPASS"
				},
				"dnat": {
					"description": "用来指定虚拟服务是否做目的IP转换, 默认启用;disable表示禁用;enable表示启用;specify表示指定IP端口。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"SPECIFY"
					],
					"default": "ENABLE"
				},
				"dnat_translated_address": {
					"description": "指定的DNAT地址",
					"type": "string"
				},
				"dnat_translated_port": {
					"description": "指定的DNAT端口",
					"type": "integer",
					"maximum": 65535,
					"minimum": 0,
					"default": 0,
					"example": 25
				},
				"dport_trans": {
					"description": "用来指定虚拟服务是否做目的端口转换, 默认启用;disable表示禁用;enable表示启用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
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
				"http2_profile_server": {
					"description": null,
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{http2-profile}"
				},
				"tcp_profile": {
					"description": "用来指定基于TCP协议的服务的TCP相关参数,默认为 none,表示使用默认参数。",
					"optionalEnum": [
						"NONE"
					],
					"type": "string",
					"default": "NONE",
					"example": "Default_TCP_L7"
				},
				"ssl_server_profiles": {
					"description": "SSL加密策略",
					"type": "array",
					"items": {
						"description": "用来指定基于TCP协议的七层服务后端SSL加密相关参数;参数为一个对象列表,可以通过add或者delete指令添加SSL加密策略。",
						"type": "string"
					},
					"maxItems": 50
				},
				"sni_forward": {
					"description": "SNI透传开关，启用后透传客户端ClientHello SNI或者HTTP Host到后端SSL服务器",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
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
				"qos_profile": {
					"description": "用来指定虚拟服务的流量控制策略,默认为none,表示不启用。",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "{qos_profile}"
				},
				"connection_limits": {
					"description": "用来指定虚拟服务的连接数控制策略;该参数为一个对象列表,可以通过add或者delete指令添加并发连接数控制策略。",
					"type": "array",
					"items": {
						"description": "连接数必填字段",
						"type": "object",
						"required": [
							"source_address",
							"connection_limit"
						],
						"properties": {
							"source_address": {
								"description": "指定源地址进行连接数限制,all表示所有源地址。",
								"type": "object",
								"required": [
									"type"
								],
								"properties": {
									"type": {
										"description": "ip-address表示指定源地址;custom-address-group表示用户地址集;all表示所有。",
										"type": "string",
										"enum": [
											"ALL",
											"IP-ADDRESS",
											"CUSTOM-ADDRESS-GROUP"
										],
										"default": "ALL",
										"example": "ALL"
									},
									"address": {
										"description": "指定IP地址支持单IP、地址范围及网络号。",
										"type": "string",
										"example": "192.168.1.1/24"
									},
									"ref_custom_address_group": {
										"description": "关联用于匹配此地址条件的用户地址集。",
										"type": "string",
										"example": "{custom_address_group}"
									}
								}
							},
							"connection_limit": {
								"description": "指定限制连接数大小。",
								"type": "integer",
								"default": 0,
								"maximum": 4294967295,
								"minimum": 0
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
					"description": "虚拟服务引用的ipro",
					"type": "array",
					"items": {
						"description": "用来指定虚拟服务的脚本分发策略;该参数为一个对象列表,可以通过add或者delete指令添加iPro脚本。",
						"type": "string"
					},
					"maxItems": 5
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
				"ftp_profile": {
					"description": "FTP策略",
					"type": "string",
					"default": "NONE",
					"example": "Default_FTP"
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
				},
				"up_throughput_limit": {
					"description": "虚拟服务上行流量吞吐限制(单位Mbps)",
					"type": "integer",
					"maximum": 4294967295,
					"minimum": 0,
					"default": 0,
					"example": 0
				},
				"down_throughput_limit": {
					"description": "虚拟服务下行流量吞吐限制(单位Mbps)",
					"type": "integer",
					"maximum": 4294967295,
					"minimum": 0,
					"default": 0,
					"example": 0
				}
			}
		},
		"config.service_type": {
			"type": "string",
			"enum": [
				"IP",
				"ANY",
				"TCP-FORWARD",
				"TCP-PROXY",
				"UDP-FORWARD",
				"UDP-PROXY",
				"HTTP",
				"SSL-OFFLOAD",
				"SSL-OFFLOAD-HTTPS",
				"RADIUS",
				"DNS",
				"FTP",
				"SIP-TCP",
				"SIP-UDP",
				"8583"
			],
			"description": "指定虚拟服务的类型。",
			"example": "HTTP",
			"default": "HTTP"
		}
	}
}