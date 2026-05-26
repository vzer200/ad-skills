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
		"/api/ad/v3/stat/dns/data-center/{data_center_name}/local-device/": {
			"description": "查询指定数据中心local-device的统计信息",
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
					"local-device"
				],
				"summary": "get all local-device statistics on data-center",
				"description": "查询指定数据中心local-device的统计信息",
				"operationId": "get_statistics_of_local_device_list_data_center",
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
						"$ref": "#/responses/operation_stat_local_device_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}": {
			"description": "查询local-device内某服务设备的统计信息",
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
					"$ref": "#/parameters/data_center_name"
				}
			],
			"get": {
				"tags": [
					"local-device"
				],
				"summary": "get specific local-device statistics on data-center",
				"description": "查询local-device的e内某服务设备的统计信息",
				"operationId": "get_statistics_of_local_device_data_center",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_local_device_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/{item}": {
			"description": "查询local-device内某服务设备的统计信息",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/trend"
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
					"$ref": "#/parameters/data_center_name"
				},
				{
					"$ref": "#/parameters/item_local_device"
				}
			],
			"get": {
				"tags": [
					"local-device"
				],
				"summary": "get specific local-device statistics on data-center",
				"description": "查询local-device内某服务设备的统计信息",
				"operationId": "get_statistics_of_local_device_trend_data_center",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/virtual-service/": {
			"description": "查询local-device内某服务设备的虚拟服务的统计信息",
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
					"$ref": "#/parameters/local_device_name"
				},
				{
					"$ref": "#/parameters/data_center_name"
				}
			],
			"get": {
				"tags": [
					"local-device"
				],
				"summary": "get all local-device statistics on data-center",
				"description": "查询local-device内某服务设备的虚拟服务的统计信息",
				"operationId": "get_statistics_of_local_device_list_data_center",
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
						"$ref": "#/responses/operation_stat_local_device_virtual_service_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/virtual-service/{virtual_service_name}": {
			"description": "查询local-device内某服务设备的某个虚拟服务的统计信息",
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
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "#/parameters/local_device_name"
				},
				{
					"$ref": "#/parameters/data_center_name"
				}
			],
			"get": {
				"tags": [
					"local-device"
				],
				"summary": "get specific virtual-service statistics on data-center",
				"description": "查询local-device内某服务设备的某个虚拟服务的统计信息",
				"operationId": "get_statistics_of_virtual_service_data_center",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_local_device_virtual_service_detail"
					}
				}
			}
		},
		"/api/ad/v3/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/virtual-service/{virtual_service_name}/{item}": {
			"description": "查询local-device内某服务设备的某个虚拟服务的统计信息",
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
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "#/parameters/local_device_name"
				},
				{
					"$ref": "#/parameters/data_center_name"
				},
				{
					"$ref": "#/parameters/item_virtual_service"
				}
			],
			"get": {
				"tags": [
					"local-device"
				],
				"summary": "get specific virtual-service statistics on data-center",
				"description": "查询local-device内某服务设备的某个虚拟服务的统计信息",
				"operationId": "get_statistics_of_virtual_service_trend_data_center",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_stat_trend"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_local_device_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.local_device_detail_list"
			}
		},
		"operation_stat_local_device_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.local_device_detail"
			}
		},
		"operation_stat_local_device_virtual_service_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.local_device_virtual_service_detail_list"
			}
		},
		"operation_stat_local_device_virtual_service_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.local_device_virtual_service_detail"
			}
		}
	},
	"parameters": {
		"data_center_name": {
			"name": "data_center_name",
			"in": "path",
			"type": "string",
			"description": "数据中心名称",
			"required": true
		},
		"local_device_name": {
			"name": "local_device_name",
			"in": "path",
			"type": "string",
			"description": "本地服务设备名称",
			"required": true
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "虚拟服务名称",
			"required": true
		},
		"item_local_device": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "服务设备列表",
			"enum": [
				"cpu-usage",
				"connection",
				"connection-rate",
				"general-throughput"
			]
		},
		"item_virtual_service": {
			"name": "item",
			"in": "path",
			"type": "string",
			"description": "虚拟服务列表",
			"enum": [
				"connection",
				"connection-rate",
				"general-throughput"
			]
		}
	},
	"definitions": {
		"stat.local_device_detail_list": {
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
						"$ref": "#/definitions/stat.local_device_detail"
					}
				}
			}
		},
		"stat.local_device_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "本地设备名称",
					"example": "dc1_ad2"
				},
				"virtual_service": {
					"type": "object",
					"description": "虚拟服务统计信息",
					"properties": {
						"total": {
							"type": "integer",
							"description": "虚拟服务数量",
							"example": 2
						},
						"health": {
							"type": "object",
							"description": "虚拟服务健康状态",
							"properties": {
								"normal": {
									"type": "array",
									"description": "正常状态",
									"items": {
										"type": "string"
									},
									"example": [
										"vs_portal_80",
										"vs_oa_8080"
									]
								},
								"failure": {
									"type": "array",
									"description": "故障",
									"items": {
										"type": "string"
									}
								}
							}
						}
					}
				}
			}
		},
		"stat.local_device_virtual_service_detail_list": {
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
						"$ref": "#/definitions/stat.local_device_virtual_service_detail"
					}
				}
			}
		},
		"stat.local_device_virtual_service_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "虚拟服务名称",
					"example": "vs_http_8080"
				},
				"health": {
					"type": "string",
					"description": "虚拟服务健康状态（NORMAL-正常/FAILURE-故障）",
					"enum": [
						"NORMAL",
						"FAILURE"
					]
				},
				"failure_reason": {
					"type": "string",
					"description": "虚拟服务故障原因",
					"example": ""
				},
				"addresses": {
					"type": "array",
					"description": "虚拟服务ip",
					"items": {
						"type": "string",
						"example": "200.200.0.87"
					}
				},
				"port": {
					"type": "integer",
					"description": "虚拟服务端口",
					"example": 8080
				},
				"protocol": {
					"type": "string",
					"description": "虚拟服务的协议",
					"example": "TCP"
				},
				"vip_ports": {
					"type": "array",
					"description": "虚拟服务IP和端口",
					"items": {
						"type": "object",
						"properties": {
							"address": {
								"type": "string",
								"description": "虚拟服务ip",
								"example": "200.200.0.87"
							},
							"port": {
								"type": "integer",
								"description": "虚拟服务端口",
								"example": 8080
							},
							"protocol": {
								"type": "string",
								"description": "虚拟服务的协议",
								"example": "TCP"
							}
						}
					}
				}
			}
		}
	}
}