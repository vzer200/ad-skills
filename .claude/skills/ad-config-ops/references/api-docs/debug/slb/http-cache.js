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
		"/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/": {
			"description": "HTTP缓存操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"http-cache"
				],
				"summary": "retrieve all http-cache",
				"description": "查询虚拟服务所有HTTP缓存",
				"operationId": "retrieve_http_cache_list",
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
						"$ref": "#/responses/operation_debug_http_cache_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list debug slb virtual-service vs1 http-cache",
					"description": "查询虚拟服务vs1的所有HTTP缓存"
				},
				{
					"command": "list debug slb virtual-service vs1 http-cache test",
					"description": "查询虚拟服务vs1，cache_id为test的HTTP缓存"
				},
				{
					"command": "run debug slb virtual-service 166.166.166.100 http-cache clear",
					"description": "删除虚拟服务vs1的HTTP缓存"
				}
			]
		},
		"/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/{cache_id}": {
			"description": "HTTP缓存操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "#/parameters/cache_id"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"http-cache"
				],
				"summary": "retrieve all http-cache",
				"description": "查询虚拟服务具体HTTP缓存",
				"operationId": "retrieve_http_cache_list",
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				}
			}
		},
		"/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/clear": {
			"description": "HTTP缓存操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				},
				{
					"$ref": "#/parameters/virtual_service_name"
				},
				{
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"post": {
				"tags": [
					"http-cache"
				],
				"summary": "clear all http-cache",
				"description": "清除虚拟服务HTTP缓存操作",
				"operationId": "clear_http_cache_list"
			}
		}
	},
	"parameters": {
		"virtual_service_name": {
			"name": "virtual_service_name",
			"in": "path",
			"type": "string",
			"required": true,
			"description": "虚拟服务"
		},
		"url_pattern_wildcard": {
			"name": "url_pattern",
			"in": "query",
			"type": "string",
			"required": true,
			"description": ""
		},
		"cache_id": {
			"name": "cache_id",
			"in": "path",
			"type": "integer",
			"required": true,
			"description": "缓存id"
		}
	},
	"responses": {
		"operation_debug_http_cache_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.http_cache_list"
			}
		}
	},
	"definitions": {
		"debug.http_cache_list": {
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
					"description": "http缓存列表",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.http_cache_entry"
					}
				}
			}
		},
		"debug.http_cache_entry": {
			"type": "object",
			"properties": {
				"cache_id": {
					"type": "integer",
					"description": "缓存id"
				},
				"url": {
					"type": "string",
					"example": "/index.html",
					"description": "虚拟服务url"
				},
				"compression_status": {
					"type": "string",
					"example": "gzip",
					"description": "压缩状态,可能是NORMAL,GZIP,DEFLATE,UNKNOW等"
				},
				"version": {
					"type": "string",
					"example": "HTTP/1.1",
					"description": "http协议版本"
				},
				"mime": {
					"type": "string",
					"example": "text/html",
					"description": "mime类型"
				},
				"size_byte": {
					"type": "integer",
					"example": 14321,
					"description": "缓存大小"
				},
				"expired_timestamp": {
					"type": "integer",
					"description": "到期时间戳"
				},
				"refresh_timestamp": {
					"type": "integer",
					"description": "刷新时间戳"
				},
				"hit": {
					"description": "缓存命中记录",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"netns": {
					"type": "string",
					"default": "default",
					"description": "所属netns名称"
				}
			}
		}
	}
}