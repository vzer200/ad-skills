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
		"/api/ad/v3/slb/security-node": {
			"description": "新建、查看安全设备配置",
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
					"$ref": "#/parameters/security_pool_name"
				}
			],
			"get": {
				"tags": [
					"security-node"
				],
				"summary": "get all security-nodes",
				"description": "查看当前安全资源池已有的安全设备配置信息",
				"operationId": "get_security_node_list",
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
						"$ref": "#/responses/operation_config_security_node_list"
					}
				}
			},
			"post": {
				"tags": [
					"security-node"
				],
				"summary": "create new security-node",
				"description": "在当前安全资源池新建一个安全设备",
				"operationId": "add_security_node_list",
				"parameters": [
					{
						"$ref": "#/parameters/SECURITY-NODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_node_object"
					}
				}
			}
		},
		"/api/ad/v3/slb/security-node/{name}": {
			"description": "查看、修改、删除指定的安全设备配置",
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
					"security-node"
				],
				"summary": "get specific security-node",
				"description": "查看当前安全资源池的指定安全设备配置信息",
				"operationId": "get_security_node",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_node_object"
					}
				}
			},
			"put": {
				"tags": [
					"security-node"
				],
				"summary": "replace specific security-node",
				"description": "修改当前安全资源池的指定安全设备配置",
				"operationId": "replace_security_node",
				"parameters": [
					{
						"$ref": "#/parameters/SECURITY-NODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_node_object"
					}
				}
			},
			"patch": {
				"tags": [
					"security-node"
				],
				"summary": "modify specific security-node",
				"description": "修改当前安全资源池的指定安全设备配置",
				"operationId": "edit_security_node",
				"parameters": [
					{
						"$ref": "#/parameters/SECURITY-NODE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_node_object"
					}
				}
			},
			"delete": {
				"tags": [
					"security-node"
				],
				"summary": "delete specific security-node",
				"description": "删除修改当前安全资源池的指定安全设备",
				"operationId": "delete_security_node",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_node_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SECURITY-NODE-CONFIG": {
			"name": "SECURITY-NODE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.security_node"
			}
		},
		"SECURITY-NODE-PROPERTY": {
			"name": "SECURITY-NODE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.security_node"
			}
		},
		"security_pool_name": {
			"name": "security_pool_name",
			"in": "query",
			"type": "string",
			"description": "config security pool name",
			"required": false
		}
	},
	"responses": {
		"operation_config_security_node_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.security_node_list"
			}
		},
		"operation_config_security_node_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.security_node"
			}
		}
	},
	"definitions": {
		"config.security_node_list": {
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
						"$ref": "#/definitions/config.security_node"
					}
				}
			}
		},
		"config.security_node": {
			"type": "object",
			"required": [
				"ip_address",
				"outbound_interface",
				"security_pool"
			],
			"properties": {
				"name": {
					"description": "指定安全设备的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "waf_1"
				},
				"description": {
					"description": "安全设备描述信息。",
					"type": "string"
				},
				"state": {
					"description": "指定安全设备的状态，enable表示启用状态，disable表示禁用/软关机,offline表示平滑退出",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE",
						"OFFLINE"
					],
					"default": "ENABLE"
				},
				"type": {
					"type": "string",
					"description": "指定安全设备的类型，L2表示二层设备，L3表示三层设备，MIRROR表示镜像设备",
					"enum": [
						"L2",
						"L3",
						"MIRROR"
					],
					"default": "L2",
					"example": "L2"
				},
				"security_pool": {
					"type": "string",
					"description": "指定安全设备所属的安全资源池",
					"example": "WAF_POOL"
				},
				"weight": {
					"description": "指定安全设备的权重，取值范围为[1,100],默认为10",
					"type": "integer",
					"default": 10,
					"example": 10,
					"maximum": 100,
					"minimum": 1
				},
				"priority_level": {
					"description": "指定安全设备的优先级，取值范围为[1,100]，默认为1，数值越大越优先",
					"type": "integer",
					"default": 1,
					"example": 1,
					"maximum": 100,
					"minimum": 1
				},
				"inbound_interface": {
					"description": "入接口",
					"type": "string",
					"example": "inbound_interface1"
				},
				"outbound_interface": {
					"description": "出接口",
					"type": "string",
					"example": "outbound_interface1"
				},
				"ip_address": {
					"description": "安全设备/下一跳IP地址（IPv4/6）",
					"type": "string",
					"example": "192.168.1.101",
					"maxLength": 255,
					"minLength": 1
				},
				"mac_address": {
					"description": "安全设备的mac地址",
					"type": "string",
					"example": "FE-FC-FA-11-57-50"
				},
				"inherit_pool_monitor": {
					"description": "指定安全设备健康检查是否继承安全资源池的配置，enable表示继承，disable表示使用独立监视器",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"service_monitors": {
					"description": "引用安全设备健康检查方法列表，为对象参数列表，支持add/delete指令添加/删除健康检查方法，默认为空，当不继承安全设备池配置时，表示节点永远在线",
					"type": "array",
					"items": {
						"description": "安全设备监视器",
						"type": "string"
					},
					"example": [
						"ping",
						"http"
					],
					"maxItems": 5
				},
				"available_requirement": {
					"description": "安全设备有效条件，健康检查方法有效数不足该数量时判定安全设备故障，0表示全部，默认为0",
					"type": "integer",
					"default": 0,
					"example": 0,
					"minimum": 0
				}
			}
		}
	}
}