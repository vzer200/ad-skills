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
		"/api/ad/v4/dns/local-dns/forward-zone/": {
			"description": "转发域配置管理操作",
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
					"forward-zone"
				],
				"summary": "get all forward-zone",
				"description": "查看转发域配置",
				"operationId": "get_forward_zone_list",
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
						"$ref": "#/responses/operation_config_forward_zone_list"
					}
				}
			},
			"post": {
				"tags": [
					"forward-zone"
				],
				"summary": "create new forward-zone",
				"description": "创建一个转发域",
				"operationId": "add_forward_zone_list",
				"parameters": [
					{
						"$ref": "#/parameters/FORWARD-ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_forward_zone_object"
					}
				}
			}
		},
		"/api/ad/v4/dns/local-dns/forward-zone/{name}": {
			"description": "转发域单个配置管理操作",
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
					"forward-zone"
				],
				"summary": "get specific forward-zone",
				"description": "查看指定已有的LDNS转发域",
				"operationId": "get_forward_zone",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_forward_zone_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"forward-zone"
				],
				"summary": "create new forward-zone",
				"description": "创建一个LDNS转发域",
				"operationId": "create_forward_zone",
				"parameters": [
					{
						"$ref": "#/parameters/FORWARD-ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_forward_zone_object"
					}
				}
			},
			"put": {
				"tags": [
					"forward-zone"
				],
				"summary": "replace specific forward-zone",
				"description": "修改指定已有名称的LDNS转发域",
				"operationId": "replace_forward_zone",
				"parameters": [
					{
						"$ref": "#/parameters/FORWARD-ZONE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_forward_zone_object"
					}
				}
			},
			"patch": {
				"tags": [
					"forward-zone"
				],
				"summary": "modify specific forward-zone",
				"description": "增量修改指定已有的LDNS转发域",
				"operationId": "edit_forward_zone",
				"parameters": [
					{
						"$ref": "#/parameters/FORWARD-ZONE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_forward_zone_object"
					}
				}
			},
			"delete": {
				"tags": [
					"forward-zone"
				],
				"summary": "delete specific forward-zone",
				"description": "删除指定已有的LDNS转发域",
				"operationId": "delete_forward_zone",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_forward_zone_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns local-dns forward-zone",
					"description": "查看所有转发域配置"
				},
				{
					"command": "create dns local-dns forward-zone test.com forward_zone_server add [ { address 1.1.1.1 port 53 } ]",
					"description": "创建一个test.com的转发域"
				},
				{
					"command": "modify dns local-dns forward-zone test.com forward_zone_server add [ { address 2.2.2.2 port 2222 } ]",
					"description": "修改test.com配置"
				},
				{
					"command": "delete dns local-dns forward-zone test.com",
					"description": "删除test.com转发域配置"
				}
			]
		}
	},
	"parameters": {
		"FORWARD-ZONE-CONFIG": {
			"name": "FORWARD-ZONE-CONFIG",
			"in": "body",
			"required": true,
			"description": "LDNS转发域配置",
			"schema": {
				"$ref": "#/definitions/config.forward_zone"
			}
		},
		"FORWARD-ZONE-PROPERTY": {
			"name": "FORWARD-ZONE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "LDNS转发域属性",
			"schema": {
				"$ref": "#/definitions/config.forward_zone"
			}
		}
	},
	"responses": {
		"operation_config_forward_zone_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.forward_zone_list"
			}
		},
		"operation_config_forward_zone_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.forward_zone"
			}
		}
	},
	"definitions": {
		"config.forward_zone_list": {
			"type": "object",
			"properties": {
				"maximum_items": {
					"description": "项目数量最大值",
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
					"description": "页面大小",
					"type": "integer",
					"example": 10
				},
				"total_items": {
					"description": "项目总数",
					"type": "integer",
					"example": 48
				},
				"items_offset": {
					"description": "项目偏移量",
					"type": "integer",
					"example": 40
				},
				"items_length": {
					"description": "项目长度",
					"type": "integer",
					"example": 8
				},
				"items": {
					"type": "array",
					"description": "项目列表",
					"items": {
						"$ref": "#/definitions/config.forward_zone"
					}
				}
			}
		},
		"config.forward_zone": {
			"type": "object",
			"required": [
				"name",
				"forward_zone_server"
			],
			"properties": {
				"name": {
					"description": "LDNS转发域，按域名格式校验，最大长度200",
					"type": "string",
					"example": "com",
					"maxLength": 200,
					"minLength": 1
				},
				"forward_zone_server": {
					"type": "array",
					"description": "必须配置至少1条，最多配置10条",
					"maxItems": 10,
					"minItems": 1,
					"required": [
						"address",
						"port"
					],
					"items": {
						"type": "object",
						"properties": {
							"address": {
								"type": "string",
								"description": "转发服务器IP地址，为单个IPv4/IPv6地址"
							},
							"port": {
								"type": "integer",
								"description": "转发服务器端口，取值范围[1,65535]",
								"maximum": 65535,
								"minimum": 1
							}
						}
					}
				}
			}
		}
	}
}