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
		"/api/ad/v3/sys/current-user": {
			"description": "获取当前登录用户信息",
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
					"current-user"
				],
				"summary": "get current-user",
				"description": "获取当前登录用户信息",
				"operationId": "get_current_user",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_current_user_object"
					}
				}
			}
		},
		"/api/ad/v3/sys/current-user/reset-password": {
			"description": "重置当前登录用户密码",
			"post": {
				"tags": [
					"current-user"
				],
				"summary": "reset current-user password",
				"description": "重置当前登录用户密码",
				"operationId": "reset_current_user_password",
				"parameters": [
					{
						"$ref": "#/parameters/CURRENT-USER-CONFIG-RESET-PASSWORD"
					}
				]
			},
			"__sfcli_example__": [
				{
					"command": "modify sys current-user reset-password current_password root1234++ reset_password root1234+ username admin",
					"description": "将当前登录用户admin的用户密码由root1234++改为root1234+"
				}
			]
		}
	},
	"parameters": {
		"CURRENT-USER-CONFIG-RESET-PASSWORD": {
			"name": "CURRENT-USER-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.current_user_reset_password"
			}
		}
	},
	"responses": {
		"operation_config_current_user_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.current_user"
			}
		}
	},
	"definitions": {
		"config.current_user": {
			"type": "object",
			"description": "当前用户信息",
			"properties": {
				"name": {
					"type": "string",
					"description": "当前用户名称",
					"readOnly": true,
					"example": "admin"
				},
				"description": {
					"type": "string",
					"readOnly": true,
					"description": "当前用户描述信息",
					"example": "Super Administrator"
				},
				"role": {
					"type": "string",
					"description": "当前用户角色",
					"example": "admin"
				},
				"permissions": {
					"type": "array",
					"description": "当前用户权限",
					"items": {
						"type": "string",
						"example": [
							"network-manager"
						]
					},
					"example": [
						"network-manager",
						"system-manager",
						"application-manager"
					]
				},
				"permit_ctl": {
					"description": "当前用户所属项目",
					"type": "array",
					"items": {
						"type": "object",
						"description": "项目信息",
						"properties": {
							"role": {
								"type": "string",
								"description": "角色信息， Format: {role}",
								"default": "guest",
								"example": "admin"
							},
							"project": {
								"type": "string",
								"description": "项目信息，Format: {project}",
								"default": "all",
								"example": "common"
							},
							"permissions": {
								"type": "array",
								"description": "权限信息",
								"items": {
									"type": "string",
									"description": "权限类别",
									"example": [
										"network-manager"
									]
								}
							}
						}
					}
				}
			}
		},
		"config.current_user_reset_password": {
			"type": "object",
			"required": [
				"username"
			],
			"properties": {
				"username": {
					"description": "当前登录的用户名",
					"type": "string",
					"example": "admin"
				},
				"current_password": {
					"description": "旧密码，长度限制为1-64个字符",
					"type": "string",
					"maxLength": 64,
					"minLength": 1
				},
				"pk_current_password": {
					"description": "旧密码，长度限制为1-64个字符",
					"type": "string"
				},
				"reset_password": {
					"description": "新密码，长度限制为8-64个字符",
					"type": "string",
					"maxLength": 64,
					"minLength": 8
				},
				"pk_reset_password": {
					"description": "新密码，长度限制为8-64个字符",
					"type": "string"
				}
			}
		}
	}
}