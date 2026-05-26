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
		"/api/ad/v3/slb/service-monitor/sip/": {
			"description": "新建、查看监视器（SIP）配置",
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
				"summary": "get all service-monitor-sip",
				"description": "查看当前已有的监视器（SIP）配置信息",
				"operationId": "get_service_monitor_sip_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_config_service_monitor_sip_list"
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-sip",
				"description": "新建一个监视器（SIP）配置",
				"operationId": "add_service_monitor_sip_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_sip_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor sip sipmonitor",
					"description": "新建sip类型的监视器sipmonitor"
				},
				{
					"command": "modify slb service-monitor sip sipmonitor description test",
					"description": "修改sip类型的监视器sipmonitor描述信息"
				},
				{
					"command": "list slb service-monitor sip sipmonitor",
					"description": "查看sip监视器sipmonitor的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/sip/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（SIP）配置",
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
				"summary": "get specific service-monitor-sip",
				"description": "查看指定的监视器（SIP）配置",
				"operationId": "get_service_monitor_sip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_sip_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-sip",
				"description": "新建指定的监视器（SIP）配置",
				"operationId": "create_service_monitor_sip",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_sip_object"
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-sip",
				"description": "修改指定的监视器（SIP）配置",
				"operationId": "replace_service_monitor_sip",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-SIP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_sip_object"
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-sip",
				"description": "修改指定的监视器（SIP）配置",
				"operationId": "edit_service_monitor_sip",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-SIP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_sip_object"
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-sip",
				"description": "删除指定的监视器（SIP）配置",
				"operationId": "delete_service_monitor_sip",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_sip_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-SIP-CONFIG": {
			"name": "SERVICE-MONITOR-SIP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_sip"
			}
		},
		"SERVICE-MONITOR-SIP-PROPERTY": {
			"name": "SERVICE-MONITOR-SIP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_sip"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_sip_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_sip_list"
			}
		},
		"operation_config_service_monitor_sip_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_sip"
			}
		}
	},
	"definitions": {
		"config.service_monitor_sip_list": {
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
						"$ref": "#/definitions/config.service_monitor_sip"
					}
				}
			}
		},
		"config.service_monitor_sip": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "监视器名称",
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "监视器类型",
					"type": "string",
					"enum": [
						"SIP"
					],
					"default": "SIP"
				},
				"timeout": {
					"description": "监视器监视超时时间",
					"type": "integer",
					"default": 16,
					"minimum": 1,
					"maximum": 86400,
					"example": 16
				},
				"interval": {
					"description": "间隔时间",
					"type": "integer",
					"default": 5,
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
					"description": "Format: * | {IP} | {DOMAIN} | {HOST}",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "监视器监视端口",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 5060
				},
				"debug_mode": {
					"description": "是否开启调试模式",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"proto_method": {
					"description": "协议类型",
					"type": "string",
					"enum": [
						"TCP",
						"UDP"
					],
					"default": "UDP",
					"example": "TCP"
				},
				"send_request": {
					"description": "发送请求行",
					"type": "string",
					"maxLength": 255,
					"example": "OPTIONS sip:1.1.1.1:5060 SIP/2.0"
				},
				"send_header": {
					"description": "发送请求头部",
					"type": "array",
					"items": {
						"description": "请求头部",
						"type": "string",
						"maxLength": 255,
						"example": "test_sip_header:XXXXXX"
					},
					"maxItems": 32
				},
				"expect_status_code": {
					"description": "回复状态码",
					"type": "string",
					"default": "200",
					"minLength": 3,
					"maxLength": 255,
					"example": "200"
				}
			}
		}
	}
}