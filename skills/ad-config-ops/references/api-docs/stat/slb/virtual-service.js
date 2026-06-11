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
		"/api/ad/v3/stat/slb/virtual-service/": {
			"description": "获取所有虚拟服务状态信息",
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
					"virtual-service"
				],
				"summary": "get all virtual-service statistics",
				"description": "获取所有虚拟服务状态信息",
				"operationId": "get_statistics_of_virtual_service_list",
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
						"$ref": "#/responses/operation_stat_virtual_service_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all virtual-service statistics",
						"description": "获取所有虚拟服务状态信息\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service/ 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service/的响应数据",
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
									"name": "",
									"description": "example_string",
									"icon": "web_flag_icon",
									"state": "ENABLE",
									"service": null,
									"health": "NORMAL",
									"failure_reason": "",
									"pool": {
										"total": 0,
										"health": {
											"normal": [
												"example_string"
											],
											"failure": [
												"example_string"
											],
											"busy": [
												"example_string"
											],
											"alert": [
												"example_string"
											]
										}
									},
									"connection": null,
									"connection_established": null,
									"connection_rate": null,
									"ssl_connection_rate": null,
									"client_connection": null,
									"server_connection": null,
									"pool_connection_usage": null,
									"pool_connection_rate": null,
									"maximum_connection": null,
									"total_connection": null,
									"http_request_rate": null,
									"total_http_request": null,
									"http_cache_hit": null,
									"http_cache_used": null,
									"http_cache_response_data": null,
									"http_compression_saving_ratio": null,
									"http_compression_data_reduction": null,
									"upstream_throughput": null,
									"downstream_throughput": null,
									"general_throughput": null,
									"upstream_data": null,
									"downstream_data": null,
									"upstream_packet": null,
									"downstream_packet": null,
									"netns": "netns名称"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service/{name}": {
			"description": "获取指定虚拟服务状态信息",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics",
				"description": "获取指定虚拟服务状态信息",
				"operationId": "get_statistics_of_virtual_service",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_virtual_service_detail"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics",
						"description": "获取指定虚拟服务状态信息\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service/{name} 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service/{name}的响应数据",
						"value": {
							"name": "",
							"description": "example_string",
							"icon": "web_flag_icon",
							"state": "ENABLE",
							"service": null,
							"vips": [
								"10.0.1.83"
							],
							"vports": [
								"80-88"
							],
							"health": "NORMAL",
							"failure_reason": "",
							"pool": {
								"total": 0,
								"health": {
									"normal": [
										"example_string"
									],
									"failure": [
										"example_string"
									],
									"busy": [
										"example_string"
									],
									"alert": [
										"example_string"
									]
								}
							},
							"pre_rule_essential": [
								{
									"name": "host_www.abc.com",
									"pool": "example_string",
									"health": "NORMAL",
									"connection": null,
									"connection_rate": null,
									"hit_rate": null,
									"hit": null
								}
							],
							"pool_essential": {
								"name": "host_www.abc.com",
								"health": "NORMAL",
								"connection": null,
								"connection_rate": null
							},
							"connection": null,
							"connection_established": null,
							"connection_rate": null,
							"ssl_connection_rate": null,
							"client_connection": null,
							"server_connection": null,
							"pool_connection_usage": null,
							"pool_connection_rate": null,
							"maximum_connection": null,
							"total_connection": null,
							"http_request_rate": null,
							"total_http_request": null,
							"http_cache_hit": null,
							"http_cache_used": null,
							"http_cache_response_data": null,
							"http_compression_saving_ratio": null,
							"http_compression_data_reduction": null,
							"upstream_throughput": null,
							"downstream_throughput": null,
							"general_throughput": null,
							"upstream_data": null,
							"downstream_data": null,
							"upstream_packet": null,
							"downstream_packet": null,
							"netns": "netns名称"
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service-names/": {
			"description": "获取多个虚拟服务状态信息",
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
					"virtual-service"
				],
				"summary": "get many virtual-service statistics",
				"description": "获取多个虚拟服务状态信息",
				"operationId": "get_statistics_of_many_virtual_service_list",
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
						"$ref": "#/responses/operation_stat_virtual_service_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get many virtual-service statistics",
						"description": "获取多个虚拟服务状态信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service-names/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service-names/ 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service-names/的响应数据",
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
									"name": "",
									"description": "example_string",
									"icon": "web_flag_icon",
									"state": "ENABLE",
									"service": null,
									"health": "NORMAL",
									"failure_reason": "",
									"pool": {
										"total": 0,
										"health": {
											"normal": [
												"example_string"
											],
											"failure": [
												"example_string"
											],
											"busy": [
												"example_string"
											],
											"alert": [
												"example_string"
											]
										}
									},
									"connection": null,
									"connection_established": null,
									"connection_rate": null,
									"ssl_connection_rate": null,
									"client_connection": null,
									"server_connection": null,
									"pool_connection_usage": null,
									"pool_connection_rate": null,
									"maximum_connection": null,
									"total_connection": null,
									"http_request_rate": null,
									"total_http_request": null,
									"http_cache_hit": null,
									"http_cache_used": null,
									"http_cache_response_data": null,
									"http_compression_saving_ratio": null,
									"http_compression_data_reduction": null,
									"upstream_throughput": null,
									"downstream_throughput": null,
									"general_throughput": null,
									"upstream_data": null,
									"downstream_data": null,
									"upstream_packet": null,
									"downstream_packet": null,
									"netns": "netns名称"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service/{name}/ddos": {
			"description": "获取指定虚拟服务ddos信息",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "#/parameters/date"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics",
				"description": "获取指定虚拟服务ddos信息",
				"operationId": "get_statistics_of_virtual_service_ddos",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_virtual_service_ddos"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics",
						"description": "获取指定虚拟服务ddos信息\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service/{name}/ddos"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service/{name}/ddos 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service/{name}/ddos的响应数据",
						"value": {
							"attack_sources": [
								{
									"address": "example_string",
									"times": null
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service/{name}/ddos-log": {
			"description": "获取指定虚拟服务ddos-log信息",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "#/parameters/date"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics",
				"description": "获取指定虚拟服务ddos-log信息",
				"operationId": "get_statistics_of_virtual_service_ddos_log",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_virtual_service_ddos_log_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics",
						"description": "获取指定虚拟服务ddos-log信息\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service/{name}/ddos-log"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service/{name}/ddos-log 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service/{name}/ddos-log的响应数据",
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
									"serial": 1,
									"timestamp": 0,
									"virtual_service": "vs_http_80",
									"source_address": "10.2.1.34",
									"attack_type": "Flood",
									"detail": "",
									"target_url": "200.200.144.1/",
									"count": 6123,
									"action": "WARN-AND-BLOCK"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service/{name}/{item}": {
			"description": "获取指定虚拟服务信息",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.item_virtual_service"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics",
				"description": "获取指定虚拟服务信息",
				"operationId": "get_statistics_of_virtual_service_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics",
						"description": "获取指定虚拟服务信息\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service/{name}/{item}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service/{name}/{item} 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service/{name}/{item}的响应数据",
						"value": {
							"model": "TREND-LAST-HOUR",
							"unit": "BIT-PER-SECOND",
							"timestamp": 0,
							"values": [
								0
							],
							"additional_data": [
								null
							],
							"start_time": 0,
							"step_time": 0
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service/{name}/combine-items": {
			"description": "获取指定虚拟服务多个数据点的历史数据",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.items_virtual_service"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics combine-items",
				"description": "获取指定虚拟服务多个数据点的历史数据",
				"operationId": "get_statistics_of_virtual_service_summary_trend_combine_items",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple_items"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics combine-items",
						"description": "获取指定虚拟服务多个数据点的历史数据\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service/{name}/combine-items"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service/{name}/combine-items 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service/{name}/combine-items的响应数据",
						"value": {
							"model": "TREND-LAST-HOUR",
							"timestamp": 0,
							"items": [
								{
									"item": "example_string",
									"feature": "DISABLE",
									"unit": "BIT-PER-SECOND",
									"values": [
										0
									],
									"additional_data": [
										null
									]
								}
							],
							"start_time": 0,
							"step_time": 0
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service-summary": {
			"description": "获取虚拟服务概览情况",
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
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics",
				"description": "获取虚拟服务概览情况",
				"operationId": "get_statistics_of_virtual_service_summary",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_virtual_service_summary_detail"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics",
						"description": "获取虚拟服务概览情况",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service-summary"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service-summary 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service-summary的响应数据",
						"value": {
							"virtual_service_count": {
								"total": 0,
								"state": {
									"enable": 0,
									"disable": 0
								},
								"health": {
									"normal": 0,
									"failure": 0,
									"alert": 0
								}
							},
							"pool_count": {
								"total": 0,
								"health": {
									"normal": 0,
									"failure": 0,
									"busy": 0,
									"alert": 0
								}
							},
							"connection": null,
							"connection_established": null,
							"connection_rate": null,
							"ssl_connection_rate": null,
							"client_connection": null,
							"server_connection": null,
							"pool_connection_usage": null,
							"pool_connection_rate": null,
							"maximum_connection": null,
							"total_connection": null,
							"http_request_rate": null,
							"total_http_request": null,
							"http_cache_hit": null,
							"http_cache_used": null,
							"http_cache_response_data": null,
							"http_compression_saving_ratio": null,
							"http_compression_data_reduction": null,
							"upstream_throughput": null,
							"downstream_throughput": null,
							"general_throughput": null
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service-summary/ddos": {
			"description": "获取ddos服务概览情况",
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
					"$ref": "#/parameters/date"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get virtual-service summary statistics",
				"description": "获取ddos服务概览情况",
				"operationId": "get_statistics_of_virtual_service_summary_ddos",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_virtual_service_ddos"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get virtual-service summary statistics",
						"description": "获取ddos服务概览情况",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service-summary/ddos"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service-summary/ddos 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service-summary/ddos的响应数据",
						"value": {
							"attack_sources": [
								{
									"address": "example_string",
									"times": null
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service-summary/ddos-log": {
			"description": "获取ddos-log服务概况",
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
					"$ref": "#/parameters/date"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get virtual-service summary statistics",
				"description": "获取ddos-log服务概况",
				"operationId": "get_statistics_of_virtual_service_summary_ddos_log",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_virtual_service_ddos_log_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get virtual-service summary statistics",
						"description": "获取ddos-log服务概况",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service-summary/ddos-log"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service-summary/ddos-log 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service-summary/ddos-log的响应数据",
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
									"serial": 1,
									"timestamp": 0,
									"virtual_service": "vs_http_80",
									"source_address": "10.2.1.34",
									"attack_type": "Flood",
									"detail": "",
									"target_url": "200.200.144.1/",
									"count": 6123,
									"action": "WARN-AND-BLOCK"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service-summary/{item}": {
			"description": "获取虚拟服务概览情况",
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
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.item_virtual_service_summary"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics",
				"description": "获取虚拟服务概览情况",
				"operationId": "get_statistics_of_virtual_service_summary_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics",
						"description": "获取虚拟服务概览情况",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service-summary/{item}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service-summary/{item} 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service-summary/{item}的响应数据",
						"value": {
							"model": "TREND-LAST-HOUR",
							"unit": "BIT-PER-SECOND",
							"timestamp": 0,
							"values": [
								0
							],
							"additional_data": [
								null
							],
							"start_time": 0,
							"step_time": 0
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/virtual-service-summary/combine-items": {
			"description": "获取虚拟服务趋势值",
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
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.items_virtual_service_summary"
				}
			],
			"get": {
				"tags": [
					"virtual-service"
				],
				"summary": "get specific virtual-service statistics combine-items",
				"description": "获取虚拟服务趋势值",
				"operationId": "get_statistics_of_virtual_service_summary_trend_combine",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple_items"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific virtual-service statistics combine-items",
						"description": "获取虚拟服务趋势值",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service-summary/combine-items"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service-summary/combine-items 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service-summary/combine-items的响应数据",
						"value": {
							"model": "TREND-LAST-HOUR",
							"timestamp": 0,
							"items": [
								{
									"item": "example_string",
									"feature": "DISABLE",
									"unit": "BIT-PER-SECOND",
									"values": [
										0
									],
									"additional_data": [
										null
									]
								}
							],
							"start_time": 0,
							"step_time": 0
						}
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_virtual_service_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.virtual_service_list"
			}
		},
		"operation_stat_virtual_service_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.virtual_service_detail"
			}
		},
		"operation_stat_virtual_service_summary_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.virtual_service_summary_detail"
			}
		},
		"operation_stat_virtual_service_ddos": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.virtual_service_ddos"
			}
		},
		"operation_stat_virtual_service_ddos_log_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.virtual_service_ddos_log_list"
			}
		}
	},
	"parameters": {
		"stat.items_virtual_service": {
			"name": "items",
			"in": "query",
			"type": "array",
			"description": "虚拟服务状态",
			"items": {
				"type": "string",
				"enum": [
					"health",
					"connection",
					"connection-rate",
					"ssl-connection-rate",
					"client-connection",
					"server-connection",
					"pool-connection-rate",
					"http-request-rate",
					"http-cache-hit-rate",
					"http-compression-raw-throughput",
					"http-compression-throughput",
					"upstream-throughput",
					"downstream-throughput",
					"general-throughput",
					"ddos-defend"
				]
			},
			"example": [
				"ssl-connection-rate",
				"ssl-upstream-throughput",
				"ssl-downstream-throughput",
				"http-compression-raw-throughput",
				"http-compression-throughput",
				"http-request-rate",
				"http-cache-hit-rate"
			]
		},
		"stat.items_virtual_service_summary": {
			"name": "items",
			"in": "query",
			"type": "array",
			"description": "虚拟服务概览情况",
			"items": {
				"type": "string",
				"enum": [
					"connection",
					"connection-rate",
					"ssl-connection-rate",
					"client-connection",
					"server-connection",
					"pool-connection-rate",
					"http-request-rate",
					"http-cache-hit-rate",
					"http-compression-raw-throughput",
					"http-compression-throughput",
					"upstream-throughput",
					"downstream-throughput",
					"general-throughput",
					"ddos-defend",
					"ssl-upstream-throughput",
					"ssl-downstream-throughput",
					"ssl-general-throughput"
				]
			},
			"example": [
				"ssl-connection-rate",
				"ssl-upstream-throughput",
				"ssl-downstream-throughput",
				"http-compression-raw-throughput",
				"http-compression-throughput",
				"http-request-rate",
				"http-cache-hit-rate"
			]
		},
		"date": {
			"name": "date",
			"in": "query",
			"type": "string",
			"description": "时间格式，Format: YYYYMMDD",
			"example": "20160718"
		}
	},
	"definitions": {
		"stat.virtual_service_list": {
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
						"$ref": "#/definitions/stat.virtual_service"
					}
				}
			}
		},
		"stat.virtual_service": {
			"type": "object",
			"properties": {
				"name": {
					"description": "配置名称",
					"type": "string",
					"example": ""
				},
				"description": {
					"description": "管理标签及备注描述信息",
					"type": "string"
				},
				"icon": {
					"description": "Web控制台图标定义",
					"type": "string",
					"example": "web_flag_icon"
				},
				"state": {
					"description": "配置启/禁用开关（ENABLE-启用/DISABLE-禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE"
				},
				"service": {
					"description": "虚拟服务类型",
					"$ref": "/api/{common}.yaml#/definitions/config.service_type"
				},
				"health": {
					"description": "健康状态（NORMAL-正常/FAILURE-故障/ALERT-告警）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE",
						"ALERT"
					],
					"example": "NORMAL"
				},
				"failure_reason": {
					"description": "故障原因",
					"type": "string",
					"example": ""
				},
				"pool": {
					"description": "关联节点池状态",
					"type": "object",
					"properties": {
						"total": {
							"description": "关联节点池总数",
							"type": "integer"
						},
						"health": {
							"description": "健康状态",
							"type": "object",
							"properties": {
								"normal": {
									"description": "正常状态节点池列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"failure": {
									"description": "故障状态节点池列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"busy": {
									"description": "繁忙状态节点池列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"alert": {
									"description": "告警状态节点池列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								}
							}
						}
					}
				},
				"connection": {
					"description": "并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_established": {
					"description": "Established并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_rate": {
					"description": "新建连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"ssl_connection_rate": {
					"description": "SSL新建连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"client_connection": {
					"description": "客户端连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"server_connection": {
					"description": "服务端连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"pool_connection_usage": {
					"description": "TCP连接池使用率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"pool_connection_rate": {
					"description": "TCP连接池新建速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"maximum_connection": {
					"description": "最大连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"total_connection": {
					"description": "总连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_request_rate": {
					"description": "HTTP请求速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"total_http_request": {
					"description": "HTTP请求总数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_cache_hit": {
					"description": "HTTP缓存命中数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_cache_used": {
					"description": "HTTP缓存命中比例",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"http_cache_response_data": {
					"description": "HTTP缓存应答数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_compression_saving_ratio": {
					"description": "HTTP压缩数据节省比例",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_compression_data_reduction": {
					"description": "HTTP压缩数据节省量",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_throughput": {
					"description": "上行吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "上/下行总吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_data": {
					"description": "上行数据统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_data": {
					"description": "下行数据统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_packet": {
					"description": "上行数据包统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_packet": {
					"description": "下行数据包统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"netns": {
					"type": "string",
					"default": "netns名称",
					"description": "netns名称"
				}
			}
		},
		"stat.virtual_service_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"example": "",
					"description": "虚拟服务名称"
				},
				"description": {
					"type": "string",
					"description": "虚拟服务描述信息"
				},
				"icon": {
					"type": "string",
					"description": "Web控制台图标定义",
					"example": "web_flag_icon"
				},
				"state": {
					"type": "string",
					"description": "配置启/禁用开关（ENABLE-启用/DISABLE-禁用）",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE"
				},
				"service": {
					"description": "虚拟服务类型",
					"$ref": "/api/{common}.yaml#/definitions/config.service_type"
				},
				"vips": {
					"type": "array",
					"description": "虚拟ip",
					"items": {
						"type": "string"
					},
					"example": [
						"10.0.1.83",
						"200.200.145.96"
					]
				},
				"vports": {
					"type": "array",
					"description": "虚拟端口",
					"items": {
						"type": "string"
					},
					"example": [
						"80-88",
						"8080"
					]
				},
				"health": {
					"type": "string",
					"description": "健康状态（NORMAL-正常/FAILURE-故障/ALERT-告警）",
					"enum": [
						"NORMAL",
						"FAILURE",
						"ALERT"
					],
					"example": "NORMAL"
				},
				"failure_reason": {
					"description": "故障原因",
					"type": "string",
					"example": ""
				},
				"pool": {
					"type": "object",
					"description": "关联节点池状态",
					"properties": {
						"total": {
							"type": "integer",
							"description": "关联节点池总数"
						},
						"health": {
							"type": "object",
							"description": "健康状态",
							"properties": {
								"normal": {
									"type": "array",
									"description": "正常状态节点池列表",
									"items": {
										"type": "string"
									}
								},
								"failure": {
									"type": "array",
									"description": "故障状态节点池列表",
									"items": {
										"type": "string"
									}
								},
								"busy": {
									"type": "array",
									"description": "繁忙状态节点池列表",
									"items": {
										"type": "string"
									}
								},
								"alert": {
									"type": "array",
									"description": "告警状态节点池列表",
									"items": {
										"type": "string"
									}
								}
							}
						}
					}
				},
				"pre_rule_essential": {
					"type": "array",
					"description": "前置策略信息",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"type": "string",
								"example": "host_www.abc.com",
								"description": "前置策略名称"
							},
							"pool": {
								"type": "string",
								"description": "节点池名称"
							},
							"health": {
								"type": "string",
								"description": "健康状态（NORMAL-正常/BUSY-繁忙/FAILURE-故障/ALERT-告警）",
								"enum": [
									"NORMAL",
									"FAILURE",
									"BUSY",
									"ALERT"
								],
								"example": "NORMAL"
							},
							"connection": {
								"description": "并发连接数",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
							},
							"connection_rate": {
								"description": "新建连接数",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
							},
							"hit_rate": {
								"description": "前置策略匹配率统计",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
							},
							"hit": {
								"description": "前置策略匹配次数统计",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
							}
						}
					}
				},
				"pool_essential": {
					"type": "object",
					"description": "节点池信息",
					"properties": {
						"name": {
							"type": "string",
							"example": "host_www.abc.com",
							"description": "节点池名称"
						},
						"health": {
							"type": "string",
							"description": "健康状态（NORMAL-正常/BUSY-繁忙/FAILURE-故障/ALERT-告警）",
							"enum": [
								"NORMAL",
								"FAILURE",
								"BUSY",
								"ALERT"
							],
							"example": "NORMAL"
						},
						"connection": {
							"description": "并发连接数",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						},
						"connection_rate": {
							"description": "新建连接数",
							"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
						}
					}
				},
				"connection": {
					"description": "并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_established": {
					"description": "Established并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_rate": {
					"description": "新建连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"ssl_connection_rate": {
					"description": "SSL新建连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"client_connection": {
					"description": "客户端连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"server_connection": {
					"description": "服务端连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"pool_connection_usage": {
					"description": "TCP连接池使用率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"pool_connection_rate": {
					"description": "TCP连接池新建速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"maximum_connection": {
					"description": "最大连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"total_connection": {
					"description": "总连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_request_rate": {
					"description": "HTTP请求速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"total_http_request": {
					"description": "HTTP请求总数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_cache_hit": {
					"description": "HTTP缓存命中数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_cache_used": {
					"description": "HTTP缓存命中比例",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"http_cache_response_data": {
					"description": "HTTP缓存应答数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_compression_saving_ratio": {
					"description": "HTTP压缩数据节省比例",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_compression_data_reduction": {
					"description": "HTTP压缩数据节省量",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_throughput": {
					"description": "上行吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "上/下行总吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_data": {
					"description": "上行数据统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_data": {
					"description": "下行数据统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_packet": {
					"description": "上行数据包统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_packet": {
					"description": "下行数据包统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"netns": {
					"type": "string",
					"default": "netns名称",
					"description": "netns名称"
				}
			}
		},
		"stat.virtual_service_summary_detail": {
			"type": "object",
			"properties": {
				"virtual_service_count": {
					"type": "object",
					"description": "虚拟服务总数",
					"properties": {
						"total": {
							"type": "integer",
							"description": "虚拟服务总数"
						},
						"state": {
							"type": "object",
							"description": "虚拟服务启用/禁用状态",
							"properties": {
								"enable": {
									"type": "integer",
									"description": "虚拟服务启用"
								},
								"disable": {
									"type": "integer",
									"description": "虚拟服务禁用"
								}
							}
						},
						"health": {
							"type": "object",
							"description": "虚拟服务健康状态",
							"properties": {
								"normal": {
									"type": "integer",
									"description": "虚拟服务正常"
								},
								"failure": {
									"type": "integer",
									"description": "虚拟服务故障"
								},
								"alert": {
									"type": "integer",
									"description": "虚拟服务告警"
								}
							}
						}
					}
				},
				"pool_count": {
					"type": "object",
					"description": "节点池统计",
					"properties": {
						"total": {
							"type": "integer",
							"description": "节点池个数总数"
						},
						"health": {
							"type": "object",
							"description": "节点池健康状态",
							"properties": {
								"normal": {
									"type": "integer",
									"description": "节点池正常"
								},
								"failure": {
									"type": "integer",
									"description": "节点池故障"
								},
								"busy": {
									"type": "integer",
									"description": "节点池繁忙"
								},
								"alert": {
									"type": "integer",
									"description": "节点池告警"
								}
							}
						}
					}
				},
				"connection": {
					"description": "并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_established": {
					"description": "Established并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_rate": {
					"description": "新建连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"ssl_connection_rate": {
					"description": "SSL新建连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"client_connection": {
					"description": "客户端连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"server_connection": {
					"description": "服务端连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"pool_connection_usage": {
					"description": "TCP连接池使用率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"pool_connection_rate": {
					"description": "TCP连接池新建速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"maximum_connection": {
					"description": "最大连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"total_connection": {
					"description": "总连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_request_rate": {
					"description": "HTTP请求速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"total_http_request": {
					"description": "HTTP请求总数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_cache_hit": {
					"description": "HTTP缓存命中数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_cache_used": {
					"description": "HTTP缓存命中比例",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"http_cache_response_data": {
					"description": "HTTP缓存应答数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_compression_saving_ratio": {
					"description": "HTTP压缩数据节省比例",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"http_compression_data_reduction": {
					"description": "HTTP压缩数据节省量",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_throughput": {
					"description": "上行吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "上/下行总吞吐量速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		},
		"stat.virtual_service_ddos": {
			"type": "object",
			"properties": {
				"attack_sources": {
					"type": "array",
					"description": "虚拟服务攻击源信息列表",
					"items": {
						"type": "object",
						"description": "虚拟服务攻击源信息",
						"properties": {
							"address": {
								"type": "string",
								"description": "虚拟服务攻击源IP"
							},
							"times": {
								"description": "虚拟服务攻击时间",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
							}
						}
					}
				}
			}
		},
		"stat.virtual_service_ddos_log_list": {
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
						"$ref": "#/definitions/stat.virtual_service_ddos_log"
					}
				}
			}
		},
		"stat.virtual_service_ddos_log": {
			"type": "object",
			"properties": {
				"serial": {
					"type": "integer",
					"description": "ddos_log序号",
					"example": 1
				},
				"timestamp": {
					"type": "integer",
					"description": "时间戳信息"
				},
				"virtual_service": {
					"type": "string",
					"example": "vs_http_80",
					"description": "虚拟服务名称"
				},
				"source_address": {
					"type": "string",
					"example": "10.2.1.34",
					"description": "源IP地址"
				},
				"attack_type": {
					"type": "string",
					"description": "攻击类型",
					"example": "Flood"
				},
				"detail": {
					"type": "string",
					"description": "详细信息",
					"example": ""
				},
				"target_url": {
					"type": "string",
					"description": "目标url",
					"example": "200.200.144.1/"
				},
				"count": {
					"type": "integer",
					"description": "攻击次数",
					"example": 6123
				},
				"action": {
					"type": "string",
					"description": "采取防护动作（WARN/告警，BLOCK/拦截，WARN-AND-BLOCK/告警和拦截）",
					"enum": [
						"WARN",
						"BLOCK",
						"WARN-AND-BLOCK"
					],
					"example": "WARN-AND-BLOCK"
				}
			}
		}
	}
}