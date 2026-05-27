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
		"/api/ad/v3/slb/service-chain/": {
			"description": "新建、查看服务链",
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
					"service-chain"
				],
				"summary": "get all service-chains",
				"description": "查看服务链配置",
				"operationId": "get_service_chain_list",
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
						"$ref": "#/responses/operation_config_service_chain_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-chains",
						"description": "查看服务链配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-chain/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-chain/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-chain/的响应数据",
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
									"name": "service_chain_1",
									"description": "example_string",
									"security_pool": [
										"WAF_POOL"
									]
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"service-chain"
				],
				"summary": "create new service-chain",
				"description": "新建服务链",
				"operationId": "add_service_chain_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-CHAIN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_chain_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-chain",
						"description": "新建服务链",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-chain/",
							"body": {
								"name": "AI_service_chain_1_A"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-chain/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-chain/的响应数据",
						"value": {
							"name": "AI_service_chain_1_A",
							"description": "example_string",
							"security_pool": [
								"WAF_POOL"
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/service-chain/{name}": {
			"description": "查看、修改、删除指定的服务链配置",
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
					"service-chain"
				],
				"summary": "get specific service-chain",
				"description": "查看指定的服务链配置",
				"operationId": "get_service_chain",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_chain_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-chain",
						"description": "查看指定的服务链配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-chain/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-chain/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-chain/{name}的响应数据",
						"value": {
							"name": "service_chain_1",
							"description": "example_string",
							"security_pool": [
								"WAF_POOL"
							]
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-chain"
				],
				"summary": "replace specific service-chain",
				"description": "修改指定的服务链配置",
				"operationId": "replace_service_chain",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-CHAIN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_chain_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-chain",
						"description": "修改指定的服务链配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-chain/{name}",
							"body": {
								"name": "service_chain_1"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-chain/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-chain/{name}的响应数据",
						"value": {
							"name": "service_chain_1",
							"description": "example_string",
							"security_pool": [
								"WAF_POOL"
							]
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-chain"
				],
				"summary": "modify specific service-chain",
				"description": "修改指定的服务链配置",
				"operationId": "edit_service_chain",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-CHAIN-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_chain_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-chain",
						"description": "修改指定的服务链配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-chain/{name}",
							"body": {
								"name": "service_chain_1"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-chain/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-chain/{name}的响应数据",
						"value": {
							"name": "service_chain_1",
							"description": "example_string",
							"security_pool": [
								"WAF_POOL"
							]
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-chain"
				],
				"summary": "delete specific service-chain",
				"description": "删除指定的服务链",
				"operationId": "delete_service_chain",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_chain_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-chain",
						"description": "删除指定的服务链",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-chain/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-chain/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-chain/{name}的响应数据",
						"value": {
							"name": "service_chain_1",
							"description": "example_string",
							"security_pool": [
								"WAF_POOL"
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/service-chain/{name}/associated-vs": {
			"description": "获取关联指定服务链的虚拟服务列表信息",
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
					"service-chain-associated-vs"
				],
				"summary": "get virtual services with this service-chain",
				"description": "查看关联指定的服务链的虚拟服务信息",
				"operationId": "service-chain-association",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_chain_associate_vs_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get virtual services with this service-chain",
						"description": "查看关联指定的服务链的虚拟服务信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-chain/{name}/associated-vs"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-chain/{name}/associated-vs 响应",
						"description": "返回GET /api/ad/v3/slb/service-chain/{name}/associated-vs的响应数据",
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
									"name": "vs_1",
									"service": null,
									"vips": [
										"10.0.1.83"
									],
									"vports": [
										"80-88"
									],
									"pre_rules": [
										{
											"name": "pre-rule-1",
											"inherit_vs_service_chain": "ENABLE",
											"service_chain": "service_chain1_for_pre_rule"
										}
									]
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/service-chain/{name}/associated-pre-rule": {
			"description": "获取关联指定服务链的前置策略列表信息",
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
					"service-chain-associated-pre-rule"
				],
				"summary": "get pre-rules associated with this service-chain",
				"description": "查看关联指定的服务链的前置策略信息",
				"operationId": "service-chain-association",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_chain_associate_pre_rule_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get pre-rules associated with this service-chain",
						"description": "查看关联指定的服务链的前置策略信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-chain/{name}/associated-pre-rule"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-chain/{name}/associated-pre-rule 响应",
						"description": "返回GET /api/ad/v3/slb/service-chain/{name}/associated-pre-rule的响应数据",
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
									"name": "pre-rule-1",
									"service": "FTP",
									"inherit_vs_service_chain": "ENABLE",
									"associated_vs": [
										{
											"name": "vs_1",
											"service_chain": "service_chain1"
										}
									]
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/service-chain/all/associated-vs": {
			"description": "获取所有服务链关联的虚拟服务列表信息",
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
					"service-chain-all-associated-vs"
				],
				"summary": "get virtual services with all service-chain",
				"description": "查看所有服务链关联的虚拟服务信息",
				"operationId": "all-service-chain-association",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_all_service_chain_associate_vs_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get virtual services with all service-chain",
						"description": "查看所有服务链关联的虚拟服务信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-chain/all/associated-vs"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-chain/all/associated-vs 响应",
						"description": "返回GET /api/ad/v3/slb/service-chain/all/associated-vs的响应数据",
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
									"service_chain_name": "service_chain_1",
									"associated_vs": [
										{
											"name": "vs_1",
											"service": null,
											"vips": [
												"10.0.1.83"
											],
											"vports": [
												"80-88"
											],
											"pre_rules": [
												{
													"name": "pre-rule-1",
													"inherit_vs_service_chain": "ENABLE",
													"service_chain": "service_chain1_for_pre_rule"
												}
											]
										}
									]
								}
							]
						}
					}
				}
			}
		},
		"/api/ad/v3/slb/service-chain/all/associated-pre-rule": {
			"description": "获取所有服务链关联的前置策略列表信息",
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
					"service-chain-all-associated-pre-rule"
				],
				"summary": "get pre-rules associated with all service-chain",
				"description": "查看所有服务链关联的前置策略信息",
				"operationId": "all-service-chain-association",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_all_service_chain_associate_pre_rule_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get pre-rules associated with all service-chain",
						"description": "查看所有服务链关联的前置策略信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-chain/all/associated-pre-rule"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-chain/all/associated-pre-rule 响应",
						"description": "返回GET /api/ad/v3/slb/service-chain/all/associated-pre-rule的响应数据",
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
									"service_chain_name": "service_chain_1",
									"associated_pre_rule": [
										{
											"name": "pre-rule-1",
											"service": "FTP",
											"inherit_vs_service_chain": "ENABLE",
											"associated_vs": [
												{
													"name": "vs_1",
													"service_chain": "service_chain1"
												}
											]
										}
									]
								}
							]
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-CHAIN-CONFIG": {
			"name": "SERVICE-CHAIN-CONFIG",
			"in": "body",
			"required": true,
			"description": "服务链配置",
			"schema": {
				"$ref": "#/definitions/config.service_chain"
			}
		},
		"SERVICE-CHAIN-PROPERTY": {
			"name": "SERVICE-CHAIN-PROPERTY",
			"in": "body",
			"required": true,
			"description": "服务链属性",
			"schema": {
				"$ref": "#/definitions/config.service_chain"
			}
		}
	},
	"responses": {
		"operation_config_service_chain_list": {
			"description": "服务链配置列表",
			"schema": {
				"$ref": "#/definitions/config.service_chain_list"
			}
		},
		"operation_config_service_chain_object": {
			"description": "服务链配置对象",
			"schema": {
				"$ref": "#/definitions/config.service_chain"
			}
		},
		"operation_config_service_chain_associate_vs_list": {
			"description": "服务链配置关联的虚拟服务列表",
			"schema": {
				"$ref": "#/definitions/config.service_chain_associated_vs_list"
			}
		},
		"operation_config_service_chain_associate_pre_rule_list": {
			"description": "服务链配置关联的前置策略列表",
			"schema": {
				"$ref": "#/definitions/config.service_chain_associated_pre_rule_list"
			}
		},
		"operation_config_all_service_chain_associate_vs_list": {
			"description": "所有服务链配置关联的虚拟服务列表",
			"schema": {
				"$ref": "#/definitions/config.service_chain_all_associated_vs_list"
			}
		},
		"operation_config_all_service_chain_associate_pre_rule_list": {
			"description": "所有服务链配置关联的前置策略列表",
			"schema": {
				"$ref": "#/definitions/config.service_chain_all_associated_pre_rule_list"
			}
		}
	},
	"definitions": {
		"config.service_chain_list": {
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
						"$ref": "#/definitions/config.service_chain"
					}
				}
			}
		},
		"config.service_chain": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "服务链名称",
					"type": "string",
					"example": "service_chain_1"
				},
				"description": {
					"description": "服务链描述信息",
					"type": "string"
				},
				"security_pool": {
					"description": "属于当前服务链的安全资源池列表",
					"type": "array",
					"items": {
						"type": "string",
						"description": "安全资源池，即选择构成服务链的安全资源池",
						"example": "WAF_POOL"
					}
				}
			}
		},
		"config.service_chain_associated_vs_list": {
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
						"type": "object",
						"description": "服务链关联的虚拟服务的相关信息",
						"properties": {
							"name": {
								"description": "虚拟服务的名称",
								"type": "string",
								"example": "vs_1"
							},
							"service": {
								"description": "虚拟服务类型",
								"$ref": "/api/{common}.yaml#/definitions/config.service_type",
								"default": "HTTP"
							},
							"vips": {
								"description": "虚拟服务VIP地址",
								"type": "array",
								"items": {
									"description": "指定虚拟服务对外发布的 ip 地址信息, 支持单个 ip 和网络子网格式。",
									"type": "string"
								},
								"maxItems": 32,
								"minItems": 1,
								"example": [
									"10.0.1.83",
									"200.200.145.96"
								]
							},
							"vports": {
								"description": "虚拟服务端口",
								"type": "array",
								"items": {
									"description": "指定虚拟服务对外发布的端口信息, 支持单个端口 (如:80) 和端口范围 (如:90-91)。",
									"type": "string"
								},
								"maxItems": 16,
								"minItems": 1,
								"example": [
									"80-88",
									"8080"
								]
							},
							"pre_rules": {
								"description": "虚拟服务关联的前置策略列表",
								"type": "array",
								"items": {
									"description": "虚拟服务关联的前置策略",
									"type": "object",
									"properties": {
										"name": {
											"description": "前置策略的名称",
											"type": "string",
											"example": "pre-rule-1"
										},
										"inherit_vs_service_chain": {
											"type": "string",
											"description": "继承虚拟服务的服务链",
											"enum": [
												"ENABLE",
												"DISABLE"
											],
											"default": "ENABLE",
											"example": "ENABLE"
										},
										"service_chain": {
											"type": "string",
											"description": "指定当前前置策略的服务链，仅当inherit_vs_service_chain为DISABLE时生效",
											"example": "service_chain1_for_pre_rule"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"config.service_chain_associated_pre_rule_list": {
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
						"type": "object",
						"description": "服务链关联的前置策略的相关信息",
						"properties": {
							"name": {
								"description": "前置策略的名称",
								"type": "string",
								"example": "pre-rule-1"
							},
							"service": {
								"description": "前置策略的类型",
								"type": "string",
								"enum": [
									8583,
									"L3",
									"Any",
									"TCP",
									"TCP-L7",
									"UDP",
									"UDP-L7",
									"HTTP",
									"HTTPS",
									"SSL",
									"RADIUS",
									"SIP",
									"DNS",
									"FTP",
									"DNS-TCP",
									"DNS-UDP"
								],
								"default": "FTP"
							},
							"inherit_vs_service_chain": {
								"type": "string",
								"description": "是否继承虚拟服务的服务链",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"default": "ENABLE",
								"example": "ENABLE"
							},
							"associated_vs": {
								"description": "关联此前置策略的虚拟服务列表",
								"type": "array",
								"items": {
									"description": "关联此前置策略的虚拟服务",
									"type": "object",
									"properties": {
										"name": {
											"description": "虚拟服务的名字",
											"type": "string",
											"example": "vs_1"
										},
										"service_chain": {
											"description": "虚拟服务关联的安全服务链。",
											"type": "string",
											"example": "service_chain1"
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"config.service_chain_all_associated_vs_list": {
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
						"type": "object",
						"properties": {
							"service_chain_name": {
								"description": "服务链的名称",
								"type": "string",
								"example": "service_chain_1"
							},
							"associated_vs": {
								"type": "array",
								"description": "服务链关联的虚拟服务的相关信息",
								"items": {
									"type": "object",
									"properties": {
										"name": {
											"description": "虚拟服务的名称",
											"type": "string",
											"example": "vs_1"
										},
										"service": {
											"description": "虚拟服务类型",
											"$ref": "/api/{common}.yaml#/definitions/config.service_type",
											"default": "HTTP"
										},
										"vips": {
											"description": "虚拟服务VIP地址",
											"type": "array",
											"items": {
												"description": "指定虚拟服务对外发布的 ip 地址信息, 支持单个 ip 和网络子网格式。",
												"type": "string"
											},
											"maxItems": 32,
											"minItems": 1,
											"example": [
												"10.0.1.83",
												"200.200.145.96"
											]
										},
										"vports": {
											"description": "虚拟服务端口",
											"type": "array",
											"items": {
												"description": "指定虚拟服务对外发布的端口信息, 支持单个端口 (如:80) 和端口范围 (如:90-91)。",
												"type": "string"
											},
											"maxItems": 16,
											"minItems": 1,
											"example": [
												"80-88",
												"8080"
											]
										},
										"pre_rules": {
											"description": "虚拟服务关联的前置策略列表",
											"type": "array",
											"items": {
												"description": "虚拟服务关联的前置策略",
												"type": "object",
												"properties": {
													"name": {
														"description": "前置策略的名称",
														"type": "string",
														"example": "pre-rule-1"
													},
													"inherit_vs_service_chain": {
														"type": "string",
														"description": "继承虚拟服务的服务链",
														"enum": [
															"ENABLE",
															"DISABLE"
														],
														"default": "ENABLE",
														"example": "ENABLE"
													},
													"service_chain": {
														"type": "string",
														"description": "指定当前前置策略的服务链，仅当inherit_vs_service_chain为DISABLE时生效",
														"example": "service_chain1_for_pre_rule"
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		},
		"config.service_chain_all_associated_pre_rule_list": {
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
						"type": "object",
						"properties": {
							"service_chain_name": {
								"description": "服务链的名称",
								"type": "string",
								"example": "service_chain_1"
							},
							"associated_pre_rule": {
								"type": "array",
								"description": "服务链关联的前置策略的相关信息",
								"items": {
									"type": "object",
									"properties": {
										"name": {
											"description": "前置策略的名称",
											"type": "string",
											"example": "pre-rule-1"
										},
										"service": {
											"description": "前置策略的类型",
											"type": "string",
											"enum": [
												8583,
												"L3",
												"Any",
												"TCP",
												"TCP-L7",
												"UDP",
												"UDP-L7",
												"HTTP",
												"HTTPS",
												"SSL",
												"RADIUS",
												"SIP",
												"DNS",
												"FTP",
												"DNS-TCP",
												"DNS-UDP"
											],
											"default": "FTP"
										},
										"inherit_vs_service_chain": {
											"type": "string",
											"description": "是否继承虚拟服务的服务链",
											"enum": [
												"ENABLE",
												"DISABLE"
											],
											"default": "ENABLE",
											"example": "ENABLE"
										},
										"associated_vs": {
											"description": "关联此前置策略的虚拟服务列表",
											"type": "array",
											"items": {
												"description": "关联此前置策略的虚拟服务",
												"type": "object",
												"properties": {
													"name": {
														"description": "虚拟服务的名字",
														"type": "string",
														"example": "vs_1"
													},
													"service_chain": {
														"description": "虚拟服务关联的安全服务链。",
														"type": "string",
														"example": "service_chain1"
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}