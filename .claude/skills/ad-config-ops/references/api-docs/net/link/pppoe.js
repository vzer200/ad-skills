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
		"/api/ad/v3/net/link/pppoe/": {
			"description": "链路pppoe拨号设置管理操作",
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
					"link-pppoe"
				],
				"summary": "get all link-pppoe",
				"description": "查看链路pppoe拨号设置",
				"operationId": "get_link_pppoe_list",
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
						"$ref": "#/responses/operation_config_link_pppoe_list"
					}
				}
			},
			"post": {
				"tags": [
					"link-pppoe"
				],
				"summary": "create new link-pppoe",
				"description": "新建链路pppoe拨号设置",
				"operationId": "add_link_pppoe_list",
				"parameters": [
					{
						"$ref": "#/parameters/PPPOE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_pppoe_object"
					}
				}
			},
			"patch": {
				"deprecated": true,
				"tags": [
					"link-pppoe"
				],
				"summary": "modify link-pppoe",
				"description": "修改链路pppoe拨号设置",
				"operationId": "edit_link_pppoe_list",
				"parameters": [
					{
						"$ref": "#/parameters/PPPOE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_pppoe_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": " list net link pppoe",
					"description": "查看所有PPPoE拨号链路配置"
				},
				{
					"command": "create net link pppoe mypppoe100M interface { interface NET1 } downstream_bandwidth_mbps 100 upstream_bandwidth_mbps 50 username admin  password root1234 mtu 1492 auto_dial enable",
					"description": "创建mypppoe100M拨号链路:引用接口为NET1，下行带宽为100Mbps，上行带宽为50Mbps；拨号用户名为admin，密码为root1234；设置mtu为1492；启用掉线自动拨号功能"
				},
				{
					"command": "list net link pppoe mypppoe100M",
					"description": "查看拨号链路mypppoe100M配置"
				},
				{
					"command": " modify net link pppoe mypppoe100M echo_retransmission_interval 100 echo_retransmission_count 5",
					"description": "更新mypppoe100M拨号线路配置ECHO间隔时间为100s，ECHO重传次数为5次"
				},
				{
					"command": "delete net link pppoe mypppoe100M",
					"description": "删除PPPoE拨号线路mypppoe100M"
				}
			]
		},
		"/api/ad/v3/net/link/pppoe/{name}": {
			"description": "指定pppoe链路相关操作",
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
					"link-pppoe"
				],
				"summary": "get specific link-pppoe",
				"description": "查看指定链路pppoe拨号设置",
				"operationId": "get_link_pppoe",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_pppoe_object"
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"link-pppoe"
				],
				"summary": "create new link-pppoe",
				"description": "新建链路pppoe拨号设置",
				"operationId": "create_link_pppoe",
				"parameters": [
					{
						"$ref": "#/parameters/PPPOE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_pppoe_object"
					}
				}
			},
			"put": {
				"tags": [
					"link-pppoe"
				],
				"summary": "replace specific link-pppoe",
				"description": "替换指定链路pppoe拨号设置",
				"operationId": "replace_link_pppoe",
				"parameters": [
					{
						"$ref": "#/parameters/PPPOE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_pppoe_object"
					}
				}
			},
			"patch": {
				"tags": [
					"link-pppoe"
				],
				"summary": "modify specific link-pppoe",
				"description": "修改指定链路pppoe拨号设置",
				"operationId": "edit_link_pppoe",
				"parameters": [
					{
						"$ref": "#/parameters/PPPOE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_pppoe_object"
					}
				}
			},
			"delete": {
				"tags": [
					"link-pppoe"
				],
				"summary": "delete specific link-pppoe",
				"description": "删除指定链路pppoe拨号设置",
				"operationId": "delete_link_pppoe",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_link_pppoe_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PPPOE-CONFIG": {
			"name": "PPPOE-CONFIG",
			"in": "body",
			"required": true,
			"description": "链路pppoe拨号设置",
			"schema": {
				"$ref": "#/definitions/config.link_pppoe"
			}
		},
		"PPPOE-PROPERTY": {
			"name": "PPPOE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "链路pppoe拨号设置属性",
			"schema": {
				"$ref": "#/definitions/config.link_pppoe"
			}
		}
	},
	"responses": {
		"operation_config_link_pppoe_list": {
			"description": "链路pppoe拨号设置列表",
			"schema": {
				"$ref": "#/definitions/config.link_pppoe_list"
			}
		},
		"operation_config_link_pppoe_object": {
			"description": "链路pppoe拨号设置对象",
			"schema": {
				"$ref": "#/definitions/config.link_pppoe"
			}
		}
	},
	"definitions": {
		"config.link_pppoe_list": {
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
						"$ref": "#/definitions/config.link_pppoe"
					}
				}
			}
		},
		"config.link_pppoe": {
			"type": "object",
			"required": [
				"name",
				"interface",
				"username",
				"upstream_bandwidth_mbps",
				"downstream_bandwidth_mbps"
			],
			"properties": {
				"name": {
					"description": "必选参数；配置名称",
					"type": "string",
					"example": "wan_1",
					"maxLength": 511,
					"minLength": 1
				},
				"description": {
					"description": "可选参数；配置标签及备注描述信息",
					"type": "string"
				},
				"state": {
					"description": "可选参数；启/禁用（enable-启用/disable-禁用），默认值enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"type": {
					"description": "可选参数；类别（pppoe），默认值pppoe",
					"type": "string",
					"enum": [
						"PPPOE"
					],
					"default": "PPPOE",
					"example": "PPPOE"
				},
				"interface": {
					"description": "必选参数；网络接口",
					"type": "object",
					"required": [
						"interface"
					],
					"properties": {
						"type": {
							"description": "可选参数；接口类型（physical-物理口/bond-端口聚合/vlan-VLAN子接口），默认值physical",
							"type": "string",
							"enum": [
								"PHYSICAL",
								"BOND",
								"VLAN"
							],
							"default": "PHYSICAL",
							"example": "VLAN"
						},
						"interface": {
							"description": "必选参数；必须为已存在的未被占用的物理口、聚合口或者VLAN子接口",
							"type": "string",
							"example": "bond-134"
						}
					},
					"maxItems": 1,
					"minItems": 1
				},
				"username": {
					"type": "string",
					"description": "必选参数；用户名",
					"example": "123456789@ct.com",
					"maxLength": 63,
					"minLength": 1
				},
				"password": {
					"type": "string",
					"description": "可选参数，但与pk_password、encrypted_password三者必有其一；明文密码",
					"writeOnly": true,
					"example": "abcd1234",
					"maxLength": 63,
					"minLength": 1
				},
				"pk_password": {
					"type": "string",
					"description": "可选参数，但与password、encrypted_password三者必有其一；加密密码",
					"maxLength": 1024,
					"minLength": 1
				},
				"encrypted_password": {
					"type": "string",
					"description": "可选参数；指定配置中保存的已加密的加密密码",
					"example": "A1B2C3D4",
					"maxLength": 1024,
					"minLength": 1
				},
				"echo_retransmission_interval": {
					"type": "integer",
					"description": "可选参数；ECHO重传间隔时间（单位：秒），默认值80",
					"default": 80,
					"example": 80,
					"maximum": 240,
					"minimum": 20
				},
				"echo_retransmission_count": {
					"type": "integer",
					"description": "可选参数；ECHO重传次数（单位：次），默认值3",
					"default": 3,
					"example": 3,
					"maximum": 10,
					"minimum": 1
				},
				"auto_dial": {
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"description": "可选参数；断线自动拨号开关（enable-启用/disable-禁用），默认值enable",
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"auto_dial_interval": {
					"type": "integer",
					"description": "可选参数；自动拨号间隔（单位：次），默认值1",
					"default": 1,
					"example": 1,
					"maximum": 30,
					"minimum": 1
				},
				"mtu": {
					"type": "integer",
					"description": "可选参数；最大传输单元大小（单位：字节），默认值1492",
					"default": 1492,
					"example": 1492,
					"maximum": 1492,
					"minimum": 1276
				},
				"mac_address": {
					"type": "string",
					"description": "可选参数；MAC地址",
					"example": "00:90:0b:3c:33:18"
				},
				"auto_snat": {
					"description": "可选参数；自动SNAT（enable-启用/disable-禁用），默认值disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"upstream_bandwidth_mbps": {
					"description": "必选参数；WAN链路上行带宽（单位Mbps）",
					"type": "integer",
					"example": 100,
					"default": 1000,
					"maximum": 1000000,
					"minimum": 1
				},
				"upstream_busy_percent": {
					"description": "可选参数；WAN链路上行带宽繁忙比例，默认值80",
					"type": "integer",
					"default": 80,
					"example": 80,
					"maximum": 100,
					"minimum": 1
				},
				"downstream_bandwidth_mbps": {
					"description": "必选参数；WAN链路下行带宽（单位Mbps）",
					"type": "integer",
					"example": 100,
					"default": 1000,
					"maximum": 1000000,
					"minimum": 1
				},
				"downstream_busy_percent": {
					"description": "可选参数；WAN链路下行带宽繁忙比例，默认值80",
					"type": "integer",
					"default": 80,
					"example": 80,
					"maximum": 100,
					"minimum": 1
				},
				"monitors": {
					"description": "可选参数；链路健康检查列表",
					"type": "array",
					"items": {
						"description": "单个监视器配置",
						"type": "object",
						"required": [
							"monitor",
							"target_host"
						],
						"properties": {
							"monitor": {
								"description": "必选参数；引用的链路监视器配置名称",
								"type": "string",
								"example": "ping"
							},
							"target_host": {
								"description": "必选参数；检测目标主机",
								"type": "string",
								"example": "10.10.10.254",
								"maxLength": 255,
								"minLength": 1
							}
						}
					},
					"maxItems": 16
				},
				"cable_plugin_detect": {
					"description": "可选参数；插拔网线检测（enable-启用/disable-禁用），默认值disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				},
				"failsafe": {
					"description": "可选参数；零流量监测，双机/集群模式下才可配置",
					"type": "object",
					"properties": {
						"state": {
							"description": "可选参数；启禁用开关（enable-启用/disable-禁用），默认值disable",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "ENABLE"
						},
						"timeout": {
							"description": "可选参数；零流量检测超时时间，默认值120",
							"type": "integer",
							"default": 120,
							"example": 120,
							"maximum": 3600,
							"minimum": 10
						},
						"action": {
							"description": "可选参数；监测到无流量时的动作（failover-故障并切换/reboot-重启设备/restart-service-重启服务），默认值failover",
							"type": "string",
							"enum": [
								"FAILOVER",
								"RESTART-SERVICE",
								"REBOOT"
							],
							"default": "FAILOVER",
							"example": "FAILOVER"
						}
					}
				}
			}
		}
	}
}