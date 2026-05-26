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
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/srv/": {
			"description": "SRV记录配置管理操作",
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
					"dns-record"
				],
				"summary": "get all dns-record-srv",
				"description": "查看SRV记录",
				"operationId": "get_dns_record_srv_list",
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
						"$ref": "#/responses/operation_config_dns_record_srv_list"
					}
				}
			},
			"post": {
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-srv",
				"description": "创建SRV记录",
				"operationId": "add_dns_record_srv_list",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-SRV-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_srv_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns zone local dns-records srv",
					"description": "获取本地全部SRV记录配置"
				},
				{
					"command": "list dns zone local dns-records srv domain_srv",
					"description": "获取本地指定SRV记录domain_srv配置"
				},
				{
					"command": "create  dns zone local dns-records srv  \"domain_srv\" ttl 60 domain \"domain_srv\" zone \"ssss\" state \"enable\" type \"srv\" srv_records [ { cpu \"i7\" os \"linux\" }  ]",
					"description": "创建权威域ssss下名称为domain_srv的SRV记录，其TTL为60，记录值列表中存在cpu为i7，os为linux的记录值"
				},
				{
					"command": "modify dns zone local dns-records srv domain_srv srv_records [ { address \"test1.com\" port 22 priority 1 ttl 60 weight 20 }  ]",
					"description": "修改本地SRV记录domain_srv的记录值地址为test1.com，端口由22，优先级为1，ttl为60，权重为20"
				},
				{
					"command": "delete dns zone local dns-records srv domain_srv",
					"description": "删除本地SRV记录domain_srv"
				}
			]
		},
		"/api/ad/v4/dns/zone/{dns_config_area}/dns-records/srv/{name}": {
			"description": "SRV记录配置管理操作",
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
					"dns-record"
				],
				"summary": "get specific dns-record-srv",
				"description": "查看指定的SRV记录",
				"operationId": "get_dns_record_srv",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_srv_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"dns-record"
				],
				"summary": "create new dns-record-srv",
				"description": "创建一个SRV记录",
				"operationId": "create_dns_record_srv",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-SRV-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_srv_object"
					}
				}
			},
			"put": {
				"tags": [
					"dns-record"
				],
				"summary": "replace specific dns-record-srv",
				"description": "修改指定的SRV记录",
				"operationId": "replace_dns_record_srv",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-SRV-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_srv_object"
					}
				}
			},
			"patch": {
				"tags": [
					"dns-record"
				],
				"summary": "modify specific dns-record-srv",
				"description": "增量修改指定的SRV记录",
				"operationId": "edit_dns_record_srv",
				"parameters": [
					{
						"$ref": "#/parameters/DNS-RECORD-SRV-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_srv_object"
					}
				}
			},
			"delete": {
				"tags": [
					"dns-record"
				],
				"summary": "delete specific dns-record-srv",
				"description": "删除指定的SRV记录",
				"operationId": "delete_dns_record_srv",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_dns_record_srv_object"
					}
				}
			}
		}
	},
	"parameters": {
		"DNS-RECORD-SRV-CONFIG": {
			"name": "DNS-RECORD-SRV-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.dns_record_srv"
			}
		},
		"DNS-RECORD-SRV-PROPERTY": {
			"name": "DNS-RECORD-SRV-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.dns_record_srv"
			}
		},
		"dns_config_area": {
			"name": "dns_config_area",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "DNS Config Area",
			"enum": [
				"local",
				"global"
			],
			"example": "global"
		}
	},
	"responses": {
		"operation_config_dns_record_srv_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_srv_list"
			}
		},
		"operation_config_dns_record_srv_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.dns_record_srv"
			}
		}
	},
	"definitions": {
		"config.dns_record_srv_list": {
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
						"$ref": "#/definitions/config.dns_record_srv"
					}
				}
			}
		},
		"config.dns_record_srv": {
			"type": "object",
			"required": [
				"domain",
				"zone",
				"srv_records"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "名称。做重复校验"
				},
				"description": {
					"type": "string",
					"description": "描述"
				},
				"state": {
					"type": "string",
					"description": "启/禁用。默认启用",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"domain": {
					"type": "string",
					"description": "域名，按域名格式校验，最大长度250"
				},
				"zone": {
					"type": "string",
					"description": "指定该DNS记录所属域（主服务器）",
					"example": "com"
				},
				"type": {
					"type": "string",
					"description": "类型",
					"enum": [
						"SRV"
					],
					"default": "SRV"
				},
				"srv_records": {
					"type": "array",
					"description": "SRV记录列表",
					"items": {
						"type": "object",
						"description": "SRV记录值",
						"required": [
							"address",
							"port",
							"weight",
							"priority"
						],
						"properties": {
							"address": {
								"description": "主机名，校验格式为单个域名或单个IPv4地址",
								"type": "string",
								"example": "192.168.1.212"
							},
							"port": {
								"description": "端口,16位无符号整数，取值范围[0,65535]",
								"type": "integer",
								"minimum": 0,
								"maximum": 65535
							},
							"priority": {
								"description": "优先级,16位无符号整数，取值范围[0,65535]",
								"type": "integer",
								"default": 1,
								"example": 1,
								"minimum": 0,
								"maximum": 65535
							},
							"weight": {
								"description": "权重,16位无符号整数，取值范围[0,65535]",
								"type": "integer",
								"default": 10,
								"example": 10,
								"minimum": 0,
								"maximum": 65535
							},
							"ttl": {
								"description": "TTL取值范围为[0,2147483647]，单位秒",
								"type": "integer",
								"default": 60,
								"example": 60,
								"minimum": 0,
								"maximum": 2147483647
							}
						}
					},
					"minItems": 1,
					"maxItems": 7
				}
			}
		}
	}
}