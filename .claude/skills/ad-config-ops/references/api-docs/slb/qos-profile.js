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
		"/api/ad/v3/slb/qos-profile/": {
			"description": "新建、查看QoS策略配置",
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
					"qos-profile"
				],
				"summary": "get all qos-profile",
				"description": "查看当前已有的QoS策略配置信息",
				"operationId": "get_qos_profile_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_qos_profile_list"
					}
				}
			},
			"post": {
				"tags": [
					"qos-profile"
				],
				"summary": "create new qos-profile",
				"description": "新建一个QoS策略配置",
				"operationId": "add_qos_profile_list",
				"parameters": [
					{
						"$ref": "#/parameters/QOS-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_qos_profile_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb qos-profile qos1 description qostest link_bandwidth_control { state enable link_rules add [ { link wan1 downstream_bandwidth_precent 20 upstream_bandwidth_precent 30 } { link wan2 downstream_bandwidth_precent 40 upstream_bandwidth_precent 30 } ] } user_flow_control { state enable ip_rules add [ { source_address 1.1.1.0/24 downstream_rate_reserve_kbps 10 downstream_rate_limit_kbps 40 upstream_rate_reserve_kbps 30 upstream_rate_limit_kbps 60 } ] } dos_attack_control { state enable service http http_url_rules [ { url_pattern_wildcard /index.html action http-response http_response 200OK url_pattern_case_sensitive disable }{ url_pattern_wildcard * action tcp-rst } ] statistical_time 60 request_or_query_threshold 20000 }",
					"description": "新建QoS策略qos1,启用链路带宽控制和用户带宽控制,wan1链路下行带宽占用限制为20%,上行带宽占用限制为30%;用户带宽限制1.1.1.0/24网络的下行保障带宽为10kbps,下行限制带宽为40kbps;上行保障带宽为30kbps,下行保障带宽为"
				},
				{
					"command": "modify slb qos-profile qos1 dos_attack_control { state disable }",
					"description": "编辑QoS策略qos1,禁用DoS防护"
				},
				{
					"command": "list slb qos-profile qos1",
					"description": "查看QoS策略qos1的配置信息"
				},
				{
					"command": "delete slb qos-profile qos1",
					"description": "删除QoS策略qos1"
				}
			]
		},
		"/api/ad/v3/slb/qos-profile/{name}": {
			"description": "新建、查看、修改、删除指定的QoS策略配置",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/name"
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
					"qos-profile"
				],
				"summary": "get specific qos-profile",
				"description": "查看指定的QoS策略配置",
				"operationId": "get_qos_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_qos_profile_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"qos-profile"
				],
				"summary": "create new qos-profile",
				"description": "新建指定的QoS策略配置",
				"operationId": "create_qos_profile",
				"parameters": [
					{
						"$ref": "#/parameters/QOS-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_qos_profile_object"
					}
				}
			},
			"put": {
				"tags": [
					"qos-profile"
				],
				"summary": "replace specific qos-profile",
				"description": "修改指定的QoS策略配置",
				"operationId": "replace_qos_profile",
				"parameters": [
					{
						"$ref": "#/parameters/QOS-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_qos_profile_object"
					}
				}
			},
			"patch": {
				"tags": [
					"qos-profile"
				],
				"summary": "modify specific qos-profile",
				"description": "修改指定的QoS策略配置",
				"operationId": "edit_qos_profile",
				"parameters": [
					{
						"$ref": "#/parameters/QOS-PROFILE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_qos_profile_object"
					}
				}
			},
			"delete": {
				"tags": [
					"qos-profile"
				],
				"summary": "delete specific qos-profile",
				"description": "删除指定的QoS策略配置",
				"operationId": "delete_qos_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_qos_profile_object"
					}
				}
			}
		}
	},
	"parameters": {
		"QOS-PROFILE-CONFIG": {
			"name": "QOS-PROFILE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.qos_profile"
			}
		},
		"QOS-PROFILE-PROPERTY": {
			"name": "QOS-PROFILE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.qos_profile"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "config virtual service name",
			"required": true
		}
	},
	"responses": {
		"operation_config_qos_profile_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.qos_profile_list"
			}
		},
		"operation_config_qos_profile_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.qos_profile"
			}
		}
	},
	"definitions": {
		"config.qos_profile_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "配置数量上限",
					"type": "integer",
					"example": 4000
				},
				"total_pages": {
					"description": "总页数",
					"type": "integer",
					"example": 5
				},
				"page_number": {
					"description": "当前页号",
					"type": "integer",
					"example": 5
				},
				"page_size": {
					"description": "每页列表长度",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "当前项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "当前页项目数",
					"type": "integer",
					"example": 8
				},
				"items": {
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.qos_profile"
					}
				}
			}
		},
		"config.qos_profile": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定QoS策略的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "qos_srcip_10m"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"link_bandwidth_control": {
					"description": "可选参数;指定链路带宽控制,默认为disable",
					"type": "object",
					"required": [],
					"properties": {
						"state": {
							"description": "可选参数;指定是否启用链路带宽控制，disable表示禁用，enable表示启用；默认禁用。",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"link_rules": {
							"description": "可选参数;指定具体链路的上下行带宽占用百分比,该参数为对象列表参数,可通过add/delete进行添加/删除链路带宽策略",
							"type": "array",
							"items": {
								"description": "链路带宽控制",
								"type": "object",
								"required": [
									"link"
								],
								"properties": {
									"link": {
										"description": "可选参数;指定链路名称",
										"type": "string",
										"example": "{wan_link}"
									},
									"upstream_bandwidth_precent": {
										"description": "可选参数;指定上行带宽最大占用百分比,取值范围[1,100],单位为%",
										"type": "integer",
										"maximum": 100,
										"minimum": 0,
										"default": 100,
										"example": 50
									},
									"downstream_bandwidth_precent": {
										"description": "可选参数;指定下行带宽最大占用百分比,取值范围[1,100],单位为%",
										"type": "integer",
										"maximum": 100,
										"minimum": 0,
										"default": 100,
										"example": 50
									}
								}
							},
							"maxItems": 128
						}
					}
				},
				"user_flow_control": {
					"description": "可选参数;指定用户带宽控制,默认为disable",
					"type": "object",
					"required": [],
					"properties": {
						"state": {
							"description": "可选参数; 指定是否启用用户带宽控制,enable表示启用,disable表示禁用；默认禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"ip_rules": {
							"description": "可选参数;指定具体IP的上下行带宽,该参数为对象列表参数,可通过add/delete进行添加/删除链路带宽策略",
							"type": "array",
							"items": {
								"description": "可选参数",
								"type": "object",
								"required": [
									"source_address"
								],
								"properties": {
									"source_address": {
										"description": "可选参数;指定待限制带宽的源地址,支持单个IP地址、IP范围和IP子网",
										"type": "string",
										"example": "1.4.2.3"
									},
									"upstream_rate_reserve_kbps": {
										"description": "可选参数;指定上行最小保障带宽,单位为kbps",
										"type": "integer",
										"default": 1,
										"example": 500,
										"minimum": 1,
										"maximum": 40000000
									},
									"upstream_rate_limit_kbps": {
										"description": "可选参数;指定上行最大限制带宽,单位为kbps",
										"type": "integer",
										"default": 10000,
										"example": 10000,
										"minimum": 1,
										"maximum": 40000000
									},
									"downstream_rate_reserve_kbps": {
										"description": "可选参数;指定下行最小保障带宽,单位为kbps",
										"type": "integer",
										"default": 1,
										"example": 1000,
										"minimum": 1,
										"maximum": 40000000
									},
									"downstream_rate_limit_kbps": {
										"description": "可选参数;指定下行最大限制带宽,单位为kbps",
										"type": "integer",
										"default": 20000,
										"example": 20000,
										"minimum": 1,
										"maximum": 40000000
									}
								}
							},
							"maxItems": 128
						}
					}
				},
				"dos_attack_control": {
					"description": "可选参数;指定是否启用DoS防护,默认禁用",
					"type": "object",
					"required": [],
					"properties": {
						"state": {
							"description": "可选参数;指定是否启用DoS防护,enable表示启用,disable表示禁用；默认禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"service": {
							"description": "可选参数;指定服务类型,支持http和dns,默认为http",
							"type": "string",
							"enum": [
								"HTTP",
								"DNS"
							],
							"default": "HTTP"
						},
						"statistical_time": {
							"description": "可选参数;指定统计时长,默认为60,单位为s",
							"type": "integer",
							"maximum": 36000,
							"minimum": 1,
							"default": 60,
							"example": 60
						},
						"request_or_query_threshold": {
							"description": "可选参数;指定请求速率上限,默认为10000",
							"type": "integer",
							"maximum": 1000000,
							"minimum": 1,
							"default": 10000,
							"example": 10000
						},
						"http_url_rules": {
							"description": "可选参数;指定针对具体url的Dos防护处理方式",
							"type": "array",
							"items": {
								"description": "URI匹配规则项目",
								"type": "object",
								"required": [
									"url_pattern_wildcard",
									"action"
								],
								"properties": {
									"url_pattern_wildcard": {
										"description": "可选参数;指定防护url",
										"type": "string",
										"maxLength": 255,
										"minLength": 1,
										"example": "/login*"
									},
									"url_pattern_case_sensitive": {
										"description": "可选参数;指定是否区分大小写,enable表示启用,disable表示禁用；默认disable",
										"type": "string",
										"enum": [
											"ENABLE",
											"DISABLE"
										],
										"default": "DISABLE",
										"example": "ENABLE"
									},
									"action": {
										"description": "可选参数;指定防护动作:tcp-fin表示FIN关闭连接;tcp-rst表示RST方式关闭连接;http-response表示返回自定义页面",
										"type": "string",
										"enum": [
											"TCP-FIN",
											"TCP-RST",
											"HTTP-RESPONSE"
										],
										"default": "TCP-FIN"
									},
									"http_response": {
										"description": "可选参数;指定自定义内容的名称,当action为http-response时必选",
										"type": "string",
										"example": "{http_response}"
									}
								}
							},
							"maxItems": 128,
							"default": [
								{
									"url_pattern_wildcard": "*",
									"action": "TCP-FIN"
								}
							]
						}
					}
				}
			}
		}
	}
}