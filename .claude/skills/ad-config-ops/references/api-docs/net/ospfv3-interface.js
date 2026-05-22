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
		"/api/ad/v3/net/ospfv3-interface/": {
			"description": "ospfv3接口配置相关操作",
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
					"ospfv3-interface"
				],
				"summary": "get all ospfv3-interface",
				"description": "获取ospfv3接口配置",
				"operationId": "get_ospfv3_interface_list",
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
						"$ref": "#/responses/operation_config_ospfv3_interface_list"
					}
				}
			},
			"post": {
				"tags": [
					"ospfv3-interface"
				],
				"summary": "create new ospfv3-interface",
				"description": "新建ospfv3接口配置",
				"operationId": "add_ospfv3_interface_list",
				"parameters": [
					{
						"$ref": "#/parameters/OSPFV3-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospfv3_interface_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"ospfv3-interface"
				],
				"summary": "modify ospfv3-interface",
				"description": "修改ospfv3接口配置",
				"operationId": "edit_ospfv3_interface_list",
				"parameters": [
					{
						"$ref": "#/parameters/OSPFV3-INTERFACE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospfv3_interface_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net ospfv3-interface",
					"description": "获取全部ospfv3接口配置"
				},
				{
					"command": "list net ospfv3-interface test_ospfv3",
					"description": "获取指定ospv3f接口test_ospfv3配置"
				},
				{
					"command": "create net ospfv3-interface test_ospfv3 cost 24 priority 35 link test_wan area_id 192.168.0.200",
					"description": "创建名称为test_ospfv3的ospfv3接口配置 其引用链路名称为test_wan,链路代价值为24，优先级为35，区域id为192.168.0.200"
				},
				{
					"command": "modify net ospfv3-interface test_ospfv3 name client_ospfv3",
					"description": "修改ospfv3接口配置test_ospfv3的名称为client_ospfv3"
				},
				{
					"command": "delete net ospfv3-interface client_ospfv3",
					"description": "删除ospfv3接口配置client_ospfv3"
				}
			]
		},
		"/api/ad/v3/net/ospfv3-interface/{name}": {
			"description": "ospfv3接口配置相关操作",
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
					"ospfv3-interface"
				],
				"summary": "get specific ospfv3-interface",
				"description": "获取ospfv3接口配置",
				"operationId": "get_ospfv3_interface",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospfv3_interface_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ospfv3-interface"
				],
				"summary": "create new ospfv3-interface",
				"description": "新建ospfv3接口配置",
				"operationId": "create_ospfv3_interface",
				"parameters": [
					{
						"$ref": "#/parameters/OSPFV3-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospfv3_interface_object"
					}
				}
			},
			"put": {
				"tags": [
					"ospfv3-interface"
				],
				"summary": "replace specific ospfv3-interface",
				"description": "修改ospfv3接口配置",
				"operationId": "replace_ospfv3_interface",
				"parameters": [
					{
						"$ref": "#/parameters/OSPFV3-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospfv3_interface_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ospfv3-interface"
				],
				"summary": "modify specific ospfv3-interface",
				"description": "修改ospfv3接口配置",
				"operationId": "edit_ospfv3_interface",
				"parameters": [
					{
						"$ref": "#/parameters/OSPFV3-INTERFACE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospfv3_interface_object"
					}
				}
			},
			"delete": {
				"tags": [
					"ospfv3-interface"
				],
				"summary": "delete specific ospfv3-interface",
				"description": "删除ospfv3接口配置",
				"operationId": "delete_ospfv3_interface",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospfv3_interface_object"
					}
				}
			}
		}
	},
	"parameters": {
		"OSPFV3-INTERFACE-CONFIG": {
			"name": "OSPFV3-INTERFACE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ospfv3_interface"
			}
		},
		"OSPFV3-INTERFACE-PROPERTY": {
			"name": "OSPFV3-INTERFACE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ospfv3_interface"
			}
		}
	},
	"responses": {
		"operation_config_ospfv3_interface_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ospfv3_interface_list"
			}
		},
		"operation_config_ospfv3_interface_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ospfv3_interface"
			}
		}
	},
	"definitions": {
		"config.ospfv3_interface_list": {
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
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.ospfv3_interface"
					}
				}
			}
		},
		"config.ospfv3_interface": {
			"type": "object",
			"required": [
				"name",
				"link",
				"area_id"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "指定ospfv3接口配置的名称, 在ospfv3接口配置中必须唯一。",
					"example": "Lan_1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可以对该ospfv3接口配置进行额外的信息补充。"
				},
				"link": {
					"type": "string",
					"description": "ospfv3接口配置引用的系统链路，必须为已经存在的链路名称。",
					"example": "Lan_1",
					"maxLength": 511,
					"minLength": 1
				},
				"hello_interval": {
					"type": "integer",
					"description": "hello包发送间隔，必须为1~65535之间的整数。",
					"default": 10,
					"example": 10,
					"maximum": 65535,
					"minimum": 1
				},
				"retransmit_interval": {
					"type": "integer",
					"description": "hello包重传间隔，必须为3~65535之间的整数。",
					"default": 5,
					"example": 5,
					"maximum": 65535,
					"minimum": 3
				},
				"dead_interval": {
					"type": "integer",
					"description": "hello包死亡时间，必须为1~65535之间的整数。",
					"default": 40,
					"example": 40,
					"maximum": 65535,
					"minimum": 1
				},
				"transmit_delay": {
					"type": "integer",
					"description": "传输延时，必须为1~65535之间的整数。",
					"default": 1,
					"example": 1,
					"maximum": 65535,
					"minimum": 1
				},
				"priority": {
					"type": "integer",
					"description": "优先级，必须为0~255之间的整数。",
					"default": 1,
					"example": 1,
					"maximum": 255,
					"minimum": 0
				},
				"cost": {
					"type": "integer",
					"description": "链路代价值，必须为1~65535之间的整数。",
					"default": 10,
					"example": 10,
					"maximum": 65535,
					"minimum": 1
				},
				"instance_id": {
					"type": "integer",
					"description": "instance id，必须为0~255之间的整数。",
					"default": 0,
					"example": 0,
					"maximum": 255,
					"minimum": 0
				},
				"area_id": {
					"type": "string",
					"description": "区域 id，必须为IPV4地址。",
					"example": "6.6.6.6"
				}
			}
		}
	}
}