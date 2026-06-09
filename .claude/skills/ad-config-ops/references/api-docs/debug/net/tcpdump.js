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
				},
				"x-examples": {
					"request": {
						"summary": "get all tcpdump",
						"description": "查询全部抓包文件",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/net/tcpdump/record/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/net/tcpdump/record/ 响应",
						"description": "返回GET /api/ad/v3/debug/net/tcpdump/record/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"file_name": "2017-12-11-102222_eth4_tcpdump.pcap",
									"file_size_byte": 8912001,
									"last_modify": "example_string"
								}
							]
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "get specific tcpdump",
						"description": "查询具体抓包文件",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/net/tcpdump/record/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/net/tcpdump/record/{name} 响应",
						"description": "返回GET /api/ad/v3/debug/net/tcpdump/record/{name}的响应数据",
						"value": {
							"file_name": "2017-12-11-102222_eth4_tcpdump.pcap",
							"file_size_byte": 8912001,
							"last_modify": "example_string"
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "delete specific tcpdump",
						"description": "查询具体抓包文件",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/debug/net/tcpdump/record/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/debug/net/tcpdump/record/{name} 响应",
						"description": "返回DELETE /api/ad/v3/debug/net/tcpdump/record/{name}的响应数据",
						"value": {
							"file_name": "2017-12-11-102222_eth4_tcpdump.pcap",
							"file_size_byte": 8912001,
							"last_modify": "example_string"
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "download specific tcpdump",
						"description": "下载抓包文件",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/net/tcpdump/record/{name}/pcap"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/net/tcpdump/record/{name}/pcap 响应",
						"description": "返回GET /api/ad/v3/debug/net/tcpdump/record/{name}/pcap的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "get all tcpdump capture-controller",
						"description": "查询TCPDUMP抓包任务列表",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/net/tcpdump/capture-controller/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/net/tcpdump/capture-controller/ 响应",
						"description": "返回GET /api/ad/v3/debug/net/tcpdump/capture-controller/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"task_id": 0,
									"option": "host 200.200.0.1 and port 80",
									"file_name": "example_string"
								}
							]
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "start tcpdump capture-controller",
						"description": "启动TCPDUMP抓包任务",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/net/tcpdump/capture-controller/",
							"body": {
								"filename": "",
								"timeout": 600,
								"relate": "DISABLE",
								"count": 100000,
								"direction": "INOUT",
								"flow_type": "BOTH",
								"netns": "",
								"virtual_service": "",
								"condition": [
									{
										"type": "PHYSICAL",
										"ifname": "example_string",
										"interface": "example_string"
									}
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/net/tcpdump/capture-controller/ 响应",
						"description": "返回POST /api/ad/v3/debug/net/tcpdump/capture-controller/的响应数据",
						"value": {
							"task_id": 0,
							"option": "host 200.200.0.1 and port 80",
							"file_name": "example_string"
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "get tcpdump capture-controller",
						"description": "查询具体TCPDUMP抓包任务",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/net/tcpdump/capture-controller/{task_id}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/net/tcpdump/capture-controller/{task_id} 响应",
						"description": "返回GET /api/ad/v3/debug/net/tcpdump/capture-controller/{task_id}的响应数据",
						"value": {
							"task_id": 0,
							"option": "host 200.200.0.1 and port 80",
							"file_name": "example_string"
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "stop tcpdump capture-controller",
						"description": "停止具体TCPDUMP抓包任务",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/debug/net/tcpdump/capture-controller/{task_id}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/debug/net/tcpdump/capture-controller/{task_id} 响应",
						"description": "返回DELETE /api/ad/v3/debug/net/tcpdump/capture-controller/{task_id}的响应数据",
						"value": {
							"task_id": 0,
							"option": "host 200.200.0.1 and port 80",
							"file_name": "example_string"
						}
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
			"required": [
				"condition"
			],
			"properties": {
				"filename": {
					"type": "string",
					"description": "抓包文件名称，长度限制为0~63个字节，不能包含- _  . 以外的特殊字符",
					"title": "抓包文件名称",
					"maxLength": 64,
					"default": "",
					"example": "测试抓包"
				},
				"timeout": {
					"type": "integer",
					"description": "抓包超时时间，单位为秒,超时时间只支持整数输入，范围为60(1分钟)-2592000（30天）",
					"title": "抓包超时时间，单位为秒",
					"minimum": 60,
					"maximum": 2592000,
					"default": 600
				},
				"relate": {
					"type": "string",
					"description": "关联会话抓包启禁用",
					"title": "关联会话抓包启禁用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"loop": {
					"type": "object",
					"description": "循环抓包启禁用",
					"title": "循环抓包启禁用",
					"properties": {
						"state": {
							"type": "string",
							"description": "启用/禁用",
							"title": "启禁用",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"file_count": {
							"type": "integer",
							"description": "循环抓包文件数量，必须为2~200之间的整数",
							"title": "循环抓包文件数量",
							"minimum": 2,
							"maximum": 200,
							"default": 50
						},
						"file_size": {
							"type": "integer",
							"description": "循环抓包单个文件大小/MB，必须为1~100之间的整数",
							"title": "循环抓包单个文件大小/MB",
							"minimum": 1,
							"maximum": 100,
							"default": 20
						}
					}
				},
				"count": {
					"type": "integer",
					"description": "抓包数量，必须为1~1000000之间的整数",
					"title": "抓包数量",
					"minimum": 1,
					"maximum": 1000000,
					"default": 100000
				},
				"direction": {
					"type": "string",
					"description": "抓包方向，网口入方向、网口出方向或者双向",
					"title": "抓包方向，网口入方向、网口出方向或者双向",
					"enum": [
						"IN",
						"OUT",
						"INOUT"
					],
					"default": "INOUT",
					"example": "INOUT"
				},
				"flow_type": {
					"type": "string",
					"description": "抓包流量类型，请求方向流量、应答方向流量或者双向流量",
					"title": "抓包流量类型，客户端到服务端方向/服务端到客户端方向",
					"enum": [
						"BOTH",
						"ORIGINAL",
						"REPLY"
					],
					"default": "BOTH",
					"example": "BOTH"
				},
				"netns": {
					"type": "string",
					"description": "netns名称",
					"title": "netns名称",
					"maxLength": 512,
					"referSchema": "/net/netns",
					"format": "bypass",
					"default": "",
					"example": "default"
				},
				"virtual_service": {
					"type": "string",
					"description": "虚拟服务名称",
					"title": "虚拟服务名称",
					"referSchema": [
						"/slb/virtual-service/http",
						"/slb/virtual-service/tcp-proxy",
						"/slb/virtual-service/tcp-forward",
						"/slb/virtual-service/udp-forward",
						"/slb/virtual-service/udp-proxy",
						"/slb/virtual-service/ssl-offload",
						"/slb/virtual-service/ssl-offload-https",
						"/slb/virtual-service/dns",
						"/slb/virtual-service/ftp",
						"/slb/virtual-service/radius",
						"/slb/virtual-service/sip-tcp",
						"/slb/virtual-service/sip-udp",
						"/slb/virtual-service/8583",
						"/slb/virtual-service/ip",
						"/slb/virtual-service/any"
					],
					"format": "bypass",
					"maxLength": 512,
					"default": "",
					"example": "HTTP"
				},
				"condition": {
					"type": "array",
					"description": "抓包过滤条件",
					"title": "抓包过滤条件",
					"maxItems": 8,
					"minItems": 1,
					"items": {
						"type": "object",
						"required": [
							"type",
							"ifname",
							"interface"
						],
						"properties": {
							"type": {
								"type": "string",
								"description": "网口类型，可以是PHYSICAL、BOND、VLAN、BRIDGE、MACVLAN和ALL",
								"enum": [
									"PHYSICAL",
									"BOND",
									"VLAN",
									"BRIDGE",
									"MACVLAN",
									"ALL"
								]
							},
							"ifname": {
								"type": "string",
								"description": "网络接口名称",
								"format": "crlf",
								"minLength": 1,
								"maxLength": 512
							},
							"interface": {
								"type": "string",
								"description": "网络设备名称，如eth0、any",
								"format": "crlf",
								"minLength": 1,
								"maxLength": 512
							},
							"expression": {
								"type": "string",
								"description": "抓包条件过滤表达式，不能包含& | \" ' , % < > / \\等特殊字符",
								"format": "dangerous_str",
								"maxLength": 512,
								"title": "过滤表达式"
							}
						}
					}
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