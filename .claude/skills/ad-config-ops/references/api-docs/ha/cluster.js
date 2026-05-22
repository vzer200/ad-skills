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
		"/api/ad/v3/ha/cluster": {
			"description": "集群配置相关操作",
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
					"cluster"
				],
				"summary": "get cluster",
				"description": "获取当前集群配置",
				"operationId": "get_cluster",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_cluster_object"
					}
				}
			},
			"put": {
				"tags": [
					"cluster"
				],
				"summary": "replace cluster",
				"description": "修改集群配置",
				"operationId": "replace_cluster",
				"parameters": [
					{
						"$ref": "#/parameters/CLUSTER-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_cluster_object"
					}
				}
			},
			"patch": {
				"tags": [
					"cluster"
				],
				"summary": "modify cluster",
				"description": "修改集群配置",
				"operationId": "edit_cluster",
				"parameters": [
					{
						"$ref": "#/parameters/CLUSTER-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_cluster_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list ha cluster",
					"description": "获取集群配置"
				},
				{
					"command": "modify ha cluster state enable ha { interface { type physical interface NET1 } address 123.123.123.123/24 gateway 123.123.123.124 } alternate_ha { interface { type bond interface bond1 } address 2.2.2.2/24 gateway 2.2.2.3 } brain_split_detect { state enable link LAN2 } heartbeat_timeout_ms 3000 heartbeat_interval_ms 300",
					"description": "创建集群，主心跳口引用物理口NET1，主心跳IP为123.123.123.123/24，主心跳口路由网关为123.123.123.124，备份心跳口引用bond口bond1，备份心跳口IP地址为100.100.100.100/24，备份心跳口路由网关为2.2.2.3，开启心跳口故障检测，检测网口为链路LAN2，心跳超时时间为3000毫秒，心跳间隔为300毫秒"
				},
				{
					"command": "modify ha cluster alternate_ha { interface { type physical interface NET2 } }",
					"description": "修改集群配置，修改备份心跳口类型为物理网口，引用NET2"
				},
				{
					"command": "modify ha cluster state disable username admin password ssssssss",
					"description": "禁用集群，需要验证用户名密码，输入用户admin，密码ssssssss"
				}
			]
		}
	},
	"parameters": {
		"CLUSTER-CONFIG": {
			"name": "CLUSTER-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.cluster"
			}
		},
		"CLUSTER-PROPERTY": {
			"name": "CLUSTER-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.cluster"
			}
		}
	},
	"responses": {
		"operation_config_cluster_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.cluster"
			}
		}
	},
	"definitions": {
		"config.cluster": {
			"type": "object",
			"properties": {
				"state": {
					"description": "集群的启禁用状态，enable表示启用，disable表示禁用",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"heartbeat_timeout_ms": {
					"description": "心跳超时时间，单位毫秒",
					"type": "integer",
					"default": 6000,
					"example": 400,
					"maximum": 10000,
					"minimum": 100
				},
				"heartbeat_interval_ms": {
					"description": "心跳间隔时间，单位毫秒",
					"type": "integer",
					"default": 100,
					"example": 200,
					"maximum": 10000,
					"minimum": 100
				},
				"ha": {
					"description": "必选参数，主心跳口",
					"type": "object",
					"required": [
						"interface",
						"address"
					],
					"properties": {
						"interface": {
							"description": "主心跳口网口",
							"type": "object",
							"required": [
								"interface"
							],
							"properties": {
								"type": {
									"description": "主心跳类型，可选择physical、bond、bridge、vlan",
									"type": "string",
									"enum": [
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE",
										"MACVLAN"
									],
									"default": "PHYSICAL",
									"example": "VLAN"
								},
								"interface": {
									"description": "主心跳口网口，根据对应类型可选择对应的网口",
									"type": "string",
									"example": "bond-134"
								}
							}
						},
						"address": {
							"description": "主心跳口IP，IP/掩码格式",
							"type": "string",
							"example": "10.0.1.1/24"
						},
						"gateway": {
							"description": "主心跳口路由网关，可通过配置路由网关来组建跨三层集群",
							"type": "string",
							"example": "10.0.1.100"
						}
					}
				},
				"alternate_ha": {
					"description": "必选参数，备心跳口",
					"type": "object",
					"required": [
						"interface",
						"address"
					],
					"properties": {
						"interface": {
							"description": "备心跳口网口",
							"type": "object",
							"required": [
								"interface"
							],
							"properties": {
								"type": {
									"description": "备心跳口类型，可选择physical、bond、bridge、vlan",
									"type": "string",
									"enum": [
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE",
										"MACVLAN"
									],
									"default": "PHYSICAL",
									"example": "VLAN"
								},
								"interface": {
									"description": "备心跳口网口，根据对应类型可选择对应的网口",
									"type": "string",
									"example": "bond-134"
								}
							}
						},
						"address": {
							"description": "备心跳口IP，IP/掩码格式，不能和主心跳IP同网段",
							"type": "string",
							"example": "200.0.0.1/24"
						},
						"gateway": {
							"description": "备心跳口路由网关，可通过配置路由网关来组建跨三层集群",
							"type": "string",
							"example": "200.0.0.100"
						}
					}
				},
				"brain_split_detect": {
					"description": "心跳口故障检测配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "心跳口故障检测开关，enable表示启用，disable表示禁用",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"link": {
							"description": "心跳口故障检测网口，不能喝主、备心跳口使用相同网口",
							"type": "string",
							"example": "wan_1"
						}
					}
				},
				"username": {
					"type": "string",
					"writeOnly": true,
					"description": "禁用集群时的权限校验，请填写具有高可用权限用户的用户名",
					"example": "admin"
				},
				"password": {
					"type": "string",
					"description": "禁用集群时的权限校验，请填写对应用户的密码",
					"writeOnly": true,
					"example": "admin"
				},
				"pk_password": {
					"description": "禁用集群时的权限校验，请填写对应用户的加密密码",
					"type": "string",
					"writeOnly": true
				},
				"cluster_ip": {
					"description": "集群管理IP，IP/MASK格式",
					"type": "string",
					"example": "10.0.0.1/24"
				},
				"openad_net_check_flat": {
					"description": "FLAT网口故障切换",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"openad_net_check_vlan": {
					"description": "VLAN网口故障切换",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"openad_net_check_vxlan": {
					"description": "VXLAN网口故障切换",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"weight_in_diff_platform": {
					"description": "异构集群中本地设备的权重",
					"type": "integer",
					"default": 1,
					"maximum": 100,
					"minimum": 1,
					"example": 10
				}
			}
		}
	}
}