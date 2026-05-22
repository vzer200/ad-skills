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
		"/api/ad/v3/debug/net/tcpdump/record/": {
			"description": "抓包文件操作",
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
					"tcpdump"
				],
				"summary": "get all tcpdump",
				"description": "查询全部抓包文件",
				"operationId": "get_tcpdump_list",
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
						"$ref": "#/responses/operation_debug_tcpdump_file_list"
					}
				}
			}
		},
		"/api/ad/v3/debug/net/tcpdump/record/{name}": {
			"description": "抓包文件操作",
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
					"tcpdump"
				],
				"summary": "get specific tcpdump",
				"description": "查询具体抓包文件",
				"operationId": "get_specific_tcpdump",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_tcpdump_file_object"
					}
				}
			},
			"delete": {
				"tags": [
					"tcpdump"
				],
				"summary": "delete specific tcpdump",
				"description": "查询具体抓包文件",
				"operationId": "delete_tcpdump",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_tcpdump_file_object"
					}
				}
			}
		},
		"/api/ad/v3/debug/net/tcpdump/record/{name}/pcap": {
			"description": "抓包文件操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				}
			],
			"get": {
				"tags": [
					"tcpdump"
				],
				"summary": "download specific tcpdump",
				"description": "下载抓包文件",
				"operationId": "download_specific_tcpdump",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				}
			}
		},
		"/api/ad/v3/debug/net/tcpdump/capture-controller/": {
			"description": "TCPDUMP抓包任务操作",
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
					"tcpdump"
				],
				"summary": "get all tcpdump capture-controller",
				"description": "查询TCPDUMP抓包任务列表",
				"operationId": "get_tcpdump_capture_controller_list",
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
						"$ref": "#/responses/operation_debug_tcpdump_controller_list"
					}
				}
			},
			"post": {
				"tags": [
					"tcpdump"
				],
				"summary": "start tcpdump capture-controller",
				"description": "启动TCPDUMP抓包任务",
				"operationId": "start_tcpdump_capture_controller",
				"parameters": [
					{
						"$ref": "#/parameters/TCPDUMP-DEBUG-OPTION"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_tcpdump_controller"
					}
				}
			}
		},
		"/api/ad/v3/debug/net/tcpdump/capture-controller/{task_id}": {
			"description": "TCPDUMP抓包任务操作",
			"parameters": [
				{
					"$ref": "#/parameters/task_id"
				}
			],
			"get": {
				"tags": [
					"tcpdump"
				],
				"summary": "get tcpdump capture-controller",
				"description": "查询具体TCPDUMP抓包任务",
				"operationId": "get_tcpdump_capture_controller",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_tcpdump_controller"
					}
				}
			},
			"delete": {
				"tags": [
					"tcpdump"
				],
				"summary": "stop tcpdump capture-controller",
				"description": "停止具体TCPDUMP抓包任务",
				"operationId": "stop_tcpdump_capture_controller",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_tcpdump_controller"
					}
				}
			}
		}
	},
	"parameters": {
		"TCPDUMP-DEBUG-OPTION": {
			"name": "TCPDUMP-DEBUG",
			"in": "body",
			"required": true,
			"description": "JSON Debug Properties",
			"schema": {
				"$ref": "#/definitions/debug.tcpdump_capture"
			}
		},
		"task_id": {
			"name": "task_id",
			"in": "query",
			"required": true,
			"type": "integer"
		}
	},
	"responses": {
		"operation_debug_tcpdump_file_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.tcpdump_list"
			}
		},
		"operation_debug_tcpdump_file_object": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.tcpdump_entry"
			}
		},
		"operation_debug_tcpdump_controller": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.tcpdump_capture_status"
			}
		},
		"operation_debug_tcpdump_controller_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.tcpdump_capture_status_list"
			}
		}
	},
	"definitions": {
		"debug.tcpdump_list": {
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
					"description": "抓包文件列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.tcpdump_entry"
					}
				}
			}
		},
		"debug.tcpdump_entry": {
			"type": "object",
			"properties": {
				"file_name": {
					"type": "string",
					"example": "2017-12-11-102222_eth4_tcpdump.pcap",
					"description": "抓包文件名称"
				},
				"file_size_byte": {
					"type": "integer",
					"example": 8912001,
					"description": "抓包文件大小"
				},
				"last_modify": {
					"type": "string",
					"description": "抓包文件最近修改时间"
				}
			}
		},
		"debug.tcpdump_capture": {
			"type": "object",
			"properties": {
				"maximum_count": {
					"type": "integer",
					"example": 4096,
					"description": "最大抓包数,必须为1~10000之间的整数",
					"minimum": 1,
					"maximum": 10000,
					"default": 4096
				},
				"interfaces": {
					"type": "array",
					"description": "引用网口",
					"items": {
						"type": "object",
						"description": "引用网口",
						"properties": {
							"type": {
								"type": "string",
								"description": "网口类型",
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
								"description": "Format: ALL | {PHYSICAL} | {BOND} | {VLAN} | {BRIDGE}",
								"example": "bond-134"
							}
						}
					},
					"maxItems": 8
				},
				"timeout": {
					"type": "integer",
					"default": 600,
					"description": "最大抓包时间",
					"minimum": 60,
					"maximum": 86400
				},
				"option": {
					"type": "string",
					"description": "过滤表达式,不能包含& | \" ' , % < > / \\等特殊字符",
					"example": "host 200.200.0.1 and port 80"
				}
			}
		},
		"debug.tcpdump_capture_status_list": {
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
					"description": "抓包状态列表",
					"items": {
						"$ref": "#/definitions/debug.tcpdump_capture_status"
					}
				}
			}
		},
		"debug.tcpdump_capture_status": {
			"type": "object",
			"properties": {
				"task_id": {
					"type": "integer",
					"description": "抓包任务id"
				},
				"option": {
					"type": "string",
					"example": "host 200.200.0.1 and port 80",
					"description": "抓包过滤字符串"
				},
				"file_name": {
					"type": "string",
					"description": "抓包文件名称"
				}
			}
		}
	}
}