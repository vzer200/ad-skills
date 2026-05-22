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
		"/api/ad/v3/sys/log-template/": {
			"description": "查看、修改指定的日志模板配置",
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
					"log-template"
				],
				"summary": "get all log-template",
				"description": "查看已有的日志模板配置",
				"operationId": "get_log-template_list",
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
						"$ref": "#/responses/operation_config_log_template"
					}
				}
			},
			"put": {
				"tags": [
					"log-template"
				],
				"summary": "replace specific log-template",
				"description": "修改指定的日志模板配置",
				"operationId": "replace_log-template",
				"parameters": [
					{
						"$ref": "#/parameters/LOG-TEMPLATE-CONFIG"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_log_template_object"
					}
				}
			},
			"patch": {
				"tags": [
					"log-template"
				],
				"summary": "modify specific log-template",
				"description": "修改指定的日志模板配置",
				"operationId": "edit_log-template",
				"parameters": [
					{
						"$ref": "#/parameters/LOG-TEMPLATE-PROPERTY"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_config_log_template_object"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list sys log-template all_properties",
					"description": "查看日志模板的配置信息"
				},
				{
					"command": "modify sys log-template audit_log_template '${username},${login_ip}'",
					"description": "修改日志模板配置中的管理日志格式"
				}
			]
		}
	},
	"parameters": {
		"LOG-TEMPLATE-CONFIG": {
			"name": "LOG-TEMPLATE-CONFIG",
			"in": "body",
			"required": true,
			"description": "JSON Config Object",
			"schema": {
				"$ref": "#/definitions/config.log_template"
			}
		},
		"LOG-TEMPLATE-PROPERTY": {
			"name": "LOG-TEMPLATE-PROPERTY",
			"in": "body",
			"required": true,
			"description": "JSON Config Properties",
			"schema": {
				"$ref": "#/definitions/config.log_template"
			}
		}
	},
	"responses": {
		"operation_config_log_template_object": {
			"description": "Display config with JSON formatted",
			"schema": {
				"$ref": "#/definitions/config.log_template"
			}
		}
	},
	"definitions": {
		"config.log_template": {
			"type": "object",
			"properties": {
				"server_log_template": {
					"description": "可选参数；服务日志自定义格式。",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"default": "${module}:${details}",
					"example": "${module}:${details}"
				},
				"audit_log_template": {
					"description": "可选参数；管理日志自定义格式。",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"default": "${username},${login_ip},${method},${module},${description}",
					"example": "${username},${login_ip},${method},${module},${description}"
				},
				"nat_log_template": {
					"description": "可选参数；NAT日志自定义格式。",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"default": "${action} ${protocol} ${src_ip}:${src_port}->${dst_ip}:${dst_port}---${nat_src_ip}:${nat_src_port}->${nat_dst_ip}:${nat_dst_port}",
					"example": "${action} ${protocol} ${src_ip}:${src_port}->${dst_ip}:${dst_port}---${nat_src_ip}:${nat_src_port}->${nat_dst_ip}:${nat_dst_port}"
				},
				"ssl_log_template": {
					"description": "可选参数；SSL日志自定义格式。",
					"type": "string",
					"maxLength": 255,
					"minLength": 1,
					"default": "[${X509.errno}][${client_ip}:${client_port}]->[${vip}:${vport}]${vs_name}:${X509.subject}/${X509.issuer}/${X509.serial_num}/${X509.not_valid_before}-${X509.not_valid_after}",
					"example": "[${X509.errno}][${client_ip}:${client_port}]->[${vip}:${vport}]${vs_name}:${X509.subject}/${X509.issuer}/${X509.serial_num}/${X509.not_valid_before}-${X509.not_valid_after}"
				}
			}
		}
	}
}