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
		"/api/ad/v3/dns/data-center/all/": {
			"description": "数据中心配置管理操作",
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
					"data-center"
				],
				"summary": "get all data-center",
				"description": "查看所有数据中心信息",
				"operationId": "get_data_center_list",
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
						"$ref": "#/responses/operation_config_data_center_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns data-center all",
					"description": "查看全部数据中心名称信息"
				}
			]
		},
		"/api/ad/v3/dns/data-center/all/{name}": {
			"description": "数据中心配置管理操作",
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
					"data-center"
				],
				"summary": "get specific data-center",
				"description": "查看指定已有数据中心全部属性",
				"operationId": "get_data_center",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns data-center all all_properties",
					"description": "查看全部数据中心的全部属性"
				}
			]
		},
		"/api/ad/v3/dns/data-center/remote/": {
			"description": "远端数据中心配置相关操作",
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
					"data-center"
				],
				"summary": "get all remote data-center",
				"description": "查看远端数据中心",
				"operationId": "get_data_center_remote_list",
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
						"$ref": "#/responses/operation_config_data_center_remote_list"
					}
				}
			},
			"post": {
				"tags": [
					"data-center"
				],
				"summary": "create new remote data-center",
				"description": "创建远端数据中心",
				"operationId": "add_data_center_remote_list",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-CENTER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_remote"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"data-center"
				],
				"summary": "modify remote data-center",
				"description": "修改远端数据中心",
				"operationId": "edit_data_center_remote_list",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-CENTER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_remote_list"
					}
				}
			}
		},
		"/api/ad/v3/dns/data-center/remote/{name}": {
			"description": "远端数据中心配置相关操作",
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
					"data-center"
				],
				"summary": "get specific remote data-center",
				"description": "查看指定已有的远端数据中心",
				"operationId": "get_data_center_remote",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_remote"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"data-center"
				],
				"summary": "create new data-center",
				"description": "创建远端数据中心",
				"operationId": "create_data_center_remote",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-CENTER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_remote"
					}
				}
			},
			"put": {
				"tags": [
					"data-center"
				],
				"summary": "replace specific data-center",
				"description": "修改指定已有的远端数据中心",
				"operationId": "replace_data_center_remote",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-CENTER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_remote"
					}
				}
			},
			"patch": {
				"tags": [
					"data-center"
				],
				"summary": "modify specific data-center",
				"description": "增量修改指定已有的远端数据中心",
				"operationId": "edit_data_center_remote",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-CENTER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_remote"
					}
				}
			},
			"delete": {
				"tags": [
					"data-center"
				],
				"summary": "delete specific data-center",
				"description": "删除指定已有的远端数据中心",
				"operationId": "delete_data_center_remote",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_remote"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns data-center remote data_center_remote",
					"description": "查看远端数据中心信息 名称为：data_center_remote"
				},
				{
					"command": "create dns data-center remote test_data_center_remote description create_remote port 558 site remote addresses add [ 192.3.6.5 ]",
					"description": "创建远端数据中心 名称为：test_data_center_remote 端口：585 站点为：remote 地址：192.3.6.5"
				},
				{
					"command": "modify dns data-center remote test_data_center_remote name new_data_center_remote description modify_data_center site remote port 585 addresses add [ 18.9.6.5 ]",
					"description": "修改远端数据中心信息 修改前名称：test_data_center_remote 修改后名称为：new_data_center_remote 新增地址：18.9.6.5"
				},
				{
					"command": "delete dns data-center remote new_data_center_remote",
					"description": "删除远端数据中心信息 名称为：new_data_center_remote"
				}
			]
		},
		"/api/ad/v3/dns/data-center/local": {
			"description": "本地数据中心配置相关操作",
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
					"data-center"
				],
				"summary": "get local data-center",
				"description": "查看本地数据中心信息",
				"operationId": "get_locs_data_center",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_local"
					}
				}
			},
			"put": {
				"tags": [
					"data-center"
				],
				"summary": "replace local data-center",
				"description": "修改本地数据中心信息",
				"operationId": "replace_local_data_center",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-CENTER-CONFIG-LOCAL"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_local"
					}
				}
			},
			"patch": {
				"tags": [
					"data-center"
				],
				"summary": "modify local data-center",
				"description": "增量修改本地数据中心信息",
				"operationId": "edit_data_center",
				"parameters": [
					{
						"$ref": "#/parameters/DATA-CENTER-PROPERTY-LOCAL"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_data_center_local"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns data-center local all_properties",
					"description": "查看本地数据中心全部信息"
				},
				{
					"command": "modify dns data-center local name new_local description modify_local addresses add [ 192.3.6.5 ] port 163 site local common_difference 5 control_role master-and-slave  shared_secret 12345678",
					"description": "修改本地数据中心信息 修改前名称：localhost 修改后名称为：new_local 新增地址：192.3.6.5"
				}
			]
		}
	},
	"parameters": {
		"DATA-CENTER-CONFIG": {
			"name": "DATA-CENTER-CONFIG",
			"in": "body",
			"required": true,
			"description": "远端数据中心配置",
			"schema": {
				"$ref": "#/definitions/config.data_center_remote"
			}
		},
		"DATA-CENTER-PROPERTY": {
			"name": "DATA-CENTER-PROPERTY",
			"in": "body",
			"required": true,
			"description": "远端数据中心配置属性",
			"schema": {
				"$ref": "#/definitions/config.data_center_remote"
			}
		},
		"DATA-CENTER-CONFIG-LOCAL": {
			"name": "DATA-CENTER-CONFIG",
			"in": "body",
			"required": true,
			"description": "本地数据中心配置",
			"schema": {
				"$ref": "#/definitions/config.data_center_local"
			}
		},
		"DATA-CENTER-PROPERTY-LOCAL": {
			"name": "DATA-CENTER-PROPERTY",
			"in": "body",
			"required": true,
			"description": "本地数据中心属性",
			"schema": {
				"$ref": "#/definitions/config.data_center_local"
			}
		}
	},
	"responses": {
		"operation_config_data_center_remote_list": {
			"description": "远端数据中心配置列表",
			"schema": {
				"$ref": "#/definitions/config.data_center_remote_list"
			}
		},
		"operation_config_data_center_remote": {
			"description": "远端数据中心配置对象",
			"schema": {
				"$ref": "#/definitions/config.data_center_remote"
			}
		},
		"operation_config_data_center_local": {
			"description": "本地数据中心信息",
			"schema": {
				"$ref": "#/definitions/config.data_center_local"
			}
		},
		"operation_config_data_center_list": {
			"description": "全部数据中心配置列表",
			"schema": {
				"$ref": "#/definitions/config.data_center_list"
			}
		},
		"operation_config_data_center": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.data_center"
			}
		}
	},
	"definitions": {
		"config.data_center_remote_list": {
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
						"$ref": "#/definitions/config.data_center_remote"
					}
				}
			}
		},
		"config.data_center_remote": {
			"type": "object",
			"required": [
				"name",
				"addresses"
			],
			"properties": {
				"name": {
					"description": "远端数据中心名称，必须唯一",
					"type": "string",
					"example": "remote"
				},
				"description": {
					"description": "远端数据中心描述信息",
					"type": "string",
					"example": "Shenzhen - Nanshan"
				},
				"site": {
					"description": "远端数据中心站点信息，默认且必须为REMOTE",
					"type": "string",
					"enum": [
						"REMOTE"
					],
					"default": "REMOTE"
				},
				"addresses": {
					"type": "array",
					"description": "远端数据中心地址列表",
					"items": {
						"description": "远端数据中心IP地址",
						"type": "string",
						"example": "200.200.1.1"
					},
					"minItems": 1,
					"maxItems": 16
				},
				"port": {
					"description": "远端数据中心端口",
					"type": "integer",
					"default": 558,
					"example": 558,
					"minimum": 1,
					"maximum": 65535
				}
			}
		},
		"config.data_center_local": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "本地数据中心名称，只可以建立一个",
					"type": "string",
					"example": "localhost"
				},
				"description": {
					"description": "本地数据中心描述信息",
					"type": "string",
					"example": "Shenzhen - Nanshan"
				},
				"site": {
					"description": "本地数据中心站点信息，默认且必须为LOCAL",
					"type": "string",
					"enum": [
						"LOCAL"
					],
					"default": "LOCAL"
				},
				"addresses": {
					"type": "array",
					"description": "本地数据中心地址列表",
					"items": {
						"description": "本地数据中心IP地址，必须在链路上",
						"type": "object",
						"properties": {
							"inner_ip": {
								"description": "链路IP",
								"type": "string"
							},
							"internet_ip": {
								"description": "公网IP",
								"type": "string"
							}
						}
					},
					"minItems": 0,
					"maxItems": 16
				},
				"port": {
					"description": "本地数据中心端口，默认558",
					"type": "integer",
					"default": 558,
					"example": 558,
					"minimum": 1,
					"maximum": 65535
				},
				"control_role": {
					"description": "本地数据中心控制角色，默认不同步",
					"type": "string",
					"enum": [
						"ISOLATE",
						"MASTER",
						"SLAVE",
						"MASTER-AND-SLAVE"
					],
					"default": "ISOLATE"
				},
				"common_difference": {
					"description": "同步公差，默认为5",
					"type": "integer",
					"default": 5,
					"example": 5,
					"minimum": 0,
					"maximum": 43200
				},
				"shared_secret": {
					"description": "加密秘钥，只写",
					"type": "string",
					"writeOnly": true,
					"example": "",
					"minLength": 8,
					"maxLength": 64
				},
				"pk_shared_secret": {
					"description": "加密后的加密密钥，最大长度4096",
					"type": "string",
					"maxLength": 4096
				},
				"encrypted_shared_secret": {
					"description": "加密后的秘钥",
					"type": "string",
					"example": "A1B2C3D4",
					"maxLength": 4096
				}
			}
		},
		"config.data_center_list": {
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
						"$ref": "#/definitions/config.data_center"
					}
				}
			}
		},
		"config.data_center": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "数据中心名称",
					"type": "string",
					"example": "localhost"
				},
				"description": {
					"description": "数据中心描述信息",
					"type": "string",
					"example": "Shenzhen - Nanshan"
				},
				"site": {
					"description": "站点信息，本地还是远端",
					"type": "string",
					"enum": [
						"LOCAL",
						"REMOTE"
					],
					"example": "REMOTE"
				},
				"addresses": {
					"description": "数据中心IP地址列表",
					"type": "array",
					"items": {
						"type": "string",
						"example": "200.200.1.1"
					}
				},
				"port": {
					"description": "数据中心端口",
					"type": "integer",
					"default": 558,
					"example": 558
				},
				"control_role": {
					"description": "数据中心同步角色，默认不同步",
					"type": "string",
					"enum": [
						"ISOLATE",
						"MASTER",
						"SLAVE",
						"MASTER-AND-SLAVE"
					],
					"default": "ISOLATE"
				},
				"common_difference": {
					"description": "数据中心同步公差，默认5",
					"type": "integer",
					"default": 5,
					"example": 5
				},
				"shared_secret": {
					"description": "数据中心加密秘钥",
					"type": "string",
					"example": ""
				}
			}
		}
	}
}