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
		"/api/ad/v3/net/bridge/": {
			"description": "端口桥接配置管理操作",
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
					"bridge"
				],
				"summary": "get all bridge",
				"description": "查看端口桥接配置",
				"operationId": "get_bridge_list",
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
						"$ref": "#/responses/operation_config_bridge_list"
					}
				}
			},
			"post": {
				"tags": [
					"bridge"
				],
				"summary": "create new bridge",
				"description": "新建桥接口配置",
				"operationId": "add_bridge_list",
				"parameters": [
					{
						"$ref": "#/parameters/BRIDGE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bridge_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"bridge"
				],
				"summary": "modify bridge",
				"description": "修改桥接口配置",
				"operationId": "edit_bridge_list",
				"parameters": [
					{
						"$ref": "#/parameters/BRIDGE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bridge_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net bridge",
					"description": "查看所有交换口"
				},
				{
					"command": "create net bridge mybridge interfaces [ { interface mybond type bond } { interface NET3 } ] state enable stp { state enable hello_time 10 priority 32666  maximum_age 25 forward_delay 16}",
					"description": "创建名称为mybridge的交换口，引用接口为bond口mybond和物理口NET3，启用该交换口，并启用stp协议:hello间隔为10s，优先级为32666， 老化时间为25s，转发延迟为16s"
				},
				{
					"command": "list net bridge mybridge",
					"description": "查看交换口mybridge配置"
				},
				{
					"command": "modify net bridge mybridge state disable",
					"description": "禁用交换口mybridge"
				},
				{
					"command": "delete net bridge mybridge",
					"description": "删除交换口mybridge"
				}
			]
		},
		"/api/ad/v3/net/bridge/{name}": {
			"description": "端口桥接配置管理操作",
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
					"bridge"
				],
				"summary": "get specific bridge",
				"description": "查看指定桥接口配置",
				"operationId": "get_bridge",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bridge_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"bridge"
				],
				"summary": "create new bridge",
				"description": "新建桥接口配置",
				"operationId": "create_bridge",
				"parameters": [
					{
						"$ref": "#/parameters/BRIDGE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bridge_object"
					}
				}
			},
			"put": {
				"tags": [
					"bridge"
				],
				"summary": "replace specific bridge",
				"description": "替换指定桥接口配置",
				"operationId": "replace_bridge",
				"parameters": [
					{
						"$ref": "#/parameters/BRIDGE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bridge_object"
					}
				}
			},
			"patch": {
				"tags": [
					"bridge"
				],
				"summary": "modify specific bridge",
				"description": "修改指定桥接口配置",
				"operationId": "edit_bridge",
				"parameters": [
					{
						"$ref": "#/parameters/BRIDGE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bridge_object"
					}
				}
			},
			"delete": {
				"tags": [
					"bridge"
				],
				"summary": "delete specific bridge",
				"description": "删除指定桥接口配置",
				"operationId": "delete_bridge",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bridge_object"
					}
				}
			}
		}
	},
	"parameters": {
		"BRIDGE-CONFIG": {
			"name": "BRIDGE-CONFIG",
			"in": "body",
			"required": true,
			"description": "端口桥接配置",
			"schema": {
				"$ref": "#/definitions/config.bridge"
			}
		},
		"BRIDGE-PROPERTY": {
			"name": "BRIDGE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "端口桥接属性",
			"schema": {
				"$ref": "#/definitions/config.bridge"
			}
		}
	},
	"responses": {
		"operation_config_bridge_list": {
			"description": "端口桥接配置列表",
			"schema": {
				"$ref": "#/definitions/config.bridge_list"
			}
		},
		"operation_config_bridge_object": {
			"description": "端口桥接配置对象",
			"schema": {
				"$ref": "#/definitions/config.bridge"
			}
		}
	},
	"definitions": {
		"config.bridge_list": {
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
						"$ref": "#/definitions/config.bridge"
					}
				}
			}
		},
		"config.bridge": {
			"type": "object",
			"required": [
				"name",
				"interfaces"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；配置名称",
					"example": "bridge1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；所创建交换口配置描述"
				},
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "可选参数；配置启/禁用开关（enable-启用/disable-禁用），默认值enable",
					"default": "ENABLE"
				},
				"interfaces": {
					"description": "必选参数；网络接口列表",
					"type": "array",
					"items": {
						"description": "网络接口",
						"type": "object",
						"required": [
							"interface"
						],
						"properties": {
							"type": {
								"type": "string",
								"enum": [
									"PHYSICAL",
									"BOND",
									"VLAN"
								],
								"description": "可选参数；引用接口类型（physical-普通网口/bond-聚合口/vlan-VLAN子接口），默认为physical",
								"default": "PHYSICAL",
								"example": "BOND"
							},
							"interface": {
								"description": "必选参数；引用的接口名称",
								"type": "string",
								"example": "bond-134"
							}
						}
					},
					"example": [
						{
							"type": "VLAN",
							"interface": "vlan_eth1_2"
						},
						{
							"type": "PHYSICAL",
							"interface": "NET2"
						}
					],
					"minItems": 1,
					"maxItems": 4
				},
				"stp": {
					"description": "可选参数；STP协议",
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"description": "可选参数；状态（enable-启用/disable-禁用），默认值为disable",
							"default": "DISABLE"
						},
						"priority": {
							"type": "integer",
							"description": "可选参数；STP协议优先级，默认值为32768",
							"default": 32768,
							"example": 65535,
							"maximum": 65535,
							"minimum": 0
						},
						"hello_time": {
							"type": "integer",
							"description": "可选参数；Hello间隔时间（单位：秒），默认值为2",
							"default": 2,
							"example": 10,
							"maximum": 10,
							"minimum": 1
						},
						"maximum_age": {
							"description": "可选参数；老化时间 (单位：秒），默认值为20",
							"type": "integer",
							"default": 20,
							"example": 40,
							"maximum": 40,
							"minimum": 6
						},
						"forward_delay": {
							"description": "可选参数；转发延迟时间（单位：秒），默认值为15",
							"type": "integer",
							"default": 15,
							"example": 15,
							"maximum": 30,
							"minimum": 4
						}
					}
				},
				"device_name": {
					"type": "string",
					"description": "设备名称",
					"readOnly": true,
					"example": "bridge0"
				}
			}
		}
	}
}