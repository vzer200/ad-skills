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
		"/api/ad/v3/slb/service-monitor/connect-ssl/": {
			"description": "新建、查看监视器（CONNECT-SSL）配置",
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
				"summary": "get all service-monitor-connect-ssl",
				"description": "查看当前已有的监视器（CONNECT-SSL）配置信息",
				"operationId": "get_service_monitor_connect_ssl_list",
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
						"$ref": "#/responses/operation_config_service_monitor_connect_ssl_list"
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-connect-ssl",
				"description": "新建一个监视器（CONNECT-SSL）配置",
				"operationId": "add_service_monitor_connect_ssl_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-CONNECT-SSL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_connect_ssl_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor connect-ssl sslmonitor description ssl监视器 host * port 443 debug_mode enable send_content xxxxx send_content_before_disconnect yyyyy receive_content_match bbbb",
					"description": "新建ssl类型的监视器sslmonitor,监视端口为443,启用调试模式， 发送内容为xxxxx,断开发送数据yyyyy， 接收内容匹配bbbb"
				},
				{
					"command": "modify slb service-monitor connect-ssl sslmonitor host 4.4.4.4",
					"description": "修改ssl监视器sslmonitor的监视主机为4.4.4.4"
				},
				{
					"command": "list slb service-monitor connect-ssl sslmonitor",
					"description": "查看ssl监视器sslmonitor的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/connect-ssl/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（CONNECT-SSL）配置",
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
				"summary": "get specific service-monitor-connect-ssl",
				"description": "查看指定的监视器（CONNECT-SSL）配置",
				"operationId": "get_service_monitor_connect_ssl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_connect_ssl_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-connect-ssl",
				"description": "新建指定的监视器（CONNECT-SSL）配置",
				"operationId": "create_service_monitor_connect_ssl",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-CONNECT-SSL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_connect_ssl_object"
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-connect-ssl",
				"description": "修改指定的监视器（CONNECT-SSL）配置",
				"operationId": "replace_service_monitor_connect_ssl",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-CONNECT-SSL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_connect_ssl_object"
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-connect-ssl",
				"description": "修改指定的监视器（CONNECT-SSL）配置",
				"operationId": "edit_service_monitor_connect_ssl",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-CONNECT-SSL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_connect_ssl_object"
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-connect-ssl",
				"description": "删除指定的监视器（CONNECT-SSL）配置",
				"operationId": "delete_service_monitor_connect_ssl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_connect_ssl_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-CONNECT-SSL-CONFIG": {
			"name": "SERVICE-MONITOR-CONNECT-SSL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_connect_ssl"
			}
		},
		"SERVICE-MONITOR-CONNECT-SSL-PROPERTY": {
			"name": "SERVICE-MONITOR-CONNECT-SSL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_connect_ssl"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_connect_ssl_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_connect_ssl_list"
			}
		},
		"operation_config_service_monitor_connect_ssl_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_connect_ssl"
			}
		}
	},
	"definitions": {
		"config.service_monitor_connect_ssl_list": {
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
						"$ref": "#/definitions/config.service_monitor_connect_ssl"
					}
				}
			}
		},
		"config.service_monitor_connect_ssl": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数； 指定监视器的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string",
					"description": "可选参数； 用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "只读参数；监视器类型。",
					"type": "string",
					"enum": [
						"CONNECT-SSL"
					],
					"default": "CONNECT-SSL"
				},
				"timeout": {
					"description": "可选参数；设置监视超时时间。",
					"type": "integer",
					"default": 16,
					"maximum": 86400,
					"minimum": 1,
					"example": 16
				},
				"interval": {
					"description": "可选参数；设置监视间隔时间。",
					"type": "integer",
					"default": 5,
					"maximum": 86400,
					"minimum": 1,
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
					"description": "可选参数；支持ip地址和*;默认为*，表示监视节点池中的地址；当启用gateway_detect时必须指定ip地址",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "可选参数；指定监视端口；取值范围[0,65535]，默认为0，表示使用节点池中节点的端口",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 0
				},
				"debug_mode": {
					"description": "可选参数；调试模式开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"gateway_detect": {
					"description": "可选参数；透明监控开关，disable表示禁用，enable表示启用；默认禁用。",
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
				"send_content": {
					"description": "可选参数；指定监视发送内容。",
					"type": "string",
					"maxLength": 2048,
					"example": "GET / HTTP/1.1"
				},
				"receive_cache_size": {
					"description": "可选参数；指定接收缓冲区大小。",
					"type": "integer",
					"default": 5120,
					"maximum": 5120,
					"minimum": 1,
					"example": 4096
				},
				"receive_content_match": {
					"description": "可选参数；指定接收匹配内容。",
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
				"send_content_before_disconnect": {
					"description": "可选参数；指定断开之前发送内容。",
					"type": "string",
					"maxLength": 256
				},
				"hexadecimal_mode": {
					"description": "可选参数; 十六进制模式开关,enable表示启用,disable表示禁用,默认为disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"ssl_cipher": {
					"description": "可选参数;指定使用的加密套件，默认为'DEFAULT:+SHA:+3DES:+kEDH'",
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
				"client_certificate": {
					"description": "可选参数;指定客户端证书,默认为none，表示不携带证书；或者通过资源管理模块创建/导入证书",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"default": "NONE",
					"optionalEnum": [
						"NONE"
					],
					"example": "NONE"
				}
			}
		}
	}
}