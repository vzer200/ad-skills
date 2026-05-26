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
		"/api/ad/v3/ha/active-standby": {
			"description": "双机配置相关操作",
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
					"active-standby"
				],
				"summary": "get active-standby",
				"description": "获取当前双机配置",
				"operationId": "get_active_standby",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_active_standby_object"
					}
				}
			},
			"put": {
				"tags": [
					"active-standby"
				],
				"summary": "replace active-standby",
				"description": "修改双机配置",
				"operationId": "replace_active_standby",
				"parameters": [
					{
						"$ref": "#/parameters/ACTIVE-STANDBY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_active_standby_object"
					}
				}
			},
			"patch": {
				"tags": [
					"active-standby"
				],
				"summary": "modify active-standby",
				"description": "修改双机配置",
				"operationId": "edit_active_standby",
				"parameters": [
					{
						"$ref": "#/parameters/ACTIVE-STANDBY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_active_standby_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha active-standby",
					"description": "获取双机配置"
				},
				{
					"command": "modify ha active-standby state enable ha { interface { type physical interface NET1 } address 192.168.100.100/24 } alternate_ha { interface { type bond interface bond1 } address 100.100.100.100/24 }",
					"description": "创建双机，主心跳口引用物理口NET1，主心跳IP为192.168.100.100/24，备份心跳口引用bond口bond1，备份心跳口IP地址为100.100.100.100/24，其他配置使用默认配置"
				},
				{
					"command": "modify ha active-standby host_name dev_A heartbeat_timeout_ms 3000 heartbeat_interval_ms 300 brain_split_detect { state enable link LAN2 } session_synchronize { state enable } mac_synchronize { state enable links [ LAN1 LAN2 WAN1 WAN2 ] } fault_detect { state enable method fault-rule link_fault_rules [ [ LAN1 LAN2 ] [ WAN1 WAN2 ] ] health_level { local link-monitor peer link-poweron } link_monitor_reset_delay_minute 6 } preempt_mode local standby_interface_poweroff { method timing duration 30 interfaces [ NET1 NET2 NET3 ] } standby_bridge_interface enable interface_linkage enable arp_linkage { state enable link LAN1 broadcast_interval 10 ip_address 195.197.197.106 }",
					"description": "修改双机配置，修改设备名称为dev_A，心跳超时时间为3000毫秒，心跳间隔为300毫秒，开启心跳口故障检测，检测网口为链路LAN2，开启连接镜像，开启MAC同步，同步的链路为LAN1、LAN2、WAN1、WAN2，开启故障切换功能，使用自定义生效规则，添加两条规则，第一条：LAN1、LAN2同时故障时切换，第二条：WAN1、WAN2同时故障时切换，本端设备为监视器级别检测，对端设备为掉电级别检测，备机自动清除监视器故障的时间为6分钟，开启本端设备的抢占功能，开启备机down网口功能，down网口类型为：down30秒，down网口列表为：NET1、NET2、NET3，开启备机交换口，开启网口联动，开启邻居公告，公告的链路为LAN1，IP地址为195.197.197.106，间隔为10秒"
				},
				{
					"command": "modify ha active-standby state disable",
					"description": "禁用双机"
				}
			]
		}
	},
	"parameters": {
		"ACTIVE-STANDBY-CONFIG": {
			"name": "ACTIVE-STANDBY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.active_standby"
			}
		},
		"ACTIVE-STANDBY-PROPERTY": {
			"name": "ACTIVE-STANDBY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.active_standby"
			}
		}
	},
	"responses": {
		"operation_config_active_standby_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.active_standby"
			}
		}
	},
	"definitions": {
		"config.active_standby": {
			"type": "object",
			"properties": {
				"host_name": {
					"description": "设备名称",
					"type": "string",
					"example": "dc-1",
					"maxLength": 63,
					"minLength": 1
				},
				"state": {
					"description": "双机的启禁用状态，enable表示启用，disable表示禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"heartbeat_timeout_ms": {
					"description": "心跳超时时间，单位毫秒",
					"type": "integer",
					"default": 5000,
					"example": 400,
					"maximum": 20000,
					"minimum": 100
				},
				"heartbeat_interval_ms": {
					"description": "心跳间隔时间，单位毫秒",
					"type": "integer",
					"default": 100,
					"example": 200,
					"maximum": 10000,
					"minimum": 100
				},
				"ha": {
					"description": "必选参数，主心跳口",
					"type": "object",
					"required": [
						"interface",
						"address"
					],
					"properties": {
						"interface": {
							"description": "主心跳口网口",
							"type": "object",
							"properties": {
								"type": {
									"description": "主心跳类型，可选择physical、bond、bridge、vlan",
									"type": "string",
									"enum": [
										"MACVLAN",
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE"
									],
									"default": "PHYSICAL",
									"example": "VLAN"
								},
								"interface": {
									"description": "主心跳口网口，根据对应类型可选择对应的网口",
									"type": "string",
									"example": "bond-134"
								}
							}
						},
						"address": {
							"description": "主心跳口IP，IP/掩码格式",
							"type": "string",
							"example": "10.0.1.2/30"
						}
					}
				},
				"alternate_ha": {
					"description": "必选参数，备心跳口",
					"type": "object",
					"required": [
						"interface",
						"address"
					],
					"properties": {
						"interface": {
							"description": "备心跳口网口",
							"type": "object",
							"properties": {
								"type": {
									"description": "备心跳口类型，可选择physical、bond、bridge、vlan",
									"type": "string",
									"enum": [
										"MACVLAN",
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE"
									],
									"default": "PHYSICAL",
									"example": "VLAN"
								},
								"interface": {
									"description": "备心跳口网口，根据对应类型可选择对应的网口",
									"type": "string",
									"example": "bond-134"
								}
							}
						},
						"address": {
							"description": "备心跳口IP，IP/掩码格式，不能和主心跳IP同网段",
							"type": "string",
							"example": "200.0.0.2/30"
						}
					}
				},
				"brain_split_detect": {
					"description": "心跳口故障检测配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "心跳口故障检测开关，enable表示启用，disable表示禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"link": {
							"description": "心跳口故障检测网口，不能喝主、备心跳口使用相同网口",
							"type": "string",
							"example": "wan_1"
						}
					}
				},
				"session_synchronize": {
					"description": "连接镜像配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "连接镜像开关，enable表示启用，disable表示禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"connection_state_synchronize": {
							"description": "全状态同步开关，enable表示启用，disable表示禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						}
					}
				},
				"mac_synchronize": {
					"description": "MAC同步配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "MAC同步开关，enable表示启用，disable表示禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"links": {
							"description": "MAC同步链路列表",
							"type": "array",
							"items": {
								"description": "MAC同步链路",
								"type": "string",
								"example": "{WAN_1}"
							},
							"maxItems": 31
						}
					}
				},
				"fault_detect": {
					"description": "故障切换配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "故障切换开关，enable表示启用，disable表示禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"method": {
							"description": "故障切换方式，可选择fault-requirement：按数量切换方式，和fault-rule：按自定义规则切换方式",
							"type": "string",
							"enum": [
								"FAULT-REQUIREMENT",
								"FAULT-RULE"
							],
							"default": "FAULT-REQUIREMENT",
							"example": "FAULT-RULE"
						},
						"link_fault_requirement": {
							"description": "按故障数量切换条件",
							"type": "object",
							"properties": {
								"objects": {
									"description": "检测的链路列表",
									"type": "array",
									"items": {
										"description": "检测的链路",
										"type": "string",
										"example": "wan_1"
									},
									"maxItems": 200
								},
								"fault_object_count": {
									"description": "引起切换的最少故障链路数量",
									"type": "integer",
									"default": 0,
									"example": 0,
									"maximum": 200,
									"minimum": 0
								}
							}
						},
						"link_fault_rules": {
							"description": "自定义切换规则",
							"type": "array",
							"items": {
								"description": "自定义切换规则列表，每一条规则满足条件时都会触发切换",
								"type": "array",
								"items": {
									"description": "某一条自定义切换规则，此条规则内所有链路都故障时则认为该条规则满足了条件",
									"type": "string",
									"example": "wan_1"
								},
								"maxItems": 200,
								"minItems": 1
							},
							"maxItems": 200
						},
						"health_level": {
							"description": "监视器检测级别",
							"type": "object",
							"properties": {
								"local": {
									"description": "本端设备的监视器检测级别，link-monitor：关注监视器的检测结果，link-poweron：只关注网口是否上电",
									"type": "string",
									"enum": [
										"LINK-MONITOR",
										"LINK-POWERON"
									],
									"default": "LINK-MONITOR"
								},
								"peer": {
									"description": "对端设备的监视器检测级别，link-monitor：关注监视器的检测结果，link-poweron：只关注网口是否上电",
									"type": "string",
									"enum": [
										"LINK-MONITOR",
										"LINK-POWERON"
									],
									"default": "LINK-MONITOR"
								}
							}
						},
						"link_monitor_reset_delay_minute": {
							"description": "自动清除备机监视器故障的时间，由于备机没有监视器检测能力，当检测级别为link-monitor的设备切换为备机时，会自动在此时间后清除备机的监视器故障状态",
							"type": "integer",
							"default": 5,
							"example": 5,
							"maximum": 60,
							"minimum": 0
						}
					}
				},
				"interface_linkage": {
					"description": "网口联动，enable表示启用，disable表示禁用。当网口掉电情况满足故障切换条件时，down网口列表中的所有网口将被联动掉电",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"standby_interface_poweroff": {
					"description": "备机down网口配置",
					"type": "object",
					"properties": {
						"method": {
							"description": "备机down网口的方式，always：永久掉电，never：网口不掉电，timing：掉电一段时间",
							"type": "string",
							"enum": [
								"NEVER",
								"ALWAYS",
								"TIMING"
							],
							"default": "NEVER",
							"example": "NEVER"
						},
						"interfaces": {
							"description": "down网口列表，备机down网口和网口联动功能公用此列表",
							"type": "array",
							"items": {
								"description": "单个down网口",
								"type": "string",
								"example": "NET2"
							},
							"maxItems": 200
						},
						"duration": {
							"description": "备机down网口的时间，只有down网口方式选择为timing时此选项才有效",
							"type": "integer",
							"default": 20,
							"example": 600,
							"maximum": 600,
							"minimum": 1
						}
					}
				},
				"standby_bridge_interface": {
					"type": "string",
					"description": "备机交换口，启用时，备机交换口能够转发数据包",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"preempt_mode": {
					"description": "抢占模式，可选择disable：禁用，local：本端抢占，peer：对端抢占",
					"type": "string",
					"enum": [
						"DISABLE",
						"LOCAL",
						"PEER"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"arp_linkage": {
					"description": "网口联动相关配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "邻居公告开关，开启后，可选择定时在某个网口对某个IP进行邻居广播通告",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"link": {
							"description": "选择邻居通告的网口",
							"type": "string",
							"example": "wan_1"
						},
						"ip_address": {
							"description": "选择邻居通告的IP",
							"type": "string",
							"example": "1.1.1.1"
						},
						"broadcast_interval": {
							"description": "邻居通告间隔",
							"type": "integer",
							"default": 5,
							"example": 5,
							"maximum": 300,
							"minimum": 5
						}
					}
				}
			}
		}
	}
}