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
		"/api/ad/v3/stat/sys/system": {
			"description": "获取系统状态",
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
					"system"
				],
				"summary": "get system statistics",
				"description": "获取系统状态",
				"operationId": "get_statistics_of_system",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_system"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get system statistics",
						"description": "获取系统状态",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/sys/system"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/sys/system 响应",
						"description": "返回GET /api/ad/v3/stat/sys/system的响应数据",
						"value": {
							"boot_time": 0,
							"interface": {
								"total": 0,
								"plug": {
									"in": [
										"example_string"
									],
									"out": [
										"example_string"
									]
								}
							},
							"temperature": [
								{
									"name": "example_string",
									"state": "NORMAL",
									"temperature": null
								}
							],
							"fan": [
								{
									"name": "example_string",
									"speed": null
								}
							],
							"power_supply": "UNSUPPORTED",
							"cpu_usage": null,
							"memory_usage": null,
							"connection": null,
							"connection_rate": null,
							"upstream_throughput": null,
							"downstream_throughput": null,
							"hardware": [
								"SSL-ACCELERATOR-CARD"
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/stat/sys/system/{item}": {
			"description": "获取指定类型系统状态统计数据",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.item_system"
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
					"system"
				],
				"summary": "get system statistics",
				"description": "获取指定类型系统状态统计数据",
				"operationId": "get_statistics_of_system_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get system statistics",
						"description": "获取指定类型系统状态统计数据",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/sys/system/{item}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/sys/system/{item} 响应",
						"description": "返回GET /api/ad/v3/stat/sys/system/{item}的响应数据",
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
		"/api/ad/v3/stat/sys/system/combine-items": {
			"description": "获取多个类型系统状态统计数据",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "#/parameters/stat.item_system"
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
					"system"
				],
				"summary": "get system statistics",
				"description": "获取多个类型系统状态统计数据",
				"operationId": "get_statistics_of_system_trend_combine_items",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple_items"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get system statistics",
						"description": "获取多个类型系统状态统计数据",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/sys/system/combine-items"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/sys/system/combine-items 响应",
						"description": "返回GET /api/ad/v3/stat/sys/system/combine-items的响应数据",
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
		"operation_stat_system": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.system"
			}
		}
	},
	"parameters": {
		"stat.item_system": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "获取信息的条目名称（memory-usage/内存使用率，connection/并发连接数，connection-rate/新建连接数，downstream_throughput/下行吞吐量速率, upstream_throughput/上行吞吐量速率, general_throughput/总吞吐量速率）",
			"enum": [
				"memory-usage",
				"connection",
				"connection-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		}
	},
	"definitions": {
		"stat.system": {
			"type": "object",
			"properties": {
				"boot_time": {
					"description": "系统启动时长",
					"type": "integer"
				},
				"interface": {
					"description": "网络接口状态",
					"type": "object",
					"properties": {
						"total": {
							"description": "接口总数",
							"type": "integer"
						},
						"plug": {
							"description": "插线状态",
							"type": "object",
							"properties": {
								"in": {
									"description": "插线网口列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								},
								"out": {
									"description": "未插线网口列表",
									"type": "array",
									"items": {
										"type": "string"
									}
								}
							}
						}
					}
				},
				"temperature": {
					"description": "硬件温度状态",
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"description": "硬件设备/传感器名称",
								"type": "string",
								"examaple": "CPU[0][1]"
							},
							"state": {
								"description": "当前运行状态（NORMAL-正常/ALARM-告警）",
								"type": "string",
								"enum": [
									"NORMAL",
									"ALARM"
								]
							},
							"temperature": {
								"description": "温度数据",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
							}
						}
					}
				},
				"fan": {
					"description": "风扇运行状态",
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"description": "硬件设备/风扇名称",
								"type": "string",
								"examaple": "FAN0"
							},
							"speed": {
								"description": "转速数据",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
							}
						}
					}
				},
				"power_supply": {
					"description": "设备电源状态（UNSUPPORTED-不支持/NORMAL-正常/ALARM-1-电源1故障/ALARM-2-电源2故障/FAILURE-电源故障）",
					"type": "string",
					"enum": [
						"UNSUPPORTED",
						"NORMAL",
						"ALARM-1",
						"ALARM-2",
						"FAILURE"
					]
				},
				"cpu_usage": {
					"description": "CPU使用率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"memory_usage": {
					"description": "内存使用率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection": {
					"description": "系统并发连接数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"connection_rate": {
					"description": "系统新建连接",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_throughput": {
					"description": "系统上行吞吐量",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "系统下行吞吐量",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"hardware": {
					"description": "硬件/外设信息（SSL-ACCELERATOR-CARD-SSL卸载加速卡/ENCRYPTION-CARD-SSL加密卡）",
					"type": "array",
					"items": {
						"type": "string",
						"enum": [
							"SSL-ACCELERATOR-CARD",
							"ENCRYPTION-CARD",
							"<...>"
						]
					}
				}
			}
		}
	}
}