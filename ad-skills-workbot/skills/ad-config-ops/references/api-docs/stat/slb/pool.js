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
		"/api/ad/v3/stat/slb/pool/": {
			"description": "获取节点池状态信息",
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
					"pool"
				],
				"summary": "get all pool statistics",
				"description": "获取节点池状态信息",
				"operationId": "get_statistics_of_pool_list",
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
						"$ref": "#/responses/operation_stat_pool_detail_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all pool statistics",
						"description": "获取节点池状态信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/pool/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/pool/ 响应",
						"description": "返回GET /api/ad/v3/stat/slb/pool/的响应数据",
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
									"health": "NORMAL",
									"node": {
										"total": 0,
										"state": {
											"enable": [
												"example_string"
											],
											"disable": [
												"example_string"
											],
											"offline": [
												"example_string"
											]
										},
										"health": {
											"normal": [
												"example_string"
											],
											"failure": [
												"example_string"
											],
											"busy": [
												"example_string"
											]
										}
									},
									"connection": null,
									"connection_established": null,
									"connection_rate": null,
									"http_request_rate": null,
									"upstream_throughput": null,
									"downstream_throughput": null,
									"general_throughput": null,
									"netns": "default"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/pool/{name}": {
			"description": "获取指定节点池状态信息",
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
					"pool"
				],
				"summary": "get specific pool statistics",
				"description": "获取指定节点池状态信息",
				"operationId": "get_statistics_of_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_pool_detail"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pool statistics",
						"description": "获取指定节点池状态信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/pool/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/pool/{name} 响应",
						"description": "返回GET /api/ad/v3/stat/slb/pool/{name}的响应数据",
						"value": {
							"name": "",
							"description": "example_string",
							"health": "NORMAL",
							"node": {
								"total": 0,
								"state": {
									"enable": [
										"example_string"
									],
									"disable": [
										"example_string"
									],
									"offline": [
										"example_string"
									]
								},
								"health": {
									"normal": [
										"example_string"
									],
									"failure": [
										"example_string"
									],
									"busy": [
										"example_string"
									]
								}
							},
							"connection": null,
							"connection_established": null,
							"connection_rate": null,
							"http_request_rate": null,
							"upstream_throughput": null,
							"downstream_throughput": null,
							"general_throughput": null,
							"netns": "default"
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/pool/{name}/{item}": {
			"description": "获取指定节点池状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.item_pool"
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
					"pool"
				],
				"summary": "get specific pool statistics",
				"description": "获取指定节点池状态信息",
				"operationId": "get_statistics_of_pool_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pool statistics",
						"description": "获取指定节点池状态信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/pool/{name}/{item}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/pool/{name}/{item} 响应",
						"description": "返回GET /api/ad/v3/stat/slb/pool/{name}/{item}的响应数据",
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
		"/api/ad/v3/stat/slb/pool-summary/": {
			"description": "获取节点池概览信息",
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
					"pool"
				],
				"summary": "get specific pool statistics",
				"description": "获取节点池概览信息",
				"operationId": "get_statistics_of_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_pool_summary"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pool statistics",
						"description": "获取节点池概览信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/pool-summary/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/pool-summary/ 响应",
						"description": "返回GET /api/ad/v3/stat/slb/pool-summary/的响应数据",
						"value": {
							"pool_count": {
								"total": 0,
								"health": {
									"normal": 0,
									"failure": 0,
									"busy": 0,
									"alert": 0
								}
							},
							"node_count": {
								"total": 0,
								"state": {
									"enable": 0,
									"disable": 0,
									"offline": 0
								},
								"health": {
									"normal": 0,
									"failure": 0,
									"busy": 0
								}
							},
							"connection": null,
							"connection_established": null,
							"connection_rate": null,
							"http_request_rate": null,
							"upstream_throughput": null,
							"downstream_throughput": null,
							"general_throughput": null
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/pool-summary/{item}": {
			"description": "获取节点池某个条目的状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/stat.item_pool_summary"
				}
			],
			"get": {
				"tags": [
					"pool"
				],
				"summary": "get specific pool statistics",
				"description": "获取节点池某个条目的状态信息",
				"operationId": "get_statistics_of_pool_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pool statistics",
						"description": "获取节点池某个条目的状态信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/pool-summary/{item}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/pool-summary/{item} 响应",
						"description": "返回GET /api/ad/v3/stat/slb/pool-summary/{item}的响应数据",
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
		"/api/ad/v3/stat/slb/pool-summary/combine-items": {
			"description": "获取节点池多个条目的状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/stat.items_query_pool_summary"
				}
			],
			"get": {
				"tags": [
					"pool"
				],
				"summary": "get specific pool statistics combine-items",
				"description": "获取节点池多个条目的状态信息",
				"operationId": "get_statistics_of_pool_trend_combine_items",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple_items"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific pool statistics combine-items",
						"description": "获取节点池多个条目的状态信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/pool-summary/combine-items"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/pool-summary/combine-items 响应",
						"description": "返回GET /api/ad/v3/stat/slb/pool-summary/combine-items的响应数据",
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
	"parameters": {
		"stat.item_pool": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "节点池状态统计信息（health/节点健康状态,connection/并发连接数,connection-rate/新建连接速率,http_request_rate/HTTP请求速率,upstream_throughput/上行吞吐速率,downstream_throughput/下行吞吐速率,general_throughput/总吞吐速率)",
			"required": true,
			"enum": [
				"health",
				"connection",
				"connection-rate",
				"http-request-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		},
		"stat.item_pool_summary": {
			"name": "item",
			"in": "path",
			"type": "string",
			"enum": [
				"connection",
				"connection-rate",
				"http-request-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		},
		"stat.items_query_pool_summary": {
			"name": "items",
			"desciption": "想要查询的数据的类别参数，类型为列表，列表元素可选参数有connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
			"in": "query",
			"type": "array",
			"items": {
				"$ref": "#/parameters/stat.item_pool_summary"
			},
			"required": true
		}
	},
	"responses": {
		"operation_stat_pool_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.pool_detail_list"
			}
		},
		"operation_stat_pool_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.pool_detail"
			}
		},
		"operation_stat_pool_summary": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.pool_summary"
			}
		}
	},
	"definitions": {
		"stat.pool_detail_list": {
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
						"$ref": "#/definitions/stat.pool_detail"
					}
				}
			}
		},
		"stat.pool_detail": {
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
				"health": {
					"description": "健康状态（NORMAL-正常/FAILURE-故障/BUSY-繁忙/ALERT-告警）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE",
						"BUSY",
						"ALERT"
					],
					"example": "NORMAL"
				},
				"node": {
					"description": "节点状态",
					"type": "object",
					"properties": {
						"total": {
							"description": "节点总数",
							"type": "integer"
						},
						"state": {
							"description": "配置状态统计",
							"type": "object",
							"properties": {
								"enable": {
									"description": "启用节点列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"disable": {
									"description": "平滑退出节点列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"offline": {
									"description": "禁用节点列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								}
							}
						},
						"health": {
							"type": "object",
							"description": "节点健康状态",
							"properties": {
								"normal": {
									"description": "正常节点列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"failure": {
									"description": "故障节点列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"busy": {
									"description": "繁忙节点列表",
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
				"http_request_rate": {
					"description": "HTTP请求速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_throughput": {
					"description": "上行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "上/下行总吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"netns": {
					"type": "string",
					"default": "default",
					"description": "netns名称"
				}
			}
		},
		"stat.pool_summary": {
			"type": "object",
			"properties": {
				"pool_count": {
					"type": "object",
					"description": "节点池统计信息",
					"properties": {
						"total": {
							"type": "integer",
							"description": "节点池个数"
						},
						"health": {
							"type": "object",
							"description": "健康状态（NORMAL-正常/FAILURE-故障/BUSY-繁忙/ALERT-告警）",
							"properties": {
								"normal": {
									"type": "integer",
									"description": "健康"
								},
								"failure": {
									"type": "integer",
									"description": "故障"
								},
								"busy": {
									"type": "integer",
									"description": "繁忙"
								},
								"alert": {
									"type": "integer",
									"description": "告警"
								}
							}
						}
					}
				},
				"node_count": {
					"type": "object",
					"description": "节点统计状态",
					"properties": {
						"total": {
							"type": "integer",
							"description": "节点个数"
						},
						"state": {
							"type": "object",
							"description": "节点启禁用状态",
							"properties": {
								"enable": {
									"type": "integer",
									"description": "节点启用"
								},
								"disable": {
									"type": "integer",
									"description": "节点禁用"
								},
								"offline": {
									"type": "integer",
									"description": "节点下线"
								}
							}
						},
						"health": {
							"type": "object",
							"description": "节点健康状态",
							"properties": {
								"normal": {
									"type": "integer",
									"description": "节点正常"
								},
								"failure": {
									"type": "integer",
									"description": "节点故障"
								},
								"busy": {
									"type": "integer",
									"description": "节点繁忙"
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
				"http_request_rate": {
					"description": "HTTP请求速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_throughput": {
					"description": "上行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "上/下行总吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		}
	}
}