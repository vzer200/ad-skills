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
		"/api/ad/v3/sys/http-log/": {
			"description": "新建、查看HTTP日志配置",
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
					"http-log"
				],
				"summary": "get all http-log",
				"description": "查看已有的HTTP日志配置",
				"operationId": "get_http_log_list",
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
						"$ref": "#/responses/operation_config_http_log_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all http-log",
						"description": "查看已有的HTTP日志配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/http-log/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/http-log/ 响应",
						"description": "返回GET /api/ad/v3/sys/http-log/的响应数据",
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
										"vs1"
									],
									"log_template": "",
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
					"http-log"
				],
				"summary": "create new http-log",
				"description": "新建HTTP日志配置",
				"operationId": "add_http_log_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-LOG-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new http-log",
						"description": "新建HTTP日志配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/http-log/",
							"body": {
								"name": "AI_vs1_log_A",
								"virtual_service": [
									"vs1"
								],
								"log_template": "[${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/http-log/ 响应",
						"description": "返回POST /api/ad/v3/sys/http-log/的响应数据",
						"value": {
							"name": "AI_vs1_log_A",
							"description": "example_string",
							"virtual_service": [
								"vs1"
							],
							"log_template": "",
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
			"__sfcli_example__": [
				{
					"command": "list sys http-log zxc",
					"description": "查看HTTP日志zxc的配置信息"
				},
				{
					"command": "create sys http-log zxc virtual_service test description example syslog { address 10.82.30.60 facility local0 message_encode utf8 port 100 type specific } log_template [${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]",
					"description": "创建HTTP日志配置zxc，指定虚拟服务test，描述为example，转发到服务器10.82.30.60端口为100上，日志级别为local0,消息编码为utf8，指定日志格式[${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]"
				},
				{
					"command": "modify sys http-log zxc description example1 name abc syslog { type system } log_template '[${time}][${client_ip}]'",
					"description": "修改HTTP日志配置zxc的名称为name，使用本机的syslog，修改日志模板"
				},
				{
					"command": "delete sys http-log zxc",
					"description": "删除HTTP日志名称为zxc的配置"
				}
			]
		},
		"/api/ad/v3/sys/http-log/{name}": {
			"description": "新建、查看、修改、删除指定的HTTP日志配置",
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
					"http-log"
				],
				"summary": "get specific http-log",
				"description": "查看指定的HTTP日志配置",
				"operationId": "get_http_log",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific http-log",
						"description": "查看指定的HTTP日志配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/http-log/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/http-log/{name} 响应",
						"description": "返回GET /api/ad/v3/sys/http-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"vs1"
							],
							"log_template": "",
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
					"http-log"
				],
				"summary": "create new http-log",
				"description": "新建指定的HTTP日志配置",
				"operationId": "create_http_log",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-LOG-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new http-log",
						"description": "新建指定的HTTP日志配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/sys/http-log/{name}",
							"body": {
								"name": "AI_vs1_log_B",
								"virtual_service": [
									"vs1"
								],
								"log_template": "[${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/sys/http-log/{name} 响应",
						"description": "返回POST /api/ad/v3/sys/http-log/{name}的响应数据",
						"value": {
							"name": "AI_vs1_log_B",
							"description": "example_string",
							"virtual_service": [
								"vs1"
							],
							"log_template": "",
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
					"http-log"
				],
				"summary": "replace specific http-log",
				"description": "修改指定的HTTP日志配置",
				"operationId": "replace_http_log",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-LOG-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific http-log",
						"description": "修改指定的HTTP日志配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/http-log/{name}",
							"body": {
								"name": "vs1_log",
								"virtual_service": [
									"vs1"
								],
								"log_template": "[${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/http-log/{name} 响应",
						"description": "返回PUT /api/ad/v3/sys/http-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"vs1"
							],
							"log_template": "",
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
					"http-log"
				],
				"summary": "modify specific http-log",
				"description": "修改指定的HTTP日志配置",
				"operationId": "edit_http_log",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-LOG-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific http-log",
						"description": "修改指定的HTTP日志配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/http-log/{name}",
							"body": {
								"name": "vs1_log",
								"virtual_service": [
									"vs1"
								],
								"log_template": "[${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/http-log/{name} 响应",
						"description": "返回PATCH /api/ad/v3/sys/http-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"vs1"
							],
							"log_template": "",
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
					"http-log"
				],
				"summary": "delete specific http-log",
				"description": "删除指定的HTTP日志配置",
				"operationId": "delete_http_log",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_log_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific http-log",
						"description": "删除指定的HTTP日志配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/sys/http-log/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/sys/http-log/{name} 响应",
						"description": "返回DELETE /api/ad/v3/sys/http-log/{name}的响应数据",
						"value": {
							"name": "vs1_log",
							"description": "example_string",
							"virtual_service": [
								"vs1"
							],
							"log_template": "",
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
		"HTTP-LOG-CONFIG": {
			"name": "HTTP-LOG-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.http_log"
			}
		},
		"HTTP-LOG-PROPERTY": {
			"name": "HTTP-LOG-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.http_log"
			}
		}
	},
	"responses": {
		"operation_config_http_log_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_log_list"
			}
		},
		"operation_config_http_log_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_log"
			}
		}
	},
	"definitions": {
		"config.http_log_list": {
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
						"$ref": "#/definitions/config.http_log"
					}
				}
			}
		},
		"config.http_log": {
			"type": "object",
			"required": [
				"name",
				"virtual_service",
				"log_template"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定HTTP日志的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "vs1_log"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"virtual_service": {
					"description": "必选参数；指定需要记录HTTP日志的虚拟服务。",
					"type": "array",
					"items": {
						"description": "生效的虚拟服务",
						"type": "string",
						"example": "vs1"
					},
					"maxItems": 200,
					"minItems": 1
				},
				"log_template": {
					"description": "自定义日志格式|\n${client_ip}:客户端IP地址\n${client_port}:客户端端口号 \n${vip}:虚拟服务IP地址 \n${vport}:虚拟服务端口号 \n${uri}:请求方向URI \n${host}:请求方向HOST \n${rs_ip}:服务器端IP地址 \n${rs_port}:服务器端端口号 \n${rs_val}:节点关联变量 \n${user_agent}:浏览器版本信息 \n${method}:请求方法 \n${time}:请求时间 \n${cookie.XXX}:请求方向的cookie \n${X509.version}:证书的版本 \n${X509.serial_num}:证书的序列号 \n${X509.signature_algorithm}:证书的签名算法 \n${X509.issuer}:证书的签发者（顺序为RFC2253标准） \n${X509.not_valid_before}:证书的有效时间（在此时间之前无效） \n${X509.not_valid_after}:证书的有效时间（在此时间之后无效） \n${X509.subject}:证书的主题（顺序为RFC2253标准） \n${X509.subject_public_key_type}:证书的主题的公钥类型 \n${X509.subject_public_key}:证书的主题的公钥 \n${X509.subject_public_key_bits}:证书的主题的公钥的长度 \n${X509.hash}:客户端证书的MD5散列\n${X509.whole}:实际的客户端证书本身（PEM格式）  \n${X509.DN_CN}:证书名称 \n${X509.DN_E}:电子邮件 \n${X509.DN_O}:公司/机构 \n${X509.DN_OU}:部门 \n${X509.DN_C}:国家 \n${X509.DN_S}:州/省份 \n${X509.DN_L}:城市 \n${X509.errno}:证书认证错误码 \n${SSL.version}:SSL/TLS协议版本 \n${SSL.cipher_id}:SSL/TLS协议的协商算法id \n${SSL.cipher_name}:SSL/TLS协议的协商算法名称 \n${SSL.session_id}:SSL/TLS协议的会话ID \n${SSL.tlsext_server_name}:TLS协议的server name拓展字段",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"default": "[${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]",
					"example": "[${time}][${client_ip}:${client_port}][${method}][${uri}][${user_agent}]"
				},
				"syslog": {
					"description": "syslog",
					"type": "object",
					"properties": {
						"type": {
							"description": "可选参数；默认使用system（系统syslog设置），specific指定自定义日志服务器",
							"type": "string",
							"enum": [
								"SPECIFIC",
								"SYSTEM"
							],
							"default": "SYSTEM",
							"example": "SYSTEM"
						},
						"address": {
							"description": "可选参数；服务器地址，当syslog设置为specific时设置",
							"type": "string",
							"example": "10.1.1.1"
						},
						"port": {
							"description": "可选参数；服务器端口，默认为514， 当syslog设置为specific时设置",
							"type": "integer",
							"default": 514,
							"maximum": 65535,
							"minimum": 1,
							"example": 514
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