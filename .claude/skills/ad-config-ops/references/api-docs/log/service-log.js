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
		"/api/ad/v3/log/service-log/": {
			"description": "查看服务日志",
			"parameters": [
				{
					"$ref": "/api/{common}.yaml#/parameters/token"
				}
			],
			"get": {
				"tags": [
					"service-log"
				],
				"summary": "retrieve service-log",
				"description": "",
				"operationId": "retrieve_service_log_list",
				"parameters": [
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/skip"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/top"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/select"
					},
					{
						"$ref": "/api/{common}.yaml#/parameters/search"
					},
					{
						"$ref": "#/parameters/from"
					},
					{
						"$ref": "#/parameters/to"
					},
					{
						"$ref": "#/parameters/level"
					},
					{
						"$ref": "#/parameters/module"
					}
				],
				"responses": {
					"200": {
						"$ref": "#/responses/operation_debug_service_log_list"
					}
				}
			},
			"__sfcli_example__": [
				{
					"command": "list log service-log level [ DEBUG INFO ALERT ERROR ] from \"2019-07-01 05:05:0\" to \"2019-07-15 0:0:0\" module [ adapi appd ]",
					"description": "查看在2019-07-01 05:05:0至2019-07-15 0:0:0时间段内，adapi和appd模块的调试、信息、告警和错误日志"
				}
			]
		}
	},
	"parameters": {
		"from": {
			"name": "from",
			"in": "query",
			"type": "string",
			"required": false,
			"description": "可选参数；日志查看查询周期的起始时间，当配置了查询周期结束时间（to）时必须配置；不配置时默认为输出当天（系统时间）日志；格式为: YYYY-MM-DD hh:mm:ss"
		},
		"to": {
			"name": "to",
			"in": "query",
			"type": "string",
			"required": false,
			"description": "可选参数；日志查看查询周期的结束时间。格式为: YYYY-MM-DD hh:mm:ss"
		},
		"level": {
			"name": "level",
			"in": "query",
			"required": false,
			"type": "array",
			"items": {
				"type": "string",
				"enum": [
					"INFO",
					"ALERT",
					"ERROR",
					"DEBUG"
				],
				"example": "ALERT"
			},
			"description": "可选参数；查看日志的级别，无选项时全部输出"
		},
		"module": {
			"name": "module",
			"in": "query",
			"required": false,
			"type": "array",
			"items": {
				"type": "string",
				"enum": [
					"REPD",
					"ALARM",
					"MAIL",
					"LINKD",
					"APPD",
					"WEBUI",
					"RS_DETECT",
					"ISP_DISCOVER",
					"DOMAIN_DISCOVER",
					"DDOS",
					"FCENTERD",
					"DY",
					"DNS_MONITOR",
					"SYS",
					"AD_AUDIT_LOG",
					"GFAD",
					"GFAD_REPORT",
					"DNS_PROXY",
					"CLUSTER",
					"ISP_UPDATE",
					"CRL_UPDATE",
					"URL_FLOW_PROXY",
					"STAT",
					"VAD_MNG",
					"VAD_IOWATCH",
					"ADINFO",
					"DDOS_LOG",
					"DC_LOG",
					"ISP_AGENT_LOG",
					"PPPOED",
					"NH_MONITOR",
					"ISP_SERVER_UPDATE",
					"APP_ROUTE",
					"CGRULESENGD",
					"DOMAIN_SET_UPDATE",
					"PPPOED1",
					"PPPOED2",
					"PPPOED3",
					"PPPOED4",
					"PPPOED5",
					"PPPOED6",
					"PPPOED7",
					"PPPOED8",
					"PPPOED9",
					"PPPOED10",
					"PPPOED11",
					"PPPOED12",
					"PPPOED13",
					"PPPOED14",
					"PPPOED15",
					"PPPOED16",
					"CONFIG_CENTER",
					"CFG_CTR_AG",
					"SCRIPT",
					"DPDK",
					"NTP_UPDATE",
					"OBJECT_LOG"
				],
				"example": "CONFIG_CENTER"
			},
			"description": "可选参数；过滤某个模块的日志，不输入该参数时，输出全部模块的日志。（repd-报表数据中心/alarm-告警中心/mail-邮件发送/linkd-链路监视器/appd-应用负载/webui-Web控制台/rs_detect-节点监视器/isp_discover-isp探测/domain_discover-域名探测/ddos-网络攻击防护/fcenterd-文件维护中心/dy-出站动态探测/dns_monitor-DNS监视器/sys-系统维护/ad_audit_log-日志维护中心/gfad-智能DNS/gfad_report-全局报表代理/dns_proxy-DNS代理/cluster-高可用性/isp_update-ISP更新/crl_update-CRL更新/url_flow_proxy-/stat-系统状态/vad_mng-/vad_iowatch-/adinfo-DNS探测/ddos_log-七层Ddos攻击分析/dc_log-数据中心日志/isp_agent_log-ISP代理/pppoed(1-17)-PPPOE/nh_monitor-静态路由监视器/isp_server_update-ISP地址集更新/app_route-应用识别/cgrulesengd-/domain_set_update-内置域名集更新/config_center-配置中心/cfg_ctr_ag-配置代理/script-iPro/dpdk-DPDK服务器/ntp_update-NTP时间同步/updater-升级转换/adapi-ADAPI/）"
		}
	},
	"responses": {
		"operation_debug_service_log_list": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.service_log_list"
			}
		},
		"operation_debug_service_log": {
			"description": "Display debug with JSON formatted",
			"schema": {
				"$ref": "#/definitions/debug.service_log_row"
			}
		}
	},
	"definitions": {
		"debug.service_log_list": {
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
					"description": "当前项目",
					"type": "array",
					"items": {
						"$ref": "#/definitions/debug.service_log_row"
					}
				}
			}
		},
		"debug.service_log_row": {
			"type": "object",
			"properties": {
				"service_log_id": {
					"type": "integer",
					"description": "服务日志ID"
				},
				"date": {
					"type": "string",
					"description": "打此条日志的日期",
					"example": "YYYY-MM-DD"
				},
				"time": {
					"type": "string",
					"description": "打此条日志的时间",
					"example": "hh:mm:ss"
				},
				"level": {
					"description": "日志级别",
					"type": "string",
					"enum": [
						"INFO",
						"ALERT",
						"ERROR",
						"DEBUG"
					],
					"example": "ALERT"
				},
				"module": {
					"description": "日志所属模块",
					"type": "string",
					"example": "CONFIG_CENTER"
				},
				"detail": {
					"type": "string",
					"description": "日志详情",
					"example": ""
				}
			}
		}
	}
}