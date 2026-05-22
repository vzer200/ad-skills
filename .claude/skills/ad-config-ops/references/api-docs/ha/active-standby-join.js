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
		"/api/ad/v3/ha/active-standby-join": {
			"description": "加入双机操作",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"post": {
				"tags": [
					"active-standby-join"
				],
				"summary": " active-standby-join",
				"description": "加入双机",
				"operationId": "create_active_standby_join",
				"parameters": [
					{
						"$ref": "#/parameters/ACTIVE-STANDBY-JOIN-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "/api/ha/active-standby.yaml#/responses/operation_config_active_standby_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify ha active-standby-join host_name dev_B ha { interface { type physical interface NET1 } address 12.12.12.12/24 } alternate_ha { interface { type bond interface bond1 } address 2.2.2.2/24 }",
					"description": "加入双机，设置设备名称为dev_B，主心跳口引用物理口NET1，主心跳IP为12.12.12.12/24，备份心跳口引用bond口bond1，备份心跳口IP地址为2.2.2.2/24，其他配置使用默认配置"
				}
			]
		}
	},
	"parameters": {
		"ACTIVE-STANDBY-JOIN-CONFIG": {
			"name": "ACTIVE-STANDBY-JOIN-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.active_standby_join"
			}
		}
	},
	"definitions": {
		"config.active_standby_join": {
			"type": "object",
			"properties": {
				"host_name": {
					"description": "设备名称",
					"type": "string",
					"example": "dc-1",
					"maxLength": 63,
					"minLength": 1
				},
				"ha": {
					"description": "必选参数，主心跳口",
					"type": "object",
					"required": [
						"interface"
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
										"MACVLAN",
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE"
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
							"description": "主心跳口IP，IP/掩码格式，必须和主机的主心跳IP为同网段IP",
							"type": "string",
							"example": "10.0.1.2/30"
						}
					}
				},
				"alternate_ha": {
					"description": "必选参数，备心跳口",
					"type": "object",
					"required": [
						"interface"
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
										"MACVLAN",
										"PHYSICAL",
										"BOND",
										"VLAN",
										"BRIDGE"
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
							"example": "200.0.0.2/30"
						}
					}
				}
			}
		}
	}
}