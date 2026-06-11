module.exports ={
	"swagger": "2.0",
	"info": {
		"description": "",
		"version": "7.0.24",
		"title": "Sangfor AD API"
	},
	"host": "ad.sangfor.com",
	"basePath": "/api/",
	"schemes": [
		"https"
	],
	"consumes": [
		"application/json"
	],
	"produces": [
		"application/json"
	],
	"paths": null,
	"parameters": {
		"all_properties": {
			"name": "all_properties",
			"in": "query",
			"type": "boolean",
			"description": "输出对象的全部字段信息，未设置属性则输出默认值。",
			"required": false,
			"default": false
		},
		"force": {
			"name": "force",
			"in": "query",
			"type": "boolean",
			"description": "force to delete netns configure",
			"required": false,
			"default": false
		},
		"name": {
			"name": "name",
			"in": "path",
			"type": "string",
			"description": "配置名称",
			"required": true
		},
		"netns": {
			"name": "netns",
			"in": "query",
			"type": "string",
			"description": "mynetns, netns-default, project-common",
			"required": false,
			"default": "default"
		},
		"project": {
			"name": "project",
			"in": "query",
			"type": "string",
			"description": "myproject,netns-default, project-common",
			"required": false,
			"default": "common"
		},
		"search": {
			"name": "$search",
			"in": "query",
			"type": "string",
			"description": "对API目标数据进行按关键字搜索",
			"example": "keyword",
			"required": false
		},
		"filter": {
			"deprecated": true,
			"name": "$filter",
			"in": "query",
			"type": "string",
			"description": "数据查询条件",
			"example": "state eq ENABLE and type eq HTTP",
			"required": false
		},
		"select": {
			"name": "$select",
			"in": "query",
			"type": "string",
			"description": "定义查询结果集的数据项",
			"example": "name,state,type",
			"required": false
		},
		"skip": {
			"name": "$skip",
			"in": "query",
			"type": "integer",
			"description": "跳过查询结果前部指定数量的对象",
			"default": 0,
			"required": false
		},
		"top": {
			"name": "$top",
			"in": "query",
			"type": "integer",
			"description": "指定输出列表长度",
			"default": 65535,
			"required": false
		},
		"token": {
			"name": "x-token-sangforad",
			"in": "header",
			"description": "AD会话令牌",
			"type": "string",
			"example": "ed495300-9ece-11e8-aa57-000c29b45d7e"
		},
		"session": {
			"name": "session_id",
			"in": "cookie",
			"description": "Web控制台会话Cookie",
			"type": "string",
			"example": "0938d86a-a02d-11e8-99aa-000c29b45d7e"
		},
		"version": {
			"name": "version",
			"in": "query",
			"type": "string",
			"description": "",
			"example": "7.0.5",
			"required": false
		},
		"trend": {
			"name": "trend",
			"in": "query",
			"type": "string",
			"description": "统计趋势的查询区间（last-hour最近60分钟/last-day最近24小时/last-week最近7天）",
			"enum": [
				"last-hour",
				"last-day",
				"last-week"
			],
			"required": true
		},
		"VERIFY-OPERATOR": {
			"name": "VERIFY-OPERATOR",
			"in": "body",
			"required": true,
			"description": "JSON VERIFY-INFORMATION",
			"schema": {
				"$ref": "#/definitions/debug.verify_operator"
			}
		}
	},
	"responses": {
		"401": {
			"description": "401 Unauthorized",
			"schema": {
				"$ref": "#/definitions/error_message"
			}
		},
		"default": {
			"description": "Default Error Message Response.",
			"schema": {
				"$ref": "#/definitions/error_message"
			}
		},
		"operation_stat_trend_multiple_items": {
			"description": "趋势统计数据-多对象结构",
			"schema": {
				"$ref": "#/definitions/stat.statistic_trend_multiple_items"
			}
		},
		"operation_stat_trend_multiple": {
			"description": "趋势统计数据-多序列结构",
			"schema": {
				"$ref": "#/definitions/stat.statistic_trend_multiple"
			}
		},
		"operation_stat_trend": {
			"description": "趋势统计数据",
			"schema": {
				"$ref": "#/definitions/stat.statistic_trend"
			}
		},
		"operation_stat_trend_multiple_items_sslo": {
			"description": "SSLO模块趋势统计数据-多对象结构",
			"schema": {
				"$ref": "#/definitions/stat.statistic_trend_multiple_items_sslo"
			}
		},
		"operation_cgi_file_resource_response": {
			"description": "文件资源信息",
			"schema": {
				"$ref": "#/definitions/cgi.file_resource"
			}
		},
		"operation_config_async_operation": {
			"description": "异步任务信息",
			"schema": {
				"$ref": "#/definitions/debug.async_operation_response"
			}
		},
		"operation_config_async_operation_list": {
			"description": "异步任务列表",
			"schema": {
				"$ref": "#/definitions/debug.async_operation_response_list"
			}
		}
	},
	"definitions": {
		"error_message": {
			"description": "错误信息结构",
			"type": "object",
			"required": [
				"err_code",
				"msg"
			],
			"properties": {
				"err_code": {
					"description": "表示错误类型的错误码",
					"type": "string",
					"readOnly": true,
					"example": "ERR_URI_PATTERN_NOT_FOUND"
				},
				"msg": {
					"description": "错误信息详情表述",
					"type": "string",
					"readOnly": true,
					"example": "Resource not found: /api/sys/host/abc"
				},
				"debug": {
					"description": "调试数据等附加信息",
					"type": "string",
					"readOnly": true,
					"example": ""
				}
			}
		},
		"stat.statistic_trend_multiple_items": {
			"type": "object",
			"properties": {
				"model": {
					"description": "统计数据模型（TREND-LAST-HOUR最近60分钟趋势/TREND-LAST-DAY最近24小时趋势/TREND-LAST-WEEK最近7天趋势）",
					"type": "string",
					"enum": [
						"TREND-LAST-HOUR",
						"TREND-LAST-DAY",
						"TREND-LAST-WEEK"
					]
				},
				"timestamp": {
					"description": "查询数据时间戳",
					"type": "integer"
				},
				"items": {
					"type": "array",
					"items": {
						"description": "多数据项列表",
						"type": "object",
						"properties": {
							"item": {
								"description": "数据项名称",
								"type": "string"
							},
							"feature": {
								"description": "",
								"type": "string",
								"enum": [
									"ENABLE",
									"DISABLE"
								],
								"example": "DISABLE"
							},
							"unit": {
								"$ref": "#/definitions/stat.statistic_unit"
							},
							"values": {
								"description": "统计数据点列表",
								"type": "array",
								"items": {
									"type": "integer"
								}
							},
							"additional_data": {
								"description": "附加信息点列表",
								"type": "array",
								"items": {
									"type": "object"
								}
							}
						}
					}
				},
				"start_time": {
					"description": "趋势统计区间起始时间",
					"type": "integer"
				},
				"step_time": {
					"description": "趋势统计时间点步长",
					"type": "integer"
				}
			}
		},
		"stat.statistic_trend_multiple_items_sslo": {
			"type": "object",
			"properties": {
				"model": {
					"description": "统计数据模型（TREND-LAST-HOUR最近60分钟趋势/TREND-LAST-DAY最近24小时趋势/TREND-LAST-WEEK最近7天趋势）",
					"type": "string",
					"enum": [
						"TREND-LAST-HOUR",
						"TREND-LAST-DAY",
						"TREND-LAST-WEEK"
					]
				},
				"timestamp": {
					"description": "查询数据时间戳",
					"type": "integer"
				},
				"items": {
					"type": "array",
					"items": {
						"description": "多数据项列表",
						"type": "object",
						"properties": {
							"name": {
								"description": "数据项类型的名称，可选的有health/健康状态,connection/并发连接数,connection-rate/新建连接速率,upstream_throughput/上行吞吐速率,downstream_throughput/下行吞吐速率,general_throughput/总吞吐速率",
								"type": "string",
								"enum": [
									"health",
									"connection",
									"connection-rate",
									"upstream-throughput",
									"downstream-throughput",
									"general-throughput"
								]
							},
							"unit": {
								"$ref": "#/definitions/stat.statistic_unit"
							},
							"values": {
								"description": "统计数据点列表",
								"type": "array",
								"items": {
									"type": "integer"
								}
							}
						}
					}
				},
				"start_time": {
					"description": "趋势统计区间起始时间",
					"type": "integer"
				},
				"step_time": {
					"description": "趋势统计时间点步长",
					"type": "integer"
				}
			}
		},
		"stat.statistic_trend_multiple": {
			"type": "object",
			"properties": {
				"model": {
					"description": "统计数据模型（TREND-LAST-HOUR最近60分钟趋势/TREND-LAST-DAY最近24小时趋势/TREND-LAST-WEEK最近7天趋势）",
					"type": "string",
					"enum": [
						"TREND-LAST-HOUR",
						"TREND-LAST-DAY",
						"TREND-LAST-WEEK"
					]
				},
				"unit": {
					"$ref": "#/definitions/stat.statistic_unit"
				},
				"timestamp": {
					"description": "查询数据时间戳",
					"type": "integer"
				},
				"series": {
					"description": "多数据序列列表",
					"type": "array",
					"items": {
						"type": "object",
						"properties": {
							"name": {
								"description": "数据序列名称",
								"type": "string"
							},
							"values": {
								"description": "统计数据点列表",
								"type": "array",
								"items": {
									"type": "integer"
								}
							},
							"additional_data": {
								"description": "附加信息点列表",
								"type": "array",
								"items": {
									"type": "object"
								}
							}
						}
					}
				},
				"start_time": {
					"description": "趋势统计区间起始时间",
					"type": "integer"
				},
				"step_time": {
					"description": "趋势统计时间点步长",
					"type": "integer"
				}
			}
		},
		"stat.statistic_instant": {
			"description": "实时统计数据",
			"type": "object",
			"properties": {
				"model": {
					"description": "统计数据模型（INSTANT实时统计/ACCUMULATE累积数据/TREND-LAST-HOUR最近60分钟趋势/TREND-LAST-DAY最近24小时趋势/TREND-LAST-WEEK最近7天趋势）",
					"type": "string",
					"enum": [
						"INSTANT"
					]
				},
				"unit": {
					"$ref": "#/definitions/stat.statistic_unit"
				},
				"timestamp": {
					"description": "查询数据时间戳",
					"type": "integer"
				},
				"value": {
					"description": "统计数据值",
					"type": "integer"
				}
			}
		},
		"stat.statistic_accumulate": {
			"type": "object",
			"properties": {
				"model": {
					"description": "统计数据模型（INSTANT实时统计/ACCUMULATE累积数据/TREND-LAST-HOUR最近60分钟趋势/TREND-LAST-DAY最近24小时趋势/TREND-LAST-WEEK最近7天趋势）",
					"type": "string",
					"enum": [
						"ACCUMULATE"
					]
				},
				"unit": {
					"$ref": "#/definitions/stat.statistic_unit"
				},
				"timestamp": {
					"description": "查询数据时间戳",
					"type": "integer"
				},
				"value": {
					"description": "统计数据值",
					"type": "integer"
				},
				"initial_time": {
					"description": "数据初始化时间戳",
					"type": "integer"
				}
			}
		},
		"stat.statistic_trend": {
			"type": "object",
			"properties": {
				"model": {
					"description": "统计数据模型（INSTANT实时统计/ACCUMULATE累积数据/TREND-LAST-HOUR最近60分钟趋势/TREND-LAST-DAY最近24小时趋势/TREND-LAST-WEEK最近7天趋势）",
					"type": "string",
					"enum": [
						"TREND-LAST-HOUR",
						"TREND-LAST-DAY",
						"TREND-LAST-WEEK"
					]
				},
				"unit": {
					"$ref": "#/definitions/stat.statistic_unit"
				},
				"timestamp": {
					"description": "查询数据时间戳",
					"type": "integer"
				},
				"values": {
					"description": "统计数据点列表",
					"type": "array",
					"items": {
						"type": "integer"
					}
				},
				"additional_data": {
					"description": "附加信息点列表",
					"type": "array",
					"items": {
						"type": "object"
					}
				},
				"start_time": {
					"description": "趋势统计区间起始时间",
					"type": "integer"
				},
				"step_time": {
					"description": "趋势统计时间点步长",
					"type": "integer"
				}
			}
		},
		"stat.statistic_data": {
			"type": "object",
			"properties": {
				"model": {
					"description": "统计数据模型（INSTANT实时统计/ACCUMULATE累积数据/TREND-LAST-HOUR最近60分钟趋势/TREND-LAST-DAY最近24小时趋势/TREND-LAST-WEEK最近7天趋势）",
					"type": "string",
					"enum": [
						"INSTANT",
						"ACCUMULATE",
						"TREND-LAST-HOUR",
						"TREND-LAST-DAY",
						"TREND-LAST-WEEK"
					]
				},
				"unit": {
					"$ref": "#/definitions/stat.statistic_unit"
				},
				"timestamp": {
					"description": "查询数据时间戳",
					"type": "integer"
				},
				"value": {
					"description": "统计数据值",
					"type": "integer"
				},
				"values": {
					"description": "统计数据点列表",
					"type": "array",
					"items": {
						"type": "integer"
					}
				},
				"start_time": {
					"description": "趋势统计区间起始时间",
					"type": "integer"
				},
				"step_time": {
					"description": "趋势统计时间点步长",
					"type": "integer"
				}
			}
		},
		"stat.statistic_unit": {
			"description": "数据单位（包括不限于BIT-PER-SECOND/KILO-BIT-PER-SECOND/KIBI-BIT-PER-SECOND/MEGA-BIT-PER-SECOND/MEBI-BIT-PER-SECOND/GIGA-BIT-PER-SECOND/GIBI-BIT-PER-SECOND/TRANSACTION-PER-SECOND/REQUEST-PER-SECOND/PACKET-PER-SECOND/QUERY-PER-SECOND/BYTE/KILO-BYTE/KIBI-BYTE/MEGA-BYTE/MEBI-BYTE/GIGA-BYTE/GIBI-BYTE/TIME/SECOND/MILLISECOND/HEALTH-STATUS/PERCENT/COUNT/DEGREE-CENTGRADE/REVOLUTION-PER-MINUTE）",
			"type": "string",
			"enum": [
				"BIT-PER-SECOND",
				"KILO-BIT-PER-SECOND",
				"KIBI-BIT-PER-SECOND",
				"MEGA-BIT-PER-SECOND",
				"MEBI-BIT-PER-SECOND",
				"GIGA-BIT-PER-SECOND",
				"GIBI-BIT-PER-SECOND",
				"TRANSACTION-PER-SECOND",
				"REQUEST-PER-SECOND",
				"PACKET-PER-SECOND",
				"QUERY-PER-SECOND",
				"BYTE",
				"KILO-BYTE",
				"KIBI-BYTE",
				"MEGA-BYTE",
				"MEBI-BYTE",
				"GIGA-BYTE",
				"GIBI-BYTE",
				"TIME",
				"SECOND",
				"MILLISECOND",
				"HEALTH-STATUS",
				"PERCENT",
				"COUNT",
				"DEGREE-CENTGRADE",
				"REVOLUTION-PER-MINUTE",
				"<..>"
			]
		},
		"config.http_header_match_component": {
			"type": "object",
			"required": [
				"header",
				"mode",
				"pattern"
			],
			"properties": {
				"header": {
					"description": "HTTP头部名称",
					"type": "string",
					"example": "host"
				},
				"mode": {
					"description": "规则匹配方式（NONE不匹配/EQUAL等于/NON-EQUAL不等于/CONTAIN包含/NON-CONTAIN不包含/CONTAIN-HEXADECIMAL十六进制方式包含/NON-CONTAIN-HEXADECIMAL十六进制方式不包含/WILDCARD通配符匹配/NON-WILDCARD通配符不匹配/REGULAR正则匹配/NON-REGULAR正则不匹配）",
					"type": "string",
					"enum": [
						"NONE",
						"EQUAL",
						"NON-EQUAL",
						"CONTAIN",
						"NON-CONTAIN",
						"WILDCARD",
						"NON-WILDCARD",
						"REGULAR",
						"NON-REGULAR"
					],
					"example": "CONTAIN"
				},
				"case_sensitive": {
					"description": "大小写敏感（ENABLE启用/DISABLE禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"pattern": {
					"description": "匹配样本",
					"type": "string",
					"example": "www.test.com"
				}
			}
		},
		"config.http_header_match_component1": {
			"type": "object",
			"required": [
				"header",
				"mode",
				"pattern"
			],
			"properties": {
				"header": {
					"description": "HTTP头部名称",
					"type": "string",
					"minLength": 1,
					"maxLength": 255,
					"example": "host"
				},
				"mode": {
					"description": "规则匹配方式（NONE不匹配/EQUAL等于/NON-EQUAL不等于/CONTAIN包含/NON-CONTAIN不包含/CONTAIN-HEXADECIMAL十六进制方式包含/NON-CONTAIN-HEXADECIMAL十六进制方式不包含/WILDCARD通配符匹配/NON-WILDCARD通配符不匹配/REGULAR正则匹配/NON-REGULAR正则不匹配）",
					"type": "string",
					"enum": [
						"EQUAL",
						"NON-EQUAL",
						"CONTAIN",
						"NON-CONTAIN",
						"WILDCARD",
						"NON-WILDCARD",
						"REGULAR",
						"NON-REGULAR"
					],
					"example": "CONTAIN"
				},
				"case_sensitive": {
					"description": "大小写敏感（ENABLE启用/DISABLE禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"pattern": {
					"description": "匹配样本",
					"type": "string",
					"example": "www.test.com"
				}
			}
		},
		"config.ssl_match_component": {
			"type": "object",
			"required": [
				"variable",
				"mode",
				"pattern"
			],
			"properties": {
				"variable": {
					"description": "证书变量（ISSUER颁发者/SUBJECT主题/CN通用名称/EMAIL邮箱/O机构/OU部门/L城市/ST省份/C国家）",
					"type": "string",
					"enum": [
						"ISSUER",
						"SUBJECT",
						"CN",
						"EMAIL",
						"O",
						"OU",
						"L",
						"ST",
						"C"
					],
					"example": "CN"
				},
				"mode": {
					"description": "规则匹配方式（NONE不匹配/EQUAL等于/NON-EQUAL不等于/CONTAIN包含/NON-CONTAIN不包含/CONTAIN-HEXADECIMAL十六进制方式包含/NON-CONTAIN-HEXADECIMAL十六进制方式不包含/WILDCARD通配符匹配/NON-WILDCARD通配符不匹配/REGULAR正则匹配/NON-REGULAR正则不匹配）",
					"type": "string",
					"enum": [
						"NONE",
						"EQUAL",
						"NON-EQUAL",
						"CONTAIN",
						"NON-CONTAIN",
						"WILDCARD",
						"NON-WILDCARD",
						"REGULAR",
						"NON-REGULAR"
					],
					"example": "CONTAIN"
				},
				"case_sensitive": {
					"description": "大小写敏感（ENABLE启用/DISABLE禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"pattern": {
					"description": "匹配样本",
					"type": "string",
					"example": "www.test.com"
				}
			}
		},
		"config.ssl_match_component1": {
			"type": "object",
			"required": [
				"variable",
				"mode",
				"pattern"
			],
			"properties": {
				"variable": {
					"description": "证书变量（ISSUER颁发者/SUBJECT主题/CN通用名称/EMAIL邮箱/O机构/OU部门/L城市/ST省份/C国家）",
					"type": "string",
					"enum": [
						"ISSUER",
						"SUBJECT",
						"CN",
						"EMAIL",
						"O",
						"OU",
						"L",
						"ST",
						"C"
					],
					"example": "CN"
				},
				"mode": {
					"description": "规则匹配方式（NONE不匹配/EQUAL等于/NON-EQUAL不等于/CONTAIN包含/NON-CONTAIN不包含/CONTAIN-HEXADECIMAL十六进制方式包含/NON-CONTAIN-HEXADECIMAL十六进制方式不包含/WILDCARD通配符匹配/NON-WILDCARD通配符不匹配/REGULAR正则匹配/NON-REGULAR正则不匹配）",
					"type": "string",
					"enum": [
						"EQUAL",
						"NON-EQUAL",
						"CONTAIN",
						"NON-CONTAIN",
						"WILDCARD",
						"NON-WILDCARD",
						"REGULAR",
						"NON-REGULAR"
					],
					"example": "CONTAIN"
				},
				"case_sensitive": {
					"description": "大小写敏感（ENABLE启用/DISABLE禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"pattern": {
					"description": "匹配样本",
					"type": "string",
					"example": "www.test.com"
				}
			}
		},
		"config.str_match_component": {
			"type": "object",
			"required": [
				"mode"
			],
			"properties": {
				"mode": {
					"description": "规则匹配方式（NONE不匹配/EQUAL等于/NON-EQUAL不等于/CONTAIN包含/NON-CONTAIN不包含/CONTAIN-HEXADECIMAL十六进制方式包含/NON-CONTAIN-HEXADECIMAL十六进制方式不包含/WILDCARD通配符匹配/NON-WILDCARD通配符不匹配/REGULAR正则匹配/NON-REGULAR正则不匹配）",
					"type": "string",
					"enum": [
						"NONE",
						"EQUAL",
						"NON-EQUAL",
						"CONTAIN",
						"NON-CONTAIN",
						"WILDCARD",
						"NON-WILDCARD",
						"REGULAR",
						"NON-REGULAR"
					],
					"example": "CONTAIN"
				},
				"case_sensitive": {
					"description": "大小写敏感（ENABLE启用/DISABLE禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"pattern": {
					"description": "匹配样本",
					"type": "string",
					"example": "One"
				}
			}
		},
		"config.str_match_component1": {
			"type": "object",
			"required": [
				"mode"
			],
			"properties": {
				"mode": {
					"description": "规则匹配方式（NONE不匹配/EQUAL等于/NON-EQUAL不等于/CONTAIN包含/NON-CONTAIN不包含/CONTAIN-HEXADECIMAL十六进制方式包含/NON-CONTAIN-HEXADECIMAL十六进制方式不包含/WILDCARD通配符匹配/NON-WILDCARD通配符不匹配/REGULAR正则匹配/NON-REGULAR正则不匹配）",
					"type": "string",
					"enum": [
						"NONE",
						"EQUAL",
						"NON-EQUAL",
						"CONTAIN",
						"NON-CONTAIN",
						"CONTAIN-HEXADECIMAL",
						"NON-CONTAIN-HEXADECIMAL",
						"WILDCARD",
						"NON-WILDCARD",
						"REGULAR",
						"NON-REGULAR"
					],
					"example": "CONTAIN"
				},
				"case_sensitive": {
					"description": "大小写敏感（ENABLE启用/DISABLE禁用）",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "ENABLE"
				},
				"pattern": {
					"description": "匹配样本",
					"type": "string",
					"example": "One"
				}
			}
		},
		"config.alert_event": {
			"type": "object",
			"properties": {
				"link_down": {
					"type": "string",
					"description": "链路故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"ddos_attack": {
					"type": "string",
					"description": "网络攻击",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"node_down": {
					"type": "string",
					"description": "节点故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"vs_down": {
					"type": "string",
					"description": "虚拟服务故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"ha_failure": {
					"type": "string",
					"description": "高可用性故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"certificate_expired": {
					"description": "证书过期",
					"type": "string",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"crl_update_fail": {
					"type": "string",
					"description": "CRL更新失败",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"security_down": {
					"type": "string",
					"description": "安全设备故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"snat_sport_exhaustion": {
					"type": "string",
					"description": "SNAT源端口枯竭告警",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"pcie_failure": {
					"type": "string",
					"description": "PCIE设备故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"memory_failure": {
					"type": "string",
					"description": "内存故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"cpu_usage": {
					"type": "object",
					"description": "CPU负荷告警",
					"properties": {
						"state": {
							"type": "string",
							"description": "CPU负荷告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold_percent": {
							"type": "integer",
							"description": "CPU负荷阈值",
							"default": 80,
							"example": 80,
							"minimum": 1,
							"maximum": 100
						},
						"persist": {
							"type": "integer",
							"description": "持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"memory_usage": {
					"type": "object",
					"description": "内存占用告警",
					"properties": {
						"state": {
							"type": "string",
							"description": "内存占用告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold_percent": {
							"type": "integer",
							"description": "内存占用阈值",
							"default": 90,
							"example": 90,
							"minimum": 1,
							"maximum": 100
						},
						"persist": {
							"type": "integer",
							"description": "持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"disk_usage": {
					"type": "object",
					"description": "磁盘占用告警",
					"properties": {
						"state": {
							"type": "string",
							"description": "磁盘占用告警",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold_percent": {
							"description": "节点故障",
							"type": "integer",
							"default": 90,
							"example": 90,
							"minimum": 60,
							"maximum": 100
						}
					}
				},
				"system_connection": {
					"type": "object",
					"description": "系统并发连接数告警",
					"properties": {
						"state": {
							"description": "系统并发连接数告警启/禁用状态",
							"type": "string",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"type": "integer",
							"description": "系统并发连接数阈值",
							"default": 3440000,
							"example": 100000,
							"minimum": 1,
							"maximum": 1000000000
						},
						"persist": {
							"type": "integer",
							"description": "持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"vs_connection": {
					"type": "object",
					"description": "虚拟服务连接数告警",
					"properties": {
						"state": {
							"type": "string",
							"description": "虚拟服务连接数告警",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"description": "虚拟服务连接数阈值",
							"type": "integer",
							"default": 560000,
							"example": 100000,
							"minimum": 1,
							"maximum": 1000000000
						},
						"persist": {
							"type": "integer",
							"description": "持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"vs_new_conns": {
					"type": "object",
					"description": "虚拟服务新建连接数告警",
					"properties": {
						"state": {
							"type": "string",
							"description": "虚拟服务新建连接数告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"description": "虚拟服务新建连接数阈值",
							"type": "integer",
							"default": 100000,
							"example": 100000,
							"minimum": 1,
							"maximum": 1000000000
						},
						"persist": {
							"description": "持续时间",
							"type": "integer",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"system_new_conns": {
					"type": "object",
					"description": "系统新建连接数告警",
					"properties": {
						"state": {
							"type": "string",
							"description": "系统新建连接数告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"type": "integer",
							"description": "系统新建连接数阈值",
							"default": 100000,
							"example": 100000,
							"minimum": 1,
							"maximum": 1000000000
						},
						"persist": {
							"type": "integer",
							"description": "持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"system_throughput": {
					"description": "吞吐量告警",
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"description": "吞吐量告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"type": "integer",
							"description": "吞吐量阈值",
							"default": 1000,
							"example": 1000,
							"minimum": 1,
							"maximum": 1000000000
						},
						"persist": {
							"type": "integer",
							"description": "持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"ssl_new_conns": {
					"description": "SSL新建连接数告警",
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"description": "SSL新建连接数告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"type": "integer",
							"description": "SSL新建连接数阈值",
							"default": 100000,
							"example": 100000,
							"minimum": 1,
							"maximum": 1000000000
						},
						"persist": {
							"type": "integer",
							"description": "SSL新建连接数持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"cpu_temperature": {
					"description": "CPU温度告警",
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"description": "CPU温度告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold": {
							"type": "integer",
							"description": "CPU温度阈值",
							"default": 75,
							"example": 75,
							"minimum": 1,
							"maximum": 120
						},
						"persist": {
							"type": "integer",
							"description": "CPU温度持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"fan_speed": {
					"description": "风扇转速告警",
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"description": "风扇转速告警启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"threshold_min": {
							"type": "integer",
							"description": "风扇转速最小阈值",
							"default": 1500,
							"example": 1500,
							"minimum": 1,
							"maximum": 20000
						},
						"threshold_max": {
							"type": "integer",
							"description": "风扇转速最大阈值",
							"default": 9000,
							"example": 9000,
							"minimum": 1,
							"maximum": 20000
						},
						"persist": {
							"type": "integer",
							"description": "风扇转速持续时间",
							"default": 60,
							"example": 60,
							"minimum": 1,
							"maximum": 300
						}
					}
				},
				"log_content_match": {
					"description": "日志关键字匹配",
					"type": "object",
					"properties": {
						"state": {
							"type": "string",
							"description": "日志关键字匹配启/禁用状态",
							"enum": [
								"ENABLE",
								"DISABLE"
							],
							"default": "DISABLE",
							"example": "DISABLE"
						},
						"keyword": {
							"type": "string",
							"description": "匹配关键字",
							"example": "vs_ebank",
							"minLength": 1,
							"maxLength": 1024
						}
					}
				}
			}
		},
		"config.ras_alert_event": {
			"type": "object",
			"readOnly": true,
			"properties": {
				"pcie_failure": {
					"type": "string",
					"description": "PCIE设备故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				},
				"memory_failure": {
					"type": "string",
					"description": "内存故障",
					"enum": [
						"ENABLE",
						"DISABLE"
					],
					"default": "DISABLE",
					"example": "DISABLE"
				}
			}
		},
		"config.certificate_detail": {
			"type": "object",
			"readOnly": true,
			"properties": {
				"cn": {
					"description": "通用名称",
					"type": "string"
				},
				"validity_not_before": {
					"description": "生效开始日期",
					"type": "string"
				},
				"validity_not_after": {
					"description": "生效截止日期",
					"type": "string"
				},
				"version": {
					"description": "证书版本",
					"type": "string"
				},
				"serial_number": {
					"description": "证书序号",
					"type": "string"
				},
				"subject": {
					"description": "证书主题",
					"type": "string"
				},
				"signature_algorithm": {
					"description": "签名算法",
					"type": "string"
				},
				"signature": {
					"description": "签名数据",
					"type": "string"
				},
				"issuer": {
					"description": "颁发者",
					"type": "string"
				},
				"public_key_algorithm": {
					"description": "公钥算法",
					"type": "string"
				},
				"public_key_length": {
					"description": "公钥长度",
					"type": "string"
				},
				"subject_alternative_name": {
					"description": "备用名称",
					"type": "array",
					"items": {
						"type": "string"
					}
				},
				"ca_valid": {
					"type": "string",
					"enum": [
						"VALID",
						"INVALID"
					]
				},
				"server_valid": {
					"type": "string",
					"enum": [
						"VALID",
						"INVALID"
					]
				},
				"pem_data": {
					"description": "证书PEM文本",
					"type": "string"
				}
			}
		},
		"config.certificate_detail_with_token": {
			"type": "object",
			"required": [
				"certificate_token"
			],
			"properties": {
				"cn": {
					"description": "通用名称",
					"type": "string"
				},
				"validity_not_before": {
					"description": "生效开始日期",
					"type": "string"
				},
				"validity_not_after": {
					"description": "生效截止日期",
					"type": "string"
				},
				"version": {
					"description": "证书版本",
					"type": "string"
				},
				"serial_number": {
					"description": "证书序号",
					"type": "string"
				},
				"subject": {
					"description": "证书主题",
					"type": "string"
				},
				"signature_algorithm": {
					"description": "签名算法",
					"type": "string"
				},
				"signature": {
					"description": "签名数据",
					"type": "string"
				},
				"issuer": {
					"description": "颁发者",
					"type": "string"
				},
				"public_key_algorithm": {
					"description": "公钥算法",
					"type": "string"
				},
				"public_key_length": {
					"description": "公钥长度",
					"type": "string"
				},
				"subject_alternative_name": {
					"description": "备用名称",
					"type": "array",
					"items": {
						"type": "string"
					}
				},
				"ca_valid": {
					"type": "string",
					"enum": [
						"VALID",
						"INVALID"
					]
				},
				"server_valid": {
					"type": "string",
					"enum": [
						"VALID",
						"INVALID"
					]
				},
				"pem_data": {
					"description": "证书PEM文本",
					"type": "string"
				},
				"private_key_token": {
					"description": "私钥文件资源令牌",
					"type": "string"
				},
				"private_key_password": {
					"description": "私钥密码",
					"writeOnly": true,
					"type": "string"
				},
				"pk_private_key_password": {
					"description": "私钥密码-密文",
					"type": "string"
				},
				"encrypted_private_key_password": {
					"description": "私钥密码-密文",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"certificate_md5": {
					"description": "证书标识-MD5",
					"type": "string"
				},
				"certificate_token": {
					"description": "证书文件资源令牌",
					"type": "string"
				}
			}
		},
		"config.certificate_fingerprint_with_token": {
			"type": "object",
			"required": [
				"certificate_token"
			],
			"properties": {
				"certificate_md5": {
					"description": "证书标识-MD5",
					"type": "string"
				},
				"certificate_token": {
					"description": "证书文件资源令牌",
					"type": "string"
				},
				"private_key_token": {
					"description": "私钥证书token",
					"type": "string"
				},
				"private_key_password": {
					"description": "私钥密码",
					"type": "string",
					"writeOnly": true
				},
				"pk_private_key_password": {
					"description": "加密的私钥密码",
					"type": "string",
					"writeOnly": true
				},
				"encrypted_private_key_password": {
					"description": "加密的私钥密码",
					"type": "string",
					"writeOnly": true
				}
			}
		},
		"config.certificate_private_key_with_token": {
			"type": "object",
			"properties": {
				"private_key_token": {
					"description": "私钥文件资源令牌",
					"type": "string"
				},
				"private_key_password": {
					"description": "私钥密码",
					"writeOnly": true,
					"type": "string"
				},
				"encrypted_private_key_password": {
					"description": "私钥密码-密文",
					"type": "string",
					"example": "A1B2C3D4"
				},
				"certificate_md5": {
					"description": "证书标识-MD5",
					"type": "string"
				},
				"certificate_token": {
					"description": "证书文件资源令牌",
					"type": "string"
				},
				"pk_private_key_password": {
					"description": "加密的私钥密码",
					"type": "string",
					"writeOnly": true
				}
			}
		},
		"config.sm2_certificate_private_key_with_token": {
			"type": "object",
			"properties": {
				"file_token": {
					"description": "证书token",
					"type": "string"
				},
				"password": {
					"description": "证书密码",
					"type": "string",
					"default": ""
				},
				"pk_password": {
					"description": "私钥加密密码",
					"type": "string"
				}
			}
		},
		"config.san_extensions": {
			"type": "object",
			"properties": {
				"san_type": {
					"description": "SAN字段类型",
					"type": "string",
					"enum": [
						"SAN_DNS",
						"SAN_IP"
					],
					"default": "SAN_DNS",
					"example": "SAN_DNS"
				},
				"dns_value": {
					"description": "SAN DNS字段值",
					"type": "string",
					"example": "*.text.com"
				},
				"ip_value": {
					"description": "SAN IP字段值",
					"type": "string",
					"example": "192.168.100.1"
				}
			}
		},
		"config.reference_relation": {
			"type": "array",
			"items": {
				"type": "object",
				"properties": {
					"type": {
						"type": "string",
						"example": ""
					},
					"object": {
						"type": "string",
						"example": ""
					}
				}
			}
		},
		"cgi.file_resource": {
			"type": "object",
			"readOnly": true,
			"properties": {
				"d": {
					"description": "资源文件令牌",
					"type": "string",
					"example": "1A2B3C4D5E6F"
				},
				"file_name": {
					"description": "资源文件名",
					"type": "string",
					"example": "config_snat_20170807165401.csv"
				},
				"file_type": {
					"description": "资源类型",
					"type": "string",
					"enum": [
						"JSON",
						"CSV",
						"TEXT",
						"BINARY",
						"ZIP",
						"GZIP",
						"SSU",
						"OTHER"
					],
					"example": "CSV"
				},
				"expired": {
					"description": "过期时间戳",
					"type": "integer"
				},
				"flag": {
					"description": "上传结果",
					"type": "string",
					"enum": [
						"BAD_PARAM",
						"FILE_EXIST",
						"DIRECT_UPLOAD_OK",
						"OUT_OF_SIZE",
						"WRITE_FILE_FAIL",
						"SPLIT_TOO_SMALL",
						"PARTITION_UPLOAD_OK",
						"SPLIT_UPLOAD_OK",
						"SPLIT_EXIST",
						"FILE_NOT_EXIST",
						"PARTITION_FILE_EXIST",
						"SERVER_ERROR",
						"NO_PERMISSION"
					]
				}
			}
		},
		"debug.async_operation_response_list": {
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
						"$ref": "#/definitions/debug.async_operation_response"
					}
				}
			}
		},
		"debug.async_operation_response": {
			"type": "object",
			"properties": {
				"event_id": {
					"description": "异步任务ID",
					"type": "integer"
				},
				"operation": {
					"description": "任务操作来源",
					"type": "string",
					"example": "/debug/sys/maintenance/restart-service"
				},
				"state": {
					"description": "任务状态（WAITING等待/INCOMPLETE未完成/LOST丢失/RESTARTING重新执行/SUCCESS成功/FAILED失败）",
					"type": "string",
					"enum": [
						"WAITING",
						"INCOMPLETE",
						"LOST",
						"RESTARTING",
						"SUCCESS",
						"FAILED",
						"<..>"
					]
				},
				"start_time": {
					"description": "任务启动时间",
					"type": "string",
					"example": "2018-04-02 08:30:21"
				},
				"finish_time": {
					"description": "任务完成时间",
					"type": "string",
					"example": "2018-04-02 08:31:05"
				},
				"triggered_by": {
					"description": "任务启动用户",
					"type": "string",
					"example": "admin"
				},
				"data": {
					"type": "object",
					"description": "任务数据"
				}
			}
		},
		"debug.verify_operator": {
			"type": "object",
			"properties": {
				"username": {
					"description": "用户名",
					"type": "string",
					"example": "admin"
				},
				"password": {
					"description": "密码",
					"type": "string",
					"writeOnly": true,
					"example": "admin"
				}
			}
		},
		"config.service_type": {
			"type": "string",
			"enum": [
				"IP",
				"ANY",
				"TCP-FORWARD",
				"TCP-PROXY",
				"UDP-FORWARD",
				"UDP-PROXY",
				"HTTP",
				"SSL-OFFLOAD",
				"SSL-OFFLOAD-HTTPS",
				"RADIUS",
				"DNS",
				"FTP",
				"SIP-TCP",
				"SIP-UDP",
				"8583"
			],
			"description": "指定虚拟服务的类型。",
			"example": "HTTP",
			"default": "HTTP"
		}
	},
	"securityDefinitions": {
		"basic_auth": {
			"type": "basic"
		},
		"token_auth": {
			"type": "apiKey",
			"flow": "password",
			"tokenUrl": "https://localhost/api/token"
		}
	},
	"security": [
		{
			"basic_auth": []
		},
		{
			"token_auth": []
		}
	]
}