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
		"/api/ad/v3/net/link-monitor/connect-tcp/": {
			"description": "CONNECT-TCP链路健康检查配置管理操作",
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
					"link-monitor"
				],
				"summary": "get all link-monitor-connect-tcp",
				"description": "查看CONNECT-TCP链路健康检查配置",
				"operationId": "get_link_monitor_connect_tcp_list",
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
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_list"
					}
				}
			},
			"post": {
				"tags": [
					"link-monitor"
				],
				"summary": "create new link-monitor-connect-tcp",
				"description": "新建CONNECT-TCP链路健康检查",
				"operationId": "add_link_monitor_connect_tcp_list",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-CONNECT-TCP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"link-monitor"
				],
				"summary": "modify link-monitor-connect-tcp",
				"description": "修改CONNECT-TCP链路健康检查配置",
				"operationId": "edit_link_monitor_connect_tcp_list",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-CONNECT-TCP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list  net link-monitor connect-tcp ",
					"description": "查看所有connect-tcp类型监视器配置"
				},
				{
					"command": "create net link-monitor connect-tcp my_tcp_monitor host 'www.abc.com'  port 8080 interval 5 timeout 10 send_content 'GET / HTTP/1.0\nhost:www.baidu.com' receive_cache_size 4096 receive_content_match '200 OK' send_content_before_disconnect 'over' hexadecimal_mode disable",
					"description": "创建connect-tcp监视器my_tcp_monitor，监视www.abc.com:8080，每隔5s监视一次，每次监视超时时间为10s， 每次监视发送数据'GET / HTTP/1.0\\nhost:www.baidu.com', 每次监视最多接收处理4096字节数据；在每次监视超时时间内，应答数据含有 '200 OK'即认定为监视成功； 每次监视断开tcp连接之前向监视目标发送'over'字符串； 每次监视禁用十六进制"
				},
				{
					"command": "list net link-monitor connect-tcp my_tcp_monitor",
					"description": "查看connect-tcp监视my_tcp_monitor"
				},
				{
					"command": "modify net link-monitor connect-tcp my_tcp_monitor host 'www.123.com' port 80",
					"description": "编辑connect-tcp监视器my_tcp_monitor，将监视地址和监视端口分别封信为www.123.com和80"
				},
				{
					"command": "delete net link-monitor connect-tcp my_tcp_monitor ",
					"description": "删除connect-tcp监视器my_tcp_monitor"
				}
			]
		},
		"/api/ad/v3/net/link-monitor/connect-tcp/{name}": {
			"description": "指定CONNECT-TCP链路健康检查配置操作",
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
					"link-monitor"
				],
				"summary": "get specific link-monitor-connect-tcp",
				"description": "查看指定CONNECT-TCP链路健康检查配置",
				"operationId": "get_link_monitor_connect_tcp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"link-monitor"
				],
				"summary": "create new link-monitor-connect-tcp",
				"description": "新建CONNECT-TCP链路健康检查配置",
				"operationId": "create_link_monitor_connect_tcp",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-CONNECT-TCP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_object"
					}
				}
			},
			"put": {
				"tags": [
					"link-monitor"
				],
				"summary": "replace specific link-monitor-connect-tcp",
				"description": "替换指定CONNECT-TCP链路健康检查配置",
				"operationId": "replace_link_monitor_connect_tcp",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-CONNECT-TCP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_object"
					}
				}
			},
			"patch": {
				"tags": [
					"link-monitor"
				],
				"summary": "modify specific link-monitor-connect-tcp",
				"description": "修改指定CONNECT-TCP链路健康检查配置",
				"operationId": "edit_link_monitor_connect_tcp",
				"parameters": [
					{
						"$ref": "#/parameters/LINK-MONITOR-CONNECT-TCP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_object"
					}
				}
			},
			"delete": {
				"tags": [
					"link-monitor"
				],
				"summary": "delete specific link-monitor-connect-tcp",
				"description": "删除指定CONNECT-TCP链路健康检查配置",
				"operationId": "delete_link_monitor_connect_tcp",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_monitor_connect_tcp_object"
					}
				}
			}
		}
	},
	"parameters": {
		"LINK-MONITOR-CONNECT-TCP-CONFIG": {
			"name": "LINK-MONITOR-CONNECT-TCP-CONFIG",
			"in": "body",
			"required": true,
			"description": "CONNECT-TCP链路健康检查配置",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_connect_tcp"
			}
		},
		"LINK-MONITOR-CONNECT-TCP-PROPERTY": {
			"name": "LINK-MONITOR-CONNECT-TCP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "CONNECT-TCP链路健康检查属性",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_connect_tcp"
			}
		}
	},
	"responses": {
		"operation_config_link_monitor_connect_tcp_list": {
			"description": "CONNECT-TCP链路健康检查配置列表",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_connect_tcp_list"
			}
		},
		"operation_config_link_monitor_connect_tcp_object": {
			"description": "CONNECT-TCP链路健康检查配置对象",
			"schema": {
				"$ref": "#/definitions/config.link_monitor_connect_tcp"
			}
		}
	},
	"definitions": {
		"config.link_monitor_connect_tcp_list": {
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
						"$ref": "#/definitions/config.link_monitor_connect_tcp"
					}
				}
			}
		},
		"config.link_monitor_connect_tcp": {
			"type": "object",
			"required": [
				"name",
				"port"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；配置名称",
					"example": "http",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；所配置connect-tcp监视器备注标签"
				},
				"type": {
					"type": "string",
					"enum": [
						"CONNECT-TCP"
					],
					"description": "可选参数；链路健康检查类型（connect-tcp），默认值connect-tcp",
					"default": "CONNECT-TCP"
				},
				"timeout": {
					"type": "integer",
					"description": "可选参数；超时时间，默认值16",
					"default": 16,
					"example": 16,
					"maximum": 255,
					"minimum": 1
				},
				"interval": {
					"type": "integer",
					"description": "可选参数；探测间隔时间（单位：秒），默认值5",
					"default": 5,
					"example": 5,
					"maximum": 255,
					"minimum": 1
				},
				"host": {
					"type": "string",
					"description": "可选参数；监视地址，长度为1~256字节，必须为IP地址或域名格式",
					"default": "*",
					"example": "8.8.8.8",
					"maxLength": 256,
					"minLength": 1
				},
				"debug_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "可选参数；开启调试日志（enable-启用/disable-禁用），默认值disable",
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"port": {
					"type": "integer",
					"description": "必选参数；监视端口",
					"default": 80,
					"example": 80,
					"maximum": 65535,
					"minimum": 1
				},
				"send_content": {
					"type": "string",
					"description": "可选参数；每次监视发送内容，默认值为空（即不发送任何数据）",
					"example": "GET / HTTP/1.1",
					"default": "",
					"maxLength": 2048,
					"minLength": 0
				},
				"receive_cache_size": {
					"type": "integer",
					"description": "可选参数；每次监视最大接收处理数据缓冲区大小（单位：字节），默认值2048",
					"default": 2048,
					"example": 4096,
					"maximum": 4096,
					"minimum": 0
				},
				"receive_content_match": {
					"type": "string",
					"description": "可选参数；设定每次监视应答内容必须包含的字符串，默认值为空（即不校验应答数据里的任何字段）",
					"example": "200",
					"maxLength": 256,
					"minLength": 0,
					"default": ""
				},
				"send_content_before_disconnect": {
					"description": "可选参数；每次监视过程在tcp连接断开之前向监视目标发送的内容，默认值为空（即不发送任何内容）",
					"type": "string",
					"maxLength": 256,
					"minLength": 0,
					"default": ""
				},
				"hexadecimal_mode": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "可选参数；开启十六进制模式（enable-启用/disable-禁用），默认值disable",
					"default": "DISABLE",
					"example": "DISABLE"
				}
			}
		}
	}
}