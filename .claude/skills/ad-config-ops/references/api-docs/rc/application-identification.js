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
		"/api/ad/v3/rc/application-identification/": {
			"description": "查看应用规则库配置",
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
					"application-identification"
				],
				"summary": "get all application-identification",
				"description": "查看应用规则库配置",
				"operationId": "get_application_identification",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_application_identification_library"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list rc application-identification",
					"description": "查看应用识别"
				}
			]
		}
	},
	"responses": {
		"operation_config_application_identification_library": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.application_identification_library"
			}
		}
	},
	"definitions": {
		"config.application_identification_library": {
			"type": "object",
			"description": "应用规则库。",
			"properties": {
				"version": {
					"type": "string",
					"description": "版本。",
					"example": "1.0.12"
				},
				"rule_count": {
					"type": "integer",
					"description": "规则数量。",
					"example": 65535
				},
				"ebank": {
					"type": "array",
					"description": "网上银行。",
					"items": {
						"$ref": "#/definitions/config.application_identification"
					}
				},
				"web_streaming_media": {
					"type": "array",
					"description": "web流媒体。",
					"items": {
						"$ref": "#/definitions/config.application_identification"
					}
				},
				"mobile_streaming_media": {
					"type": "array",
					"description": "音频视频。",
					"items": {
						"$ref": "#/definitions/config.application_identification"
					}
				},
				"mobile_game": {
					"type": "array",
					"description": "移动游戏。",
					"items": {
						"$ref": "#/definitions/config.application_identification"
					}
				},
				"client_game": {
					"type": "array",
					"description": "游戏。",
					"items": {
						"$ref": "#/definitions/config.application_identification"
					}
				},
				"webpage_game": {
					"type": "array",
					"description": "网页游戏。",
					"items": {
						"$ref": "#/definitions/config.application_identification"
					}
				}
			}
		},
		"config.application_identification": {
			"type": "object",
			"properties": {
				"name": {
					"type": "string",
					"description": "名称。",
					"example": "Youtube"
				},
				"description": {
					"type": "string",
					"description": "描述信息。",
					"example": "Youtube Web site."
				},
				"icon": {
					"type": "string",
					"description": "图标。",
					"example": "jiansheyinhang"
				},
				"official_website": {
					"type": "string",
					"description": "网址。",
					"example": "http://www.youtube.com/"
				}
			}
		}
	}
}