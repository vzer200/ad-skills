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
		"/api/ad/v3/debug/ha/virtual-mac/generator": {
			"description": "虚拟mac地址操作",
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
				"description": "生成虚拟mac地址",
				"tags": [
					"application-group"
				],
				"summary": "generate a virtual-mac",
				"operationId": "generate_virtual_mac",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_generate_virtual_mac"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug ha virtual-mac generator",
					"description": "生成虚拟mac地址"
				}
			]
		}
	},
	"responses": {
		"operation_debug_generate_virtual_mac": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.generate_virtual_mac"
			}
		}
	},
	"definitions": {
		"debug.generate_virtual_mac": {
			"type": "object",
			"properties": {
				"virtual_mac": {
					"description": "生成的虚拟mac地址",
					"type": "string"
				}
			}
		}
	}
}