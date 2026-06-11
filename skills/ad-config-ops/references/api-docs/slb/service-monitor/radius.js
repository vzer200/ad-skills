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
		"/api/ad/v3/slb/service-monitor/radius/": {
			"description": "新建、查看监视器（RADIUS）配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get all service-monitor-radius",
				"description": "查看当前已有的监视器（RADIUS）配置信息",
				"operationId": "get_service_monitor_radius_list",
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
						"$ref": "#/responses/operation_config_service_monitor_radius_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor-radius",
						"description": "查看当前已有的监视器（RADIUS）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/radius/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/radius/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/radius/的响应数据",
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
									"name": "radius",
									"description": "example_string",
									"type": "RADIUS",
									"timeout": 31,
									"interval": 10,
									"err_interval": 2,
									"err_interval_state": "DISABLE",
									"host": "*",
									"port": 0,
									"debug_mode": "DISABLE",
									"gateway_detect": "DISABLE",
									"radius_type": "ACCESS-REQUEST",
									"shared_secret": "",
									"encrypted_shared_secret": "A1B2C3D4",
									"pk_shared_secret": "A1B2C3D4",
									"username": "xx_123456",
									"password": "",
									"pk_password": "A1B2C3D4",
									"encrypted_password": "A1B2C3D4",
									"radius_authenticate_method": "PAP",
									"radius_attributes": [
										{
											"id": 255,
											"type": "TEXT",
											"value": ""
										}
									]
								}
							]
						}
					}
				}
			},
			"post": {
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-radius",
				"description": "新建一个监视器（RADIUS）配置",
				"operationId": "add_service_monitor_radius_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-RADIUS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_radius_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-radius",
						"description": "新建一个监视器（RADIUS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/radius/",
							"body": {
								"name": "AI_radius_radius_A",
								"type": "RADIUS",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"radius_type": "ACCESS-REQUEST",
								"username": "xx_123456",
								"radius_authenticate_method": "PAP",
								"shared_secret": "radius_secret_123",
								"password": "Passw0rd!"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/radius/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/radius/的响应数据",
						"value": {
							"name": "AI_radius_radius_A",
							"description": "example_string",
							"type": "RADIUS",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"radius_type": "ACCESS-REQUEST",
							"shared_secret": "",
							"encrypted_shared_secret": "A1B2C3D4",
							"pk_shared_secret": "A1B2C3D4",
							"username": "xx_123456",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"radius_authenticate_method": "PAP",
							"radius_attributes": [
								{
									"id": 255,
									"type": "TEXT",
									"value": ""
								}
							]
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor radius radiusmonitor description Radius监视器 radius_type access-request radius_authenticate_method chap username test password testpw shared_secret 45678 radius_attributes add [ { id 4 type ipv4 value 10.10.10.10} { id 24 type text value abcd } ]",
					"description": "新建radius类型的监视器radiusmonitor,采用chap方式进行认证请求,用户名为test,密码为testpw,密钥为45678,携带属性NAS-IP-Address和State"
				},
				{
					"command": "modify slb service-monitor radius radiusmonitor radius_attributes delete [ { id 4 type ipv4 value 10.10.10.10}]",
					"description": "删除radiusmonitor的NAS-IP-Address属性"
				},
				{
					"command": "list slb service-monitor radius radiusmonitor",
					"description": "查看Radius监视器radiusmonitor的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/radius/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（RADIUS）配置",
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
					"$ref": "/api/{common}.yaml#/parameters/netns"
				}
			],
			"get": {
				"tags": [
					"service-monitor"
				],
				"summary": "get specific service-monitor-radius",
				"description": "查看指定的监视器（RADIUS）配置",
				"operationId": "get_service_monitor_radius",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_radius_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor-radius",
						"description": "查看指定的监视器（RADIUS）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/radius/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/radius/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/radius/{name}的响应数据",
						"value": {
							"name": "radius",
							"description": "example_string",
							"type": "RADIUS",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"radius_type": "ACCESS-REQUEST",
							"shared_secret": "",
							"encrypted_shared_secret": "A1B2C3D4",
							"pk_shared_secret": "A1B2C3D4",
							"username": "xx_123456",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"radius_authenticate_method": "PAP",
							"radius_attributes": [
								{
									"id": 255,
									"type": "TEXT",
									"value": ""
								}
							]
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-radius",
				"description": "新建指定的监视器（RADIUS）配置",
				"operationId": "create_service_monitor_radius",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-RADIUS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_radius_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-radius",
						"description": "新建指定的监视器（RADIUS）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/radius/{name}",
							"body": {
								"name": "AI_radius_radius_B",
								"type": "RADIUS",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"radius_type": "ACCESS-REQUEST",
								"username": "xx_123456",
								"radius_authenticate_method": "PAP",
								"shared_secret": "radius_secret_123",
								"password": "Passw0rd!"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/radius/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/radius/{name}的响应数据",
						"value": {
							"name": "AI_radius_radius_B",
							"description": "example_string",
							"type": "RADIUS",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"radius_type": "ACCESS-REQUEST",
							"shared_secret": "",
							"encrypted_shared_secret": "A1B2C3D4",
							"pk_shared_secret": "A1B2C3D4",
							"username": "xx_123456",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"radius_authenticate_method": "PAP",
							"radius_attributes": [
								{
									"id": 255,
									"type": "TEXT",
									"value": ""
								}
							]
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-radius",
				"description": "修改指定的监视器（RADIUS）配置",
				"operationId": "replace_service_monitor_radius",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-RADIUS-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_radius_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-monitor-radius",
						"description": "修改指定的监视器（RADIUS）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-monitor/radius/{name}",
							"body": {
								"name": "radius",
								"type": "RADIUS",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"radius_type": "ACCESS-REQUEST",
								"username": "xx_123456",
								"radius_authenticate_method": "PAP",
								"shared_secret": "radius_secret_123",
								"password": "Passw0rd!"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-monitor/radius/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-monitor/radius/{name}的响应数据",
						"value": {
							"name": "radius",
							"description": "example_string",
							"type": "RADIUS",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"radius_type": "ACCESS-REQUEST",
							"shared_secret": "",
							"encrypted_shared_secret": "A1B2C3D4",
							"pk_shared_secret": "A1B2C3D4",
							"username": "xx_123456",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"radius_authenticate_method": "PAP",
							"radius_attributes": [
								{
									"id": 255,
									"type": "TEXT",
									"value": ""
								}
							]
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-radius",
				"description": "修改指定的监视器（RADIUS）配置",
				"operationId": "edit_service_monitor_radius",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-RADIUS-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_radius_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-monitor-radius",
						"description": "修改指定的监视器（RADIUS）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-monitor/radius/{name}",
							"body": {
								"name": "radius",
								"type": "RADIUS",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"gateway_detect": "DISABLE",
								"radius_type": "ACCESS-REQUEST",
								"username": "xx_123456",
								"radius_authenticate_method": "PAP",
								"shared_secret": "radius_secret_123",
								"password": "Passw0rd!"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-monitor/radius/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-monitor/radius/{name}的响应数据",
						"value": {
							"name": "radius",
							"description": "example_string",
							"type": "RADIUS",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"radius_type": "ACCESS-REQUEST",
							"shared_secret": "",
							"encrypted_shared_secret": "A1B2C3D4",
							"pk_shared_secret": "A1B2C3D4",
							"username": "xx_123456",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"radius_authenticate_method": "PAP",
							"radius_attributes": [
								{
									"id": 255,
									"type": "TEXT",
									"value": ""
								}
							]
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-radius",
				"description": "删除指定的监视器（RADIUS）配置",
				"operationId": "delete_service_monitor_radius",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_radius_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-monitor-radius",
						"description": "删除指定的监视器（RADIUS）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-monitor/radius/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-monitor/radius/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-monitor/radius/{name}的响应数据",
						"value": {
							"name": "radius",
							"description": "example_string",
							"type": "RADIUS",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"gateway_detect": "DISABLE",
							"radius_type": "ACCESS-REQUEST",
							"shared_secret": "",
							"encrypted_shared_secret": "A1B2C3D4",
							"pk_shared_secret": "A1B2C3D4",
							"username": "xx_123456",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"radius_authenticate_method": "PAP",
							"radius_attributes": [
								{
									"id": 255,
									"type": "TEXT",
									"value": ""
								}
							]
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-RADIUS-CONFIG": {
			"name": "SERVICE-MONITOR-RADIUS-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_radius"
			}
		},
		"SERVICE-MONITOR-RADIUS-PROPERTY": {
			"name": "SERVICE-MONITOR-RADIUS-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_radius"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_radius_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_radius_list"
			}
		},
		"operation_config_service_monitor_radius_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_radius"
			}
		}
	},
	"definitions": {
		"config.service_monitor_radius_list": {
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
						"$ref": "#/definitions/config.service_monitor_radius"
					}
				}
			}
		},
		"config.service_monitor_radius": {
			"type": "object",
			"required": [
				"name",
				"username"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定监视器的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "radius"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "只读参数；监视器类型。",
					"type": "string",
					"enum": [
						"RADIUS"
					],
					"default": "RADIUS"
				},
				"timeout": {
					"description": "可选参数；设置监视超时时间。",
					"type": "integer",
					"default": 31,
					"minimum": 1,
					"maximum": 86400,
					"example": 16
				},
				"interval": {
					"description": "可选参数；设置监视间隔时间。",
					"type": "integer",
					"default": 10,
					"minimum": 1,
					"maximum": 86400,
					"example": 5
				},
				"err_interval": {
					"description": "故障间隔时间。",
					"type": "integer",
					"default": 2,
					"example": 2,
					"maximum": 86400,
					"minimum": 1
				},
				"err_interval_state": {
					"description": "故障间隔开关",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"host": {
					"description": "可选参数；支持ip地址和*;默认为*，表示监视节点池中的地址；当启用gateway_detect时必须指定ip地址",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "可选参数；指定监视端口；取值范围[0,65535]，默认为1812",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 1812
				},
				"debug_mode": {
					"description": "可选参数；调试模式开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"gateway_detect": {
					"description": "可选参数；透明监控开关，disable表示禁用，enable表示启用；默认禁用。",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"radius_type": {
					"description": "可选参数;指定请求类型，access-request表示认证请求,accounting-request表示计费请求;默认为access-request",
					"type": "string",
					"enum": [
						"ACCESS-REQUEST",
						"ACCOUNTING-REQUEST"
					],
					"default": "ACCESS-REQUEST",
					"example": "ACCESS-REQUEST"
				},
				"shared_secret": {
					"description": "必选参数;指定密钥",
					"passwdOnce": true,
					"type": "string",
					"minLength": 1,
					"maxLength": 64,
					"example": ""
				},
				"encrypted_shared_secret": {
					"description": "可选参数;已加密的密钥",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"pk_shared_secret": {
					"description": "密钥",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"username": {
					"description": "必选参数;指定radius的用户名",
					"type": "string",
					"maxLength": 253,
					"minLength": 1,
					"example": "xx_123456"
				},
				"password": {
					"description": "可选参数;指定radius用户的密码",
					"passwdOnce": true,
					"type": "string",
					"maxLength": 64,
					"example": ""
				},
				"pk_password": {
					"description": "密码",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"encrypted_password": {
					"description": "可选参数;radius用户的加密密码",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"radius_authenticate_method": {
					"description": "可选参数;指定radius的认证方式,默认为pap",
					"type": "string",
					"enum": [
						"PAP",
						"CHAP"
					],
					"default": "PAP",
					"example": "PAP"
				},
				"radius_attributes": {
					"description": "可选参数;指定radius监视时使用的属性字段,该参数为一个对象参数列表，可以通过add/delete进行添加属性对象；id指定属性ID，取值范围[1,255]；type指定属性类型；value指定属性的值，值类型需和type定义一致",
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"id": {
								"description": "必选参数;指定属性的ID",
								"type": "integer",
								"maximum": 255,
								"minimum": 1,
								"example": 255
							},
							"type": {
								"description": "必选参数;指定属性的类型",
								"type": "string",
								"enum": [
									"TEXT",
									"INTEGER",
									"HEXADECIMAL",
									"IPV4",
									"IPV6"
								],
								"default": "TEXT",
								"example": "TEXT"
							},
							"value": {
								"description": "必选参数;指定属性的值",
								"type": "string",
								"maxLength": 506,
								"minLength": 1,
								"example": ""
							}
						},
						"required": [
							"id",
							"type",
							"value"
						]
					},
					"maxItems": 32
				}
			}
		}
	}
}