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
		"/api/ad/v3/sys/proxy": {
			"description": "查看、修改代理设置配置",
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
					"proxy"
				],
				"summary": "get proxy",
				"description": "查看当前已有的代理设置配置信息",
				"operationId": "get_proxy",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_proxy_object"
					}
				}
			},
			"put": {
				"tags": [
					"proxy"
				],
				"summary": "replace proxy",
				"description": "修改代理设置配置",
				"operationId": "replace_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/PROXY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_proxy_object"
					}
				}
			},
			"patch": {
				"tags": [
					"proxy"
				],
				"summary": "modify proxy",
				"description": "修改代理设置配置",
				"operationId": "edit_proxy",
				"parameters": [
					{
						"$ref": "#/parameters/PROXY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_proxy_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys proxy",
					"description": "查看代理设置"
				},
				{
					"command": "modify sys proxy state enable address 10.82.22.36 port 80 authentication enable username limei password root",
					"description": "启用代理服务器，服务器IP地址为10.82.22.36，端口80；启用验证用户，用户名为limei，密码为root"
				},
				{
					"command": "modify sys proxy state enable address 10.82.22.36 port 80 authentication enable username limei prompt_password",
					"description": "启用代理服务器，服务器IP地址为10.82.22.36，端口80；启用验证用户，用户名为limei，密码需要按回车后输入（对密码进行掩饰）"
				},
				{
					"command": "modify sys proxy state enable address 10.82.22.36 port 80 authentication enable username limei encrypted_password \"$MTMx$CiJ4JQOOxn4=$h9uliXDR7G9H99TWMRPIjfB39t8K3IIHjh1VrSNaZzmU84tbYQn4k18/BfyBgF1BSP8iEbOJd8fe/O0504zH8QK/ME5az5Ccf/46RG/euhRt/O3pmjoOVk1bDxAzumzvDgN+e6WIrxsMTLV3aSORY83pbRM8y6sYL6+T4G2VMXLsaL0JYTXYsoninMuSRBTqbwyFiYEkrEDuHAaXvSmTofgEEpCTNi9KIugTRJDWdW08qkViO4nNaGsX3oNtckaiKpFNEyw66nIlca/0OlQao/nWywdqlDCsl3E8oPzcEJ+KXiosXlUg1/7QY/dMGdpTIvB5ajvWDFQ5LvR/jcYW6g==\"",
					"description": "启用代理服务器，服务器IP地址为10.82.22.36，端口80；启用验证用户，用户名为limei，使用密文密码"
				}
			]
		}
	},
	"parameters": {
		"PROXY-CONFIG": {
			"name": "PROXY-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.proxy"
			}
		},
		"PROXY-PROPERTY": {
			"name": "PROXY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.proxy"
			}
		}
	},
	"responses": {
		"operation_config_proxy_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.proxy"
			}
		}
	},
	"definitions": {
		"config.proxy": {
			"type": "object",
			"properties": {
				"state": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）；是否启用代理服务器，默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "DISABLE"
				},
				"address": {
					"description": "可选参数；服务器IP地址，当启用代理服务器后需要填写",
					"type": "string",
					"example": "8.1.2.5"
				},
				"port": {
					"description": "可选参数；服务器监听端口，当启用代理服务器后需要填写",
					"type": "integer",
					"maximum": 65535,
					"minimum": 1,
					"example": 8080
				},
				"authentication": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用）；是否启用验证用户，默认为禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"username": {
					"description": "可选参数；用户名，当启用验证用户后需要填写",
					"type": "string",
					"maxLength": 20,
					"example": "user1"
				},
				"password": {
					"description": "可选参数；明文密码，当启用验证用户后需要填写",
					"type": "string",
					"maxLength": 40,
					"example": ""
				},
				"encrypted_password": {
					"description": "可选参数；密文密码",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"pk_password": {
					"description": "加密密码",
					"type": "string",
					"example": ""
				}
			}
		}
	}
}