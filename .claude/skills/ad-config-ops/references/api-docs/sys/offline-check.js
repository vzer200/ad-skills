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
		"/api/ad/v3/sys/offline-check/{name}": {
			"description": "离线巡检配置",
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
					"offline-check"
				],
				"summary": "get offline-check",
				"description": "查看当前已有巡检场景",
				"operationId": "get_offline_check",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_offline_check_setting_object"
					}
				}
			},
			"put": {
				"tags": [
					"offline-check"
				],
				"summary": "replace offline-check",
				"description": "修改巡检场景",
				"operationId": "replace_offline_check",
				"parameters": [
					{
						"$ref": "#/parameters/OFFLINE-CHECK-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_offline_check_setting_object"
					}
				}
			},
			"patch": {
				"tags": [
					"offline-check"
				],
				"summary": "modify offline-check",
				"description": "修改巡检场景",
				"operationId": "edit_offline_check",
				"parameters": [
					{
						"$ref": "#/parameters/OFFLINE-CHECK-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_offline_check_setting_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys offline-check xxx health_scene { rule add [ config_id_conflict_check ] }",
					"description": "修改巡检场景的配置，启用id冲突检测"
				},
				{
					"command": "list sys offline-check",
					"description": "查看当前已有巡检场景"
				}
			]
		}
	},
	"parameters": {
		"OFFLINE-CHECK-CONFIG": {
			"name": "OFFLINE-CHECK-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.offline_check"
			}
		},
		"OFFLINE-CHECK-PROPERTY": {
			"name": "OFFLINE-CHECK-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.offline_check"
			}
		}
	},
	"responses": {
		"operation_offline_check_setting_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.offline_check"
			}
		}
	},
	"definitions": {
		"config.offline_check": {
			"description": "离线巡检配置",
			"properties": {
				"description": {
					"description": "描述信息",
					"type": "string"
				},
				"feature_scene": {
					"description": "功能巡检类",
					"properties": {
						"rule": {
							"description": "功能巡检类规则",
							"items": {
								"description": "功能巡检类规则",
								"enum": [
									"APP_VERSION_CHECK",
									"ADMIN_ROLE_CHECK",
									"HEARTBEAT_ERROR_CHECK",
									"DEVICE_SAFE_CHECK",
									"DNS_DETECT_CHECK",
									"DNAT_CHECK",
									"HEARTBEAT_CHECK",
									"STATIC_IP_CHECK",
									"CLUSTER_STATE_CHECK",
									"DNS_PROXY_CHECK",
									"VIRTUAL_MAC_CHECK",
									"DUAL_STATE_CHECK",
									"POOL_PERSIST_CHECK",
									"STATIC_ROUTE_CHECK",
									"POOL_HEALTH_CHECK",
									"RS_LEVEL_CHECK",
									"APP_GROUP_CHECK",
									"DNS_SERVER_STATE_CHECK",
									"LINK_HEALTH_CHECK",
									"STATIC_PROXIMITY_CHECK",
									"DNS64_CHECK",
									"POLICY_ROUTE_CHECK",
									"MANAGE_IP_CHECK",
									"SNMP_TRAPS_CHECK",
									"DNS_REFLECT_CHECK",
									"DNS_SERVER_CHECK",
									"DNAT_PORT_CHECK",
									"SESSION_SYNC_CHECK",
									"MAIL_WARN_CHECK",
									"VIP_POOL_CHECK",
									"PROXY_POLICY_CHECK",
									"WAN_BANDWIDTH_CHECK",
									"FAULT_SWITCH_CHECK",
									"SYSLOG_CHECK"
								],
								"type": "string"
							},
							"type": "array",
							"uniqueItems": true
						}
					},
					"type": "object"
				},
				"health_scene": {
					"description": "健康巡检类",
					"properties": {
						"rule": {
							"description": "健康巡检类规则",
							"items": {
								"description": "健康巡检类规则",
								"enum": [
									"AUTO_UPDATE_CHECK",
									"CPU_CHECK",
									"LOG_CHECK",
									"DEVICE_RUN_TIME",
									"DEVICE_FILE_CHECK",
									"NIC_STATE_CHECK",
									"CORE_PROCESS_CHECK",
									"KERNEL_LOG_CHECK",
									"REMOTE_MAINTAIN_CHECK",
									"BLACK_BOX_CHECK",
									"DMESG_DATA_CHECK",
									"DISK_CHECK",
									"CRASH_LOG_CHECK",
									"MEMORY_CHECK",
									"SPEED_CARD_CHECK",
									"FAN_STATE_CHECK",
									"POWER_STATE_CHECK",
									"BIOS_VERSION_CHECK",
									"WARN_LOG_CHECK",
									"MEMORY_LEAK_CHECK",
									"DEVICE_CONNECTION_CHECK",
									"COREDUMP_INFO_CHECK",
									"CONFIG_ID_CONFLICT_CHECK"
								],
								"type": "string"
							},
							"type": "array",
							"uniqueItems": true
						}
					},
					"type": "object"
				},
				"name": {
					"description": "名称",
					"example": "标准巡检场景",
					"primaryKey": true,
					"type": "string"
				},
				"secure_scene": {
					"description": "安全巡检类",
					"properties": {
						"rule": {
							"description": "安全巡检类规则",
							"items": {
								"description": "安全巡检类规则",
								"enum": [
									"SSH_API_CHECK",
									"PATCH_INFO_CHECK",
									"REPORT_CHECK",
									"WEAK_PASSWORD_CHECK",
									"SSL_POLICY_CHECK",
									"IP_LIMIT_CHECK",
									"OPEN_PORT_CHECK"
								],
								"type": "string"
							},
							"type": "array",
							"uniqueItems": true
						}
					},
					"type": "object"
				}
			},
			"required": [
				"name"
			],
			"type": "object"
		}
	}
}