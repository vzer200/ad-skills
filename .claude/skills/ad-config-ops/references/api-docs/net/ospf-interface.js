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
		"/api/ad/v3/net/ospf-interface/": {
			"description": "ospf动态路由接口配置相关操作",
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
				"description": "获取ospf动态路由接口配置",
				"tags": [
					"ospf-interface"
				],
				"summary": "get all ospf-interface",
				"operationId": "get_ospf_interface_list",
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
						"$ref": "#/responses/operation_config_ospf_interface_list"
					}
				}
			},
			"post": {
				"description": "新建ospf动态路由接口配置",
				"tags": [
					"ospf-interface"
				],
				"summary": "create new ospf-interface",
				"operationId": "add_ospf_interface_list",
				"parameters": [
					{
						"$ref": "#/parameters/OSPF-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_interface_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"ospf-interface"
				],
				"summary": "modify ospf-interface",
				"description": "修改ospf动态路由接口配置",
				"operationId": "edit_ospf_interface_list",
				"parameters": [
					{
						"$ref": "#/parameters/OSPF-INTERFACE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_interface_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net ospf-interface",
					"description": "获取全部ospf接口配置"
				},
				{
					"command": "list net ospf-interface test_ospf",
					"description": "获取指定ospf接口test_ospf配置"
				},
				{
					"command": "create net ospf-interface test_ospf link test_wan network_type broadcast Authentication { mode plain key-id 24 key-string test_key }",
					"description": "创建名称为test_ospf的ospf接口配置 其引用链路名称为test_wan,认证方式为plain，keyid为24，认证码为test_key"
				},
				{
					"command": "modify net ospf-interface test_ospf hello_interval 34",
					"description": "修改ospf接口配置test_ospf的hello包发送间隔为34"
				},
				{
					"command": "delete net ospf-interface test_ospf",
					"description": "删除ospf接口配置test_ospf"
				}
			]
		},
		"/api/ad/v3/net/ospf-interface/{name}": {
			"description": "ospf动态路由接口配置相关操作",
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
				"description": "获取ospf动态路由接口配置",
				"tags": [
					"ospf-interface"
				],
				"summary": "get specific ospf-interface",
				"operationId": "get_ospf_interface",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_interface_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"ospf-interface"
				],
				"summary": "create new ospf-interface",
				"description": "新建ospf动态路由接口配置",
				"operationId": "create_ospf_interface",
				"parameters": [
					{
						"$ref": "#/parameters/OSPF-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_interface_object"
					}
				}
			},
			"put": {
				"tags": [
					"ospf-interface"
				],
				"summary": "replace specific ospf-interface",
				"description": "修改ospf动态路由接口配置",
				"operationId": "replace_ospf_interface",
				"parameters": [
					{
						"$ref": "#/parameters/OSPF-INTERFACE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_interface_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ospf-interface"
				],
				"summary": "modify specific ospf-interface",
				"description": "修改ospf动态路由接口配置",
				"operationId": "edit_ospf_interface",
				"parameters": [
					{
						"$ref": "#/parameters/OSPF-INTERFACE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_interface_object"
					}
				}
			},
			"delete": {
				"tags": [
					"ospf-interface"
				],
				"summary": "delete specific ospf-interface",
				"description": "删除ospf动态路由接口配置",
				"operationId": "delete_ospf_interface",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ospf_interface_object"
					}
				}
			}
		}
	},
	"parameters": {
		"OSPF-INTERFACE-CONFIG": {
			"name": "OSPF-INTERFACE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ospf_interface"
			}
		},
		"OSPF-INTERFACE-PROPERTY": {
			"name": "OSPF-INTERFACE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ospf_interface"
			}
		}
	},
	"responses": {
		"operation_config_ospf_interface_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ospf_interface_list"
			}
		},
		"operation_config_ospf_interface_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ospf_interface"
			}
		}
	},
	"definitions": {
		"config.ospf_interface_list": {
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
						"$ref": "#/definitions/config.ospf_interface"
					}
				}
			}
		},
		"config.ospf_interface": {
			"type": "object",
			"required": [
				"name",
				"link"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "指定ospf接口配置的名称, 在ospf接口配置中必须唯一。",
					"example": "Lan_1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可以对该ospf接口配置进行额外的信息补充。"
				},
				"link": {
					"type": "string",
					"description": "ospf接口配置引用的系统链路，必须为已经存在的链路名称。",
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
				"Authentication": {
					"description": "认证配置",
					"type": "object",
					"properties": {
						"mode": {
							"type": "string",
							"enum": [
								"NONE",
								"PLAIN",
								"MD5"
							],
							"description": "ospf认证类型，合法输入为NONE，PLAIN，MD5。",
							"default": "NONE",
							"example": "MD5"
						},
						"key-id": {
							"type": "integer",
							"description": "md5认证时key id，必须为0~2147483647之间的整数。",
							"maximum": 255,
							"minimum": 1
						},
						"key-string": {
							"type": "string",
							"description": "md5或者明文认证方式的认证码。",
							"maxLength": 16,
							"minLength": 1
						}
					}
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
				"network_type": {
					"type": "string",
					"enum": [
						"BROADCAST",
						"NON-BROADCAST",
						"POINT-TO-POINT",
						"POINT-TO-MULTIPOINT"
					],
					"description": "接口网络类型，合法输入为BROADCAST、NON-BROADCAST、POINT-TO-POINT和POINT-TO-MULTIPOINT。",
					"default": "BROADCAST",
					"example": "BROADCAST"
				}
			}
		}
	}
}