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
		"/api/ad/v3/import": {
			"description": "配置导入管理操作",
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
					"import"
				],
				"summary": "新建配置导入任务",
				"description": "",
				"operationId": "create_import_job",
				"parameters": [
					{
						"$ref": "#/parameters/IMPORT-ORDER"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_import_json"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "load sys backup-config-recovery file /tmp/aa",
					"description": "导入系统配置恢复文件 文件路径是/tmp/aa"
				},
				{
					"command": "load sys backup-config-recovery file http://backupfile/aa",
					"description": "导入系统配置恢复文件 文件通过http://backupfile/aa下载获取"
				},
				{
					"command": "load sys backup-config-recovery file ftp://backupfile/aa",
					"description": "导入系统配置恢复文件 文件通过ftp://backupfile/aa下载获取"
				}
			]
		}
	},
	"parameters": {
		"IMPORT-ORDER": {
			"name": "IMPORT-ORDER",
			"in": "body",
			"required": true,
			"description": "配置导入任务",
			"schema": {
				"$ref": "#/definitions/config.import_config_file"
			}
		}
	},
	"responses": {
		"operation_config_import_json": {
			"description": "配置导入返回结果",
			"schema": {
				"$ref": "#/definitions/config.import_config_json"
			}
		}
	},
	"definitions": {
		"config.import_config_file": {
			"type": "object",
			"required": [
				"resource",
				"file_token"
			],
			"properties": {
				"resource": {
					"type": "string",
					"description": "导入指定文件资源名称，文件资源必须存在",
					"example": "/net/link/wan/"
				},
				"file_token": {
					"type": "string",
					"description": "资源令牌",
					"example": "1A2B3C4D5E6F"
				}
			}
		},
		"config.import_config_json": {
			"type": "array",
			"items": {
				"type": "object",
				"properties": {
					"resource": {
						"type": "string",
						"description": "返回的资源路径",
						"example": "/net/link/wan/"
					},
					"config": {
						"type": "object",
						"description": "配置列表"
					}
				}
			}
		}
	}
}