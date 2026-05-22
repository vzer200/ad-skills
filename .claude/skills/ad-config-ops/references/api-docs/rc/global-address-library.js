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
		"/api/ad/v3/rc/global-address-library/": {
			"description": "全球地址库配置相关操作",
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
					"global-address-library"
				],
				"summary": "get all global-address-library region",
				"description": "获取全球地址库配置",
				"operationId": "get_global_address_library_region_list",
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
						"$ref": "#/responses/operation_config_global_address_library_region_list"
					}
				}
			}
		},
		"/api/ad/v3/rc/global-address-library/{region}": {
			"description": "全球地址库配置相关操作",
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
					"$ref": "#/parameters/region"
				}
			],
			"get": {
				"tags": [
					"global-address-library"
				],
				"summary": "get specific global-address-library region",
				"description": "获取全球地址库配置",
				"operationId": "get_global_address_library_region",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_global_address_library_region_object"
					}
				}
			}
		},
		"/api/ad/v3/rc/global-address-library/{region}/countries/": {
			"description": "全球地址库配置相关操作",
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
					"$ref": "#/parameters/region"
				}
			],
			"get": {
				"tags": [
					"global-address-library"
				],
				"summary": "get all global-address-library country",
				"description": "获取全球地址库配置",
				"operationId": "get_global_address_library_country_list",
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
						"$ref": "#/responses/operation_config_global_address_library_country_list"
					}
				}
			}
		},
		"/api/ad/v3/rc/global-address-library/{region}/countries/{country}": {
			"description": "全球地址库配置相关操作",
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
					"$ref": "#/parameters/region"
				},
				{
					"$ref": "#/parameters/country"
				}
			],
			"get": {
				"tags": [
					"global-address-library"
				],
				"summary": "get specific global-address-library country",
				"description": "获取全球地址库配置",
				"operationId": "get_global_address_library_country",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_global_address_library_country_object"
					}
				}
			}
		},
		"/api/ad/v3/rc/global-address-library/{region}/countries/{country}/cities/": {
			"description": "全球地址库配置相关操作",
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
					"$ref": "#/parameters/region"
				},
				{
					"$ref": "#/parameters/country"
				}
			],
			"get": {
				"tags": [
					"global-address-library"
				],
				"summary": "get all global-address-library country",
				"description": "获取全球地址库配置",
				"operationId": "get_global_address_library_country_list",
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
						"$ref": "#/responses/operation_config_global_address_library_city_list"
					}
				}
			}
		},
		"/api/ad/v3/rc/global-address-library/{region}/countries/{country}/cities/{city}": {
			"description": "全球地址库配置相关操作",
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
					"$ref": "#/parameters/region"
				},
				{
					"$ref": "#/parameters/country"
				},
				{
					"$ref": "#/parameters/city"
				}
			],
			"get": {
				"tags": [
					"global-address-library"
				],
				"summary": "get specific global-address-library city",
				"description": "获取全球地址库配置",
				"operationId": "get_global_address_library_city",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_global_address_library_city_object"
					}
				}
			}
		}
	},
	"parameters": {
		"region": {
			"name": "region",
			"in": "path",
			"required": true,
			"type": "string",
			"enum": [
				"ASIA-PACIFIC",
				"LATIN-AMERICA",
				"NORTHERN-AMERICA",
				"AFRICA",
				"EUROPE"
			]
		},
		"country": {
			"name": "country",
			"in": "path",
			"required": true,
			"type": "string"
		},
		"city": {
			"name": "city",
			"in": "path",
			"required": true,
			"type": "string"
		}
	},
	"responses": {
		"operation_config_global_address_library_region_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.global_address_library_region_list"
			}
		},
		"operation_config_global_address_library_region_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.global_address_library_region"
			}
		},
		"operation_config_global_address_library_country_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.global_address_library_country_list"
			}
		},
		"operation_config_global_address_library_country_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.global_address_library_country"
			}
		},
		"operation_config_global_address_library_city_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.global_address_library_city_list"
			}
		},
		"operation_config_global_address_library_city_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.global_address_library_city"
			}
		}
	},
	"definitions": {
		"config.global_address_library_region_list": {
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
						"$ref": "#/definitions/config.global_address_library_region"
					}
				}
			}
		},
		"config.global_address_library_region": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "全球地址集区域名称",
					"type": "string",
					"enum": [
						"ASIA-PACIFIC",
						"LATIN-AMERICA",
						"NORTHERN-AMERICA",
						"AFRICA",
						"EUROPE"
					],
					"example": "ASIA-PACIFIC"
				},
				"description": {
					"description": "地址集描述",
					"type": "string"
				},
				"addresses": {
					"description": "地址集中地址集合",
					"type": "array",
					"items": {
						"type": "string",
						"description": "Format: {IP-Range}",
						"example": "192.168.1.100-192.168.1.200"
					}
				}
			}
		},
		"config.global_address_library_country_list": {
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
						"$ref": "#/definitions/config.global_address_library_country"
					}
				}
			}
		},
		"config.global_address_library_country": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "Format: ALL | {COUNTRY}",
					"example": "China"
				},
				"country_code_iso": {
					"description": "国家代码",
					"type": "string",
					"example": "CN"
				},
				"addresses": {
					"description": "国家地址列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "Format: {IP-Range}",
						"example": "192.168.1.100-192.168.1.200"
					}
				}
			}
		},
		"config.global_address_library_city_list": {
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
						"$ref": "#/definitions/config.global_address_library_city"
					}
				}
			}
		},
		"config.global_address_library_city": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "城市名",
					"example": "Beijing"
				},
				"addresses": {
					"description": "城市地址列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "城市地址范围",
						"example": "192.168.1.100-192.168.1.200"
					}
				},
				"description": {
					"description": "描述",
					"type": "string"
				}
			}
		}
	}
}