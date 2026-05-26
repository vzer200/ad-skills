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
		"/api/ad/v3/sys/project/": {
			"description": "新建、查看项目配置",
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
					"project"
				],
				"summary": "get all project",
				"description": "查看已有的项目配置",
				"operationId": "get_project_list",
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
						"$ref": "#/responses/operation_config_project_list"
					}
				}
			},
			"post": {
				"tags": [
					"project"
				],
				"summary": "create new project",
				"description": "新建项目配置",
				"operationId": "add_project_list",
				"parameters": [
					{
						"$ref": "#/parameters/PROJECT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_project_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys project test vlan_range [ 1-5 ] vxlan_range [ 1-5 ]",
					"description": "新建一个名称为test的项目，vlan_range 范围为1-5， vxlan_range 范围为1-5"
				},
				{
					"command": "modify sys project test vlan_range [ 6-8 ]",
					"description": "修改test的vlan_range 范围为6-8"
				},
				{
					"command": "list sys project test",
					"description": "查看项目test的配置信息"
				}
			]
		},
		"/api/ad/v3/sys/project/{name}": {
			"description": "新建、查看、修改、删除指定的项目配置",
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
					"project"
				],
				"summary": "get specific project",
				"description": "查看指定的项目配置",
				"operationId": "get_project",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_project_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"project"
				],
				"summary": "create new project",
				"description": "新建指定的项目配置",
				"operationId": "create_project",
				"parameters": [
					{
						"$ref": "#/parameters/PROJECT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_project_object"
					}
				}
			},
			"put": {
				"tags": [
					"project"
				],
				"summary": "replace specific project",
				"description": "修改指定的项目配置",
				"operationId": "replace_project",
				"parameters": [
					{
						"$ref": "#/parameters/PROJECT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_project_object"
					}
				}
			},
			"patch": {
				"tags": [
					"project"
				],
				"summary": "modify specific project",
				"description": "修改指定的项目配置",
				"operationId": "edit_project",
				"parameters": [
					{
						"$ref": "#/parameters/PROJECT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_project_object"
					}
				}
			},
			"delete": {
				"tags": [
					"project"
				],
				"summary": "delete specific project",
				"description": "删除指定的项目配置",
				"operationId": "delete_project",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_project_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PROJECT-CONFIG": {
			"name": "PROJECT-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.project"
			}
		},
		"PROJECT-PROPERTY": {
			"name": "PROJECT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.project"
			}
		}
	},
	"responses": {
		"operation_config_project_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.project_list"
			}
		},
		"operation_config_project_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.project"
			}
		}
	},
	"definitions": {
		"config.project_list": {
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
						"$ref": "#/definitions/config.project"
					}
				}
			}
		},
		"config.project": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "名称(name)字段长度限制为1-63个字符, 不能含有 * | ' , % < > / \\特殊字符!",
					"type": "string",
					"maxLength": 511,
					"minLength": 1,
					"example": "myproject"
				},
				"description": {
					"type": "string",
					"description": "描述信息",
					"example": "this project belongs to someone",
					"default": "this is description"
				},
				"vlan_range": {
					"description": "vlan 的范围",
					"type": "array",
					"items": {
						"description": "sysns vlan range provider",
						"type": "string"
					},
					"maximum": 16,
					"minimum": 1,
					"example": [
						"2-88",
						"100"
					]
				},
				"vxlan_range": {
					"description": "vxlan 的范围",
					"type": "array",
					"items": {
						"description": "sysns vxlan range provider",
						"type": "string"
					},
					"maximum": 16,
					"minimum": 1,
					"example": [
						"2-88",
						"100"
					]
				},
				"flat_state": {
					"description": "switch of flat syswork",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"netns_limit": {
					"description": "当前项目可新建netns的数量",
					"type": "integer",
					"maximum": 2000,
					"minimum": 0,
					"example": 6
				},
				"new_conns_limit": {
					"description": "当前项目可新建连接的上限",
					"type": "integer",
					"minimum": 0,
					"example": 6
				},
				"cur_conns_limit": {
					"description": "当前项目并发连接的上限",
					"type": "integer",
					"minimum": 0,
					"example": 6
				},
				"throughput_limit": {
					"description": "Mbps by default",
					"type": "integer",
					"minimum": 0,
					"example": 6
				}
			}
		}
	}
}