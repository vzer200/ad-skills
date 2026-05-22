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
		"/api/ad/v3/log/operation-log/": {
			"description": "查看管理日志",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"operation-log"
				],
				"summary": "retrieve operation-log",
				"description": "查看管理日志",
				"operationId": "retrieve_operation_log_list",
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
						"$ref": "#/parameters/accsee_type"
					},
					{
						"$ref": "#/parameters/source_address"
					},
					{
						"$ref": "#/parameters/username"
					},
					{
						"$ref": "#/parameters/module"
					},
					{
						"$ref": "#/parameters/method"
					},
					{
						"$ref": "#/parameters/result"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_operation_log_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": " list log operation-log source_address 192.168.1.1 username admin module [ stat slb lc dns rc net ha other ] method [ put patch delete post ] accsee_type [ web-console system ] from '2019-07-01 12:20:00' to '2019-07-15 01:00:00'",
					"description": "查看从2019-07-01 12:20:00到2019-07-15 01:00:00，用户admin(源IP为192.168.1.1)，通过web控制台和系统，操控设备产生的所有管理日志"
				}
			]
		},
		"/api/ad/v3/log/operation-log/package": {
			"description": "归档管理日志",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"operation-log"
				],
				"summary": "export operation-log package",
				"description": "归档管理日志",
				"operationId": "export_operation_log_package",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			}
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
		"accsee_type": {
			"name": "accsee_type",
			"in": "query",
			"required": false,
			"type": "array",
			"items": {
				"type": "string",
				"enum": [
					"WEB-CONSOLE",
					"SSH-CONSOLE",
					"RESTFUL-API",
					"SYSTEM"
				],
				"example": "WEB-CONSOLE"
			},
			"description": "可选参数；操作方式（web-console-Web控制台/ssh-console-命令行/restful-api-REST API/system-系统），即用户接入设备的方式；不输入该参数，默认输出所有操作方式日志"
		},
		"source_address": {
			"name": "source_address",
			"in": "query",
			"required": false,
			"type": "string",
			"example": "100.25.12.32",
			"description": "可选参数；用户的源IP地址；不输入该参数，默认输出所有源IP地址日志"
		},
		"username": {
			"name": "username",
			"in": "query",
			"required": false,
			"type": "string",
			"example": "guest",
			"description": "可选参数；用户的名称；不输入该参数，默认输出所有用户产生的日志"
		},
		"module": {
			"name": "module",
			"in": "query",
			"required": false,
			"type": "array",
			"description": "可选参数；日志所属模块（stat-运行概览/slb-应用负载/lc-链路负载/dns-全局负载/rc-资源管理/net-网络部署/sys-系统管理/ha-高可用性/other-其他）；默认为全选",
			"items": {
				"type": "string",
				"enum": [
					"STAT",
					"SLB",
					"LC",
					"DNS",
					"RC",
					"NET",
					"SYS",
					"HA"
				],
				"example": "HA"
			},
			"example": [
				"SLB",
				"NET",
				"SYS"
			]
		},
		"method": {
			"name": "method",
			"in": "query",
			"required": false,
			"type": "array",
			"description": "可选参数；操作类型（put path-编辑/post-创建/delete-删除）；默认为全选",
			"items": {
				"type": "string",
				"enum": [
					"GET",
					"POST",
					"PUT",
					"PATCH",
					"DELETE"
				],
				"example": "PATCH"
			}
		},
		"result": {
			"name": "result",
			"in": "query",
			"description": "只读参数；指示产生该条日志的操作成功或者失败",
			"required": false,
			"type": "integer",
			"example": 400
		}
	},
	"responses": {
		"operation_debug_operation_log_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.operation_log_list"
			}
		},
		"operation_debug_operation_log": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.operation_log_row"
			}
		}
	},
	"definitions": {
		"debug.operation_log_list": {
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
						"$ref": "#/definitions/debug.operation_log_row"
					}
				}
			}
		},
		"debug.operation_log_row": {
			"type": "object",
			"properties": {
				"operation_log_id": {
					"description": "管理日志ID",
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
				"accsee_type": {
					"description": "操作方式",
					"type": "string",
					"enum": [
						"WEB-CONSOLE",
						"SSH-CONSOLE",
						"RESTFUL-API"
					]
				},
				"source_address": {
					"description": "用户源IP地址",
					"type": "string",
					"example": "127.0.0.1"
				},
				"username": {
					"description": "用户名",
					"type": "string",
					"example": "admin"
				},
				"method": {
					"description": "操作类型",
					"type": "string",
					"enum": [
						"GET",
						"POST",
						"PUT",
						"PATCH",
						"DELETE"
					],
					"example": "PATCH"
				},
				"path": {
					"description": "该配置对应的API地址",
					"type": "string",
					"example": "/api/slb/virtual-service/vs_1"
				},
				"module": {
					"description": "日志所属模块",
					"type": "string",
					"enum": [
						"STAT",
						"SLB",
						"LC",
						"DNS",
						"RC",
						"NET",
						"SYS",
						"HA"
					],
					"example": "HA"
				},
				"description": {
					"description": "描述",
					"type": "string",
					"example": "Modify VIRTUAL-SERVICE: vs_http_8080"
				},
				"command": {
					"description": "命令行的命令",
					"type": "string",
					"example": "modify slb virtual-service vs_http_8080 port [ 8080 ]"
				},
				"result": {
					"description": "命令执行结果",
					"type": "string",
					"enum": [
						"SUCCESS",
						"FAILURE"
					],
					"example": "FAILURE"
				},
				"detail": {
					"description": "日志详情",
					"type": "string",
					"example": "{ before: { port: [ 80, 8080 ] }, after: { port: [ 8080 ] } }"
				}
			}
		}
	}
}