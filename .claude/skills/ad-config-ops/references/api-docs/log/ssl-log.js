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
		"/api/ad/v3/log/ssl-log/": {
			"description": "查看SSL日志",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"ssl-log"
				],
				"summary": "retrieve ssl-log",
				"description": "查看SSL日志",
				"operationId": "retrieve_ssl_log_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/search"
					},
					{
						"$ref": "#/parameters/from"
					},
					{
						"$ref": "#/parameters/to"
					},
					{
						"$ref": "#/parameters/type"
					},
					{
						"$ref": "#/parameters/source_address"
					},
					{
						"$ref": "#/parameters/destination_address"
					},
					{
						"$ref": "#/parameters/object"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_ssl_log_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list log ssl-log from '2019-07-01 12:20:00' to '2019-07-15 01:00:00' source_address 192.168.1.1 destination_address 192.168.2.1 type zxc object zxc",
					"description": "查看从2019-07-01 12:20:00到2019-07-15 01:00:00，源IP为192.168.1.1和目的IP为192.168.2.1，类型为zxc，虚拟服务为zxc的ssl日志"
				}
			]
		}
	},
	"parameters": {
		"from": {
			"name": "from",
			"in": "query",
			"type": "string",
			"required": false,
			"description": "可选参数；日志查看查询周期的起始时间，当配置了查询周期结束时间（to）时必须配置；不配置时默认为输出当天（系统时间）日志；格式为: YYYY-MM-DD hh:mm:ss"
		},
		"to": {
			"name": "to",
			"in": "query",
			"type": "string",
			"required": false,
			"description": "可选参数；日志查看查询周期的结束时间。格式为: YYYY-MM-DD hh:mm:ss"
		},
		"type": {
			"name": "type",
			"in": "query",
			"required": false,
			"type": "string",
			"description": "可选参数；类型;不填默认显示包含所有类型的日志"
		},
		"source_address": {
			"name": "source_address",
			"in": "query",
			"required": false,
			"type": "string",
			"example": "100.25.12.32",
			"description": "可选参数；源IP地址；不填默认显示包含所有源IP地址的日志"
		},
		"destination_address": {
			"name": "destination_address",
			"in": "query",
			"required": false,
			"type": "string",
			"example": "100.25.12.32",
			"description": "可选参数；目的IP地址；不填默认显示包含所有目的IP地址的日志"
		},
		"object": {
			"name": "object",
			"in": "query",
			"required": false,
			"type": "string",
			"example": "vs_hhtp_80",
			"description": "可选参数；虚拟服务名称；不填默认显示所有虚拟服务参数的日志"
		}
	},
	"responses": {
		"operation_debug_ssl_log_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.ssl_log_list"
			}
		},
		"operation_debug_ssl_log": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.ssl_log_row"
			}
		}
	},
	"definitions": {
		"debug.ssl_log_list": {
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
					"description": "当前项目",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.ssl_log_row"
					}
				}
			}
		},
		"debug.ssl_log_row": {
			"type": "object",
			"properties": {
				"ssl_log_id": {
					"description": "SSL日志ID",
					"type": "integer"
				},
				"date": {
					"description": "日期",
					"type": "string",
					"example": "YYYY-MM-DD"
				},
				"time": {
					"description": "时间",
					"type": "string",
					"example": "hh:mm:ss"
				},
				"type": {
					"description": "类型",
					"type": "string",
					"example": ""
				},
				"source_address": {
					"description": "源地址",
					"type": "string",
					"example": "{IP}"
				},
				"destination_address": {
					"description": "目的地址",
					"type": "string",
					"example": "{IP}"
				},
				"detail": {
					"description": "详细信息",
					"type": "string",
					"example": ""
				}
			}
		}
	}
}