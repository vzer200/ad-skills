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
		"/api/ad/v3/export": {
			"description": "配置导出管理操作",
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
					"export"
				],
				"summary": "create a export job",
				"description": "新建配置导出任务",
				"operationId": "create_export_job",
				"parameters": [
					{
						"$ref": "#/parameters/EXPORT-ORDER"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create a export job",
						"description": "新建配置导出任务",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/export",
							"body": {
								"resource": "/net/link/wan/",
								"format": "JSON",
								"compress": "NONE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/export 响应",
						"description": "返回POST /api/ad/v3/export的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "save slb ipro format csv compress none",
					"description": "导出应用负载中的ipro脚本 其格式为csv 不压缩"
				},
				{
					"command": "save net snat compress zip format csv",
					"description": "导出网络部署中的源地址转换配置 压缩为zip 格式为csv"
				}
			]
		}
	},
	"parameters": {
		"EXPORT-ORDER": {
			"name": "EXPORT-ORDER",
			"in": "body",
			"required": true,
			"description": "导出配置任务",
			"schema": {
				"$ref": "#/definitions/config.export_config_file"
			}
		}
	},
	"definitions": {
		"config.export_config_file": {
			"type": "object",
			"required": [
				"resource",
				"format"
			],
			"properties": {
				"resource": {
					"description": "导出指定资源名称，资源必须存在",
					"type": "string",
					"example": "/net/link/wan/"
				},
				"format": {
					"description": "导出后文件格式",
					"type": "string",
					"enum": [
						"JSON",
						"CSV"
					],
					"example": "JSON"
				},
				"compress": {
					"description": "导出后文件压缩格式，默认为NONE",
					"type": "string",
					"enum": [
						"NONE",
						"ZIP"
					],
					"default": "NONE"
				},
				"SelectedNames": {
					"description": "证书批量备份时选中的证书列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "现有的证书名字"
					}
				}
			}
		}
	}
}