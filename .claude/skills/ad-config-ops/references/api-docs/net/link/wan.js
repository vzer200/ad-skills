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
		"/api/ad/v3/net/link/wan/": {
			"description": "链路WAN类别配置管理操作",
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
					"link-wan"
				],
				"summary": "get all link-wan",
				"description": "查看链路WAN类别配置",
				"operationId": "get_link_wan_list",
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
						"$ref": "#/responses/operation_config_link_wan_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all link-wan",
						"description": "查看链路WAN类别配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/net/link/wan/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/net/link/wan/ 响应",
						"description": "返回GET /api/ad/v3/net/link/wan/的响应数据",
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
									"name": "wan_1",
									"description": "example_string",
									"state": "ENABLE",
									"type": "WAN",
									"interface": {
										"type": "PHYSICAL",
										"interface": "bond-134"
									},
									"session_isolation": "DISABLE",
									"addresses": [
										"192.168.1.100/24"
									],
									"gateway": "200.200.0.254",
									"gateway_ipv6": "2001::4432",
									"dns_servers": [
										"192.168.1.1"
									],
									"cluster_addresses": [
										{
											"address": "192.168.1.100/24",
											"associated_member": "{member}"
										}
									],
									"cluster_gateways": [
										{
											"gateway": "200.200.0.254",
											"associated_member": "{member}"
										}
									],
									"auto_snat": "DISABLE",
									"autolasthop": "GLOBAL",
									"upstream_bandwidth_mbps": 1000,
									"upstream_busy_percent": 80,
									"downstream_bandwidth_mbps": 1000,
									"downstream_busy_percent": 80,
									"gateway_arp_detect": {
										"state": "DISABLE",
										"timeout": 15,
										"interval": 5
									},
									"monitors": [
										{
											"monitor": "ping",
											"target_host": "10.10.10.254"
										}
									],
									"cable_plugin_detect": "ENABLE",
									"appgroup_failover": "DISABLE",
									"failsafe": {
										"state": "DISABLE",
										"timeout": 120,
										"action": "FAILOVER"
									},
									"dev_mgt": {
										"report_console": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"snmp_svc": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"ssh_console": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"troubleshooting_port": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"web_console": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										}
									}
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"link-wan"
				],
				"summary": "create new link-wan",
				"description": "新建链路WAN类别配置",
				"operationId": "add_link_wan_list",
				"parameters": [
					{
						"$ref": "#/parameters/WAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_wan_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new link-wan",
						"description": "新建链路WAN类别配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/net/link/wan/",
							"body": {
								"name": "AI_wan_1_A",
								"state": "ENABLE",
								"type": "WAN",
								"interface": {
									"type": "PHYSICAL",
									"interface": "bond-134"
								},
								"session_isolation": "DISABLE",
								"auto_snat": "DISABLE",
								"autolasthop": "GLOBAL",
								"upstream_bandwidth_mbps": 1000,
								"upstream_busy_percent": 80,
								"downstream_bandwidth_mbps": 1000,
								"downstream_busy_percent": 80,
								"cable_plugin_detect": "ENABLE",
								"appgroup_failover": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/net/link/wan/ 响应",
						"description": "返回POST /api/ad/v3/net/link/wan/的响应数据",
						"value": {
							"name": "AI_wan_1_A",
							"description": "example_string",
							"state": "ENABLE",
							"type": "WAN",
							"interface": {
								"type": "PHYSICAL",
								"interface": "bond-134"
							},
							"session_isolation": "DISABLE",
							"addresses": [
								"192.168.1.100/24"
							],
							"gateway": "200.200.0.254",
							"gateway_ipv6": "2001::4432",
							"dns_servers": [
								"192.168.1.1"
							],
							"cluster_addresses": [
								{
									"address": "192.168.1.100/24",
									"associated_member": "{member}"
								}
							],
							"cluster_gateways": [
								{
									"gateway": "200.200.0.254",
									"associated_member": "{member}"
								}
							],
							"auto_snat": "DISABLE",
							"autolasthop": "GLOBAL",
							"upstream_bandwidth_mbps": 1000,
							"upstream_busy_percent": 80,
							"downstream_bandwidth_mbps": 1000,
							"downstream_busy_percent": 80,
							"gateway_arp_detect": {
								"state": "DISABLE",
								"timeout": 15,
								"interval": 5
							},
							"monitors": [
								{
									"monitor": "ping",
									"target_host": "10.10.10.254"
								}
							],
							"cable_plugin_detect": "ENABLE",
							"appgroup_failover": "DISABLE",
							"failsafe": {
								"state": "DISABLE",
								"timeout": 120,
								"action": "FAILOVER"
							},
							"dev_mgt": {
								"report_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"snmp_svc": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"ssh_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"troubleshooting_port": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"web_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								}
							}
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"link-wan"
				],
				"summary": "modify link-wan",
				"description": "修改链路WAN类别配置",
				"operationId": "edit_link_wan_list",
				"parameters": [
					{
						"$ref": "#/parameters/WAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_wan_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify link-wan",
						"description": "修改链路WAN类别配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/net/link/wan/",
							"body": {
								"name": "wan_1",
								"state": "ENABLE",
								"type": "WAN",
								"interface": {
									"type": "PHYSICAL",
									"interface": "bond-134"
								},
								"session_isolation": "DISABLE",
								"auto_snat": "DISABLE",
								"autolasthop": "GLOBAL",
								"upstream_bandwidth_mbps": 1000,
								"upstream_busy_percent": 80,
								"downstream_bandwidth_mbps": 1000,
								"downstream_busy_percent": 80,
								"cable_plugin_detect": "ENABLE",
								"appgroup_failover": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/net/link/wan/ 响应",
						"description": "返回PATCH /api/ad/v3/net/link/wan/的响应数据",
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
									"name": "wan_1",
									"description": "example_string",
									"state": "ENABLE",
									"type": "WAN",
									"interface": {
										"type": "PHYSICAL",
										"interface": "bond-134"
									},
									"session_isolation": "DISABLE",
									"addresses": [
										"192.168.1.100/24"
									],
									"gateway": "200.200.0.254",
									"gateway_ipv6": "2001::4432",
									"dns_servers": [
										"192.168.1.1"
									],
									"cluster_addresses": [
										{
											"address": "192.168.1.100/24",
											"associated_member": "{member}"
										}
									],
									"cluster_gateways": [
										{
											"gateway": "200.200.0.254",
											"associated_member": "{member}"
										}
									],
									"auto_snat": "DISABLE",
									"autolasthop": "GLOBAL",
									"upstream_bandwidth_mbps": 1000,
									"upstream_busy_percent": 80,
									"downstream_bandwidth_mbps": 1000,
									"downstream_busy_percent": 80,
									"gateway_arp_detect": {
										"state": "DISABLE",
										"timeout": 15,
										"interval": 5
									},
									"monitors": [
										{
											"monitor": "ping",
											"target_host": "10.10.10.254"
										}
									],
									"cable_plugin_detect": "ENABLE",
									"appgroup_failover": "DISABLE",
									"failsafe": {
										"state": "DISABLE",
										"timeout": 120,
										"action": "FAILOVER"
									},
									"dev_mgt": {
										"report_console": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"snmp_svc": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"ssh_console": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"troubleshooting_port": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										},
										"web_console": {
											"whitelist_address": {
												"ref_custom_address_group": "",
												"type": "ALL"
											},
											"whitelist_switch": "GLOBAL"
										}
									}
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net link wan",
					"description": "查看所有wan口配置"
				},
				{
					"command": "create net link wan DianXin state enable interface { interface NET5 type physical } addresses [ '202.1.1.11/24' '240e::abcd/96' ] gateway '202.1.1.254' gateway_ipv6 '240e::1234' auto_snat enable upstream_bandwidth_mbps 1000 upstream_busy_percent 80 downstream_bandwidth_mbps 1000 downstream_busy_percent 80 dns_servers [ '114.114.114.144' '8.8.8.8'] monitors [ { monitor http target_host 'www.baidu.com' } ] cable_plugin_detect enable gateway_arp_detect { state disable }",
					"description": "创建并启用链路DianXin，引用NET5口； 配置ipv4和ipv6地址分别为202.1.1.11/24和240e::abcd/96；网关分别为202.1.1.254和240e::1234；启用自动snat；配置上行带宽为1000Mbps，上行繁忙比例为80%，下行带宽为1000Mbps，下行繁忙比例为80%；配置该链路对应的dns为114.114.114.144和8.8.8.8;配置该链路的监视器为http监视www.baidu.com；启用拔线检测；禁用针对网关地址的arp探测"
				},
				{
					"command": "list net link wan DianXin",
					"description": "查看名称为DianXin的wan口配置"
				},
				{
					"command": "modify net link wan DianXin dns_servers delete [ '8.8.8.8' ]",
					"description": "编辑链路DianXin口，去掉dns服务器列表中的8.8.8.8"
				},
				{
					"command": "delete net link wan DianXin",
					"description": "删除链路DianXin"
				}
			]
		},
		"/api/ad/v3/net/link/wan/{name}": {
			"description": "指定WAN链路配置相关操作",
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
					"link-wan"
				],
				"summary": "get specific link-wan",
				"description": "查看指定链路WAN类别配置",
				"operationId": "get_link_wan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_wan_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific link-wan",
						"description": "查看指定链路WAN类别配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/net/link/wan/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/net/link/wan/{name} 响应",
						"description": "返回GET /api/ad/v3/net/link/wan/{name}的响应数据",
						"value": {
							"name": "wan_1",
							"description": "example_string",
							"state": "ENABLE",
							"type": "WAN",
							"interface": {
								"type": "PHYSICAL",
								"interface": "bond-134"
							},
							"session_isolation": "DISABLE",
							"addresses": [
								"192.168.1.100/24"
							],
							"gateway": "200.200.0.254",
							"gateway_ipv6": "2001::4432",
							"dns_servers": [
								"192.168.1.1"
							],
							"cluster_addresses": [
								{
									"address": "192.168.1.100/24",
									"associated_member": "{member}"
								}
							],
							"cluster_gateways": [
								{
									"gateway": "200.200.0.254",
									"associated_member": "{member}"
								}
							],
							"auto_snat": "DISABLE",
							"autolasthop": "GLOBAL",
							"upstream_bandwidth_mbps": 1000,
							"upstream_busy_percent": 80,
							"downstream_bandwidth_mbps": 1000,
							"downstream_busy_percent": 80,
							"gateway_arp_detect": {
								"state": "DISABLE",
								"timeout": 15,
								"interval": 5
							},
							"monitors": [
								{
									"monitor": "ping",
									"target_host": "10.10.10.254"
								}
							],
							"cable_plugin_detect": "ENABLE",
							"appgroup_failover": "DISABLE",
							"failsafe": {
								"state": "DISABLE",
								"timeout": 120,
								"action": "FAILOVER"
							},
							"dev_mgt": {
								"report_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"snmp_svc": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"ssh_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"troubleshooting_port": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"web_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								}
							}
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"link-wan"
				],
				"summary": "create new link-wan",
				"description": "新建链路WAN类别配置",
				"operationId": "create_link_wan",
				"parameters": [
					{
						"$ref": "#/parameters/WAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_wan_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new link-wan",
						"description": "新建链路WAN类别配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/net/link/wan/{name}",
							"body": {
								"name": "AI_wan_1_B",
								"state": "ENABLE",
								"type": "WAN",
								"interface": {
									"type": "PHYSICAL",
									"interface": "bond-134"
								},
								"session_isolation": "DISABLE",
								"auto_snat": "DISABLE",
								"autolasthop": "GLOBAL",
								"upstream_bandwidth_mbps": 1000,
								"upstream_busy_percent": 80,
								"downstream_bandwidth_mbps": 1000,
								"downstream_busy_percent": 80,
								"cable_plugin_detect": "ENABLE",
								"appgroup_failover": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/net/link/wan/{name} 响应",
						"description": "返回POST /api/ad/v3/net/link/wan/{name}的响应数据",
						"value": {
							"name": "AI_wan_1_B",
							"description": "example_string",
							"state": "ENABLE",
							"type": "WAN",
							"interface": {
								"type": "PHYSICAL",
								"interface": "bond-134"
							},
							"session_isolation": "DISABLE",
							"addresses": [
								"192.168.1.100/24"
							],
							"gateway": "200.200.0.254",
							"gateway_ipv6": "2001::4432",
							"dns_servers": [
								"192.168.1.1"
							],
							"cluster_addresses": [
								{
									"address": "192.168.1.100/24",
									"associated_member": "{member}"
								}
							],
							"cluster_gateways": [
								{
									"gateway": "200.200.0.254",
									"associated_member": "{member}"
								}
							],
							"auto_snat": "DISABLE",
							"autolasthop": "GLOBAL",
							"upstream_bandwidth_mbps": 1000,
							"upstream_busy_percent": 80,
							"downstream_bandwidth_mbps": 1000,
							"downstream_busy_percent": 80,
							"gateway_arp_detect": {
								"state": "DISABLE",
								"timeout": 15,
								"interval": 5
							},
							"monitors": [
								{
									"monitor": "ping",
									"target_host": "10.10.10.254"
								}
							],
							"cable_plugin_detect": "ENABLE",
							"appgroup_failover": "DISABLE",
							"failsafe": {
								"state": "DISABLE",
								"timeout": 120,
								"action": "FAILOVER"
							},
							"dev_mgt": {
								"report_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"snmp_svc": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"ssh_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"troubleshooting_port": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"web_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								}
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"link-wan"
				],
				"summary": "replace specific link-wan",
				"description": "替换指定链路WAN类别配置",
				"operationId": "replace_link_wan",
				"parameters": [
					{
						"$ref": "#/parameters/WAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_wan_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific link-wan",
						"description": "替换指定链路WAN类别配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/net/link/wan/{name}",
							"body": {
								"name": "wan_1",
								"state": "ENABLE",
								"type": "WAN",
								"interface": {
									"type": "PHYSICAL",
									"interface": "bond-134"
								},
								"session_isolation": "DISABLE",
								"auto_snat": "DISABLE",
								"autolasthop": "GLOBAL",
								"upstream_bandwidth_mbps": 1000,
								"upstream_busy_percent": 80,
								"downstream_bandwidth_mbps": 1000,
								"downstream_busy_percent": 80,
								"cable_plugin_detect": "ENABLE",
								"appgroup_failover": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/net/link/wan/{name} 响应",
						"description": "返回PUT /api/ad/v3/net/link/wan/{name}的响应数据",
						"value": {
							"name": "wan_1",
							"description": "example_string",
							"state": "ENABLE",
							"type": "WAN",
							"interface": {
								"type": "PHYSICAL",
								"interface": "bond-134"
							},
							"session_isolation": "DISABLE",
							"addresses": [
								"192.168.1.100/24"
							],
							"gateway": "200.200.0.254",
							"gateway_ipv6": "2001::4432",
							"dns_servers": [
								"192.168.1.1"
							],
							"cluster_addresses": [
								{
									"address": "192.168.1.100/24",
									"associated_member": "{member}"
								}
							],
							"cluster_gateways": [
								{
									"gateway": "200.200.0.254",
									"associated_member": "{member}"
								}
							],
							"auto_snat": "DISABLE",
							"autolasthop": "GLOBAL",
							"upstream_bandwidth_mbps": 1000,
							"upstream_busy_percent": 80,
							"downstream_bandwidth_mbps": 1000,
							"downstream_busy_percent": 80,
							"gateway_arp_detect": {
								"state": "DISABLE",
								"timeout": 15,
								"interval": 5
							},
							"monitors": [
								{
									"monitor": "ping",
									"target_host": "10.10.10.254"
								}
							],
							"cable_plugin_detect": "ENABLE",
							"appgroup_failover": "DISABLE",
							"failsafe": {
								"state": "DISABLE",
								"timeout": 120,
								"action": "FAILOVER"
							},
							"dev_mgt": {
								"report_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"snmp_svc": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"ssh_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"troubleshooting_port": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"web_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								}
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"link-wan"
				],
				"summary": "modify specific link-wan",
				"description": "修改指定链路WAN类别配置",
				"operationId": "edit_link_wan",
				"parameters": [
					{
						"$ref": "#/parameters/WAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_wan_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific link-wan",
						"description": "修改指定链路WAN类别配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/net/link/wan/{name}",
							"body": {
								"name": "wan_1",
								"state": "ENABLE",
								"type": "WAN",
								"interface": {
									"type": "PHYSICAL",
									"interface": "bond-134"
								},
								"session_isolation": "DISABLE",
								"auto_snat": "DISABLE",
								"autolasthop": "GLOBAL",
								"upstream_bandwidth_mbps": 1000,
								"upstream_busy_percent": 80,
								"downstream_bandwidth_mbps": 1000,
								"downstream_busy_percent": 80,
								"cable_plugin_detect": "ENABLE",
								"appgroup_failover": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/net/link/wan/{name} 响应",
						"description": "返回PATCH /api/ad/v3/net/link/wan/{name}的响应数据",
						"value": {
							"name": "wan_1",
							"description": "example_string",
							"state": "ENABLE",
							"type": "WAN",
							"interface": {
								"type": "PHYSICAL",
								"interface": "bond-134"
							},
							"session_isolation": "DISABLE",
							"addresses": [
								"192.168.1.100/24"
							],
							"gateway": "200.200.0.254",
							"gateway_ipv6": "2001::4432",
							"dns_servers": [
								"192.168.1.1"
							],
							"cluster_addresses": [
								{
									"address": "192.168.1.100/24",
									"associated_member": "{member}"
								}
							],
							"cluster_gateways": [
								{
									"gateway": "200.200.0.254",
									"associated_member": "{member}"
								}
							],
							"auto_snat": "DISABLE",
							"autolasthop": "GLOBAL",
							"upstream_bandwidth_mbps": 1000,
							"upstream_busy_percent": 80,
							"downstream_bandwidth_mbps": 1000,
							"downstream_busy_percent": 80,
							"gateway_arp_detect": {
								"state": "DISABLE",
								"timeout": 15,
								"interval": 5
							},
							"monitors": [
								{
									"monitor": "ping",
									"target_host": "10.10.10.254"
								}
							],
							"cable_plugin_detect": "ENABLE",
							"appgroup_failover": "DISABLE",
							"failsafe": {
								"state": "DISABLE",
								"timeout": 120,
								"action": "FAILOVER"
							},
							"dev_mgt": {
								"report_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"snmp_svc": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"ssh_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"troubleshooting_port": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"web_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								}
							}
						}
					}
				}
			},
			"delete": {
				"tags": [
					"link-wan"
				],
				"summary": "delete specific link-wan",
				"description": "删除指定链路WAN类别配置",
				"operationId": "delete_link_wan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_wan_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific link-wan",
						"description": "删除指定链路WAN类别配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/net/link/wan/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/net/link/wan/{name} 响应",
						"description": "返回DELETE /api/ad/v3/net/link/wan/{name}的响应数据",
						"value": {
							"name": "wan_1",
							"description": "example_string",
							"state": "ENABLE",
							"type": "WAN",
							"interface": {
								"type": "PHYSICAL",
								"interface": "bond-134"
							},
							"session_isolation": "DISABLE",
							"addresses": [
								"192.168.1.100/24"
							],
							"gateway": "200.200.0.254",
							"gateway_ipv6": "2001::4432",
							"dns_servers": [
								"192.168.1.1"
							],
							"cluster_addresses": [
								{
									"address": "192.168.1.100/24",
									"associated_member": "{member}"
								}
							],
							"cluster_gateways": [
								{
									"gateway": "200.200.0.254",
									"associated_member": "{member}"
								}
							],
							"auto_snat": "DISABLE",
							"autolasthop": "GLOBAL",
							"upstream_bandwidth_mbps": 1000,
							"upstream_busy_percent": 80,
							"downstream_bandwidth_mbps": 1000,
							"downstream_busy_percent": 80,
							"gateway_arp_detect": {
								"state": "DISABLE",
								"timeout": 15,
								"interval": 5
							},
							"monitors": [
								{
									"monitor": "ping",
									"target_host": "10.10.10.254"
								}
							],
							"cable_plugin_detect": "ENABLE",
							"appgroup_failover": "DISABLE",
							"failsafe": {
								"state": "DISABLE",
								"timeout": 120,
								"action": "FAILOVER"
							},
							"dev_mgt": {
								"report_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"snmp_svc": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"ssh_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"troubleshooting_port": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								},
								"web_console": {
									"whitelist_address": {
										"ref_custom_address_group": "",
										"type": "ALL"
									},
									"whitelist_switch": "GLOBAL"
								}
							}
						}
					}
				}
			}
		}
	},
	"parameters": {
		"WAN-CONFIG": {
			"name": "WAN-CONFIG",
			"in": "body",
			"required": true,
			"description": "链路WAN类别配置",
			"schema": {
				"$ref": "#/definitions/config.link_wan"
			}
		},
		"WAN-PROPERTY": {
			"name": "WAN-PROPERTY",
			"in": "body",
			"required": true,
			"description": "链路WAN类别属性",
			"schema": {
				"$ref": "#/definitions/config.link_wan"
			}
		}
	},
	"responses": {
		"operation_config_link_wan_list": {
			"description": "链路WAN类别配置列表",
			"schema": {
				"$ref": "#/definitions/config.link_wan_list"
			}
		},
		"operation_config_link_wan_object": {
			"description": "链路WAN类别配置对象",
			"schema": {
				"$ref": "#/definitions/config.link_wan"
			}
		}
	},
	"definitions": {
		"config.link_wan_list": {
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
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.link_wan"
					}
				}
			}
		},
		"config.link_wan": {
			"type": "object",
			"required": [
				"name",
				"interface",
				"upstream_bandwidth_mbps",
				"downstream_bandwidth_mbps"
			],
			"properties": {
				"name": {
					"description": "必选参数；配置名称",
					"type": "string",
					"example": "wan_1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"description": "可选参数；链路备注标签",
					"type": "string"
				},
				"state": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用），默认值disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"type": {
					"description": "可选参数；类别（wan），默认值wan",
					"type": "string",
					"enum": [
						"WAN"
					],
					"default": "WAN",
					"example": "WAN"
				},
				"interface": {
					"description": "必选参数；网络接口",
					"type": "object",
					"required": [
						"interface"
					],
					"properties": {
						"type": {
							"description": "可选参数；接口类型（physical-物理口/bond-端口聚合/vlan-VLAN子接口/bridge-交换口），默认值physical",
							"type": "string",
							"enum": [
								"PHYSICAL",
								"BOND",
								"VLAN",
								"BRIDGE",
								"MACVLAN"
							],
							"default": "PHYSICAL",
							"example": "VLAN"
						},
						"interface": {
							"description": "必选参数；接口配置名称",
							"type": "string",
							"example": "bond-134",
							"maxLength": 511,
							"minLength": 1
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
				"addresses": {
					"description": "必选参数；地址列表（集群模式浮动IP地址）",
					"type": "array",
					"items": {
						"description": "链路IP地址，需要指定子网掩码或前缀长度，如192.168.1.100/24",
						"type": "string",
						"example": "192.168.1.100/24"
					},
					"maxItems": 512
				},
				"gateway": {
					"description": "可选参数；ipv4网关地址, 如果配置了ipv4类型地址，则为必选参数",
					"type": "string",
					"example": "200.200.0.254"
				},
				"gateway_ipv6": {
					"description": "可选参数；ipv6网关地址, 如果配置了ipv6类型地址，则为必选参数",
					"type": "string",
					"example": "2001::4432"
				},
				"dns_servers": {
					"description": "可选参数；本链路对应的DNS列表",
					"type": "array",
					"items": {
						"description": "DNS服务器IP地址",
						"type": "string",
						"example": "192.168.1.1"
					},
					"maxItems": 10
				},
				"cluster_addresses": {
					"description": "可选参数；集群成员静态IP地址（仅在集群模式下生效）",
					"type": "array",
					"items": {
						"description": "必选参数；单个静态IP对象，包含静态IP和生效设备名",
						"type": "object",
						"required": [
							"address",
							"associated_member"
						],
						"properties": {
							"address": {
								"description": "必选参数；静态IP地址",
								"type": "string",
								"example": "192.168.1.100/24"
							},
							"associated_member": {
								"description": "必选参数；分配集群成员",
								"type": "string",
								"example": "{member}"
							}
						}
					},
					"maxItems": 512
				},
				"cluster_gateways": {
					"description": "可选参数；集群成员网关（仅在集群模式下生效）",
					"type": "array",
					"items": {
						"description": "必选参数；单个网关对象，包含网关IP和生效设备名",
						"type": "object",
						"required": [
							"gateway",
							"associated_member"
						],
						"properties": {
							"gateway": {
								"description": "必选参数；网关地址",
								"type": "string",
								"example": "200.200.0.254"
							},
							"associated_member": {
								"description": "必选参数；分配集群成员",
								"type": "string",
								"example": "{member}",
								"maxLength": 511,
								"minLength": 1
							}
						}
					},
					"maxItems": 16,
					"minItems": 0
				},
				"auto_snat": {
					"description": "可选参数；自动SNAT（enable-启用/disable-禁用），默认值disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"autolasthop": {
					"type": "string",
					"description": "可选参数；对称路由（global-全局/enable-启用/disable-禁用），默认值global",
					"enum": [
						"GLOBAL",
						"ENABLE",
						"DISABLE"
					],
					"default": "GLOBAL"
				},
				"upstream_bandwidth_mbps": {
					"description": "必选参数；WAN链路上行带宽（单位Mbps）",
					"type": "integer",
					"example": 100,
					"default": 1000,
					"maximum": 1000000,
					"minimum": 1
				},
				"upstream_busy_percent": {
					"description": "可选参数；WAN链路上行带宽繁忙比例，默认值80（含义为上行带宽的80%）",
					"type": "integer",
					"default": 80,
					"example": 80,
					"maximum": 100,
					"minimum": 1
				},
				"downstream_bandwidth_mbps": {
					"description": "必选参数；WAN链路下行带宽（单位Mbps）",
					"type": "integer",
					"example": 100,
					"default": 1000,
					"maximum": 1000000,
					"minimum": 1
				},
				"downstream_busy_percent": {
					"description": "可选参数；WAN链路下行带宽繁忙比例，默认值80（含义为下行带宽的80%）",
					"type": "integer",
					"default": 80,
					"example": 80,
					"maximum": 100,
					"minimum": 1
				},
				"gateway_arp_detect": {
					"description": "可选参数；网关ARP检查",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；网关ARP检查启/禁用开关（enable-启用/disable-禁用）",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"timeout": {
							"description": "可选参数；超时时间，默认值15",
							"type": "integer",
							"default": 15,
							"example": 15,
							"maximum": 255,
							"minimum": 1
						},
						"interval": {
							"description": "可选参数；检测间隔，默认值5",
							"type": "integer",
							"default": 5,
							"example": 5,
							"maximum": 255,
							"minimum": 1
						}
					}
				},
				"monitors": {
					"description": "可选参数；链路健康检查列表",
					"type": "array",
					"items": {
						"description": "必选参数；单个链路监视器配置",
						"type": "object",
						"required": [
							"monitor",
							"target_host"
						],
						"properties": {
							"monitor": {
								"description": "必选参数；引用的链路监视器名称",
								"type": "string",
								"example": "ping",
								"maxLength": 511,
								"minLength": 1
							},
							"target_host": {
								"description": "必选参数；检测目标主机",
								"type": "string",
								"example": "10.10.10.254",
								"maxLength": 255,
								"minLength": 1
							}
						}
					},
					"maxItems": 16
				},
				"cable_plugin_detect": {
					"description": "可选参数；插拔网线检测（enable-启用/disable-禁用），默认值disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"appgroup_failover": {
					"description": "是否启用应用组故障切换",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"failsafe": {
					"description": "可选参数；零流量监测，双机/集群模式下才可配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；启禁用开关（enable-启用/disable-禁用），默认值disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"timeout": {
							"description": "可选参数；零流量检测超时时间，默认值120",
							"type": "integer",
							"default": 120,
							"example": 120,
							"maximum": 3600,
							"minimum": 10
						},
						"action": {
							"description": "可选参数；监测到无流量时的动作（failover-故障并切换/reboot-重启设备/restart-service-重启服务），默认值failover",
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
				"dev_mgt": {
					"type": "object",
					"description": "wan口的设备管理",
					"properties": {
						"report_console": {
							"type": "object",
							"description": "报表中心",
							"properties": {
								"whitelist_address": {
									"description": "白名单地址",
									"properties": {
										"ref_custom_address_group": {
											"description": "用户地址集",
											"example": "{custom_address_group}",
											"type": "string",
											"default": ""
										},
										"type": {
											"default": "ALL",
											"description": "地址类型",
											"enum": [
												"ALL",
												"GLOBAL-WHITELIST",
												"CUSTOM-ADDRESS-GROUP"
											],
											"example": "ALL",
											"type": "string"
										}
									},
									"required": [
										"type"
									],
									"type": "object"
								},
								"whitelist_switch": {
									"default": "GLOBAL",
									"description": "白名单的开关",
									"enum": [
										"ENABLE",
										"DISABLE",
										"GLOBAL"
									],
									"type": "string"
								}
							}
						},
						"snmp_svc": {
							"description": "SNMP服务",
							"type": "object",
							"properties": {
								"whitelist_address": {
									"description": "白名单地址",
									"properties": {
										"ref_custom_address_group": {
											"description": "用户地址集",
											"example": "{custom_address_group}",
											"type": "string",
											"default": ""
										},
										"type": {
											"default": "ALL",
											"description": "地址类型",
											"enum": [
												"ALL",
												"GLOBAL-WHITELIST",
												"CUSTOM-ADDRESS-GROUP"
											],
											"example": "ALL",
											"type": "string"
										}
									},
									"required": [
										"type"
									],
									"type": "object"
								},
								"whitelist_switch": {
									"default": "GLOBAL",
									"description": "白名单的开关",
									"enum": [
										"ENABLE",
										"DISABLE",
										"GLOBAL"
									],
									"type": "string"
								}
							}
						},
						"ssh_console": {
							"description": "SSH维护",
							"type": "object",
							"properties": {
								"whitelist_address": {
									"description": "白名单地址",
									"properties": {
										"ref_custom_address_group": {
											"description": "用户地址集",
											"example": "{custom_address_group}",
											"type": "string",
											"default": ""
										},
										"type": {
											"default": "ALL",
											"description": "地址类型",
											"enum": [
												"ALL",
												"GLOBAL-WHITELIST",
												"CUSTOM-ADDRESS-GROUP"
											],
											"example": "ALL",
											"type": "string"
										}
									},
									"required": [
										"type"
									],
									"type": "object"
								},
								"whitelist_switch": {
									"default": "GLOBAL",
									"description": "白名单的开关",
									"enum": [
										"ENABLE",
										"DISABLE",
										"GLOBAL"
									],
									"type": "string"
								}
							}
						},
						"troubleshooting_port": {
							"description": "SSH命令行",
							"type": "object",
							"properties": {
								"whitelist_address": {
									"description": "白名单地址",
									"properties": {
										"ref_custom_address_group": {
											"description": "用户地址集",
											"example": "{custom_address_group}",
											"type": "string",
											"default": ""
										},
										"type": {
											"default": "ALL",
											"description": "地址类型",
											"enum": [
												"ALL",
												"GLOBAL-WHITELIST",
												"CUSTOM-ADDRESS-GROUP"
											],
											"example": "ALL",
											"type": "string"
										}
									},
									"required": [
										"type"
									],
									"type": "object"
								},
								"whitelist_switch": {
									"default": "GLOBAL",
									"description": "白名单的开关",
									"enum": [
										"ENABLE",
										"DISABLE",
										"GLOBAL"
									],
									"type": "string"
								}
							}
						},
						"web_console": {
							"description": "web控制台白名单",
							"type": "object",
							"properties": {
								"whitelist_address": {
									"description": "白名单地址",
									"properties": {
										"ref_custom_address_group": {
											"description": "用户地址集",
											"example": "{custom_address_group}",
											"type": "string",
											"default": ""
										},
										"type": {
											"default": "ALL",
											"description": "地址类型",
											"enum": [
												"ALL",
												"GLOBAL-WHITELIST",
												"CUSTOM-ADDRESS-GROUP"
											],
											"example": "ALL",
											"type": "string"
										}
									},
									"required": [
										"type"
									],
									"type": "object"
								},
								"whitelist_switch": {
									"default": "GLOBAL",
									"description": "白名单的开关",
									"enum": [
										"ENABLE",
										"DISABLE",
										"GLOBAL"
									],
									"type": "string"
								}
							}
						}
					}
				}
			}
		}
	}
}