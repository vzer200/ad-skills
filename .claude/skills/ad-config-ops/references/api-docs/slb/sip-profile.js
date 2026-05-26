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
		"/api/ad/v3/slb/sip-profile/": {
			"description": "新建、查看SIP策略配置",
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
					"sip-profile"
				],
				"summary": "get all sip-profile",
				"description": "查看当前已有的SIP策略配置信息",
				"operationId": "get_sip_profile_list",
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
						"$ref": "#/responses/operation_config_sip_profile_list"
					}
				}
			},
			"post": {
				"tags": [
					"sip-profile"
				],
				"summary": "create new sip-profile",
				"description": "新建一个SIP策略配置",
				"operationId": "add_sip_profile_list",
				"parameters": [
					{
						"$ref": "#/parameters/SIP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_sip_profile_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb sip-profile sip_profile_1",
					"description": "新建SIP策略sip_profile_1"
				},
				{
					"command": "modify slb sip-profile sip_profile_1 name sip_profile_2",
					"description": "修改SIP策略sip_profile_1名称为sip_profile_2"
				},
				{
					"command": "list slb sip-profile sip_profile_1",
					"description": "查看IP策略sip_profile_1的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/sip-profile/{name}": {
			"description": "新建、查看、修改、删除指定的SIP策略配置",
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
					"sip-profile"
				],
				"summary": "get specific sip-profile",
				"description": "查看指定的SIP策略配置",
				"operationId": "get_sip_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_sip_profile_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"sip-profile"
				],
				"summary": "create new sip-profile",
				"description": "新建指定的SIP策略配置",
				"operationId": "create_sip_profile",
				"parameters": [
					{
						"$ref": "#/parameters/SIP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_sip_profile_object"
					}
				}
			},
			"put": {
				"tags": [
					"sip-profile"
				],
				"summary": "replace specific sip-profile",
				"description": "修改指定的SIP策略配置",
				"operationId": "replace_sip_profile",
				"parameters": [
					{
						"$ref": "#/parameters/SIP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_sip_profile_object"
					}
				}
			},
			"patch": {
				"tags": [
					"sip-profile"
				],
				"summary": "modify specific sip-profile",
				"description": "修改指定的SIP策略配置",
				"operationId": "edit_sip_profile",
				"parameters": [
					{
						"$ref": "#/parameters/SIP-PROFILE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_sip_profile_object"
					}
				}
			},
			"delete": {
				"tags": [
					"sip-profile"
				],
				"summary": "delete specific sip-profile",
				"description": "删除指定的SIP策略配置",
				"operationId": "delete_sip_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_sip_profile_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SIP-PROFILE-CONFIG": {
			"name": "SIP-PROFILE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.sip_profile"
			}
		},
		"SIP-PROFILE-PROPERTY": {
			"name": "SIP-PROFILE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.sip_profile"
			}
		},
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"description": "config virtual service name",
			"required": true
		}
	},
	"responses": {
		"operation_config_sip_profile_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.sip_profile_list"
			}
		},
		"operation_config_sip_profile_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.sip_profile"
			}
		}
	},
	"definitions": {
		"config.sip_profile_list": {
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
						"$ref": "#/definitions/config.sip_profile"
					}
				}
			}
		},
		"config.sip_profile": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "SIP优化策略名称",
					"type": "string",
					"example": "sip_srcip_10m"
				},
				"description": {
					"type": "string",
					"description": "SIP优化策略描述信息"
				},
				"insert_record_route_header": {
					"description": "插入Record_Route头部启用或禁止",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"insert_via_header": {
					"description": "插入Via头部",
					"type": "string",
					"minLength": 0,
					"maxLength": 1023,
					"example": "to be filled"
				}
			}
		}
	}
}