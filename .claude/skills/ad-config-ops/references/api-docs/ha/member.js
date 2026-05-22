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
		"/api/ad/v3/ha/member/": {
			"description": "集群成员配置相关操作",
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
					"member"
				],
				"summary": "get all member",
				"description": "获取集群全部成员",
				"operationId": "get_member_list",
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
						"$ref": "#/responses/operation_config_member_list"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"member"
				],
				"summary": "modify member",
				"description": "修改集群成员配置",
				"operationId": "edit_member_list",
				"parameters": [
					{
						"$ref": "#/parameters/MEMBER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_list"
					}
				}
			}
		},
		"/api/ad/v3/ha/member/{name}": {
			"description": "指定集群成员配置相关操作",
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
					"member"
				],
				"summary": "get specific member",
				"description": "获取指定集群成员配置",
				"operationId": "get_member",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_object"
					}
				}
			},
			"patch": {
				"tags": [
					"member"
				],
				"summary": "修改指定集群成员配置",
				"description": "The PATCH method updates specific properties of one config.",
				"operationId": "edit_member",
				"parameters": [
					{
						"$ref": "#/parameters/MEMBER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_object"
					}
				}
			},
			"delete": {
				"tags": [
					"member"
				],
				"summary": "删除指定集群成员配置",
				"description": "",
				"operationId": "delete_member",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/VERIFY-OPERATOR"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_member_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha member",
					"description": "获取全部集群成员配置"
				},
				{
					"command": "list ha member dev_A",
					"description": "获取指定成员dev_A配置"
				},
				{
					"command": "modify ha member dev_A name dev_AA",
					"description": "修改成员dev_A的名称为dev_AA"
				},
				{
					"command": "modify ha member dev_B state disable username admin password admin",
					"description": "禁用成员dev_B"
				},
				{
					"command": "delete ha member dev_B username admin password admin",
					"description": "删除成员dev_B"
				}
			]
		}
	},
	"parameters": {
		"MEMBER-CONFIG": {
			"name": "MEMBER-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.member"
			}
		},
		"MEMBER-PROPERTY": {
			"name": "MEMBER-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.member"
			}
		}
	},
	"responses": {
		"operation_config_member_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.member_list"
			}
		},
		"operation_config_member_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.member"
			}
		}
	},
	"definitions": {
		"config.member_list": {
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
						"$ref": "#/definitions/config.member"
					}
				}
			}
		},
		"config.member": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "指定成员的名称，在集群成员列表中必须唯一",
					"type": "string",
					"example": "ad_2",
					"maxLength": 63,
					"minLength": 1
				},
				"description": {
					"description": "成员的描述",
					"type": "string"
				},
				"state": {
					"description": "成员的启禁用状态，enable 表示启用，disable 表示禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"ha": {
					"description": "主心跳口相关配置，此处为只读字段",
					"type": "object",
					"readOnly": true,
					"required": [
						"interface",
						"address"
					],
					"properties": {
						"interface": {
							"description": "网口信息",
							"type": "object",
							"readOnly": true,
							"properties": {
								"type": {
									"description": "网口类型",
									"type": "string",
									"enum": [
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE",
										"MACVLAN"
									],
									"example": "VLAN"
								},
								"interface": {
									"description": "网口名字",
									"type": "string",
									"example": "bond-134"
								}
							}
						},
						"address": {
							"description": "主心跳口地址，必须为IP/掩码格式",
							"type": "string",
							"readOnly": true,
							"example": "10.0.1.2/24"
						},
						"gateway": {
							"type": "string",
							"description": "主心跳口网关",
							"readOnly": true,
							"example": "10.0.1.100"
						}
					}
				},
				"alternate_ha": {
					"description": "备心跳口相关配置，此处为只读字段",
					"type": "object",
					"readOnly": true,
					"required": [
						"interface",
						"address"
					],
					"properties": {
						"interface": {
							"description": "网口信息",
							"type": "object",
							"readOnly": true,
							"properties": {
								"type": {
									"description": "网口类型",
									"type": "string",
									"enum": [
										"MACVLAN",
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE"
									],
									"example": "VLAN"
								},
								"interface": {
									"description": "网口名字",
									"type": "string",
									"example": "bond-134"
								}
							}
						},
						"address": {
							"description": "备心跳口地址，必须为IP/掩码格式",
							"type": "string",
							"readOnly": true,
							"example": "200.0.0.2/24"
						},
						"gateway": {
							"description": "备心跳口网关",
							"type": "string",
							"readOnly": true,
							"example": "200.0.0.100"
						}
					}
				},
				"username": {
					"type": "string",
					"description": "禁用成员和删除成员时的权限校验，请填写具有高可用权限用户的用户名",
					"example": "admin",
					"writeOnly": true
				},
				"password": {
					"type": "string",
					"description": "禁用成员和删除成员时的权限校验，请填写具有高可用权限用户的用户密码",
					"writeOnly": true,
					"example": "admin"
				},
				"pk_password": {
					"description": "禁用成员和删除成员时的权限校验，请填写具有高可用权限用户的加密用户密码",
					"type": "string",
					"writeOnly": true
				},
				"weight_in_diff_platform": {
					"description": "异构集群中本地设备的权重",
					"type": "integer",
					"default": 1,
					"maximum": 100,
					"minimum": 1,
					"example": 10
				}
			}
		}
	}
}