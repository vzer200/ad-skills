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
		"/api/ad/v3/stat/slb/virtual-service/{name}/rtt": {
			"description": "获取时延信息",
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
					"$ref": "/api/{common}.yaml#/parameters/trend"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
				}
			],
			"get": {
				"tags": [
					"rtt"
				],
				"summary": "get rtt",
				"description": "获取时延信息",
				"operationId": "get_rtt_of_stat_slb",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_slb_rtt"
					}
				}
			}
		}
	},
	"responses": {
		"operation_stat_slb_rtt": {
			"description": "rtt",
			"schema": {
				"$ref": "#/definitions/stat.slb_rtt"
			}
		}
	},
	"definitions": {
		"stat.slb_rtt": {
			"type": "object",
			"properties": {
				"ipv6_client_rtt": {
					"description": "IPv6客户端时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv6_server_rtt": {
					"description": "IPv6服务端时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv6_rtt_carrier_telecom": {
					"description": "IPv6电信时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv6_rtt_carrier_unicom": {
					"description": "IPv6联通时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv6_rtt_carrier_mobile": {
					"description": "IPv6移动时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv6_rtt_carrier_other": {
					"description": "IPv6其他运营商时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv4_client_rtt": {
					"description": "IPv4客户端时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv4_server_rtt": {
					"description": "IPv4服务端时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv4_rtt_carrier_telecom": {
					"description": "IPv4电信时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv4_rtt_carrier_unicom": {
					"description": "IPv4联通时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv4_rtt_carrier_mobile": {
					"description": "IPv4移动时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				},
				"ipv4_rtt_carrier_other": {
					"description": "IPv4其他运营商时延",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_trend"
				}
			}
		}
	}
}