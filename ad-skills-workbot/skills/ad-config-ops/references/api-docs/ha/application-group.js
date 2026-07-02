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
		"/api/ad/v3/ha/application-group/": {
			"description": "应用组管理配置相关操作",
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
					"application-group"
				],
				"summary": "get all application-group",
				"description": "获取应用组管理配置",
				"operationId": "get_application_group_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/project"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all application-group",
						"description": "获取应用组管理配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/ha/application-group/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/ha/application-group/ 响应",
						"description": "返回GET /api/ad/v3/ha/application-group/的响应数据",
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
									"name": "default",
									"project": "myproject",
									"description": "example_string",
									"all_active_mode": "DISABLE",
									"session_synchronize": "ENABLE",
									"connection_state_synchronize": "DISABLE",
									"associated": {
										"virtual_services": [
											"virtual_service_1"
										],
										"arp_combinations": [
											"arp_application_group_1"
										],
										"snat_combinations": [
											"nat_group_1"
										],
										"dnats": [
											"dnat_1"
										],
										"float_ips": [
											"200.200.1.149"
										],
										"snat_pools": [
											"snat_pool_1"
										]
									},
									"member": {
										"member_structure": "MEMBER-SEQUENCE",
										"member_sequence": [
											"ad_2"
										],
										"member_group": [
											{
												"name": "dc_bj_member_group",
												"member_sequence": [
													"ad_1",
													"ad_3",
													"ad_2"
												]
											}
										]
									},
									"select_method": "BY-PRIORITY",
									"preempt_mode": "DISABLE",
									"fault_detect": {
										"state": "DISABLE",
										"method": "FAULT-REQUIREMENT",
										"fault_requirement": {
											"objects": [
												"POOL:pool_mail"
											],
											"fault_object_count": 0
										},
										"fault_rules": [
											[
												"LINK:lan_1"
											]
										]
									},
									"virtual_macs": [
										{
											"link": "LAN_1",
											"mac": "00:22:22:22:22:22"
										}
									],
									"default": "NON-DEFAULT"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"application-group"
				],
				"summary": "create new application-group",
				"description": "新建应用组管理配置",
				"operationId": "add_application_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/APPLICATION-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new application-group",
						"description": "新建应用组管理配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/ha/application-group/",
							"body": {
								"name": "AI_default_A",
								"all_active_mode": "DISABLE",
								"session_synchronize": "ENABLE",
								"connection_state_synchronize": "DISABLE",
								"select_method": "BY-PRIORITY",
								"preempt_mode": "DISABLE",
								"default": "NON-DEFAULT"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/ha/application-group/ 响应",
						"description": "返回POST /api/ad/v3/ha/application-group/的响应数据",
						"value": {
							"name": "AI_default_A",
							"project": "myproject",
							"description": "example_string",
							"all_active_mode": "DISABLE",
							"session_synchronize": "ENABLE",
							"connection_state_synchronize": "DISABLE",
							"associated": {
								"virtual_services": [
									"virtual_service_1"
								],
								"arp_combinations": [
									"arp_application_group_1"
								],
								"snat_combinations": [
									"nat_group_1"
								],
								"dnats": [
									"dnat_1"
								],
								"float_ips": [
									"200.200.1.149"
								],
								"snat_pools": [
									"snat_pool_1"
								]
							},
							"member": {
								"member_structure": "MEMBER-SEQUENCE",
								"member_sequence": [
									"ad_2"
								],
								"member_group": [
									{
										"name": "dc_bj_member_group",
										"member_sequence": [
											"ad_1",
											"ad_3",
											"ad_2"
										]
									}
								]
							},
							"select_method": "BY-PRIORITY",
							"preempt_mode": "DISABLE",
							"fault_detect": {
								"state": "DISABLE",
								"method": "FAULT-REQUIREMENT",
								"fault_requirement": {
									"objects": [
										"POOL:pool_mail"
									],
									"fault_object_count": 0
								},
								"fault_rules": [
									[
										"LINK:lan_1"
									]
								]
							},
							"virtual_macs": [
								{
									"link": "LAN_1",
									"mac": "00:22:22:22:22:22"
								}
							],
							"default": "NON-DEFAULT"
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"application-group"
				],
				"summary": "modify application-group",
				"description": "修改应用组管理配置",
				"operationId": "edit_application_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/APPLICATION-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify application-group",
						"description": "修改应用组管理配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/ha/application-group/",
							"body": {
								"name": "default",
								"all_active_mode": "DISABLE",
								"session_synchronize": "ENABLE",
								"connection_state_synchronize": "DISABLE",
								"select_method": "BY-PRIORITY",
								"preempt_mode": "DISABLE",
								"default": "NON-DEFAULT"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/ha/application-group/ 响应",
						"description": "返回PATCH /api/ad/v3/ha/application-group/的响应数据",
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
									"name": "default",
									"project": "myproject",
									"description": "example_string",
									"all_active_mode": "DISABLE",
									"session_synchronize": "ENABLE",
									"connection_state_synchronize": "DISABLE",
									"associated": {
										"virtual_services": [
											"virtual_service_1"
										],
										"arp_combinations": [
											"arp_application_group_1"
										],
										"snat_combinations": [
											"nat_group_1"
										],
										"dnats": [
											"dnat_1"
										],
										"float_ips": [
											"200.200.1.149"
										],
										"snat_pools": [
											"snat_pool_1"
										]
									},
									"member": {
										"member_structure": "MEMBER-SEQUENCE",
										"member_sequence": [
											"ad_2"
										],
										"member_group": [
											{
												"name": "dc_bj_member_group",
												"member_sequence": [
													"ad_1",
													"ad_3",
													"ad_2"
												]
											}
										]
									},
									"select_method": "BY-PRIORITY",
									"preempt_mode": "DISABLE",
									"fault_detect": {
										"state": "DISABLE",
										"method": "FAULT-REQUIREMENT",
										"fault_requirement": {
											"objects": [
												"POOL:pool_mail"
											],
											"fault_object_count": 0
										},
										"fault_rules": [
											[
												"LINK:lan_1"
											]
										]
									},
									"virtual_macs": [
										{
											"link": "LAN_1",
											"mac": "00:22:22:22:22:22"
										}
									],
									"default": "NON-DEFAULT"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/ha/application-group/{name}": {
			"description": "应用组管理配置相关操作",
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
				}
			],
			"get": {
				"tags": [
					"application-group"
				],
				"summary": "get specific application-group",
				"description": "获取应用组管理配置",
				"operationId": "get_application_group",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/project"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific application-group",
						"description": "获取应用组管理配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/ha/application-group/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/ha/application-group/{name} 响应",
						"description": "返回GET /api/ad/v3/ha/application-group/{name}的响应数据",
						"value": {
							"name": "default",
							"project": "myproject",
							"description": "example_string",
							"all_active_mode": "DISABLE",
							"session_synchronize": "ENABLE",
							"connection_state_synchronize": "DISABLE",
							"associated": {
								"virtual_services": [
									"virtual_service_1"
								],
								"arp_combinations": [
									"arp_application_group_1"
								],
								"snat_combinations": [
									"nat_group_1"
								],
								"dnats": [
									"dnat_1"
								],
								"float_ips": [
									"200.200.1.149"
								],
								"snat_pools": [
									"snat_pool_1"
								]
							},
							"member": {
								"member_structure": "MEMBER-SEQUENCE",
								"member_sequence": [
									"ad_2"
								],
								"member_group": [
									{
										"name": "dc_bj_member_group",
										"member_sequence": [
											"ad_1",
											"ad_3",
											"ad_2"
										]
									}
								]
							},
							"select_method": "BY-PRIORITY",
							"preempt_mode": "DISABLE",
							"fault_detect": {
								"state": "DISABLE",
								"method": "FAULT-REQUIREMENT",
								"fault_requirement": {
									"objects": [
										"POOL:pool_mail"
									],
									"fault_object_count": 0
								},
								"fault_rules": [
									[
										"LINK:lan_1"
									]
								]
							},
							"virtual_macs": [
								{
									"link": "LAN_1",
									"mac": "00:22:22:22:22:22"
								}
							],
							"default": "NON-DEFAULT"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"application-group"
				],
				"summary": "create new application-group",
				"description": "新建应用组管理配置",
				"operationId": "create_application_group",
				"parameters": [
					{
						"$ref": "#/parameters/APPLICATION-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new application-group",
						"description": "新建应用组管理配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/ha/application-group/{name}",
							"body": {
								"name": "AI_default_B",
								"all_active_mode": "DISABLE",
								"session_synchronize": "ENABLE",
								"connection_state_synchronize": "DISABLE",
								"select_method": "BY-PRIORITY",
								"preempt_mode": "DISABLE",
								"default": "NON-DEFAULT"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/ha/application-group/{name} 响应",
						"description": "返回POST /api/ad/v3/ha/application-group/{name}的响应数据",
						"value": {
							"name": "AI_default_B",
							"project": "myproject",
							"description": "example_string",
							"all_active_mode": "DISABLE",
							"session_synchronize": "ENABLE",
							"connection_state_synchronize": "DISABLE",
							"associated": {
								"virtual_services": [
									"virtual_service_1"
								],
								"arp_combinations": [
									"arp_application_group_1"
								],
								"snat_combinations": [
									"nat_group_1"
								],
								"dnats": [
									"dnat_1"
								],
								"float_ips": [
									"200.200.1.149"
								],
								"snat_pools": [
									"snat_pool_1"
								]
							},
							"member": {
								"member_structure": "MEMBER-SEQUENCE",
								"member_sequence": [
									"ad_2"
								],
								"member_group": [
									{
										"name": "dc_bj_member_group",
										"member_sequence": [
											"ad_1",
											"ad_3",
											"ad_2"
										]
									}
								]
							},
							"select_method": "BY-PRIORITY",
							"preempt_mode": "DISABLE",
							"fault_detect": {
								"state": "DISABLE",
								"method": "FAULT-REQUIREMENT",
								"fault_requirement": {
									"objects": [
										"POOL:pool_mail"
									],
									"fault_object_count": 0
								},
								"fault_rules": [
									[
										"LINK:lan_1"
									]
								]
							},
							"virtual_macs": [
								{
									"link": "LAN_1",
									"mac": "00:22:22:22:22:22"
								}
							],
							"default": "NON-DEFAULT"
						}
					}
				}
			},
			"put": {
				"tags": [
					"application-group"
				],
				"summary": "replace specific application-group",
				"description": "修改应用组管理配置",
				"operationId": "replace_application_group",
				"parameters": [
					{
						"$ref": "#/parameters/APPLICATION-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific application-group",
						"description": "修改应用组管理配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/ha/application-group/{name}",
							"body": {
								"name": "default",
								"all_active_mode": "DISABLE",
								"session_synchronize": "ENABLE",
								"connection_state_synchronize": "DISABLE",
								"select_method": "BY-PRIORITY",
								"preempt_mode": "DISABLE",
								"default": "NON-DEFAULT"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/ha/application-group/{name} 响应",
						"description": "返回PUT /api/ad/v3/ha/application-group/{name}的响应数据",
						"value": {
							"name": "default",
							"project": "myproject",
							"description": "example_string",
							"all_active_mode": "DISABLE",
							"session_synchronize": "ENABLE",
							"connection_state_synchronize": "DISABLE",
							"associated": {
								"virtual_services": [
									"virtual_service_1"
								],
								"arp_combinations": [
									"arp_application_group_1"
								],
								"snat_combinations": [
									"nat_group_1"
								],
								"dnats": [
									"dnat_1"
								],
								"float_ips": [
									"200.200.1.149"
								],
								"snat_pools": [
									"snat_pool_1"
								]
							},
							"member": {
								"member_structure": "MEMBER-SEQUENCE",
								"member_sequence": [
									"ad_2"
								],
								"member_group": [
									{
										"name": "dc_bj_member_group",
										"member_sequence": [
											"ad_1",
											"ad_3",
											"ad_2"
										]
									}
								]
							},
							"select_method": "BY-PRIORITY",
							"preempt_mode": "DISABLE",
							"fault_detect": {
								"state": "DISABLE",
								"method": "FAULT-REQUIREMENT",
								"fault_requirement": {
									"objects": [
										"POOL:pool_mail"
									],
									"fault_object_count": 0
								},
								"fault_rules": [
									[
										"LINK:lan_1"
									]
								]
							},
							"virtual_macs": [
								{
									"link": "LAN_1",
									"mac": "00:22:22:22:22:22"
								}
							],
							"default": "NON-DEFAULT"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"application-group"
				],
				"summary": "modify specific application-group",
				"description": "修改应用组管理配置",
				"operationId": "edit_application_group",
				"parameters": [
					{
						"$ref": "#/parameters/APPLICATION-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific application-group",
						"description": "修改应用组管理配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/ha/application-group/{name}",
							"body": {
								"name": "default",
								"all_active_mode": "DISABLE",
								"session_synchronize": "ENABLE",
								"connection_state_synchronize": "DISABLE",
								"select_method": "BY-PRIORITY",
								"preempt_mode": "DISABLE",
								"default": "NON-DEFAULT"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/ha/application-group/{name} 响应",
						"description": "返回PATCH /api/ad/v3/ha/application-group/{name}的响应数据",
						"value": {
							"name": "default",
							"project": "myproject",
							"description": "example_string",
							"all_active_mode": "DISABLE",
							"session_synchronize": "ENABLE",
							"connection_state_synchronize": "DISABLE",
							"associated": {
								"virtual_services": [
									"virtual_service_1"
								],
								"arp_combinations": [
									"arp_application_group_1"
								],
								"snat_combinations": [
									"nat_group_1"
								],
								"dnats": [
									"dnat_1"
								],
								"float_ips": [
									"200.200.1.149"
								],
								"snat_pools": [
									"snat_pool_1"
								]
							},
							"member": {
								"member_structure": "MEMBER-SEQUENCE",
								"member_sequence": [
									"ad_2"
								],
								"member_group": [
									{
										"name": "dc_bj_member_group",
										"member_sequence": [
											"ad_1",
											"ad_3",
											"ad_2"
										]
									}
								]
							},
							"select_method": "BY-PRIORITY",
							"preempt_mode": "DISABLE",
							"fault_detect": {
								"state": "DISABLE",
								"method": "FAULT-REQUIREMENT",
								"fault_requirement": {
									"objects": [
										"POOL:pool_mail"
									],
									"fault_object_count": 0
								},
								"fault_rules": [
									[
										"LINK:lan_1"
									]
								]
							},
							"virtual_macs": [
								{
									"link": "LAN_1",
									"mac": "00:22:22:22:22:22"
								}
							],
							"default": "NON-DEFAULT"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"application-group"
				],
				"summary": "delete specific application-group",
				"description": "删除应用组管理配置",
				"operationId": "delete_application_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_group_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific application-group",
						"description": "删除应用组管理配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/ha/application-group/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/ha/application-group/{name} 响应",
						"description": "返回DELETE /api/ad/v3/ha/application-group/{name}的响应数据",
						"value": {
							"name": "default",
							"project": "myproject",
							"description": "example_string",
							"all_active_mode": "DISABLE",
							"session_synchronize": "ENABLE",
							"connection_state_synchronize": "DISABLE",
							"associated": {
								"virtual_services": [
									"virtual_service_1"
								],
								"arp_combinations": [
									"arp_application_group_1"
								],
								"snat_combinations": [
									"nat_group_1"
								],
								"dnats": [
									"dnat_1"
								],
								"float_ips": [
									"200.200.1.149"
								],
								"snat_pools": [
									"snat_pool_1"
								]
							},
							"member": {
								"member_structure": "MEMBER-SEQUENCE",
								"member_sequence": [
									"ad_2"
								],
								"member_group": [
									{
										"name": "dc_bj_member_group",
										"member_sequence": [
											"ad_1",
											"ad_3",
											"ad_2"
										]
									}
								]
							},
							"select_method": "BY-PRIORITY",
							"preempt_mode": "DISABLE",
							"fault_detect": {
								"state": "DISABLE",
								"method": "FAULT-REQUIREMENT",
								"fault_requirement": {
									"objects": [
										"POOL:pool_mail"
									],
									"fault_object_count": 0
								},
								"fault_rules": [
									[
										"LINK:lan_1"
									]
								]
							},
							"virtual_macs": [
								{
									"link": "LAN_1",
									"mac": "00:22:22:22:22:22"
								}
							],
							"default": "NON-DEFAULT"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha application-group",
					"description": "获取全部应用组配置"
				},
				{
					"command": "list ha application-group Default",
					"description": "获取指定应用组Default配置"
				},
				{
					"command": "create ha application-group app1 session_synchronize enable associated { virtual_services [ 虚拟服务_1 ] snat_combinations [ 源地址转换关联组_1 ] float_ips [ 195.197.197.106 123.12.23.22 ] dnats [ dnat1 ] } member { member_structure member-sequence member_sequence [ dev_A ] } select_method by-priority preempt_mode enable fault_detect { state enable method fault-requirement fault_requirement { fault_object_count 2 objects [ LINK:LAN1 LINK:WAN1 POOL:pool-80 ] } } virtual_macs [ { link LAN1 mac da:ef:80:f3:b0:ab } { link WAN1 mac da:16:b8:75:18:60 } ]",
					"description": "创建名称为app1的应用组，开启连接镜像，选择关联内容：虚拟服务关联组_1、源地址转换关联组_1、dnat1，以及浮动IP 195.197.197.106、123.12.23.22，优先设备列表为dev_A，启用按设备优先级切换，并开启抢占功能，开启故障切换，故障切换方式选择为按数量切换，选择任意2条链路或节点池发生故障时切换，关注的链路节点池列表为：LAN1、WAN1、pool-80，开启虚拟MAC，为链路LAN1添加虚拟MAC da:ef:80:f3:b0:ab，为链路WAN1添加虚拟MAC da:16:b8:75:18:60"
				},
				{
					"command": "modify ha application-group app1 member { member_structure member-group member_group [ { name group1 member_sequence [ dev_A dev_B ] } { name group2 member_sequence [ dev_C dev_D ]  } ] }",
					"description": "修改应用组app1，启用按设备组切换，优先设备组列表为group1（组内设备顺序为dev_A、dev_B）、group2（组内设备顺序为dev_C、dev_D）"
				},
				{
					"command": "delete ha application-group app1",
					"description": "删除应用组app1"
				}
			]
		}
	},
	"parameters": {
		"APPLICATION-GROUP-CONFIG": {
			"name": "APPLICATION-GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.application_group"
			}
		},
		"APPLICATION-GROUP-PROPERTY": {
			"name": "APPLICATION-GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.application_group"
			}
		}
	},
	"responses": {
		"operation_config_application_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.application_group_list"
			}
		},
		"operation_config_application_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.application_group"
			}
		}
	},
	"definitions": {
		"config.application_group_list": {
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
						"$ref": "#/definitions/config.application_group"
					}
				}
			}
		},
		"config.application_group": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "指定应用组的名称，在应用组配置中必须唯一",
					"type": "string",
					"example": "default"
				},
				"project": {
					"type": "string",
					"example": "myproject",
					"description": "choose a project to belonging, create a new project if choose null",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"description": "可以对该应用组进行额外的信息补充",
					"type": "string"
				},
				"all_active_mode": {
					"description": "多主模式",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"session_synchronize": {
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
					"description": "全状态同步",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"associated": {
					"description": "关联信息（虚拟服务关联组、源地址转换关联组、DNAT、浮动IP等",
					"type": "object",
					"properties": {
						"virtual_services": {
							"description": "本应用组关联的虚拟服务列表",
							"type": "array",
							"items": {
								"description": "虚拟服务",
								"type": "string",
								"example": "virtual_service_1"
							}
						},
						"arp_combinations": {
							"description": "本应用组关联的ARP代理关联组列表",
							"type": "array",
							"items": {
								"description": "ARP代理关联组",
								"type": "string",
								"example": "arp_application_group_1"
							}
						},
						"snat_combinations": {
							"description": "本应用组关联的源地址转换关联组列表",
							"type": "array",
							"items": {
								"description": "源地址转换关联组列表",
								"type": "string",
								"example": "nat_group_1"
							}
						},
						"dnats": {
							"description": "本应用组关联的dnat列表",
							"type": "array",
							"items": {
								"description": "目的地址转换配置名",
								"type": "string",
								"example": "dnat_1"
							}
						},
						"float_ips": {
							"description": "本应用组关联的浮动IP列表",
							"type": "array",
							"items": {
								"description": "本应用组关联的浮动IP",
								"type": "string",
								"example": "200.200.1.149"
							}
						},
						"snat_pools": {
							"description": "本应用组关联的snat地址集列表",
							"type": "array",
							"items": {
								"description": "snat地址集名称",
								"type": "string",
								"example": "snat_pool_1"
							}
						}
					}
				},
				"member": {
					"description": "成员信息（优先级列表）",
					"type": "object",
					"properties": {
						"member_structure": {
							"description": "应用组的切换方式，member-sequence：按设备列表进行切换，member-group：按设备组进行切换",
							"type": "string",
							"enum": [
								"MEMBER-SEQUENCE",
								"MEMBER-GROUP"
							],
							"default": "MEMBER-SEQUENCE",
							"example": "MEMBER-GROUP"
						},
						"member_sequence": {
							"description": "按设备切换时的设备列表",
							"type": "array",
							"items": {
								"description": "优先设备列表",
								"type": "string",
								"example": "ad_1"
							},
							"example": [
								"ad_2",
								"ad_3",
								"ad_1"
							],
							"maxItems": 16
						},
						"member_group": {
							"description": "按设备组切换时的设备组列表",
							"type": "array",
							"items": {
								"description": "设备组名称列表",
								"type": "object",
								"required": [
									"name",
									"member_sequence"
								],
								"properties": {
									"name": {
										"description": "设备组名称",
										"type": "string"
									},
									"member_sequence": {
										"description": "设备组内成员列表",
										"type": "array",
										"items": {
											"description": "设备名称列表",
											"type": "string"
										},
										"maxItems": 16
									}
								}
							},
							"example": [
								{
									"name": "dc_bj_member_group",
									"member_sequence": [
										"ad_1",
										"ad_3",
										"ad_2"
									]
								},
								{
									"name": "dc_sz_member_group",
									"member_sequence": [
										"ad_8",
										"ad_6"
									]
								}
							],
							"maxItems": 16
						}
					}
				},
				"select_method": {
					"description": "列表切换方式，by-priority：按设备优先级切换，in-sequence：按顺序切换",
					"type": "string",
					"enum": [
						"IN-SEQUENCE",
						"BY-PRIORITY"
					],
					"default": "BY-PRIORITY",
					"example": "BY-PRIORITY"
				},
				"preempt_mode": {
					"description": "抢占模式，enable表示启用，disable表示禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
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
						"fault_requirement": {
							"description": "按故障数量切换条件",
							"type": "object",
							"properties": {
								"objects": {
									"description": "检测的链路和节点池列表",
									"type": "array",
									"items": {
										"type": "string",
										"description": "Format: '{POOL|LINK}:{ITEM}'",
										"example": "POOL:pool_mail"
									},
									"maxItems": 200
								},
								"fault_object_count": {
									"description": "引起切换的最少故障链路和节点池数量",
									"type": "integer",
									"default": 0,
									"example": 0,
									"maximum": 200,
									"minimum": 0
								}
							}
						},
						"fault_rules": {
							"description": "自定义切换规则",
							"type": "array",
							"items": {
								"description": "自定义切换规则列表，每一条规则满足条件时都会触发切换",
								"type": "array",
								"items": {
									"description": "Format: '{POOL|LINK}:{ITEM}'",
									"type": "string",
									"example": "LINK:lan_1"
								},
								"maxItems": 4096,
								"minItems": 1
							},
							"maxItems": 200
						}
					}
				},
				"virtual_macs": {
					"description": "虚拟MAC",
					"type": "array",
					"items": {
						"description": "本应用组的虚拟MAC列表",
						"type": "object",
						"required": [
							"link",
							"mac"
						],
						"properties": {
							"link": {
								"description": "其中一条虚拟MAC对应的链路",
								"type": "string",
								"example": "LAN_1"
							},
							"mac": {
								"description": "其中一条虚拟MAC对应的链路虚拟MAC",
								"type": "string",
								"example": "00:22:22:22:22:22"
							}
						}
					}
				},
				"default": {
					"type": "string",
					"description": "表示此应用组是否是默认应用组，若为Default应用组值为MODIFIABLE",
					"readOnly": true,
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				}
			}
		}
	}
}