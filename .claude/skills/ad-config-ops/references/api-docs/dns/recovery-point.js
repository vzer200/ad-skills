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
		"/api/ad/v3/dns/recovery-point/": {
			"description": "全局配置缓存管理操作",
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
					"recovery-point"
				],
				"summary": "get all recovery-point",
				"description": "查看全局配置还原点",
				"operationId": "get_recovery_point_list",
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
						"$ref": "#/responses/operation_config_recovery_point_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all recovery-point",
						"description": "查看全局配置还原点",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/dns/recovery-point/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/dns/recovery-point/ 响应",
						"description": "返回GET /api/ad/v3/dns/recovery-point/的响应数据",
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
									"name": "backup1",
									"description": "change CNC link ip",
									"time_point": "2018-01-04 08:05:10",
									"content": [
										"DNS-VIP-POOL"
									]
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"recovery-point"
				],
				"summary": "create new recovery-point",
				"description": "创建全局配置还原点",
				"operationId": "add_recovery_point_list",
				"parameters": [
					{
						"$ref": "#/parameters/RECOVERY-POINT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_recovery_point_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new recovery-point",
						"description": "创建全局配置还原点",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/dns/recovery-point/",
							"body": {
								"name": "AI_backup1_A",
								"content": [
									"DNS-VIP-POOL"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/dns/recovery-point/ 响应",
						"description": "返回POST /api/ad/v3/dns/recovery-point/的响应数据",
						"value": {
							"name": "AI_backup1_A",
							"description": "change CNC link ip",
							"time_point": "2018-01-04 08:05:10",
							"content": [
								"DNS-VIP-POOL"
							]
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"recovery-point"
				],
				"summary": "modify recovery-point",
				"description": "修改全局配置还原点",
				"operationId": "edit_recovery_point_list",
				"parameters": [
					{
						"$ref": "#/parameters/RECOVERY-POINT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_recovery_point_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify recovery-point",
						"description": "修改全局配置还原点",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/dns/recovery-point/",
							"body": {
								"name": "backup1",
								"content": [
									"DNS-VIP-POOL"
								]
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/dns/recovery-point/ 响应",
						"description": "返回PATCH /api/ad/v3/dns/recovery-point/的响应数据",
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
									"name": "backup1",
									"description": "change CNC link ip",
									"time_point": "2018-01-04 08:05:10",
									"content": [
										"DNS-VIP-POOL"
									]
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/dns/recovery-point/{name}": {
			"description": "全局配置缓存管理操作",
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
					"recovery-point"
				],
				"summary": "get specific recovery-point",
				"description": "查看指定已有的全局配置还原点",
				"operationId": "get_recovery_point",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_recovery_point_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific recovery-point",
						"description": "查看指定已有的全局配置还原点",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/dns/recovery-point/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/dns/recovery-point/{name} 响应",
						"description": "返回GET /api/ad/v3/dns/recovery-point/{name}的响应数据",
						"value": {
							"name": "backup1",
							"description": "change CNC link ip",
							"time_point": "2018-01-04 08:05:10",
							"content": [
								"DNS-VIP-POOL"
							]
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"recovery-point"
				],
				"summary": "create new recovery-point",
				"description": "创建全局配置还原点",
				"operationId": "create_recovery_point",
				"parameters": [
					{
						"$ref": "#/parameters/RECOVERY-POINT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_recovery_point_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new recovery-point",
						"description": "创建全局配置还原点",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/dns/recovery-point/{name}",
							"body": {
								"name": "AI_backup1_B",
								"content": [
									"DNS-VIP-POOL"
								]
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/dns/recovery-point/{name} 响应",
						"description": "返回POST /api/ad/v3/dns/recovery-point/{name}的响应数据",
						"value": {
							"name": "AI_backup1_B",
							"description": "change CNC link ip",
							"time_point": "2018-01-04 08:05:10",
							"content": [
								"DNS-VIP-POOL"
							]
						}
					}
				}
			},
			"put": {
				"tags": [
					"recovery-point"
				],
				"summary": "replace specific recovery-point",
				"description": "修改指定已有的全局配置还原点",
				"operationId": "replace_recovery_point",
				"parameters": [
					{
						"$ref": "#/parameters/RECOVERY-POINT-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_recovery_point_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific recovery-point",
						"description": "修改指定已有的全局配置还原点",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/dns/recovery-point/{name}",
							"body": {
								"name": "backup1",
								"content": [
									"DNS-VIP-POOL"
								]
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/dns/recovery-point/{name} 响应",
						"description": "返回PUT /api/ad/v3/dns/recovery-point/{name}的响应数据",
						"value": {
							"name": "backup1",
							"description": "change CNC link ip",
							"time_point": "2018-01-04 08:05:10",
							"content": [
								"DNS-VIP-POOL"
							]
						}
					}
				}
			},
			"patch": {
				"tags": [
					"recovery-point"
				],
				"summary": "modify specific recovery-point",
				"description": "增量修改已有的配置还原点",
				"operationId": "edit_recovery_point",
				"parameters": [
					{
						"$ref": "#/parameters/RECOVERY-POINT-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_recovery_point_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific recovery-point",
						"description": "增量修改已有的配置还原点",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/dns/recovery-point/{name}",
							"body": {
								"name": "backup1",
								"content": [
									"DNS-VIP-POOL"
								]
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/dns/recovery-point/{name} 响应",
						"description": "返回PATCH /api/ad/v3/dns/recovery-point/{name}的响应数据",
						"value": {
							"name": "backup1",
							"description": "change CNC link ip",
							"time_point": "2018-01-04 08:05:10",
							"content": [
								"DNS-VIP-POOL"
							]
						}
					}
				}
			},
			"delete": {
				"tags": [
					"recovery-point"
				],
				"summary": "delete specific recovery-point",
				"description": "删除指定已有的配置还原点",
				"operationId": "delete_recovery_point",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_recovery_point_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific recovery-point",
						"description": "删除指定已有的配置还原点",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/dns/recovery-point/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/dns/recovery-point/{name} 响应",
						"description": "返回DELETE /api/ad/v3/dns/recovery-point/{name}的响应数据",
						"value": {
							"name": "backup1",
							"description": "change CNC link ip",
							"time_point": "2018-01-04 08:05:10",
							"content": [
								"DNS-VIP-POOL"
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list dns recovery-point dns_rec",
					"description": "查看全局配置还原点，名称为：dns_rec"
				},
				{
					"command": "create dns recovery-point dns_rec description create_rec content add [ dns-local-dns ]",
					"description": "创建配置还原点 名称为：dns_rec 包含的还原模块：dns-local-dns"
				},
				{
					"command": "modify dns recovery-point dns_rec content add [ dns-record-aaaa  ]",
					"description": "修改全局配置同步还原点信息，新增还原模块：dns-record-aaaa"
				},
				{
					"command": "delete dns recovery-point dns_rec",
					"description": "删除全局配置还原配置，名称：dns_rec"
				}
			]
		},
		"/api/ad/v3/dns/recovery-point/{name}/recovery": {
			"description": "执行配置还原操作",
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
			"post": {
				"tags": [
					"recovery-point"
				],
				"summary": "recover dns config",
				"description": "从指定已有的配置还原点执行还原操作",
				"operationId": "recover_dns_config",
				"responses": {
					"202": {
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation"
					}
				},
				"x-examples": {
					"request": {
						"summary": "recover dns config",
						"description": "从指定已有的配置还原点执行还原操作",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/dns/recovery-point/{name}/recovery"
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/dns/recovery-point/{name}/recovery 响应",
						"description": "返回POST /api/ad/v3/dns/recovery-point/{name}/recovery的响应数据",
						"value": {
							"event_id": 0,
							"operation": "/debug/sys/maintenance/restart-service",
							"state": "WAITING",
							"start_time": "2018-04-02 08:30:21",
							"finish_time": "2018-04-02 08:31:05",
							"triggered_by": "admin",
							"data": {}
						}
					}
				}
			}
		}
	},
	"parameters": {
		"RECOVERY-POINT-CONFIG": {
			"name": "RECOVERY-POINT-CONFIG",
			"in": "body",
			"required": true,
			"description": "全局配置还原信息",
			"schema": {
				"$ref": "#/definitions/config.recovery_point_req"
			}
		},
		"RECOVERY-POINT-PROPERTY": {
			"name": "RECOVERY-POINT-PROPERTY",
			"in": "body",
			"required": true,
			"description": "全局配置还原属性",
			"schema": {
				"$ref": "#/definitions/config.recovery_point"
			}
		}
	},
	"responses": {
		"operation_config_recovery_point_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.recovery_point_list"
			}
		},
		"operation_config_recovery_point_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.recovery_point"
			}
		}
	},
	"definitions": {
		"config.recovery_point_list": {
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
						"$ref": "#/definitions/config.recovery_point"
					}
				}
			}
		},
		"config.recovery_point_req": {
			"type": "object",
			"required": [
				"name",
				"content"
			],
			"properties": {
				"name": {
					"description": "全局配置还原点名称",
					"type": "string",
					"example": "backup1"
				},
				"description": {
					"description": "全局配置还原点描述信息",
					"type": "string",
					"example": "change CNC link ip"
				},
				"content": {
					"description": "全局配置还原的同步模块列表，只读属性",
					"readOnly": true,
					"type": "array",
					"items": {
						"description": "全局配置还原的同步模块",
						"type": "string",
						"enum": [
							"DNS-VIP-POOL",
							"DNS-LOCAL-DNS",
							"DNS-MAP",
							"DNS-RECORD-MX",
							"DNS-RECORD-NS",
							"DNS-RECORD-CNAME",
							"DNS-RECORD-TXT",
							"SYS-USER",
							"SYS-ROLE",
							"DNS-RECORD-SOA",
							"DNS-RECORD-PTR",
							"DNS-RECORD-SRV",
							"DNS-RECORD-A",
							"SYS-PERMISSION",
							"DNS-RECORD-AAAA",
							"SYS-PWD-POLICY",
							"DNS-ZONE-AUTH",
							"DNS-ZONE-DNSSEC",
							"DNS-AUTH-TSIG-KEY",
							"DNS-RECORD-NAPTR",
							"DNS-RECORD-CAA",
							"DNS-RECORD-HINFO",
							"DNS-RECORD-DS",
							"DNS-RECORD-DNAME"
						]
					},
					"example": [
						"DNS-VIP-POOL"
					],
					"maxItems": 32,
					"minItems": 1
				}
			}
		},
		"config.recovery_point": {
			"type": "object",
			"required": [
				"name",
				"content"
			],
			"properties": {
				"name": {
					"description": "全局配置还原点名称",
					"type": "string",
					"example": "backup1"
				},
				"description": {
					"description": "全局配置还原点描述信息",
					"type": "string",
					"example": "change CNC link ip"
				},
				"time_point": {
					"type": "string",
					"description": "全局配置还原点时间戳，只读属性",
					"readOnly": true,
					"example": "2018-01-04 08:05:10"
				},
				"content": {
					"description": "全局配置还原的同步模块列表，只读属性",
					"readOnly": true,
					"type": "array",
					"items": {
						"description": "全局配置还原的同步模块",
						"type": "string",
						"enum": [
							"DNS-VIP-POOL",
							"DNS-LOCAL-DNS",
							"DNS-TOPOLOGY",
							"DNS-MAP",
							"DNS-RECORD-MX",
							"DNS-RECORD-CNAME",
							"DNS-RECORD-NS",
							"DNS-RECORD-TXT",
							"DNS-RECORD-SOA",
							"DNS-RECORD-PTR",
							"DNS-RECORD-SRV",
							"DNS-RECORD-A",
							"SYS-USER",
							"SYS-ROLE"
						]
					},
					"example": [
						"DNS-VIP-POOL"
					],
					"maxItems": 32,
					"minItems": 1
				}
			}
		}
	}
}