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
		"/api/ad/v3/stat/net/link/wan/": {
			"description": "获取所有WAN口链路详细统计信息",
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
				"summary": "get all link-wan statistics",
				"description": "获取所有WAN口链路详细统计信息",
				"operationId": "get_statistics_of_link_wan_list",
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
						"$ref": "#/responses/operation_stat_link_wan_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/wan/{name}": {
			"description": "获取指定WAN口链路详细统计信息",
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
					"link-wan"
				],
				"summary": "get specific link-wan statistics",
				"description": "获取指定WAN口链路详细统计信息",
				"operationId": "get_statistics_of_link_wan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_link_wan_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/wan/{name}/{item}": {
			"description": "获取指定WAN口链路详细统计信息",
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
					"$ref": "#/parameters/stat.item_link_wan"
				}
			],
			"get": {
				"tags": [
					"link-wan"
				],
				"summary": "get specific link-wan statistics",
				"description": "获取指定WAN口链路详细统计信息",
				"operationId": "get_statistics_of_link_wan_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/wan-summary": {
			"description": "获取WAN口链路概要信息",
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
					"link-wan"
				],
				"summary": "get link-wan summary statistics",
				"description": "获取WAN口链路概要信息",
				"operationId": "get_statistics_of_link_wan_summary",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_link_wan_summary_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/wan-summary/{item}": {
			"description": "获取WAN口链路概要信息",
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
					"$ref": "#/parameters/stat.item_link_wan_summary"
				}
			],
			"get": {
				"tags": [
					"link-wan"
				],
				"summary": "get link-wan summary statistics",
				"description": "获取WAN口链路概要信息",
				"operationId": "get_statistics_of_link_wan_summary_trend",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/wan-each/{item}": {
			"description": "获取WAN口链路统计信息",
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
					"$ref": "#/parameters/stat.item_link_wan"
				}
			],
			"get": {
				"tags": [
					"link-wan"
				],
				"summary": "get each link-wan statistics",
				"description": "获取WAN口链路统计信息",
				"operationId": "get_statistics_of_each_link_wan_trend_multiple",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend_multiple"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/wan-application-throughput": {
			"description": "获取WAN口链路的应用流量信息",
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
				}
			],
			"get": {
				"tags": [
					"link-wan"
				],
				"summary": "get link-wan application-throughput",
				"description": "获取WAN口链路的应用流量信息",
				"operationId": "get_link_wan_summary_application_throughput",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_link_wan_summary_application_throughput"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_link_wan_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_wan_detail_list"
			}
		},
		"operation_stat_link_wan_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_wan_detail"
			}
		},
		"operation_stat_link_wan_summary_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_wan_summary_detail"
			}
		},
		"operation_stat_link_wan_summary_application_throughput": {
			"description": "Display event with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_wan_application_throughput"
			}
		}
	},
	"parameters": {
		"stat.item_link_wan": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "链路概要信息（health/健康状态，connection-rate/链路访问次数，upstream-throughput/上行流量，downstream-throughput/下行流量，general-throughput/总流量，general-bandwidth-usage/带宽利用率）",
			"enum": [
				"health",
				"connection-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput",
				"general-bandwidth-usage"
			]
		},
		"stat.item_link_wan_summary": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "链路概要信息（health/健康状态，connection-rate/链路访问次数，upstream-throughput/上行流量，downstream-throughput/下行流量，general-throughput/总流量）",
			"enum": [
				"health",
				"connection-rate",
				"upstream-throughput",
				"downstream-throughput",
				"general-throughput"
			]
		}
	},
	"definitions": {
		"stat.link_wan_detail_list": {
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
						"$ref": "#/definitions/stat.link_wan_detail"
					}
				}
			}
		},
		"stat.link_wan_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "链路名称",
					"example": ""
				},
				"state": {
					"type": "string",
					"description": "链路启用/禁用状态",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE"
				},
				"interface": {
					"type": "object",
					"properties": null,
					"description": "链路网口信息"
				},
				"health": {
					"type": "string",
					"description": "链路健康状态（normal-正常/busy-繁忙/failure-故障）",
					"enum": [
						"NORMAL",
						"FAILURE",
						"BUSY"
					],
					"example": "NORMAL"
				},
				"failure_reason": {
					"type": "string",
					"description": "链路故障原因",
					"example": ""
				},
				"upstream_bandwidth_mbps": {
					"type": "integer",
					"description": "上行带宽",
					"example": 100
				},
				"downstream_bandwidth_mbps": {
					"type": "integer",
					"description": "下行带宽",
					"example": 100
				},
				"connection_rate": {
					"description": "访问次数实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_throughput": {
					"description": "上行流量实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行流量实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "总流量实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_bandwidth_usage": {
					"description": "总带宽使用率",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"netns": {
					"type": "string",
					"default": "nenns名称",
					"description": "netns名称"
				}
			}
		},
		"stat.link_wan_summary_detail": {
			"type": "object",
			"properties": {
				"link_wan_count": {
					"type": "object",
					"description": "链路数量",
					"properties": {
						"state": {
							"type": "object",
							"description": "链路启用/禁用状态",
							"properties": {
								"enable": {
									"type": "integer",
									"description": "链路启用"
								},
								"disable": {
									"type": "integer",
									"description": "链路禁用"
								}
							}
						},
						"health": {
							"type": "object",
							"description": "链路健康状态（normal-正常/busy-繁忙/failure-故障）",
							"properties": {
								"normal": {
									"type": "integer",
									"description": "链路正常"
								},
								"failure": {
									"type": "integer",
									"description": "链路故障"
								},
								"busy": {
									"type": "integer",
									"description": "链路繁忙"
								}
							}
						}
					}
				},
				"connection_rate": {
					"description": "访问次数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"upstream_throughput": {
					"description": "上行流量实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"downstream_throughput": {
					"description": "下行流量实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				},
				"general_throughput": {
					"description": "总流量实时统计",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
				}
			}
		},
		"stat.link_wan_application_throughput": {
			"type": "object",
			"properties": {
				"application": {
					"type": "array",
					"description": "链路应用信息统计",
					"items": {
						"type": "object",
						"properties": {
							"type": {
								"type": "string",
								"description": "应用类型",
								"enum": [
									"GAME",
									"VIDEO",
									"BANK",
									"OTHER"
								],
								"example": "OTHER"
							},
							"link": {
								"type": "array",
								"description": "应用流量",
								"items": {
									"type": "object",
									"properties": {
										"name": {
											"type": "string",
											"description": "链路名称",
											"example": "WAN_2"
										},
										"general_throughput": {
											"description": "应用流量",
											"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
										}
									}
								}
							},
							"general_throughput": {
								"description": "链路总流量",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
							}
						}
					}
				},
				"link": {
					"type": "array",
					"description": "链路信息列表",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"type": "string",
								"example": "",
								"description": "链路名称"
							},
							"application": {
								"type": "array",
								"description": "应用信息统计列表",
								"items": {
									"type": "object",
									"properties": {
										"type": {
											"type": "string",
											"description": "应用类型",
											"enum": [
												"GAME",
												"VIDEO",
												"BANK",
												"OTHER"
											],
											"example": "OTHER"
										},
										"general_throughput": {
											"description": "应用流量",
											"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
										}
									}
								}
							},
							"general_throughput": {
								"description": "链路总流量",
								"$ref": "/api/{common}.yaml#/definitions/stat.statistic_instant"
							}
						}
					}
				}
			}
		}
	}
}