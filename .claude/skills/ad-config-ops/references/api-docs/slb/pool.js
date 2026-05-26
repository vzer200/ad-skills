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
		"/api/ad/v3/slb/pool/": {
			"description": "新建、查看节点池配置",
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
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/is_static_route_pool"
				}
			],
			"get": {
				"tags": [
					"pool"
				],
				"summary": "get all pools",
				"description": "查看当前已有的节点池配置信息",
				"operationId": "get_pool_list",
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
						"$ref": "#/responses/operation_config_pool_list"
					}
				}
			},
			"post": {
				"tags": [
					"pool"
				],
				"summary": "create new pool",
				"description": "新建一个节点池配置",
				"operationId": "add_pool_list",
				"parameters": [
					{
						"$ref": "#/parameters/POOL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pool_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb pool pool1 description  描述信息 method round-robin priority_level_available_node 1 nodes add [ { type domain address www.test.com cookie 12312312 port 90 state offline priority_level 10 weight 10 } {type address  address 3.3.3.3 port 80 }] persist sourceip service_monitors [ ping http ]",
					"description": "创建一个节点池pool1，其调度算法为轮询,使用源IP会话保持,健康检查方法有ping和http,优先级调度最少可用节点为1,包括两个节点：域名节点www.test.com,其端口为90;IPv4节点地址3.3.3.3,端口为80"
				},
				{
					"command": "modify slb pool pool1 nodes all state disable",
					"description": "禁用节点池pool1中的所有节点"
				},
				{
					"command": "delete slb pool pool1",
					"description": "删除节点池pool1"
				},
				{
					"command": "modify slb pool pool1 nodes add [ { name nodename address 3.3.3.4 port 8080 inherit_pool_monitor disable service_monitors add [ ping http ] available_requirement 2 } ]",
					"description": "给pool1节点池添加一个名称为nodename的节点,ip地址为3.3.3.4，端口为8080，使用独立监视器，监视方法为ping和http，至少2个监视器监视通过"
				},
				{
					"command": "modify slb pool pool1 nodes delete [ {name nodename} {name nodename1}] ",
					"description": "删除pool1节点池中的nodename和nodename1两个节点"
				},
				{
					"command": "modify slb pool pool1 nodes []",
					"description": "删除pool1节点池的所有节点"
				},
				{
					"command": "list slb pool pool1 ",
					"description": "查看pool1节点池的配置信息"
				},
				{
					"command": "list slb pool pool1 nodes",
					"description": "查看pool1节点池的节点信息"
				},
				{
					"command": "list slb pool route_pool",
					"description": "查看所有路由池信息"
				},
				{
					"command": "export slb pool route_pool",
					"description": "导出所有路由池信息"
				}
			]
		},
		"/api/ad/v3/slb/pool/{name}": {
			"description": "新建、查看、修改、删除指定的节点池配置",
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
					"pool"
				],
				"summary": "get specific pool",
				"description": "查看指定的节点池配置",
				"operationId": "get_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pool_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"pool"
				],
				"summary": "create new pool",
				"description": "新建指定的节点池配置",
				"operationId": "create_pool",
				"parameters": [
					{
						"$ref": "#/parameters/POOL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pool_object"
					}
				}
			},
			"put": {
				"tags": [
					"pool"
				],
				"summary": "replace specific pool",
				"description": "修改指定的节点池配置",
				"operationId": "replace_pool",
				"parameters": [
					{
						"$ref": "#/parameters/POOL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pool_object"
					}
				}
			},
			"patch": {
				"tags": [
					"pool"
				],
				"summary": "modify specific pool",
				"description": "修改指定的节点池配置",
				"operationId": "edit_pool",
				"parameters": [
					{
						"$ref": "#/parameters/POOL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pool_object"
					}
				}
			},
			"delete": {
				"tags": [
					"pool"
				],
				"summary": "delete specific pool",
				"description": "删除指定的节点池配置",
				"operationId": "delete_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_pool_object"
					}
				}
			}
		}
	},
	"parameters": {
		"POOL-CONFIG": {
			"name": "POOL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.pool"
			}
		},
		"POOL-PROPERTY": {
			"name": "POOL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.pool"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "virtual service name",
			"required": true
		}
	},
	"responses": {
		"operation_config_pool_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pool_list"
			}
		},
		"operation_config_pool_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.pool"
			}
		}
	},
	"definitions": {
		"config.pool_list": {
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
						"$ref": "#/definitions/config.pool"
					}
				}
			}
		},
		"config.pool": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "指定节点池的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "mail_pool_1"
				},
				"description": {
					"description": "用来对此配置增加额外的备注。",
					"type": "string"
				},
				"method": {
					"description": "节点选择策略，默认weighted-least-conn。round-robin表示轮询；weighted-round-robin加权轮询；weighted-least-connections表示加权最小连接；weighted-least-flow表示加权最小流量；fastest表示最快响应时间；hash-host表示按HOST哈希；hash-srcip表示按源IP哈希；hash-srcipport表示按源IP源端口哈希；hash-uri表示按URI哈希；snmp-evaluate表示动态反馈；host-based-weighted-least-connections表示主机加权最小连接；host-based-weighted-least-flow表示主机加权最小流量；host-based-weighted-round-robin表示主机加权轮询。",
					"type": "string",
					"enum": [
						"ROUND-ROBIN",
						"WEIGHTED-ROUND-ROBIN",
						"WEIGHTED-LEAST-CONNECTIONS",
						"WEIGHTED-LEAST-FLOW",
						"FASTEST",
						"SNMP-EVALUATE",
						"HASH-SRCIP",
						"HASH-SRCIPPORT",
						"HASH-URI",
						"HASH-HOST",
						"HOST-BASED-WEIGHTED-ROUND-ROBIN",
						"HOST-BASED-WEIGHTED-LEAST-CONNECTIONS",
						"HOST-BASED-WEIGHTED-LEAST-FLOW",
						"LEAST-CONNECTIONS",
						"HOST-BASED-LEAST-CONNECTIONS",
						"LEAST-FLOW",
						"HOST-BASED-LEAST-FLOW"
					],
					"default": "WEIGHTED-LEAST-CONNECTIONS",
					"example": "WEIGHTED-LEAST-CONNECTIONS"
				},
				"priority_level_available_node": {
					"description": "优先级调度最少可用节点条件，0表示禁用优先级调度，默认为0",
					"type": "integer",
					"default": 0,
					"maximum": 100,
					"minimum": 0,
					"example": 10
				},
				"persist": {
					"description": "指定首选会话保持方法，默认为none,表示不启用会话保持",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "SourceIP"
				},
				"alternate_persist": {
					"description": "指定备用会话保持方法，默认为none,表示不启用会话保持",
					"type": "string",
					"optionalEnum": [
						"NONE"
					],
					"default": "NONE",
					"example": "NONE"
				},
				"schedule_by_connect": {
					"description": "按连接调度开关，开启后可提高调度效率",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"service_monitors": {
					"description": "引用节点健康检查方法列表，为对象参数列表，支持add/delete指令添加/删除健康检查方法，默认为空,表示节点永远在线",
					"type": "array",
					"items": {
						"description": "节点监视器",
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
				"node_up_delay": {
					"description": "指定温暖上线的恢复时间，用于控制节点上线前的等候准备时间，取值范围[0,300],默认为0",
					"type": "integer",
					"default": 0,
					"maximum": 300,
					"minimum": 0,
					"example": 0
				},
				"slow_ramp_time": {
					"description": "指定温暖上线的爬坡时间，用于控制节点上线起始阶段的业务压力逐步递增,取值范围[0,300],默认为0",
					"type": "integer",
					"default": 10,
					"maximum": 300,
					"minimum": 0,
					"example": 0
				},
				"nodes": {
					"description": "节点",
					"type": "array",
					"items": {
						"description": "节点配置",
						"$ref": "/api/slb/node.yaml#/definitions/config.node"
					}
				},
				"recover_by_manual": {
					"description": "使用被动健康检查方法时允许被动健康检查故障状态手动恢复，enable表示启用，disable表示禁用，默认enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"recover_by_timer": {
					"description": "使用被动健康检查方法时允许被动健康检查故障状态定时恢复，enable表示启用，disable表示禁用，默认disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"recover_time_min": {
					"description": "节点定时恢复时间，用于被动健康检查方法的定时恢复，取值范围[1, 15300],默认为3",
					"type": "integer",
					"default": 3,
					"maximum": 15300,
					"minimum": 1,
					"example": 0
				},
				"connection_statistic": {
					"description": "指定连接数统计方法，默认为completed",
					"type": "string",
					"enum": [
						"ESTABLISHED",
						"COMPLETED"
					],
					"default": "COMPLETED"
				},
				"busy_process_policy": {
					"description": "指定节点繁忙的处理策略，return-failed表示调度失败，connection-queue表示排队等候，ignore-busy表示强制调度，默认为return-failed",
					"type": "string",
					"enum": [
						"RETURN-FAILED",
						"CONNECTION-QUEUE",
						"IGNORE-BUSY"
					],
					"default": "RETURN-FAILED",
					"example": "RETURN-FAILED"
				},
				"connection_queue_length": {
					"description": "连接排队时的队列容量，取值范围为[1,100000],默认为1",
					"type": "integer",
					"maximum": 100000,
					"minimum": 1,
					"default": 1,
					"example": 0
				},
				"connection_queue_timeout_ms": {
					"description": "连接排队超时时间，取值范围为[1,60]，默认为1",
					"type": "integer",
					"maximum": 60,
					"minimum": 1,
					"default": 1,
					"example": 0
				},
				"pool_type": {
					"description": "池类型",
					"__format__description__": "必须为节点池或者路由池",
					"title": "名称",
					"type": "string",
					"enum": [
						"NODE_POOL_TYPE",
						"ROUTE_POOL_TYPE"
					],
					"default": "NODE_POOL_TYPE",
					"example": "NODE_POOL_TYPE"
				},
				"min_available_nodes": {
					"description": "最少可用节点数量，取值范围为[0,65535]，默认为0",
					"type": "integer",
					"maximum": 65535,
					"minimum": 0,
					"default": 0,
					"example": 1
				}
			}
		}
	}
}