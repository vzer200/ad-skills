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
		"/api/ad/v3/net/link-monitor/icmp/": {
			"description": "ICMP链路健康检查配置管理操作",
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
					"link-monitor"
				],
				"summary": "get all link-monitor-icmp",
				"description": "查看ICMP链路健康检查配置",
				"operationId": "get_link_monitor_icmp_list",
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
						"$ref": "#/responses/operation_config_link_monitor_icmp_list"
					}
				}
			},
			"post": {
				"tags": [
					"link-monitor"
				],
				"summary": "create new link-monitor-icmp",
				"description": "新建ICMP链路健康检查配置",
				"operationId": "add_link_monitor_icmp_list",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmp_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"link-monitor"
				],
				"summary": "modify link-monitor-icmp",
				"description": "修改ICMP链路健康检查配置",
				"operationId": "edit_link_monitor_icmp_list",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmp_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net link-monitor icmp",
					"description": "查看所有icmp类型监视器配置"
				},
				{
					"command": "create net link-monitor icmp my_icmp_monitor   type icmp host 1.1.1.1 interval 3 timeout 5 debug_mode enable  description '监视内接设备1.1.1.1'",
					"description": "创建icmp类型监视器my_icmp_monitor ，监视1.1.1.1，每隔3s监视一次，每次监视超时时间5s，开启调试日志，并备注'监视内接设备1.1.1.1'"
				},
				{
					"command": "list net link-monitor icmp my_icmp_monitor",
					"description": "查看icmp监视器my_icmp_monitor"
				},
				{
					"command": " modify net link-monitor icmp my_icmp_monitor interval 5 timeout 8 ",
					"description": "修改icmp监视器my_icmp_monitor为每隔5s监视一次，每次监视超时为8s"
				},
				{
					"command": "delete net link-monitor icmp my_icmp_monitor",
					"description": "删除icmp监视器my_icmp_monitor"
				}
			]
		},
		"/api/ad/v3/net/link-monitor/icmp/{name}": {
			"description": "ICMP链路健康检查配置管理操作",
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
					"link-monitor"
				],
				"summary": "get specific link-monitor-icmp",
				"description": "查看指定ICMP链路健康检查配置",
				"operationId": "get_link_monitor_icmp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmp_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"link-monitor"
				],
				"summary": "create new link-monitor-icmp",
				"description": "新建ICMP链路健康检查配置",
				"operationId": "create_link_monitor_icmp",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmp_object"
					}
				}
			},
			"put": {
				"tags": [
					"link-monitor"
				],
				"summary": "replace specific link-monitor-icmp",
				"description": "替换指定ICMP链路健康检查配置",
				"operationId": "replace_link_monitor_icmp",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"link-monitor"
				],
				"summary": "modify specific link-monitor-icmp",
				"description": "修改指定ICMP链路健康检查配置",
				"operationId": "edit_link_monitor_icmp",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmp_object"
					}
				}
			},
			"delete": {
				"tags": [
					"link-monitor"
				],
				"summary": "delete specific link-monitor-icmp",
				"description": "删除指定ICMP链路健康检查配置",
				"operationId": "delete_link_monitor_icmp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmp_object"
					}
				}
			}
		}
	},
	"parameters": {
		"LINK-MONITOR-ICMP-CONFIG": {
			"name": "LINK-MONITOR-ICMP-CONFIG",
			"in": "body",
			"required": true,
			"description": "ICMP链路健康检查配置",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmp"
			}
		},
		"LINK-MONITOR-ICMP-PROPERTY": {
			"name": "LINK-MONITOR-ICMP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "ICMP链路健康检查属性",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmp"
			}
		}
	},
	"responses": {
		"operation_config_link_monitor_icmp_list": {
			"description": "ICMP链路健康检查配置列表",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmp_list"
			}
		},
		"operation_config_link_monitor_icmp_object": {
			"description": "ICMP链路健康检查配置对象",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmp"
			}
		}
	},
	"definitions": {
		"config.link_monitor_icmp_list": {
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
						"$ref": "#/definitions/config.link_monitor_icmp"
					}
				}
			}
		},
		"config.link_monitor_icmp": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；配置名称",
					"example": "http",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；所创建监视器描述标签"
				},
				"type": {
					"type": "string",
					"enum": [
						"ICMP"
					],
					"description": "可选参数；链路健康检查类型（icmp），默认值为icmp",
					"default": "ICMP"
				},
				"timeout": {
					"type": "integer",
					"description": "可选参数；超时时间（单位：秒），默认值16",
					"default": 16,
					"example": 16,
					"maximum": 255,
					"minimum": 1
				},
				"interval": {
					"type": "integer",
					"description": "可选参数；探测间隔时间（单位：秒）默认值5",
					"default": 5,
					"example": 5,
					"maximum": 255,
					"minimum": 1
				},
				"host": {
					"type": "string",
					"description": "可选参数；监视地址，长度为1~256字节，必须为IPV4地址或域名格式",
					"default": "*",
					"example": "8.8.8.8",
					"maxLength": 256,
					"minLength": 1
				},
				"debug_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "可选参数；开启调试日志（enable-启用/disable-禁用），默认值disable",
					"default": "DISABLE",
					"example": "DISABLE"
				}
			}
		}
	}
}