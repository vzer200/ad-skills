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
		"/scenario": {
			"description": "场景状态信息管理操作",
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
					"scenario"
				],
				"summary": "get scenario",
				"description": "查看场景状态信息",
				"operationId": "get_scenario",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_scenario_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get scenario",
						"description": "查看场景状态信息",
						"value": {
							"method": "GET",
							"path": "/scenario"
						}
					},
					"response": {
						"summary": "GET /scenario 响应",
						"description": "返回GET /scenario的响应数据",
						"value": {
							"slb_scenario": "DISABLE",
							"slb_homepage_option": {
								"title": "",
								"prior_virtual_service_detail": [
									"connection"
								],
								"security_pool_title": "security_pool_80",
								"prior_security_pool_detail": [
									"connection"
								]
							},
							"prior_virtual_services": [
								"http_80_portal"
							],
							"prior_security_pool": [
								"security_pool_81"
							],
							"lc_scenario": "DISABLE",
							"lc_homepage_option": {
								"link_title": "",
								"policy_route_title": ""
							},
							"prior_links": [
								"wan_unicom"
							],
							"dns_scenario": "DISABLE",
							"dns_homepage_option": {
								"title": ""
							}
						}
					}
				}
			},
			"put": {
				"tags": [
					"scenario"
				],
				"summary": "replace scenario",
				"description": "更新场景信息配置",
				"operationId": "replace_scenario",
				"parameters": [
					{
						"$ref": "#/parameters/SCENARIO-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_scenario_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace scenario",
						"description": "更新场景信息配置",
						"value": {
							"method": "PUT",
							"path": "/scenario",
							"body": {
								"slb_scenario": "DISABLE",
								"lc_scenario": "DISABLE",
								"dns_scenario": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /scenario 响应",
						"description": "返回PUT /scenario的响应数据",
						"value": {
							"slb_scenario": "DISABLE",
							"slb_homepage_option": {
								"title": "",
								"prior_virtual_service_detail": [
									"connection"
								],
								"security_pool_title": "security_pool_80",
								"prior_security_pool_detail": [
									"connection"
								]
							},
							"prior_virtual_services": [
								"http_80_portal"
							],
							"prior_security_pool": [
								"security_pool_81"
							],
							"lc_scenario": "DISABLE",
							"lc_homepage_option": {
								"link_title": "",
								"policy_route_title": ""
							},
							"prior_links": [
								"wan_unicom"
							],
							"dns_scenario": "DISABLE",
							"dns_homepage_option": {
								"title": ""
							}
						}
					}
				}
			},
			"patch": {
				"tags": [
					"scenario"
				],
				"summary": "modify scenario",
				"description": "更新场景信息配置指定属性",
				"operationId": "edit_scenario",
				"parameters": [
					{
						"$ref": "#/parameters/SCENARIO-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_scenario_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify scenario",
						"description": "更新场景信息配置指定属性",
						"value": {
							"method": "PATCH",
							"path": "/scenario",
							"body": {
								"slb_scenario": "DISABLE",
								"lc_scenario": "DISABLE",
								"dns_scenario": "DISABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /scenario 响应",
						"description": "返回PATCH /scenario的响应数据",
						"value": {
							"slb_scenario": "DISABLE",
							"slb_homepage_option": {
								"title": "",
								"prior_virtual_service_detail": [
									"connection"
								],
								"security_pool_title": "security_pool_80",
								"prior_security_pool_detail": [
									"connection"
								]
							},
							"prior_virtual_services": [
								"http_80_portal"
							],
							"prior_security_pool": [
								"security_pool_81"
							],
							"lc_scenario": "DISABLE",
							"lc_homepage_option": {
								"link_title": "",
								"policy_route_title": ""
							},
							"prior_links": [
								"wan_unicom"
							],
							"dns_scenario": "DISABLE",
							"dns_homepage_option": {
								"title": ""
							}
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list scenario all_properties",
					"description": "获取场景信息全部属性"
				},
				{
					"command": "list scenario [ dns_homepage_option slb_homepage_option ]",
					"description": "获取场景信息指定属性"
				},
				{
					"command": " modify scenario slb_homepage_option { prior_virtual_service_detail [connection_rate  general_throughput]}",
					"description": "修改应用负载场景主页选项，关注名为connection_rate和general_throughput的虚拟服务"
				}
			]
		}
	},
	"parameters": {
		"SCENARIO-CONFIG": {
			"name": "SCENARIO-CONFIG",
			"in": "body",
			"required": true,
			"description": "场景信息配置",
			"schema": {
				"$ref": "#/definitions/config.scenario"
			}
		},
		"SCENARIO-PROPERTY": {
			"name": "SCENARIO-PROPERTY",
			"in": "body",
			"required": true,
			"description": "场景信息配置属性",
			"schema": {
				"$ref": "#/definitions/config.scenario"
			}
		}
	},
	"responses": {
		"operation_config_scenario_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.scenario"
			}
		}
	},
	"definitions": {
		"config.scenario": {
			"type": "object",
			"properties": {
				"slb_scenario": {
					"description": "应用负载场景使能，默认ENABLE",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"slb_homepage_option": {
					"description": "应用负载视图设置",
					"type": "object",
					"properties": {
						"title": {
							"description": "应用负载投屏名称",
							"type": "string",
							"example": ""
						},
						"prior_virtual_service_detail": {
							"description": "应用负载业务显示选项",
							"type": "array",
							"items": {
								"description": "指定业务显示数据",
								"type": "string",
								"example": "connection",
								"enum": [
									"connection_rate",
									"connection",
									"upstream_throughput",
									"downstream_throughput",
									"total_connection",
									"total_http_request",
									"http_request_rate",
									"pool_connection_rate"
								]
							},
							"example": [
								"connection",
								"connection_rate",
								"general_throughput"
							]
						},
						"security_pool_title": {
							"description": "安全资源池投屏名称",
							"type": "string",
							"example": "security_pool_80"
						},
						"prior_security_pool_detail": {
							"description": "安全资源池业务显示选项",
							"type": "array",
							"items": {
								"description": "指定安全资源池显示数据",
								"type": "string",
								"example": "connection_rate",
								"enum": [
									"connection_rate",
									"connection",
									"upstream_throughput",
									"downstream_throughput"
								]
							},
							"example": [
								"connection",
								"connection_rate",
								"general_throughput"
							]
						}
					}
				},
				"prior_virtual_services": {
					"description": "关注应用名称列表",
					"type": "array",
					"items": {
						"description": "关注应用名称，必须是已存在的虚拟服务",
						"type": "string",
						"example": "http_80_portal"
					},
					"example": [
						"http_80_portal",
						"pop3s_995_oamail"
					]
				},
				"prior_security_pool": {
					"description": "关注安全资源池名称列表",
					"type": "array",
					"items": {
						"description": "关注安全资源池名称，必须是已存在的安全资源池",
						"type": "string",
						"example": "security_pool_80"
					},
					"example": [
						"security_pool_81",
						"security_pool_88"
					]
				},
				"lc_scenario": {
					"description": "链路负载场景使能，默认ENABLE",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"lc_homepage_option": {
					"description": "链路负载视图选项",
					"type": "object",
					"properties": {
						"link_title": {
							"description": "链路负载投屏名称",
							"type": "string",
							"example": ""
						},
						"policy_route_title": {
							"description": "应用选路分析投屏名称",
							"type": "string",
							"example": ""
						}
					}
				},
				"prior_links": {
					"description": "关注链路名称列表",
					"type": "array",
					"items": {
						"description": "关注链路名称，必须已存在的链路",
						"type": "string",
						"example": "wan_1"
					},
					"example": [
						"wan_unicom",
						"wan_telecom"
					]
				},
				"dns_scenario": {
					"description": "全局负载场景使能，默认ENABLE",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"dns_homepage_option": {
					"description": "全局负载视图选项",
					"type": "object",
					"properties": {
						"title": {
							"description": "全局负载投屏名称",
							"type": "string",
							"example": ""
						}
					}
				}
			}
		}
	}
}