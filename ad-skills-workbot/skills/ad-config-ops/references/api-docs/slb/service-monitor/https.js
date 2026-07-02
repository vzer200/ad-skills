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
		"/api/ad/v3/slb/service-monitor/https/": {
			"description": "新建、查看监视器（HTTPS）配置",
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
					"service-monitor"
				],
				"summary": "get all service-monitor-https",
				"description": "查看当前已有的监视器（HTTPS）配置信息",
				"operationId": "get_service_monitor_https_list",
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
						"$ref": "#/responses/operation_config_service_monitor_https_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor-https",
						"description": "查看当前已有的监视器（HTTPS）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/https/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/https/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/https/的响应数据",
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
									"name": "http",
									"description": "example_string",
									"type": "HTTPS",
									"timeout": 16,
									"interval": 5,
									"err_interval": 2,
									"err_interval_state": "DISABLE",
									"host": "*",
									"port": 0,
									"debug_mode": "DISABLE",
									"gateway_detect": "DISABLE",
									"http_request_method": "GET",
									"http_request_url": "/",
									"expect_status_code": "200;302",
									"ssl_cipher": "DEFAULT:+SHA:+kEDH",
									"protocols": [
										"SSLV3"
									],
									"certificate_type": "RSA_ECDSA",
									"client_auth_state": "DISABLE",
									"client_certificate": "NONE",
									"receive_content_match": "200",
									"reverse_result": "DISABLE",
									"node_disable_receive_content_match": "200",
									"node_disable_reverse_result": "DISABLE",
									"gm_sign_cert": "NONE",
									"gm_enc_cert": "NONE",
									"send_host": ""
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-https",
				"description": "新建一个监视器（HTTPS）配置",
				"operationId": "add_service_monitor_https_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-HTTPS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_https_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-https",
						"description": "新建一个监视器（HTTPS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/https/",
							"body": {
								"name": "AI_http_https_A",
								"type": "HTTPS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"http_request_method": "GET",
								"http_request_url": "/",
								"expect_status_code": "200;302",
								"ssl_cipher": "DEFAULT:+SHA:+kEDH",
								"protocols": [
									"SSLV3",
									"TLS1.0",
									"TLS1.1",
									"TLS1.2",
									"TLS1.3"
								],
								"certificate_type": "RSA_ECDSA",
								"client_auth_state": "DISABLE",
								"client_certificate": "NONE",
								"reverse_result": "DISABLE",
								"node_disable_reverse_result": "DISABLE",
								"gm_sign_cert": "NONE",
								"gm_enc_cert": "NONE",
								"send_host": "${rs_ip}"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/https/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/https/的响应数据",
						"value": {
							"name": "AI_http_https_A",
							"description": "example_string",
							"type": "HTTPS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"http_request_method": "GET",
							"http_request_url": "/",
							"expect_status_code": "200;302",
							"ssl_cipher": "DEFAULT:+SHA:+kEDH",
							"protocols": [
								"SSLV3"
							],
							"certificate_type": "RSA_ECDSA",
							"client_auth_state": "DISABLE",
							"client_certificate": "NONE",
							"receive_content_match": "200",
							"reverse_result": "DISABLE",
							"node_disable_receive_content_match": "200",
							"node_disable_reverse_result": "DISABLE",
							"gm_sign_cert": "NONE",
							"gm_enc_cert": "NONE",
							"send_host": ""
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor https https1 description https监视器 host * port 443 http_request_url /index.html client_certificate a expect_status_code 302 ssl_cipher AES256",
					"description": "新建https类型的监视器https1，使用客户端证书a，加密套件aes256，期望状态码302"
				},
				{
					"command": "modify slb service-monitor https https1 host 1.1.1.1",
					"description": "修改https监视器https1的监视主机为1.1.1.1"
				},
				{
					"command": "list slb service-monitor https https1",
					"description": "查看https监视器https1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/https/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（HTTPS）配置",
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
					"service-monitor"
				],
				"summary": "get specific service-monitor-https",
				"description": "查看指定的监视器（HTTPS）配置",
				"operationId": "get_service_monitor_https",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_https_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor-https",
						"description": "查看指定的监视器（HTTPS）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/https/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/https/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/https/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "HTTPS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"http_request_method": "GET",
							"http_request_url": "/",
							"expect_status_code": "200;302",
							"ssl_cipher": "DEFAULT:+SHA:+kEDH",
							"protocols": [
								"SSLV3"
							],
							"certificate_type": "RSA_ECDSA",
							"client_auth_state": "DISABLE",
							"client_certificate": "NONE",
							"receive_content_match": "200",
							"reverse_result": "DISABLE",
							"node_disable_receive_content_match": "200",
							"node_disable_reverse_result": "DISABLE",
							"gm_sign_cert": "NONE",
							"gm_enc_cert": "NONE",
							"send_host": ""
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-https",
				"description": "新建指定的监视器（HTTPS）配置",
				"operationId": "create_service_monitor_https",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-HTTPS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_https_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-https",
						"description": "新建指定的监视器（HTTPS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/https/{name}",
							"body": {
								"name": "AI_http_https_B",
								"type": "HTTPS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"http_request_method": "GET",
								"http_request_url": "/",
								"expect_status_code": "200;302",
								"ssl_cipher": "DEFAULT:+SHA:+kEDH",
								"protocols": [
									"SSLV3",
									"TLS1.0",
									"TLS1.1",
									"TLS1.2",
									"TLS1.3"
								],
								"certificate_type": "RSA_ECDSA",
								"client_auth_state": "DISABLE",
								"client_certificate": "NONE",
								"reverse_result": "DISABLE",
								"node_disable_reverse_result": "DISABLE",
								"gm_sign_cert": "NONE",
								"gm_enc_cert": "NONE",
								"send_host": "${rs_ip}"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/https/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/https/{name}的响应数据",
						"value": {
							"name": "AI_http_https_B",
							"description": "example_string",
							"type": "HTTPS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"http_request_method": "GET",
							"http_request_url": "/",
							"expect_status_code": "200;302",
							"ssl_cipher": "DEFAULT:+SHA:+kEDH",
							"protocols": [
								"SSLV3"
							],
							"certificate_type": "RSA_ECDSA",
							"client_auth_state": "DISABLE",
							"client_certificate": "NONE",
							"receive_content_match": "200",
							"reverse_result": "DISABLE",
							"node_disable_receive_content_match": "200",
							"node_disable_reverse_result": "DISABLE",
							"gm_sign_cert": "NONE",
							"gm_enc_cert": "NONE",
							"send_host": ""
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-https",
				"description": "修改指定的监视器（HTTPS）配置",
				"operationId": "replace_service_monitor_https",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-HTTPS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_https_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-monitor-https",
						"description": "修改指定的监视器（HTTPS）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-monitor/https/{name}",
							"body": {
								"name": "http",
								"type": "HTTPS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"http_request_method": "GET",
								"http_request_url": "/",
								"expect_status_code": "200;302",
								"ssl_cipher": "DEFAULT:+SHA:+kEDH",
								"protocols": [
									"SSLV3",
									"TLS1.0",
									"TLS1.1",
									"TLS1.2",
									"TLS1.3"
								],
								"certificate_type": "RSA_ECDSA",
								"client_auth_state": "DISABLE",
								"client_certificate": "NONE",
								"reverse_result": "DISABLE",
								"node_disable_reverse_result": "DISABLE",
								"gm_sign_cert": "NONE",
								"gm_enc_cert": "NONE",
								"send_host": "${rs_ip}"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-monitor/https/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-monitor/https/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "HTTPS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"http_request_method": "GET",
							"http_request_url": "/",
							"expect_status_code": "200;302",
							"ssl_cipher": "DEFAULT:+SHA:+kEDH",
							"protocols": [
								"SSLV3"
							],
							"certificate_type": "RSA_ECDSA",
							"client_auth_state": "DISABLE",
							"client_certificate": "NONE",
							"receive_content_match": "200",
							"reverse_result": "DISABLE",
							"node_disable_receive_content_match": "200",
							"node_disable_reverse_result": "DISABLE",
							"gm_sign_cert": "NONE",
							"gm_enc_cert": "NONE",
							"send_host": ""
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-https",
				"description": "修改指定的监视器（HTTPS）配置",
				"operationId": "edit_service_monitor_https",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-HTTPS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_https_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-monitor-https",
						"description": "修改指定的监视器（HTTPS）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-monitor/https/{name}",
							"body": {
								"name": "http",
								"type": "HTTPS",
								"timeout": 16,
								"interval": 5,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"http_request_method": "GET",
								"http_request_url": "/",
								"expect_status_code": "200;302",
								"ssl_cipher": "DEFAULT:+SHA:+kEDH",
								"protocols": [
									"SSLV3",
									"TLS1.0",
									"TLS1.1",
									"TLS1.2",
									"TLS1.3"
								],
								"certificate_type": "RSA_ECDSA",
								"client_auth_state": "DISABLE",
								"client_certificate": "NONE",
								"reverse_result": "DISABLE",
								"node_disable_reverse_result": "DISABLE",
								"gm_sign_cert": "NONE",
								"gm_enc_cert": "NONE",
								"send_host": "${rs_ip}"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-monitor/https/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-monitor/https/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "HTTPS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"http_request_method": "GET",
							"http_request_url": "/",
							"expect_status_code": "200;302",
							"ssl_cipher": "DEFAULT:+SHA:+kEDH",
							"protocols": [
								"SSLV3"
							],
							"certificate_type": "RSA_ECDSA",
							"client_auth_state": "DISABLE",
							"client_certificate": "NONE",
							"receive_content_match": "200",
							"reverse_result": "DISABLE",
							"node_disable_receive_content_match": "200",
							"node_disable_reverse_result": "DISABLE",
							"gm_sign_cert": "NONE",
							"gm_enc_cert": "NONE",
							"send_host": ""
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-https",
				"description": "删除指定的监视器（HTTPS）配置",
				"operationId": "delete_service_monitor_https",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_https_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-monitor-https",
						"description": "删除指定的监视器（HTTPS）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-monitor/https/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-monitor/https/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-monitor/https/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "HTTPS",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"http_request_method": "GET",
							"http_request_url": "/",
							"expect_status_code": "200;302",
							"ssl_cipher": "DEFAULT:+SHA:+kEDH",
							"protocols": [
								"SSLV3"
							],
							"certificate_type": "RSA_ECDSA",
							"client_auth_state": "DISABLE",
							"client_certificate": "NONE",
							"receive_content_match": "200",
							"reverse_result": "DISABLE",
							"node_disable_receive_content_match": "200",
							"node_disable_reverse_result": "DISABLE",
							"gm_sign_cert": "NONE",
							"gm_enc_cert": "NONE",
							"send_host": ""
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-HTTPS-CONFIG": {
			"name": "SERVICE-MONITOR-HTTPS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_https"
			}
		},
		"SERVICE-MONITOR-HTTPS-PROPERTY": {
			"name": "SERVICE-MONITOR-HTTPS-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_https"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_https_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_https_list"
			}
		},
		"operation_config_service_monitor_https_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_https"
			}
		}
	},
	"definitions": {
		"config.service_monitor_https_list": {
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
						"$ref": "#/definitions/config.service_monitor_https"
					}
				}
			}
		},
		"config.service_monitor_https": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "指定监视器的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string",
					"description": "用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "监视器类型",
					"type": "string",
					"enum": [
						"HTTPS"
					],
					"default": "HTTPS"
				},
				"timeout": {
					"description": "设置监视超时时间。",
					"type": "integer",
					"default": 16,
					"minimum": 1,
					"maximum": 86400,
					"example": 16
				},
				"interval": {
					"description": "设置监视间隔时间。",
					"type": "integer",
					"default": 5,
					"minimum": 1,
					"maximum": 86400,
					"example": 5
				},
				"err_interval": {
					"description": "故障间隔时间。",
					"type": "integer",
					"default": 2,
					"example": 2,
					"maximum": 86400,
					"minimum": 1
				},
				"err_interval_state": {
					"description": "故障间隔开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"host": {
					"description": "支持ip地址和*;默认为*，表示监视节点池中的地址",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "表示使用节点池中节点的端口；取值范围[0,65535],默认为0",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 443
				},
				"debug_mode": {
					"description": "调试模式开关，disable表示禁用，enable表示启用；默认禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"gateway_detect": {
					"description": "透明监控开关，disable表示禁用，enable表示启用；默认禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"http_request_method": {
					"description": "请求方法",
					"type": "string",
					"default": "GET",
					"enum": [
						"GET",
						"POST",
						"PUT",
						"DELETE",
						"CONNECT",
						"TRACE",
						"HEAD",
						"OPTIONS",
						"PATCH"
					],
					"example": "GET"
				},
				"http_request_url": {
					"description": "监视的URL，默认为'/'",
					"type": "string",
					"default": "/",
					"minLength": 1,
					"maxLength": 1023,
					"example": "/app/index.html"
				},
				"expect_status_code": {
					"description": "期望接收到的状态码，默认为'200;302'；多个状态码中间用';'分隔",
					"type": "string",
					"default": "200;302",
					"minLength": 0,
					"maxLength": 255,
					"example": "200;302"
				},
				"ssl_cipher": {
					"description": "指定使用的加密套件，默认为'DEFAULT:+SHA:+3DES:+kEDH'",
					"type": "string",
					"default": "DEFAULT:+SHA:+kEDH",
					"minLength": 1,
					"maxLength": 255,
					"example": "DEFAULT:+SHA:+kEDH"
				},
				"protocols": {
					"description": "启用协议集合",
					"type": "array",
					"items": {
						"description": "单个协议",
						"type": "string",
						"enum": [
							"SSLV3",
							"TLS1.0",
							"TLS1.1",
							"TLS1.2",
							"TLS1.3",
							"GM1.1"
						]
					},
					"default": [
						"SSLV3",
						"TLS1.0",
						"TLS1.1",
						"TLS1.2",
						"TLS1.3"
					],
					"minItems": 1,
					"maxItems": 6
				},
				"certificate_type": {
					"description": "证书类型,必须是RSA_ECDSA或者SM2",
					"type": "string",
					"enum": [
						"RSA_ECDSA",
						"SM2"
					],
					"default": "RSA_ECDSA"
				},
				"client_auth_state": {
					"description": "是否开启客户端认证",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"client_certificate": {
					"description": "指定客户端证书，默认为none，表示不携带证书；或者通过资源管理模块创建/导入证书",
					"type": "string",
					"default": "NONE",
					"optionalEnum": [
						"NONE"
					],
					"example": "NONE"
				},
				"receive_content_match": {
					"description": "可选参数；指定接收内容",
					"type": "string",
					"maxLength": 256,
					"example": "200"
				},
				"reverse_result": {
					"description": "可选参数；指定是否做反向匹配。enable表示反向匹配,disable表示正向匹配,默认disable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"node_disable_receive_content_match": {
					"description": "可选参数；指定节点禁用接收内容",
					"type": "string",
					"maxLength": 256,
					"example": "200"
				},
				"node_disable_reverse_result": {
					"description": "可选参数；指定是否做反向匹配。enable表示反向匹配,disable表示正向匹配,默认disable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"gm_sign_cert": {
					"description": "SM2客户端签名证书",
					"type": "string",
					"default": "NONE"
				},
				"gm_enc_cert": {
					"description": "SM2客户端加密证书",
					"type": "string",
					"default": "NONE"
				},
				"send_host": {
					"description": "发送host",
					"type": "string",
					"default": "${rs_ip}",
					"minLength": 0,
					"maxLength": 1023,
					"example": "www.baidu.com"
				}
			}
		}
	}
}