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
									"name": "vs_https_443",
									"description": "example_string",
									"icon": "DEFAULT",
									"state": "ENABLE",
									"service": "SSL-OFFLOAD-HTTPS",
									"vips": [
										"10.0.1.83"
									],
									"vports": [
										"443"
									],
									"service_chain": "service_chain1",
									"pool": "https_pool",
									"pre_rules": [
										"https_rule1"
									],
									"http_sched_mode": "REQUEST",
									"http_profile": "",
									"ssl_client_profiles": [],
									"ssl_server_profiles": [],
									"https_redirect": {
										"state": "DISABLE",
										"http_port": 80
									},
									"ipros": [],
									"qos_profile": "",
									"connection_limits_type": "SINGLE-SOURCE-IP",
									"connection_limits": [
										{
											"source_address": {
												"type": "ALL"
											},
											"connection_limit": 2000,
											"connection_rate_limit": 200
										}
									],
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
				"summary": "create new HTTPS virtual service",
				"description": "新建一个HTTPS虚拟服务配置",
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
						"summary": "create new HTTPS virtual service",
						"description": "新建一个HTTPS虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/virtual-service/",
							"body": {
								"name": "AI_vs_https_443_A",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "SSL-OFFLOAD-HTTPS",
								"vips": [
									"10.0.1.83"
								],
								"pool": "https_pool",
								"http_sched_mode": "REQUEST",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"ssl_client_profiles": [
									"default_ssl_profile"
								],
								"vports": [
									"444"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/virtual-service/ 响应",
						"description": "返回POST /api/ad/v3/slb/virtual-service/的响应数据",
						"value": {
							"name": "AI_vs_https_443_A",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "SSL-OFFLOAD-HTTPS",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"443"
							],
							"service_chain": "service_chain1",
							"pool": "https_pool",
							"pre_rules": [
								"https_rule1"
							],
							"http_sched_mode": "REQUEST",
							"http_profile": "",
							"ssl_client_profiles": [],
							"ssl_server_profiles": [],
							"https_redirect": {
								"state": "DISABLE",
								"http_port": 80
							},
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 2000,
									"connection_rate_limit": 200
								}
							],
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
							"name": "vs_https_443",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "SSL-OFFLOAD-HTTPS",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"443"
							],
							"service_chain": "service_chain1",
							"pool": "https_pool",
							"pre_rules": [
								"https_rule1"
							],
							"http_sched_mode": "REQUEST",
							"http_profile": "",
							"ssl_client_profiles": [],
							"ssl_server_profiles": [],
							"https_redirect": {
								"state": "DISABLE",
								"http_port": 80
							},
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 2000,
									"connection_rate_limit": 200
								}
							],
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
				"summary": "create new HTTPS virtual service",
				"description": "查看指定的虚拟服务配置",
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
						"summary": "create new HTTPS virtual service",
						"description": "查看指定的虚拟服务配置\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/virtual-service/{name}",
							"body": {
								"name": "AI_vs_https_443_B",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "SSL-OFFLOAD-HTTPS",
								"vips": [
									"10.0.1.83"
								],
								"pool": "https_pool",
								"http_sched_mode": "REQUEST",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"ssl_client_profiles": [
									"default_ssl_profile"
								],
								"vports": [
									"444"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "AI_vs_https_443_B",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "SSL-OFFLOAD-HTTPS",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"443"
							],
							"service_chain": "service_chain1",
							"pool": "https_pool",
							"pre_rules": [
								"https_rule1"
							],
							"http_sched_mode": "REQUEST",
							"http_profile": "",
							"ssl_client_profiles": [],
							"ssl_server_profiles": [],
							"https_redirect": {
								"state": "DISABLE",
								"http_port": 80
							},
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 2000,
									"connection_rate_limit": 200
								}
							],
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
								"name": "vs_https_443",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "SSL-OFFLOAD-HTTPS",
								"vips": [
									"10.0.1.83"
								],
								"pool": "https_pool",
								"http_sched_mode": "REQUEST",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"ssl_client_profiles": [
									"default_ssl_profile"
								],
								"vports": [
									"444"
								]
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "vs_https_443",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "SSL-OFFLOAD-HTTPS",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"443"
							],
							"service_chain": "service_chain1",
							"pool": "https_pool",
							"pre_rules": [
								"https_rule1"
							],
							"http_sched_mode": "REQUEST",
							"http_profile": "",
							"ssl_client_profiles": [],
							"ssl_server_profiles": [],
							"https_redirect": {
								"state": "DISABLE",
								"http_port": 80
							},
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 2000,
									"connection_rate_limit": 200
								}
							],
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
								"name": "vs_https_443",
								"icon": "DEFAULT",
								"state": "ENABLE",
								"service": "SSL-OFFLOAD-HTTPS",
								"vips": [
									"10.0.1.83"
								],
								"pool": "https_pool",
								"http_sched_mode": "REQUEST",
								"connection_limits_type": "SINGLE-SOURCE-IP",
								"up_throughput_limit": 0,
								"down_throughput_limit": 0,
								"ssl_client_profiles": [
									"default_ssl_profile"
								],
								"vports": [
									"444"
								]
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/virtual-service/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "vs_https_443",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "SSL-OFFLOAD-HTTPS",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"443"
							],
							"service_chain": "service_chain1",
							"pool": "https_pool",
							"pre_rules": [
								"https_rule1"
							],
							"http_sched_mode": "REQUEST",
							"http_profile": "",
							"ssl_client_profiles": [],
							"ssl_server_profiles": [],
							"https_redirect": {
								"state": "DISABLE",
								"http_port": 80
							},
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 2000,
									"connection_rate_limit": 200
								}
							],
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
							"name": "vs_https_443",
							"description": "example_string",
							"icon": "DEFAULT",
							"state": "ENABLE",
							"service": "SSL-OFFLOAD-HTTPS",
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"443"
							],
							"service_chain": "service_chain1",
							"pool": "https_pool",
							"pre_rules": [
								"https_rule1"
							],
							"http_sched_mode": "REQUEST",
							"http_profile": "",
							"ssl_client_profiles": [],
							"ssl_server_profiles": [],
							"https_redirect": {
								"state": "DISABLE",
								"http_port": 80
							},
							"ipros": [],
							"qos_profile": "",
							"connection_limits_type": "SINGLE-SOURCE-IP",
							"connection_limits": [
								{
									"source_address": {
										"type": "ALL"
									},
									"connection_limit": 2000,
									"connection_rate_limit": 200
								}
							],
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
			"description": "HTTPS虚拟服务配置",
			"schema": {
				"$ref": "#/definitions/config.virtual_service"
			}
		},
		"VIRTUAL-SERVICE-PROPERTY": {
			"name": "VIRTUAL-SERVICE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "HTTPS虚拟服务配置属性",
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
					"example": "vs_https_443"
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
						"SSL-OFFLOAD-HTTPS"
					],
					"example": "SSL-OFFLOAD-HTTPS",
					"default": "SSL-OFFLOAD-HTTPS"
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
						"description": "指定虚拟服务对外发布的端口信息, 支持单个端口和端口范围。",
						"type": "string"
					},
					"maxItems": 16,
					"minItems": 1,
					"example": [
						443,
						8443
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
					"example": "https_pool"
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
						"https_rule1",
						"https_rule2"
					]
				},
				"http_sched_mode": {
					"description": "指定https类型的虚拟服务调度方式。connection: 按连接调度;request: 按每个请求进行调度。",
					"type": "string",
					"enum": [
						"CONNECTION",
						"REQUEST"
					],
					"default": "REQUEST",
					"example": "REQUEST"
				},
				"http_profile": {
					"description": "指定虚拟服务关联的HTTP配置文件",
					"type": "string",
					"example": "{http-profile}"
				},
				"ssl_client_profiles": {
					"description": "SSL客户端配置文件",
					"type": "array",
					"items": {
						"type": "string"
					},
					"maxItems": 16,
					"example": [
						"{ssl-client}"
					]
				},
				"ssl_server_profiles": {
					"description": "SSL服务端配置文件",
					"type": "array",
					"items": {
						"type": "string"
					},
					"maxItems": 16,
					"example": [
						"{ssl-server}"
					]
				},
				"https_redirect": {
					"type": "object",
					"required": [
						"state"
					],
					"properties": {
						"state": {
							"description": "HTTPS重定向状态",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"http_port": {
							"description": "HTTP重定向端口",
							"type": "integer",
							"minimum": 1,
							"maximum": 65535,
							"example": 80
						}
					}
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
										"description": "源地址类型为isp_address_group时，��定具体的isp地址段。",
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
								"example": 2000
							},
							"connection_rate_limit": {
								"description": "连接速率限制数",
								"type": "integer",
								"maximum": 4294967295,
								"minimum": 0,
								"example": 200
							}
						}
					},
					"maxItems": 10,
					"example": [
						{
							"source_address": {
								"type": "ALL"
							},
							"connection_limit": 2000,
							"connection_rate_limit": 200
						}
					]
				},
				"up_throughput_limit": {
					"description": "虚拟服务上行流量吞吐限制(单位Mbps)",
					"type": "integer",
					"maximum": 4294967295,
					"minimum": 0,
					"default": 0,
					"example": 100
				},
				"down_throughput_limit": {
					"description": "虚拟服务下行流量吞吐限制(单位Mbps)",
					"type": "integer",
					"maximum": 4294967295,
					"minimum": 0,
					"default": 0,
					"example": 100
				}
			}
		}
	}
}