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
		"/api/ad/v3/net/ddos-defend-lan": {
			"description": "内外DDoS防护配置管理操作",
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
					"ddos-defend-lan"
				],
				"summary": "get ddos-defend-lan",
				"description": "查看内网DDoS防护配置",
				"operationId": "get_ddos_defend_lan",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ddos_defend_lan_object"
					}
				}
			},
			"put": {
				"tags": [
					"ddos-defend-lan"
				],
				"summary": "replace ddos-defend-lan",
				"description": "修改内网DDoS防护配置",
				"operationId": "replace_ddos_defend_lan",
				"parameters": [
					{
						"$ref": "#/parameters/DDOS-DEFEND-LAN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ddos_defend_lan_object"
					}
				}
			},
			"patch": {
				"tags": [
					"ddos-defend-lan"
				],
				"summary": "modify ddos-defend-lan",
				"description": "修改内网DDoS防护配置",
				"operationId": "edit_ddos_defend_lan",
				"parameters": [
					{
						"$ref": "#/parameters/DDOS-DEFEND-LAN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_ddos_defend_lan_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify net ddos-defend-lan syn_flood { state enable packet_pre_second_threshold 4096 } udp_flood { state enable packet_pre_second_threshold 4096 drop_empty_packet enable receive_packet_size_control enable receive_packet_minimum_size 1 receive_packet_maximum_size 65535 } icmp_flood { state enable packet_pre_second_threshold 4096 } release_persist_packet enable source_address_white_list [ 192.168.1.2/24]",
					"description": "修改内网DDos防护，启用syn flood防护，每目的IP阈值为4096包/秒，启用udp flood防护，每目的IP阈值为4096包/秒，启用丢弃数据包，启用丢弃指定长度以外的包，指定长度为1-65535，启用icmp flood防护，每目的IP阈值为4096包/秒，放通已有会话的数据包，白名单源IP范围为192.168.1.0/24"
				},
				{
					"command": "list net ddos-defend-lan",
					"description": "查看内网DDos防护的配置信息"
				}
			]
		}
	},
	"parameters": {
		"DDOS-DEFEND-LAN-CONFIG": {
			"name": "DDOS-DEFEND-LAN-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.ddos-defend-lan"
			}
		},
		"DDOS-DEFEND-LAN-PROPERTY": {
			"name": "DDOS-DEFEND-LAN-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.ddos-defend-lan"
			}
		}
	},
	"responses": {
		"operation_config_ddos_defend_lan_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.ddos-defend-lan"
			}
		}
	},
	"definitions": {
		"config.ddos-defend-lan": {
			"type": "object",
			"properties": {
				"syn_flood": {
					"type": "object",
					"description": "可选参数；syn flood防护",
					"properties": {
						"state": {
							"type": "string",
							"description": "可选参数；指定syn flood防护的状态，enable表示启用，disable表示禁用，默认为禁用",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"packet_pre_second_threshold": {
							"type": "integer",
							"description": "可选参数；指定每目的IP阈值，当syn_flood启用时需要指定此值",
							"example": 10000,
							"default": 4096,
							"maximum": 2147483647,
							"minimum": 0
						}
					}
				},
				"udp_flood": {
					"type": "object",
					"description": "可选参数；udp flood防护",
					"properties": {
						"state": {
							"type": "string",
							"description": "可选参数；指定syn flood防护的状态，enable表示启用，disable表示禁用，默认为禁用",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"packet_pre_second_threshold": {
							"type": "integer",
							"description": "可选参数；指定每目的IP阈值，当udp_flood启用时需要指定此值",
							"example": 10000,
							"default": 20480,
							"maximum": 2147483647,
							"minimum": 0
						},
						"drop_empty_packet": {
							"type": "string",
							"description": "可选参数；指定是否丢弃空数据包，enable表示启用，disable表示禁用，默认为启用",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"receive_packet_size_control": {
							"type": "string",
							"description": "可选参数；指定是否丢弃指定长度以外的包，enable表示启用，disable表示禁用，默认为禁用",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"receive_packet_minimum_size": {
							"type": "integer",
							"description": "可选参数；指定丢弃指定长度以外的包的最小长度，当receive_packet_size_control启用时需要指定此值，默认为8",
							"default": 8,
							"example": 8,
							"maximum": 65535,
							"minimum": 0
						},
						"receive_packet_maximum_size": {
							"type": "integer",
							"description": "可选参数；指定丢弃指定长度以外的包的最大长度，当receive_packet_size_control启用时需要指定此值，默认为65535",
							"default": 65535,
							"example": 65535,
							"maximum": 65535,
							"minimum": 0
						}
					}
				},
				"icmp_flood": {
					"type": "object",
					"description": "可选参数；icmp flood防护",
					"properties": {
						"state": {
							"type": "string",
							"description": "可选参数；指定icmp flood防护的状态，enable表示启用，disable表示禁用，默认为禁用",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"packet_pre_second_threshold": {
							"type": "integer",
							"description": "可选参数；指定每目的IP阈值，当icmp_flood启用时需要指定此值",
							"example": 10000,
							"maximum": 2147483647,
							"minimum": 0,
							"default": 2048
						}
					}
				},
				"release_persist_packet": {
					"type": "string",
					"description": "可选参数；指定放通还是丢弃已有会话的数据包，enable表示放通，disable表示丢弃，默认为放通",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"source_address_white_list": {
					"type": "array",
					"description": "可选参数；指定白名单源地址",
					"items": {
						"type": "string",
						"description": "可选参数；指定白名单源地址，可以是单个ip地址，ip地址范围，子网",
						"minLength": 0,
						"maxLength": 64
					},
					"example": [
						"1.1.1.0/24",
						"1.1.1.1-1.1.1.2",
						"1.1.1.1"
					],
					"maxItems": 100
				}
			}
		}
	}
}