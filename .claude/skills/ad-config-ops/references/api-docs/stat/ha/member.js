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
		"/api/ad/v3/stat/ha/member/": {
			"description": "获取集群成员状态与统计数据",
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
				"summary": "get all member statistics",
				"description": "获取集群成员状态与统计数据",
				"operationId": "get_statistics_of_member_list",
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
						"$ref": "#/responses/operation_stat_member_detail_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/ha/member/{name}": {
			"description": "获取指定集群成员状态与统计数据",
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
				"summary": "get specific member statistics",
				"description": "获取指定集群成员状态与统计数据",
				"operationId": "get_statistics_of_member",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_member_detail"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_member_detail_list": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.member_detail_list"
			}
		},
		"operation_stat_member_detail": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.member_detail"
			}
		}
	},
	"parameters": {
		"sub_path": {
			"name": "sub_path",
			"in": "path",
			"type": "string",
			"description": "sub path under /stat/",
			"required": true
		},
		"member_name": {
			"name": "member_name",
			"in": "path",
			"type": "string",
			"description": "member host name",
			"required": true
		},
		"link_wan_name": {
			"name": "link_wan_name",
			"in": "path",
			"type": "string",
			"description": "link-wan config name",
			"required": true
		}
	},
	"definitions": {
		"stat.member_detail_list": {
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
						"$ref": "#/definitions/stat.member_detail"
					}
				}
			}
		},
		"stat.member_detail": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "成员主机名",
					"example": ""
				},
				"location": {
					"type": "string",
					"description": "本机设备还是远端设备",
					"enum": [
						"LOCAL",
						"REMOTE"
					],
					"example": "REMOTE"
				},
				"state": {
					"type": "string",
					"description": "该设备处于启用还是禁用状态",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"health": {
					"type": "string",
					"description": "成员健康状态健康状态（INITIAL-初始化/NORMAL-正常/ALERT-告警/SILENT-静默/FAILURE-故障/OFFLINE-离线）",
					"enum": [
						"INITAL",
						"NORMAL",
						"ALERT",
						"SILENT",
						"FAILURE",
						"OFFLINE"
					],
					"example": "NORMAL"
				},
				"failure_reason": {
					"type": "string",
					"description": "故障原因详情",
					"example": ""
				},
				"master_controller": {
					"type": "string",
					"description": "当前设备控制转态（ACTIVE为主控，其他为非主控）",
					"enum": [
						"NONE",
						"ACTIVE",
						"STANDBY"
					],
					"example": "ACTIVE"
				},
				"configure_synchronize": {
					"description": "配置同步状态（COMPLETED-完成/INCOMPLETED-未完成）",
					"type": "string",
					"enum": [
						"COMPLETED",
						"INCOMPLETE"
					],
					"example": "COMPLETED"
				},
				"application_group": {
					"type": "object",
					"description": "应用组统计信息",
					"properties": {
						"total": {
							"type": "integer",
							"description": "应用组数量"
						},
						"state": {
							"type": "object",
							"description": "应用组状态",
							"properties": {
								"active": {
									"type": "array",
									"description": "主机",
									"items": {
										"type": "string"
									}
								},
								"standby": {
									"type": "array",
									"description": "备机",
									"items": {
										"type": "string"
									}
								}
							}
						},
						"health": {
							"type": "object",
							"description": "应用组健康状态",
							"properties": {
								"normal": {
									"type": "array",
									"description": "状态正常",
									"items": {
										"type": "string"
									}
								},
								"failure": {
									"type": "array",
									"description": "状态异常",
									"items": {
										"type": "string"
									}
								}
							}
						}
					}
				}
			}
		}
	}
}