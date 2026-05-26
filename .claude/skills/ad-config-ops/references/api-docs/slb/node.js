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
		"/api/ad/v3/slb/pool/{pool_name}/nodes": {
			"description": "新建、查看节点配置",
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
					"$ref": "#/parameters/pool_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"node"
				],
				"summary": "get all nodes",
				"description": "查看当前已有的节点配置信息",
				"operationId": "get_node_list",
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
						"$ref": "#/responses/operation_config_node_list"
					}
				}
			},
			"post": {
				"tags": [
					"node"
				],
				"summary": "create new node",
				"description": "新建一个节点配置",
				"operationId": "add_node_list",
				"parameters": [
					{
						"$ref": "#/parameters/NODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_node_object"
					}
				}
			}
		},
		"/api/ad/v3/slb/pool/{pool_name}/nodes/{node_name}": {
			"description": "新建、查看、修改、删除指定的节点配置",
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
					"$ref": "#/parameters/pool_name"
				},
				{
					"$ref": "#/parameters/node_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"node"
				],
				"summary": "get specific node",
				"description": "查看指定的节点配置",
				"operationId": "get_node",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_node_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"node"
				],
				"summary": "create new node",
				"description": "新建指定的节点配置",
				"operationId": "create_node",
				"parameters": [
					{
						"$ref": "#/parameters/NODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_node_object"
					}
				}
			},
			"put": {
				"tags": [
					"node"
				],
				"summary": "replace specific node",
				"description": "修改指定的节点配置",
				"operationId": "replace_node",
				"parameters": [
					{
						"$ref": "#/parameters/NODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_node_object"
					}
				}
			},
			"patch": {
				"tags": [
					"node"
				],
				"summary": "modify specific node",
				"description": "修改指定的节点配置",
				"operationId": "edit_node",
				"parameters": [
					{
						"$ref": "#/parameters/NODE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_node_object"
					}
				}
			},
			"delete": {
				"tags": [
					"node"
				],
				"summary": "delete specific node",
				"description": "删除指定的节点配置",
				"operationId": "delete_node",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_node_object"
					}
				}
			}
		}
	},
	"parameters": {
		"NODE-CONFIG": {
			"name": "NODE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.node"
			}
		},
		"NODE-PROPERTY": {
			"name": "NODE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.node"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "config pool name",
			"required": true
		},
		"pool_name": {
			"name": "pool_name",
			"in": "path",
			"type": "string",
			"description": "config pool name",
			"required": true
		},
		"node_name": {
			"name": "node_name",
			"in": "path",
			"type": "string",
			"description": "config node name",
			"required": true
		}
	},
	"responses": {
		"operation_config_node_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.node_list"
			}
		},
		"operation_config_node_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.node"
			}
		}
	},
	"definitions": {
		"config.node_list": {
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
						"$ref": "#/definitions/config.node"
					}
				}
			}
		},
		"config.node": {
			"type": "object",
			"required": [
				"address"
			],
			"properties": {
				"name": {
					"description": "指定节点的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "oa_server_port_25"
				},
				"description": {
					"description": "用来对此配置增加额外的备注。",
					"type": "string"
				},
				"type": {
					"description": "指定节点的类型，address表示ip地址，domain表示域名，默认为address",
					"type": "string",
					"enum": [
						"ADDRESS",
						"DOMAIN"
					],
					"default": "ADDRESS"
				},
				"address": {
					"description": "指定节点的地址，根据type字段确定是ip地址还是域名，当为ip地址时支持ip范围",
					"type": "string",
					"example": "192.168.1.101",
					"maxLength": 255,
					"minLength": 1
				},
				"port": {
					"description": "指定节点的端口，取值范围为[0, 65535],默认为0",
					"type": "integer",
					"maximum": 65535,
					"minimum": 0,
					"default": 0,
					"example": 25
				},
				"state": {
					"description": "指定节点的状态，enable表示启用状态，disable表示平滑退出，offline表示禁用/软关机状态，默认为enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"OFFLINE"
					],
					"default": "ENABLE"
				},
				"weight": {
					"description": "指定节点的权重，取值范围为[1,100],默认为10",
					"type": "integer",
					"default": 10,
					"maximum": 100,
					"minimum": 1,
					"example": 10
				},
				"priority_level": {
					"description": "指定节点的优先级，取值范围为[1,100]，默认为1",
					"type": "integer",
					"default": 1,
					"maximum": 100,
					"minimum": 1,
					"example": 10
				},
				"connection_limit": {
					"description": "限制并发连接数大小，取值范围为[0, 100000000],默认为0，表示不限制",
					"type": "integer",
					"default": 0,
					"maximum": 100000000,
					"minimum": 0,
					"example": 0
				},
				"connection_rate_limit": {
					"description": "限制新建连接数大小，取值范围为[0, 100000000],默认为0，表示不限制",
					"type": "integer",
					"default": 0,
					"maximum": 100000000,
					"minimum": 0,
					"example": 0
				},
				"request_rate_limit": {
					"description": "限制请求速率大小，取值范围为[0, 10000000],默认为0，表示不限制",
					"type": "integer",
					"default": 0,
					"maximum": 1000000,
					"minimum": 0,
					"example": 0
				},
				"cookie": {
					"description": "指定节点的cookie值，取值范围为[10000000,99999999],默认系统随机生成",
					"type": "integer",
					"maximum": 99999999,
					"minimum": 10000000,
					"example": 12345678
				},
				"node_variable": {
					"description": "指定节点的关联变量",
					"type": "string",
					"maxLength": 63,
					"example": ""
				},
				"inherit_pool_monitor": {
					"description": "指定节点健康检查是否继承节点池的配置，enable表示继承，disable表示使用独立监视器",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"service_monitors": {
					"description": "引用节点健康检查方法列表，为对象参数列表，支持add/delete指令添加/删除健康检查方法，默认为空,表示节点永远在线",
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
					"description": "节点有效条件，健康检查方法有效数不足该数量时判定节点故障，0表示全部，默认为0",
					"type": "integer",
					"default": 0,
					"example": 0,
					"minimum": 0
				},
				"associated_domain": {
					"description": "关联域名节点信息",
					"type": "string",
					"example": ""
				},
				"recover_by_manual": {
					"description": "手动恢复",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"up_throughput_limit": {
					"description": "节点上行流量吞吐限制(单位Mbps)",
					"type": "integer",
					"maximum": 4294967295,
					"minimum": 0,
					"default": 0,
					"example": 0
				},
				"down_throughput_limit": {
					"description": "节点下行流量吞吐限制(单位Mbps)",
					"type": "integer",
					"maximum": 4294967295,
					"minimum": 0,
					"default": 0,
					"example": 0
				}
			}
		}
	}
}