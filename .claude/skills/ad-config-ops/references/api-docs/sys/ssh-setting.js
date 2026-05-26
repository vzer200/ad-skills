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
		"/api/ad/v3/sys/ssh-setting": {
			"description": "查看、修改SSH命令行配置",
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
					"ssh-setting"
				],
				"summary": "get ssh-setting",
				"description": "查看当前已有的SSH命令行配置信息",
				"operationId": "get_ssh_setting",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_setting_object"
					}
				}
			},
			"put": {
				"tags": [
					"ssh-setting"
				],
				"summary": "replace ssh-setting",
				"description": "修改SSH命令行配置",
				"operationId": "replace_ssh_setting",
				"parameters": [
					{
						"$ref": "#/parameters/SSH-SETTING-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_setting_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ssh-setting"
				],
				"summary": "modify ssh-setting",
				"description": "修改SSH命令行配置",
				"operationId": "edit_ssh_setting",
				"parameters": [
					{
						"$ref": "#/parameters/SSH-SETTING-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_setting_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys ssh-setting ssh_console { session_timeout 86400 ssh_port 22345 ssh_status enable }",
					"description": "修改当前SSH命令行配置，开启ssh命令行，设置会话超时时间为86400秒，ssh命令行端口为22345"
				},
				{
					"command": "list sys ssh-setting",
					"description": "查看当前SSH命令行配置信息"
				}
			]
		}
	},
	"parameters": {
		"SSH-SETTING-CONFIG": {
			"name": "SSH-SETTING-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssh_setting"
			}
		},
		"SSH-SETTING-PROPERTY": {
			"name": "SSH-SETTING-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssh_setting"
			}
		}
	},
	"responses": {
		"operation_config_ssh_setting_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssh_setting"
			}
		}
	},
	"definitions": {
		"config.ssh_setting": {
			"type": "object",
			"properties": {
				"ssh_console": {
					"description": "ssh控制台配置",
					"type": "object",
					"properties": {
						"session_timeout": {
							"description": "ssh会话超时时间",
							"type": "integer",
							"default": 600,
							"maximum": 86400,
							"minimum": 60,
							"example": 600
						},
						"ssh_port": {
							"description": "ssh会话端口",
							"type": "integer",
							"default": 22,
							"maximum": 65535,
							"minimum": 1,
							"example": 22
						},
						"ssh_status": {
							"description": "ssh启/禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						}
					}
				}
			}
		}
	}
}