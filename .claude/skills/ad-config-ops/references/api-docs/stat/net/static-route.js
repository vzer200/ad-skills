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
		"/api/ad/v3/stat/net/static-route/": {
			"description": "获取静态路由信息",
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
					"static-route"
				],
				"summary": "get all static-route",
				"description": "获取静态路由信息",
				"operationId": "get_static_route_list",
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
						"$ref": "#/responses/operation_stat_static_route_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/net/static-route/{name}": {
			"description": "获取指定静态路由信息",
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
					"static-route"
				],
				"summary": "get specific static-route",
				"description": "获取指定静态路由信息",
				"operationId": "get_static-route",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_static_route_object"
					}
				}
			}
		}
	},
	"parameters": {
		"STATIC-ROUTE-CONFIG": {
			"name": "STATIC-ROUTE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/stat.static_route"
			}
		}
	},
	"responses": {
		"operation_stat_static_route_list": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.static_route_list"
			}
		},
		"operation_stat_static_route_object": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.static_route"
			}
		}
	},
	"definitions": {
		"stat.static_route_list": {
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
						"$ref": "#/definitions/stat.static_route"
					}
				}
			}
		},
		"stat.static_route": {
			"type": "object",
			"readOnly": true,
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "静态路由名称"
				},
				"subnet": {
					"type": "string",
					"description": "IPv4子网或者IPV6前缀",
					"example": "192.168.0.0/16"
				},
				"health": {
					"type": "string",
					"description": "静态路由健康状态",
					"enum": [
						"NORMAL",
						"FAILURE",
						"UNKNOWN"
					],
					"example": "UNKNOWN"
				},
				"status": {
					"type": "string",
					"description": "路由状态",
					"example": "Destination Host Unreachable."
				}
			}
		}
	}
}