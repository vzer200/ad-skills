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
		"/api/ad/v3/debug/sys/update/{module}": {
			"description": "执行系统更新操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"update"
				],
				"summary": "update feature",
				"description": "执行系统更新操作",
				"operationId": "update_feature",
				"parameters": [
					{
						"$ref": "#/parameters/module"
					}
				]
			},
			"__sfcli_example__": [
				{
					"command": "run debug sys update application-identification",
					"description": "更新应用规则库"
				},
				{
					"command": "run debug sys update foreign-domain-group",
					"description": "更新域名地址集"
				},
				{
					"command": "run debug sys update isp-address-group",
					"description": "更新ISP地址集"
				},
				{
					"command": "run debug sys update system-patch",
					"description": "更新系统补丁"
				}
			]
		}
	},
	"parameters": {
		"module": {
			"name": "module",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "必选参数；指定立即更新的模块：system-patch(系统补丁)、isp-address-group(ISP地址集)、foreign-domain-group(域名地址集)和application-identification(应用规则库)",
			"enum": [
				"system-patch",
				"isp-address-group",
				"foreign-domain-group",
				"application-identification"
			]
		}
	}
}