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
		"/api/ad/v3/slb/access-control-profile/": {
			"description": "新建、查看应用访问控制策略配置",
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
					"access-control-profile"
				],
				"summary": "get all access-control-profile",
				"description": "查看当前已有的应用访问控制策略配置信息",
				"operationId": "get_access_control_profile_list",
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
						"$ref": "#/responses/operation_config_access_control_profile_list"
					}
				}
			},
			"post": {
				"tags": [
					"access-control-profile"
				],
				"summary": "create new access-control-profile",
				"description": "新建一个应用访问控制策略配置",
				"operationId": "add_access_control_profile_list",
				"parameters": [
					{
						"$ref": "#/parameters/ACCESS-CONTROL-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_access_control_profile_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb access-control-profile acprofile virtual_service yyyy rule add [ { users [ user1 user2 ] uri /index.html } { users [ user3 user4 ] uri /index.html2 } ] pool pool1 state enable",
					"description": "新建应用访问控制策略acprofile，针对虚拟服务yyyy,允许用户user1和user2访问/index.html，user3和user4访问/index.html2，后端服务器组为pool。"
				},
				{
					"command": "modify slb access-control-profile acprofile state disable",
					"description": "禁用应用访问控制策略acprofile。"
				},
				{
					"command": "list slb access-control-profile acprofile",
					"description": "查看应用访问控制策略acprofile。"
				},
				{
					"command": "delete slb access-control-profile acprofile",
					"description": "删除应用访问控制策略acprofile。"
				}
			]
		},
		"/api/ad/v3/slb/access-control-profile/{name}": {
			"description": "新建、查看、修改、删除指定的应用访问控制策略配置",
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
					"access-control-profile"
				],
				"summary": "get specific access-control-profile",
				"description": "查看指定的应用访问控制策略配置",
				"operationId": "get_access_control_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_access_control_profile_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"access-control-profile"
				],
				"summary": "create new access-control-profile",
				"description": "新建指定的应用访问控制策略配置",
				"operationId": "create_access_control_profile",
				"parameters": [
					{
						"$ref": "#/parameters/ACCESS-CONTROL-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_access_control_profile_object"
					}
				}
			},
			"put": {
				"tags": [
					"access-control-profile"
				],
				"summary": "replace specific access-control-profile",
				"description": "修改指定的应用访问控制策略配置",
				"operationId": "replace_access_control_profile",
				"parameters": [
					{
						"$ref": "#/parameters/ACCESS-CONTROL-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_access_control_profile_object"
					}
				}
			},
			"patch": {
				"tags": [
					"access-control-profile"
				],
				"summary": "modify specific access-control-profile",
				"description": "修改指定的应用访问控制策略配置",
				"operationId": "edit_access_control_profile",
				"parameters": [
					{
						"$ref": "#/parameters/ACCESS-CONTROL-PROFILE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_access_control_profile_object"
					}
				}
			},
			"delete": {
				"tags": [
					"access-control-profile"
				],
				"summary": "delete specific access-control-profile",
				"description": "删除指定的应用访问控制策略配置",
				"operationId": "delete_access_control_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_access_control_profile_object"
					}
				}
			}
		}
	},
	"parameters": {
		"ACCESS-CONTROL-PROFILE-CONFIG": {
			"name": "ACCESS-CONTROL-PROFILE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.access_control_profile"
			}
		},
		"ACCESS-CONTROL-PROFILE-PROPERTY": {
			"name": "ACCESS-CONTROL-PROFILE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.access_control_profile"
			}
		}
	},
	"responses": {
		"operation_config_access_control_profile_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.access_control_profile_list"
			}
		},
		"operation_config_access_control_profile_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.access_control_profile"
			}
		}
	},
	"definitions": {
		"config.access_control_profile_list": {
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
						"$ref": "#/definitions/config.access_control_profile"
					}
				}
			}
		},
		"config.access_control_profile": {
			"type": "object",
			"required": [
				"name",
				"virtual_service",
				"rule",
				"pool"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定访问控制策略的名称, 在配置中必须唯一。",
					"type": "string"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"state": {
					"description": "可选参数；指定访问控制策略的状态，disable表示禁用，enable表示启用；默认enable。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"virtual_service": {
					"description": "必选参数；指定待控制的虚拟服务名称。",
					"type": "string"
				},
				"rule": {
					"description": "必选参数；指定访问控制的具体规则，该参数为对象列表，可通过add/delete进行添加/删除规则。",
					"type": "array",
					"items": {
						"description": "访问控制",
						"type": "object",
						"required": [
							"uri",
							"users"
						],
						"properties": {
							"uri": {
								"description": "必选参数；指定待控制的资源uri。",
								"type": "string",
								"example": "/index.html"
							},
							"users": {
								"description": "必选参数；指定允许访问的帐户列表，该参数为对象列表，可通过add/delete进行添加/删除规则。",
								"type": "array",
								"items": {
									"description": "访问控制引用的用户",
									"type": "string"
								}
							}
						}
					}
				},
				"pool": {
					"description": "可选参数；指定访问的节点池名称。",
					"type": "string"
				}
			}
		}
	}
}