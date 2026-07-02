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
		"/api/ad/v3/debug/slb/virtual-service/{name}/ipv6-report-export": {
			"description": "",
			"post": {
				"tags": [
					"ipv6-report-export"
				],
				"summary": "generate pdf  by ipv6-report",
				"description": "",
				"operationId": "generate_ipv6_report",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/name"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					},
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				},
				"x-examples": {
					"request": {
						"summary": "generate pdf  by ipv6-report",
						"description": "POST /api/ad/v3/debug/slb/virtual-service/{name}/ipv6-report-export\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/slb/virtual-service/{name}/ipv6-report-export"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/slb/virtual-service/{name}/ipv6-report-export 响应",
						"description": "返回POST /api/ad/v3/debug/slb/virtual-service/{name}/ipv6-report-export的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
					}
				}
			}
		}
	}
}