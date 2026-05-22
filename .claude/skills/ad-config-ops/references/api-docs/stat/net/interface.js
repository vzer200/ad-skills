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
		"/api/ad/v3/stat/net/interface": {
			"description": "获取网口信息",
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
					"interface"
				],
				"summary": "get all interface statistics",
				"description": "获取网口信息",
				"operationId": "get_statistics_of_interface_list",
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
						"$ref": "#/responses/operation_stat_interface_detail_list"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_interface_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.interface_detail_list"
			}
		},
		"operation_stat_interface_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.interface_detail"
			}
		}
	},
	"definitions": {
		"stat.interface_detail_list": {
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
						"$ref": "#/definitions/stat.interface_detail"
					}
				}
			}
		},
		"stat.interface_detail": {
			"type": "object",
			"properties": {
				"name": {
					"description": "设备名称",
					"type": "string",
					"example": "eth1"
				},
				"cable": {
					"description": "插拔线状态（PLUG-IN-插线/PLUG-OUT-未插线）",
					"type": "string",
					"enum": [
						"PLUG-IN",
						"PLUG-OUT"
					],
					"example": "PLUG-IN"
				},
				"upstream_data": {
					"description": "发送数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_data": {
					"description": "接收数据",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_packet": {
					"description": "发送数据包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_packet": {
					"description": "接收数据包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_error_packet": {
					"description": "发送错误包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_error_packet": {
					"description": "接收错误包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"upstream_drop_packet": {
					"description": "发送丢包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"downstream_drop_packet": {
					"description": "接收丢包",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				}
			}
		}
	}
}