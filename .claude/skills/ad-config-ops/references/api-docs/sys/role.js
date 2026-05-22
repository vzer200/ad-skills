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
		"/api/ad/v3/sys/role/": {
			"description": "新建、查看角色配置",
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
					"role"
				],
				"summary": "get all role",
				"description": "查看已有的角色配置",
				"operationId": "get_role_list",
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
						"$ref": "#/responses/operation_config_role_list"
					}
				}
			},
			"post": {
				"tags": [
					"role"
				],
				"summary": "create new role",
				"description": "新建角色配置",
				"operationId": "add_role_list",
				"parameters": [
					{
						"$ref": "#/parameters/ROLE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_role_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys role test access_type { web_console enable } permissions [ 用户管理权限 ]",
					"description": "新建一个登录方式为Web控制台、控制权限为用户管理权限的角色。"
				},
				{
					"command": "modify sys role test name test_1",
					"description": "修改test的角色的名称为test_1"
				},
				{
					"command": "list sys role test_1",
					"description": "查看当前角色配置信息"
				}
			]
		},
		"/api/ad/v3/sys/role/{name}": {
			"description": "新建、查看、修改、删除指定的角色配置",
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
					"role"
				],
				"summary": "get specific role",
				"description": "查看指定的角色配置",
				"operationId": "get_role",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_role_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"role"
				],
				"summary": "create new role",
				"description": "新建指定的角色配置",
				"operationId": "create_role",
				"parameters": [
					{
						"$ref": "#/parameters/ROLE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_role_object"
					}
				}
			},
			"put": {
				"tags": [
					"role"
				],
				"summary": "replace specific role",
				"description": "修改指定的角色配置",
				"operationId": "replace_role",
				"parameters": [
					{
						"$ref": "#/parameters/ROLE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_role_object"
					}
				}
			},
			"patch": {
				"tags": [
					"role"
				],
				"summary": "modify specific role",
				"description": "修改指定的角色配置",
				"operationId": "edit_role",
				"parameters": [
					{
						"$ref": "#/parameters/ROLE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_role_object"
					}
				}
			},
			"delete": {
				"tags": [
					"role"
				],
				"summary": "delete specific role",
				"description": "删除指定的角色配置",
				"operationId": "delete_role",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_role_object"
					}
				}
			}
		}
	},
	"parameters": {
		"ROLE-CONFIG": {
			"name": "ROLE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.role"
			}
		},
		"ROLE-PROPERTY": {
			"name": "ROLE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.role"
			}
		}
	},
	"responses": {
		"operation_config_role_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.role_list"
			}
		},
		"operation_config_role_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.role"
			}
		}
	},
	"definitions": {
		"config.role_list": {
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
						"$ref": "#/definitions/config.role"
					}
				}
			}
		},
		"config.role": {
			"type": "object",
			"required": [
				"name",
				"permissions"
			],
			"properties": {
				"name": {
					"description": "角色名称",
					"type": "string",
					"example": "admin"
				},
				"description": {
					"type": "string",
					"description": "附加描述信息",
					"example": "Super Administrator role"
				},
				"access_type": {
					"description": "访问权限",
					"type": "object",
					"properties": {
						"web_console": {
							"description": "web控制台登录权限",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"ssh_console": {
							"description": "命令行登录权限",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"restful_api": {
							"description": "api登录权限",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						}
					},
					"required": []
				},
				"access_control": {
					"description": "访问控制",
					"type": "object",
					"properties": {
						"state": {
							"description": "访问控制",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"permit_source_addresses": {
							"description": "允许的ip",
							"type": "array",
							"items": {
								"description": "放通ip",
								"type": "string",
								"example": "200.200.0.123/24"
							},
							"maxItems": 16,
							"minItems": 1
						}
					},
					"required": []
				},
				"permissions": {
					"type": "array",
					"description": "引用的权限信息",
					"items": {
						"description": "引用的权限模块",
						"type": "string",
						"example": "network-manager"
					},
					"example": [
						"network-manager",
						"system-manager",
						"application-manager"
					]
				},
				"default": {
					"type": "string",
					"description": "只读参数；是否为默认配置",
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