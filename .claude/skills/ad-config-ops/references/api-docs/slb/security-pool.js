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
		"/api/ad/v3/slb/security-pool/": {
			"description": "新建、查看安全资源池",
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
					"security-pool"
				],
				"summary": "get all security-pools",
				"description": "查看安全资源池配置",
				"operationId": "get_security_pool_list",
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
						"$ref": "#/responses/operation_config_security_pool_list"
					}
				}
			},
			"post": {
				"tags": [
					"security-pool"
				],
				"summary": "create new security-pool",
				"description": "新建安全资源池配置",
				"operationId": "add_security_pool_list",
				"parameters": [
					{
						"$ref": "#/parameters/SECURITY-POOL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_pool_object"
					}
				}
			}
		},
		"/api/ad/v3/slb/security-pool/{name}": {
			"description": "查看、修改、删除指定的安全资源池配置",
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
					"security-pool"
				],
				"summary": "get specific pool",
				"description": "查看指定的资源设备池配置",
				"operationId": "get_security_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_pool_object"
					}
				}
			},
			"put": {
				"tags": [
					"security-pool"
				],
				"summary": "replace specific security-pool",
				"description": "修改指定的安全资源池配置",
				"operationId": "replace_security_pool",
				"parameters": [
					{
						"$ref": "#/parameters/SECURITY-POOL-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_pool_object"
					}
				}
			},
			"patch": {
				"tags": [
					"security-pool"
				],
				"summary": "modify specific security-pool",
				"description": "修改指定的安全资源池配置",
				"operationId": "edit_security_pool",
				"parameters": [
					{
						"$ref": "#/parameters/SECURITY-POOL-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_pool_object"
					}
				}
			},
			"delete": {
				"tags": [
					"security-pool"
				],
				"summary": "delete specific security-pool",
				"description": "删除指定的安全设备池",
				"operationId": "delete_security_pool",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_security_pool_object"
					}
				}
			}
		}
	},
	"parameters": {
		"SECURITY-POOL-CONFIG": {
			"name": "SECURITY-POOL-CONFIG",
			"in": "body",
			"required": true,
			"description": "安全资源池配置",
			"schema": {
				"$ref": "#/definitions/config.security_pool"
			}
		},
		"SECURITY-POOL-PROPERTY": {
			"name": "SECURITY-POOL-PROPERTY",
			"in": "body",
			"required": true,
			"description": "安全资源池属性",
			"schema": {
				"$ref": "#/definitions/config.security_pool"
			}
		}
	},
	"responses": {
		"operation_config_security_pool_list": {
			"description": "安全设备池配置列表",
			"schema": {
				"$ref": "#/definitions/config.security_pool_list"
			}
		},
		"operation_config_security_pool_object": {
			"description": "安全设备池配置对象",
			"schema": {
				"$ref": "#/definitions/config.security_pool"
			}
		}
	},
	"definitions": {
		"config.security_pool_list": {
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
					"type": "array",
					"items": {
						"$ref": "#/definitions/config.security_pool"
					}
				}
			}
		},
		"config.security_pool": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "安全资源池名称",
					"type": "string",
					"example": "security_pool_1"
				},
				"description": {
					"description": "安全资源池描述信息",
					"type": "string"
				},
				"state": {
					"description": "配置启禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE"
				},
				"type": {
					"description": "安全资源池类型，SECURITY表示安全设备池，MIRROR表示镜像设备池",
					"type": "string",
					"enum": [
						"SECURITY",
						"MIRROR"
					],
					"default": "SECURITY",
					"example": "SECURITY"
				},
				"security_type": {
					"description": "当安全资源池类型为安全设备池时，可指定特定的安全设备池类型，用户自定义填写",
					"type": "string",
					"default": "NGFW",
					"example": "WAF"
				},
				"method": {
					"description": "安全设备选择策略（ROUND-ROBIN-轮询/WEIGHTED-ROUND-ROBIN-加权轮询/WEIGHTED-LEAST-CONNECTIONS-加权最少连接/WEIGHTED-LEAST-FLOW-加权最少流量/FASTEST-最快响应时间/HASH-SRCIP-源IP哈希）",
					"type": "string",
					"enum": [
						"ROUND-ROBIN",
						"WEIGHTED-ROUND-ROBIN",
						"WEIGHTED-LEAST-CONNECTIONS",
						"WEIGHTED-LEAST-FLOW",
						"FASTEST",
						"HASH-SRCIP"
					],
					"default": "WEIGHTED-LEAST-CONNECTIONS",
					"example": "WEIGHTED-LEAST-CONNECTIONS"
				},
				"priority_level_available_node": {
					"description": "优先级调度最少可用节点条件，0表示禁用优先级调度，默认为0",
					"type": "integer",
					"maximum": 100,
					"minimum": 0,
					"default": 0,
					"example": 0
				},
				"bypass": {
					"description": "bypass动作。设备池故障时若启用Bypass，则直接放通；若禁用Bypass，则针对四层虚拟服务将丢弃数据包，针对七层虚拟服务将关闭连接并返回一个终止数据包",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"connection_statistic": {
					"description": "指定连接数统计方法，默认为completed",
					"type": "string",
					"enum": [
						"ESTABLISHED",
						"COMPLETED"
					],
					"default": "COMPLETED",
					"example": "COMPLETED"
				},
				"port_map": {
					"description": "指定端口映射，默认0代表禁用，非0代表具体映射端口",
					"type": "integer",
					"maximum": 65535,
					"minimum": 0,
					"default": 0,
					"example": 0
				},
				"service_monitors": {
					"description": "安全设备健康检查方法列表",
					"type": "array",
					"items": {
						"description": "安全设备监视器",
						"type": "string"
					},
					"maxItems": 5,
					"example": [
						"ping",
						"http"
					]
				},
				"snat": {
					"description": "SNAT地址集",
					"type": "string",
					"enum": [
						"AUTO-MAP",
						"SNAT-POOL",
						"DISABLE"
					],
					"default": "DISABLE"
				},
				"snat_pool": {
					"description": "引用的snat",
					"type": "string",
					"format": "name"
				},
				"available_requirement": {
					"description": "节点有效条件，健康检查方法有效数不足该数量时判定节点故障（0表示全部）",
					"type": "integer",
					"minimum": 0,
					"default": 0,
					"example": 0
				}
			}
		}
	}
}