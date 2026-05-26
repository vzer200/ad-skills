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
		"/api/ad/v3/stat/net/link/lan/": {
			"description": "获取所有LAN口链路详细统计信息",
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
					"link-lan"
				],
				"summary": "get all link-lan statistics",
				"description": "获取所有LAN口详细统计信息",
				"operationId": "get_statistics_of_link_lan_list",
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
						"$ref": "#/responses/operation_stat_link_lan_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/lan/{name}": {
			"description": "获取指定LAN口链路详细统计信息",
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
					"link-lan"
				],
				"summary": "get specific link-lan statistics",
				"description": "获取指定LAN口链路详细统计信息",
				"operationId": "get_statistics_of_link_lan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_link_lan_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/link/lan-summary": {
			"description": "获取LAN口链路概要信息",
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
					"link-lan"
				],
				"summary": "get link-wan summary statistics",
				"description": "获取LAN口链路概要信息",
				"operationId": "get_statistics_of_link_wan_summary",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_link_lan_summary_detail"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_link_lan_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_lan_detail_list"
			}
		},
		"operation_stat_link_lan_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_lan_detail"
			}
		},
		"operation_stat_link_lan_summary_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.link_lan_summary_detail"
			}
		}
	},
	"definitions": {
		"stat.link_lan_detail_list": {
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
						"$ref": "#/definitions/stat.link_lan_detail"
					}
				}
			}
		},
		"stat.link_lan_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"example": "",
					"description": "链路名称"
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
					"description": "链路网口信息",
					"properties": {
						"type": {
							"type": "string",
							"description": "链路网口类型",
							"enum": [
								"PHYSICAL",
								"BOND",
								"VLAN",
								"BRIDGE"
							],
							"example": "VLAN"
						},
						"interface": {
							"type": "string",
							"description": "链路网口名称",
							"example": "bond-134"
						}
					}
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
				"netns": {
					"type": "string",
					"default": "netns名称",
					"description": "netns名称"
				}
			}
		},
		"stat.link_lan_summary_detail": {
			"type": "object",
			"properties": {
				"link_lan": {
					"type": "object",
					"description": "LAN口链路信息",
					"properties": {
						"state": {
							"type": "object",
							"description": "链路启用/禁用状态",
							"properties": {
								"enable": {
									"type": "array",
									"description": "链路启用状态",
									"items": {
										"type": "string"
									}
								},
								"disable": {
									"type": "array",
									"description": "链路禁用状态",
									"items": {
										"type": "string"
									}
								}
							}
						},
						"health": {
							"type": "object",
							"description": "链路健康状态（normal-正常/busy-繁忙/failure-故障）",
							"properties": {
								"normal": {
									"type": "array",
									"description": "链路启用状态",
									"items": {
										"type": "string"
									}
								},
								"failure": {
									"type": "array",
									"description": "链路禁用状态",
									"items": {
										"type": "string"
									}
								}
							}
						}
					}
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
		}
	}
}