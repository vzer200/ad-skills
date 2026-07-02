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
		"file-resource_auth": {
			"$ref": "/api/{common}.yaml#/securityDefinitions/token_auth"
		}
	},
	"paths": {
		"/cgi/file-resource/": {
			"description": "文件资源相关操作",
			"post": {
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
						"$ref": "#/parameters/filesha256"
					},
					{
						"$ref": "#/parameters/recource"
					}
				],
				"tags": [
					"file-resource"
				],
				"summary": "upload new file-resource",
				"description": "上传文件，获取token",
				"operationId": "upload_file_resource",
				"consumes": [
					"multipart/form-data"
				],
				"responses": {
					"200": {
						"$ref": "/api/{common}.yaml#/responses/operation_cgi_file_resource_response"
					}
				},
				"x-examples": {
					"request": {
						"summary": "upload new file-resource",
						"description": "上传文件，获取token",
						"value": {
							"method": "POST",
							"path": "/cgi/file-resource/"
						}
					},
					"response": {
						"summary": "POST /cgi/file-resource/ 响应",
						"description": "返回POST /cgi/file-resource/的响应数据",
						"value": {
							"d": "1A2B3C4D5E6F",
							"file_name": "config_snat_20170807165401.csv",
							"file_type": "CSV",
							"expired": 0,
							"flag": "BAD_PARAM"
						}
					}
				}
			},
			"get": {
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
						"$ref": "#/parameters/file_token"
					}
				],
				"tags": [
					"file-resource"
				],
				"summary": "get specific file-resource information",
				"description": "下载文件",
				"operationId": "get_file_resource_information",
				"produces": [
					"multipart/form-data"
				],
				"responses": {
					"200": {
						"$ref": "#/parameters/responses/file_download"
					}
				},
				"x-examples": {
					"request": {
						"summary": "get specific file-resource information",
						"description": "下载文件",
						"value": {
							"method": "GET",
							"path": "/cgi/file-resource/"
						}
					},
					"response": {
						"summary": "GET /cgi/file-resource/ 响应",
						"description": "返回GET /cgi/file-resource/的响应数据",
						"value": {}
					}
				}
			}
		}
	},
	"parameters": {
		"file_token": {
			"name": "d",
			"in": "path",
			"required": true,
			"type": "string",
			"description": "要下载的文件的token"
		},
		"filesha256": {
			"in": "path",
			"name": "filesha256",
			"description": "上传文件的标记",
			"type": "string"
		},
		"recource": {
			"in": "path",
			"name": "resource",
			"type": "string",
			"description": "所上传的文件资源"
		}
	}
}