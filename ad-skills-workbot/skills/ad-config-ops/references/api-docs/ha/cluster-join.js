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
		"/api/ad/v3/ha/cluster-join": {
			"description": "加入集群相关操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"cluster-join"
				],
				"summary": " cluster-join",
				"description": "加入集群",
				"operationId": "create_cluster_join",
				"parameters": [
					{
						"$ref": "#/parameters/CLUSTER-JOIN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/ha/cluster.yaml#/responses/operation_config_cluster_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": " cluster-join",
						"description": "加入集群",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/ha/cluster-join",
							"body": {
								"cluster_ha_address": "10.0.1.1",
								"cluster_username": "admin",
								"ha": {
									"interface": {
										"type": "PHYSICAL",
										"interface": "bond-134"
									},
									"address": "10.0.1.2/24"
								},
								"weight_in_diff_platform": 1,
								"alternate_ha": {
									"interface": {
										"type": "PHYSICAL",
										"interface": "bond-134"
									},
									"address": "200.0.0.2/24"
								}
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/ha/cluster-join 响应",
						"description": "返回POST /api/ad/v3/ha/cluster-join的响应数据",
						"value": {
							"state": "ENABLE",
							"heartbeat_timeout_ms": 6000,
							"heartbeat_interval_ms": 100,
							"ha": {
								"interface": {
									"type": "PHYSICAL",
									"interface": "bond-134"
								},
								"address": "10.0.1.1/24",
								"gateway": "10.0.1.100"
							},
							"alternate_ha": {
								"interface": {
									"type": "PHYSICAL",
									"interface": "bond-134"
								},
								"address": "200.0.0.1/24",
								"gateway": "200.0.0.100"
							},
							"brain_split_detect": {
								"state": "DISABLE",
								"link": "wan_1"
							},
							"username": "admin",
							"password": "admin",
							"pk_password": "example_string",
							"cluster_ip": "10.0.0.1/24",
							"openad_net_check_flat": "DISABLE",
							"openad_net_check_vlan": "DISABLE",
							"openad_net_check_vxlan": "DISABLE",
							"weight_in_diff_platform": 1
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify ha cluster-join cluster_ha_address 12.12.12.11 cluster_username admin cluster_password 123456 ha { interface { type physical interface NET1 } address 12.12.12.12/24 } alternate_ha { interface { type bond interface bond1 } address 2.2.2.2/24 }",
					"description": "加入集群，集群内某一台设备的主心跳IP为12.12.12.11，集群设备用户名为admin，密码为123456，当前设备主心跳口引用物理口NET1，主心跳IP为12.12.12.12/24，备份心跳口引用bond口bond1，备份心跳口IP地址为2.2.2.2/24"
				}
			]
		}
	},
	"parameters": {
		"CLUSTER-JOIN-CONFIG": {
			"name": "CLUSTER-JOIN-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.cluster_join"
			}
		}
	},
	"definitions": {
		"config.cluster_join": {
			"type": "object",
			"required": [
				"cluster_ha_address",
				"cluster_username",
				"ha",
				"alternate_ha"
			],
			"properties": {
				"cluster_ha_address": {
					"description": "集群主心跳IP，填写要加入的集群内任意一台在线设备的主心跳口IP即可",
					"type": "string",
					"example": "10.0.1.1"
				},
				"cluster_username": {
					"description": "集群用户名，填写要加入的集群内具有高可用权限的用户的用户名",
					"type": "string",
					"example": "admin"
				},
				"cluster_password": {
					"description": "集群用户密码，填写要加入的集群内具有高可用权限的用户的用户密码",
					"type": "string",
					"example": "admin"
				},
				"pk_cluster_password": {
					"description": "加密集群用户密码",
					"type": "string"
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
									"description": "主心跳类型，可选择physical、bond、bridge、vlan，加入双机心跳口类型需要和主机保持一致",
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
									"description": "主心跳口网口，根据对应类型可选择对应的网口，加入双机的心跳口需要和主机保持一致，当使用逻辑口时，逻辑口的引用关系也要一致",
									"type": "string",
									"example": "bond-134"
								}
							}
						},
						"address": {
							"description": "主心跳口IP，IP/掩码格式",
							"type": "string",
							"example": "10.0.1.2/24"
						},
						"gateway": {
							"description": "主心跳口路由网关，可通过配置路由网关来组建跨三层集群",
							"type": "string",
							"example": "10.0.1.100"
						}
					}
				},
				"weight_in_diff_platform": {
					"description": "异构集群中本地设备的权重",
					"type": "integer",
					"default": 1,
					"maximum": 100,
					"minimum": 1,
					"example": 10
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
							"example": "200.0.0.2/24"
						},
						"gateway": {
							"description": "备心跳口路由网关，可通过配置路由网关来组建跨三层集群",
							"type": "string",
							"example": "200.0.0.100"
						}
					}
				}
			}
		}
	}
}