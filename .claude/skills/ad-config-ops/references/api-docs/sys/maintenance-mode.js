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
		"/api/ad/v3/sys/maintenance-mode": {
			"description": "查看、修改系统维护配置",
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
					"maintenance-mode"
				],
				"summary": "get maintenance-mode",
				"description": "查看当前已有的系统维护配置信息",
				"operationId": "get_maintenance_mode",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_maintenance_mode_object"
					}
				}
			},
			"put": {
				"tags": [
					"maintenance-mode"
				],
				"summary": "replace maintenance-mode",
				"description": "修改系统维护配置",
				"operationId": "replace_maintenance_mode",
				"parameters": [
					{
						"$ref": "#/parameters/MAINTENANCE-MODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_maintenance_mode_object"
					}
				}
			},
			"patch": {
				"tags": [
					"maintenance-mode"
				],
				"summary": "modify maintenance-mode",
				"description": "修改系统维护配置",
				"operationId": "edit_maintenance_mode",
				"parameters": [
					{
						"$ref": "#/parameters/MAINTENANCE-MODE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_maintenance_mode_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys maintenance-mode console_service { lan_stat enable } troubleshooting_port { management_stat enable ssh_maintenance_port 22 }",
					"description": "修改当前系统维护配置，开启lan口远程维护，开启管理口ssh后台维护端口，设置ssh后台维护端口为22"
				},
				{
					"command": "list sys maintenance-mode",
					"description": "查看当前系统维护配置信息"
				}
			]
		}
	},
	"parameters": {
		"MAINTENANCE-MODE-CONFIG": {
			"name": "MAINTENANCE-MODE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.maintenance_mode"
			}
		},
		"MAINTENANCE-MODE-PROPERTY": {
			"name": "MAINTENANCE-MODE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.maintenance_mode"
			}
		}
	},
	"responses": {
		"operation_config_maintenance_mode_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.maintenance_mode"
			}
		}
	},
	"definitions": {
		"config.maintenance_mode": {
			"type": "object",
			"properties": {
				"console_service": {
					"description": "web控制台远程维护配置",
					"type": "object",
					"properties": {
						"lan_stat": {
							"description": "LAN口远程维护开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"wan_stat": {
							"description": "WAN口远程维护开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE",
								"TEMPORARY"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"expired_timestamp": {
							"description": "WAN口远程维护开关定时关闭时间",
							"type": "integer"
						}
					}
				},
				"troubleshooting_port": {
					"description": "SSH后台维护配置",
					"type": "object",
					"properties": {
						"lan_stat": {
							"description": "LAN口SSH后台维护开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"management_stat": {
							"description": "管理口SSH后台维护开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"wan_stat": {
							"description": "WAN口SSH后台维护开关",
							"title": "WAN口配置",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE",
								"TEMPORARY"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"expired_timestamp": {
							"description": "WAN口SSH后台维护开关定时关闭时间",
							"title": "过期时间",
							"type": "integer",
							"readOnly": true
						},
						"ssh_maintenance_port": {
							"description": "SSH后台维护端口",
							"title": "SSH后台维护端口",
							"type": "integer",
							"default": 22,
							"maximum": 65535,
							"minimum": 1,
							"example": 22
						}
					}
				},
				"serial_port": {
					"description": "console串口维护",
					"type": "object",
					"properties": {
						"serial_port_timeout": {
							"type": "integer",
							"description": "console串口会话超时时间",
							"default": 600,
							"maximum": 86400,
							"minimum": 60,
							"example": 600
						}
					}
				},
				"zta_token_config": {
					"description": "安全选项",
					"type": "object",
					"properties": {
						"zta_security_enable": {
							"description": "zta模块开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"console_denied": {
							"description": "控制面拦截开关",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"dataplane_denied": {
							"description": "数据面拦截开关",
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
	}
}