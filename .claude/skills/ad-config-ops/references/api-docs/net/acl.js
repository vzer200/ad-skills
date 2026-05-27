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
		"/api/ad/v3/net/acl/": {
			"description": "ACL配置管理操作",
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
					"acl"
				],
				"summary": "get all acl",
				"description": "获取ACL配置",
				"operationId": "get_acl_list",
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
						"$ref": "#/responses/operation_config_acl_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all acl",
						"description": "获取ACL配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/net/acl/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/net/acl/ 响应",
						"description": "返回GET /api/ad/v3/net/acl/的响应数据",
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
									"name": "deny_10.1.2.3",
									"description": "example_string",
									"position": 1,
									"state": "ENABLE",
									"inbound_links": [
										"ALL"
									],
									"source_address": {
										"type": "IP-ADDRESS",
										"address": "192.168.1.1",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"destination_address": {
										"type": "IP-ADDRESS",
										"address": "192.168.1.1",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"protocol": "ALL",
									"protocol_number": 6,
									"icmp_types": [
										0
									],
									"source_ports": "ALL",
									"destination_ports": "ALL",
									"policy": "DENY"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"acl"
				],
				"summary": "create new acl",
				"description": "新建ACL配置",
				"operationId": "add_acl_list",
				"parameters": [
					{
						"$ref": "#/parameters/ACL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_acl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new acl",
						"description": "新建ACL配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/net/acl/",
							"body": {
								"name": "AI_deny_10.1.2.3_A",
								"state": "ENABLE",
								"source_address": {
									"type": "IP-ADDRESS"
								},
								"destination_address": {
									"type": "IP-ADDRESS"
								},
								"protocol": "ALL",
								"source_ports": "ALL",
								"destination_ports": "ALL",
								"policy": "DENY"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/net/acl/ 响应",
						"description": "返回POST /api/ad/v3/net/acl/的响应数据",
						"value": {
							"name": "AI_deny_10.1.2.3_A",
							"description": "example_string",
							"position": 1,
							"state": "ENABLE",
							"inbound_links": [
								"ALL"
							],
							"source_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"protocol": "ALL",
							"protocol_number": 6,
							"icmp_types": [
								0
							],
							"source_ports": "ALL",
							"destination_ports": "ALL",
							"policy": "DENY"
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"acl"
				],
				"summary": "modify acl",
				"description": "修改ACL配置",
				"operationId": "edit_acl_list",
				"parameters": [
					{
						"$ref": "#/parameters/ACL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_acl_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify acl",
						"description": "修改ACL配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/net/acl/",
							"body": {
								"name": "deny_10.1.2.3",
								"state": "ENABLE",
								"source_address": {
									"type": "IP-ADDRESS"
								},
								"destination_address": {
									"type": "IP-ADDRESS"
								},
								"protocol": "ALL",
								"source_ports": "ALL",
								"destination_ports": "ALL",
								"policy": "DENY"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/net/acl/ 响应",
						"description": "返回PATCH /api/ad/v3/net/acl/的响应数据",
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
									"name": "deny_10.1.2.3",
									"description": "example_string",
									"position": 1,
									"state": "ENABLE",
									"inbound_links": [
										"ALL"
									],
									"source_address": {
										"type": "IP-ADDRESS",
										"address": "192.168.1.1",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"destination_address": {
										"type": "IP-ADDRESS",
										"address": "192.168.1.1",
										"ref_custom_address_group": "{custom_address_group}"
									},
									"protocol": "ALL",
									"protocol_number": 6,
									"icmp_types": [
										0
									],
									"source_ports": "ALL",
									"destination_ports": "ALL",
									"policy": "DENY"
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create net acl abc description acl state enable position 1 protocol tcp protocol_number 6 inbound_links [ lan ] source_address { type ip-address address 192.168.1.100-192.168.1.200 } source_ports 1-65535 destination_address { type ip-address  address 192.168.2.100-192.168.2.200 } destination_ports 1-65535 policy deny",
					"description": "新建ACL配置abc，状态为启用，位置序号为1，协议为tcp，协议号为6，指定入接口为lan，源IP地址类型为指定IP，IP地址为192.168.1.100-192.168.1.200，源端口范围为1-65535，目的IP地址为指定IP，IP地址为192.168.2.100-192.168.2.200，目的端口范围为1-65535，动作为拒绝"
				},
				{
					"command": "modify net acl abc state disable",
					"description": "修改ACL配置abc，状态为禁用"
				},
				{
					"command": "list net acl abc",
					"description": "查看ACL配置abc的配置信息"
				}
			]
		},
		"/api/ad/v3/net/acl/{name}": {
			"description": "ACL配置管理操作",
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
					"acl"
				],
				"summary": "get specific acl",
				"description": "获取ACL配置",
				"operationId": "get_acl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_acl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific acl",
						"description": "获取ACL配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/net/acl/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/net/acl/{name} 响应",
						"description": "返回GET /api/ad/v3/net/acl/{name}的响应数据",
						"value": {
							"name": "deny_10.1.2.3",
							"description": "example_string",
							"position": 1,
							"state": "ENABLE",
							"inbound_links": [
								"ALL"
							],
							"source_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"protocol": "ALL",
							"protocol_number": 6,
							"icmp_types": [
								0
							],
							"source_ports": "ALL",
							"destination_ports": "ALL",
							"policy": "DENY"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"acl"
				],
				"summary": "create new acl",
				"description": "新建ACL配置",
				"operationId": "create_acl",
				"parameters": [
					{
						"$ref": "#/parameters/ACL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_acl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new acl",
						"description": "新建ACL配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/net/acl/{name}",
							"body": {
								"name": "AI_deny_10.1.2.3_B",
								"state": "ENABLE",
								"source_address": {
									"type": "IP-ADDRESS"
								},
								"destination_address": {
									"type": "IP-ADDRESS"
								},
								"protocol": "ALL",
								"source_ports": "ALL",
								"destination_ports": "ALL",
								"policy": "DENY"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/net/acl/{name} 响应",
						"description": "返回POST /api/ad/v3/net/acl/{name}的响应数据",
						"value": {
							"name": "AI_deny_10.1.2.3_B",
							"description": "example_string",
							"position": 1,
							"state": "ENABLE",
							"inbound_links": [
								"ALL"
							],
							"source_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"protocol": "ALL",
							"protocol_number": 6,
							"icmp_types": [
								0
							],
							"source_ports": "ALL",
							"destination_ports": "ALL",
							"policy": "DENY"
						}
					}
				}
			},
			"put": {
				"tags": [
					"acl"
				],
				"summary": "replace specific acl",
				"description": "修改ACL配置",
				"operationId": "replace_acl",
				"parameters": [
					{
						"$ref": "#/parameters/ACL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_acl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific acl",
						"description": "修改ACL配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/net/acl/{name}",
							"body": {
								"name": "deny_10.1.2.3",
								"state": "ENABLE",
								"source_address": {
									"type": "IP-ADDRESS"
								},
								"destination_address": {
									"type": "IP-ADDRESS"
								},
								"protocol": "ALL",
								"source_ports": "ALL",
								"destination_ports": "ALL",
								"policy": "DENY"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/net/acl/{name} 响应",
						"description": "返回PUT /api/ad/v3/net/acl/{name}的响应数据",
						"value": {
							"name": "deny_10.1.2.3",
							"description": "example_string",
							"position": 1,
							"state": "ENABLE",
							"inbound_links": [
								"ALL"
							],
							"source_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"protocol": "ALL",
							"protocol_number": 6,
							"icmp_types": [
								0
							],
							"source_ports": "ALL",
							"destination_ports": "ALL",
							"policy": "DENY"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"acl"
				],
				"summary": "modify specific acl",
				"description": "修改ACL配置",
				"operationId": "edit_acl",
				"parameters": [
					{
						"$ref": "#/parameters/ACL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_acl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific acl",
						"description": "修改ACL配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/net/acl/{name}",
							"body": {
								"name": "deny_10.1.2.3",
								"state": "ENABLE",
								"source_address": {
									"type": "IP-ADDRESS"
								},
								"destination_address": {
									"type": "IP-ADDRESS"
								},
								"protocol": "ALL",
								"source_ports": "ALL",
								"destination_ports": "ALL",
								"policy": "DENY"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/net/acl/{name} 响应",
						"description": "返回PATCH /api/ad/v3/net/acl/{name}的响应数据",
						"value": {
							"name": "deny_10.1.2.3",
							"description": "example_string",
							"position": 1,
							"state": "ENABLE",
							"inbound_links": [
								"ALL"
							],
							"source_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"protocol": "ALL",
							"protocol_number": 6,
							"icmp_types": [
								0
							],
							"source_ports": "ALL",
							"destination_ports": "ALL",
							"policy": "DENY"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"acl"
				],
				"summary": "delete specific acl",
				"description": "",
				"operationId": "delete_acl",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_acl_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific acl",
						"description": "DELETE /api/ad/v3/net/acl/{name}",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/net/acl/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/net/acl/{name} 响应",
						"description": "返回DELETE /api/ad/v3/net/acl/{name}的响应数据",
						"value": {
							"name": "deny_10.1.2.3",
							"description": "example_string",
							"position": 1,
							"state": "ENABLE",
							"inbound_links": [
								"ALL"
							],
							"source_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"destination_address": {
								"type": "IP-ADDRESS",
								"address": "192.168.1.1",
								"ref_custom_address_group": "{custom_address_group}"
							},
							"protocol": "ALL",
							"protocol_number": 6,
							"icmp_types": [
								0
							],
							"source_ports": "ALL",
							"destination_ports": "ALL",
							"policy": "DENY"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"ACL-CONFIG": {
			"name": "ACL-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.acl"
			}
		},
		"ACL-PROPERTY": {
			"name": "ACL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.acl"
			}
		}
	},
	"responses": {
		"operation_config_acl_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.acl_list"
			}
		},
		"operation_config_acl_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.acl"
			}
		}
	},
	"definitions": {
		"config.acl_list": {
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
						"$ref": "#/definitions/config.acl"
					}
				}
			}
		},
		"config.acl": {
			"type": "object",
			"required": [
				"name",
				"source_address",
				"destination_address",
				"policy"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定TCP策略的名称, 在配置中必须唯一",
					"example": "deny_10.1.2.3"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注"
				},
				"position": {
					"type": "integer",
					"description": "可选参数；指定此配置的位置序号，默认为最后一条配置",
					"maximum": 65535,
					"minimum": 1,
					"example": 1
				},
				"state": {
					"type": "string",
					"description": "可选参数；指定是否启用，enable表示启用，disable表示禁用；默认为启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"inbound_links": {
					"type": "array",
					"description": "可选参数；指定入接口，可以选择所有链路或指定链路，默认为所有链路",
					"items": {
						"type": "string",
						"description": "可选参数；指定入接口，可以选择所有链路或指定链路，默认为所有链路",
						"default": "ALL",
						"example": "ALL"
					}
				},
				"source_address": {
					"type": "object",
					"description": "必选参数；指定源IP地址",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"description": "必选参数；指定源IP地址的类型",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP"
							],
							"example": "ALL",
							"default": "IP-ADDRESS"
						},
						"address": {
							"type": "string",
							"description": "Format: {IP} | {IP-RANGE} | {IP-SUBNET}",
							"example": "192.168.1.1"
						},
						"ref_custom_address_group": {
							"type": "string",
							"description": "可选参数；如果type为custom-address-group，需要指定用户地址集",
							"example": "{custom_address_group}"
						}
					}
				},
				"destination_address": {
					"type": "object",
					"description": "必选参数；指定目的IP地址",
					"required": [
						"type"
					],
					"properties": {
						"type": {
							"type": "string",
							"description": "必选参数；指定源IP地址的类型",
							"enum": [
								"ALL",
								"IP-ADDRESS",
								"CUSTOM-ADDRESS-GROUP"
							],
							"example": "ALL",
							"default": "IP-ADDRESS"
						},
						"address": {
							"type": "string",
							"description": "可选参数；如果type为ip-address，需要指定ip地址",
							"example": "192.168.1.1"
						},
						"ref_custom_address_group": {
							"type": "string",
							"description": "可选参数；如果type为custom-address-group，需要指定用户地址集",
							"example": "{custom_address_group}"
						}
					}
				},
				"protocol": {
					"type": "string",
					"description": "可选参数；指定协议，默认为所有协议",
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
					"description": "可选参数；指定协议号，如果protocol为other，需要指定协议号",
					"example": 6,
					"maximum": 255,
					"minimum": 0
				},
				"icmp_types": {
					"type": "array",
					"description": "可选参数；指定ICMP具体类型，0-回显应答；3-目的不可达；4-源端关闭；5-重定向；8-回显请求；9-路由器通告；10-路由器请求；11-超时；12-参数问题；13-时间戳请求；14-时间戳应答；15-信息请求；16-信息应答；17-地址掩码请求；18-地址掩码应答",
					"items": {
						"type": "integer",
						"description": "可选参数；指定icmp类型，如果protocol为icmp，需要指定icmp类型",
						"example": 0,
						"maximum": 255,
						"minimum": 0
					},
					"maxItems": 256
				},
				"source_ports": {
					"type": "string",
					"description": "可选参数；指定源端口范围，默认为所有",
					"default": "ALL",
					"example": "8080-8090"
				},
				"destination_ports": {
					"type": "string",
					"description": "可选参数；指定目的端口范围，默认为所有",
					"default": "ALL",
					"example": "8080-8090"
				},
				"policy": {
					"type": "string",
					"description": "必选参数；allow表示允许，deny表示拒绝",
					"enum": [
						"ALLOW",
						"DENY"
					],
					"example": "DENY"
				}
			}
		}
	}
}