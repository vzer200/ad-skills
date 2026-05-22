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
		"/api/ad/v3/debug/dns/config-synchronization/sync-at-once": {
			"description": "数据中心配置立即同步操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"config-synchronization"
				],
				"summary": "sync-at-once config-synchronization",
				"description": "立即同步数据中心配置",
				"operationId": "sync_at_once_config_synchronization"
			},
			"__sfcli_example__": [
				{
					"command": "run debug dns config-synchronization sync-at-once",
					"description": "立即同步数据中心配置"
				}
			]
		}
	}
}