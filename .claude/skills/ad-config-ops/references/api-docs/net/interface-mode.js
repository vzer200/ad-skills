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
		"/api/ad/v3/net/interface-mode": {
			"description": "网口配置管理操作",
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
					"interface-mode"
				],
				"summary": "get interface-mode",
				"description": "查看网口配置",
				"operationId": "get_interface_mode",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_interface_mode_object"
					}
				}
			},
			"put": {
				"tags": [
					"interface-mode"
				],
				"summary": "replace interface-mode",
				"description": "替换网口配置",
				"operationId": "replace_interface_mode",
				"parameters": [
					{
						"$ref": "#/parameters/INTERFACE-MODE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_interface_mode_object"
					}
				}
			},
			"patch": {
				"tags": [
					"interface-mode"
				],
				"summary": "modify interface-mode",
				"description": "修改网口配置",
				"operationId": "edit_interface_mode",
				"parameters": [
					{
						"$ref": "#/parameters/INTERFACE-MODE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_interface_mode_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify net interface-mode [ { device NET2  mode 1000baset-full } ]",
					"description": "设置NET2口为千兆全双工模式"
				}
			]
		}
	},
	"parameters": {
		"INTERFACE-MODE-CONFIG": {
			"name": "INTERFACE-MODE-CONFIG",
			"in": "body",
			"required": true,
			"description": "网口配置",
			"schema": {
				"$ref": "#/definitions/config.interface_mode"
			}
		},
		"INTERFACE-MODE-PROPERTY": {
			"name": "INTERFACE-MODE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "网口属性",
			"schema": {
				"$ref": "#/definitions/config.interface_mode"
			}
		}
	},
	"responses": {
		"operation_config_interface_mode_object": {
			"description": "网口配置对象",
			"schema": {
				"$ref": "#/definitions/config.interface_mode"
			}
		}
	},
	"definitions": {
		"config.interface_mode": {
			"type": "object",
			"description": "设置网口工作模式",
			"additionalProperties": {
				"type": "object",
				"description": "附加属性",
				"required": [
					"device",
					"mode"
				]
			},
			"properties": {
				"device": {
					"type": "string",
					"description": "必选参数；选择要设置的网口",
					"example": "NET1"
				},
				"mode": {
					"type": "string",
					"enum": [
						"AUTO",
						"10BASET-HALF",
						"10BASET-FULL",
						"100BASET-HALF",
						"100BASET-FULL",
						"1000BASET-HALF",
						"1000BASET-FULL",
						"10000BASET-HALF",
						"10000BASET-FULL",
						"40000BASET-HALF",
						"40000BASET-FULL"
					],
					"description": "必选参数；设定工作模式",
					"default": "AUTO",
					"example": "AUTO"
				},
				"lldp_status": {
					"description": "管理口LLDP状态",
					"type": "string",
					"enum": [
						"LLDP-STATUS-RX-TX",
						"LLDP-STATUS-RX",
						"LLDP-STATUS-TX",
						"LLDP-STATUS-DISABLE"
					],
					"default": "LLDP-STATUS-DISABLE",
					"example": "LLDP-STATUS-DISABLE"
				}
			}
		}
	}
}