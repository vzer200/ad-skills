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
		"/api/ad/v3/net/dnat/": {
			"description": "目的地址转换配置管理操作",
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
					"dnat"
				],
				"summary": "get all dnat",
				"description": "获取目的地址转换配置",
				"operationId": "get_dnat_list",
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
						"$ref": "#/responses/operation_config_dnat_list"
					}
				}
			},
			"post": {
				"tags": [
					"dnat"
				],
				"summary": "create new dnat",
				"description": "新增目的地址转换配置",
				"operationId": "add_dnat_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNAT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnat_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"dnat"
				],
				"summary": "修改目的地址转换配置",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_dnat_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNAT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnat_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net dnat",
					"description": "获取全部目的地址转换配置"
				},
				{
					"command": "list net dnat dnat_8080",
					"description": "获取指定目的地址转换dnat_8080配置"
				},
				{
					"command": "create net dnat dnat_8080 destination_address { type ip-address address 6.3.3.3 } source_address { type all  address 89.23.3.3 } dnat_process { translated_ports [ 80 ] translated_address { type ip-address address 1.1.1.1 } }",
					"description": "创建名称为dnat_8080的目的地址转换， 其转换后的目的IP为6.3.3.3，源IP为89.23.3.3"
				},
				{
					"command": "modify net dnat dnat_8080 destination_address { type ip-address address 7.3.3.3 }",
					"description": "修改目的地址转换snat_8080的目的转换地址为7.3.3.3"
				},
				{
					"command": "delete net dnat dnat_8080",
					"description": "删除目的地址转换dnat_8080"
				}
			]
		},
		"/api/ad/v3/net/dnat/{name}": {
			"description": "目的地址转换配置管理操作",
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
					"dnat"
				],
				"summary": "get specific dnat",
				"description": "获取目的地址转换配置",
				"operationId": "get_dnat",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnat_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dnat"
				],
				"summary": "create new dnat",
				"description": "新增目的地址转换配置",
				"operationId": "create_dnat",
				"parameters": [
					{
						"$ref": "#/parameters/DNAT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnat_object"
					}
				}
			},
			"put": {
				"tags": [
					"dnat"
				],
				"summary": "replace specific dnat",
				"description": "修改目的地址转换配置",
				"operationId": "replace_dnat",
				"parameters": [
					{
						"$ref": "#/parameters/DNAT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnat_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dnat"
				],
				"summary": "modify specific dnat",
				"description": "修改目的地址转换配置",
				"operationId": "edit_dnat",
				"parameters": [
					{
						"$ref": "#/parameters/DNAT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnat_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dnat"
				],
				"summary": "delete specific dnat",
				"description": "删除目的地址转换配置",
				"operationId": "delete_dnat",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dnat_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNAT-CONFIG": {
			"name": "DNAT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dnat"
			}
		},
		"DNAT-PROPERTY": {
			"name": "DNAT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dnat"
			}
		}
	},
	"responses": {
		"operation_config_dnat_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dnat_list"
			}
		},
		"operation_config_dnat_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dnat"
			}
		}
	},
	"definitions": {
		"config.dnat_list": {
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
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.dnat"
					}
				}
			}
		},
		"config.dnat": {
			"type": "object",
			"required": [
				"name",
				"dnat_process"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "dnat_wan",
					"description": "指定目的地址转换的名称, 在目的地址转换配置中必须唯一"
				},
				"description": {
					"type": "string",
					"description": "可以对该目的地址转换进行额外的信息补充"
				},
				"position": {
					"type": "integer",
					"description": "从1开始移动配置的位置",
					"example": 1,
					"maximum": 65535,
					"minimum": 0
				},
				"state": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "目的地址转换的配置状态,enable 表示启用;disable 表示禁用",
					"default": "ENABLE"
				},
				"type": {
					"type": "string",
					"enum": [
						"IPV4",
						"IPV6"
					],
					"description": "目的地址转换的类型,ipv4 表示地址类型为V4;ipv6 表示地址类型为V6",
					"default": "IPV4",
					"example": "IPV4"
				},
				"inbound_links": {
					"description": "目的地址转换入接口列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "目的地址转换入接口，可以选择所有链路或者指定链路",
						"default": "ALL",
						"example": "WAN_1"
					},
					"example": [
						"ALL"
					]
				},
				"source_address": {
					"type": "object",
					"description": "指定源地址进行连接数限制,all表示所有源地址",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP"
							],
							"description": "ip-address表示指定源地址;all表示所有",
							"default": "ALL",
							"example": "ALL"
						},
						"address": {
							"type": "string",
							"description": "指定IP地址支持单IP、地址范围及网络号",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"description": "转换前源IP引用的用户地址集名称",
							"type": "string"
						}
					}
				},
				"destination_address": {
					"type": "object",
					"description": "指定目的地址进行连接数限制,all表示所有源地址",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP"
							],
							"default": "ALL",
							"description": "ip-address表示指定目的地址;all表示所有",
							"example": "ALL"
						},
						"address": {
							"type": "string",
							"description": "指定IP地址支持单IP、地址范围及网络号",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"description": "转换前的目的IP引用的用户地址集名称",
							"type": "string"
						}
					}
				},
				"protocol": {
					"type": "string",
					"enum": [
						"ALL",
						"TCP",
						"UDP",
						"ICMP",
						"ICMPV6",
						"TCP_UDP",
						"OTHER"
					],
					"description": "协议类型，可选择TCP，UDP，ICMP，ICMPV6，ALL表示所有，OTHER表示其他",
					"default": "ALL"
				},
				"protocol_number": {
					"type": "integer",
					"description": "协议号，选择OTHER协议时，需要输入协议号(0-255)",
					"example": 6,
					"maximum": 255,
					"minimum": 0,
					"default": 0
				},
				"source_port": {
					"type": "string",
					"description": "转换前的源ip端口范围，ALL表示没有设置",
					"default": "ALL",
					"example": "8080-8090"
				},
				"destination_ports": {
					"type": "array",
					"description": "可选参数，转换前的目的端口数组",
					"items": {
						"type": "string",
						"description": "转换前的目的ip端口范围，ALL表示没有设置",
						"default": "ALL",
						"example": "8080-8090"
					},
					"maxItems": 100
				},
				"dnat_process": {
					"type": "object",
					"description": "转换后的目的IP及转换策略以及目的端口",
					"required": [
						"translated_address"
					],
					"properties": {
						"translated_address": {
							"type": "object",
							"description": "转换后的目的IP",
							"required": [
								"address"
							],
							"properties": {
								"type": {
									"type": "string",
									"enum": [
										"IP-ADDRESS"
									],
									"description": "转换后的目的IP类型，ip-address表示指定IP",
									"default": "IP-ADDRESS",
									"example": "IP-ADDRESS"
								},
								"address": {
									"type": "string",
									"description": "指定IP地址支持单IP、地址范围及网络号",
									"example": "192.168.100.10"
								}
							}
						},
						"translated_ports": {
							"type": "array",
							"description": "转换后的目的端口数组",
							"items": {
								"type": "string",
								"description": "定义目的端口转换策略",
								"example": "8080-8090"
							},
							"maxItems": 100
						}
					}
				},
				"associated_application_group": {
					"type": "string",
					"description": "关联应用组的名称",
					"example": "default",
					"default": "Default"
				}
			}
		}
	}
}