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
		"/api/ad/v3/net/link-monitor/icmpv6/": {
			"description": "ICMPV6链路健康检查配置管理操作",
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
				"summary": "get all link-monitor-icmpv6",
				"description": "查看ICMPV6链路健康检查配置",
				"operationId": "get_link_monitor_icmpv6_list",
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
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_list"
					}
				}
			},
			"post": {
				"tags": [
					"link-monitor"
				],
				"summary": "create new link-monitor-icmpv6",
				"description": "新建ICMPV6链路健康检查配置",
				"operationId": "add_link_monitor_icmpv6_list",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMPV6-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"link-monitor"
				],
				"summary": "modify link-monitor-icmpv6",
				"description": "修改ICMPV6链路健康检查配置",
				"operationId": "edit_link_monitor_icmpv6_list",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMPV6-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net link-monitor icmpv6 ",
					"description": "查看所有icmpv6类型监视器"
				},
				{
					"command": "create net  link-monitor icmpv6 myping6 host 240e::abcd interval 3 timeout 10 debug_mode disable",
					"description": "创建icmpv6监视器myping6，监视地址240e::abcd，每隔3s监视一次，每次超时时间10s，禁用该监视器调试日志"
				},
				{
					"command": "list net link-monitor icmpv6 myping6",
					"description": "查看icmpv6监视器myping6"
				},
				{
					"command": "modify net link-monitor icmpv6 myping6 host 2404::1234 interval 5 timeout 16",
					"description": "编辑icmpv6监视器myping6，更新监视地址为2404::1234，每隔5s监视一次，每次超时时间为16s"
				},
				{
					"command": "delete net link-monitor icmpv6 myping6",
					"description": "删除icmpv6监视器myping6"
				}
			]
		},
		"/api/ad/v3/net/link-monitor/icmpv6/{name}": {
			"description": "ICMPV6链路健康检查配置管理操作",
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
				"summary": "get specific link-monitor-icmpv6",
				"description": "查看指定ICMPV6链路健康检查配置",
				"operationId": "get_link_monitor_icmpv6",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"link-monitor"
				],
				"summary": "create new link-monitor-icmpv6",
				"description": "新建ICMPV6链路健康检查配置",
				"operationId": "create_link_monitor_icmpv6",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMPV6-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_object"
					}
				}
			},
			"put": {
				"tags": [
					"link-monitor"
				],
				"summary": "replace specific link-monitor-icmpv6",
				"description": "替换指定ICMPV6链路健康检查配置",
				"operationId": "replace_link_monitor_icmpv6",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMPV6-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_object"
					}
				}
			},
			"patch": {
				"tags": [
					"link-monitor"
				],
				"summary": "modify specific link-monitor-icmpv6",
				"description": "修改指定ICMPV6链路健康检查配置",
				"operationId": "edit_link_monitor_icmpv6",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-ICMPV6-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_object"
					}
				}
			},
			"delete": {
				"tags": [
					"link-monitor"
				],
				"summary": "delete specific link-monitor-icmpv6",
				"description": "删除指定ICMPV6链路健康检查配置",
				"operationId": "delete_link_monitor_icmpv6",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_icmpv6_object"
					}
				}
			}
		}
	},
	"parameters": {
		"LINK-MONITOR-ICMPV6-CONFIG": {
			"name": "LINK-MONITOR-ICMPV6-CONFIG",
			"in": "body",
			"required": true,
			"description": "ICMPV6链路健康检查配置",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmpv6"
			}
		},
		"LINK-MONITOR-ICMPV6-PROPERTY": {
			"name": "LINK-MONITOR-ICMPV6-PROPERTY",
			"in": "body",
			"required": true,
			"description": "ICMPV6链路健康检查属性",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmpv6"
			}
		}
	},
	"responses": {
		"operation_config_link_monitor_icmpv6_list": {
			"description": "ICMPV6链路健康检查配置列表",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmpv6_list"
			}
		},
		"operation_config_link_monitor_icmpv6_object": {
			"description": "ICMPV6链路健康检查配置对象",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_icmpv6"
			}
		}
	},
	"definitions": {
		"config.link_monitor_icmpv6_list": {
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
						"$ref": "#/definitions/config.link_monitor_icmpv6"
					}
				}
			}
		},
		"config.link_monitor_icmpv6": {
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
						"ICMPV6"
					],
					"description": "可选参数；链路健康检查类型（icmpv6），默认值icmpv6",
					"default": "ICMPV6"
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
					"description": "可选参数；探测间隔时间（单位：秒），默认值5",
					"default": 5,
					"example": 5,
					"maximum": 255,
					"minimum": 1
				},
				"host": {
					"type": "string",
					"description": "可选参数；监视地址，长度为1~256字节，必须为IPV6地址或域名格式",
					"default": "*",
					"minLength": 1,
					"maxLength": 256
				},
				"debug_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "开启调试日志（enable-启用/disable-禁用），默认值disable",
					"default": "DISABLE",
					"example": "DISABLE"
				}
			}
		}
	}
}