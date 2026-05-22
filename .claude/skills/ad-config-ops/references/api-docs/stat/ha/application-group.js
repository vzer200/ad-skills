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
		"/api/ad/v3/stat/ha/application-group/": {
			"description": "获取应用组统计信息",
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
					"member"
				],
				"summary": "get all application-group statistics",
				"description": "获取应用组统计信息",
				"operationId": "get_statistics_of_application_group_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_application_group_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/ha/application-group/{name}": {
			"description": "获取某个应用组统计信息",
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
					"member"
				],
				"summary": "get specific application-group statistics",
				"description": "获取某个应用组统计信息",
				"operationId": "get_statistics_of_application_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_application_group_detail"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_application_group_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.application_group_detail_list"
			}
		},
		"operation_stat_application_group_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.application_group_detail"
			}
		}
	},
	"definitions": {
		"stat.application_group_detail_list": {
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
					"type": "array",
					"items": {
						"$ref": "#/definitions/stat.application_group_detail"
					}
				}
			}
		},
		"stat.application_group_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "应用组名称",
					"example": ""
				},
				"active_member": {
					"type": "string",
					"description": "生效设备"
				},
				"standby_member": {
					"type": "string",
					"description": "备份设备"
				},
				"session_sync": {
					"type": "string",
					"description": "会话同步状态（PROCESSION-同步中/COMPLETED-完成/INCOMPLETE-未完成/DISABLE-禁用）",
					"enum": [
						"PROCESSING",
						"COMPLETED",
						"INCOMPLETE",
						"DISABLE"
					]
				},
				"last_failover": {
					"description": "最近主备切换信息",
					"type": "object",
					"properties": {
						"time": {
							"description": "切换时间",
							"type": "integer"
						},
						"detail": {
							"description": "切换详情",
							"type": "string"
						}
					}
				}
			}
		}
	}
}