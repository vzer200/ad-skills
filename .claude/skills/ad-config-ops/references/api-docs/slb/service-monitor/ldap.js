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
		"/api/ad/v3/slb/service-monitor/ldap/": {
			"description": "新建、查看监视器（LDAP）配置",
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
				"summary": "get all service-monitor-ldap",
				"description": "查看当前已有的监视器（LDAP）配置信息",
				"operationId": "get_service_monitor_ldap_list",
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
						"$ref": "#/responses/operation_config_service_monitor_ldap_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get all service-monitor-ldap",
						"description": "查看当前已有的监视器（LDAP）配置信息",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/ldap/"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/ldap/ 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/ldap/的响应数据",
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
									"name": "http",
									"description": "example_string",
									"type": "LDAP",
									"timeout": 31,
									"interval": 10,
									"err_interval": 2,
									"err_interval_state": "DISABLE",
									"host": "*",
									"port": 0,
									"debug_mode": "DISABLE",
									"username": "admin",
									"password": "",
									"pk_password": "A1B2C3D4",
									"encrypted_password": "A1B2C3D4",
									"base_dn": "",
									"search_filter": "",
									"secure": "NONE",
									"mandatory_attributes": "DISABLE",
									"chase_referrals": "ENABLE"
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
				"summary": "create new service-monitor-ldap",
				"description": "新建一个监视器（LDAP）配置",
				"operationId": "add_service_monitor_ldap_list",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-LDAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ldap_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-ldap",
						"description": "新建一个监视器（LDAP）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/ldap/",
							"body": {
								"name": "AI_http_ldap_A",
								"type": "LDAP",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"secure": "NONE",
								"mandatory_attributes": "DISABLE",
								"chase_referrals": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/ldap/ 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/ldap/的响应数据",
						"value": {
							"name": "AI_http_ldap_A",
							"description": "example_string",
							"type": "LDAP",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"username": "admin",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"base_dn": "",
							"search_filter": "",
							"secure": "NONE",
							"mandatory_attributes": "DISABLE",
							"chase_referrals": "ENABLE"
						}
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "create slb service-monitor ldap ldapmonitor base_dn dc=sangfor,dc=com,dc=cn chase_referrals enable mandatory_attributes enable username test password test secure tls search_filter xxxx",
					"description": "新建ldap类型的监视器ldapmonitor,监视base_dn为dc=sangfor,dc=com,dc=cn;指定搜索ldap的密钥为xxxx等"
				},
				{
					"command": "modify slb service-monitor ldap ldapmonitor secure none",
					"description": "修改ldap监视器ldapmonitor不使用安全加密"
				},
				{
					"command": "list slb service-monitor ldap ldapmonitor",
					"description": "查看ldap监视器ldapmonitor的配置信息"
				}
			]
		},
		"/api/ad/v3/slb/service-monitor/ldap/{name}": {
			"description": "新建、查看、修改、删除指定的监视器（LDAP）配置",
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
				"summary": "get specific service-monitor-ldap",
				"description": "查看指定的监视器（LDAP）配置",
				"operationId": "get_service_monitor_ldap",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ldap_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific service-monitor-ldap",
						"description": "查看指定的监视器（LDAP）配置",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/slb/service-monitor/ldap/{name}"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/slb/service-monitor/ldap/{name} 响应",
						"description": "返回GET /api/ad/v3/slb/service-monitor/ldap/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "LDAP",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"username": "admin",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"base_dn": "",
							"search_filter": "",
							"secure": "NONE",
							"mandatory_attributes": "DISABLE",
							"chase_referrals": "ENABLE"
						}
					}
				}
			},
			"post": {
				"deprecated": true,
				"tags": [
					"service-monitor"
				],
				"summary": "create new service-monitor-ldap",
				"description": "新建指定的监视器（LDAP）配置",
				"operationId": "create_service_monitor_ldap",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-LDAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ldap_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "create new service-monitor-ldap",
						"description": "新建指定的监视器（LDAP）配置",
						"value": {
							"method": "POST",
							"path": "/api/ad/v3/slb/service-monitor/ldap/{name}",
							"body": {
								"name": "AI_http_ldap_B",
								"type": "LDAP",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"secure": "NONE",
								"mandatory_attributes": "DISABLE",
								"chase_referrals": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "POST /api/ad/v3/slb/service-monitor/ldap/{name} 响应",
						"description": "返回POST /api/ad/v3/slb/service-monitor/ldap/{name}的响应数据",
						"value": {
							"name": "AI_http_ldap_B",
							"description": "example_string",
							"type": "LDAP",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"username": "admin",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"base_dn": "",
							"search_filter": "",
							"secure": "NONE",
							"mandatory_attributes": "DISABLE",
							"chase_referrals": "ENABLE"
						}
					}
				}
			},
			"put": {
				"tags": [
					"service-monitor"
				],
				"summary": "replace specific service-monitor-ldap",
				"description": "修改指定的监视器（LDAP）配置",
				"operationId": "replace_service_monitor_ldap",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-LDAP-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ldap_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "replace specific service-monitor-ldap",
						"description": "修改指定的监视器（LDAP）配置",
						"value": {
							"method": "PUT",
							"path": "/api/ad/v3/slb/service-monitor/ldap/{name}",
							"body": {
								"name": "http",
								"type": "LDAP",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"secure": "NONE",
								"mandatory_attributes": "DISABLE",
								"chase_referrals": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PUT /api/ad/v3/slb/service-monitor/ldap/{name} 响应",
						"description": "返回PUT /api/ad/v3/slb/service-monitor/ldap/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "LDAP",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"username": "admin",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"base_dn": "",
							"search_filter": "",
							"secure": "NONE",
							"mandatory_attributes": "DISABLE",
							"chase_referrals": "ENABLE"
						}
					}
				}
			},
			"patch": {
				"tags": [
					"service-monitor"
				],
				"summary": "modify specific service-monitor-ldap",
				"description": "修改指定的监视器（LDAP）配置",
				"operationId": "edit_service_monitor_ldap",
				"parameters": [
					{
						"$ref": "#/parameters/SERVICE-MONITOR-LDAP-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ldap_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "modify specific service-monitor-ldap",
						"description": "修改指定的监视器（LDAP）配置",
						"value": {
							"method": "PATCH",
							"path": "/api/ad/v3/slb/service-monitor/ldap/{name}",
							"body": {
								"name": "http",
								"type": "LDAP",
								"timeout": 31,
								"interval": 10,
								"err_interval": 2,
								"err_interval_state": "DISABLE",
								"host": "*",
								"port": 0,
								"debug_mode": "DISABLE",
								"secure": "NONE",
								"mandatory_attributes": "DISABLE",
								"chase_referrals": "ENABLE"
							}
						}
					},
					"response": {
						"summary": "PATCH /api/ad/v3/slb/service-monitor/ldap/{name} 响应",
						"description": "返回PATCH /api/ad/v3/slb/service-monitor/ldap/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "LDAP",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"username": "admin",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"base_dn": "",
							"search_filter": "",
							"secure": "NONE",
							"mandatory_attributes": "DISABLE",
							"chase_referrals": "ENABLE"
						}
					}
				}
			},
			"delete": {
				"tags": [
					"service-monitor"
				],
				"summary": "delete specific service-monitor-ldap",
				"description": "删除指定的监视器（LDAP）配置",
				"operationId": "delete_service_monitor_ldap",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_service_monitor_ldap_object"
					}
				},
				"x-examples": {
					"request": {
						"summary": "delete specific service-monitor-ldap",
						"description": "删除指定的监视器（LDAP）配置",
						"value": {
							"method": "DELETE",
							"path": "/api/ad/v3/slb/service-monitor/ldap/{name}"
						}
					},
					"response": {
						"summary": "DELETE /api/ad/v3/slb/service-monitor/ldap/{name} 响应",
						"description": "返回DELETE /api/ad/v3/slb/service-monitor/ldap/{name}的响应数据",
						"value": {
							"name": "http",
							"description": "example_string",
							"type": "LDAP",
							"timeout": 31,
							"interval": 10,
							"err_interval": 2,
							"err_interval_state": "DISABLE",
							"host": "*",
							"port": 0,
							"debug_mode": "DISABLE",
							"username": "admin",
							"password": "",
							"pk_password": "A1B2C3D4",
							"encrypted_password": "A1B2C3D4",
							"base_dn": "",
							"search_filter": "",
							"secure": "NONE",
							"mandatory_attributes": "DISABLE",
							"chase_referrals": "ENABLE"
						}
					}
				}
			}
		}
	},
	"parameters": {
		"SERVICE-MONITOR-LDAP-CONFIG": {
			"name": "SERVICE-MONITOR-LDAP-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ldap"
			}
		},
		"SERVICE-MONITOR-LDAP-PROPERTY": {
			"name": "SERVICE-MONITOR-LDAP-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ldap"
			}
		}
	},
	"responses": {
		"operation_config_service_monitor_ldap_list": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ldap_list"
			}
		},
		"operation_config_service_monitor_ldap_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.service_monitor_ldap"
			}
		}
	},
	"definitions": {
		"config.service_monitor_ldap_list": {
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
						"$ref": "#/definitions/config.service_monitor_ldap"
					}
				}
			}
		},
		"config.service_monitor_ldap": {
			"type": "object",
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"description": "必选参数；指定监视器的名称, 在配置中必须唯一。",
					"type": "string",
					"example": "http"
				},
				"description": {
					"type": "string",
					"description": "可选参数；用来对此配置增加额外的备注。"
				},
				"type": {
					"description": "只读参数；监视器类型。",
					"type": "string",
					"enum": [
						"LDAP"
					],
					"default": "LDAP"
				},
				"timeout": {
					"description": "可选参数；设置监视超时时间。",
					"type": "integer",
					"default": 31,
					"minimum": 1,
					"maximum": 86400,
					"example": 91
				},
				"interval": {
					"description": "可选参数；设置监视间隔时间。",
					"type": "integer",
					"default": 10,
					"minimum": 1,
					"maximum": 86400,
					"example": 30
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
					"description": "可选参数；支持ip地址和*;默认为*，表示监视节点池中的地址",
					"type": "string",
					"default": "*",
					"optionalEnum": [
						"*"
					],
					"example": "8.8.8.8"
				},
				"port": {
					"description": "可选参数；指定监视端口；取值范围[0,65535]，默认为389",
					"type": "integer",
					"default": 0,
					"maximum": 65535,
					"minimum": 0,
					"example": 389
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
				"username": {
					"description": "可选参数;指定ldap服务器的用户名",
					"type": "string",
					"minLength": 0,
					"maxLength": 63,
					"example": "admin"
				},
				"password": {
					"description": "可选参数;指定ldap服务器用户的密码",
					"passwdOnce": true,
					"type": "string",
					"minLength": 0,
					"maxLength": 63,
					"example": ""
				},
				"pk_password": {
					"description": "旧密码",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"encrypted_password": {
					"description": "可选参数;指定加密后的密码",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"base_dn": {
					"description": "可选参数;指定从监视器启动健康检查的LDAP树中的位置",
					"type": "string",
					"minLength": 0,
					"maxLength": 1023,
					"example": ""
				},
				"search_filter": {
					"description": "可选参数;监视器搜索指定的LDAP密钥，比如：objectclass=*。",
					"type": "string",
					"minLength": 0,
					"maxLength": 1023,
					"example": ""
				},
				"secure": {
					"description": "可选参数;指定用于与目标通信的安全协议类型;none表示不加密,tls表示需要进行加密",
					"type": "string",
					"enum": [
						"NONE",
						"TLS"
					],
					"default": "NONE",
					"example": "NONE"
				},
				"mandatory_attributes": {
					"description": "可选参数;指定目标是否必须包括其响应中的属性,默认disable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"chase_referrals": {
					"description": "可选参数;指定在收到LDAP引用条目后是否需要转换,默认enable",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "ENABLE",
					"example": "ENABLE"
				}
			}
		}
	}
}