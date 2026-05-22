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
		"/api/ad/v3/batch": {
			"description": "创建批量请求",
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
					"batch"
				],
				"summary": "create a batch job",
				"description": "创建批量请求",
				"operationId": "create_batch_job",
				"parameters": [
					{
						"$ref": "#/parameters/BATCH-ORDER"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_batch_job_result"
					}
				}
			}
		}
	},
	"parameters": {
		"BATCH-ORDER": {
			"name": "BATCH-ORDER",
			"in": "body",
			"required": true,
			"description": "Request Order",
			"schema": {
				"$ref": "#/definitions/config.batch_job_order"
			}
		},
		"JSON-RESULT": {
			"name": "JSON-RESULT",
			"in": "body",
			"required": true,
			"description": "Response Result",
			"schema": {
				"$ref": "#/definitions/config.batch_job_result"
			}
		}
	},
	"responses": {
		"operation_config_batch_job_result": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.batch_job_result"
			}
		}
	},
	"definitions": {
		"config.batch_job_order": {
			"type": "array",
			"items": {
				"type": "object",
				"description": "批量请求参数列表",
				"required": [
					"method",
					"uri"
				],
				"properties": {
					"method": {
						"description": "请求方法",
						"type": "string",
						"enum": [
							"GET",
							"POST",
							"PUT",
							"PATCH",
							"DELETE"
						],
						"example": "PATCH"
					},
					"uri": {
						"type": "string",
						"description": "请求路径",
						"example": "/api/sys/host/?filter=host%20eq%20www.test.com&select=name,state"
					},
					"payload": {
						"type": "string",
						"description": "请求内容",
						"example": "{ address: \"192.168.1.1\" }"
					}
				}
			}
		},
		"config.batch_job_result": {
			"type": "array",
			"items": {
				"type": "object",
				"description": "返回结果列表",
				"required": [
					"status_code",
					"status_description"
				],
				"properties": {
					"status_code": {
						"type": "integer",
						"description": "返回状态码",
						"example": 200
					},
					"status_description": {
						"type": "string",
						"example": "OK",
						"description": "返回状态描述"
					},
					"payload": {
						"type": "object",
						"description": "返回结果内容"
					}
				}
			}
		}
	}
}