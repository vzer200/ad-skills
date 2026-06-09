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
				},
				"x-examples": {
					"request": {
						"summary": "get rtt",
						"description": "获取时延信息\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/stat/slb/virtual-service/{name}/rtt"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/stat/slb/virtual-service/{name}/rtt 响应",
						"description": "返回GET /api/ad/v3/stat/slb/virtual-service/{name}/rtt的响应数据",
						"value": {
							"ipv6_client_rtt": null,
							"ipv6_server_rtt": null,
							"ipv6_rtt_carrier_telecom": null,
							"ipv6_rtt_carrier_unicom": null,
							"ipv6_rtt_carrier_mobile": null,
							"ipv6_rtt_carrier_other": null,
							"ipv4_client_rtt": null,
							"ipv4_server_rtt": null,
							"ipv4_rtt_carrier_telecom": null,
							"ipv4_rtt_carrier_unicom": null,
							"ipv4_rtt_carrier_mobile": null,
							"ipv4_rtt_carrier_other": null
						}
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