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
		"/api/ad/v3/lc/time-plan/": {
			"description": "智能路由-时间计划配置管理操作",
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
					"time-plan"
				],
				"summary": "get all time-plan",
				"description": "查看智能路由-时间计划配置信息",
				"operationId": "get_time_plan_list",
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
						"$ref": "#/responses/operation_config_time_plan_list"
					}
				}
			},
			"post": {
				"tags": [
					"time-plan"
				],
				"summary": "create new time-plan",
				"description": "新建智能路由-时间计划配置",
				"operationId": "add_time_plan_list",
				"parameters": [
					{
						"$ref": "#/parameters/TIME-PLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_plan_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": " create lc time-plan workday active_times { monday [ 9:00-18:00 ] tuesday [ 9:00-18:00 ] wednesday [ 9:00-18:00 ] thursday [ 9:00-18:00 ] friday [ 9:00-18:00 ]}",
					"description": "创建时间计划workday，时间为周一至周五 9:00-18:00 "
				},
				{
					"command": " modify lc time-plan workday active_times { monday [ 9:30-18:00 ] tuesday [ 9:30-18:00 ] wednesday [ 9:30-18:00 ] thursday [ 9:30-18:00 ] friday [ 9:30-18:00 ]}",
					"description": "修改时间计划workday，时间为周一至周五 9:30-18:00 "
				},
				{
					"command": " list lc time-plan",
					"description": "查看时间计划的配置信息"
				}
			]
		},
		"/api/ad/v3/lc/time-plan/{name}": {
			"description": "智能路由-时间计划配置管理操作",
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
					"time-plan"
				],
				"summary": "get specific time-plan",
				"description": "查看智能路由-时间计划配置信息",
				"operationId": "get_time_plan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_plan_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"time-plan"
				],
				"summary": "create new time-plan",
				"description": "新建智能路由-时间计划配置",
				"operationId": "create_time_plan",
				"parameters": [
					{
						"$ref": "#/parameters/TIME-PLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_plan_object"
					}
				}
			},
			"put": {
				"tags": [
					"time-plan"
				],
				"summary": "replace specific time-plan",
				"description": "更新智能路由-时间计划配置",
				"operationId": "replace_time_plan",
				"parameters": [
					{
						"$ref": "#/parameters/TIME-PLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_plan_object"
					}
				}
			},
			"patch": {
				"tags": [
					"time-plan"
				],
				"summary": "modify specific time-plan",
				"description": "更新智能路由-时间计划配置",
				"operationId": "edit_time_plan",
				"parameters": [
					{
						"$ref": "#/parameters/TIME-PLAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_plan_object"
					}
				}
			},
			"delete": {
				"tags": [
					"time-plan"
				],
				"summary": "delete specific time-plan",
				"description": "删除智能路由-时间计划配置",
				"operationId": "delete_time_plan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_time_plan_object"
					}
				}
			}
		}
	},
	"parameters": {
		"TIME-PLAN-CONFIG": {
			"name": "TIME-PLAN-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.time_plan"
			}
		},
		"TIME-PLAN-PROPERTY": {
			"name": "TIME-PLAN-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.time_plan"
			}
		}
	},
	"responses": {
		"operation_config_time_plan_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.time_plan_list"
			}
		},
		"operation_config_time_plan_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.time_plan"
			}
		}
	},
	"definitions": {
		"config.time_plan_list": {
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
					"description": "时间计划列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.time_plan"
					}
				}
			}
		},
		"config.time_plan": {
			"type": "object",
			"required": [
				"name",
				"active_times"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；时间计划的名称。",
					"example": "working day"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。",
					"example": ""
				},
				"active_times": {
					"type": "object",
					"description": "必选参数；时间段，以周为周期。",
					"properties": {
						"monday": {
							"description": "周一，只支持时间范围,起始时间和结束时间均只支持半点和整点",
							"type": "array",
							"maxItems": 24,
							"items": {
								"type": "string",
								"description": "周一时间戳，可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
								"example": "08:30-12:00"
							},
							"example": [
								"07:30-11:30",
								"14:00-18:00"
							]
						},
						"tuesday": {
							"description": "周二，只支持时间范围,起始时间和结束时间均只支持半点和整点",
							"type": "array",
							"maxItems": 24,
							"items": {
								"type": "string",
								"description": "周二时间戳，可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
								"example": "08:30-12:00"
							},
							"example": [
								"07:30-11:30",
								"14:00-18:00"
							]
						},
						"wednesday": {
							"description": "周三，只支持时间范围,起始时间和结束时间均只支持半点和整点",
							"type": "array",
							"maxItems": 24,
							"items": {
								"type": "string",
								"description": "周三时间戳，可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
								"example": "08:30-12:00"
							},
							"example": [
								"07:30-11:30",
								"14:00-18:00"
							]
						},
						"thursday": {
							"description": "周四，只支持时间范围,起始时间和结束时间均只支持半点和整点",
							"type": "array",
							"maxItems": 24,
							"items": {
								"type": "string",
								"description": "周四时间戳，可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
								"example": "08:30-12:00"
							},
							"example": [
								"07:30-11:30",
								"14:00-18:00"
							]
						},
						"friday": {
							"description": "周五，只支持时间范围,起始时间和结束时间均只支持半点和整点",
							"type": "array",
							"maxItems": 24,
							"items": {
								"type": "string",
								"description": "周五时间戳，可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
								"example": "08:30-12:00"
							},
							"example": [
								"07:30-11:30",
								"14:00-18:00"
							]
						},
						"saturday": {
							"description": "周六，只支持时间范围,起始时间和结束时间均只支持半点和整点",
							"type": "array",
							"maxItems": 24,
							"items": {
								"type": "string",
								"description": "周六时间戳，可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
								"example": "08:30-12:00"
							},
							"example": [
								"07:30-11:30",
								"14:00-18:00"
							]
						},
						"sunday": {
							"description": "周日，只支持时间范围,起始时间和结束时间均只支持半点和整点",
							"type": "array",
							"maxItems": 24,
							"items": {
								"type": "string",
								"description": "周日时间戳，可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
								"example": "08:30-12:00"
							},
							"example": [
								"07:30-11:30",
								"14:00-18:00"
							]
						}
					}
				}
			}
		},
		"config.active_time": {
			"type": "array",
			"items": {
				"type": "string",
				"description": "可选参数；时间段，格式为hh:mm-hh:mm，比如08:30-12:00。",
				"example": "08:30-12:00"
			},
			"example": [
				"07:30-11:30",
				"14:00-18:00"
			]
		}
	}
}