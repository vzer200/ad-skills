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
		"/api/ad/v3/sys/passwd-policy": {
			"description": "查看、修改账户安全策略配置",
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
					"passwd-policy"
				],
				"summary": "get passwd-policy",
				"description": "查看当前已有的账户安全策略配置信息",
				"operationId": "get_passwd_policy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_passwd_policy_object"
					}
				}
			},
			"put": {
				"tags": [
					"passwd-policy"
				],
				"summary": "replace passwd-policy",
				"description": "修改账户安全策略配置",
				"operationId": "replace_passwd_policy",
				"parameters": [
					{
						"$ref": "#/parameters/PASSWD-POLICY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_passwd_policy_object"
					}
				}
			},
			"patch": {
				"tags": [
					"passwd-policy"
				],
				"summary": "modify passwd-policy",
				"description": "修改账户安全策略配置",
				"operationId": "edit_passwd_policy",
				"parameters": [
					{
						"$ref": "#/parameters/PASSWD-POLICY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_passwd_policy_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys passwd-policy expire_mode { web_console enable } expire_time 180 min_length 8 complexity passwd_complexy_level3",
					"description": "修改当前账户安全策略配置，设置密码强制修改界面为Web控制台，密码更新周期为180天，密码复杂度为3级，密码最小长度为8位"
				},
				{
					"command": "list sys passwd-policy",
					"description": "查看当前账户安全策略配置信息"
				}
			]
		}
	},
	"parameters": {
		"PASSWD-POLICY-CONFIG": {
			"name": "PASSWD-POLICY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.passwd_policy"
			}
		},
		"PASSWD-POLICY-PROPERTY": {
			"name": "PASSWD-POLICY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.passwd_policy"
			}
		}
	},
	"responses": {
		"operation_config_passwd_policy_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.passwd_policy"
			}
		}
	},
	"definitions": {
		"config.passwd_policy": {
			"type": "object",
			"properties": {
				"expire_time": {
					"description": "密码更新周期",
					"type": "integer",
					"default": 180,
					"maximum": 65535,
					"minimum": 0,
					"example": 180
				},
				"expire_mode": {
					"description": "选择开启强制修改密码的界面",
					"type": "object",
					"properties": {
						"web_console": {
							"description": "web界面是否开启",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"ssh_console": {
							"description": "ssh命令行界面开启强制修改密码",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						}
					}
				},
				"complexity": {
					"description": "密码复杂度等级",
					"type": "string",
					"enum": [
						"passwd_complexy_level2",
						"passwd_complexy_level3",
						"passwd_complexy_level4"
					],
					"default": "passwd_complexy_level2",
					"example": "passwd_complexy_level2"
				},
				"max_history": {
					"description": "历史密码重用周期",
					"type": "integer",
					"default": 180,
					"maximum": 65535,
					"minimum": 0,
					"example": 180
				},
				"min_length": {
					"description": "设置的密码最短长度，在8-64之间",
					"type": "integer",
					"default": 8,
					"maximum": 64,
					"minimum": 8,
					"example": 8
				}
			}
		}
	}
}