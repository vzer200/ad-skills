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
		"/api/ad/v3/rc/domain-group/": {
			"description": "域名集配置相关操作",
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
					"domain-group"
				],
				"summary": "get all domain-group",
				"description": "获取域名集配置",
				"operationId": "get_domain_group_list",
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
						"$ref": "#/responses/operation_config_domain_group_list"
					}
				}
			},
			"post": {
				"tags": [
					"domain-group"
				],
				"summary": "create new domain-group",
				"description": "新建域名集配置",
				"operationId": "add_domain_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_group_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"domain-group"
				],
				"summary": "modify domain-group",
				"description": "修改域名集配置",
				"operationId": "edit_domain_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_group_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create  rc domain-group  domain1 domains [ *.2dbook.com *.twitch.com ]",
					"description": "新建域名集domain1，包含域名*.2dbook.com和*.twitch.com"
				},
				{
					"command": "modify rc domain-group domain1 name domain1 domains [ *.4tern.com  *.adorama.com ]",
					"description": "修改域名集domain1为domain2，包含域名*.4tern.com和*.adorama.com"
				},
				{
					"command": "delete rc domain-group  domain1",
					"description": "删除域名集domain1"
				},
				{
					"command": "list rc domain-group  domain1",
					"description": "查看域名集domain1"
				}
			]
		},
		"/api/ad/v3/rc/domain-group/{name}": {
			"description": "域名集配置相关配置",
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
					"domain-group"
				],
				"summary": "get specific domain-group",
				"description": "获取域名集配置",
				"operationId": "get_domain_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_group_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"domain-group"
				],
				"summary": "create new domain-group",
				"description": "新建域名集配置",
				"operationId": "create_domain_group",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_group_object"
					}
				}
			},
			"put": {
				"tags": [
					"domain-group"
				],
				"summary": "replace specific domain-group",
				"description": "修改域名集配置",
				"operationId": "replace_domain_group",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_group_object"
					}
				}
			},
			"patch": {
				"tags": [
					"domain-group"
				],
				"summary": "modify specific domain-group",
				"description": "修改域名集配置",
				"operationId": "edit_domain_group",
				"parameters": [
					{
						"$ref": "#/parameters/DOMAIN-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_group_object"
					}
				}
			},
			"delete": {
				"tags": [
					"domain-group"
				],
				"summary": "delete specific domain-group",
				"description": "删除域名集配置",
				"operationId": "delete_domain_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_domain_group_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DOMAIN-GROUP-CONFIG": {
			"name": "DOMAIN-GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.domain_group"
			}
		},
		"DOMAIN-GROUP-PROPERTY": {
			"name": "DOMAIN-GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.domain_group"
			}
		}
	},
	"responses": {
		"operation_config_domain_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.domain_group_list"
			}
		},
		"operation_config_domain_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.domain_group"
			}
		}
	},
	"definitions": {
		"config.domain_group_list": {
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
						"$ref": "#/definitions/config.domain_group"
					}
				}
			}
		},
		"config.domain_group": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；指定域名集的名称, 在配置中必须唯一。",
					"example": "ip_set_1"
				},
				"description": {
					"type": "string",
					"description": "可选参数；配置描述信息。"
				},
				"domains": {
					"type": "array",
					"description": "可选参数；指定域名列表。",
					"items": {
						"type": "string",
						"description": "Format: {IP} | {DOMAIN} | {HOST}",
						"example": "192.168.1.100"
					},
					"maxItems": 10000
				},
				"default": {
					"type": "string",
					"description": "合法输入为NON-DEFAULT、READONLY和MODIFIABLE",
					"title": "默认值",
					"readOnly": true,
					"enum": [
						"NON-DEFAULT",
						"READONLY",
						"MODIFIABLE"
					],
					"default": "NON-DEFAULT",
					"example": "READONLY"
				}
			}
		}
	}
}