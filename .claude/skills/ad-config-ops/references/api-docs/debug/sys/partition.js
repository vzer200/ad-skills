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
		"/api/ad/v3/debug/sys/partition/{name}/activate": {
			"description": "磁盘分区操作",
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
			"post": {
				"tags": [
					"partition"
				],
				"summary": "activate partition",
				"description": "激活磁盘分区",
				"operationId": "activate_partition",
				"parameters": [
					{
						"$ref": "#/parameters/PARTITION-ACTIVATE"
					}
				],
				"responses": {
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys partition AD-708 activate migrate_config enable username admin password zxc",
					"description": "切换到分区AD-708并导入当前配置到新分区，需要输入用户名和密码"
				},
				{
					"command": "run debug sys partition AD-708 activate migrate_config enable username admin prompt_password",
					"description": "切换到分区AD-708并导入当前配置到新分区，需要输入用户名和密码；当输入prompt_password后，按回车后输密码，密码不明文显示在屏幕上"
				}
			]
		}
	},
	"parameters": {
		"PARTITION-ACTIVATE": {
			"name": "PARTITION-ACTIVATE",
			"in": "body",
			"required": true,
			"description": "JSON Activate Partition",
			"schema": {
				"$ref": "#/definitions/config.partition_activate"
			}
		}
	},
	"definitions": {
		"config.partition_activate": {
			"type": "object",
			"required": [
				"migrate_config"
			],
			"properties": {
				"migrate_config": {
					"type": "string",
					"description": "必选参数；是否迁移当前活动分区配置文件到激活目标分区",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE"
				},
				"username": {
					"description": "必选参数；鉴权操作人用户名",
					"type": "string",
					"example": "admin"
				},
				"password": {
					"description": "必选参数；鉴权操作人密码, password和pk_password二选一",
					"type": "string",
					"example": "admin",
					"passwdKey": true
				},
				"pk_password": {
					"description": "激活分区需要当前用户输入密码, password和pk_password二选一",
					"type": "string",
					"writeOnly": true,
					"example": "admin",
					"passwdKey": true
				}
			}
		}
	}
}