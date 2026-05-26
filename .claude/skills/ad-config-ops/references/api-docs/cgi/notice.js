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
		"/cgi/notice": {
			"description": "获取设备状态如授权状态、密码状态等相关告警通知",
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
					"notice"
				],
				"summary": "get WebUI notice",
				"description": "获取设备状态如授权状态、密码状态等相关通知",
				"operationId": "get_webui_notice",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_notice_object"
					}
				}
			}
		}
	},
	"parameters": {
		"NOTICE-CONFIG": {
			"name": "NOTICE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.notice"
			}
		},
		"NOTICE-PROPERTY": {
			"name": "NOTICE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.notice"
			}
		}
	},
	"responses": {
		"operation_config_notice_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.notice"
			}
		}
	},
	"definitions": {
		"config.notice": {
			"type": "object",
			"properties": {
				"licence_basic_sn_inspection": {
					"type": "object",
					"description": "基本授权状态信息",
					"properties": {
						"result": {
							"description": "授权状态，ACTIVE为已授权，INACTIVE为未授权，EXPIRE-REC为授权成功后15天，EXPIRE-SOON为非试用授权且授权剩余时间少于60天， EXPIRE-TRIAL为试用授权且授权剩余时间少于60天",
							"type": "string",
							"enum": [
								"ACTIVE",
								"INACTIVE",
								"EXPIRE-REC",
								"EXPIRE-SOON",
								"EXPIRE-TRIAL"
							]
						},
						"type": {
							"description": "授权类型，虚拟机有VLS、TRAIL、ONLINE，物理机有SN、MAD的授权方式",
							"enum": [
								"VLS",
								"TRAIL",
								"ONLINE",
								"SN",
								"MAD"
							],
							"type": "string"
						},
						"client": {
							"description": "授权用户信息",
							"type": "string",
							"example": "Example Company Inc."
						},
						"trial_available": {
							"type": "string",
							"description": "是否可以试用，刚部署时可以试用，若曾经授权过则不能再试用",
							"enum": [
								"ENABLE",
								"DISABLE"
							]
						},
						"base_countdown_day": {
							"type": "string",
							"description": "授权剩余天数，为“.”时为永久授权"
						},
						"illegal_reason": {
							"type": "string",
							"enum": [
								"NO_ERROR",
								"NETWORK_ERROR",
								"RESOURCE_ERR",
								"TIME_EXPIRED",
								"ADMIN_DISABLE",
								"SN_VOID",
								"VLS_OUT_OF_HEARTBEAT",
								"VLS_NETWORK_ERROR",
								""
							],
							"description": "授权不可用原因NO_ERROR为设备授权错误，NETWORK_ERROR无法连接网络，RESOURCE_ERR系统配置超限，TIME_EXPIRED授权过期，ADMIN_DISABLE系统被服务器拒绝授权，SN_VOID授权已失效，VLS_OUT_OF_HEARTBEAT未能持续获取授权，VLS_NETWORK_ERROR未能持续获取授权"
						},
						"disable_reason": {
							"type": "string",
							"enum": [
								"ILLEGAL__REASON__NO_ERROR",
								"ILLEGAL__REASON__NETWORK_ERROR",
								"ILLEGAL__REASON__DEV_RESOURCE_ERR",
								"ILLEGAL__REASON__TIME_EXPIRED",
								"ILLEGAL__REASON__ADMIN_DISABLE"
							],
							"description": "获取设备被禁用的原因"
						},
						"illegal_authorized_countdown_day": {
							"type": "string",
							"description": "由于授权非法，距离业务中断的时间"
						},
						"update_expire": {
							"type": "string",
							"description": "授权过期时间"
						}
					}
				},
				"licence_software_update_sn_inspection": {
					"type": "object",
					"description": "软件升级授权状态信息",
					"properties": {
						"result": {
							"description": "当前软件升级授权状态，VALID授权有效，EXPIRE-SOON授权有效但距离有效期已经不足一个月，EXPIRED当前授权已过期，INVALID升级授权无效",
							"type": "string",
							"enum": [
								"VALID",
								"EXPIRE-SOON",
								"EXPIRED",
								"INVALID"
							]
						},
						"type": {
							"description": "授权类型，虚拟机有VLS、TRAIL、ONLINE，物理机有SN、MAD的授权方式",
							"type": "string",
							"enum": [
								"VLS",
								"TRAIL",
								"ONLINE",
								"SN",
								"MAD"
							]
						},
						"soft_countdown_day": {
							"type": "string",
							"description": "距离软件升级授权过期的时间"
						},
						"software_update_expire": {
							"description": "软件升级授权到期时间",
							"type": "string",
							"example": "20181231"
						}
					}
				},
				"ssl_certificate_inspection": {
					"type": "object",
					"description": "SSL证书状态信息",
					"properties": {
						"result": {
							"description": "所有SSL证书中最严重的证书状态，VALID有效，EXPIRE-SOON即将过期（不到一个月），EXPIRED已经过期，INVALID无效证书",
							"type": "string",
							"enum": [
								"VALID",
								"EXPIRE-SOON",
								"EXPIRED",
								"INVALID"
							]
						},
						"certificate_expire_soon": {
							"description": "即将过期的SSL证书列表",
							"type": "array",
							"items": {
								"description": "即将过期的SSL证书",
								"type": "string",
								"example": "ebank_ecdsa_cert"
							}
						},
						"certificate_expired": {
							"description": "已过期的SSL证书列表",
							"type": "array",
							"items": {
								"description": "已过期的SSL证书",
								"type": "string",
								"example": "ebank_rsa_cert"
							}
						}
					}
				},
				"certificate_expired": {
					"description": "对应用户名的ukey过期状态",
					"type": "string",
					"enum": [
						true,
						false
					]
				},
				"passwd": {
					"description": "当前用户密码复杂度和更新周期",
					"type": "object",
					"properties": {
						"result": {
							"type": "string",
							"enum": [
								"SECURE",
								"WARN",
								"ERROR"
							],
							"description": "当前密码状态，SECURE安全，WARN密码强度不符合要求，但不强制修改，ERROR密码强度不符合要求，且强制修改密码"
						},
						"user": {
							"type": "string",
							"description": "当前登录的用户名"
						}
					}
				},
				"platform_file_inspection": {
					"description": "检查设备平台文件是否正常",
					"type": "object",
					"properties": {
						"result": {
							"type": "string",
							"description": "平台文件是否正确存在",
							"enum": [
								"VALID",
								"INVALID"
							]
						},
						"msg": {
							"type": "string",
							"description": "平台文件不存在时的错误信息"
						}
					}
				},
				"ca_certificate_inspection": {
					"type": "object",
					"description": "CA证书状态信息",
					"properties": {
						"result": {
							"description": "所有CA证书中最严重的证书状态，VALID有效，EXPIRE-SOON即将过期（不到一个月），EXPIRED已经过期，INVALID无效证书",
							"type": "string",
							"enum": [
								"VALID",
								"EXPIRE-SOON",
								"EXPIRED"
							]
						},
						"certificate_expire_soon": {
							"description": "即将过期的CA证书列表",
							"type": "array",
							"items": {
								"description": "即将过期的CA证书",
								"type": "string",
								"example": "ebank_ecdsa_cert"
							}
						},
						"certificate_expired": {
							"description": "已经过期的CA证书列表",
							"type": "array",
							"items": {
								"description": "已经过期的CA证书",
								"type": "string",
								"example": "ebank_rsa_cert"
							}
						}
					}
				},
				"user_weak_password_inspection": {
					"description": "检测弱密码",
					"type": "object",
					"properties": {
						"result": {
							"description": "存在弱密码为WEAK，否则为SECURE",
							"type": "string",
							"enum": [
								"WEAK",
								"SECURE"
							]
						},
						"patients": {
							"description": "弱密码用户名列表",
							"type": "array",
							"items": {
								"description": "弱密码用户",
								"type": "string",
								"example": "admin"
							}
						},
						"force": {
							"description": "是否强制修改密码，ENABLE为强制修改密码，DISABLE不强制",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"defaule": "DISABLE"
						}
					}
				},
				"privacy_inspection": {
					"type": "object",
					"description": "隐私策略状态",
					"properties": {
						"result": {
							"description": "隐私策略状态，INITIA未同意，设备基本授权激活未超出15天，INFORMING未同意，设备基本授权激活超出15天，INFORMED已经同意",
							"type": "string",
							"enum": [
								"INITIAL",
								"INFORMING",
								"INFORMED"
							]
						}
					}
				},
				"ssd_health_inspection": {
					"type": "object",
					"description": "SSD健康状态获取",
					"properties": {
						"result": {
							"description": "SSD健康状态，NORMAL为正常，ALERT为告警",
							"type": "string",
							"enum": [
								"NORMAL",
								"ALERT"
							],
							"example": "NORMAL"
						},
						"estimated_lifetime_day": {
							"description": "SSD剩余寿命",
							"type": "integer",
							"example": 36000
						}
					}
				}
			}
		}
	}
}