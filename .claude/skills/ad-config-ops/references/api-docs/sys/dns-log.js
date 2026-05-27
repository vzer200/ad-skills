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
		"/sys/dns-log/": {
			"description": "DNS日志管理操作",
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
					"dns-log"
				],
				"summary": "get all dns-log",
				"description": "",
				"operationId": "get_dns_log_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_config_dns_log_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all dns-log",
						"description": "GET /sys/dns-log/",
						"value": {
							"method": "GET",
							"path": "/sys/dns-log/"
						}
					},
					"response": {
						"summary": "GET /sys/dns-log/ 响应",
						"description": "返回GET /sys/dns-log/的响应数据",
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
									"name": "vs1_log",
									"description": "example_string",
									"virtual_service": [
										"dns_vs1"
									],
									"log_template_state": "ENABLE",
									"log_template": "",
									"response_log_template_state": "ENABLE",
									"response_log_template": "",
									"syslog": {
										"type": "SYSTEM",
										"address": "10.1.1.1",
										"port": 514,
										"facility": "NONE",
										"message_encode": "UTF8",
										"network": "AUTO"
									}
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"dns-log"
				],
				"summary": "create new dns-log",
				"description": "",
				"operationId": "add_dns_log_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-LOG-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new dns-log",
						"description": "POST /sys/dns-log/",
						"value": {
							"method": "POST",
							"path": "/sys/dns-log/",
							"body": {
								"name": "AI_vs1_log_A",
								"virtual_service": [
									"dns_vs1"
								],
								"log_template_state": "ENABLE",
								"log_template": "[dns_query][${query_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${query_detail}][${query_flag}][${schedInfo}]",
								"response_log_template_state": "ENABLE",
								"response_log_template": "[dns_response][${response_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${response_detail}][${response_flag}]"
							}
						}
					},
					"response": {
						"summary": "POST /sys/dns-log/ 响应",
						"description": "返回POST /sys/dns-log/的响应数据",
						"value": {
							"name": "AI_vs1_log_A",
							"description": "example_string",
							"virtual_service": [
								"dns_vs1"
							],
							"log_template_state": "ENABLE",
							"log_template": "",
							"response_log_template_state": "ENABLE",
							"response_log_template": "",
							"syslog": {
								"type": "SYSTEM",
								"address": "10.1.1.1",
								"port": 514,
								"facility": "NONE",
								"message_encode": "UTF8",
								"network": "AUTO"
							}
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"dns-log"
				],
				"summary": "modify dns-log",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_dns_log_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-LOG-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_log_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify dns-log",
						"description": "The PATCH method updates specific properties of one config.",
						"value": {
							"method": "PATCH",
							"path": "/sys/dns-log/",
							"body": {
								"name": "vs1_log",
								"virtual_service": [
									"dns_vs1"
								],
								"log_template_state": "ENABLE",
								"log_template": "[dns_query][${query_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${query_detail}][${query_flag}][${schedInfo}]",
								"response_log_template_state": "ENABLE",
								"response_log_template": "[dns_response][${response_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${response_detail}][${response_flag}]"
							}
						}
					},
					"response": {
						"summary": "PATCH /sys/dns-log/ 响应",
						"description": "返回PATCH /sys/dns-log/的响应数据",
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
									"name": "vs1_log",
									"description": "example_string",
									"virtual_service": [
										"dns_vs1"
									],
									"log_template_state": "ENABLE",
									"log_template": "",
									"response_log_template_state": "ENABLE",
									"response_log_template": "",
									"syslog": {
										"type": "SYSTEM",
										"address": "10.1.1.1",
										"port": 514,
										"facility": "NONE",
										"message_encode": "UTF8",
										"network": "AUTO"
									}
								}
							]
						}
					}
				}
			}
		},
		"/sys/dns-log/{name}": {
			"description": "DNS日志单个配置操作",
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
					"dns-log"
				],
				"summary": "get specific dns-log",
				"description": "",
				"operationId": "get_dns_log",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific dns-log",
						"description": "GET /sys/dns-log/{name}",
						"value": {
							"method": "GET",
							"path": "/sys/dns-log/{name}"
						}
					},
					"response": {
						"summary": "GET /sys/dns-log/{name} 响应",
						"description": "返回GET /sys/dns-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"dns_vs1"
							],
							"log_template_state": "ENABLE",
							"log_template": "",
							"response_log_template_state": "ENABLE",
							"response_log_template": "",
							"syslog": {
								"type": "SYSTEM",
								"address": "10.1.1.1",
								"port": 514,
								"facility": "NONE",
								"message_encode": "UTF8",
								"network": "AUTO"
							}
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-log"
				],
				"summary": "create new dns-log",
				"description": "",
				"operationId": "create_dns_log",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-LOG-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new dns-log",
						"description": "POST /sys/dns-log/{name}",
						"value": {
							"method": "POST",
							"path": "/sys/dns-log/{name}",
							"body": {
								"name": "AI_vs1_log_B",
								"virtual_service": [
									"dns_vs1"
								],
								"log_template_state": "ENABLE",
								"log_template": "[dns_query][${query_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${query_detail}][${query_flag}][${schedInfo}]",
								"response_log_template_state": "ENABLE",
								"response_log_template": "[dns_response][${response_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${response_detail}][${response_flag}]"
							}
						}
					},
					"response": {
						"summary": "POST /sys/dns-log/{name} 响应",
						"description": "返回POST /sys/dns-log/{name}的响应数据",
						"value": {
							"name": "AI_vs1_log_B",
							"description": "example_string",
							"virtual_service": [
								"dns_vs1"
							],
							"log_template_state": "ENABLE",
							"log_template": "",
							"response_log_template_state": "ENABLE",
							"response_log_template": "",
							"syslog": {
								"type": "SYSTEM",
								"address": "10.1.1.1",
								"port": 514,
								"facility": "NONE",
								"message_encode": "UTF8",
								"network": "AUTO"
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"dns-log"
				],
				"summary": "replace specific dns-log",
				"description": "",
				"operationId": "replace_dns_log",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-LOG-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific dns-log",
						"description": "PUT /sys/dns-log/{name}",
						"value": {
							"method": "PUT",
							"path": "/sys/dns-log/{name}",
							"body": {
								"name": "vs1_log",
								"virtual_service": [
									"dns_vs1"
								],
								"log_template_state": "ENABLE",
								"log_template": "[dns_query][${query_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${query_detail}][${query_flag}][${schedInfo}]",
								"response_log_template_state": "ENABLE",
								"response_log_template": "[dns_response][${response_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${response_detail}][${response_flag}]"
							}
						}
					},
					"response": {
						"summary": "PUT /sys/dns-log/{name} 响应",
						"description": "返回PUT /sys/dns-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"dns_vs1"
							],
							"log_template_state": "ENABLE",
							"log_template": "",
							"response_log_template_state": "ENABLE",
							"response_log_template": "",
							"syslog": {
								"type": "SYSTEM",
								"address": "10.1.1.1",
								"port": 514,
								"facility": "NONE",
								"message_encode": "UTF8",
								"network": "AUTO"
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"dns-log"
				],
				"summary": "modify specific dns-log",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_dns_log",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-LOG-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific dns-log",
						"description": "The PATCH method updates specific properties of one config.",
						"value": {
							"method": "PATCH",
							"path": "/sys/dns-log/{name}",
							"body": {
								"name": "vs1_log",
								"virtual_service": [
									"dns_vs1"
								],
								"log_template_state": "ENABLE",
								"log_template": "[dns_query][${query_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${query_detail}][${query_flag}][${schedInfo}]",
								"response_log_template_state": "ENABLE",
								"response_log_template": "[dns_response][${response_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${response_detail}][${response_flag}]"
							}
						}
					},
					"response": {
						"summary": "PATCH /sys/dns-log/{name} 响应",
						"description": "返回PATCH /sys/dns-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"dns_vs1"
							],
							"log_template_state": "ENABLE",
							"log_template": "",
							"response_log_template_state": "ENABLE",
							"response_log_template": "",
							"syslog": {
								"type": "SYSTEM",
								"address": "10.1.1.1",
								"port": 514,
								"facility": "NONE",
								"message_encode": "UTF8",
								"network": "AUTO"
							}
						}
					}
				}
			},
			"delete": {
				"tags": [
					"dns-log"
				],
				"summary": "delete specific dns-log",
				"description": "",
				"operationId": "delete_dns_log",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific dns-log",
						"description": "DELETE /sys/dns-log/{name}",
						"value": {
							"method": "DELETE",
							"path": "/sys/dns-log/{name}"
						}
					},
					"response": {
						"summary": "DELETE /sys/dns-log/{name} 响应",
						"description": "返回DELETE /sys/dns-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"dns_vs1"
							],
							"log_template_state": "ENABLE",
							"log_template": "",
							"response_log_template_state": "ENABLE",
							"response_log_template": "",
							"syslog": {
								"type": "SYSTEM",
								"address": "10.1.1.1",
								"port": 514,
								"facility": "NONE",
								"message_encode": "UTF8",
								"network": "AUTO"
							}
						}
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-LOG-CONFIG": {
			"name": "DNS-LOG-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_log"
			}
		},
		"DNS-LOG-PROPERTY": {
			"name": "DNS-LOG-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_log"
			}
		}
	},
	"responses": {
		"operation_config_dns_log_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_log_list"
			}
		},
		"operation_config_dns_log_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_log"
			}
		}
	},
	"definitions": {
		"config.dns_log_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "项目数量最大值",
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
					"description": "页面大小",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "项目长度",
					"type": "integer",
					"example": 8
				},
				"items": {
					"description": "项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.dns_log"
					}
				}
			}
		},
		"config.dns_log": {
			"type": "object",
			"required": [
				"name",
				"virtual_service"
			],
			"properties": {
				"name": {
					"description": "名称",
					"type": "string",
					"example": "vs1_log"
				},
				"description": {
					"description": "描述",
					"type": "string"
				},
				"virtual_service": {
					"type": "array",
					"items": {
						"description": "指定要发送DNS日志的虚拟服务",
						"type": "string"
					},
					"description": "指定要发送DNS日志的虚拟服务",
					"maxItems": 200,
					"minItems": 1,
					"example": [
						"dns_vs1",
						"dns_vs2"
					]
				},
				"log_template_state": {
					"type": "string",
					"description": "DNS请求日志启/禁用状态",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"log_template": {
					"type": "string",
					"default": "[dns_query][${query_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${query_detail}][${query_flag}][${schedInfo}]",
					"example": "[dns_query][${query_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${query_detail}][${query_flag}][${schedInfo}]",
					"maxLength": 255,
					"minLength": 1,
					"description": "请求日志所有待选内容如下|\n${query_time}:请求时间\n${query_id}:请求ID\n${src_ip_port}:源IP和端口\n${dst_ip_port}:目的IP和端口\n${protocol}:协议\n${query_detail}:请求详情\n${query_flag}:请求标记\n${ecs}:EDNS客户端子网\n${schedInfo}:调度信息"
				},
				"response_log_template_state": {
					"type": "string",
					"description": "DNS应答日志启/禁用状态",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"response_log_template": {
					"type": "string",
					"default": "[dns_response][${response_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${response_detail}][${response_flag}]",
					"example": "[dns_response][${response_time}][${query_id}][${src_ip_port}][${dst_ip_port}][${protocol}][${response_detail}][${response_flag}]",
					"maxLength": 255,
					"minLength": 1,
					"description": "应答日志所有待选内容如下 |\n${response_time}:应答时间      \n${query_id}:请求ID\n${src_ip_port}:源IP和端口\n${dst_ip_port}:目的IP和端口\n${protocol}:协议\n${query_detail}:请求详情\n${response_detail}:应答详情\n${response_flag}:应答标记"
				},
				"syslog": {
					"description": "syslog类型",
					"type": "object",
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"SPECIFIC",
								"SYSTEM"
							],
							"default": "SYSTEM",
							"example": "SYSTEM",
							"description": "可选参数；默认使用系统配置，SPECIFIC表示自定义配置"
						},
						"address": {
							"description": "可选参数；服务器地址，当syslog设置为specific时必填",
							"type": "string",
							"example": "10.1.1.1"
						},
						"port": {
							"description": "可选参数；服务器端口，默认为514， 当syslog设置为specific时设置。取值范围[1,65535]",
							"type": "integer",
							"default": 514,
							"example": 514,
							"maximum": 65535,
							"minimum": 1
						},
						"facility": {
							"description": "可选参数；日志facility配置（NONE/LOCAL0/LOCAL1/LOCAL2/LOCAL3/LOCAL4/LOCAL5/LOCAL6/LOCAL7），默认为none， 当syslog设置为specific时设置",
							"type": "string",
							"enum": [
								"NONE",
								"LOCAL0",
								"LOCAL1",
								"LOCAL2",
								"LOCAL3",
								"LOCAL4",
								"LOCAL5",
								"LOCAL6",
								"LOCAL7"
							],
							"default": "NONE",
							"example": "NONE"
						},
						"message_encode": {
							"description": "可选参数；日志编码格式（ASCII/UTF-8/GBK/GB2312），默认为utf8， 当syslog设置为specific时设置",
							"type": "string",
							"enum": [
								"ASCII",
								"UTF8",
								"GBK",
								"GB2312"
							],
							"default": "UTF8",
							"example": "UTF8"
						},
						"network": {
							"description": "选择的网络",
							"type": "string",
							"enum": [
								"MANAGE_NET",
								"SERVICE_NET",
								"AUTO"
							],
							"default": "AUTO",
							"example": "AUTO"
						}
					},
					"required": []
				}
			}
		}
	}
}