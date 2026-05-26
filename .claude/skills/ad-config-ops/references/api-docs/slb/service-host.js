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
		"/api/ad/v3/slb/service-host": {
			"description": "新建、查看业务主机配置",
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
					"service-host"
				],
				"summary": "get all service-host",
				"description": "查看当前已有的业务主机配置信息",
				"operationId": "get_service_host_list",
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
						"$ref": "#/responses/operation_config_service_host_list"
					}
				}
			},
			"post": {
				"tags": [
					"service-host"
				],
				"summary": "create new service-host",
				"description": "新建一个业务主机配置",
				"operationId": "add_service_host_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-HOST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_host_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-host sh description xxxx type address address 1.1.1.1 state enable weight 100 connection_limit 100 connection_rate_limit 10 request_rate_limit 1000 available_requirement 1 service_monitors [ \"snmp\" ]",
					"description": "新建IP地址业务主机,IP为1.1.1.1,权重为100,并发连接限制为100,新建连接限制为10,请求速率限制为1000"
				},
				{
					"command": "create slb service-host sh1 description yyyy type domain address sangfor.com.cn state offline weight 20 dns_query_interval 10 dns_query_down_interval 5 connection_limit 100 connection_rate_limit 10 request_rate_limit 200",
					"description": "新建域名地址业务主机,域名为sangfor.com.cn,权重为20,dns查询间隔为10s,离线DNS查询间隔为5s,并发连接限制为100,新建连接限制为10,请求速率限制为200"
				},
				{
					"command": "modify slb service-host sh1 state disable",
					"description": "将业务主机sh1平滑退出"
				},
				{
					"command": "list slb service-host sh",
					"description": "查看业务主机sh的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-host/{name}": {
			"description": "新建、查看、修改、删除指定的业务主机配置",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				}
			],
			"get": {
				"tags": [
					"service-host"
				],
				"summary": "get specific service-host",
				"description": "查看指定的业务主机配置",
				"operationId": "get_service_host",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_host_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-host"
				],
				"summary": "create new service-host",
				"description": "新建指定的业务主机配置",
				"operationId": "create_service_host",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-HOST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_host_object"
					}
				}
			},
			"put": {
				"tags": [
					"service-host"
				],
				"summary": "replace specific service-host",
				"description": "修改指定的业务主机配置",
				"operationId": "replace_service_host",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-HOST-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_host_object"
					}
				}
			},
			"patch": {
				"tags": [
					"service-host"
				],
				"summary": "modify specific service-host",
				"description": "修改指定的业务主机配置",
				"operationId": "edit_host",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-HOST-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_host_object"
					}
				}
			},
			"delete": {
				"tags": [
					"service-host"
				],
				"summary": "delete specific service-host",
				"description": "删除指定的业务主机配置",
				"operationId": "delete_service_host",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_host_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-HOST-CONFIG": {
			"name": "SERVICE-HOST-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_host"
			}
		},
		"SERVICE-HOST-PROPERTY": {
			"name": "SERVICE-HOST-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_host"
			}
		}
	},
	"responses": {
		"operation_config_service_host_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_host_list"
			}
		},
		"operation_config_service_host_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_host"
			}
		}
	},
	"definitions": {
		"config.service_host_list": {
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
						"$ref": "#/definitions/config.service_host"
					}
				}
			}
		},
		"config.service_host": {
			"type": "object",
			"required": [
				"address"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定会话保持的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "oa_server_port_25"
				},
				"description": {
					"description": "可选参数；用来对此配置增加额外的备注。",
					"type": "string"
				},
				"type": {
					"description": "可选字段;指定主机的地址类型,address表示为IP地址,domain表示为域名主机,默认为address",
					"type": "string",
					"enum": [
						"ADDRESS",
						"DOMAIN"
					],
					"default": "ADDRESS"
				},
				"address": {
					"description": "必选字段;指定主机的具体地址信息,需和type指定的类型一致",
					"type": "string",
					"example": "192.168.1.101",
					"maxLength": 255,
					"minLength": 1
				},
				"state": {
					"description": "可选字段;指定业务主机的状态,enable表示启用,disable表示平滑退出,offline表示禁用;默认enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"OFFLINE"
					],
					"default": "ENABLE"
				},
				"service_monitors": {
					"description": "引用节点健康检查方法列表，为对象参数列表，支持add/delete指令添加/删除健康检查方法，默认为空,表示主机永远在线",
					"type": "array",
					"items": {
						"description": "监视器",
						"type": "string"
					},
					"maxItems": 5,
					"example": [
						"ping",
						"http"
					]
				},
				"available_requirement": {
					"description": "主机有效条件，健康检查方法有效数不足该数量时判定节点故障，0表示全部，默认为0",
					"type": "integer",
					"default": 0,
					"example": 0,
					"minimum": 0
				},
				"weight": {
					"description": "可选字段;指定业务主机的权重,取值范围为[1,100],默认为10",
					"type": "integer",
					"default": 10,
					"maximum": 100,
					"example": 10,
					"minimum": 1
				},
				"connection_limit": {
					"description": "可选字段;指定业务主机的并发连接数阈值,默认为0,表示不限制",
					"type": "integer",
					"default": 0,
					"maximum": 100000000,
					"minimum": 0,
					"example": 0
				},
				"connection_rate_limit": {
					"description": "可选字段;指定业务主机的新建连接数阈值,默认为0,表示不限制",
					"type": "integer",
					"default": 0,
					"maximum": 100000000,
					"minimum": 0,
					"example": 0
				},
				"request_rate_limit": {
					"description": "可选字段;指定业务主机的请求速率阈值,默认为0,表示不限制",
					"type": "integer",
					"default": 0,
					"maximum": 1000000,
					"minimum": 0,
					"example": 0
				},
				"dns_query_interval": {
					"description": "可选字段;指定DNS查询间隔,默认为0,表示使用TTL中的时间,单位为s",
					"type": "integer",
					"default": 3600,
					"maximum": 86400,
					"example": 0,
					"minimum": 0
				},
				"dns_query_down_interval": {
					"description": "可选字段;指定域名业务主机离线后的DNS查询间隔时间,默认为5s",
					"type": "integer",
					"default": 5,
					"maximum": 86400,
					"example": 5,
					"minimum": 1
				},
				"associated_domain": {
					"description": "只读字段;显示关联的域名信息",
					"type": "string",
					"example": ""
				}
			}
		}
	}
}