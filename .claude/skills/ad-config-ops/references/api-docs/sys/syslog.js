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
		"/api/ad/v3/sys/syslog": {
			"description": "查看、修改系统syslog设置",
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
					"syslog"
				],
				"summary": "get syslog",
				"description": "查看当前已有的系统syslog设置信息",
				"operationId": "get_syslog",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_syslog_object"
					}
				}
			},
			"put": {
				"tags": [
					"syslog"
				],
				"summary": "replace syslog",
				"description": "修改系统syslog设置",
				"operationId": "replace_syslog",
				"parameters": [
					{
						"$ref": "#/parameters/SYSLOG-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_syslog_object"
					}
				}
			},
			"patch": {
				"tags": [
					"syslog"
				],
				"summary": "modify syslog",
				"description": "修改系统syslog设置",
				"operationId": "edit_syslog",
				"parameters": [
					{
						"$ref": "#/parameters/SYSLOG-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_syslog_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys syslog",
					"description": "查看系统syslog设置"
				},
				{
					"command": "modify sys syslog state enable servers [ { address 10.82.33.60 port 514} {address 10.82.33.61 port 514}] message_encode utf8 alarm_log_facility local0 error_log_facility local0 http_log_facility local0 information_log_facility local0  ipro_log_facility local0 nat_log_facility local0 operation_log_facility local0 ssl_log_facility local0",
					"description": "启用系统syslog设置，默认为非启用；设置服务器ip地址为10.82.33.60和10.82.33.61，端口都为514；消息编码设置为utf-8；日志级别都设置为local0"
				},
				{
					"command": "modify sys syslog servers add [ {address 10.82.33.63 port 514} ]",
					"description": "添加日志服务器地址"
				},
				{
					"command": "modify sys syslog servers delete [ {address 10.82.33.63 port 514} ]",
					"description": "删除日志服务器地址"
				}
			]
		}
	},
	"parameters": {
		"SYSLOG-CONFIG": {
			"name": "SYSLOG-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.syslog"
			}
		},
		"SYSLOG-PROPERTY": {
			"name": "SYSLOG-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.syslog"
			}
		}
	},
	"responses": {
		"operation_config_syslog_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.syslog"
			}
		}
	},
	"definitions": {
		"config.syslog": {
			"type": "object",
			"properties": {
				"state": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"servers": {
					"description": "可选参数；Syslog服务器列表",
					"type": "array",
					"items": {
						"description": "服务器ip、端口",
						"type": "object",
						"properties": {
							"address": {
								"description": "可选参数；服务器地址",
								"type": "string",
								"example": "10.1.1.1"
							},
							"port": {
								"description": "可选参数；服务器端口",
								"type": "integer",
								"default": 514,
								"maximum": 65535,
								"minimum": 1,
								"example": 514
							},
							"language_type": {
								"description": "日志语言",
								"type": "string",
								"enum": [
									"LANGUAGE_ZH_CN",
									"LANGUAGE_EN_US"
								],
								"default": "LANGUAGE_ZH_CN",
								"example": "LANGUAGE_ZH_CN"
							},
							"message_encode": {
								"description": "日志编码格式",
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
						"required": [
							"address"
						]
					},
					"maxItems": 5
				},
				"message_encode": {
					"description": "可选参数；日志编码格式（ascii/utf8/gbk/gb2312），默认为utf8",
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
				"information_log_facility": {
					"description": "可选参数；信息日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"alarm_log_facility": {
					"description": "可选参数；告警日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"error_log_facility": {
					"description": "可选参数；错误日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"ssl_log_facility": {
					"description": "可选参数；SSL日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"operation_log_facility": {
					"description": "可选参数；管理日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"http_log_facility": {
					"description": "可选参数；HTTP日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"nat_log_facility": {
					"description": "可选参数；NAT日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"ipro_log_facility": {
					"description": "可选参数；iPro日志facility配置（none/local0/local1/local2/local3/local4/local5/local6/local7），默认为none",
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
				"dns_log_facility": {
					"description": "dns日志-设备设置",
					"__format__description__": "合法输入为: NONE、LOCAL0、LOCAL1、LOCAL2、LOCAL3、LOCAL4、LOCAL5、LOCAL6、LOCAL7",
					"title": "dns日志-设备设置",
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
				}
			}
		}
	}
}