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
		"/api/ad/v3/rc/software-image/": {
			"description": "镜像管理配置相关操作",
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
					"software-image"
				],
				"summary": "get all software-image",
				"description": "获取镜像信息",
				"operationId": "get_software_image_list",
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
						"$ref": "#/responses/operation_config_software_image_list"
					}
				}
			},
			"post": {
				"tags": [
					"software-image"
				],
				"summary": "create new software-image",
				"description": "新建镜像",
				"operationId": "add_software_image_list",
				"parameters": [
					{
						"$ref": "#/parameters/SOFTWARE-IMAGE-IMPORT"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_software_image_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create rc software-image file ./sign-M5100-AD-7.0.9_2019-06-27.ssi",
					"description": "新建镜像，使用sign-M5100-AD-7.0.9_2019-06-27.ssi包。"
				},
				{
					"command": "delete rc software-image AD-vManager4_2019-07-17-sign",
					"description": "删除镜像AD-vManager4_2019-07-17-sign"
				},
				{
					"command": "list rc software-image AD-vManager4_2019-07-17-sign",
					"description": "查看镜像AD-vManager4_2019-07-17-sign"
				}
			]
		},
		"/api/ad/v3/rc/software-image/{name}": {
			"description": "镜像管理相关操作",
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
					"software-image"
				],
				"summary": "get specific software-image",
				"description": "获取镜像信息",
				"operationId": "get_software_image",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_software_image_object"
					}
				}
			},
			"delete": {
				"tags": [
					"software-image"
				],
				"summary": "delete specific software-image",
				"description": "删除镜像",
				"operationId": "delete_software_image",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_software_image_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SOFTWARE-IMAGE-IMPORT": {
			"name": "SOFTWARE-IMAGE-IMPORT",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.software_image_import"
			}
		}
	},
	"responses": {
		"operation_config_software_image_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.software_image_list"
			}
		},
		"operation_config_software_image_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.software_image"
			}
		}
	},
	"definitions": {
		"config.software_image_import": {
			"type": "object",
			"properties": {
				"file_token": {
					"type": "string",
					"description": "token of file-resource",
					"example": "1A2B3C4D5E6F"
				}
			}
		},
		"config.software_image_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "配置数量上限",
					"type": "integer",
					"example": 4000
				},
				"maximum_size_mb": {
					"type": "integer",
					"description": "最大存储空间",
					"example": 102400
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
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.software_image"
					}
				}
			}
		},
		"config.software_image": {
			"type": "object",
			"readOnly": true,
			"properties": {
				"name": {
					"description": "镜像文件名",
					"type": "string",
					"example": "ad708_image.iso"
				},
				"description": {
					"description": "镜像包描述信息",
					"type": "string"
				},
				"size_mb": {
					"description": "镜像大小",
					"type": "integer",
					"example": 129872
				},
				"last_modify": {
					"description": "镜像文件最近修改时间",
					"type": "string",
					"example": "20190530"
				},
				"compatibility": {
					"type": "string",
					"enum": [
						"COMPATIBLE",
						"IMCOMPATIBLE"
					],
					"description": "当前系统安装器对镜像包的兼容性检查结果",
					"example": "COMPATIBLE"
				},
				"specifications": {
					"description": "分区规格列表",
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"title": {
								"description": "规格名称",
								"type": "string",
								"example": "高"
							},
							"description": {
								"description": "规格描述信息",
								"type": "string",
								"example": "满足更多数据存储需求"
							},
							"size_mb": {
								"description": "空间要求（单位MB）",
								"type": "integer",
								"example": 204800
							},
							"standard": {
								"description": "默认规格（推荐选项）",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"example": "ENABLE"
							}
						}
					}
				},
				"software": {
					"description": "系统软件",
					"type": "string",
					"example": "AD"
				},
				"version": {
					"description": "软件版本",
					"type": "string",
					"example": "7.0.8"
				},
				"build": {
					"description": "软件Build信息",
					"type": "string",
					"example": "20190530"
				}
			}
		}
	}
}