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
		"/api/ad/v3/slb/service-monitor/ftp/": {
			"description": "新建、查看监视器（FTP）配置",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get all service-monitor-ftp",
				"description": "查看当前已有的监视器（FTP）配置信息",
				"operationId": "get_service_monitor_ftp_list",
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
						"$ref": "#/responses/operation_config_service_monitor_ftp_list"
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-ftp",
				"description": "新建一个监视器（FTP）配置",
				"operationId": "add_service_monitor_ftp_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-FTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ftp_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor ftp ftpmonitor description FTP监视器 host * port 21 ftp_mode pasv access_path / username admin password admin debug_mode enable",
					"description": "新建ftp类型的监视器ftpmonitor,使用被动模式访问目录/,用户名密码均为admin,启用调试模式。"
				},
				{
					"command": "modify slb service-monitor ftp ftpmonitor host 4.4.4.4",
					"description": "修改FTP监视器ftpmonitor的监视主机为4.4.4.4"
				},
				{
					"command": "list slb service-monitor ftp ftpmonitor",
					"description": "查看ftp监视器ftpmonitor的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/ftp/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（FTP）配置",
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
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get specific service-monitor-ftp",
				"description": "查看指定的监视器（FTP）配置",
				"operationId": "get_service_monitor_ftp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ftp_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-ftp",
				"description": "新建指定的监视器（FTP）配置",
				"operationId": "create_service_monitor_ftp",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-FTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ftp_object"
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-ftp",
				"description": "修改指定的监视器（FTP）配置",
				"operationId": "replace_service_monitor_ftp",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-FTP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ftp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-ftp",
				"description": "修改指定的监视器（FTP）配置",
				"operationId": "edit_service_monitor_ftp",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-FTP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ftp_object"
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-ftp",
				"description": "删除指定的监视器（FTP）配置",
				"operationId": "delete_service_monitor_ftp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ftp_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-FTP-CONFIG": {
			"name": "SERVICE-MONITOR-FTP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ftp"
			}
		},
		"SERVICE-MONITOR-FTP-PROPERTY": {
			"name": "SERVICE-MONITOR-FTP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ftp"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_ftp_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ftp_list"
			}
		},
		"operation_config_service_monitor_ftp_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ftp"
			}
		}
	},
	"definitions": {
		"config.service_monitor_ftp_list": {
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
						"$ref": "#/definitions/config.service_monitor_ftp"
					}
				}
			}
		},
		"config.service_monitor_ftp": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定监视器的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "ftp"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "只读参数；监视器类型。",
					"type": "string",
					"enum": [
						"FTP"
					],
					"default": "FTP"
				},
				"timeout": {
					"description": "可选参数；设置监视超时时间。",
					"type": "integer",
					"default": 31,
					"minimum": 1,
					"maximum": 86400,
					"example": 16
				},
				"interval": {
					"description": "可选参数；设置监视间隔时间。",
					"type": "integer",
					"default": 10,
					"minimum": 1,
					"maximum": 86400,
					"example": 5
				},
				"err_interval": {
					"description": "故障间隔时间。",
					"type": "integer",
					"default": 2,
					"example": 2,
					"maximum": 86400,
					"minimum": 1
				},
				"err_interval_state": {
					"description": "故障间隔开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"host": {
					"description": "可选参数；支持ip地址和*;默认为*，表示监视节点池中的地址；当启用gateway_detect时必须指定ip地址",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "可选参数；指定监视端口；取值范围[0,65535]，默认为21",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 21
				},
				"debug_mode": {
					"description": "可选参数；调试模式开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"username": {
					"description": "可选参数；指定FTP的用户名，默认为anonymous",
					"type": "string",
					"minLength": 1,
					"maxLength": 63,
					"default": "anonymous",
					"example": "anonymous"
				},
				"password": {
					"description": "可选参数；指定FTP用户的密码",
					"passwdOnce": true,
					"type": "string",
					"minLength": 0,
					"maxLength": 63
				},
				"pk_password": {
					"description": "旧密码",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"encrypted_password": {
					"description": "可选参数；经过加密处理的FTP用户密码",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"access_path": {
					"description": "可选参数；指定监控FTP服务的目录,默认为/",
					"type": "string",
					"default": "/",
					"minLength": 1,
					"maxLength": 1024,
					"example": "/doc/test.xls"
				},
				"ftp_mode": {
					"description": "可选参数；指定访问FTP的模式,默认为pasv,表示被动模式",
					"type": "string",
					"enum": [
						"PASV",
						"PORT"
					],
					"default": "PASV",
					"example": "PASV"
				}
			}
		}
	}
}