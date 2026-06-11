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
		"/api/ad/v3/last-event(?:/(\\d+))?": {
			"description": "查询异步事件状态",
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
					"last-event"
				],
				"summary": "get last-event",
				"description": "查询异步事件状态",
				"operationId": "get_last_event_list",
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
						"$ref": "/api/{common}.yaml#/responses/operation_config_async_operation_list"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get last-event",
						"description": "查询异步事件状态",
						"value": {
							"method": "GET",
							"path": "/api/ad/v3/last-event(?:/(\\d+))?"
						}
					},
					"response": {
						"summary": "GET /api/ad/v3/last-event(?:/(\\d+))? 响应",
						"description": "返回GET /api/ad/v3/last-event(?:/(\\d+))?的响应数据",
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
									"event_id": 0,
									"operation": "/debug/sys/maintenance/restart-service",
									"state": "WAITING",
									"start_time": "2018-04-02 08:30:21",
									"finish_time": "2018-04-02 08:31:05",
									"triggered_by": "admin",
									"data": {}
								}
							]
						}
					}
				}
			}
		}
	},
	"parameters": {
		"event_id": {
			"name": "event_id",
			"in": "path",
			"required": true,
			"description": "查询的异步事件ID",
			"type": "integer"
		}
	}
}