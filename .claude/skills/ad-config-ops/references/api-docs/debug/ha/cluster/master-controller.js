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
		"/api/ad/v3/debug/ha/cluster/master-controller": {
			"description": "切换集群的主控设备操作",
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
					"$ref": "/api/{common}.yaml#/parameters/name"
				}
			],
			"post": {
				"description": "切换集群的主控设备",
				"tags": [
					"master-controller"
				],
				"summary": "switch cluster master-controller",
				"operationId": "switch_cluster_master_controller",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_cluster_master_controller_switch_result"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "run debug ha cluster master-controller",
					"description": "切换集群的主控设备"
				}
			]
		}
	},
	"responses": {
		"operation_debug_cluster_master_controller_switch_result": {
			"description": "Display statistics with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.cluster_master_controller_switch_result"
			}
		}
	},
	"definitions": {
		"debug.cluster_master_controller_switch_result": {
			"type": "object",
			"properties": {
				"original": {
					"description": "原始状态",
					"$ref": "/api/stat/ha/member.yaml#/definitions/stat.member_detail"
				},
				"current": {
					"description": "现在状态",
					"$ref": "/api/stat/ha/member.yaml#/definitions/stat.member_detail"
				}
			}
		}
	}
}