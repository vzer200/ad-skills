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
		"/api/ad/v3/slb/udp-profile/": {
			"description": "新建、查看SIP策略配置",
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
					"udp-profile"
				],
				"summary": "get all udp-profile",
				"description": "查看当前已有的SIP策略配置信息",
				"operationId": "get_udp_profile_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/filter"
					},
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
						"$ref": "#/responses/operation_config_udp_profile_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all udp-profile",
						"description": "查看当前已有的SIP策略配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/udp-profile/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/udp-profile/ 响应",
						"description": "返回GET /api/ad/v3/slb/udp-profile/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"name": "udp_profile_1",
									"description": "example_string",
									"replied_idle_timeout": 60000,
									"ip_ttl_mode": "IP_TTL_DECREMENT",
									"ip_ttl_v4": 255,
									"ip_ttl_v6": 64,
									"flow_offload": "ENABLE",
									"flow_offload_delay": 8
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"udp-profile"
				],
				"summary": "create new udp-profile",
				"description": "新建一个UDP策略配置",
				"operationId": "add_udp_profile_list",
				"parameters": [
					{
						"$ref": "#/parameters/UDP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_udp_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new udp-profile",
						"description": "新建一个UDP策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/udp-profile/",
							"body": {
								"name": "AI_udp_profile_1_A",
								"replied_idle_timeout": 60000,
								"ip_ttl_mode": "IP_TTL_DECREMENT",
								"ip_ttl_v4": 255,
								"ip_ttl_v6": 64,
								"flow_offload": "ENABLE",
								"flow_offload_delay": 8
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/udp-profile/ 响应",
						"description": "返回POST /api/ad/v3/slb/udp-profile/的响应数据",
						"value": {
							"name": "AI_udp_profile_1_A",
							"description": "example_string",
							"replied_idle_timeout": 60000,
							"ip_ttl_mode": "IP_TTL_DECREMENT",
							"ip_ttl_v4": 255,
							"ip_ttl_v6": 64,
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb udp-profile udp_profile_1 description udp_profile replied_idle_timeout 60000 ip_ttl_mode ip_ttl_decrement",
					"description": "新建UDP策略udp_profile_1"
				},
				{
					"command": "modify slb udp-profile udp_profile_1 name udp_profile_2",
					"description": "修改UDP策略udp_profile_1名称为udp_profile_2"
				},
				{
					"command": "list slb udp-profile udp_profile_1",
					"description": "查看UDP策略udp_profile_1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/udp-profile/{name}": {
			"description": "新建、查看、修改、删除指定的UDP策略配置",
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
					"udp-profile"
				],
				"summary": "get specific udp-profile",
				"description": "查看指定的UDP策略配置",
				"operationId": "get_udp_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_udp_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific udp-profile",
						"description": "查看指定的UDP策略配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/udp-profile/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/udp-profile/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/udp-profile/{name}的响应数据",
						"value": {
							"name": "udp_profile_1",
							"description": "example_string",
							"replied_idle_timeout": 60000,
							"ip_ttl_mode": "IP_TTL_DECREMENT",
							"ip_ttl_v4": 255,
							"ip_ttl_v6": 64,
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"udp-profile"
				],
				"summary": "create new udp-profile",
				"description": "新建指定的UDP策略配置",
				"operationId": "create_udp_profile",
				"parameters": [
					{
						"$ref": "#/parameters/UDP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_udp_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new udp-profile",
						"description": "新建指定的UDP策略配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/udp-profile/{name}",
							"body": {
								"name": "AI_udp_profile_1_B",
								"replied_idle_timeout": 60000,
								"ip_ttl_mode": "IP_TTL_DECREMENT",
								"ip_ttl_v4": 255,
								"ip_ttl_v6": 64,
								"flow_offload": "ENABLE",
								"flow_offload_delay": 8
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/udp-profile/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/udp-profile/{name}的响应数据",
						"value": {
							"name": "AI_udp_profile_1_B",
							"description": "example_string",
							"replied_idle_timeout": 60000,
							"ip_ttl_mode": "IP_TTL_DECREMENT",
							"ip_ttl_v4": 255,
							"ip_ttl_v6": 64,
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8
						}
					}
				}
			},
			"put": {
				"tags": [
					"udp-profile"
				],
				"summary": "replace specific udp-profile",
				"description": "修改指定的UDP策略配置",
				"operationId": "replace_udp_profile",
				"parameters": [
					{
						"$ref": "#/parameters/UDP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_udp_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific udp-profile",
						"description": "修改指定的UDP策略配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/udp-profile/{name}",
							"body": {
								"name": "udp_profile_1",
								"replied_idle_timeout": 60000,
								"ip_ttl_mode": "IP_TTL_DECREMENT",
								"ip_ttl_v4": 255,
								"ip_ttl_v6": 64,
								"flow_offload": "ENABLE",
								"flow_offload_delay": 8
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/udp-profile/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/udp-profile/{name}的响应数据",
						"value": {
							"name": "udp_profile_1",
							"description": "example_string",
							"replied_idle_timeout": 60000,
							"ip_ttl_mode": "IP_TTL_DECREMENT",
							"ip_ttl_v4": 255,
							"ip_ttl_v6": 64,
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8
						}
					}
				}
			},
			"patch": {
				"tags": [
					"udp-profile"
				],
				"summary": "modify specific udp-profile",
				"description": "修改指定的UDP策略配置",
				"operationId": "edit_udp_profile",
				"parameters": [
					{
						"$ref": "#/parameters/UDP-PROFILE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_udp_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific udp-profile",
						"description": "修改指定的UDP策略配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/udp-profile/{name}"
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/udp-profile/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/udp-profile/{name}的响应数据",
						"value": {
							"name": "udp_profile_1",
							"description": "example_string",
							"replied_idle_timeout": 60000,
							"ip_ttl_mode": "IP_TTL_DECREMENT",
							"ip_ttl_v4": 255,
							"ip_ttl_v6": 64,
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8
						}
					}
				}
			},
			"delete": {
				"tags": [
					"udp-profile"
				],
				"summary": "delete specific udp-profile",
				"description": "删除指定的UDP策略配置",
				"operationId": "delete_udp_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_udp_profile_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific udp-profile",
						"description": "删除指定的UDP策略配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/udp-profile/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/udp-profile/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/udp-profile/{name}的响应数据",
						"value": {
							"name": "udp_profile_1",
							"description": "example_string",
							"replied_idle_timeout": 60000,
							"ip_ttl_mode": "IP_TTL_DECREMENT",
							"ip_ttl_v4": 255,
							"ip_ttl_v6": 64,
							"flow_offload": "ENABLE",
							"flow_offload_delay": 8
						}
					}
				}
			}
		}
	},
	"parameters": {
		"UDP-PROFILE-CONFIG": {
			"name": "UDP-PROFILE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.udp_profile"
			}
		},
		"SIP-PROFILE-PROPERTY": {
			"name": "SIP-PROFILE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.udp_profile"
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
		"operation_config_udp_profile_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.udp_profile_list"
			}
		},
		"operation_config_udp_profile_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.udp_profile"
			}
		}
	},
	"definitions": {
		"config.udp_profile_list": {
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
						"$ref": "#/definitions/config.udp_profile"
					}
				}
			}
		},
		"config.udp_profile": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "UDP优化策略名称",
					"type": "string",
					"example": "udp_profile_1"
				},
				"description": {
					"type": "string",
					"description": "UDP优化策略描述信息"
				},
				"replied_idle_timeout": {
					"description": "空闲超时时间(ms)",
					"type": "integer",
					"default": 60000,
					"maximum": 4294967295,
					"minimum": 1
				},
				"ip_ttl_mode": {
					"description": "TTL模式",
					"type": "string",
					"enum": [
						"IP_TTL_PROXY",
						"IP_TTL_PRESERVE",
						"IP_TTL_DECREMENT",
						"IP_TTL_SET"
					],
					"default": "IP_TTL_DECREMENT"
				},
				"ip_ttl_v4": {
					"description": "可选参数；ip_ttl_mode字段为IP_TTL_SET时，可设置IPv4 TTL",
					"type": "integer",
					"default": 255,
					"maximum": 255,
					"minimum": 0
				},
				"ip_ttl_v6": {
					"description": "可选参数；ip_ttl_mode字段为IP_TTL_SET时，可设置IPv6 TTL",
					"type": "integer",
					"default": 64,
					"maximum": 255,
					"minimum": 0
				},
				"flow_offload": {
					"description": "硬件加速开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"flow_offload_delay": {
					"description": "延迟下发流表, 必须为0~128之间的整数",
					"type": "integer",
					"default": 8,
					"maximum": 128,
					"minimum": 0
				}
			}
		}
	}
}