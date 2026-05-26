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
		"/api/ad/v3/ha/snat-combination/": {
			"description": "源地址转换关联组配置相关操作",
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
					"snat-combination"
				],
				"summary": "get all snat-combination",
				"description": "获取全部源地址转换关联组",
				"operationId": "get_snat_combination_list",
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
						"$ref": "#/responses/operation_config_snat_combination_list"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"snat-combination"
				],
				"summary": "modify snat-combination",
				"description": "修改源地址转换关联组",
				"operationId": "edit_snat_combination_list",
				"parameters": [
					{
						"$ref": "#/parameters/SNAT-COMBINATION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_combination_list"
					}
				}
			}
		},
		"/api/ad/v3/ha/snat-combination/{name}": {
			"description": "源地址转换关联组",
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
					"snat-combination"
				],
				"summary": "get specific snat-combination",
				"description": "获取指定源地址转换关联组",
				"operationId": "get_snat_combination",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_combination_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"snat-combination"
				],
				"summary": "modify specific snat-combination",
				"description": "修改指定源地址转换关联组",
				"operationId": "edit_snat_combination",
				"parameters": [
					{
						"$ref": "#/parameters/SNAT-COMBINATION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_combination_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha snat-combination",
					"description": "获取全部源地址转换关联组配置"
				},
				{
					"command": "list ha snat-combination 源地址转换关联组_1",
					"description": "获取指定源地址转换关联组源地址转换关联组_1的配置"
				}
			]
		}
	},
	"parameters": {
		"SNAT-COMBINATION-CONFIG": {
			"name": "SNAT-COMBINATION-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.snat_combination"
			}
		},
		"SNAT-COMBINATION-PROPERTY": {
			"name": "SNAT-COMBINATION-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.snat_combination"
			}
		}
	},
	"responses": {
		"operation_config_snat_combination_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snat_combination_list"
			}
		},
		"operation_config_snat_combination_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snat_combination"
			}
		}
	},
	"definitions": {
		"config.snat_combination_list": {
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
						"$ref": "#/definitions/config.snat_combination"
					}
				}
			}
		},
		"config.snat_combination": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "指定源地址转换关联组的名称, 在源地址转换关联组配置中必须唯一",
					"type": "string",
					"readOnly": true,
					"example": "snat_relate_group_1"
				},
				"description": {
					"description": "snat关联组描述",
					"type": "string",
					"readOnly": true
				},
				"snats": {
					"description": "指定源地址转换关联组内关联的源地址转换名称列表",
					"type": "array",
					"readOnly": true,
					"items": {
						"description": "源地址转换名称",
						"type": "string",
						"example": "snat_out_wan1"
					},
					"maxItems": 1000
				},
				"associated_application_group": {
					"description": "指定源地址转换关联组关联的应用组",
					"type": "string",
					"default": "DEFAULT",
					"example": "websrv_appgroup"
				}
			}
		}
	}
}