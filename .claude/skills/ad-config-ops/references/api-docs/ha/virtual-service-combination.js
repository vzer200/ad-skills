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
		"/api/ad/v3/ha/virtual-service-combination/": {
			"description": "虚拟服务关联组配置相关操作",
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
					"virtual-service-combination"
				],
				"summary": "get all virtual-service-combination",
				"description": "获取所有虚拟服务关联组",
				"operationId": "get_virtual_service_combination_list",
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
						"$ref": "#/responses/operation_config_virtual_service_combination_list"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"virtual-service-combination"
				],
				"summary": "modify virtual-service-combination",
				"description": "修改虚拟服务关联组",
				"operationId": "edit_virtual_service_combination_list",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-SERVICE-COMBINATION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_combination_list"
					}
				}
			}
		},
		"/api/ad/v3/ha/virtual-service-combination/{name}": {
			"description": "指定虚拟服务关联组配置相关操作",
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
					"virtual-service-combination"
				],
				"summary": "get specific virtual-service-combination",
				"description": "获取指定虚拟服务关联组",
				"operationId": "get_virtual_service_combination",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_combination_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"virtual-service-combination"
				],
				"summary": "modify specific virtual-service-combination",
				"description": "修改指定虚拟服务关联组",
				"operationId": "edit_virtual_service_combination",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-SERVICE-COMBINATION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual_service_combination_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha virtual-service-combination",
					"description": "获取全部虚拟服务关联组配置"
				},
				{
					"command": "list ha virtual-service-combination 虚拟服务关联组_1",
					"description": "获取指定虚拟服务关联组虚拟服务关联组_1的配置"
				}
			]
		}
	},
	"parameters": {
		"VIRTUAL-SERVICE-COMBINATION-CONFIG": {
			"name": "VIRTUAL-SERVICE-COMBINATION-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.virtual_service_combination"
			}
		},
		"VIRTUAL-SERVICE-COMBINATION-PROPERTY": {
			"name": "VIRTUAL-SERVICE-COMBINATION-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.virtual_service_combination"
			}
		}
	},
	"responses": {
		"operation_config_virtual_service_combination_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.virtual_service_combination_list"
			}
		},
		"operation_config_virtual_service_combination_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.virtual_service_combination"
			}
		}
	},
	"definitions": {
		"config.virtual_service_combination_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "项目数量最大值",
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
					"description": "页面大小",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "项目长度",
					"type": "integer",
					"example": 8
				},
				"items": {
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.virtual_service_combination"
					}
				}
			}
		},
		"config.virtual_service_combination": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "指定虚拟服务关联组的名称, 在虚拟服务关联组配置中必须唯一",
					"type": "string",
					"readOnly": true,
					"example": "vs_relate_group_1"
				},
				"description": {
					"description": "虚拟服务关联组描述",
					"type": "string",
					"readOnly": true
				},
				"virtual_services": {
					"description": "指定虚拟服务关联组内关联的虚拟服务列表",
					"type": "array",
					"readOnly": true,
					"items": {
						"description": "虚拟服务名称",
						"type": "string",
						"example": "vs_http_8080"
					},
					"example": [
						"vs_http_8080",
						"vs_https_443",
						"vs_https_oa_4433"
					],
					"maxItems": 500
				},
				"associated_application_group": {
					"description": "指定虚拟服务关联组关联的应用组",
					"type": "string",
					"example": "websrv_appgroup"
				}
			}
		}
	}
}