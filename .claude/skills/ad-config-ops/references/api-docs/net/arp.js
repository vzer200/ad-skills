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
		"/api/ad/v3/net/arp/": {
			"description": "ARP/ND防护配置管理",
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
					"arp"
				],
				"summary": "get all arp",
				"description": "获取ARP/ND防护配置",
				"operationId": "get_arp_list",
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
						"$ref": "#/responses/operation_config_arp_list"
					}
				}
			},
			"post": {
				"tags": [
					"arp"
				],
				"summary": "create new arp",
				"description": "新增ARP/ND防护配置",
				"operationId": "add_arp_list",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"arp"
				],
				"summary": "modify arp",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_arp_list",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_list"
					}
				}
			}
		},
		"/api/ad/v3/net/arp-batch/": {
			"description": "批量添加ARP/ND配置",
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
			"post": {
				"tags": [
					"arp"
				],
				"summary": "create batch of arp",
				"description": "批量添加ARP/ND配置",
				"operationId": "add_batch_arp_list",
				"parameters": [
					{
						"$ref": "#/parameters/JSON-BATCH"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_list"
					}
				}
			}
		},
		"/api/ad/v3/net/arp/{name}": {
			"description": "ARP/ND防护配置管理",
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
					"arp"
				],
				"summary": "get specific arp",
				"description": "获取ARP/ND防护配置",
				"operationId": "get_arp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"arp"
				],
				"summary": "create new arp",
				"description": "新增ARP/ND防护配置",
				"operationId": "create_arp",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_object"
					}
				}
			},
			"put": {
				"tags": [
					"arp"
				],
				"summary": "replace specific arp",
				"description": "修改ARP/ND防护配置",
				"operationId": "replace_arp",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"arp"
				],
				"summary": "modify specific arp",
				"description": "修改ARP/ND防护配置",
				"operationId": "edit_arp",
				"parameters": [
					{
						"$ref": "#/parameters/ARP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net arp",
					"description": "获取全部ARP配置"
				},
				{
					"command": "list net arp test_arp",
					"description": "获取arp test_arp配置"
				},
				{
					"command": "create net arp tes_arp ip_address 6.3.3.3 mac_address 00:01:6C:06:A6:29 link test_wan",
					"description": "创建名称为tes_arp的arp配置， 其源地址为6.3.3.3，Mac地址为00:01:6C:06:A6:29，系统链路为test_wan"
				},
				{
					"command": "modify net arp test_arp ip_address 89.3.3.3",
					"description": "修改arp test_arp的目的转换地址为89.3.3.3"
				},
				{
					"command": "delete net arp test_arp",
					"description": "删除arp配置test_arp"
				}
			],
			"delete": {
				"tags": [
					"arp"
				],
				"summary": "delete specific arp",
				"description": "删除ARP/ND防护配置",
				"operationId": "delete_arp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_arp_object"
					}
				}
			}
		}
	},
	"parameters": {
		"ARP-CONFIG": {
			"name": "ARP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.arp"
			}
		},
		"JSON-BATCH": {
			"name": "JSON-BATCH",
			"in": "body",
			"required": true,
			"description": "JSON Batch Config Object",
			"schema": {
				"$ref": "#/definitions/config.arp_batch"
			}
		},
		"ARP-PROPERTY": {
			"name": "ARP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.arp"
			}
		}
	},
	"responses": {
		"operation_config_arp_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.arp_list"
			}
		},
		"operation_config_arp_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.arp"
			}
		}
	},
	"definitions": {
		"config.arp_list": {
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
						"$ref": "#/definitions/config.arp"
					}
				}
			}
		},
		"config.arp": {
			"type": "object",
			"required": [
				"name",
				"ip_address",
				"mac_address",
				"link"
			],
			"properties": {
				"name": {
					"description": "必填参数；名称",
					"type": "string",
					"example": "host_pc",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"description": "可选参数；描述",
					"type": "string"
				},
				"ip_address": {
					"type": "string",
					"description": "必选参数；指定IP地址支持单IP。",
					"example": "192.168.100.1"
				},
				"mac_address": {
					"description": "必选参数；MAC地址，必须为xx:xx:xx:xx:xx:xx格式,其中x必须为0~9、A~F之间的数字或者字母。",
					"type": "string",
					"example": "00:90:0b:11:22:33"
				},
				"link": {
					"description": "必选参数；必须为已存在的链路或PPPOE接口。",
					"type": "string",
					"example": "WAN_2"
				}
			}
		},
		"config.arp_batch": {
			"type": "object",
			"properties": {
				"arp_records": {
					"type": "array",
					"description": "ARP的相关配置。",
					"items": {
						"type": "object",
						"required": [
							"ip_address",
							"mac_address",
							"link"
						],
						"properties": {
							"ip_address": {
								"type": "string",
								"example": "192.168.1.12",
								"description": "必选参数；指定IP地址支持单IP。"
							},
							"mac_address": {
								"type": "string",
								"example": "00:10:b4:12:65:34",
								"description": "必选参数；MAC地址，必须为xx:xx:xx:xx:xx:xx格式,其中x必须为0~9、A~F之间的数字或者字母。"
							},
							"link": {
								"type": "string",
								"example": "WAN_2",
								"description": "必选参数；必须为已存在的链路或PPPOE接口。"
							}
						}
					},
					"maxItems": 500
				}
			}
		}
	}
}