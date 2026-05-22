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
		"/api/ad/v3/slb/http-profile/": {
			"description": "新建、查看HTTP优化策略配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"http-profile"
				],
				"summary": "get all http-profile",
				"description": "查看当前已有的HTTP优化策略配置信息",
				"operationId": "get_http_profile_list",
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
						"$ref": "#/responses/operation_config_http_profile_list"
					}
				}
			},
			"post": {
				"tags": [
					"http-profile"
				],
				"summary": "create new http-profile",
				"description": "新建一个HTTP优化策略配置",
				"operationId": "add_http_profile_list",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_profile_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb http-profile abc cache { state enable time_range_minimum_min 10 time_range_maximum_min 20 time_default 15 file_size_limit_kb 7000 allow_urls [ *.jpg *.png ] deny_urls [ *.html ] force_cache_image enable cache_debug enable  convert_image enable convert_minimum_orginal_size_kb 6000 convert_exclude_urls [ /a.jpg /b.jpg ] convert_to_jpeg enable convert_to_webp enable }",
					"description": "新建HTTP优化策略abc,启用缓存功能,缓存保持时间为10~20分钟,默认缓存时间为15分钟,限制最大缓存大小为7000KB,只缓存jpg和png格式的图片,html文件不缓存,同时启用图片强制缓存，并启用图片优化功能"
				},
				{
					"command": "create slb http-profile abcd cache { state enable } compression { state enable cache_compress enable  stream_compress enable node_compress_offload enable minimum_original_size_kb 1 maximum_original_size_kb 2048 compress_mimes [ application/xml application/xcsh ] compress_mime_unknow enable }",
					"description": "新建HTTP优化策略abcd,启用缓存和压缩功能,开启实时压缩和缓存压缩,同时启用压缩卸载,文件压缩大小为1kb-2048kb,对未知文件类型也进行压缩,压缩文件类型为xml和xcsh"
				},
				{
					"command": " create slb http-profile ab cache { state enable } compression { state enable } source_address { operation request-header-insert-srcip request_header x-forwarded-for }",
					"description": "新建HTTP优化策略ab,启用缓存和压缩,同时启用将源IP插入到HTTP头部x-forwarded-for中。"
				},
				{
					"command": "modify slb http-profile ab cache {state disable} compression { state disable } source_address { operation none }",
					"description": "修改HTTP策略ab,禁用缓存、压缩和透传源IP功能"
				},
				{
					"command": "list slb http-profile ab",
					"description": "查看HTTP优化策略ab的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/http-profile/{name}": {
			"description": "新建、查看、修改、删除指定的HTTP优化策略配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"http-profile"
				],
				"summary": "get specific http-profile",
				"description": "查看指定的HTTP优化策略配置",
				"operationId": "get_http_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_profile_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"http-profile"
				],
				"summary": "create new http-profile",
				"description": "新建指定的HTTP优化策略配置",
				"operationId": "create_http_profile",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_profile_object"
					}
				}
			},
			"put": {
				"tags": [
					"http-profile"
				],
				"summary": "replace specific http-profile",
				"description": "修改指定的HTTP优化策略配置",
				"operationId": "replace_http_profile",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-PROFILE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_profile_object"
					}
				}
			},
			"patch": {
				"tags": [
					"http-profile"
				],
				"summary": "modify specific http-profile",
				"description": "修改指定的HTTP优化策略配置",
				"operationId": "edit_http_profile",
				"parameters": [
					{
						"$ref": "#/parameters/HTTP-PROFILE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_profile_object"
					}
				}
			},
			"delete": {
				"tags": [
					"http-profile"
				],
				"summary": "delete specific http-profile",
				"description": "删除指定的HTTP优化策略配置",
				"operationId": "delete_http_profile",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_http_profile_object"
					}
				}
			}
		}
	},
	"parameters": {
		"HTTP-PROFILE-CONFIG": {
			"name": "HTTP-PROFILE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.http_profile"
			}
		},
		"HTTP-PROFILE-PROPERTY": {
			"name": "HTTP-PROFILE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.http_profile"
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
		"operation_config_http_profile_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_profile_list"
			}
		},
		"operation_config_http_profile_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.http_profile"
			}
		}
	},
	"definitions": {
		"config.http_profile_list": {
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
						"$ref": "#/definitions/config.http_profile"
					}
				}
			}
		},
		"config.http_profile": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定HTTP优化策略的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "cache_compress"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"cache": {
					"description": "可选参数; 指定缓存相关的属性,默认禁用缓存。",
					"type": "object",
					"required": [],
					"properties": {
						"state": {
							"description": "可选参数; 指定缓存的开关,enable表示启用,disable表示禁用,默认disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"capacity_mb": {
							"description": "只读参数;显示缓存空间大小",
							"type": "integer",
							"default": 64,
							"example": 64
						},
						"time_range_minimum_min": {
							"description": "可选参数;指定缓存最小时间,默认为5,单位为分钟",
							"type": "integer",
							"default": 5,
							"maximum": 1440,
							"minimum": 1,
							"example": 5
						},
						"time_range_maximum_min": {
							"description": "可选参数;指定缓存最大时间,默认为1440,单位为分钟",
							"type": "integer",
							"default": 1440,
							"maximum": 1440,
							"minimum": 1,
							"example": 1440
						},
						"time_default": {
							"description": "可选参数;指定默认缓存时间,默认为60,单位为分钟",
							"type": "integer",
							"default": 60,
							"maximum": 1440,
							"minimum": 0,
							"example": 60
						},
						"file_size_limit_kb": {
							"description": "可选参数;指定可缓存文件的最大大小,默认为2048,单位为KB",
							"type": "integer",
							"default": 2048,
							"maximum": 8192,
							"minimum": 1,
							"example": 2048
						},
						"allow_urls": {
							"description": "可选参数;指定可缓存的URL列表,该参数为列表参数,可通过add/delete进行添加和删除",
							"type": "array",
							"items": {
								"description": "允许缓存列表",
								"type": "string",
								"maxLength": 255,
								"minLength": 1,
								"example": "*.jpg"
							},
							"default": [
								"*.jpg",
								"*.png",
								"*.js",
								"*.css"
							],
							"maxItems": 64
						},
						"deny_urls": {
							"description": "可选参数;指定不可缓存的URL列表,该参数为列表参数,可通过add/delete进行添加和删除",
							"type": "array",
							"items": {
								"description": "排除缓存列表",
								"type": "string",
								"maxLength": 255,
								"minLength": 1,
								"example": "*.jsp"
							},
							"maxItems": 64
						},
						"force_cache_image": {
							"description": "可选参数;强制缓存图片,enable表示启用,disable表示不启用,默认为enable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"cache_debug": {
							"description": "可选参数;指定缓存调试开关,enable表示启用,disable表示不启用,默认为disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"convert_image": {
							"description": "可选参数;指定图片转码开关,enable表示启用,disable表示不启用,默认为disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"convert_to_jpeg": {
							"description": "可选参数;图片转换为jpeg格式开关,enable表示启用,disable表示不启用,默认为disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"convert_to_webp": {
							"description": "可选参数;图片转换为webp格式开关,enable表示启用,disable表示不启用,默认为enable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"convert_minimum_orginal_size_kb": {
							"description": "可选参数;指定转换图片最小长度,取值范围为[1,8192],默认为32,单位为KB",
							"type": "integer",
							"default": 32,
							"maximum": 8192,
							"minimum": 0,
							"example": 32
						},
						"convert_exclude_urls": {
							"description": "可选参数;指定不需转换的图片url,该参数为列表参数,可通过add/delete进行添加和删除",
							"type": "array",
							"items": {
								"description": "图片优化排除列表",
								"type": "string",
								"maxLength": 255,
								"minLength": 1,
								"example": "logo.*"
							},
							"maxItems": 64
						}
					}
				},
				"compression": {
					"description": "可选参数;指定压缩相关的属性,默认为禁用压缩",
					"type": "object",
					"required": [],
					"properties": {
						"state": {
							"description": "可选参数; 指定压缩的开关,enable表示启用,disable表示禁用,默认disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"stream_compress": {
							"description": "可选参数; 指定实时压缩的开关,enable表示启用,disable表示禁用,默认enable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE",
							"example": "ENABLE"
						},
						"node_compress_offload": {
							"description": "可选参数; 指定压缩卸载的开关,enable表示启用,disable表示禁用,默认disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"cache_compress": {
							"description": "可选参数; 指定缓存压缩的开关,enable表示启用,disable表示禁用,默认disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE"
						},
						"minimum_original_size_kb": {
							"description": "可选参数; 指定最小压缩长度,默认为1,单位为KB",
							"type": "integer",
							"default": 1,
							"maximum": 8192,
							"minimum": 1,
							"example": 1
						},
						"maximum_original_size_kb": {
							"description": "可选参数; 指定最大压缩长度,默认为2048,单位为KB",
							"type": "integer",
							"default": 2048,
							"maximum": 8192,
							"minimum": 1,
							"example": 2048
						},
						"compress_mimes": {
							"description": "可选参数;指定压缩文件类型,该参数为列表参数,可通过add/delete进行添加和删除",
							"type": "array",
							"items": {
								"description": "压缩文件类型",
								"maxLength": 255,
								"minLength": 1,
								"type": "string"
							},
							"maxItems": 96,
							"default": [
								"application/ecmascript",
								"application/javascript",
								"application/perlscript",
								"application/postscript",
								"application/rss+xml",
								"application/rtf",
								"application/sgml",
								"application/vbscript",
								"application/x-csh",
								"application/x-dvi",
								"application/x-ecmascript",
								"application/x-javascript",
								"application/x-latex",
								"application/x-perl",
								"application/x-perlscript",
								"application/x-sh",
								"application/x-tcl",
								"application/x-tex",
								"application/x-texinfo",
								"application/x-troff",
								"application/x-troff-man",
								"application/x-troff-me",
								"application/x-troff-ms",
								"application/x-vbscript",
								"application/xhtml+xml",
								"application/xls",
								"application/xml",
								"image/bmp",
								"image/x-bmp",
								"image/x-ms-bmp",
								"message/*",
								"text/*"
							],
							"example": [
								"text/*"
							]
						},
						"compress_mime_unknow": {
							"description": "可选参数; 指定未知文件类型压缩的开关,enable表示启用,disable表示禁用,默认enable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "ENABLE"
						}
					}
				},
				"source_address": {
					"description": "可选参数;指定源地址透传方式,默认不启用",
					"type": "object",
					"required": [],
					"properties": {
						"operation": {
							"description": "可选参数;指定源地址透传方式,none表示不启用,request-header-insert-srcip表示将源IP插入到HTTP头部,snat-by-request-header表示使用HTTP头部中的IP和服务器建立连接;默认为none",
							"type": "string",
							"enum": [
								"NONE",
								"REQUEST-HEADER-INSERT-SRCIP",
								"SNAT-BY-REQUEST-HEADER"
							],
							"default": "NONE",
							"example": "SNAT-BY-REQUEST-HEADER"
						},
						"request_header": {
							"description": "可选参数;指定透传源IP所使用的HTTP头部名称",
							"type": "string",
							"default": "X-Forwarded-For",
							"maxLength": 63,
							"example": "X-Forwarded-For"
						}
					}
				}
			}
		}
	}
}