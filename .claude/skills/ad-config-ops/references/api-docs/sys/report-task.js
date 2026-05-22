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
		"/api/ad/v3/sys/report-task/": {
			"description": "查看、修改报表定制配置",
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
					"report-task"
				],
				"summary": "get all report-task",
				"description": "查看当前已有的报表定制信息",
				"operationId": "get_report_task_list",
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
						"$ref": "#/responses/operation_config_report_task_list"
					}
				}
			},
			"post": {
				"tags": [
					"report-task"
				],
				"summary": "create new report-task",
				"description": "新建报表定制配置",
				"operationId": "add_report_task_list",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-TASK-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_task_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys report-task",
					"description": "查看报表定制配置"
				},
				{
					"command": "create sys report-task example description ad_information link_analysis { dimensions add [ connection-rate downstream-throughput general-bandwidth-usage general-throughput health upstream-throughput ] objects add [ lan ] } virtual_service_analysis { dimensions add [ connection-rate downstream-throughput general-throughput health upstream-throughput ] objects add [ test ] } pool_analysis { dimensions add [ connection connection-rate downstream-throughput general-throughput health upstream-throughput ] objects add [ test ] } policy daily dns_analysis { dimensions add [ data-center-query-rate local-dns-query-rate source-address-analysis source-address-defect vip-pool-query-rate ] global_objects add [ g_zxc ] local_objects add [ zxc ] } policy_route_analysis { dimensions add [ connection-rate downstream-throughput general-throughput upstream-throughput ] } ha_analysis { dimensions add [ cluster ] }",
					"description": "创建报表样式配置，名称为example，描述为ad_information；并且根据sys report-mail配置进行每日（policy）上报；配置链路统计，统计链路lan各方面（dimensions）数据；配置虚拟服务统计，统计虚拟服务test方面（dimensions）数据；配置节点池统计，统计节点池test方面（dimensions）数据；配置智能dns统计，统计zxc(本地映射)和g_zxc(全局映射)（dimensions）数据；配置智能路由统计，统计各方面（dimensions）数据；"
				},
				{
					"command": "modify sys report-task example link_analysis { dimensions delete [ downstream-throughput ] objects delete [ lan ] }",
					"description": "修改报表样式example配置，统计数据类型删除downstream-throughput，统计的链路里删除lan"
				},
				{
					"command": "modify sys report-task example link_analysis { dimensions add [ downstream-throughput ] objects add [ lan ] }",
					"description": "修改报表样式example配置，统计数据类型增加downstream-throughput，统计的链路里增加lan"
				},
				{
					"command": " delete sys report-task example",
					"description": "删除报表样式example配置"
				}
			]
		},
		"/api/ad/v3/sys/report-task/{name}": {
			"description": "新建、查看、修改、删除指定的报表定制配置",
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
					"report-task"
				],
				"summary": "get specific report-task",
				"description": "查看指定的报表定制配置",
				"operationId": "get_report_task",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_task_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"report-task"
				],
				"summary": "create new report-task",
				"description": "新建指定的报表定制配置",
				"operationId": "create_report_task",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-TASK-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_task_object"
					}
				}
			},
			"put": {
				"tags": [
					"report-task"
				],
				"summary": "replace specific report-task",
				"description": "修改指定的报表定制配置",
				"operationId": "replace_report_task",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-TASK-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_task_object"
					}
				}
			},
			"patch": {
				"tags": [
					"report-task"
				],
				"summary": "modify specific report-task",
				"description": "修改指定的报表定制配置",
				"operationId": "edit_report_task",
				"parameters": [
					{
						"$ref": "#/parameters/REPORT-TASK-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_task_object"
					}
				}
			},
			"delete": {
				"tags": [
					"report-task"
				],
				"summary": "delete specific report-task",
				"description": "删除指定的报表定制配置",
				"operationId": "delete_report_task",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_report_task_object"
					}
				}
			}
		}
	},
	"parameters": {
		"REPORT-TASK-CONFIG": {
			"name": "REPORT-TASK-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.report_task"
			}
		},
		"REPORT-TASK-PROPERTY": {
			"name": "REPORT-TASK-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.report_task"
			}
		}
	},
	"responses": {
		"operation_config_report_task_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.report_task_list"
			}
		},
		"operation_config_report_task_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.report_task"
			}
		}
	},
	"definitions": {
		"config.report_task_list": {
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
						"$ref": "#/definitions/config.report_task"
					}
				}
			}
		},
		"config.report_task": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定报表样式的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "slb_week_report"
				},
				"description": {
					"type": "string",
					"description": "可选参数；附加的描述信息"
				},
				"policy": {
					"description": "可选参数；指定按照报表样式生成的报表的生成方式；manual-手动导出；按照间隔时间（daily-日/weekly-周/monthly-月/yearly-年），根据报表样式，将生成的报表根据report-mail配置发送到指定邮箱",
					"type": "string",
					"enum": [
						"MANUAL",
						"DAILY",
						"WEEKLY",
						"MONTHLY",
						"YEARLY"
					],
					"default": "MANUAL",
					"example": "MANUAL"
				},
				"link_analysis": {
					"description": "可选参数；链路统计",
					"type": "object",
					"properties": {
						"dimensions": {
							"description": "统计类型",
							"type": "array",
							"uniqueItems": true,
							"items": {
								"description": "可选参数；需要统计的数据类型（general-throughput-总流量/upstream-throughput-上行流量/downstream-throughput-下行流量/connection-rate-访问次数/general-bandwidth-usage-带宽利用率/health-稳定性）",
								"type": "string",
								"enum": [
									"GENERAL-THROUGHPUT",
									"UPSTREAM-THROUGHPUT",
									"DOWNSTREAM-THROUGHPUT",
									"GENERAL-BANDWIDTH-USAGE",
									"CONNECTION-RATE",
									"HEALTH"
								]
							}
						},
						"objects": {
							"description": "引用的链路",
							"type": "array",
							"items": {
								"description": "可选参数；配置需要统计数据的链路",
								"type": "string"
							}
						}
					},
					"required": []
				},
				"pool_analysis": {
					"description": "可选参数；节点池统计",
					"type": "object",
					"properties": {
						"dimensions": {
							"description": "统计类型",
							"type": "array",
							"uniqueItems": true,
							"items": {
								"description": "可选参数；需要统计的数据类型（general-throughput-总流量/upstream-throughput-上行流量/downstream-throughput-下行流量/connection-rate-访问次数/connection-并发连接数/health-稳定性）",
								"type": "string",
								"enum": [
									"GENERAL-THROUGHPUT",
									"UPSTREAM-THROUGHPUT",
									"DOWNSTREAM-THROUGHPUT",
									"CONNECTION-RATE",
									"CONNECTION",
									"HEALTH"
								]
							}
						},
						"objects": {
							"description": "引用的节点池",
							"type": "array",
							"items": {
								"description": "可选参数；配置需要统计的数据的节点池",
								"type": "string"
							}
						}
					},
					"required": []
				},
				"virtual_service_analysis": {
					"description": "可选参数；虚拟服务统计",
					"type": "object",
					"properties": {
						"dimensions": {
							"description": "统计类型",
							"type": "array",
							"uniqueItems": true,
							"items": {
								"description": "可选参数；需要统计的数据类型（general-throughput-总流量/upstream-throughput-上行流量/downstream-throughput-下行流量/connection-rate-访问次数/health-稳定性）",
								"type": "string",
								"enum": [
									"GENERAL-THROUGHPUT",
									"UPSTREAM-THROUGHPUT",
									"DOWNSTREAM-THROUGHPUT",
									"CONNECTION-RATE",
									"HEALTH"
								]
							}
						},
						"objects": {
							"description": "引用的虚拟服务",
							"type": "array",
							"items": {
								"description": "可选参数；配置需要统计数据的虚拟服务",
								"type": "string"
							}
						}
					},
					"required": []
				},
				"policy_route_analysis": {
					"description": "可选参数；智能路由统计",
					"type": "object",
					"properties": {
						"dimensions": {
							"description": "统计类型",
							"type": "array",
							"uniqueItems": true,
							"items": {
								"description": "可选参数；需要统计的数据类型（general-throughput-总流量/upstream-throughput-上行流量/downstream-throughput-下行流量/connection-rate-访问次数）",
								"type": "string",
								"enum": [
									"GENERAL-THROUGHPUT",
									"UPSTREAM-THROUGHPUT",
									"DOWNSTREAM-THROUGHPUT",
									"CONNECTION-RATE"
								]
							}
						}
					},
					"required": []
				},
				"dns_analysis": {
					"description": "可选参数；智能DNS统计",
					"type": "object",
					"properties": {
						"dimensions": {
							"description": "统计类型",
							"type": "array",
							"uniqueItems": true,
							"items": {
								"description": "可选参数；需要统计的数据类型（data-center-query-rate-数据中心/vip-pool-query-rate-虚拟IP池/local-dns-query-rate-LDNS集合/source-address-analysis-来源分布/source-address-defect-异常请求）",
								"type": "string",
								"enum": [
									"DATA-CENTER-QUERY-RATE",
									"VIP-POOL-QUERY-RATE",
									"LOCAL-DNS-QUERY-RATE",
									"SOURCE-ADDRESS-ANALYSIS",
									"SOURCE-ADDRESS-DEFECT"
								]
							}
						},
						"local_objects": {
							"description": "引用的本地dns映射",
							"type": "array",
							"items": {
								"description": "可选参数；需要统计数据的本地DNS映射名称",
								"type": "string"
							}
						},
						"global_objects": {
							"description": "引用的全局dns映射",
							"type": "array",
							"items": {
								"description": "可选参数；需要统计数据的全局DNS映射名称",
								"type": "string"
							}
						}
					},
					"required": []
				},
				"ha_analysis": {
					"description": "可选参数；高可用集群数据统计",
					"type": "object",
					"properties": {
						"dimensions": {
							"description": "可选参数；cluster-集群",
							"type": "array",
							"uniqueItems": true,
							"items": {
								"description": "统计类型",
								"type": "string",
								"enum": [
									"CLUSTER"
								]
							}
						}
					},
					"required": []
				}
			}
		}
	}
}