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
		"/api/ad/v3/debug/sys/upgrade/extract-package-info": {
			"description": "提取升级包版本信息",
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
			"post": {
				"tags": [
					"upgrade"
				],
				"summary": "get package-info",
				"description": "提取升级包版本信息",
				"operationId": "get_package_info",
				"parameters": [
					{
						"$ref": "#/parameters/JSON-PACKAGE"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_upgrade_package_info"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug sys upgrade extract-package-info M5100-AD-7.0.8_B-6460e1.ssu",
					"description": "展示升级包M5100-AD-7.0.8_B-6460e1.ssu的升级信息"
				},
				{
					"command": "run debug sys upgrade file M5100-AD-7.0.8_B-6460e1.ssu username admin password zxc",
					"description": "升级包M5100-AD-7.0.8_B-6460e1.ssu进行升级，并输入当前用户名和密码进行校验"
				},
				{
					"command": "run debug sys upgrade file M5100-AD-7.0.8_B-6460e1.ssu username admin prompt_password",
					"description": "升级包M5100-AD-7.0.8_B-6460e1.ssu进行升级，并输入当前用户名和密码进行校验；当输入prompt_password后，按回车后输密码，密码不明文显示在屏幕上"
				},
				{
					"command": "list debug sys upgrade",
					"description": "获取升级历史"
				}
			]
		},
		"/api/ad/v3/debug/sys/upgrade/": {
			"description": "系统升级操作",
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
					"upgrade"
				],
				"summary": "get upgrade history",
				"description": "查询系统升级历史记录",
				"operationId": "get_upgrade_history",
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
						"$ref": "#/responses/operation_config_upgrade_history"
					}
				}
			},
			"post": {
				"tags": [
					"upgrade"
				],
				"summary": "perform upgrade",
				"description": "执行系统升级任务",
				"operationId": "perform_upgrade",
				"parameters": [
					{
						"$ref": "#/parameters/JSON-PACKAGE-WITH-PASSWORD"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_upgrade_progress"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				}
			}
		}
	},
	"parameters": {
		"JSON-PACKAGE": {
			"name": "JSON-PACKAGE",
			"in": "body",
			"required": true,
			"description": "JSON-SSU Object",
			"schema": {
				"$ref": "#/definitions/debug.upgrade_ssu"
			}
		},
		"JSON-PACKAGE-WITH-PASSWORD": {
			"name": "JSON-PACKAGE-WITH-PASSWORD",
			"in": "body",
			"required": true,
			"description": "JSON Config Password",
			"schema": {
				"$ref": "#/definitions/debug.upgrade_ssu_with_password"
			}
		}
	},
	"responses": {
		"operation_config_upgrade_package_info": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.upgrade_package_info"
			}
		},
		"operation_config_upgrade_progress": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.upgrade_progress"
			}
		},
		"operation_config_upgrade_history": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.upgrade_history_list"
			}
		}
	},
	"definitions": {
		"debug.upgrade_ssu": {
			"type": "object",
			"required": [
				"file_token"
			],
			"properties": {
				"file_token": {
					"type": "string",
					"description": "token of file-resource",
					"example": "1A2B3C4D5E6F"
				}
			}
		},
		"debug.upgrade_ssu_with_password": {
			"type": "object",
			"required": [
				"file_token"
			],
			"properties": {
				"file_token": {
					"type": "string",
					"description": "系统填写；升级包文件token",
					"example": "1A2B3C4D5E6F"
				},
				"username": {
					"type": "string",
					"example": "admin",
					"description": "必选参数；当前操作人用户名",
					"writeOnly": true
				},
				"password": {
					"type": "string",
					"writeOnly": true,
					"example": "admin",
					"description": "升级设备需要输入当前用户的密码，password和pk_password二者必选其一"
				},
				"pk_password": {
					"type": "string",
					"writeOnly": true,
					"description": "升级设备需要输入当前用户的密码，password和pk_password二者必选其一"
				}
			}
		},
		"debug.upgrade_package_info": {
			"type": "object",
			"properties": {
				"version": {
					"type": "string",
					"description": "ssu版本信息",
					"example": "AD7.0.6"
				},
				"file_size": {
					"type": "integer",
					"example": 51200000,
					"description": "文件大小"
				},
				"build": {
					"type": "string",
					"example": "2018-07-30",
					"description": "文件生成时间"
				},
				"description": {
					"type": "string",
					"example": "{README}",
					"description": "升级文件描述"
				},
				"final_reboot": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE",
					"description": "升级完是否重启"
				},
				"check_licence": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE",
					"description": "是否检查证书"
				}
			}
		},
		"debug.upgrade_progress": {
			"type": "object",
			"properties": {
				"progress_percent": {
					"type": "integer",
					"example": 10,
					"description": "升级进度百分比"
				},
				"stage": {
					"type": "string",
					"example": "backup config",
					"description": "升级阶段"
				},
				"description": {
					"type": "string",
					"example": "Software Update SN Invalid",
					"description": "详细信息"
				}
			}
		},
		"debug.upgrade_history_list": {
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
					"description": "升级历史列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.upgrade_history_item"
					}
				}
			}
		},
		"debug.upgrade_history_item": {
			"type": "object",
			"properties": {
				"id": {
					"type": "integer",
					"example": 12,
					"description": "升级历史id"
				},
				"version": {
					"type": "string",
					"example": "AD7.0.3",
					"description": "升级版本"
				},
				"ssu_name": {
					"type": "string",
					"example": "M5100-AD-7.0.3(2017-12-18)_sign.ssu",
					"description": "ssu升级包名称"
				},
				"upgrade_time": {
					"type": "string",
					"example": "2017-12-28 20:58:11",
					"description": "升级时间"
				},
				"result": {
					"type": "string",
					"enum": [
						"SUCCESS",
						"FAILURE"
					],
					"example": "SUCCESS",
					"description": "升级结果"
				},
				"method": {
					"type": "string",
					"enum": [
						"DLAN-CLIENT",
						"WEB-CONSOLE",
						"SSH-CONSOLE"
					],
					"example": "WEB-CONSOLE",
					"description": "升级方式"
				},
				"rollback": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"example": "ENABLE",
					"description": "是否为回滚"
				}
			}
		}
	}
}