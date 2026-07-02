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
		"/api/ad/v3/debug/slb/service-monitor": {
			"description": "监视器测试操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"monitor-test"
				],
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/all_properties"
					}
				],
				"summary": "get monitor test result",
				"description": "获取上一次监视器探测的结果",
				"operationId": "get_last_monitor_test_result",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_monitor_test_get"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get monitor test result",
						"description": "获取上一次监视器探测的结果",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/slb/service-monitor"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/slb/service-monitor 响应",
						"description": "返回GET /api/ad/v3/debug/slb/service-monitor的响应数据",
						"value": {
							"monitor_err": [
								{
									"name": "example_string",
									"state": "example_string",
									"req_times": 0,
									"is_running": true,
									"rs_mon_fault_type": [
										"example_string"
									]
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"monitor-test"
				],
				"summary": "monitor test",
				"description": "发起监视器探测请求",
				"operationId": "monitor_test",
				"parameters": [
					{
						"$ref": "#/parameters/monitor_test"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_monitor_test_post"
					}
				},
				"x-examples": {
					"request": {
						"summary": "monitor test",
						"description": "发起监视器探测请求",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/slb/service-monitor",
							"body": {
								"monitor_name": "http",
								"ip_addr": "10.0.1.234"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/slb/service-monitor 响应",
						"description": "返回POST /api/ad/v3/debug/slb/service-monitor的响应数据",
						"value": {}
					}
				}
			},
			"delete": {
				"tags": [
					"monitor-test"
				],
				"summary": "delete monitor test task",
				"description": "删除监视器探测任务",
				"operationId": "delete_monitor_test",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_monitor_test_delete"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete monitor test task",
						"description": "删除监视器探测任务",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/debug/slb/service-monitor"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/debug/slb/service-monitor 响应",
						"description": "返回DELETE /api/ad/v3/debug/slb/service-monitor的响应数据",
						"value": {}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug slb service-monitor ip_addr 1.1.1.1 monitor_name http port 80",
					"description": "发起监视器探测请求"
				},
				{
					"command": "show debug slb service-monitor",
					"description": "查询监视器探测结果"
				},
				{
					"command": "delete debug slb service-monitor",
					"description": "删除监视器探测任务"
				}
			]
		}
	},
	"parameters": {
		"monitor_test": {
			"name": "monitor_test",
			"in": "body",
			"required": true,
			"schema": {
				"$ref": "#/definitions/debug.monitor_test"
			}
		}
	},
	"responses": {
		"operation_debug_monitor_test_get": {
			"description": "获取监视器探测结果",
			"schema": {
				"$ref": "#/definitions/debug.monitor_test_get_resp"
			}
		},
		"operation_debug_monitor_test_post": {
			"description": "发起监视器探测的返回值",
			"schema": {
				"$ref": "#/definitions/debug.monitor_test_post_resp"
			}
		},
		"operation_debug_monitor_test_delete": {
			"description": "删除监视器探测任务",
			"schema": {
				"$ref": "#/definitions/debug.monitor_test_delete_resp"
			}
		}
	},
	"definitions": {
		"debug.monitor_test": {
			"type": "object",
			"required": [
				"monitor_name",
				"ip_addr"
			],
			"properties": {
				"monitor_name": {
					"type": "string",
					"description": "监视器名称",
					"example": "http"
				},
				"ip_addr": {
					"type": "string",
					"description": "测试节点IP地址",
					"example": "10.0.1.234"
				},
				"port": {
					"type": "integer",
					"example": 80,
					"description": "测试节点端口",
					"minimum": 0,
					"maximum": 65535
				}
			}
		},
		"debug.monitor_test_post_resp": {
			"type": "object",
			"description": "发起监视器探测请求的返回值",
			"properties": {}
		},
		"debug.monitor_test_delete_resp": {
			"type": "object",
			"description": "删除监视器探测任务",
			"properties": {}
		},
		"debug.monitor_test_get_resp": {
			"type": "object",
			"description": "",
			"properties": {
				"monitor_err": {
					"type": "array",
					"description": "查询监视器探测的结果",
					"items": {
						"description": "查询监视器探测的结果",
						"type": "object",
						"properties": {
							"name": {
								"type": "string",
								"description": "监视器名称"
							},
							"state": {
								"type": "string",
								"description": "监视器探测状态"
							},
							"req_times": {
								"type": "integer",
								"description": "监视器探测请求次数"
							},
							"is_running": {
								"type": "boolean",
								"description": "监视器探测请求是否还在运行"
							},
							"rs_mon_fault_type": {
								"type": "array",
								"description": "监视器故障类型",
								"items": {
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