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
		"/api/ad/v3/net/interface-adapter/{module}/": {
			"description": "查询可用网络接口适配列表",
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
					"$ref": "#/parameters/module"
				}
			],
			"get": {
				"description": "查询可用网络接口适配列表",
				"tags": [
					"interface-adapter"
				],
				"summary": "get all interface",
				"operationId": "get_interface_adapter_list",
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
						"$ref": "#/responses/operation_config_interface_adapter_list"
					}
				}
			}
		},
		"/api/ad/v3/net/interface-adapter/{module}/{name}": {
			"description": "查询可用网络接口适配列表",
			"deprecated": true,
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
					"$ref": "#/parameters/module"
				}
			],
			"get": {
				"description": "",
				"deprecated": true,
				"tags": [
					"interface-adapter"
				],
				"summary": "get interface-adapter",
				"operationId": "get_interface_adapter",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_interface_adapter_object"
					}
				}
			}
		}
	},
	"parameters": {
		"module": {
			"name": "module",
			"in": "path",
			"type": "string",
			"description": "Module name",
			"required": true,
			"enum": [
				"all",
				"net/link/lan/interface",
				"net/link/wan/interface",
				"net/link/pppoe/interface",
				"net/bridge/interfaces",
				"net/bond/interfaces",
				"net/vlan/interface",
				"ha/active-standby/ha/interface",
				"ha/active-standby/alternate_ha/interface",
				"ha/active-standby/standby_interface_poweroff/interfaces",
				"ha/active-standby-join/ha/interface",
				"ha/active-standby-join/alternate_ha/interface",
				"ha/cluster/ha/interface",
				"ha/cluster/alternate_ha/interface",
				"ha/cluster-join/ha/interface",
				"ha/cluster-join/alternate_ha/interface"
			]
		}
	},
	"responses": {
		"operation_config_interface_adapter_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.interface_list"
			}
		},
		"operation_config_interface_adapter_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.interface"
			}
		}
	},
	"definitions": {
		"config.interface_list": {
			"type": "object",
			"properties": {
				"items_length": {
					"description": "当前页项目数",
					"type": "integer",
					"example": 8
				},
				"items": {
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.interface"
					}
				}
			}
		},
		"config.interface": {
			"type": "object",
			"required": [
				"name",
				"type",
				"device",
				"occupied_by"
			],
			"properties": {
				"name": {
					"description": "接口名称",
					"type": "string",
					"example": "NET1"
				},
				"type": {
					"description": "接口类型",
					"type": "string",
					"enum": [
						"COM",
						"PHYSICAL",
						"BOND",
						"VLAN",
						"BRIDGE"
					],
					"example": "PHYSICAL"
				},
				"device": {
					"description": "Device name.",
					"type": "string",
					"example": "eth1"
				},
				"occupied_by": {
					"description": "使用类型",
					"type": "string",
					"enum": [
						"NONE",
						"NET-BOND",
						"NET-BRIDGE",
						"NET-VLAN"
					],
					"default": "NONE",
					"example": "NONE"
				},
				"occupier": {
					"description": "引用此网口的配置列表",
					"type": "array",
					"items": {
						"description": "引用此网口的配置",
						"type": "string",
						"example": "bond_1_2"
					}
				}
			}
		}
	}
}