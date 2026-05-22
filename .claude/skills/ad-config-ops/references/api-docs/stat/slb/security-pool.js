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
		"/api/ad/v3/stat/slb/security-pool": {
			"description": "获取所有安全资源池状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get all security-pool statistics",
				"description": "查看所有安全资源池状态信息",
				"operationId": "get_statistics_of_security_pool_list",
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
						"$ref": "#/responses/operation_stat_security_pool_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-pool/{name}": {
			"description": "获取指定安全资源池状态信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get specific security-pool statistics",
				"description": "查看指定安全资源池状态信息",
				"operationId": "get_statistics_of_security_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_security_pool_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-pool/{name}/{item}": {
			"description": "获取指定安全资源池某种条目的趋势状态信息",
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
					"$ref": "#/parameters/stat.item_security_pool"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get specific security-pool statistics",
				"description": "查看指定安全资源池某种类别的趋势状态信息，通过query参数tread指定时间范围，第二个路径参数item指定想要查看信息的类别，可选的有health/健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
				"operationId": "get_statistics_of_security_pool_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-pool-each/{item}": {
			"description": "获取每个安全资源池某种条目的趋势状态信息",
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
					"$ref": "#/parameters/stat.item_security_pool"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get each security-pool statistics",
				"description": "查看每个安全资源池某种类别的趋势状态信息，通过query参数tread指定时间范围，第二个路径参数item指定想要查看信息的类别，可选的有health/健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
				"operationId": "get_statistics_of_each_security_pool_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-pool/{name}/combine-items": {
			"description": "获取指定安全资源池某些类别的趋势状态信息，通过query参数tread指定时间范围，query参数items指定想要查看信息的类别列表，可选的有health/健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
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
					"$ref": "#/parameters/stat.items_query_security_pool_summary"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get specific security-pool statistics",
				"description": "查看指定安全资源池某些类别的趋势状态信息，通过query参数tread指定时间范围，query参数items指定想要查看信息的类别列表，可选的有health/健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
				"operationId": "get_statistics_of_security_pool_trend_items",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple_items_sslo"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-pool-summary": {
			"description": "获取所有安全资源池的整体统计信息，通过query参数tread指定时间范围",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get specific security-pool statistics",
				"description": "获取所有安全资源池的整体统计信息，通过query参数tread指定时间范围",
				"operationId": "get_summary_statistics_of_security_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_security_pool_summary"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-pool-summary/{item}": {
			"description": "获取所有安全资源池某个类别总的趋势状态信息，通过query参数tread指定时间范围，第二个路径参数item指定想要查看信息的类别，可选的connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.item_security_pool_summary"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get specific security-pool statistics",
				"description": "获取所有安全资源池某个类别总的趋势状态信息，通过query参数tread指定时间范围，第二个路径参数item指定想要查看信息的类别，可选的connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
				"operationId": "get_summary_statistics_of_security_pool_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple_items_sslo"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/security-pool-summary/combine-items": {
			"description": "获取所有安全资源池某些类别总的趋势状态信息，通过query参数tread指定时间范围，query参数items指定想要查看信息的类别列表，可选的有connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.items_query_security_pool_summary"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				}
			],
			"get": {
				"tags": [
					"security-pool"
				],
				"summary": "get specific security-pool statistics",
				"description": "查看所有安全资源池某些类别总的趋势状态信息，通过query参数tread指定时间范围，query参数items指定想要查看信息的类别列表，可选的有connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
				"operationId": "get_summary_statistics_of_security_pool_trend_items",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple_items_sslo"
					}
				}
			}
		}
	},
	"parameters": {
		"stat.item_security_pool": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "安全资源池状态统计信息（health/安全设备健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率)",
			"required": true,
			"enum": [
				"health",
				"connection",
				"connection-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		},
		"stat.item_security_pool_summary": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "安全资源池状态统计信息（connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率)",
			"required": true,
			"enum": [
				"connection",
				"connection-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		},
		"stat.item_query_security_pool": {
			"name": "item",
			"desciption": "想要查询的数据的类别参数，类型为列表，列表元素可选参数有health/安全设备健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
			"in": "query",
			"type": "array",
			"items": {
				"$ref": "#/parameters/stat.item_security_pool"
			},
			"required": true
		},
		"stat.items_query_security_pool_summary": {
			"name": "items",
			"desciption": "想要查询的数据的类别参数，类型为列表，列表元素可选参数有connection/并发连接数,connection-rate/新建连接速率,upstream-throughput/上行吞吐速率,downstream-throughput/下行吞吐速率,general-throughput/总吞吐速率",
			"in": "query",
			"type": "array",
			"items": {
				"$ref": "#/parameters/stat.item_security_pool_summary"
			},
			"required": true
		}
	},
	"responses": {
		"operation_stat_security_pool_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.security_pool_detail_list"
			}
		},
		"operation_stat_security_pool_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.security_pool_detail"
			}
		},
		"operation_stat_security_pool_summary": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.security_pool_summary"
			}
		}
	},
	"definitions": {
		"stat.security_pool_detail_list": {
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
						"$ref": "#/definitions/stat.security_pool_detail"
					}
				}
			}
		},
		"stat.security_pool_detail": {
			"type": "object",
			"description": "安全设备资源池状态信息",
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
					"description": "健康状态（NORMAL-正常/FAILURE-故障/ALERT-告警）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE",
						"ALERT"
					],
					"example": "NORMAL"
				},
				"health_reason": {
					"description": "当前健康状态的具体原因",
					"type": "string",
					"example": "ALL_NODES_HAVE_NO_MONITOR"
				},
				"bypass": {
					"description": "bypass动作。设备池故障时若启用Bypass，则直接放通；若禁用Bypass，则针对四层虚拟服务将丢弃数据包，针对七层虚拟服务将关闭连接并返回一个终止数据包",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "DISABLE"
				},
				"type": {
					"description": "安全资源池类型，SECURITY表示安全设备池，MIRROR表示镜像设备池",
					"type": "string",
					"enum": [
						"SECURITY",
						"MIRROR"
					],
					"example": "SECURITY"
				},
				"security_type": {
					"description": "当安全资源池类型为安全设备池时，可指定特定的安全设备池类型，用户自定义填写",
					"type": "string",
					"example": "WAF"
				},
				"security_node": {
					"description": "安全设备状态",
					"type": "object",
					"properties": {
						"total": {
							"description": "安全设备总数",
							"type": "integer"
						},
						"state": {
							"description": "配置状态统计",
							"type": "object",
							"properties": {
								"enable": {
									"description": "启用安全设备点列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"disable": {
									"description": "禁用安全设备列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"offline": {
									"description": "平滑退出安全设备列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								}
							}
						},
						"health": {
							"type": "object",
							"description": "安全设备健康状态",
							"properties": {
								"normal": {
									"description": "正常安全设备列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"failure": {
									"description": "故障安全设备列表",
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
				"upstream-throughput": {
					"description": "上行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream-throughput": {
					"description": "下行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general-throughput": {
					"description": "上/下行总吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		},
		"stat.security_pool_summary": {
			"type": "object",
			"description": "安全资源池的整体状态信息",
			"properties": {
				"security_pool_count": {
					"type": "object",
					"description": "安全资源池统计信息",
					"properties": {
						"total": {
							"type": "integer",
							"description": "安全资源池个数"
						},
						"health": {
							"type": "object",
							"description": "健康状态（NORMAL-正常/FAILURE-故障/ALERT-告警）",
							"properties": {
								"normal": {
									"type": "integer",
									"description": "健康"
								},
								"failure": {
									"type": "integer",
									"description": "故障"
								},
								"alert": {
									"type": "integer",
									"description": "告警"
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
				"upstream-throughput": {
					"description": "上行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream-throughput": {
					"description": "下行吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general-throughput": {
					"description": "上/下行总吞吐速率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		}
	}
}