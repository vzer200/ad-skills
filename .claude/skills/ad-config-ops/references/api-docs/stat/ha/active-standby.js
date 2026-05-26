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
		"/api/ad/v3/stat/ha/active-standby": {
			"description": "获取双机运行状态",
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
				"summary": "get all active-standby statistics",
				"description": "获取双机运行状态",
				"operationId": "get_statistics_of_active_standby_list",
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
						"$ref": "#/responses/operation_stat_active_standby"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_active_standby": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.active_standby"
			}
		}
	},
	"definitions": {
		"stat.active_standby": {
			"type": "object",
			"properties": {
				"local": {
					"description": "本机设备状态",
					"$ref": "#/definitions/stat.active_standby_device_status"
				},
				"peer": {
					"description": "对端设备状态",
					"$ref": "#/definitions/stat.active_standby_device_status"
				}
			}
		},
		"stat.active_standby_device_status": {
			"type": "object",
			"properties": {
				"host_name": {
					"description": "当前主机名",
					"type": "string",
					"example": "ad.sangfor.com-1"
				},
				"status": {
					"description": "双机运行状态（ACTIVE-主机/STANDBY-备机）",
					"type": "string",
					"enum": [
						"ACTIVE",
						"STANDBY"
					],
					"example": "ACTIVE"
				},
				"health": {
					"description": "健康状态（INITIAL-初始化/NORMAL-正常/ALERT-告警/SILENT-静默/FAILURE-故障/OFFLINE-离线）",
					"type": "string",
					"enum": [
						"INITIAL",
						"NORMAL",
						"ALERT",
						"SILENT",
						"FAILURE",
						"FAILSAFE",
						"OFFLINE"
					],
					"example": "NORMAL"
				},
				"failure_reason": {
					"description": "故障原因详情",
					"type": "string",
					"example": ""
				},
				"ha": {
					"description": "主心跳口状态（NORMAL-正常/FAILURE-故障）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE"
					],
					"example": "FAILURE"
				},
				"ha_alternate": {
					"description": "备心跳口状态（NORMAL-正常/FAILURE-故障）",
					"type": "string",
					"enum": [
						"NORMAL",
						"FAILURE"
					],
					"example": "NORMAL"
				},
				"traffic": {
					"description": "业务健康状态（NORMAL-正常/LINK-OFFLINE-链路离线/LINK-FAILURE-链路故障/UNKNOWN-未知）",
					"type": "object",
					"properties": {
						"health": {
							"type": "string",
							"description": "业务健康状态",
							"enum": [
								"NORMAL",
								"LINK-OFFLINE",
								"LINK-FAILURE",
								"UNKNOWN"
							],
							"example": "NORMAL"
						},
						"failure_reason": {
							"description": "故障原因详情",
							"type": "string",
							"example": ""
						}
					}
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
				},
				"session_synchronize": {
					"description": "会话同步状态（PROCESSION-同步中/COMPLETED-完成/INCOMPLETE-未完成/DISABLE-禁用）",
					"type": "string",
					"enum": [
						"PROCESSING",
						"COMPLETED",
						"INCOMPLETE",
						"DISABLE"
					],
					"example": "COMPLETED"
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
				"last_configure_synchronize": {
					"description": "最近配置同步信息",
					"type": "object",
					"properties": {
						"time": {
							"description": "同步时间",
							"type": "integer"
						},
						"detail": {
							"description": "同步详情",
							"type": "string"
						}
					}
				}
			}
		}
	}
}