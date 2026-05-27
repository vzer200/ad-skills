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
		"/api/ad/v3/slb/service-monitor/all/": {
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
				"summary": "get all service-monitor",
				"description": "",
				"operationId": "get_service_monitor_list",
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
						"$ref": "#/responses/operation_config_service_monitor_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor",
						"description": "GET /api/ad/v3/slb/service-monitor/all/",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/all/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/all/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/all/的响应数据",
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
									"type": "CONNECT-TCP",
									"timeout": 16,
									"interval": 5,
									"err_interval": 2,
									"err_interval_state": "DISABLE",
									"host": "*",
									"port": 0,
									"debug_mode": "DISABLE",
									"gateway_detect": "DISABLE",
									"send_content": "GET / HTTP/1.1",
									"receive_cache_size": 2048,
									"receive_content_match": "200",
									"case_sensitive": "DISABLE",
									"reverse_result": "DISABLE",
									"send_content_before_disconnect": "example_string",
									"hexadecimal_mode": "DISABLE",
									"http_request_url": "/app/index.html",
									"expect_status_code": "200;302",
									"ssl_cipher": "DEFAULT:+SHA:+3DES:+kEDH",
									"client_certificate": "NONE",
									"username": "anonymous",
									"password": "example_string",
									"encrypted_password": "A1B2C3D4",
									"access_path": "/doc/test.xls",
									"ftp_mode": "PASV",
									"radius_type": "ACCESS-REQUEST",
									"encrypted_shared_secret": "A1B2C3D4",
									"radius_authenticate_method": "PAP",
									"radius_attributes": [
										{
											"id": 255,
											"type": "TEXT",
											"value": ""
										}
									],
									"outbound_link": "lan_1",
									"source_address": "192.168.1.1",
									"dns_query_domain": "www.abc.com",
									"expect_dns_answer": "abc.com",
									"base_dn": "",
									"search_filter": "",
									"secure": "NONE",
									"mandatory_attributes": "DISABLE",
									"chase_referrals": "ENABLE",
									"snmp_community": "public",
									"statistical_time": 10,
									"statistical_object": "RST-PACKET",
									"rst_packet_threshold": 100000,
									"zero_window_percent": 40,
									"action": "BUSY-PROTECT",
									"busy_protect": {
										"protect_time": 30,
										"retry_times": 4,
										"set_offline_when_protect_fail": "DISABLE"
									},
									"http_url_samples": [
										"/index.html"
									],
									"abnormal_status_codes": [
										404
									],
									"http_response_timeout": 5,
									"http_statistical_time": 1,
									"abnormal_http_response_threshold": 10000,
									"database": "",
									"mysql_detect_method": "QUERY-RESULT",
									"query_string": "select * from account_table;",
									"query_result": {
										"position_row": 2,
										"position_column": 2,
										"result_match": "success",
										"case_sensitive": "DISABLE"
									},
									"sync_status": {
										"check_replication_timeout": "DISABLE",
										"replication_timeout": 0
									},
									"monitor_expression": "ping AND http_8080",
									"cli_command": "/usr/bin/check_app_each_thread.py",
									"netns": "default"
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/service-monitor/all/{name}": {
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
				"summary": "get specific service-monitor",
				"description": "",
				"operationId": "get_service_monitor",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor",
						"description": "GET /api/ad/v3/slb/service-monitor/all/{name}",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/all/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/all/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/all/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "CONNECT-TCP",
							"timeout": 16,
							"interval": 5,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"send_content": "GET / HTTP/1.1",
							"receive_cache_size": 2048,
							"receive_content_match": "200",
							"case_sensitive": "DISABLE",
							"reverse_result": "DISABLE",
							"send_content_before_disconnect": "example_string",
							"hexadecimal_mode": "DISABLE",
							"http_request_url": "/app/index.html",
							"expect_status_code": "200;302",
							"ssl_cipher": "DEFAULT:+SHA:+3DES:+kEDH",
							"client_certificate": "NONE",
							"username": "anonymous",
							"password": "example_string",
							"encrypted_password": "A1B2C3D4",
							"access_path": "/doc/test.xls",
							"ftp_mode": "PASV",
							"radius_type": "ACCESS-REQUEST",
							"encrypted_shared_secret": "A1B2C3D4",
							"radius_authenticate_method": "PAP",
							"radius_attributes": [
								{
									"id": 255,
									"type": "TEXT",
									"value": ""
								}
							],
							"outbound_link": "lan_1",
							"source_address": "192.168.1.1",
							"dns_query_domain": "www.abc.com",
							"expect_dns_answer": "abc.com",
							"base_dn": "",
							"search_filter": "",
							"secure": "NONE",
							"mandatory_attributes": "DISABLE",
							"chase_referrals": "ENABLE",
							"snmp_community": "public",
							"statistical_time": 10,
							"statistical_object": "RST-PACKET",
							"rst_packet_threshold": 100000,
							"zero_window_percent": 40,
							"action": "BUSY-PROTECT",
							"busy_protect": {
								"protect_time": 30,
								"retry_times": 4,
								"set_offline_when_protect_fail": "DISABLE"
							},
							"http_url_samples": [
								"/index.html"
							],
							"abnormal_status_codes": [
								404
							],
							"http_response_timeout": 5,
							"http_statistical_time": 1,
							"abnormal_http_response_threshold": 10000,
							"database": "",
							"mysql_detect_method": "QUERY-RESULT",
							"query_string": "select * from account_table;",
							"query_result": {
								"position_row": 2,
								"position_column": 2,
								"result_match": "success",
								"case_sensitive": "DISABLE"
							},
							"sync_status": {
								"check_replication_timeout": "DISABLE",
								"replication_timeout": 0
							},
							"monitor_expression": "ping AND http_8080",
							"cli_command": "/usr/bin/check_app_each_thread.py",
							"netns": "default"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-ALL-CONFIG": {
			"name": "SERVICE-MONITOR-ALL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor"
			}
		},
		"SERVICE-MONITOR-ALL-PROPERTY": {
			"name": "SERVICE-MONITOR-ALL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_list"
			}
		},
		"operation_config_service_monitor_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor"
			}
		}
	},
	"definitions": {
		"config.service_monitor_list": {
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
						"$ref": "#/definitions/config.service_monitor"
					}
				}
			}
		},
		"config.service_monitor": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string"
				},
				"type": {
					"type": "string",
					"enum": [
						"ICMP",
						"ICMPV6",
						"CONNECT-TCP",
						"CONNECT-UDP",
						"CONNECT-SSL",
						"HTTP",
						"HTTPS",
						"FTP",
						"RADIUS",
						"TCP-HALF-OPEN",
						"DNS",
						"LDAP",
						"SNMP",
						"PASSIVE-TCP",
						"PASSIVE-HTTP",
						"ORACLE-DATABASE",
						"MSSQL-DATABASE",
						"MYSQL-DATABASE",
						"MONITOR-EXPRESSION",
						"EXTERNAL-MONITOR"
					],
					"example": "CONNECT-TCP"
				},
				"timeout": {
					"type": "integer",
					"default": 16,
					"example": 16
				},
				"interval": {
					"type": "integer",
					"default": 5,
					"example": 5
				},
				"err_interval": {
					"type": "integer",
					"default": 2,
					"example": 2
				},
				"err_interval_state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"host": {
					"type": "string",
					"description": "Format: * | {IP} | {DOMAIN} | {HOST}",
					"default": "*",
					"example": "8.8.8.8"
				},
				"port": {
					"type": "integer",
					"default": 0,
					"example": 0
				},
				"debug_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"gateway_detect": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"send_content": {
					"type": "string",
					"example": "GET / HTTP/1.1"
				},
				"receive_cache_size": {
					"type": "integer",
					"default": 2048,
					"example": 4096
				},
				"receive_content_match": {
					"type": "string",
					"example": "200"
				},
				"case_sensitive": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "Lose effectiveness with HEXADECIMAL modes",
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"reverse_result": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"send_content_before_disconnect": {
					"type": "string"
				},
				"hexadecimal_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"http_request_url": {
					"type": "string",
					"example": "/app/index.html"
				},
				"expect_status_code": {
					"type": "string",
					"default": "200;302",
					"example": "200;302"
				},
				"ssl_cipher": {
					"type": "string",
					"default": "DEFAULT:+SHA:+3DES:+kEDH",
					"example": "DEFAULT:+SHA:+3DES:+kEDH"
				},
				"client_certificate": {
					"type": "string",
					"enum": [
						"NONE",
						"{certificate}"
					],
					"default": "NONE",
					"example": "NONE"
				},
				"username": {
					"type": "string",
					"example": "anonymous"
				},
				"password": {
					"type": "string",
					"format": "password"
				},
				"encrypted_password": {
					"type": "string",
					"example": "A1B2C3D4"
				},
				"access_path": {
					"type": "string",
					"example": "/doc/test.xls"
				},
				"ftp_mode": {
					"type": "string",
					"enum": [
						"PASV",
						"PORT"
					],
					"default": "PASV",
					"example": "PASV"
				},
				"radius_type": {
					"type": "string",
					"enum": [
						"ACCESS-REQUEST",
						"ACCOUNTING-REQUEST"
					],
					"example": null
				},
				"encrypted_shared_secret": {
					"type": "string",
					"example": "A1B2C3D4"
				},
				"radius_authenticate_method": {
					"type": "string",
					"description": "Require property for ACCESS-REQUEST packet",
					"enum": [
						"PAP",
						"CHAP"
					],
					"example": "PAP"
				},
				"radius_attributes": {
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"id": {
								"type": "integer",
								"example": 255
							},
							"type": {
								"type": "string",
								"enum": [
									"TEXT",
									"INTEGER",
									"HEXADECIMAL",
									"IPv4",
									"IPv6"
								]
							},
							"value": {
								"type": "string",
								"example": ""
							}
						}
					}
				},
				"outbound_link": {
					"type": "string",
					"description": "Format: {WAN} | {LAN}",
					"example": "lan_1"
				},
				"source_address": {
					"type": "string",
					"example": "192.168.1.1"
				},
				"dns_query_domain": {
					"type": "string",
					"example": "www.abc.com"
				},
				"expect_dns_answer": {
					"type": "string",
					"description": "Format: {IP} | {DOMAIN}",
					"example": "abc.com"
				},
				"base_dn": {
					"type": "string",
					"example": ""
				},
				"search_filter": {
					"type": "string",
					"example": ""
				},
				"secure": {
					"type": "string",
					"enum": [
						"NONE",
						"TLS"
					],
					"default": "NONE",
					"example": "NONE"
				},
				"mandatory_attributes": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"chase_referrals": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"snmp_community": {
					"type": "string",
					"default": "public",
					"example": "public"
				},
				"statistical_time": {
					"type": "integer",
					"default": 10,
					"example": 10
				},
				"statistical_object": {
					"type": "string",
					"enum": [
						"RST-PACKET",
						"ZERO-WINDOW"
					],
					"default": "RST-PACKET"
				},
				"rst_packet_threshold": {
					"type": "integer",
					"default": 100000,
					"example": 100000
				},
				"zero_window_percent": {
					"type": "integer",
					"default": 40,
					"example": 40
				},
				"action": {
					"type": "string",
					"enum": [
						"BUSY-PROTECT",
						"SET-OFFLINE"
					],
					"default": "BUSY-PROTECT",
					"example": "BUSY-PROTECT"
				},
				"busy_protect": {
					"type": "object",
					"properties": {
						"protect_time": {
							"type": "integer",
							"default": 30,
							"example": 30
						},
						"retry_times": {
							"type": "integer",
							"default": 4,
							"example": 4
						},
						"set_offline_when_protect_fail": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						}
					}
				},
				"http_url_samples": {
					"type": "array",
					"items": {
						"type": "string",
						"example": "/index.html"
					}
				},
				"abnormal_status_codes": {
					"type": "array",
					"items": {
						"type": "integer",
						"example": 404
					},
					"example": [
						404,
						502
					]
				},
				"http_response_timeout": {
					"type": "integer",
					"default": 5,
					"example": 5
				},
				"http_statistical_time": {
					"type": "integer",
					"default": 1,
					"example": 10
				},
				"abnormal_http_response_threshold": {
					"type": "integer",
					"default": 10000,
					"example": 10000
				},
				"database": {
					"type": "string",
					"example": ""
				},
				"mysql_detect_method": {
					"type": "string",
					"enum": [
						"QUERY-RESULT",
						"SYNC-STATUS"
					],
					"default": "QUERY-RESULT"
				},
				"query_string": {
					"type": "string",
					"example": "select * from account_table;"
				},
				"query_result": {
					"type": "object",
					"properties": {
						"position_row": {
							"type": "integer",
							"example": 2
						},
						"position_column": {
							"type": "integer",
							"example": 2
						},
						"result_match": {
							"type": "string",
							"example": "success"
						},
						"case_sensitive": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						}
					}
				},
				"sync_status": {
					"type": "object",
					"properties": {
						"check_replication_timeout": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"replication_timeout": {
							"type": "integer",
							"default": 0,
							"example": 0
						}
					}
				},
				"monitor_expression": {
					"type": "string",
					"example": "ping AND http_8080"
				},
				"cli_command": {
					"type": "string",
					"example": "/usr/bin/check_app_each_thread.py"
				},
				"netns": {
					"type": "string",
					"default": "default"
				}
			}
		}
	}
}