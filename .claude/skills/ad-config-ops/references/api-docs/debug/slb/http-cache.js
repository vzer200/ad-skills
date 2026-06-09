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
				},
				"x-examples": {
					"request": {
						"summary": "retrieve all http-cache",
						"description": "查询虚拟服务所有HTTP缓存\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/ 响应",
						"description": "返回GET /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/的响应数据",
						"value": {
							"maximum_items": 4000,
							"total_pages": 5,
							"page_number": 5,
							"page_size": 10,
							"total_items": 48,
							"items_offset": 40,
							"items_length": 8,
							"items": [
								{
									"cache_id": 0,
									"url": "/index.html",
									"compression_status": "gzip",
									"version": "HTTP/1.1",
									"mime": "text/html",
									"size_byte": 14321,
									"expired_timestamp": 0,
									"refresh_timestamp": 0,
									"hit": null,
									"netns": "default"
								}
							]
						}
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
				},
				"x-examples": {
					"request": {
						"summary": "retrieve all http-cache",
						"description": "查询虚拟服务具体HTTP缓存\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/{cache_id}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/{cache_id} 响应",
						"description": "返回GET /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/{cache_id}的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
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
				"operationId": "clear_http_cache_list",
				"x-examples": {
					"request": {
						"summary": "clear all http-cache",
						"description": "清除虚拟服务HTTP缓存操作\n\n支持的虚拟服务类型：\n- 8583: 默认端口8583\n- HTTP: 默认端口80\n- TCP-PROXY: 默认端口8080\n- TCP-FORWARD: 默认端口8082\n- UDP-PROXY: 默认端口55\n- UDP-FORWARD: 默认端口56\n- SSL-OFFLOAD: 默认端口443\n- SSL-OFFLOAD-HTTPS: 默认端口444\n- IP: 默认端口1\n- ANY: 默认端口2\n- DNS: 默认端口53\n- FTP: 默认端口21\n- RADIUS: 默认端口1812\n- SIP-TCP: 默认端口5060\n- SIP-UDP: 默认端口5062\n",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/clear"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/clear 响应",
						"description": "返回POST /api/ad/v3/debug/slb/virtual-service/{virtual_service_name}/http-cache/clear的响应数据",
						"value": {
							"ok": true
						}
					}
				}
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