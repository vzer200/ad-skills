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
		"/api/ad/v4/dns/zone/{dns_config_area}/tsig-key/": {
			"description": "TSIG密钥配置管理操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"tsig-key"
				],
				"summary": "get all tsig-key",
				"description": "查看TSIG密钥配置",
				"operationId": "get_tsig_key_list",
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
						"$ref": "#/responses/operation_config_tsig_key_list"
					}
				}
			},
			"post": {
				"tags": [
					"tsig-key"
				],
				"summary": "create new tsig-key",
				"description": "创建一个TSIG密钥",
				"operationId": "add_tsig_key_list",
				"parameters": [
					{
						"$ref": "#/parameters/TSIG-KEY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tsig_key_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local tsig-key",
					"description": "获取本地全部TSIG密钥配置"
				},
				{
					"command": "list dns zone local tsig-key fwe",
					"description": "获取本地指定TSIG密钥fwe配置"
				},
				{
					"command": "create  dns zone local tsig-key  \"fwe\" key \"lhRnpFnbLKoPnND7XHQGlqdpb5YJONakRUJp3GKxM7c\\=\" algorithm \"hmac-sha256\"",
					"description": "创建名称为fwe，密钥为lhRnpFnbLKoPnND7XHQGlqdpb5YJONakRUJp3GKxM7c\\=，算法为hmac-sha256的本地TSIG密钥配置"
				},
				{
					"command": "modify dns zone local tsig-key fwe key \"QRQ/yqspudOXaPScVzh6fIIuNThtGSB2+B+37C7J0rM=\"",
					"description": "修改本地TSIG密钥fwe的密钥值为QRQ/yqspudOXaPScVzh6fIIuNThtGSB2+B+37C7J0rM="
				},
				{
					"command": "delete dns zone local tsig-key fwe",
					"description": "删除本地TSIG配置fwe"
				}
			]
		},
		"/api/ad/v4/debug/dns/zone/{dns_config_area}/tsig-key/generate": {
			"description": "TSIG密钥配置管理操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/all_properties"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/select"
				},
				{
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"post": {
				"tags": [
					"tsig-key"
				],
				"summary": "generate tsig-key key",
				"description": "生成一个TSIG密钥",
				"operationId": "generate_tsig_key",
				"parameters": [
					{
						"$ref": "#/parameters/TSIG-KEY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tsig_key_object"
					}
				}
			}
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/tsig-key/{name}": {
			"description": "TSIG密钥配置管理操作",
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
				},
				{
					"$ref": "#/parameters/dns_config_area"
				}
			],
			"get": {
				"tags": [
					"tsig-key"
				],
				"summary": "get specific tsig-key",
				"description": "查看指定已有的TSIG密钥",
				"operationId": "get_tsig_key",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tsig_key_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"tsig-key"
				],
				"summary": "create new tsig-key",
				"description": "修改指定已有的TSIG密钥",
				"operationId": "create_tsig_key",
				"parameters": [
					{
						"$ref": "#/parameters/TSIG-KEY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tsig_key_object"
					}
				}
			},
			"put": {
				"tags": [
					"tsig-key"
				],
				"summary": "replace specific tsig-key",
				"description": "修改指定已有的TSIG密钥",
				"operationId": "replace_tsig_key",
				"parameters": [
					{
						"$ref": "#/parameters/TSIG-KEY-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tsig_key_object"
					}
				}
			},
			"patch": {
				"tags": [
					"tsig-key"
				],
				"summary": "modify specific tsig-key",
				"description": "增量修改指定已有的TSIG密钥",
				"operationId": "edit_tsig_key",
				"parameters": [
					{
						"$ref": "#/parameters/TSIG-KEY-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tsig_key_object"
					}
				}
			},
			"delete": {
				"tags": [
					"tsig-key"
				],
				"summary": "delete specific tsig-key",
				"description": "删除指定已有的TSIG密钥",
				"operationId": "delete_tsig_key",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_tsig_key_object"
					}
				}
			}
		}
	},
	"parameters": {
		"TSIG-KEY-CONFIG": {
			"name": "TSIG-KEY-CONFIG",
			"in": "body",
			"required": true,
			"description": "TSIG密钥配置",
			"schema": {
				"$ref": "#/definitions/config.tsig_key"
			}
		},
		"TSIG-KEY-PROPERTY": {
			"name": "TSIG-KEY-PROPERTY",
			"in": "body",
			"required": true,
			"description": "TSIG密钥属性",
			"schema": {
				"$ref": "#/definitions/config.tsig_key"
			}
		},
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "全局和本地区域",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_config_tsig_key_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tsig_key_list"
			}
		},
		"operation_config_tsig_key_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.tsig_key"
			}
		}
	},
	"definitions": {
		"config.tsig_key_list": {
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
						"$ref": "#/definitions/config.tsig_key"
					}
				}
			}
		},
		"config.tsig_key": {
			"type": "object",
			"required": [
				"name",
				"key"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "格式限制和记录的domain校验相同，但长度限制为200",
					"example": "tsigkey-1"
				},
				"algorithm": {
					"type": "string",
					"description": "加密算法。",
					"enum": [
						"HMAC-MD5",
						"HMAC-SHA1",
						"HMAC-SHA256",
						"HMAC-SHA384",
						"HMAC-SHA512"
					],
					"default": "HMAC-SHA256",
					"example": "HMAC-SHA256"
				},
				"key": {
					"type": "string",
					"description": "加密密钥，可点击按钮自动生成多次。",
					"minLength": 1,
					"maxLength": 10000
				}
			}
		}
	}
}