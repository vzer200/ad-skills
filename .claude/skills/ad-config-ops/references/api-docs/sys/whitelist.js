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
		"/api/ad/v3/sys/whitelist": {
			"description": "查看、修改管理口白名单配置",
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
					"whitelist"
				],
				"summary": "get whitelist",
				"description": "查看当前已有的管理口白名单配置信息",
				"operationId": "get_whitelist",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_whitelist_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get whitelist",
						"description": "查看当前已有的管理口白名单配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/whitelist"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/whitelist 响应",
						"description": "返回GET /api/ad/v3/sys/whitelist的响应数据",
						"value": {
							"report_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							},
							"snmp_svc": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							},
							"ssh_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "DISABLE"
							},
							"troubleshooting_port": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "DISABLE"
							},
							"web_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"whitelist"
				],
				"summary": "replace whitelist",
				"description": "修改管理口白名单配置",
				"operationId": "replace_whitelist",
				"parameters": [
					{
						"$ref": "#/parameters/SSH-WHITELIST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_whitelist_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace whitelist",
						"description": "修改管理口白名单配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/whitelist",
							"body": {}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/whitelist 响应",
						"description": "返回PUT /api/ad/v3/sys/whitelist的响应数据",
						"value": {
							"report_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							},
							"snmp_svc": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							},
							"ssh_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "DISABLE"
							},
							"troubleshooting_port": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "DISABLE"
							},
							"web_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"whitelist"
				],
				"summary": "modify whitelist",
				"description": "修改管理口白名单配置",
				"operationId": "edit_whitelist",
				"parameters": [
					{
						"$ref": "#/parameters/SSH-SETTING-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ssh_whitelist_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify whitelist",
						"description": "修改管理口白名单配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/whitelist"
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/whitelist 响应",
						"description": "返回PATCH /api/ad/v3/sys/whitelist的响应数据",
						"value": {
							"report_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							},
							"snmp_svc": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							},
							"ssh_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "DISABLE"
							},
							"troubleshooting_port": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "DISABLE"
							},
							"web_console": {
								"whitelist_address": {
									"ref_custom_address_group": "",
									"type": "ALL"
								},
								"whitelist_switch": "ENABLE"
							}
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys whitelist ssh_console { whitelist_switch enable whitelist_address { type all } }",
					"description": "修改当前管理口白名单配置，开启管理口ssh命令行权限，白名单允许地址类型为全部IP"
				},
				{
					"command": "list sys whitelist",
					"description": "查看当前管理口白名单配置信息"
				}
			]
		}
	},
	"parameters": {
		"SSH-WHITELIST-CONFIG": {
			"name": "SSH-WHITELIST-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ssh_whitelist"
			}
		},
		"SSH-WHITELIST-PROPERTY": {
			"name": "SSH-WHITELIST-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ssh_whitelist"
			}
		}
	},
	"responses": {
		"operation_config_ssh_whitelist_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ssh_whitelist"
			}
		}
	},
	"definitions": {
		"config.ssh_whitelist": {
			"description": "管理口白名单",
			"type": "object",
			"properties": {
				"report_console": {
					"description": "报表中心",
					"properties": {
						"whitelist_address": {
							"description": "白名单地址",
							"properties": {
								"ref_custom_address_group": {
									"description": "用户地址集",
									"example": "{custom_address_group}",
									"type": "string",
									"default": ""
								},
								"type": {
									"default": "ALL",
									"description": "地址类型",
									"enum": [
										"ALL",
										"GLOBAL-WHITELIST",
										"CUSTOM-ADDRESS-GROUP"
									],
									"example": "ALL",
									"type": "string"
								}
							},
							"required": [
								"type"
							],
							"type": "object"
						},
						"whitelist_switch": {
							"default": "ENABLE",
							"description": "白名单的开关",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"type": "string"
						}
					},
					"type": "object"
				},
				"snmp_svc": {
					"description": "SNMP服务",
					"properties": {
						"whitelist_address": {
							"description": "白名单地址",
							"properties": {
								"ref_custom_address_group": {
									"description": "用户地址集",
									"example": "{custom_address_group}",
									"type": "string",
									"default": ""
								},
								"type": {
									"default": "ALL",
									"description": "地址类型",
									"enum": [
										"ALL",
										"GLOBAL-WHITELIST",
										"CUSTOM-ADDRESS-GROUP"
									],
									"example": "ALL",
									"type": "string"
								}
							},
							"required": [
								"type"
							],
							"type": "object"
						},
						"whitelist_switch": {
							"default": "ENABLE",
							"description": "白名单的开关",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"type": "string"
						}
					},
					"type": "object"
				},
				"ssh_console": {
					"description": "SSH维护",
					"properties": {
						"whitelist_address": {
							"description": "白名单地址",
							"properties": {
								"ref_custom_address_group": {
									"description": "用户地址集",
									"example": "{custom_address_group}",
									"type": "string",
									"default": ""
								},
								"type": {
									"default": "ALL",
									"description": "地址类型",
									"enum": [
										"ALL",
										"GLOBAL-WHITELIST",
										"CUSTOM-ADDRESS-GROUP"
									],
									"example": "ALL",
									"type": "string"
								}
							},
							"required": [
								"type"
							],
							"type": "object"
						},
						"whitelist_switch": {
							"default": "DISABLE",
							"description": "白名单的开关",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"type": "string"
						}
					},
					"type": "object"
				},
				"troubleshooting_port": {
					"description": "SSH命令行",
					"properties": {
						"whitelist_address": {
							"description": "白名单地址",
							"properties": {
								"ref_custom_address_group": {
									"description": "用户地址集",
									"example": "{custom_address_group}",
									"type": "string",
									"default": ""
								},
								"type": {
									"default": "ALL",
									"description": "地址类型",
									"enum": [
										"ALL",
										"GLOBAL-WHITELIST",
										"CUSTOM-ADDRESS-GROUP"
									],
									"example": "ALL",
									"type": "string"
								}
							},
							"required": [
								"type"
							],
							"type": "object"
						},
						"whitelist_switch": {
							"default": "DISABLE",
							"description": "白名单的开关",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"type": "string"
						}
					},
					"type": "object"
				},
				"web_console": {
					"description": "web控制台白名单",
					"properties": {
						"whitelist_address": {
							"description": "白名单地址",
							"properties": {
								"ref_custom_address_group": {
									"description": "用户地址集",
									"example": "{custom_address_group}",
									"type": "string",
									"default": ""
								},
								"type": {
									"default": "ALL",
									"description": "地址类型",
									"enum": [
										"ALL",
										"GLOBAL-WHITELIST",
										"CUSTOM-ADDRESS-GROUP"
									],
									"example": "ALL",
									"type": "string"
								}
							},
							"required": [
								"type"
							],
							"type": "object"
						},
						"whitelist_switch": {
							"default": "ENABLE",
							"description": "白名单的开关",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"type": "string"
						}
					},
					"type": "object"
				}
			}
		}
	}
}