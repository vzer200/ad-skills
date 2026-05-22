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
		"/api/ad/v3/sys/licence": {
			"description": "查看、修改licence信息",
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
					"licence"
				],
				"summary": "get licence",
				"description": "查看已有的licence信息",
				"operationId": "get_licence",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_licence_object"
					}
				}
			},
			"put": {
				"tags": [
					"licence"
				],
				"summary": "replace licence",
				"description": "修改已有的licence信息",
				"operationId": "replace_licence",
				"parameters": [
					{
						"$ref": "#/parameters/LICENCE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_licence_object"
					}
				}
			},
			"patch": {
				"tags": [
					"licence"
				],
				"summary": "modify licence",
				"description": "修改已有的licence信息",
				"operationId": "edit_licence",
				"parameters": [
					{
						"$ref": "#/parameters/LICENCE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_licence_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "modify sys licence sn X00FEF97APKF5BS0",
					"description": "修改基本授权的序列号为X00FEF97APKF5BS0"
				},
				{
					"command": "list sys licence all_properties",
					"description": "查看当前所有授权信息"
				}
			]
		},
		"/api/ad/v3/sys/licence/verify": {
			"description": "物理机导入许可证信息",
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
			"post": {
				"tags": [
					"licence"
				],
				"summary": "verify licence",
				"description": "物理机导入许可证信息",
				"operationId": "verify_licence",
				"parameters": [
					{
						"$ref": "#/parameters/JSON-VERIFY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_licence_verify"
					}
				}
			}
		}
	},
	"parameters": {
		"LICENCE-CONFIG": {
			"name": "LICENCE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.licence"
			}
		},
		"LICENCE-PROPERTY": {
			"name": "LICENCE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.licence"
			}
		},
		"JSON-VERIFY": {
			"name": "JSON-VERIFY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.licence_verify"
			}
		}
	},
	"responses": {
		"operation_config_licence_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.licence"
			}
		},
		"operation_config_licence_verify": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.licence_verify"
			}
		}
	},
	"definitions": {
		"config.licence": {
			"type": "object",
			"properties": {
				"client": {
					"type": "string",
					"description": "鉴权用户名",
					"readOnly": true,
					"example": "client name"
				},
				"gwid": {
					"type": "string",
					"description": "网关ID,此字段为只读字段",
					"readOnly": true,
					"example": "B6A26EE4"
				},
				"support_expire": {
					"type": "string",
					"description": "电话服务截止日期,此字段为只读字段",
					"readOnly": true,
					"example": "20191231"
				},
				"hardware_warranty_expire": {
					"type": "string",
					"description": "硬件质保服务有效期,此字段为只读字段",
					"readOnly": true,
					"example": "20191231"
				},
				"basic_sn": {
					"type": "string",
					"description": "基本的序列号；必须为16位大写字母和数字组成",
					"example": "8RM2ZGCEDWD5EFTA",
					"minLength": 16,
					"maxLength": 16
				},
				"basic_state": {
					"type": "string",
					"description": "基本状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "ACTIVE"
				},
				"linknum": {
					"type": "integer",
					"description": "链路数量",
					"readOnly": true,
					"example": 32
				},
				"ssl_sn": {
					"type": "string",
					"description": "ssl序列号；必须为16位大写字母和数字组成",
					"example": "8ZLLACAFEWFM7CF3",
					"minLength": 16,
					"maxLength": 16
				},
				"ssl_state": {
					"type": "string",
					"description": "ssl授权状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "ACTIVE"
				},
				"fast_tcp_sn": {
					"type": "string",
					"description": "tcp单边加速序列号；必须为16位大写字母和数字组成",
					"example": "ABJEXRSGFHD73SRG",
					"minLength": 16,
					"maxLength": 16
				},
				"fast_tcp_state": {
					"type": "string",
					"readOnly": true,
					"description": "tcp单边加速状态信息",
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "ACTIVE"
				},
				"http_cache_sn": {
					"type": "string",
					"description": "http缓存序列号；必须为16位大写字母和数字组成",
					"example": "ZBEDGTDEFBTFWSKE",
					"minLength": 16,
					"maxLength": 16
				},
				"http_cache_state": {
					"type": "string",
					"description": "http缓存授权状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "ACTIVE"
				},
				"gslb_sn": {
					"type": "string",
					"description": "全局负载序列号，必须为16位大写字母和数字组成",
					"example": "8ZLLACAFEWFM7CF3",
					"minLength": 16,
					"maxLength": 16
				},
				"gslb_state": {
					"type": "string",
					"description": "全局负载状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "ACTIVE"
				},
				"service_chain_sn": {
					"type": "string",
					"description": "安全服务链序列号；必须为16位大写字母和数字组成",
					"minLength": 16,
					"maxLength": 16,
					"example": "8ZLLACAFEWFM7CF3"
				},
				"service_chain_state": {
					"type": "string",
					"description": "安全服务链状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "INACTIVE"
				},
				"software_update_sn": {
					"type": "string",
					"description": "软件升级序列号；必须为16位大写字母和数字组成",
					"example": "H6CBFBEEBDARGWLC",
					"minLength": 16,
					"maxLength": 16
				},
				"software_update_state": {
					"type": "string",
					"description": "软件升级状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "INACTIVE"
				},
				"software_update_expire": {
					"type": "string",
					"description": "软件升级有效日期",
					"readOnly": true,
					"example": "20181231"
				},
				"mad_sn": {
					"type": "string",
					"description": "MAD序列号；必须为16位大写字母和数字组成",
					"example": "8RM2ZGCEDWD5EFBB",
					"minLength": 16,
					"maxLength": 16
				},
				"mad_state": {
					"type": "string",
					"description": "MAD状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "ACTIVE"
				},
				"vad_num": {
					"type": "integer",
					"description": "vad授权数量",
					"readOnly": true,
					"example": 20
				},
				"openad_sn": {
					"type": "string",
					"description": "openad序列号；必须为16位大写字母和数字组成",
					"example": "8RM2ZGCEDWD5EFEA",
					"minLength": 16,
					"maxLength": 16
				},
				"openad_state": {
					"type": "string",
					"description": "openad状态信息",
					"readOnly": true,
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "ACTIVE"
				},
				"netns_num": {
					"type": "integer",
					"description": "netns授权数量",
					"readOnly": true,
					"example": 50
				},
				"netns_platform_limit": {
					"type": "integer",
					"description": "netns平台限制数量",
					"readOnly": true,
					"example": 500
				},
				"sn": {
					"description": "必须为16位大写字母和数字组成",
					"type": "string",
					"example": "8RM2ZGCEDWD5EFTA"
				},
				"aid": {
					"description": "授权ID",
					"type": "string",
					"example": 5657924321
				},
				"opr": {
					"description": "虚拟化授权操作选项",
					"type": "string",
					"enum": [
						"SUBMIT",
						"ONLINEAUTH",
						"CANCELONLINEAUTH",
						"RETRYVERIFY"
					],
					"example": "submit"
				},
				"do": {
					"description": "虚拟化变更授权选项",
					"type": "string",
					"enum": [
						"CHANGETOONLINE",
						"CHANGETOVLS"
					],
					"example": "CHANGETOVLS"
				},
				"product": {
					"description": "试用产品",
					"type": "string",
					"example": "AD"
				}
			}
		},
		"config.licence_verify": {
			"type": "object",
			"required": [
				"function",
				"sn"
			],
			"properties": {
				"function": {
					"description": "合法输入为UNKNOWN、BASIC、SSL、FAST-TCP、HTTP-CACHE、OPENAD、GSLB和SOFTWARE-UPDATE",
					"type": "string",
					"enum": [
						"UNKNOWN",
						"BASIC",
						"SSL",
						"FAST-TCP",
						"HTTP-CACHE",
						"GSLB",
						"SOFTWARE-UPDATE",
						"OPENAD"
					],
					"default": "UNKNOWN"
				},
				"sn": {
					"description": "必须为16位大写字母和数字组成",
					"type": "string",
					"example": "8RM2ZGCEDWD5EFTA"
				},
				"result": {
					"description": "验证结果",
					"type": "string",
					"enum": [
						"ACTIVE",
						"INACTIVE"
					],
					"example": "VALID"
				}
			}
		}
	}
}