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
		"/api/ad/v3/sys/permission/": {
			"description": "新建、查看用户角色权限配置",
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
					"permission"
				],
				"summary": "get all permission",
				"description": "查看已有的用户角色权限配置",
				"operationId": "get_permission_list",
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
						"$ref": "#/responses/operation_config_permission_list"
					}
				}
			},
			"post": {
				"tags": [
					"permission"
				],
				"summary": "create new permission",
				"description": "新建用户角色权限配置",
				"operationId": "add_permission_list",
				"parameters": [
					{
						"$ref": "#/parameters/PERMISSION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_permission_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create sys permission test permissions [ { api_path /sys/time get enable } ] description test",
					"description": "新建一种名称为test的用户角色可选权限，该权限api路径为/sys/time, 只允许http GET方法"
				},
				{
					"command": "modify sys permission test permissions add [ { api_path /sys/user patch disable } ]",
					"description": "修改test的权限配置，增添对api路径/sys/user的控制权限"
				},
				{
					"command": "list sys permission test",
					"description": "查看当前test权限的配置信息"
				}
			]
		},
		"/api/ad/v3/sys/permission/{name}": {
			"description": "新建、查看、修改、删除指定的用户角色权限配置",
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
					"permission"
				],
				"summary": "get specific permission",
				"description": "查看指定的用户角色权限配置",
				"operationId": "get_permission",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_permission_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"permission"
				],
				"summary": "create new permission",
				"description": "新建指定的用户角色权限配置",
				"operationId": "create_permission",
				"parameters": [
					{
						"$ref": "#/parameters/PERMISSION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_permission_object"
					}
				}
			},
			"put": {
				"tags": [
					"permission"
				],
				"summary": "replace specific permission",
				"description": "修改指定的用户角色权限配置",
				"operationId": "replace_permission",
				"parameters": [
					{
						"$ref": "#/parameters/PERMISSION-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_permission_object"
					}
				}
			},
			"patch": {
				"tags": [
					"permission"
				],
				"summary": "modify specific permission",
				"description": "修改指定的用户角色权限配置",
				"operationId": "edit_permission",
				"parameters": [
					{
						"$ref": "#/parameters/PERMISSION-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_permission_object"
					}
				}
			},
			"delete": {
				"tags": [
					"permission"
				],
				"summary": "delete specific permission",
				"description": "删除指定的用户角色权限配置",
				"operationId": "delete_permission",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_permission_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PERMISSION-CONFIG": {
			"name": "PERMISSION-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.permission"
			}
		},
		"PERMISSION-PROPERTY": {
			"name": "PERMISSION-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.permission"
			}
		}
	},
	"responses": {
		"operation_config_permission_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.permission_list"
			}
		},
		"operation_config_permission_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.permission"
			}
		}
	},
	"definitions": {
		"config.permission_list": {
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
						"$ref": "#/definitions/config.permission"
					}
				}
			}
		},
		"config.permission": {
			"type": "object",
			"required": [
				"name",
				"permissions"
			],
			"properties": {
				"name": {
					"description": "名称",
					"type": "string",
					"example": "network manage permission"
				},
				"description": {
					"type": "string",
					"description": "附加的描述信息",
					"example": ""
				},
				"permissions": {
					"type": "array",
					"description": "权限详细信息",
					"items": {
						"description": "对各api的权限设置",
						"type": "object",
						"required": [
							"api_path"
						],
						"properties": {
							"api_path": {
								"description": "api路径",
								"type": "string",
								"example": "/api/slb/pool"
							},
							"get": {
								"description": "get接口权限",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "ENABLE",
								"example": "ENABLE"
							},
							"post": {
								"description": "post接口权限",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "ENABLE",
								"example": "ENABLE"
							},
							"put": {
								"description": "put接口权限",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "ENABLE",
								"example": "ENABLE"
							},
							"patch": {
								"description": "patch接口权限",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "ENABLE",
								"example": "ENABLE"
							},
							"delete": {
								"description": "delete接口权限",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "ENABLE",
								"example": "ENABLE"
							}
						}
					}
				}
			}
		}
	}
}