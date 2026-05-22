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
		"/api/ad/v3/ha/member-group/": {
			"description": "设备组配置相关操作",
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
					"member-group"
				],
				"summary": "get all member-group",
				"description": "获取所有设备组配置",
				"operationId": "get_member_group_list",
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
						"$ref": "#/responses/operation_config_member_group_list"
					}
				}
			},
			"post": {
				"tags": [
					"member-group"
				],
				"summary": "create new member-group",
				"description": "新建设备组配置",
				"operationId": "add_member_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/MEMBER-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_group_list"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"member-group"
				],
				"summary": "modify member-group",
				"description": "修改设备组配置",
				"operationId": "edit_member_group_list",
				"parameters": [
					{
						"$ref": "#/parameters/MEMBER-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_group_list"
					}
				}
			}
		},
		"/api/ad/v3/ha/member-group/{name}": {
			"description": "指定设备组配置相关操作",
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
					"member-group"
				],
				"summary": "get specific member-group",
				"description": "获取指定设备组配置",
				"operationId": "get_member_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_group_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"member-group"
				],
				"summary": "create new member-group",
				"description": "新建设备组配置",
				"operationId": "create_member_group",
				"parameters": [
					{
						"$ref": "#/parameters/MEMBER-GROUP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_group_object"
					}
				}
			},
			"patch": {
				"tags": [
					"member-group"
				],
				"summary": "modify specific member-group",
				"description": "修改指定设备组配置",
				"operationId": "edit_member_group",
				"parameters": [
					{
						"$ref": "#/parameters/MEMBER-GROUP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_group_object"
					}
				}
			},
			"delete": {
				"tags": [
					"member-group"
				],
				"summary": "删除指定设备组",
				"description": "",
				"operationId": "delete_member_group",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_group_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha member-group",
					"description": "获取全部设备组配置"
				},
				{
					"command": "list ha member-group group1",
					"description": "获取指定设备组group1配置"
				},
				{
					"command": "create ha member-group group1 members [ dev_A ]",
					"description": "创建名称为group1的虚拟服务，组内成员列表为dev_A"
				},
				{
					"command": "modify ha member-group group1 members [ dev_A dev_B ]",
					"description": "修改设备组group1的组内成员为dev_A、dev_B"
				},
				{
					"command": "delete ha member-group group1",
					"description": "删除设备组group1"
				}
			]
		}
	},
	"parameters": {
		"MEMBER-GROUP-CONFIG": {
			"name": "MEMBER-GROUP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.member_group"
			}
		},
		"MEMBER-GROUP-PROPERTY": {
			"name": "MEMBER-GROUP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.member_group"
			}
		}
	},
	"responses": {
		"operation_config_member_group_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.member_group_list"
			}
		},
		"operation_config_member_group_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.member_group"
			}
		}
	},
	"definitions": {
		"config.member_group_list": {
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
					"description": "当前项目列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.member_group"
					}
				}
			}
		},
		"config.member_group": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "指定设备组的名称，在设备组配置中必须唯一",
					"type": "string",
					"example": "default_member_group"
				},
				"description": {
					"description": "可以对该设备组进行额外的信息补充",
					"type": "string"
				},
				"members": {
					"description": "该设备组内设备列表",
					"type": "array",
					"items": {
						"description": "设备组内设备",
						"type": "string",
						"example": "ad_1"
					},
					"example": [
						"ad_ssloffload_1",
						"ad_ssloffload_2",
						"ad_dns_1",
						"ad_dns_2"
					],
					"maxItems": 16
				}
			}
		}
	}
}