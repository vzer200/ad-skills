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
		"/api/ad/v3/net/link/all/": {
			"description": "链路IP配置管理操作",
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
					"link"
				],
				"summary": "get all link",
				"description": "查看链路IP配置",
				"operationId": "get_link_list",
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
						"$ref": "#/responses/operation_config_link_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net link all",
					"description": "查看所有链路里的自定义配置：（包含所有链路配置，不包含部分默认子配置项）"
				},
				{
					"command": "list net link all all_properties",
					"description": "查看所有链路里的所有配置：（包含所有链路的每一子项）"
				},
				{
					"command": "list net link all [ name addresses ]",
					"description": "查看每条链路对应的ip地址集"
				},
				{
					"command": "list net link all [ name interface ]",
					"description": "查看每条线路所引用的网络接口"
				},
				{
					"command": "",
					"description": ""
				}
			]
		},
		"/api/ad/v3/net/link/all/{name}": {
			"description": "指定链路IP配置管理操作",
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
					"link"
				],
				"summary": "get specific link",
				"description": "查看指定链路IP配置",
				"operationId": "get_link",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_object"
					}
				}
			}
		}
	},
	"parameters": {
		"LINK-ALL-CONFIG": {
			"name": "LINK-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "链路IP配置",
			"schema": {
				"$ref": "#/definitions/config.link"
			}
		},
		"LINK-ALL-PROPERTY": {
			"name": "LINK-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "链路IP属性",
			"schema": {
				"$ref": "#/definitions/config.link"
			}
		}
	},
	"responses": {
		"operation_config_link_list": {
			"description": "链路IP配置列表",
			"schema": {
				"$ref": "#/definitions/config.link_list"
			}
		},
		"operation_config_link_object": {
			"description": "链路IP配置对象",
			"schema": {
				"$ref": "#/definitions/config.link"
			}
		}
	},
	"definitions": {
		"config.link_list": {
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
						"$ref": "#/definitions/config.link"
					}
				}
			}
		},
		"config.link": {
			"type": "object",
			"required": [
				"name",
				"interface"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "配置名称",
					"example": "link_lan_1"
				},
				"description": {
					"type": "string",
					"description": "业务标签及备注信息描述"
				},
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "配置启/禁用开关（ENABLE-启用/DISABLE-禁用）",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"type": {
					"type": "string",
					"enum": [
						"LAN",
						"WAN",
						"PPPOE"
					],
					"description": "类别（LAN/WAN/PPPOE）"
				},
				"interface": {
					"type": "object",
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"PHYSICAL",
								"BOND",
								"VLAN",
								"BRIDGE"
							],
							"description": "接口类型（PHYSICAL-普通口/BOND-端口聚合/VLAN-VLAN子接口/BRIDGE-端口桥接）",
							"example": "VLAN"
						},
						"interface": {
							"type": "string",
							"description": "接口配置名称",
							"example": "bond-134"
						}
					}
				},
				"session_isolation": {
					"type": "string",
					"description": "链路会话隔离的开关",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"username": {
					"type": "string",
					"description": "用户名",
					"example": "123456789@ct.com"
				},
				"password": {
					"type": "string",
					"description": "密码",
					"writeOnly": true,
					"example": "abcd1234"
				},
				"encrypted_password": {
					"type": "string",
					"description": "加密密码",
					"example": "A1B2C3D4"
				},
				"echo_retransmission_interval": {
					"type": "integer",
					"description": "ECHO重传间隔时间（单位：秒）",
					"default": 80,
					"example": 80
				},
				"echo_retransmission_count": {
					"type": "integer",
					"description": "ECHO重传次数（单位：次）",
					"default": 3,
					"example": 3
				},
				"auto_dial": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "自动拨号启/禁用开关（ENABLE-启用/DISABLE-禁用）",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"auto_dial_interval": {
					"type": "integer",
					"description": "自动拨号间隔（单位：次）",
					"default": 1,
					"example": 5
				},
				"mtu": {
					"type": "integer",
					"description": "最大传输单元大小（单位：字节）",
					"default": 1492,
					"example": 1492
				},
				"mac_address": {
					"type": "string",
					"default": "指定MAC地址",
					"example": "00:90:0b:3c:33:18"
				},
				"addresses": {
					"description": "地址列表（集群模式浮动IP地址）",
					"type": "array",
					"items": {
						"type": "string",
						"description": "链路IP地址需要指定子网掩码或前缀长度",
						"example": "192.168.1.100/24"
					}
				},
				"cluster_addresses": {
					"type": "array",
					"description": "集群成员静态IP地址（仅在集群模式下生效）",
					"items": {
						"type": "object",
						"properties": {
							"address": {
								"type": "string",
								"description": "静态IP地址",
								"example": "192.168.1.100/24"
							},
							"associated_member": {
								"type": "string",
								"description": "分配集群成员",
								"example": "{member}"
							}
						}
					}
				},
				"cluster_gateways": {
					"type": "array",
					"description": "集群网关（仅在集群模式下生效）",
					"items": {
						"type": "object",
						"properties": {
							"gateway": {
								"type": "string",
								"description": "网关（集群模式下默认网关）",
								"example": "200.200.0.254"
							},
							"associated_member": {
								"type": "string",
								"description": "分配集群成员（仅在集群模式下生效）",
								"example": "{member}"
							}
						}
					}
				},
				"auto_snat": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "自动SNAT（ENABLE-启用/DISABLE-禁用）",
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"upstream_bandwidth_mbps": {
					"type": "integer",
					"description": "WAN链路上行宽带（单位：Mbps）",
					"example": 100
				},
				"upstream_busy_percent": {
					"type": "integer",
					"description": "WAN链路上行宽带繁忙比例",
					"default": 80,
					"example": 80
				},
				"downstream_bandwidth_mbps": {
					"type": "integer",
					"description": "WAN链路下行宽带（单位：Mbps）",
					"example": 100
				},
				"downstream_busy_percent": {
					"type": "integer",
					"description": "WAN链路下行宽带繁忙比例",
					"default": 80,
					"example": 80
				},
				"gateway_arp_detect": {
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"description": "网关ARP检查启/禁用开关（ENABLE-启用/DISABLE-禁用）",
							"default": "DISABLE"
						},
						"timeout": {
							"type": "integer",
							"description": "超时时间（单位：秒）",
							"default": 15,
							"example": 15
						},
						"interval": {
							"type": "integer",
							"description": "检测时间（单位：秒）",
							"default": 5,
							"example": 5
						}
					}
				},
				"arp_detect": {
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"description": "ARP检查启/禁用开关（ENABLE-启用/DISABLE-禁用）",
							"default": "DISABLE"
						},
						"target_host": {
							"type": "string",
							"description": "检测目标主机",
							"example": "192.168.1.1"
						},
						"timeout": {
							"type": "integer",
							"description": "超时时间（单位：秒）",
							"default": 15,
							"example": 15
						},
						"interval": {
							"type": "integer",
							"description": "检测时间（单位：秒）",
							"default": 5,
							"example": 5
						}
					}
				},
				"monitors": {
					"type": "array",
					"items": {
						"type": "object",
						"description": "链路健康检查列表",
						"required": [
							"monitor",
							"target_host"
						],
						"properties": {
							"monitor": {
								"type": "string",
								"description": "链路健康检查方法",
								"example": "ping"
							},
							"target_host": {
								"type": "string",
								"description": "检测目标主机",
								"example": "10.10.10.254"
							}
						}
					}
				},
				"cable_plugin_detect": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"failsafe": {
					"description": "故障保护",
					"type": "object",
					"properties": {
						"state": {
							"description": "故障保护启禁用开关（ENABLE-启用/DISABLE-禁用）",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"timeout": {
							"description": "故障检测超时时间",
							"type": "integer",
							"default": 120,
							"example": 120
						},
						"action": {
							"description": "保护动作",
							"type": "string",
							"enum": [
								"FAILOVER",
								"RESTART-SERVICE",
								"REBOOT"
							],
							"default": "FAILOVER",
							"example": "FAILOVER"
						}
					}
				},
				"netns": {
					"type": "string",
					"default": "default"
				}
			}
		}
	}
}