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
		"/api/ad/v3/stat/slb/pre-rule/": {
			"description": "获取前置策略状态信息",
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
				"deprecated": true,
				"tags": [
					"pre-rule"
				],
				"summary": "get all pre-rule",
				"description": "获取前置策略状态信息",
				"operationId": "get_pre_rule_list",
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
						"$ref": "#/responses/operation_stat_pre_rule_list"
					}
				}
			}
		},
		"/api/ad/v3/stat/slb/pre-rule/{name}": {
			"description": "获取指定前置策略状态信息",
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
				"deprecated": true,
				"tags": [
					"pre-rule"
				],
				"summary": "get specific pre-rule",
				"description": "获取指定前置策略状态信息",
				"operationId": "get_pre_rule",
				"responses": {
					"200": {
						"$ref": "#/responses/operation_stat_pre_rule_object"
					}
				}
			}
		}
	},
	"parameters": {
		"PRE-RULE-CONFIG": {
			"name": "PRE-RULE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/stat.pre_rule"
			}
		}
	},
	"responses": {
		"operation_stat_pre_rule_list": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.pre_rule_list"
			}
		},
		"operation_stat_pre_rule_object": {
			"description": "Display stat with JSON formatted",
			"schema": {
				"$ref": "#/definitions/stat.pre_rule"
			}
		}
	},
	"definitions": {
		"stat.pre_rule_list": {
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
						"$ref": "#/definitions/stat.pre_rule"
					}
				}
			}
		},
		"stat.pre_rule": {
			"type": "object",
			"readOnly": true,
			"required": [
				"name"
			],
			"properties": {
				"name": {
					"type": "string",
					"description": "前置策略状态名称",
					"example": "url-sched"
				},
				"description": {
					"type": "string",
					"description": "前置策略描述信息"
				},
				"service": {
					"description": "虚拟服务类型",
					"$ref": "/api/slb/virtual-service.yaml#/definitions/config.service_type"
				},
				"hit": {
					"description": "前置策略匹配次数",
					"$ref": "/api/{common}.yaml#/definitions/stat.statistic_accumulate"
				},
				"netns": {
					"type": "string",
					"description": "netns名称",
					"default": "default"
				}
			}
		}
	}
}