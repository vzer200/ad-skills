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
		"/api/ad/v3/net/snat/": {
			"description": "SNAT源地址转换配置相关操作",
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
					"snat"
				],
				"summary": "get all snat",
				"description": "获取SNAT源地址转换配置",
				"operationId": "get_snat_list",
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
						"$ref": "#/responses/operation_config_snat_list"
					}
				}
			},
			"post": {
				"tags": [
					"snat"
				],
				"summary": "create new snat",
				"description": "新建SNAT源地址转换配置",
				"operationId": "add_snat_list",
				"parameters": [
					{
						"$ref": "#/parameters/SNAT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"snat"
				],
				"summary": "modify snat",
				"description": "修改SNAT源地址转换配置",
				"operationId": "edit_snat_list",
				"parameters": [
					{
						"$ref": "#/parameters/SNAT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net snat",
					"description": "获取全部源地址转换配置"
				},
				{
					"command": "list net snat snat_8080",
					"description": "获取指定源地址转换snat_8080配置"
				},
				{
					"command": "create net snat snat_8080 snat_process { translated_address { type ip-address address 33.3.3.3 } policy hash-srcip }",
					"description": "创建名称为snat_8080的源地址转换， 其转换后的源IP为33.3.3.3，转换策略为源IP哈希"
				},
				{
					"command": "modify net snat snat_8080 destination_address { type ip-address address 56.3.3.3 } position 3",
					"description": "修改源地址转换snat_8080的目的转换地址为56.3.3.3，位置为3"
				},
				{
					"command": "delete net snat snat_8080",
					"description": "删除源地址转换snat_8080"
				}
			]
		},
		"/api/ad/v3/net/snat/{name}": {
			"description": "SNAT源地址转换配置相关操作",
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
					"snat"
				],
				"summary": "get specific snat",
				"description": "获取SNAT源地址转换配置",
				"operationId": "get_snat",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"snat"
				],
				"summary": "create new snat",
				"description": "新建SNAT源地址转换配置",
				"operationId": "create_snat",
				"parameters": [
					{
						"$ref": "#/parameters/SNAT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_object"
					}
				}
			},
			"put": {
				"tags": [
					"snat"
				],
				"summary": "replace specific snat",
				"description": "修改SNAT源地址转换配置",
				"operationId": "replace_snat",
				"parameters": [
					{
						"$ref": "#/parameters/SNAT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_object"
					}
				}
			},
			"patch": {
				"tags": [
					"snat"
				],
				"summary": "modify specific snat",
				"description": "修改SNAT源地址转换配置",
				"operationId": "edit_snat",
				"parameters": [
					{
						"$ref": "#/parameters/SNAT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_object"
					}
				}
			},
			"delete": {
				"tags": [
					"snat"
				],
				"summary": "delete specific snat",
				"description": "删除SNAT源地址转换配置",
				"operationId": "delete_snat",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_snat_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SNAT-CONFIG": {
			"name": "SNAT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.snat"
			}
		},
		"SNAT-PROPERTY": {
			"name": "SNAT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.snat"
			}
		}
	},
	"responses": {
		"operation_config_snat_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snat_list"
			}
		},
		"operation_config_snat_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.snat"
			}
		}
	},
	"definitions": {
		"config.snat_list": {
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
						"$ref": "#/definitions/config.snat"
					}
				}
			}
		},
		"config.snat": {
			"type": "object",
			"required": [
				"name",
				"snat_process"
			],
			"properties": {
				"name": {
					"type": "string",
					"example": "snat_wan",
					"description": "指定源地址转换的名称, 在源地址转换配置中必须唯一。"
				},
				"description": {
					"type": "string",
					"description": "可以对该源地址转换进行额外的信息补充。"
				},
				"position": {
					"type": "integer",
					"description": "从1开始移动配置的位置。",
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
					"description": "源地址转换的配置状态,enable 表示启用;disable 表示禁用。",
					"default": "ENABLE"
				},
				"type": {
					"type": "string",
					"enum": [
						"IPV4",
						"IPV6"
					],
					"description": "源地址转换的类型,ipv4 表示地址类型为V4;ipv6 表示地址类型为V6。",
					"example": "IPV4",
					"default": "IPV4"
				},
				"inbound_links": {
					"description": "源地址转换入接口列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "源地址转换入接口，可以选择所有链路或者指定链路。",
						"default": "ALL",
						"example": "WAN_1"
					},
					"example": [
						"ALL"
					]
				},
				"outbound_links": {
					"description": "源地址转换出接口列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "源地址转换出接口，可以选择所有链路或者指定链路。",
						"default": "ALL",
						"example": "WAN_1"
					},
					"example": [
						"WAN_1"
					]
				},
				"source_address": {
					"type": "object",
					"description": "指定源地址进行连接数限制,all表示所有源地址。",
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
							"description": "ip-address表示指定源地址;custom-address-group表示用户地址集;all表示所有。",
							"default": "ALL",
							"example": "ALL"
						},
						"address": {
							"type": "string",
							"description": "指定IP地址支持单IP、地址范围及网络号。",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"type": "string",
							"description": "关联用于匹配此地址条件的用户地址集。",
							"example": "{custom_address_group}"
						}
					}
				},
				"destination_address": {
					"type": "object",
					"description": "指定源地址进行连接数限制,all表示所有源地址。",
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
							"description": "ip-address表示指定源地址;all表示所有。",
							"example": "ALL"
						},
						"address": {
							"type": "string",
							"description": "指定IP地址支持单IP、地址范围及网络号。",
							"example": "192.168.1.1/24"
						},
						"ref_custom_address_group": {
							"description": "转换前的目的IP引用的用户地址集名称。",
							"type": "string"
						}
					}
				},
				"protocol": {
					"type": "string",
					"description": "协议类型，可选择TCP，UDP，ICMP，ICMPV6，ALL表示所有，OTHER表示其他。",
					"enum": [
						"ALL",
						"TCP",
						"UDP",
						"ICMP",
						"ICMPV6",
						"OTHER"
					],
					"default": "ALL"
				},
				"protocol_number": {
					"type": "integer",
					"description": "协议号，选择OTHER协议时，需要输入协议号(0-255)。",
					"default": 0,
					"example": 6,
					"maximum": 255,
					"minimum": 0
				},
				"source_port": {
					"type": "string",
					"description": "转换前的源ip端口范围，ALL表示没有设置。",
					"default": "ALL",
					"example": "8080-8090"
				},
				"destination_port": {
					"type": "string",
					"description": "转换前的目的ip端口范围，ALL表示没有设置。",
					"default": "ALL",
					"example": "8080-8090"
				},
				"snat_process": {
					"type": "object",
					"description": "转换后的源IP及转换策略以及源端口",
					"required": [
						"translated_address"
					],
					"properties": {
						"translated_address": {
							"type": "object",
							"description": "转换后的源IP。",
							"required": [
								"type"
							],
							"properties": {
								"type": {
									"type": "string",
									"enum": [
										"OUTBOUND-LINK-IP",
										"IP-ADDRESS",
										"CUSTOM-ADDRESS-GROUP"
									],
									"description": "转换后的源IP类型，outbound-link-ip表示所有IP，ip-address表示指定IP，custom-address-group表示用户地址集。",
									"default": "OUTBOUND-LINK-IP",
									"example": "OUTBOUND-LINK-IP"
								},
								"address": {
									"type": "string",
									"example": "192.168.1.1/24",
									"description": "指定IP地址支持单IP、地址范围及网络号。"
								},
								"ref_custom_address_group": {
									"type": "string",
									"example": "{custom_address_group}",
									"description": "关联用于匹配此地址条件的用户地址集。"
								}
							}
						},
						"policy": {
							"type": "string",
							"enum": [
								"HASH-SRCIP",
								"HASH-SRCIP-AND-DSTIP"
							],
							"description": "转换策略，hash-srcip表示源IP哈希，hash-srcip-and-dstip表示源IP和目的IP哈希。",
							"default": "HASH-SRCIP-AND-DSTIP"
						},
						"source_port": {
							"type": "string",
							"enum": [
								"PRESERVE",
								"PRESERVE-STRICT",
								"CHANGE"
							],
							"description": "定义源端口转换策略（PRESERVE-尝试保持源端口/PRESERVE-STRICT-严格保持源端口/CHANGE-改变源端口）",
							"default": "PRESERVE"
						}
					}
				}
			}
		}
	}
}