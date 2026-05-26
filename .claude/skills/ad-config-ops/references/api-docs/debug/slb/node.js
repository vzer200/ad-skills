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
		"/api/ad/v3/debug/slb/pool/{pool_name}/resume": {
			"description": "节点列表操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/pool_name"
				},
				{
					"$ref": "#/parameters/node_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"post": {
				"tags": [
					"pool"
				],
				"summary": "resume node on temporary failure or disable status",
				"description": "恢复节点列表",
				"operationId": "resume_node"
			},
			"__sfcli_example__": [
				{
					"command": "list slb virtual-service",
					"description": "获取全部虚拟服务配置"
				}
			]
		}
	},
	"parameters": {
		"pool_name": {
			"name": "pool_name",
			"in": "path",
			"type": "string",
			"required": true,
			"example": "pool_web_portal_80",
			"description": "节点池名字"
		},
		"node_name": {
			"name": "node_name",
			"in": "path",
			"type": "string",
			"required": true,
			"example": "192.168.1.1_http",
			"description": "节点名字"
		}
	}
}