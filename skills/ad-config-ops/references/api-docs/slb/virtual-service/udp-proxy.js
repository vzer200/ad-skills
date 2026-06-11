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
				},
				"x-examples": {
					"request": {
						"summary": "get all virtual service",
						"description": "查看当前已有的虚拟服务配置信息\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/virtual-service/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/virtual-service/ 响应",
						"description": "返回GET /api/ad/v3/slb/virtual-service/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 1000,
							"items": [
								{
									"name": "vs_udp_proxy_53",
									"description": "example_string",
									"icon": "DEFAULT",
									"state": "ENABLE",
									"service": "UDP-PROXY",
									"vips": [
										"10.0.1.83"
									],
									"vports": [
										"53"
									],
									"service_chain": "service_chain1",
									"pool": "udp_proxy_pool",
									"pre_rules": [
										"udp_rule1"
									],
									"udp_profile": "Default_UDP_L7",
									"ipros": [],
									"qos_profile": "",
									"connection_limits_type": "SINGLE-SOURCE-IP",
									"connection_limits": [
										{
											"source_address": {
												"type": "ALL"
											},
											"connection_limit": 500,
											"connection_rate_limit": 100
										}
									],
									"snat": "AUTO-MAP",
									"snat_pool": "snat_pool1",
									"source_port": "PRESERVE",
									"session_sync": "GLOBAL",
									"autolasthop": "GLOBAL",
									"notify_status_to_vip": "ENABLE",
									"inbound_links": [
										"WAN_1"
									],
									"dnat": "ENABLE",
									"dnat_translated_address": "192.168.1.100",
									"dnat_translated_port": 0,
									"dport_trans": "ENABLE",
									"up_throughput_limit": 0,
									"down_throughput_limit": 0
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"virtual service"
				],
				"summary": "create new UDP-PROXY virtual service",
				"description": "新建一个UDP-PROXY虚拟服务配置",
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
				},
				"x-examples": {
					"request": {
						"summary": "create new UDP-PROXY virtual service",
						"description": "新建一个UDP-PROXY虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/virtual-service/",
							"body": {
								"name": "AI_vs_udp_proxy_53_A",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "UDP-PROXY",
								"vips": [
									"10.0.1.83"
								],
								"pool": "udp_proxy_pool",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"snat": "AUTO-MAP",
								"source_port": "PRESERVE",
								"session_sync": "GLOBAL",
								"autolasthop": "GLOBAL",
								"notify_status_to_vip": "ENABLE",
								"dnat": "ENABLE",
								"dnat_translated_port": 0,
								"dport_trans": "ENABLE",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"vports": [
									"55"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/virtual-service/ 响应",
						"description": "返回POST /api/ad/v3/slb/virtual-service/的响应数据",
						"value": {
							"name": "AI_vs_udp_proxy_53_A",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "UDP-PROXY",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"53"
							],
							"service_chain": "service_chain1",
							"pool": "udp_proxy_pool",
							"pre_rules": [
								"udp_rule1"
							],
							"udp_profile": "Default_UDP_L7",
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 500,
									"connection_rate_limit": 100
								}
							],
							"snat": "AUTO-MAP",
							"snat_pool": "snat_pool1",
							"source_port": "PRESERVE",
							"session_sync": "GLOBAL",
							"autolasthop": "GLOBAL",
							"notify_status_to_vip": "ENABLE",
							"inbound_links": [
								"WAN_1"
							],
							"dnat": "ENABLE",
							"dnat_translated_address": "192.168.1.100",
							"dnat_translated_port": 0,
							"dport_trans": "ENABLE",
							"up_throughput_limit": 0,
							"down_throughput_limit": 0
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/virtual-service/{name}": {
			"description": "新建、查看、修改、删除指定的虚拟服务配置",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				},
				{
					"name": "name",
					"description": "指定虚拟服务名称",
					"type": "string",
					"required": true,
					"in": "path"
				}
			],
			"get": {
				"tags": [
					"virtual service"
				],
				"summary": "get specific virtual service",
				"description": "查看指定的虚拟服务配置",
				"operationId": "get_virtual_service",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual service",
						"description": "查看指定的虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/virtual-service/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "vs_udp_proxy_53",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "UDP-PROXY",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"53"
							],
							"service_chain": "service_chain1",
							"pool": "udp_proxy_pool",
							"pre_rules": [
								"udp_rule1"
							],
							"udp_profile": "Default_UDP_L7",
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 500,
									"connection_rate_limit": 100
								}
							],
							"snat": "AUTO-MAP",
							"snat_pool": "snat_pool1",
							"source_port": "PRESERVE",
							"session_sync": "GLOBAL",
							"autolasthop": "GLOBAL",
							"notify_status_to_vip": "ENABLE",
							"inbound_links": [
								"WAN_1"
							],
							"dnat": "ENABLE",
							"dnat_translated_address": "192.168.1.100",
							"dnat_translated_port": 0,
							"dport_trans": "ENABLE",
							"up_throughput_limit": 0,
							"down_throughput_limit": 0
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"virtual service"
				],
				"summary": "create new UDP-PROXY virtual service",
				"description": "新建指定的UDP-PROXY虚拟服务配置",
				"operationId": "create_virtual_service",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-SERVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new UDP-PROXY virtual service",
						"description": "新建指定的UDP-PROXY虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/virtual-service/{name}",
							"body": {
								"name": "AI_vs_udp_proxy_53_B",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "UDP-PROXY",
								"vips": [
									"10.0.1.83"
								],
								"pool": "udp_proxy_pool",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"snat": "AUTO-MAP",
								"source_port": "PRESERVE",
								"session_sync": "GLOBAL",
								"autolasthop": "GLOBAL",
								"notify_status_to_vip": "ENABLE",
								"dnat": "ENABLE",
								"dnat_translated_port": 0,
								"dport_trans": "ENABLE",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"vports": [
									"55"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "AI_vs_udp_proxy_53_B",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "UDP-PROXY",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"53"
							],
							"service_chain": "service_chain1",
							"pool": "udp_proxy_pool",
							"pre_rules": [
								"udp_rule1"
							],
							"udp_profile": "Default_UDP_L7",
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 500,
									"connection_rate_limit": 100
								}
							],
							"snat": "AUTO-MAP",
							"snat_pool": "snat_pool1",
							"source_port": "PRESERVE",
							"session_sync": "GLOBAL",
							"autolasthop": "GLOBAL",
							"notify_status_to_vip": "ENABLE",
							"inbound_links": [
								"WAN_1"
							],
							"dnat": "ENABLE",
							"dnat_translated_address": "192.168.1.100",
							"dnat_translated_port": 0,
							"dport_trans": "ENABLE",
							"up_throughput_limit": 0,
							"down_throughput_limit": 0
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "replace specific virtual service",
						"description": "修改指定的虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/virtual-service/{name}",
							"body": {
								"name": "vs_udp_proxy_53",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "UDP-PROXY",
								"vips": [
									"10.0.1.83"
								],
								"pool": "udp_proxy_pool",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"snat": "AUTO-MAP",
								"source_port": "PRESERVE",
								"session_sync": "GLOBAL",
								"autolasthop": "GLOBAL",
								"notify_status_to_vip": "ENABLE",
								"dnat": "ENABLE",
								"dnat_translated_port": 0,
								"dport_trans": "ENABLE",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"vports": [
									"55"
								]
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "vs_udp_proxy_53",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "UDP-PROXY",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"53"
							],
							"service_chain": "service_chain1",
							"pool": "udp_proxy_pool",
							"pre_rules": [
								"udp_rule1"
							],
							"udp_profile": "Default_UDP_L7",
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 500,
									"connection_rate_limit": 100
								}
							],
							"snat": "AUTO-MAP",
							"snat_pool": "snat_pool1",
							"source_port": "PRESERVE",
							"session_sync": "GLOBAL",
							"autolasthop": "GLOBAL",
							"notify_status_to_vip": "ENABLE",
							"inbound_links": [
								"WAN_1"
							],
							"dnat": "ENABLE",
							"dnat_translated_address": "192.168.1.100",
							"dnat_translated_port": 0,
							"dport_trans": "ENABLE",
							"up_throughput_limit": 0,
							"down_throughput_limit": 0
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "modify specific virtual service",
						"description": "修改指定的虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/virtual-service/{name}",
							"body": {
								"name": "vs_udp_proxy_53",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "UDP-PROXY",
								"vips": [
									"10.0.1.83"
								],
								"pool": "udp_proxy_pool",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"snat": "AUTO-MAP",
								"source_port": "PRESERVE",
								"session_sync": "GLOBAL",
								"autolasthop": "GLOBAL",
								"notify_status_to_vip": "ENABLE",
								"dnat": "ENABLE",
								"dnat_translated_port": 0,
								"dport_trans": "ENABLE",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"vports": [
									"55"
								]
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "vs_udp_proxy_53",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "UDP-PROXY",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"53"
							],
							"service_chain": "service_chain1",
							"pool": "udp_proxy_pool",
							"pre_rules": [
								"udp_rule1"
							],
							"udp_profile": "Default_UDP_L7",
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 500,
									"connection_rate_limit": 100
								}
							],
							"snat": "AUTO-MAP",
							"snat_pool": "snat_pool1",
							"source_port": "PRESERVE",
							"session_sync": "GLOBAL",
							"autolasthop": "GLOBAL",
							"notify_status_to_vip": "ENABLE",
							"inbound_links": [
								"WAN_1"
							],
							"dnat": "ENABLE",
							"dnat_translated_address": "192.168.1.100",
							"dnat_translated_port": 0,
							"dport_trans": "ENABLE",
							"up_throughput_limit": 0,
							"down_throughput_limit": 0
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "delete specific virtual service",
						"description": "删除指定的虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/virtual-service/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "vs_udp_proxy_53",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "UDP-PROXY",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"53"
							],
							"service_chain": "service_chain1",
							"pool": "udp_proxy_pool",
							"pre_rules": [
								"udp_rule1"
							],
							"udp_profile": "Default_UDP_L7",
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 500,
									"connection_rate_limit": 100
								}
							],
							"snat": "AUTO-MAP",
							"snat_pool": "snat_pool1",
							"source_port": "PRESERVE",
							"session_sync": "GLOBAL",
							"autolasthop": "GLOBAL",
							"notify_status_to_vip": "ENABLE",
							"inbound_links": [
								"WAN_1"
							],
							"dnat": "ENABLE",
							"dnat_translated_address": "192.168.1.100",
							"dnat_translated_port": 0,
							"dport_trans": "ENABLE",
							"up_throughput_limit": 0,
							"down_throughput_limit": 0
						}
					}
				}
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
	"parameters": {
		"VIRTUAL-SERVICE-CONFIG": {
			"name": "VIRTUAL-SERVICE-CONFIG",
			"in": "body",
			"required": true,
			"description": "UDP-PROXY虚拟服务配置",
			"schema": {
				"$ref": "#/definitions/config.virtual_service"
			}
		},
		"VIRTUAL-SERVICE-PROPERTY": {
			"name": "VIRTUAL-SERVICE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "UDP-PROXY虚拟服务配置属性",
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
					"example": 1000
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
					"example": "vs_udp_proxy_53"
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
						"ICON20"
					],
					"default": "DEFAULT",
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
					"type": "string",
					"enum": [
						"UDP-PROXY"
					],
					"example": "UDP-PROXY",
					"default": "UDP-PROXY"
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
						"description": "指定虚拟服务对外发布的端口信息。",
						"type": "string"
					},
					"maxItems": 16,
					"minItems": 1,
					"example": [
						53,
						"5353"
					]
				},
				"service_chain": {
					"description": "指定虚拟服务关联的安全服务链。",
					"type": "string",
					"example": "service_chain1"
				},
				"pool": {
					"description": "指定虚拟服务调度的默认节点池。",
					"type": "string",
					"example": "udp_proxy_pool"
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
						"udp_rule1",
						"udp_rule2"
					]
				},
				"udp_profile": {
					"description": "UDP配置文件",
					"type": "string",
					"example": "Default_UDP_L7"
				},
				"ipros": {
					"description": "指定引用的入侵防御配置文件",
					"type": "array",
					"items": {
						"type": "string"
					},
					"maxItems": 16,
					"example": [
						"{ipro}"
					]
				},
				"qos_profile": {
					"description": "QoS配置文件",
					"type": "string",
					"example": "{qos-profile}"
				},
				"connection_limits_type": {
					"description": "指定连接限制的类型",
					"type": "string",
					"enum": [
						"SINGLE-SOURCE-IP",
						"SUBNET",
						"TOTAL"
					],
					"default": "SINGLE-SOURCE-IP",
					"example": "SINGLE-SOURCE-IP"
				},
				"connection_limits": {
					"description": "指定连接限制参数",
					"type": "array",
					"items": {
						"type": "object",
						"required": [
							"source_address",
							"connection_limit"
						],
						"properties": {
							"source_address": {
								"description": "连接限制的源地址",
								"type": "object",
								"required": [
									"type"
								],
								"properties": {
									"type": {
										"description": "源地址类型",
										"type": "string",
										"enum": [
											"ALL",
											"IP-ADDRESS",
											"CUSTOM-ADDRESS-GROUP",
											"ISP-ADDRESS-GROUP"
										],
										"default": "ALL",
										"example": "ALL"
									},
									"address": {
										"description": "源地址类型为ip-address时，指定具体的地址或地址范围或子网。",
										"type": "string",
										"example": "192.168.1.1/24"
									},
									"ref_custom_address_group": {
										"description": "源地址类型为custom-address-group时，指定具体的用户地址集。",
										"type": "string",
										"example": "{custom_address_group}"
									},
									"ref_isp_address_group": {
										"description": "源地址类型为isp_address_group时，指定具体的isp地址段。",
										"type": "string",
										"example": "{isp_address_group}"
									}
								}
							},
							"connection_limit": {
								"description": "连接限制数",
								"type": "integer",
								"maximum": 4294967295,
								"minimum": 0,
								"example": 500
							},
							"connection_rate_limit": {
								"description": "连接速率限制数",
								"type": "integer",
								"maximum": 4294967295,
								"minimum": 0,
								"example": 100
							}
						}
					},
					"maxItems": 10,
					"example": [
						{
							"source_address": {
								"type": "ALL"
							},
							"connection_limit": 500,
							"connection_rate_limit": 100
						}
					]
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
					"default": "AUTO-MAP",
					"example": "AUTO-MAP"
				},
				"snat_pool": {
					"description": "指定snat转后的地址集合,当参数snat指定为snat-pool时, 该参数必选。",
					"type": "string",
					"example": "snat_pool1"
				},
				"source_port": {
					"description": "指定源端口转换策略;preserve表示尝试保持源端口,preserve-strict表示严格保持源端口,change表示改变源端口,默认为change",
					"type": "string",
					"enum": [
						"PRESERVE",
						"PRESERVE-STRICT",
						"CHANGE"
					],
					"default": "PRESERVE",
					"example": "PRESERVE"
				},
				"session_sync": {
					"description": "连接镜像",
					"type": "string",
					"enum": [
						"GLOBAL",
						"ENABLE",
						"DISABLE"
					],
					"default": "GLOBAL",
					"example": "GLOBAL"
				},
				"autolasthop": {
					"description": "对称路由",
					"type": "string",
					"enum": [
						"GLOBAL",
						"ENABLE",
						"DISABLE"
					],
					"default": "GLOBAL",
					"example": "GLOBAL"
				},
				"notify_status_to_vip": {
					"description": "vs状态是否通知vip",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
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
				"dnat": {
					"description": "用来指定虚拟服务是否做目的IP转换, 默认启用;disable表示禁用;enable表示启用;specify表示指定IP端口。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"SPECIFY"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"dnat_translated_address": {
					"description": "指定的DNAT地址",
					"type": "string",
					"example": "192.168.1.100"
				},
				"dnat_translated_port": {
					"description": "指定的DNAT端口",
					"type": "integer",
					"maximum": 65535,
					"minimum": 0,
					"default": 0,
					"example": 0
				},
				"dport_trans": {
					"description": "用来指定虚拟服务是否做目的端口转换, 默认启用;disable表示禁用;enable表示启用。",
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
		}
	}
}