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
		"/api/ad/v3/net/vlan/": {
			"description": "VLAN子接口配置管理操作",
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
					"vlan"
				],
				"summary": "get all vlan",
				"description": "查看VLAN子接口配置",
				"operationId": "get_vlan_list",
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
						"$ref": "#/responses/operation_config_vlan_list"
					}
				}
			},
			"post": {
				"tags": [
					"vlan"
				],
				"summary": "create new vlan",
				"description": "新建VLAN子接口配置",
				"operationId": "add_vlan_list",
				"parameters": [
					{
						"$ref": "#/parameters/VLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vlan_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"vlan"
				],
				"summary": "modify vlan",
				"description": "修改VLAN子接口配置",
				"operationId": "edit_vlan_list",
				"parameters": [
					{
						"$ref": "#/parameters/VLAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vlan_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net vlan",
					"description": "查看所有vlan口配置"
				},
				{
					"command": "create net vlan myvlan200 interface { type bond interface mybond } vlan_id 200",
					"description": "在bond口mybond上创建名称为myvlan200的vlan子接口， vlanid为200"
				},
				{
					"command": "list net vlan myvlan200",
					"description": "查看vlan子接口myvlan200"
				},
				{
					"command": "modify net vlan myvlan200 name myvlan201 vlan_id 201",
					"description": "将vlan子接口myvlan200的名称及vlanid分别更新为myvlan201和201"
				},
				{
					"command": "delete net vlan myvlan201",
					"description": "删除vlan子接口myvlan201"
				}
			]
		},
		"/api/ad/v3/net/vlan/{name}": {
			"description": "指定VLAN子接口配置相关操作",
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
					"vlan"
				],
				"summary": "get specific vlan",
				"description": "查看指定VLAN子接口配置",
				"operationId": "get_vlan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vlan_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"vlan"
				],
				"summary": "create new vlan",
				"description": "新建VLAN子接口配置",
				"operationId": "create_vlan",
				"parameters": [
					{
						"$ref": "#/parameters/VLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vlan_object"
					}
				}
			},
			"put": {
				"tags": [
					"vlan"
				],
				"summary": "replace specific vlan",
				"description": "替换指定VLAN子接口配置",
				"operationId": "replace_vlan",
				"parameters": [
					{
						"$ref": "#/parameters/VLAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vlan_object"
					}
				}
			},
			"patch": {
				"tags": [
					"vlan"
				],
				"summary": "modify specific vlan",
				"description": "修改指定VLAN子接口配置",
				"operationId": "edit_vlan",
				"parameters": [
					{
						"$ref": "#/parameters/VLAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vlan_object"
					}
				}
			},
			"delete": {
				"tags": [
					"vlan"
				],
				"summary": "delete specific vlan",
				"description": "删除指定VLAN子接口配置",
				"operationId": "delete_vlan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_vlan_object"
					}
				}
			}
		}
	},
	"parameters": {
		"VLAN-CONFIG": {
			"name": "VLAN-CONFIG",
			"in": "body",
			"required": true,
			"description": "VLAN子接口配置",
			"schema": {
				"$ref": "#/definitions/config.vlan"
			}
		},
		"VLAN-PROPERTY": {
			"name": "VLAN-PROPERTY",
			"in": "body",
			"required": true,
			"description": "VLAN子接口属性",
			"schema": {
				"$ref": "#/definitions/config.vlan"
			}
		}
	},
	"responses": {
		"operation_config_vlan_list": {
			"description": "VLAN子接口配置列表",
			"schema": {
				"$ref": "#/definitions/config.vlan_list"
			}
		},
		"operation_config_vlan_object": {
			"description": "VLAN子接口配置对象",
			"schema": {
				"$ref": "#/definitions/config.vlan"
			}
		}
	},
	"definitions": {
		"config.vlan_list": {
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
						"$ref": "#/definitions/config.vlan"
					}
				}
			}
		},
		"config.vlan": {
			"type": "object",
			"required": [
				"name",
				"interface",
				"vlan_id"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；所创建vlan子接口配置名称",
					"example": "myvlan6",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；所创建vlan子接口描述标签"
				},
				"interface": {
					"type": "object",
					"description": "必选参数；引用接口配置",
					"required": [
						"interface"
					],
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"PHYSICAL",
								"BOND"
							],
							"description": "可选参数；引用接口类型（physical-普通网口/bond-聚合口），默认值physical",
							"default": "PHYSICAL",
							"example": "BOND"
						},
						"interface": {
							"type": "string",
							"description": "必选参数；引用的接口名称",
							"example": "bond-134"
						}
					}
				},
				"vlan_id": {
					"type": "integer",
					"description": "必选参数；vlan接口id值",
					"example": 6,
					"maximum": 4094,
					"minimum": 1
				},
				"device_name": {
					"type": "string",
					"description": "设备名称",
					"readOnly": true,
					"example": "eth2.6"
				},
				"mac_address": {
					"type": "string",
					"description": "MAC地址"
				}
			}
		}
	}
}