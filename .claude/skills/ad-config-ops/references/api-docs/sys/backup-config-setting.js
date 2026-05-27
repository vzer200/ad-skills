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
		"/api/ad/v3/sys/backup-config-setting": {
			"description": "查看、修改定时备份配置",
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
					"backup-config-setting"
				],
				"summary": "get specific backup-config-setting",
				"description": "查看当前已有的定时备份配置信息",
				"operationId": "get_backup_config_setting",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_backup_config_setting_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific backup-config-setting",
						"description": "查看当前已有的定时备份配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/sys/backup-config-setting"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/sys/backup-config-setting 响应",
						"description": "返回GET /api/ad/v3/sys/backup-config-setting的响应数据",
						"value": {
							"filename_prefix": "AD7.0.5",
							"local_storage": {
								"frequency": "DAILY",
								"capacity": 7
							},
							"external_storage": {
								"state": "DISABLE",
								"frequency": "DAILY",
								"task_time": "00:00",
								"day_of_month": 1,
								"day_of_week": 1,
								"server": {
									"transport_protocol": "FTP",
									"upload_url": "ftp://192.168.1.100/conf_bak/",
									"username": "user_1",
									"password": "example_string",
									"pk_password": "example_string",
									"encrypted_password": "A1B2C3D4",
									"ftp_encoding": "UTF8",
									"ftp_mode": "PASSIVE"
								},
								"network": "AUTO",
								"upload_package": [
									"BACKUP-CONFIG-PACKAGE"
								],
								"file_encryption": {
									"state": "DISABLE",
									"password": "example_string",
									"pk_password": "example_string",
									"encrypted_password": "A1B2C3D4"
								}
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"backup-config-setting"
				],
				"summary": "replace backup-config-setting",
				"description": "修改定时备份配置",
				"operationId": "replace_backup_config_setting",
				"parameters": [
					{
						"$ref": "#/parameters/BACKUP-CONFIG-SETTING-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_backup_config_setting_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace backup-config-setting",
						"description": "修改定时备份配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/sys/backup-config-setting",
							"body": {}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/sys/backup-config-setting 响应",
						"description": "返回PUT /api/ad/v3/sys/backup-config-setting的响应数据",
						"value": {
							"filename_prefix": "AD7.0.5",
							"local_storage": {
								"frequency": "DAILY",
								"capacity": 7
							},
							"external_storage": {
								"state": "DISABLE",
								"frequency": "DAILY",
								"task_time": "00:00",
								"day_of_month": 1,
								"day_of_week": 1,
								"server": {
									"transport_protocol": "FTP",
									"upload_url": "ftp://192.168.1.100/conf_bak/",
									"username": "user_1",
									"password": "example_string",
									"pk_password": "example_string",
									"encrypted_password": "A1B2C3D4",
									"ftp_encoding": "UTF8",
									"ftp_mode": "PASSIVE"
								},
								"network": "AUTO",
								"upload_package": [
									"BACKUP-CONFIG-PACKAGE"
								],
								"file_encryption": {
									"state": "DISABLE",
									"password": "example_string",
									"pk_password": "example_string",
									"encrypted_password": "A1B2C3D4"
								}
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"backup-config-setting"
				],
				"summary": "modify backup-config-setting",
				"description": "修改定时备份配置",
				"operationId": "edit_backup_config_setting",
				"parameters": [
					{
						"$ref": "#/parameters/BACKUP-CONFIG-SETTING-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_backup_config_setting_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify backup-config-setting",
						"description": "修改定时备份配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/sys/backup-config-setting",
							"body": {}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/sys/backup-config-setting 响应",
						"description": "返回PATCH /api/ad/v3/sys/backup-config-setting的响应数据",
						"value": {
							"filename_prefix": "AD7.0.5",
							"local_storage": {
								"frequency": "DAILY",
								"capacity": 7
							},
							"external_storage": {
								"state": "DISABLE",
								"frequency": "DAILY",
								"task_time": "00:00",
								"day_of_month": 1,
								"day_of_week": 1,
								"server": {
									"transport_protocol": "FTP",
									"upload_url": "ftp://192.168.1.100/conf_bak/",
									"username": "user_1",
									"password": "example_string",
									"pk_password": "example_string",
									"encrypted_password": "A1B2C3D4",
									"ftp_encoding": "UTF8",
									"ftp_mode": "PASSIVE"
								},
								"network": "AUTO",
								"upload_package": [
									"BACKUP-CONFIG-PACKAGE"
								],
								"file_encryption": {
									"state": "DISABLE",
									"password": "example_string",
									"pk_password": "example_string",
									"encrypted_password": "A1B2C3D4"
								}
							}
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys backup-config-setting filename_prefix test local_storage { capacity 7 frequency daily }",
					"description": "修改本地定时备份配置，设置备份频率为每天，存储周期为最近7天的本地备份记录"
				},
				{
					"command": "list sys backup-config-setting",
					"description": "查看当前备份配置设置信息"
				}
			]
		}
	},
	"parameters": {
		"BACKUP-CONFIG-SETTING-CONFIG": {
			"name": "BACKUP-CONFIG-SETTING-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.backup_config_setting"
			}
		},
		"BACKUP-CONFIG-SETTING-PROPERTY": {
			"name": "BACKUP-CONFIG-SETTING-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.backup_config_setting"
			}
		}
	},
	"responses": {
		"operation_config_backup_config_setting_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.backup_config_setting"
			}
		}
	},
	"definitions": {
		"config.backup_config_setting": {
			"type": "object",
			"properties": {
				"filename_prefix": {
					"type": "string",
					"description": "备份文件名前缀",
					"example": "AD7.0.5"
				},
				"local_storage": {
					"type": "object",
					"description": "本地备份配置",
					"properties": {
						"frequency": {
							"type": "string",
							"description": "本地存储配置的频率",
							"enum": [
								"DAILY"
							],
							"default": "DAILY",
							"example": "DAILY"
						},
						"capacity": {
							"type": "integer",
							"description": "本地存储配置最多的备份数",
							"minimum": 0,
							"maximum": 30,
							"default": 7,
							"example": 7
						}
					},
					"required": []
				},
				"external_storage": {
					"type": "object",
					"description": "外部备份配置",
					"properties": {
						"state": {
							"type": "string",
							"description": "是否开启外部备份",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"frequency": {
							"type": "string",
							"description": "外部备份的频率",
							"enum": [
								"DAILY",
								"WEEKLY",
								"MONTHLY"
							],
							"default": "DAILY",
							"example": "DAILY"
						},
						"task_time": {
							"type": "string",
							"description": "时间格式，Format: 'hh:mm'",
							"default": "00:00",
							"example": "08:05"
						},
						"day_of_month": {
							"type": "integer",
							"description": "当前月份",
							"default": 1,
							"minimum": 1,
							"maximum": 31,
							"example": 31
						},
						"day_of_week": {
							"type": "integer",
							"description": "当前是一周的第几天",
							"default": 1,
							"minimum": 0,
							"maximum": 6,
							"example": 1
						},
						"server": {
							"type": "object",
							"description": "外部备份服务器",
							"required": [
								"upload_url"
							],
							"properties": {
								"transport_protocol": {
									"type": "string",
									"description": "文件传输协议",
									"enum": [
										"SFTP",
										"FTP"
									],
									"default": "FTP",
									"example": "FTP"
								},
								"upload_url": {
									"type": "string",
									"description": "外部备份服务器url",
									"example": "ftp://192.168.1.100/conf_bak/",
									"maxLength": 1024,
									"minLength": 1
								},
								"username": {
									"type": "string",
									"description": "外部备份服务器的用户名",
									"example": "user_1",
									"maxLength": 63,
									"minLength": 0
								},
								"password": {
									"type": "string",
									"description": "外部备份服务器的密码",
									"maxLength": 63,
									"minLength": 0
								},
								"pk_password": {
									"type": "string",
									"description": "外部备份服务器的密码"
								},
								"encrypted_password": {
									"type": "string",
									"description": "外部备份服务器的加密密码",
									"example": "A1B2C3D4"
								},
								"ftp_encoding": {
									"type": "string",
									"description": "外部备份服务器的编码",
									"enum": [
										"UTF8",
										"GBK"
									],
									"default": "UTF8",
									"example": "GBK"
								},
								"ftp_mode": {
									"type": "string",
									"description": "FTP传输模式",
									"enum": [
										"PORT",
										"PASSIVE"
									],
									"default": "PASSIVE",
									"example": "PORT"
								}
							}
						},
						"network": {
							"description": "选择的网络",
							"type": "string",
							"enum": [
								"MANAGE_NET",
								"SERVICE_NET",
								"AUTO"
							],
							"default": "AUTO",
							"example": "AUTO"
						},
						"upload_package": {
							"description": "文件类型",
							"type": "array",
							"items": {
								"type": "string",
								"enum": [
									"BACKUP-CONFIG-PACKAGE",
									"JSON-CONFIG-PACKAGE"
								],
								"example": "BACKUP-CONFIG-PACKAGE"
							}
						},
						"file_encryption": {
							"description": "文件加密信息",
							"type": "object",
							"properties": {
								"state": {
									"type": "string",
									"description": "是否开启文件加密",
									"enum": [
										"ENABLE",
										"DISABLE"
									],
									"default": "DISABLE",
									"example": "DISABLE"
								},
								"password": {
									"type": "string",
									"description": "文件加密密码",
									"maxLength": 64,
									"minLength": 8
								},
								"pk_password": {
									"type": "string",
									"description": "文件加密密码"
								},
								"encrypted_password": {
									"type": "string",
									"description": "文件加密密码",
									"example": "A1B2C3D4"
								}
							}
						}
					}
				}
			}
		}
	}
}