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
		"/api/ad/v3/net/bond/": {
			"description": "端口聚合配置管理操作",
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
					"bond"
				],
				"summary": "get all bond",
				"description": "查看聚合接口配置",
				"operationId": "get_bond_list",
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
						"$ref": "#/responses/operation_config_bond_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all bond",
						"description": "查看聚合接口配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/net/bond/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/net/bond/ 响应",
						"description": "返回GET /api/ad/v3/net/bond/的响应数据",
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
									"name": "mybond0",
									"description": "example_string",
									"interfaces": [
										{
											"type": "PHYSICAL",
											"interface": "NET1",
											"slot": ""
										}
									],
									"aggregate_policy": "HASH",
									"hash_policy": "SRC-DST-IP-MAC",
									"8023ad_mode": "ACTIVE",
									"lacp_timeout": "LACP-FAST",
									"mtu": 1500,
									"device_name": "bond0"
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"bond"
				],
				"summary": "create new bond",
				"description": "新建聚合接口配置",
				"operationId": "add_bond_list",
				"parameters": [
					{
						"$ref": "#/parameters/BOND-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bond_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new bond",
						"description": "新建聚合接口配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/net/bond/",
							"body": {
								"name": "AI_mybond0_A",
								"hash_policy": "SRC-DST-IP-MAC",
								"8023ad_mode": "ACTIVE",
								"lacp_timeout": "LACP-FAST",
								"mtu": 1500
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/net/bond/ 响应",
						"description": "返回POST /api/ad/v3/net/bond/的响应数据",
						"value": {
							"name": "AI_mybond0_A",
							"description": "example_string",
							"interfaces": [
								{
									"type": "PHYSICAL",
									"interface": "NET1",
									"slot": ""
								}
							],
							"aggregate_policy": "HASH",
							"hash_policy": "SRC-DST-IP-MAC",
							"8023ad_mode": "ACTIVE",
							"lacp_timeout": "LACP-FAST",
							"mtu": 1500,
							"device_name": "bond0"
						}
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"bond"
				],
				"summary": "modify bond",
				"description": "修改聚合接口配置",
				"operationId": "edit_bond_list",
				"parameters": [
					{
						"$ref": "#/parameters/BOND-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bond_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify bond",
						"description": "修改聚合接口配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/net/bond/",
							"body": {
								"name": "mybond0",
								"hash_policy": "SRC-DST-IP-MAC",
								"8023ad_mode": "ACTIVE",
								"lacp_timeout": "LACP-FAST",
								"mtu": 1500
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/net/bond/ 响应",
						"description": "返回PATCH /api/ad/v3/net/bond/的响应数据",
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
									"name": "mybond0",
									"description": "example_string",
									"interfaces": [
										{
											"type": "PHYSICAL",
											"interface": "NET1",
											"slot": ""
										}
									],
									"aggregate_policy": "HASH",
									"hash_policy": "SRC-DST-IP-MAC",
									"8023ad_mode": "ACTIVE",
									"lacp_timeout": "LACP-FAST",
									"mtu": 1500,
									"device_name": "bond0"
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list net bond",
					"description": "获取所有bond口"
				},
				{
					"command": "create net bond mybond interfaces add [ { type physical interface NET1 } { type physical interface NET2 } ] aggregate_policy hash mtu 1500 ",
					"description": "创建bond口: 名称为mybond，聚合物理网口NE1和NET2，聚合策略为哈希，mtu设为1500"
				},
				{
					"command": "modify net bond mybond interfaces add [ { interface NET5 type physical } ]",
					"description": "为名称为mybond的bond口添加一个聚合子接口NET5"
				},
				{
					"command": "delete net bond mybond ",
					"description": "删除名称为mybond的bond口"
				}
			]
		},
		"/api/ad/v3/net/bond/{name}": {
			"description": "端口聚合配置管理操作",
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
					"bond"
				],
				"summary": "get specific bond",
				"description": "查看指定聚合接口配置",
				"operationId": "get_bond",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bond_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific bond",
						"description": "查看指定聚合接口配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/net/bond/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/net/bond/{name} 响应",
						"description": "返回GET /api/ad/v3/net/bond/{name}的响应数据",
						"value": {
							"name": "mybond0",
							"description": "example_string",
							"interfaces": [
								{
									"type": "PHYSICAL",
									"interface": "NET1",
									"slot": ""
								}
							],
							"aggregate_policy": "HASH",
							"hash_policy": "SRC-DST-IP-MAC",
							"8023ad_mode": "ACTIVE",
							"lacp_timeout": "LACP-FAST",
							"mtu": 1500,
							"device_name": "bond0"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"bond"
				],
				"summary": "create new bond",
				"description": "新建聚合接口配置",
				"operationId": "create_bond",
				"parameters": [
					{
						"$ref": "#/parameters/BOND-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bond_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new bond",
						"description": "新建聚合接口配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/net/bond/{name}",
							"body": {
								"name": "AI_mybond0_B",
								"hash_policy": "SRC-DST-IP-MAC",
								"8023ad_mode": "ACTIVE",
								"lacp_timeout": "LACP-FAST",
								"mtu": 1500
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/net/bond/{name} 响应",
						"description": "返回POST /api/ad/v3/net/bond/{name}的响应数据",
						"value": {
							"name": "AI_mybond0_B",
							"description": "example_string",
							"interfaces": [
								{
									"type": "PHYSICAL",
									"interface": "NET1",
									"slot": ""
								}
							],
							"aggregate_policy": "HASH",
							"hash_policy": "SRC-DST-IP-MAC",
							"8023ad_mode": "ACTIVE",
							"lacp_timeout": "LACP-FAST",
							"mtu": 1500,
							"device_name": "bond0"
						}
					}
				}
			},
			"put": {
				"tags": [
					"bond"
				],
				"summary": "replace specific bond",
				"description": "替换指定聚合接口配置",
				"operationId": "replace_bond",
				"parameters": [
					{
						"$ref": "#/parameters/BOND-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bond_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific bond",
						"description": "替换指定聚合接口配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/net/bond/{name}",
							"body": {
								"name": "mybond0",
								"hash_policy": "SRC-DST-IP-MAC",
								"8023ad_mode": "ACTIVE",
								"lacp_timeout": "LACP-FAST",
								"mtu": 1500
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/net/bond/{name} 响应",
						"description": "返回PUT /api/ad/v3/net/bond/{name}的响应数据",
						"value": {
							"name": "mybond0",
							"description": "example_string",
							"interfaces": [
								{
									"type": "PHYSICAL",
									"interface": "NET1",
									"slot": ""
								}
							],
							"aggregate_policy": "HASH",
							"hash_policy": "SRC-DST-IP-MAC",
							"8023ad_mode": "ACTIVE",
							"lacp_timeout": "LACP-FAST",
							"mtu": 1500,
							"device_name": "bond0"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"bond"
				],
				"summary": "modify specific bond",
				"description": "修改指定聚合接口配置",
				"operationId": "edit_bond",
				"parameters": [
					{
						"$ref": "#/parameters/BOND-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bond_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific bond",
						"description": "修改指定聚合接口配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/net/bond/{name}",
							"body": {
								"name": "mybond0",
								"hash_policy": "SRC-DST-IP-MAC",
								"8023ad_mode": "ACTIVE",
								"lacp_timeout": "LACP-FAST",
								"mtu": 1500
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/net/bond/{name} 响应",
						"description": "返回PATCH /api/ad/v3/net/bond/{name}的响应数据",
						"value": {
							"name": "mybond0",
							"description": "example_string",
							"interfaces": [
								{
									"type": "PHYSICAL",
									"interface": "NET1",
									"slot": ""
								}
							],
							"aggregate_policy": "HASH",
							"hash_policy": "SRC-DST-IP-MAC",
							"8023ad_mode": "ACTIVE",
							"lacp_timeout": "LACP-FAST",
							"mtu": 1500,
							"device_name": "bond0"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"bond"
				],
				"summary": "delete specific bond",
				"description": "删除指定聚合接口配置",
				"operationId": "delete_bond",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_bond_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific bond",
						"description": "删除指定聚合接口配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/net/bond/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/net/bond/{name} 响应",
						"description": "返回DELETE /api/ad/v3/net/bond/{name}的响应数据",
						"value": {
							"name": "mybond0",
							"description": "example_string",
							"interfaces": [
								{
									"type": "PHYSICAL",
									"interface": "NET1",
									"slot": ""
								}
							],
							"aggregate_policy": "HASH",
							"hash_policy": "SRC-DST-IP-MAC",
							"8023ad_mode": "ACTIVE",
							"lacp_timeout": "LACP-FAST",
							"mtu": 1500,
							"device_name": "bond0"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"BOND-CONFIG": {
			"name": "BOND-CONFIG",
			"in": "body",
			"required": true,
			"description": "端口聚合配置",
			"schema": {
				"$ref": "#/definitions/config.bond"
			}
		},
		"BOND-PROPERTY": {
			"name": "BOND-PROPERTY",
			"in": "body",
			"required": true,
			"description": "端口聚合属性",
			"schema": {
				"$ref": "#/definitions/config.bond"
			}
		}
	},
	"responses": {
		"operation_config_bond_list": {
			"description": "端口聚合配置列表",
			"schema": {
				"$ref": "#/definitions/config.bond_list"
			}
		},
		"operation_config_bond_object": {
			"description": "端口聚合配置对象",
			"schema": {
				"$ref": "#/definitions/config.bond"
			}
		}
	},
	"definitions": {
		"config.bond_list": {
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
						"$ref": "#/definitions/config.bond"
					}
				}
			}
		},
		"config.bond": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "必选参数；配置名称",
					"example": "mybond0",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"type": "string",
					"description": "可选参数；所创建bond口描述标签"
				},
				"interfaces": {
					"type": "array",
					"description": "必选参数；引用口配置",
					"items": {
						"description": "引用网口配置",
						"type": "object",
						"required": [
							"interface"
						],
						"properties": {
							"type": {
								"type": "string",
								"enum": [
									"PHYSICAL"
								],
								"description": "可选参数；绑定接口类型（physical-普通网口），唯一取值physical",
								"default": "PHYSICAL",
								"example": "PHYSICAL"
							},
							"interface": {
								"type": "string",
								"description": "必选参数；引用网络接口名称",
								"example": "NET2"
							},
							"slot": {
								"description": "slot",
								"type": "string",
								"default": "",
								"example": "slot1-2"
							}
						}
					},
					"example": [
						{
							"type": "PHYSICAL",
							"interface": "NET1"
						},
						{
							"type": "PHYSICAL",
							"interface": "NET2"
						}
					],
					"maxItems": 8,
					"minItems": 0
				},
				"aggregate_policy": {
					"type": "string",
					"enum": [
						"HASH",
						"ROUND-ROBIN",
						"8023AD",
						"ACTIVE-BACKUP"
					],
					"description": "可选参数；聚合绑定策略（hash:哈希/round-robin:轮询/8023ad:802.3ad/active-backup:冗余双网卡），默认值hash。",
					"example": "HASH"
				},
				"hash_policy": {
					"type": "string",
					"description": "可选参数；聚合策略为hash时，所采用的hash算法（dst-mac: 按目的mac哈希/src-dst-ip:按源ip和目的ip哈希/src-dst-ip-mac:按源ip+目的ip+源mac+目的mac哈希/src-dst-mac:按源mac和目的mac哈希），默认值src-dst-ip-mac",
					"enum": [
						"SRC-DST-IP-MAC",
						"SRC-DST-IP",
						"SRC-DST-MAC",
						"DST-MAC"
					],
					"default": "SRC-DST-IP-MAC",
					"example": "SRC-DST-IP-MAC"
				},
				"8023ad_mode": {
					"type": "string",
					"description": "可选参数；聚合策略为802.3ad时，所采用的模式（active-主动/passive-被动），默认值active",
					"enum": [
						"ACTIVE",
						"PASSIVE"
					],
					"default": "ACTIVE",
					"example": "ACTIVE"
				},
				"lacp_timeout": {
					"type": "string",
					"description": "bond口的lacp超时模式",
					"enum": [
						"LACP-SLOW",
						"LACP-FAST"
					],
					"default": "LACP-FAST",
					"example": "LACP-FAST"
				},
				"mtu": {
					"type": "integer",
					"description": "可选参数；mtu设置设备名称",
					"default": 1500,
					"example": 1500,
					"minimum": 576,
					"maximum": 1500
				},
				"device_name": {
					"type": "string",
					"description": "可选字段；bond设备名",
					"readOnly": true,
					"example": "bond0"
				}
			}
		}
	}
}