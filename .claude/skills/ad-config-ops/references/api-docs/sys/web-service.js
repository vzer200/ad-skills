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
		"/api/ad/v3/sys/web-service": {
			"description": "查看、修改登录配置",
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
					"web-service"
				],
				"summary": "get web-service",
				"description": "查看当前已有的登录配置信息",
				"operationId": "get_web_service",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_web_service_object"
					}
				}
			},
			"put": {
				"tags": [
					"web-service"
				],
				"summary": "replace web-service",
				"description": "修改登录配置",
				"operationId": "replace_web_service",
				"parameters": [
					{
						"$ref": "#/parameters/WEB-SERVICE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_web_service_object"
					}
				}
			},
			"patch": {
				"tags": [
					"web-service"
				],
				"summary": "modify web-service",
				"description": "修改登录配置",
				"operationId": "edit_web_service",
				"parameters": [
					{
						"$ref": "#/parameters/WEB-SERVICE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_web_service_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys web-service web_console { https_port 443 session_timeout 12000 }",
					"description": "修改当前登录配置，设置控制台登录端口为443，登录超时时间为12000秒"
				},
				{
					"command": "list sys web-service",
					"description": "查看当前登录配置信息"
				}
			]
		}
	},
	"parameters": {
		"WEB-SERVICE-CONFIG": {
			"name": "WEB-SERVICE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.web_service"
			}
		},
		"WEB-SERVICE-PROPERTY": {
			"name": "WEB-SERVICE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.web_service"
			}
		}
	},
	"responses": {
		"operation_config_web_service_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.web_service"
			}
		}
	},
	"definitions": {
		"config.web_service": {
			"type": "object",
			"properties": {
				"web_console": {
					"description": "web控制台配置",
					"type": "object",
					"properties": {
						"https_port": {
							"description": "HTTPS端口",
							"type": "integer",
							"default": 443,
							"maximum": 65535,
							"minimum": 1,
							"example": 443
						},
						"session_timeout": {
							"description": "HTTP会话超时时间",
							"type": "integer",
							"default": 1200,
							"maximum": 86400,
							"minimum": 60,
							"example": 3600
						}
					},
					"required": []
				},
				"report_center": {
					"description": "报表中心配置",
					"type": "object",
					"properties": {
						"https_port": {
							"description": "报表端口",
							"type": "integer",
							"default": 85,
							"maximum": 65535,
							"minimum": 1,
							"example": 85
						},
						"session_timeout": {
							"description": "报表UI会话超时时间",
							"type": "integer",
							"default": 600,
							"maximum": 86400,
							"minimum": 60,
							"example": 600
						}
					},
					"required": []
				},
				"restful_api": {
					"description": "API配置",
					"type": "object",
					"properties": {
						"token_timeout": {
							"description": "API会话超时时间",
							"type": "integer",
							"default": 600,
							"maximum": 8640000,
							"minimum": 60,
							"example": 600
						}
					},
					"required": []
				},
				"remote_maintenance": {
					"description": "远程维护",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"intranet_maintenance": {
					"description": "内网维护",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"multitenant": {
					"description": "多租户",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"multi_login": {
					"description": "单用户并发登录",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"login_protect": {
					"description": "登录保护配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "启用禁用登录保护",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"statistical_time": {
							"description": "统计时长",
							"type": "integer",
							"default": 300,
							"maximum": 31536000,
							"minimum": 1,
							"example": 300
						},
						"fail_times": {
							"description": "登录失败次数",
							"type": "integer",
							"default": 5,
							"maximum": 5,
							"minimum": 1,
							"example": 5
						},
						"block_time": {
							"description": "禁止登录时间",
							"type": "integer",
							"default": 300,
							"maximum": 31536000,
							"minimum": 300,
							"example": 300
						}
					},
					"required": []
				},
				"login_limit": {
					"description": "登录管理口的ip允许列表",
					"type": "object",
					"properties": {
						"state": {
							"description": "启用禁用登陆限制",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"ip_addr": {
							"description": "允许的ip",
							"type": "array",
							"default": [],
							"items": {
								"description": "放通ip",
								"type": "string"
							}
						}
					}
				},
				"risk_operation_verify": {
					"description": "高危操作密码校验",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				}
			}
		}
	}
}