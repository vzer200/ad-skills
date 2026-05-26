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
		"/api/ad/v3/net/virtual-wire/": {
			"description": "虚拟网线配置管理操作",
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
					"virtual-wire"
				],
				"summary": "get all virtual-wire",
				"description": "查看虚拟网线配置",
				"operationId": "get_virtual-wire_list",
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
						"$ref": "#/responses/operation_config_virtual-wire_list"
					}
				}
			},
			"post": {
				"tags": [
					"virtual-wire"
				],
				"summary": "create new virtual-wire",
				"description": "新建虚拟网线配置",
				"operationId": "add_virtual-wire_list",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual-wire_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"virtual-wire"
				],
				"summary": "modify virtual-wire",
				"description": "修改虚拟网线配置",
				"operationId": "edit_virtual-wire_list",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual-wire_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net virtual-wire",
					"description": "查看所有虚拟网线"
				},
				{
					"command": "create net virtual-wire my_virtual-wire interface_1 { interface NET1 type physical } interface_2 { interface NET2 type physical }",
					"description": "创建名称为my_virtual-wire的虚拟网线，引用物理口NET1和NET2"
				},
				{
					"command": "list net virtual-wire my_virtual-wire",
					"description": "查看虚拟网线my_virtual-wire配置"
				},
				{
					"command": "modify net virtual-wire my_virtual-wire { interface NET3 type physical }",
					"description": "修改虚拟网线my_virtual-wire 引用物理口NET3"
				},
				{
					"command": "delete net virtual-wire my_virtual-wire",
					"description": "删除虚拟网线my_virtual-wire"
				}
			]
		},
		"/api/ad/v3/net/virtual-wire/{name}": {
			"description": "虚拟网线配置管理操作",
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
					"virtual-wire"
				],
				"summary": "get specific virtual-wire",
				"description": "查看指定虚拟网线配置",
				"operationId": "get_virtual-wire",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual-wire_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"virtual-wire"
				],
				"summary": "create new virtual-wire",
				"description": "新建虚拟网线配置",
				"operationId": "create_virtual-wire",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual-wire_object"
					}
				}
			},
			"put": {
				"tags": [
					"virtual-wire"
				],
				"summary": "replace specific virtual-wire",
				"description": "替换指定虚拟网线配置",
				"operationId": "replace_virtual-wire",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual-wire_object"
					}
				}
			},
			"patch": {
				"tags": [
					"virtual-wire"
				],
				"summary": "modify specific virtual-wire",
				"description": "修改指定虚拟网线配置",
				"operationId": "edit_virtual-wire",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual-wire_object"
					}
				}
			},
			"delete": {
				"tags": [
					"virtual-wire"
				],
				"summary": "delete specific virtual-wire",
				"description": "删除指定虚拟网线配置",
				"operationId": "delete_virtual-wire",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_virtual-wire_object"
					}
				}
			}
		}
	},
	"parameters": {
		"VIRTUAL-WIRE-CONFIG": {
			"name": "VIRTUAL-WIRE-CONFIG",
			"in": "body",
			"required": true,
			"description": "虚拟网线配置",
			"schema": {
				"$ref": "#/definitions/config.virtual-wire"
			}
		},
		"VIRTUAL-WIRE-PROPERTY": {
			"name": "VIRTUAL-WIRE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "虚拟网线属性",
			"schema": {
				"$ref": "#/definitions/config.virtual-wire"
			}
		}
	},
	"responses": {
		"operation_config_virtual-wire_list": {
			"description": "虚拟网线配置列表",
			"schema": {
				"$ref": "#/definitions/config.virtual-wire_list"
			}
		},
		"operation_config_virtual-wire_object": {
			"description": "虚拟网线配置对象",
			"schema": {
				"$ref": "#/definitions/config.virtual-wire"
			}
		}
	},
	"definitions": {
		"config.virtual-wire_list": {
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
						"$ref": "#/definitions/config.virtual-wire"
					}
				}
			}
		},
		"config.virtual-wire": {
			"type": "object",
			"required": [
				"name",
				"interfaces"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；配置名称",
					"example": "virtual-wire1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；所创建虚拟网线配置描述"
				},
				"interface_1": {
					"description": "必选参数；虚拟网线的网口成员1",
					"type": "object",
					"required": [
						"interface"
					],
					"properties": {
						"type": {
							"description": "可选参数；引用接口类型（physical-普通网口/bond-聚合口），默认为physical",
							"type": "string",
							"enum": [
								"PHYSICAL",
								"BOND"
							],
							"default": "PHYSICAL",
							"example": "BOND"
						},
						"interface": {
							"description": "必选参数；接口配置名称",
							"type": "string",
							"example": "bond-134"
						}
					},
					"maxItems": 1,
					"minItems": 1
				},
				"interface_2": {
					"description": "必选参数；虚拟网线的网口成员2",
					"type": "object",
					"required": [
						"interface"
					],
					"properties": {
						"type": {
							"description": "可选参数；引用接口类型（physical-普通网口/bond-聚合口），默认为physical",
							"type": "string",
							"enum": [
								"PHYSICAL",
								"BOND"
							],
							"default": "PHYSICAL",
							"example": "BOND"
						},
						"interface": {
							"description": "必选参数；接口配置名称",
							"type": "string",
							"example": "bond-135"
						}
					},
					"maxItems": 1,
					"minItems": 1
				},
				"vlan_ids": {
					"type": "array",
					"description": "虚拟网线支持的vlan id集合",
					"items": {
						"description": "虚拟网线支持的vlan id",
						"type": "integer",
						"maximum": 4096,
						"minimum": 1,
						"example": 1
					},
					"maxItems": 256,
					"example": "virtual-wire0"
				},
				"session_isolation": {
					"description": "虚拟网线会话隔离的开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				}
			}
		}
	}
}