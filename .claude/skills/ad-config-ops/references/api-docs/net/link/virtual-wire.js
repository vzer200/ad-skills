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
		"/api/ad/v3/net/link/virtual-wire/": {
			"description": "链路虚拟网线类别配置管理操作",
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
					"link-virtual_wire"
				],
				"summary": "get all link-virtual_wire",
				"description": "查看链路虚拟网线类别配置",
				"operationId": "get_link_virtual_wire_list",
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
						"$ref": "#/responses/operation_config_link_virtual_wire_list"
					}
				}
			},
			"post": {
				"tags": [
					"link-virtual_wire"
				],
				"summary": "create new link-virtual_wire",
				"description": "新建链路虚拟网线类别配置",
				"operationId": "add_link_virtual_wire_list",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_virtual_wire_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"link-virtual_wire"
				],
				"summary": "modify link-virtual_wire",
				"description": "修改链路虚拟网线类别配置",
				"operationId": "edit_link_virtual_wire_list",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_virtual-wire_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net link virtual-wire",
					"description": "查看所有虚拟网线类型链路配置"
				},
				{
					"command": "create net link virtual-wire my_virtual_wire interface { interface net1_net2_vlan_0_2 type vlan } cable_plugin_detect_vwire enable",
					"description": "引用虚拟网线生成的vlan子接口net1_net2_vlan_0_2生成虚拟网线链路；启用掉电检测"
				},
				{
					"command": "list net link virtual-wire my_virtual_wire",
					"description": "查看虚拟网线链路my_virtual_wire的配置"
				},
				{
					"command": "modify net link virtual-wire my_virtual_wire interface { interface net1_net2_vlan_4096_1 } cable_plugin_detect_vwire disable",
					"description": "更新虚拟网线链路my_virtual_wire引用口为net1_net2_vlan_4096_1；关闭掉电检测"
				},
				{
					"command": "delete net link virtual-wire my_virtual_wire",
					"description": "删除虚拟网线链路my_virtual_wire"
				}
			]
		},
		"/api/ad/v3/net/link/virtual-wire/{name}": {
			"description": "指定虚拟网线类别链路相关操作",
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
					"link-virtual_wire"
				],
				"summary": "get specific link-virtual_wire",
				"description": "查看指定虚拟网线类别链路配置",
				"operationId": "get_link_virtual_wire",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_virtual_wire_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"link-virtual_wire"
				],
				"summary": "create new link-virtual_wire",
				"description": "新建指定虚拟网线类别链路配置",
				"operationId": "create_link_virtual_wire",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_virtual_wire_object"
					}
				}
			},
			"put": {
				"tags": [
					"link-virtual_wire"
				],
				"summary": "replace specific link-virtual_wire",
				"description": "替换指定链路虚拟网线类别配置",
				"operationId": "replace_link_virtual-wire",
				"parameters": [
					{
						"$ref": "#/parameters/VIRTUAL-WIRE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_virtual_wire_object"
					}
				}
			},
			"patch": {
				"tags": [
					"link-virtual_wire"
				],
				"summary": "modify specific link-virtual_wire",
				"description": "修改指定链路虚拟网线类别配置",
				"operationId": "edit_link_virtual_wire",
				"parameters": [
					{
						"$ref": "#/parameters/virtual_wire-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_virtual_wire_object"
					}
				}
			},
			"delete": {
				"tags": [
					"link-virtual_wire"
				],
				"summary": "delete specific link-virtual_wire",
				"description": "删除指定链路虚拟网线类别配置",
				"operationId": "delete_link_virtual_wire",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_virtual_wire_object"
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
			"description": "链路虚拟网线类别配置",
			"schema": {
				"$ref": "#/definitions/config.link_virtual_wire"
			}
		},
		"VIRTUAL-WIRE-PROPERTY": {
			"name": "VIRTUAL-WIRE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "链路虚拟网线类别属性",
			"schema": {
				"$ref": "#/definitions/config.link_virtual_wire"
			}
		}
	},
	"responses": {
		"operation_config_link_virtual_wire_list": {
			"description": "链路虚拟网线类别配置列表",
			"schema": {
				"$ref": "#/definitions/config.link_virtual_wire_list"
			}
		},
		"operation_config_link_virtual_wire_object": {
			"description": "链路虚拟网线类别配置对象",
			"schema": {
				"$ref": "#/definitions/config.link_virtual_wire"
			}
		}
	},
	"definitions": {
		"config.link_virtual_wire_list": {
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
						"$ref": "#/definitions/config.link_virtual_wire"
					}
				}
			}
		},
		"config.link_virtual_wire": {
			"type": "object",
			"required": [
				"name",
				"interface"
			],
			"properties": {
				"name": {
					"description": "必选参数；配置名称",
					"type": "string",
					"example": "link_virtual_wire_1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"description": "可选参数；所配置虚拟网线链路描述标签",
					"type": "string"
				},
				"type": {
					"description": "可选参数；类别（VIRTUAL-WIRE）",
					"type": "string",
					"enum": [
						"VIRTUAL-WIRE"
					],
					"default": "VIRTUAL-WIRE",
					"example": "VIRTUAL-WIRE"
				},
				"state": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用），默认值enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"interface": {
					"description": "必选参数；网络接口",
					"type": "object",
					"required": [
						"interface"
					],
					"properties": {
						"type": {
							"description": "可选参数；接口类型（valn子接口），默认值VLAN",
							"type": "string",
							"enum": [
								"VLAN"
							],
							"default": "VLAN",
							"example": "VLAN"
						},
						"interface": {
							"description": "必选参数；接口配置名称",
							"type": "string",
							"example": "net1_net2_vlan_0_1",
							"maxLength": 511,
							"minLength": 1
						}
					},
					"maxItems": 1,
					"minItems": 1
				},
				"cable_plugin_detect": {
					"description": "可选参数；插拔网线检测（enable-启用/disable-禁用），默认值disable",
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