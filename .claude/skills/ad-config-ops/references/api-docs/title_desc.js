module.exports ={
	"swagger": "2.0",
	"toc": [
		{
			"text": "基础",
			"kids": [
				{
					"text": "令牌管理",
					"kids": [
						{
							"text": "令牌管理",
							"path": "/token"
						},
						{
							"text": "更新令牌",
							"path": "/refresh-token"
						}
					]
				},
				{
					"text": "场景状态",
					"path": "/scenario"
				}
			]
		},
		{
			"text": "应用负载",
			"kids": [
				{
					"text": "虚拟服务",
					"kids": [
						{
							"text": "虚拟服务",
							"path": "/slb/virtual-service"
						},
						{
							"text": "虚拟IP",
							"path": "/slb/virtual-ip"
						},
						{
							"text": "SNAT地址集",
							"path": "/slb/snat-pool"
						}
					]
				},
				{
					"text": "安全服务链",
					"kids": [
						{
							"text": "安全服务链",
							"kids": [
								{
									"text": "安全服务链",
									"path": "/slb/service-chain"
								},
								{
									"text": "获取关联指定服务链的虚拟服务列表信息",
									"path": "/slb/service-chain/{name}/associated-vs"
								},
								{
									"text": "获取关联指定服务链的前置策略列表信息",
									"path": "/slb/service-chain/{name}/associated-pre-rule"
								},
								{
									"text": "获取所有服务链关联的虚拟服务列表信息",
									"path": "/slb/service-chain/all/associated-vs"
								},
								{
									"text": "获取所有服务链关联的前置策略列表信息",
									"path": "/slb/service-chain/all/associated-pre-rule"
								}
							]
						},
						{
							"text": "安全资源池",
							"kids": [
								{
									"text": "安全资源池",
									"path": "/slb/security-pool"
								},
								{
									"text": "安全设备",
									"path": "/slb/security-node"
								}
							]
						}
					]
				},
				{
					"text": "节点池",
					"kids": [
						{
							"text": "节点池",
							"kids": [
								{
									"text": "节点池",
									"path": "/slb/pool"
								},
								{
									"text": "节点池节点列表",
									"path": "/slb/pool/{pool_name}/nodes"
								},
								{
									"text": "节点池节点",
									"path": "/slb/pool/{pool_name}/nodes/{node_name}"
								},
								{
									"text": "节点",
									"path": "/slb/node"
								},
								{
									"text": "手动恢复节点",
									"path": "/debug/slb/pool/{pool_name}/resume"
								}
							]
						},
						{
							"text": "业务健康检查",
							"kids": [
								{
									"text": "查看业务健康检查",
									"path": "/slb/service-monitor/all"
								},
								{
									"text": "icmp",
									"path": "/slb/service-monitor/icmp"
								},
								{
									"text": "icmpv6",
									"path": "/slb/service-monitor/icmpv6"
								},
								{
									"text": "http",
									"path": "/slb/service-monitor/http"
								},
								{
									"text": "https",
									"path": "/slb/service-monitor/https"
								},
								{
									"text": "connect-tcp",
									"path": "/slb/service-monitor/connect-tcp"
								},
								{
									"text": "connect-udp",
									"path": "/slb/service-monitor/connect-udp"
								},
								{
									"text": "connect-ssl",
									"path": "/slb/service-monitor/connect-ssl"
								},
								{
									"text": "tcp-half-open",
									"path": "/slb/service-monitor/tcp-half-open"
								},
								{
									"text": "dns",
									"path": "/slb/service-monitor/dns"
								},
								{
									"text": "ftp",
									"path": "/slb/service-monitor/ftp"
								},
								{
									"text": "radius",
									"path": "/slb/service-monitor/radius"
								},
								{
									"text": "ldap",
									"path": "/slb/service-monitor/ldap"
								},
								{
									"text": "passive-http",
									"path": "/slb/service-monitor/passive-http"
								},
								{
									"text": "passive-tcp",
									"path": "/slb/service-monitor/passive-tcp"
								},
								{
									"text": "mssql-database",
									"path": "/slb/service-monitor/mssql-database"
								},
								{
									"text": "oracle-database",
									"path": "/slb/service-monitor/oracle-database"
								},
								{
									"text": "monitor-expression",
									"path": "/slb/service-monitor/monitor-expression"
								},
								{
									"text": "external-monitor",
									"path": "/slb/service-monitor/external-monitor"
								},
								{
									"text": "sip",
									"path": "/slb/service-monitor/sip"
								},
								{
									"text": "snmp",
									"path": "/slb/service-monitor/snmp"
								},
								{
									"text": "mysql-database",
									"path": "/slb/service-monitor/mysql-database"
								}
							]
						},
						{
							"text": "会话保持",
							"kids": [
								{
									"text": "查看会话保持",
									"path": "/slb/persist/all"
								},
								{
									"text": "Cookie插入会话保持",
									"path": "/slb/persist/cookie-insert"
								},
								{
									"text": "Cookie改写会话保持",
									"path": "/slb/persist/cookie-rewrite"
								},
								{
									"text": "Cookie学习会话保持",
									"path": "/slb/persist/cookie-study"
								},
								{
									"text": "SourceIP会话保持",
									"path": "/slb/persist/source-ip"
								},
								{
									"text": "SourceIP and SourcePort会话保持",
									"path": "/slb/persist/source-ip-port"
								},
								{
									"text": "HTTP请求被动",
									"path": "/slb/persist/http-request-study"
								},
								{
									"text": "HTTP应答被动",
									"path": "/slb/persist/http-response-study"
								},
								{
									"text": "SIP会话保持",
									"path": "/slb/persist/sip"
								},
								{
									"text": "radius会话保持",
									"path": "/slb/persist/radius"
								},
								{
									"text": "ssl sessionid会话保持",
									"path": "/slb/persist/ssl-sessionid"
								},
								{
									"text": "查看虚拟服务节点池会话保持",
									"path": "/debug/slb/persist"
								},
								{
									"text": "清除虚拟服务会话保持记录",
									"path": "/debug/slb/persist/clear"
								}
							]
						}
					]
				},
				{
					"text": "业务主机",
					"kids": [
						{
							"text": "业务主机",
							"path": "/slb/service-host"
						}
					]
				},
				{
					"text": "前置策略",
					"kids": [
						{
							"text": "查看前置策略",
							"path": "/slb/pre-rule/all"
						},
						{
							"text": "HTTP服务前置策略",
							"path": "/slb/pre-rule/http"
						},
						{
							"text": "HTTPS服务前置策略",
							"path": "/slb/pre-rule/ssl-offload-https"
						},
						{
							"text": "DNS服务前置策略",
							"path": "/slb/pre-rule/dns"
						},
						{
							"text": "FTP服务前置策略",
							"path": "/slb/pre-rule/ftp"
						},
						{
							"text": "RADIUS服务前置策略",
							"path": "/slb/pre-rule/radius"
						},
						{
							"text": "三层服务前置策略",
							"path": "/slb/pre-rule/ip"
						},
						{
							"text": "四层服务前置策略",
							"path": "/slb/pre-rule/tcp-forward"
						},
						{
							"text": "七层服务前置策略",
							"path": "/slb/pre-rule/tcp-proxy"
						},
						{
							"text": "四层UDP服务前置策略",
							"path": "/slb/pre-rule/udp-forward"
						},
						{
							"text": "七层UDP服务前置策略",
							"path": "/slb/pre-rule/udp-proxy"
						},
						{
							"text": "SSL服务前置策略",
							"path": "/slb/pre-rule/ssl-offload"
						},
						{
							"text": "SIP服务前置策略",
							"path": "/slb/pre-rule/sip"
						},
						{
							"text": "8583服务前置策略",
							"path": "/slb/pre-rule/8583"
						},
						{
							"text": "Any服务前置策略",
							"path": "/slb/pre-rule/any"
						},
						{
							"text": "前置策略",
							"path": "/slb/virtual-service/{virtual_service_name}/pre-rule"
						},
						{
							"text": "前置策略",
							"path": "/slb/virtual-service/{virtual_service_name}/pre-rule/{pre_rule_name}"
						}
					]
				},
				{
					"text": "SSL策略",
					"kids": [
						{
							"text": "SSL卸载策略",
							"path": "/slb/ssl-client"
						},
						{
							"text": "SSL加密策略",
							"path": "/slb/ssl-server"
						}
					]
				},
				{
					"text": "优化策略",
					"kids": [
						{
							"text": "HTTP优化策略",
							"path": "/slb/http-profile"
						},
						{
							"text": "HTTP2优化策略",
							"path": "/slb/http2-profile"
						},
						{
							"text": "HTTP改写策略",
							"kids": [
								{
									"text": "查看HTTP改写策略",
									"path": "/slb/http-rewrite/all"
								},
								{
									"text": "HTTP请求改写策略",
									"path": "/slb/http-rewrite/request"
								},
								{
									"text": "HTTP应答改写改写策略",
									"path": "/slb/http-rewrite/response"
								},
								{
									"text": "重置HTTP改写策略匹配次数",
									"path": "/debug/slb/http-rewrite/reset"
								}
							]
						},
						{
							"text": "TCP策略",
							"kids": [
								{
									"text": "查看TCP策略",
									"path": "/slb/tcp-profile/all"
								},
								{
									"text": "三层TCP策略",
									"path": "/slb/tcp-profile/l3-forward"
								},
								{
									"text": "四层TCP策略",
									"path": "/slb/tcp-profile/l4-forward"
								},
								{
									"text": "七层TCP策略",
									"path": "/slb/tcp-profile/l7-proxy"
								},
								{
									"text": "虚拟服务TCP策略",
									"path": "/slb/virtual-service/{virtual_service_name}/tcp-profile"
								}
							]
						},
						{
							"text": "SIP策略",
							"path": "/slb/sip-profile"
						},
						{
							"text": "UDP策略",
							"path": "/slb/udp-profile"
						}
					]
				},
				{
					"text": "安全策略",
					"kids": [
						{
							"text": "HTTP防护策略",
							"path": "/slb/http-defence"
						},
						{
							"text": "QoS策略",
							"path": "/slb/qos-profile"
						},
						{
							"text": "访问控制策略",
							"kids": [
								{
									"text": "用户管理",
									"path": "/slb/user"
								},
								{
									"text": "控制策略",
									"path": "/slb/access-control-profile"
								}
							]
						}
					]
				},
				{
					"text": "iPro",
					"kids": [
						{
							"text": "iPro",
							"path": "/slb/ipro"
						}
					]
				}
			]
		},
		{
			"text": "链路负载",
			"kids": [
				{
					"text": "智能路由",
					"kids": [
						{
							"text": "智能路由",
							"path": "/lc/policy-route"
						},
						{
							"text": "智能路由高级配置",
							"path": "/lc/policy-route-advanced"
						},
						{
							"text": "智能路由调试",
							"kids": [
								{
									"text": "智能路由会话保持查询管理",
									"path": "/debug/lc/persist"
								},
								{
									"text": "清除智能能路由会话保持",
									"path": "/debug/lc/persist/clear"
								},
								{
									"text": "重置智能路由统计数据",
									"path": "/debug/lc/policy-route"
								},
								{
									"text": "智能路由规则操作",
									"path": "/debug/lc/policy-route/simulator"
								},
								{
									"text": "重置智能路由匹配次数",
									"path": "/debug/lc/policy-route/reset"
								}
							]
						},
						{
							"text": "时间计划",
							"path": "/lc/time-plan"
						}
					]
				},
				{
					"text": "DNS代理",
					"kids": [
						{
							"text": "DNS代理",
							"path": "/lc/dns-proxy"
						},
						{
							"text": "优先代理策略",
							"path": "/lc/dns-pre-rule"
						},
						{
							"text": "内网DNS记录",
							"kids": [
								{
									"text": "查看内网DNS记录",
									"path": "/lc/dns-intranet-record/all"
								},
								{
									"text": "A记录",
									"path": "/lc/dns-intranet-record/a"
								},
								{
									"text": "AAAA记录",
									"path": "/lc/dns-intranet-record/aaaa"
								},
								{
									"text": "MX记录",
									"path": "/lc/dns-intranet-record/mx"
								},
								{
									"text": "CNAME记录",
									"path": "/lc/dns-intranet-record/cname"
								},
								{
									"text": "TXT记录",
									"path": "/lc/dns-intranet-record/txt"
								}
							]
						}
					]
				}
			]
		},
		{
			"text": "全局负载",
			"kids": [
				{
					"text": "DNS服务",
					"kids": [
						{
							"text": "虚拟服务",
							"path": "/dns/dns-virtual-service/virtual-service"
						},
						{
							"text": "DNS策略",
							"path": "/dns/dns-virtual-service/dns-profile"
						}
					]
				},
				{
					"text": "GSLB",
					"kids": [
						{
							"text": "域名映射",
							"path": "/dns/gslb/{dns_config_area}/domain-map"
						},
						{
							"text": "虚拟IP池",
							"kids": [
								{
									"text": "虚拟IP池",
									"path": "/dns/gslb/{dns_config_area}/vip-pool"
								},
								{
									"text": "虚拟IP配置",
									"path": "/dns/gslb/{dns_config_area}/vip-pool/{vip_pool_name}/vips"
								},
								{
									"text": "虚拟IP配置",
									"path": "/dns/gslb/{dns_config_area}/vip-pool/{vip_pool_name}/vips/{vip}"
								}
							]
						},
						{
							"text": "LDNS地址集",
							"path": "/dns/gslb/{dns_config_area}/ldns-address-group"
						}
					]
				},
				{
					"text": "权威域",
					"kids": [
						{
							"text": "权威域",
							"kids": [
								{
									"text": "权威域",
									"path": "/dns/zone/{dns_config_area}/zone"
								},
								{
									"text": "权威域同步",
									"path": "/debug/dns/zone/{dns_config_area}/synchronize"
								}
							]
						},
						{
							"text": "DNS记录",
							"kids": [
								{
									"text": "查看DNS记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/all"
								},
								{
									"text": "A记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/a"
								},
								{
									"text": "AAAA记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/aaaa"
								},
								{
									"text": "CAA记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/caa"
								},
								{
									"text": "CNAME记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/cname"
								},
								{
									"text": "MX记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/mx"
								},
								{
									"text": "NS记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/ns"
								},
								{
									"text": "PTR记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/ptr"
								},
								{
									"text": "DNAME记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/dname"
								},
								{
									"text": "DS记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/ds"
								},
								{
									"text": "HINFO记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/hinfo"
								},
								{
									"text": "NAPTR记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/naptr"
								},
								{
									"text": "SRV记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/srv"
								},
								{
									"text": "TXT记录",
									"path": "/dns/zone/{dns_config_area}/dns-records/txt"
								}
							]
						},
						{
							"text": "DNSSEC密钥",
							"path": "/dns/zone/{dns_config_area}/dnssec-key"
						},
						{
							"text": "TSIG密钥",
							"kids": [
								{
									"text": "TSIG密钥",
									"path": "/dns/zone/{dns_config_area}/tsig-key"
								},
								{
									"text": "TSIG密钥生成",
									"path": "/debug/dns/zone/{dns_config_area}/tsig-key/generate"
								}
							]
						}
					]
				},
				{
					"text": "数据中心配置",
					"kids": [
						{
							"text": "数据中心",
							"kids": [
								{
									"text": "数据中心",
									"path": "/dns/data-center"
								},
								{
									"text": "查看数据中心",
									"path": "/dns/data-center/all"
								},
								{
									"text": "本地数据中心",
									"path": "/dns/data-center/local"
								},
								{
									"text": "远端数据中心",
									"path": "/dns/data-center/remote"
								}
							]
						},
						{
							"text": "本地服务设备",
							"path": "/dns/local-device"
						},
						{
							"text": "全局配置选项",
							"path": "/dns/recovery-point"
						},
						{
							"text": "同步选项",
							"path": "/dns/config-synchronization"
						},
						{
							"text": "数据中心配置立即同步",
							"path": "/debug/dns/config-synchronization/sync-at-once"
						},
						{
							"text": "配置还原",
							"path": "/dns/recovery-point/{name}/recovery"
						}
					]
				},
				{
					"text": "LDNS",
					"kids": [
						{
							"text": "基本配置",
							"path": "/dns/local-dns/setting"
						},
						{
							"text": "本地",
							"path": "/dns/local-dns/local-zone"
						},
						{
							"text": "转发",
							"path": "/dns/local-dns/forward-zone"
						},
						{
							"text": "RPZ防火墙",
							"path": "/dns/local-dns/response-policy-zones"
						}
					]
				},
				{
					"text": "全局负载调试",
					"kids": [
						{
							"text": "DNS映射规则测试",
							"path": "/debug/dns/dns-map/simulator"
						},
						{
							"text": "LDNS缺失",
							"kids": [
								{
									"text": "LDNS来源封锁",
									"path": "/debug/dns/local-dns/block"
								},
								{
									"text": "LDNS封锁管理",
									"path": "/debug/dns/local-dns/block/{source_address}"
								},
								{
									"text": "LDNS缺失记录查询",
									"path": "/debug/dns/local-dns/defect"
								},
								{
									"text": "LDNS缺失记录清空",
									"path": "/debug/dns/local-dns/defect/clear"
								}
							]
						}
					]
				}
			]
		},
		{
			"text": "资源管理",
			"kids": [
				{
					"text": "SSL证书",
					"kids": [
						{
							"text": "查看所有证书",
							"path": "/rc/ssl-certificate/all"
						},
						{
							"text": "导出证书请求",
							"path": "/rc/ssl-certificate/all/{name}/request"
						},
						{
							"text": "新建证书",
							"path": "/rc/ssl-certificate/all/{name}/certificate"
						},
						{
							"text": "自签名SSL证书",
							"path": "/rc/ssl-certificate/self-signed"
						},
						{
							"text": "自签名SSL证书详情",
							"path": "/rc/ssl-certificate/self-signed/{name}/certificate"
						},
						{
							"text": "SSL证书请求",
							"path": "/rc/ssl-certificate/certificate-request"
						},
						{
							"text": "导出SSL证书请求",
							"path": "/rc/ssl-certificate/certificate-request/{name}/request"
						},
						{
							"text": "新建SSL证书请求",
							"path": "/rc/ssl-certificate/certificate-request/{name}/certificate"
						},
						{
							"text": "从文件导入证书",
							"path": "/rc/ssl-certificate/imported-certificate"
						},
						{
							"text": "导入的证书详情",
							"path": "/rc/ssl-certificate/imported-certificate/{name}/certificate"
						},
						{
							"text": "解析证书",
							"path": "/rc/certificate-utility/certificate-file-processing"
						},
						{
							"text": "CA证书",
							"path": "/rc/ca"
						},
						{
							"text": "CA证书导出",
							"path": "/rc/ca/{name}/certificate"
						},
						{
							"text": "CRL",
							"kids": [
								{
									"text": "CRL",
									"path": "/rc/crl"
								},
								{
									"text": "CRL手动更新",
									"path": "/debug/rc/crl"
								},
								{
									"text": "CRL证书吊销列表更新",
									"path": "/debug/rc/crl/{name}/update"
								}
							]
						}
					]
				},
				{
					"text": "自定义内容",
					"path": "/rc/http-content"
				},
				{
					"text": "规则地址库",
					"kids": [
						{
							"text": "用户地址集",
							"path": "/rc/custom-address-group"
						},
						{
							"text": "ISP地址集",
							"path": "/rc/isp-address-group"
						},
						{
							"text": "数据组",
							"path": "/rc/data-group"
						},
						{
							"text": "域名集",
							"path": "/rc/domain-group"
						},
						{
							"text": "应用规则库",
							"path": "/rc/application-identification"
						},
						{
							"text": "地域地址集",
							"path": "/rc/zone-address-group"
						},
						{
							"text": "全球地址库",
							"path": "/rc/global-address-library"
						},
						{
							"text": "区域地址库",
							"path": "/rc/global-address-library/{region}"
						},
						{
							"text": "国家地址库",
							"path": "/rc/global-address-library/{region}/countries"
						},
						{
							"text": "国家地址库",
							"path": "/rc/global-address-library/{region}/countries/{country}"
						},
						{
							"text": "城市地址库",
							"path": "/rc/global-address-library/{region}/countries/{country}/cities"
						},
						{
							"text": "城市地址库",
							"path": "/rc/global-address-library/{region}/countries/{country}/cities/{city}"
						}
					]
				}
			]
		},
		{
			"text": "网络配置",
			"kids": [
				{
					"text": "网络接口",
					"kids": [
						{
							"text": "查看链路",
							"path": "/net/link/all"
						},
						{
							"text": "LAN类型链路IP配置",
							"path": "/net/link/lan"
						},
						{
							"text": "WAN类型链路IP配置",
							"path": "/net/link/wan"
						},
						{
							"text": "虚拟网线类型链路IP配置",
							"path": "/net/link/virtual-wire"
						},
						{
							"text": "WAN类型PPPOE配置",
							"path": "/net/link/pppoe"
						},
						{
							"text": "pppoe链路播号与挂断",
							"path": "/debug/net/link/pppoe/{name}/{operation}"
						},
						{
							"text": "聚合网口",
							"path": "/net/bond"
						},
						{
							"text": "端口桥接",
							"path": "/net/bridge"
						},
						{
							"text": "VLAN子接口",
							"path": "/net/vlan"
						},
						{
							"text": "虚拟网线",
							"path": "/net/virtual-wire"
						},
						{
							"text": "VXNET接口",
							"path": "/net/vxnet"
						},
						{
							"text": "MACVLAN接口",
							"path": "/net/macvlan"
						},
						{
							"text": "网口模式配置",
							"path": "/net/interface-mode"
						},
						{
							"text": "LLDP配置",
							"path": "/net/lldp"
						},
						{
							"text": "可用网络接口适配列表",
							"path": "/net/interface-adapter/{module}"
						}
					]
				},
				{
					"text": "链路健康检查",
					"kids": [
						{
							"text": "查看链路健康检查",
							"path": "/net/link-monitor/all"
						},
						{
							"text": "icmp链路健康检查",
							"path": "/net/link-monitor/icmp"
						},
						{
							"text": "icmpv6链路健康检查",
							"path": "/net/link-monitor/icmpv6"
						},
						{
							"text": "connect-tcp链路健康检查",
							"path": "/net/link-monitor/connect-tcp"
						}
					]
				},
				{
					"text": "地址转换",
					"kids": [
						{
							"text": "源地址转换SNAT",
							"path": "/net/snat"
						},
						{
							"text": "重置源地址转换统计数据",
							"path": "/debug/net/snat/reset"
						},
						{
							"text": "目的地址转换DNAT",
							"path": "/net/dnat"
						},
						{
							"text": "重置DNAT命中统计次数",
							"path": "/debug/net/dnat/reset"
						}
					]
				},
				{
					"text": "网络安全",
					"kids": [
						{
							"text": "ACL",
							"kids": [
								{
									"text": "ACL配置",
									"path": "/net/acl"
								},
								{
									"text": "重置ACL统计数据",
									"path": "/debug/net/acl/reset"
								}
							]
						},
						{
							"text": "内网DDoS防护",
							"path": "/net/ddos-defend-lan"
						},
						{
							"text": "外网DDoS防护",
							"path": "/net/ddos-defend-wan"
						},
						{
							"text": "ARP/ND防护",
							"path": "/net/arp"
						},
						{
							"text": "ARP/ND批量新建",
							"path": "/net/arp-batch"
						},
						{
							"text": "批量获取ARP/ND",
							"path": "/debug/net/arp/discover"
						},
						{
							"text": "ARP广播",
							"kids": [
								{
									"text": "ARP广播设置",
									"path": "/net/arp-broadcast"
								},
								{
									"text": "主动ARP广播",
									"path": "/debug/net/arp-broadcast"
								}
							]
						},
						{
							"text": "ARP/ND代理",
							"path": "/net/arp-proxy"
						}
					]
				},
				{
					"text": "静态路由",
					"kids": [
						{
							"text": "静态路由规则配置",
							"path": "/net/static-route"
						},
						{
							"text": "静态路由有效性监视策略",
							"path": "/net/static-route-monitor"
						}
					]
				},
				{
					"text": "OSPF",
					"kids": [
						{
							"text": "OSPF全局配置",
							"path": "/net/ospf"
						},
						{
							"text": "OSPF接口配置",
							"path": "/net/ospf-interface"
						}
					]
				},
				{
					"text": "BGP",
					"path": "/net/bgp"
				},
				{
					"text": "OSPFv3",
					"kids": [
						{
							"text": "OSPFv3全局配置",
							"path": "/net/ospfv3"
						},
						{
							"text": "OSPFv3接口配置",
							"path": "/net/ospfv3-interface"
						}
					]
				},
				{
					"text": "RIP",
					"kids": [
						{
							"text": "RIP全局配置",
							"path": "/net/rip"
						},
						{
							"text": "RIP接口配置",
							"path": "/net/rip-interface"
						}
					]
				},
				{
					"text": "netns配置",
					"path": "/net/netns"
				}
			]
		},
		{
			"text": "系统配置",
			"kids": [
				{
					"text": "通用配置",
					"kids": [
						{
							"text": "更新管理口配置",
							"path": "/sys/management"
						},
						{
							"text": "系统维护配置",
							"path": "/sys/maintenance-mode"
						},
						{
							"text": "登录配置",
							"path": "/sys/web-service"
						},
						{
							"text": "修改SSH配置",
							"path": "/sys/ssh-setting"
						},
						{
							"text": "licence授权管理",
							"path": "/sys/licence"
						},
						{
							"text": "licence认证",
							"path": "/sys/licence/verify"
						},
						{
							"text": "项目配置",
							"path": "/sys/project"
						},
						{
							"text": "邮件服务器配置",
							"kids": [
								{
									"text": "邮件服务器配置",
									"path": "/sys/smtp"
								},
								{
									"text": "测试邮件服务器可用性",
									"path": "/debug/sys/smtp/verify"
								}
							]
						},
						{
							"text": "修改系统日期与时间",
							"path": "/sys/time"
						},
						{
							"text": "NTP时间同步与配置",
							"kids": [
								{
									"text": "NTP时间同步与配置",
									"path": "/sys/ntp"
								},
								{
									"text": "NTP立即同步",
									"path": "/debug/sys/ntp"
								}
							]
						},
						{
							"text": "HOSTs主机设置",
							"path": "/sys/host"
						},
						{
							"text": "局网络参数配置",
							"path": "/sys/network-setting"
						}
					]
				},
				{
					"text": "用户管理",
					"kids": [
						{
							"text": "用户管理",
							"kids": [
								{
									"text": "用户",
									"path": "/sys/user"
								},
								{
									"text": "当前用户",
									"path": "/sys/current-user"
								},
								{
									"text": "重置密码",
									"path": "/sys/current-user/reset-password"
								},
								{
									"text": "账户安全策略",
									"path": "/sys/passwd-policy"
								}
							]
						},
						{
							"text": "角色",
							"path": "/sys/role"
						},
						{
							"text": "外部认证登录",
							"path": "/sys/external-authentication"
						},
						{
							"text": "API权限控制",
							"path": "/sys/permission"
						}
					]
				},
				{
					"text": "SNMP",
					"kids": [
						{
							"text": "SNMP(v1/v2c)配置",
							"path": "/sys/snmp"
						},
						{
							"text": "SNMPv3配置",
							"path": "/sys/snmpv3"
						},
						{
							"text": "SNMP Traps配置",
							"path": "/sys/trap"
						}
					]
				},
				{
					"text": "告警日志配置",
					"kids": [
						{
							"text": "Email告警配置",
							"kids": [
								{
									"text": "Email告警配置",
									"path": "/sys/alert-mail"
								},
								{
									"text": "发送告警测试邮件",
									"path": "/debug/sys/alert-mail/verify"
								}
							]
						},
						{
							"text": "SNMP Trap告警配置",
							"kids": [
								{
									"text": "SNMP Trap告警配置",
									"path": "/sys/alert-trap"
								},
								{
									"text": "SNMP Traps告警测试",
									"path": "/debug/sys/alert-trap/verify"
								}
							]
						},
						{
							"text": "Syslog日志配置",
							"path": "/sys/syslog"
						},
						{
							"text": "RAS告警",
							"path": "/sys/alert-ras"
						},
						{
							"text": "HTTP日志配置",
							"path": "/sys/http-log"
						},
						{
							"text": "DNS日志配置",
							"path": "/sys/dns-log"
						}
					]
				},
				{
					"text": "系统维护",
					"kids": [
						{
							"text": "关机重启操作",
							"path": "/debug/sys/maintenance"
						},
						{
							"text": "关机重启操作",
							"path": "/debug/sys/maintenance/{operation}"
						},
						{
							"text": "配置备份与恢复",
							"kids": [
								{
									"text": "配置备份与恢复",
									"path": "/sys/backup-config"
								},
								{
									"text": "恢复出厂配置",
									"path": "/sys/backup-config/default/recovery"
								},
								{
									"text": "备份配置详情",
									"path": "/sys/backup-config/{name}/package"
								},
								{
									"text": "备份配置恢复",
									"path": "/sys/backup-config/{name}/recovery"
								},
								{
									"text": "导出配置",
									"path": "/sys/backup-config-package"
								},
								{
									"text": "恢复配置",
									"path": "/sys/backup-config-recovery"
								}
							]
						},
						{
							"text": "设置配置定时备份策略",
							"path": "/sys/backup-config-setting"
						},
						{
							"text": "系统升级",
							"kids": [
								{
									"text": "系统升级",
									"path": "/debug/sys/upgrade"
								},
								{
									"text": "升级包信息",
									"path": "/debug/sys/upgrade/extract-package-info"
								}
							]
						},
						{
							"text": "磁盘分区管理",
							"kids": [
								{
									"text": "磁盘分区",
									"path": "/sys/partition"
								},
								{
									"text": "分区切换",
									"path": "/debug/sys/partition"
								},
								{
									"text": "切换活动分区",
									"path": "/debug/sys/partition/{name}/activate"
								}
							]
						},
						{
							"text": "设备巡检",
							"path": "/sys/offline-check"
						},
						{
							"text": "版本镜像包管理",
							"path": "/rc/software-image"
						},
						{
							"text": "系统自动更新",
							"kids": [
								{
									"text": "系统自动更新",
									"path": "/sys/update"
								},
								{
									"text": "自动更新",
									"path": "/debug/sys/update"
								},
								{
									"text": "立即更新",
									"path": "/debug/sys/update/{module}"
								}
							]
						},
						{
							"text": "网络代理设置",
							"path": "/sys/proxy"
						},
						{
							"text": "系统隐私政策开关",
							"path": "/sys/privacy"
						}
					]
				},
				{
					"text": "报表设置",
					"kids": [
						{
							"text": "报表中心配置",
							"path": "/sys/report-setting"
						},
						{
							"text": "报表内容定制",
							"path": "/sys/report-task"
						},
						{
							"text": "报表自动投递邮件设置",
							"path": "/sys/report-mail"
						},
						{
							"text": "报表生成",
							"path": "/debug/sys/report-task"
						},
						{
							"text": "报表立即生成",
							"path": "/debug/sys/report-task/{name}/generator"
						}
					]
				},
				{
					"text": "登录提示",
					"path": "/sys/banner"
				},
				{
					"text": "日志模板",
					"path": "/sys/log-template"
				}
			]
		},
		{
			"text": "高可用性",
			"kids": [
				{
					"text": "模式",
					"path": "/ha/mode"
				},
				{
					"text": "主备模式",
					"kids": [
						{
							"text": "创建双机",
							"path": "/ha/active-standby"
						},
						{
							"text": "加入双机",
							"path": "/ha/active-standby-join"
						},
						{
							"text": "双机主备切换",
							"kids": [
								{
									"text": "双机主备切换",
									"path": "/debug/ha/active-standby"
								},
								{
									"text": "切换双机主备",
									"path": "/debug/ha/active-standby/switch"
								},
								{
									"text": "备机故障",
									"path": "/debug/ha/active-standby/reset_failure_status"
								},
								{
									"text": "零流量检测故障状态重置",
									"path": "/debug/ha/active-standby/reset_failsafe_status"
								},
								{
									"text": "零流量检测故障状态重置",
									"path": "/debug/ha/active-standby/reset_failsafe_status/{device}"
								}
							]
						}
					]
				},
				{
					"text": "集群管理",
					"kids": [
						{
							"text": "创建集群",
							"path": "/ha/cluster"
						},
						{
							"text": "加入集群",
							"path": "/ha/cluster-join"
						},
						{
							"text": "集群主控切换",
							"path": "/debug/ha/cluster/master-controller"
						}
					]
				},
				{
					"text": "成员管理",
					"path": "/ha/member"
				},
				{
					"text": "设备组管理",
					"path": "/ha/member-group"
				},
				{
					"text": "虚拟服务关联组",
					"path": "/ha/virtual-service-combination"
				},
				{
					"text": "SNAT关联组",
					"path": "/ha/snat-combination"
				},
				{
					"text": "应用组管理",
					"kids": [
						{
							"text": "应用组",
							"path": "/ha/application-group"
						},
						{
							"text": "应用组主备切换",
							"path": "/debug/ha/application-group"
						},
						{
							"text": "应用组主备切换",
							"path": "/debug/ha/application-group/{name}/switch"
						}
					]
				}
			]
		},
		{
			"text": "日志审计",
			"kids": [
				{
					"text": "服务日志",
					"kids": [
						{
							"text": "查看服务日志",
							"path": "/log/service-log"
						},
						{
							"text": "清除服务日志",
							"path": "/debug/log/service-log/clear"
						}
					]
				},
				{
					"text": "管理日志",
					"kids": [
						{
							"text": "管理日志",
							"path": "/log/operation-log"
						},
						{
							"text": "归档管理日志",
							"path": "/log/operation-log/package"
						}
					]
				},
				{
					"text": "黑盒日志",
					"path": "/log/blackbox-log"
				},
				{
					"text": "导出黑盒日志",
					"path": "/log/blackbox-log/export"
				},
				{
					"text": "SSL日志",
					"path": "/log/ssl-log"
				}
			]
		},
		{
			"text": "状态与统计",
			"kids": [
				{
					"text": "HTTP改写策略统计数据",
					"path": "/stat/slb/http-rewrite"
				},
				{
					"text": "IP Anycast统计数据",
					"path": "/stat/slb/virtual-ip"
				},
				{
					"text": "节点状态与统计数据",
					"path": "/stat/slb/nodes"
				},
				{
					"text": "节点池状态与统计数据",
					"kids": [
						{
							"text": "节点池状态与统计数据",
							"path": "/stat/slb/pool"
						},
						{
							"text": "节点池状态信息",
							"path": "/stat/slb/pool/{name}/{item}"
						},
						{
							"text": "节点池节点信息",
							"path": "/stat/slb/pool/{pool_name}/nodes"
						},
						{
							"text": "节点池指定节点信息",
							"path": "/stat/slb/pool/{pool_name}/nodes/{node_name}"
						},
						{
							"text": "节点池节点状态信息",
							"path": "/stat/slb/pool/{pool_name}/nodes/{node_name}/{item}"
						},
						{
							"text": "节点池概括",
							"path": "/stat/slb/pool-summary"
						},
						{
							"text": "节点池状态概括",
							"path": "/stat/slb/pool-summary/{item}"
						},
						{
							"text": "节点池多条目概括",
							"path": "/stat/slb/pool-summary/combine-items"
						}
					]
				},
				{
					"text": "业务主机状态与统计数据",
					"path": "/stat/slb/service-host"
				},
				{
					"text": "前置策略统计数据",
					"path": "/stat/slb/pre-rule"
				},
				{
					"text": "虚拟服务状态及统计数据",
					"kids": [
						{
							"text": "虚拟服务状态及统计数据",
							"path": "/stat/slb/virtual-service"
						},
						{
							"text": "虚拟服务概况",
							"path": "/stat/slb/virtual-service-summary"
						},
						{
							"text": "ddos服务概况",
							"path": "/stat/slb/virtual-service-summary/ddos"
						},
						{
							"text": "ddos-log服务概况",
							"path": "/stat/slb/virtual-service-summary/ddos-log"
						},
						{
							"text": "虚拟服务趋势值",
							"path": "/stat/slb/virtual-service-summary/combine-items"
						},
						{
							"text": "多个虚拟服务概况",
							"path": "/stat/slb/virtual-service-names"
						},
						{
							"text": "指定虚拟服务ddos信息",
							"path": "/stat/slb/virtual-service/{name}/ddos"
						},
						{
							"text": "指定虚拟服务ddos-log信息",
							"path": "/stat/slb/virtual-service/{name}/ddos-log"
						},
						{
							"text": "指定虚拟服务信息",
							"path": "/stat/slb/virtual-service/{name}/{item}"
						},
						{
							"text": "指定虚拟服务多个数据点的历史数据",
							"path": "/stat/slb/virtual-service/{name}/combine-items"
						},
						{
							"text": "虚拟服务概览情况",
							"path": "/stat/slb/virtual-service-summary/{item}"
						},
						{
							"text": "时延信息",
							"path": "/stat/slb/virtual-service/{name}/rtt"
						}
					]
				},
				{
					"text": "安全服务链状态及统计数据",
					"kids": [
						{
							"text": "安全服务链状态",
							"path": "/stat/slb/service-chain"
						},
						{
							"text": "获取服务链概览信息",
							"path": "/stat/slb/service-chain-summary"
						}
					]
				},
				{
					"text": "安全资源池状态及统计数据",
					"kids": [
						{
							"text": "安全资源池状态",
							"path": "/stat/slb/security-pool"
						},
						{
							"text": "获取指定安全资源池某种条目的趋势状态信息",
							"path": "/stat/slb/security-pool/{name}/{item}"
						},
						{
							"text": "获取每个安全资源池某种条目的趋势状态信息",
							"path": "/stat/slb/security-pool-each/{item}"
						},
						{
							"text": "获取指定安全资源池某些类别的趋势状态信息",
							"path": "/stat/slb/security-pool/{name}/combine-items"
						},
						{
							"text": "获取所有安全资源池的整体统计信息",
							"path": "/stat/slb/security-pool-summary"
						},
						{
							"text": "获取所有安全资源池某个类别总的趋势状态信息",
							"path": "/stat/slb/security-pool-summary/{item}"
						},
						{
							"text": "获取所有安全资源池某些类别总的趋势状态信息",
							"path": "/stat/slb/security-pool-summary/combine-items"
						}
					]
				},
				{
					"text": "安全设备状态及统计数据",
					"kids": [
						{
							"text": "获取指定安全设备状态信息",
							"path": "/stat/slb/security-node"
						},
						{
							"text": "获取指定安全资源池内的指定安全设备状态信息",
							"path": "/stat/slb/security-node/{security_node_name}"
						},
						{
							"text": "获取指定安全资源池内的指定安全设备的条目状态信息",
							"path": "/stat/slb/security-node/{security_node_name}/{item}"
						}
					]
				},
				{
					"text": "DNS代理服务器状态",
					"path": "/stat/lc/dns-proxy"
				},
				{
					"text": "智能路由统计数据",
					"path": "/stat/lc/policy-route"
				},
				{
					"text": "数据中心统计数据",
					"path": "/stat/dns/data-center"
				},
				{
					"text": "指定数据中心的统计数据",
					"path": "/stat/dns/data-center/{name}/{item}"
				},
				{
					"text": "local-device统计信息",
					"path": "/stat/dns/data-center/{data_center_name}/local-device"
				},
				{
					"text": "本地服务设备信息",
					"path": "/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}"
				},
				{
					"text": "本地服务设备统计信息",
					"path": "/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/{item}"
				},
				{
					"text": "本地服务设备虚拟服务信息",
					"path": "/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/virtual-service"
				},
				{
					"text": "本地服务设备指定虚拟服务信息",
					"path": "/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/virtual-service/{virtual_service_name}"
				},
				{
					"text": "本地服务设备指定虚拟服务统计信息",
					"path": "/stat/dns/data-center/{data_center_name}/local-device/{local_device_name}/virtual-service/{virtual_service_name}/{item}"
				},
				{
					"text": "域名统计数据",
					"kids": [
						{
							"text": "域名统计数据",
							"path": "/stat/dns/domain"
						},
						{
							"text": "domain-each统计信息",
							"path": "/stat/dns/domain-each/query"
						},
						{
							"text": "域名统计趋势",
							"path": "/stat/dns/domain-each/{item}"
						},
						{
							"text": "指定域名的统计信息",
							"path": "/stat/dns/domain/{domain}"
						},
						{
							"text": "指定域名请求次数信息",
							"path": "/stat/dns/domain/{domain}/query"
						},
						{
							"text": "域名ldns信息",
							"path": "/stat/dns/domain/{domain}/ldns"
						},
						{
							"text": "指定域名统计信息",
							"path": "/stat/dns/domain-each"
						},
						{
							"text": "domain总计信息",
							"path": "/stat/dns/domain-summary"
						}
					]
				},
				{
					"text": "本地服务设备统计数据",
					"path": "/stat/dns/local-device"
				},
				{
					"text": "LDNS来源统计数据",
					"kids": [
						{
							"text": "LDNS来源统计数据",
							"path": "/stat/dns/local-dns"
						},
						{
							"text": "local-dns全部统计信息",
							"path": "/stat/dns/local-dns-summary"
						},
						{
							"text": "local-dns统计信息",
							"path": "/stat/dns/local-dns/{local_dns}"
						}
					]
				},
				{
					"text": "DNS请求统计数据",
					"path": "/stat/dns/query"
				},
				{
					"text": "指定类型域名",
					"path": "/stat/dns/query/{item}"
				},
				{
					"text": "虚拟IP池统计数据",
					"path": "/stat/dns/vip-pool"
				},
				{
					"text": "虚拟IP池统计数据",
					"path": "/stat/dns/vip-pool/{dns_config_area}"
				},
				{
					"text": "虚拟IP池统计数据",
					"path": "/stat/dns/vip-pool/local"
				},
				{
					"text": "本地虚拟IP池统计数据",
					"path": "/stat/dns/vip-pool/global"
				},
				{
					"text": "指定虚拟ip池状态",
					"path": "/stat/dns/vip-pool/single/{dns_config_area}"
				},
				{
					"text": "指定vip数据",
					"path": "/stat/dns/vip-pool/{dns_config_area}/{name}/vips"
				},
				{
					"text": "域名映射状态",
					"path": "/stat/dns/domain-map/{dns_config_area}"
				},
				{
					"text": "CRL状态",
					"path": "/stat/rc/crl"
				},
				{
					"text": "ACL统计数据",
					"path": "/stat/net/acl"
				},
				{
					"text": "BGP邻接关系表",
					"path": "/stat/net/bgp-neighbors"
				},
				{
					"text": "端口聚合状态",
					"path": "/stat/net/bond"
				},
				{
					"text": "端口桥接状态",
					"path": "/stat/net/bridge"
				},
				{
					"text": "目的地址转换统计数据",
					"path": "/stat/net/dnat"
				},
				{
					"text": "动态路由表",
					"path": "/stat/net/dynamic-route"
				},
				{
					"text": "接口模式",
					"path": "/stat/net/interface-mode"
				},
				{
					"text": "LLDP邻居信息",
					"path": "/stat/net/lldp-neighbors"
				},
				{
					"text": "网络接口状态",
					"path": "/stat/net/interface"
				},
				{
					"text": "LAN链路统计数据",
					"kids": [
						{
							"text": "LAN链路统计数据",
							"path": "/stat/net/link/lan"
						},
						{
							"text": "LAN口链路概要信息",
							"path": "/stat/net/link/lan-summary"
						}
					]
				},
				{
					"text": "PPPoE链路状态",
					"path": "/stat/net/link/pppoe"
				},
				{
					"text": "WAN链路统计数据",
					"kids": [
						{
							"text": "WAN链路统计数据",
							"path": "/stat/net/link/wan"
						},
						{
							"text": "WAN口链路概要信息",
							"path": "/stat/net/link/wan-summary"
						},
						{
							"text": "WAN口链路统计信息",
							"path": "/stat/net/link/wan-each"
						},
						{
							"text": "WAN口链路的应用流量信息",
							"path": "/stat/net/link/wan-application-throughput"
						},
						{
							"text": "指定WAN口链路详细统计信息",
							"path": "/stat/net/link/wan/{name}/{item}"
						},
						{
							"text": "WAN口链路概要信息",
							"path": "/stat/net/link/wan-summary/{item}"
						},
						{
							"text": "WAN口链路统计信息",
							"path": "/stat/net/link/wan-each/{item}"
						}
					]
				},
				{
					"text": "OSPF邻居关系表",
					"path": "/stat/net/ospf-neighbors"
				},
				{
					"text": "OSPFv3邻居关系表",
					"path": "/stat/net/ospfv3-neighbors"
				},
				{
					"text": "源地址转换统计数据",
					"path": "/stat/net/snat"
				},
				{
					"text": "静态路由统计数据",
					"path": "/stat/net/static-route"
				},
				{
					"text": "vxnet接口状态",
					"path": "/stat/net/vxnet"
				},
				{
					"text": "系统运行状态及统计数据",
					"kids": [
						{
							"text": "系统运行状态及统计数据",
							"path": "/stat/sys/system"
						},
						{
							"text": "多个类型系统状态",
							"path": "/stat/sys/system/combine-items"
						},
						{
							"text": "指定类型系统状态统计数据",
							"path": "/stat/sys/system/{item}"
						}
					]
				},
				{
					"text": "双机状态",
					"path": "/stat/ha/active-standby"
				},
				{
					"text": "应用组状态",
					"path": "/stat/ha/application-group"
				},
				{
					"text": "集群成员状态与统计数据",
					"path": "/stat/ha/member"
				}
			]
		},
		{
			"text": "系统与调试操作",
			"kids": [
				{
					"text": "生成虚拟mac地址",
					"path": "/debug/ha/virtual-mac/generator"
				},
				{
					"text": "会话连接操作",
					"kids": [
						{
							"text": "查询会话连接",
							"path": "/debug/net/session"
						},
						{
							"text": "删除会话连接",
							"path": "/debug/net/session/clear"
						}
					]
				},
				{
					"text": "抓包工具",
					"kids": [
						{
							"text": "TCPDUMP",
							"path": "/debug/net/tcpdump"
						},
						{
							"text": "查询抓包文件",
							"path": "/debug/net/tcpdump/record"
						},
						{
							"text": "下载抓包文件",
							"path": "/debug/net/tcpdump/record/{name}/pcap"
						},
						{
							"text": "TCPDUMP抓包任务",
							"path": "/debug/net/tcpdump/capture-controller"
						},
						{
							"text": "查看/删除TCPDUMP抓包任务",
							"path": "/debug/net/tcpdump/capture-controller/{task_id}"
						}
					]
				},
				{
					"text": "重置网口统计数据",
					"path": "/debug/net/interface/reset"
				},
				{
					"text": "DDoS攻击记录清除",
					"path": "/debug/slb/virtual-service/{virtual_service_name}/ddos/clear"
				},
				{
					"text": "HTTP缓存缺失分析",
					"path": "/debug/slb/http-cache-analysis"
				},
				{
					"text": "HTTP缓存查询",
					"path": "/debug/slb/http-cache"
				},
				{
					"text": "HTTP缓存缺失分析",
					"path": "/debug/slb/virtual-service/{name}/http-cache/defect-analysis"
				},
				{
					"text": "查询所有HTTP缓存",
					"path": "/debug/slb/virtual-service/{virtual_service_name}/http-cache"
				},
				{
					"text": "HTTP缓存",
					"path": "/debug/slb/virtual-service/{virtual_service_name}/http-cache/{cache_id}"
				},
				{
					"text": "HTTP缓存清除",
					"path": "/debug/slb/virtual-service/{virtual_service_name}/http-cache/clear"
				},
				{
					"text": "会话保持查询",
					"path": "/debug/slb/virtual-service/{virtual_service_name}/pool/{pool_name}/persist"
				},
				{
					"text": "系统回滚",
					"path": "/debug/sys/rollback"
				},
				{
					"text": "设备巡检",
					"path": "/debug/sys/offline-check"
				},
				{
					"text": "后台维护密码",
					"path": "/debug/sys/maintenance-passwd"
				},
				{
					"text": "虚拟服务url分析",
					"path": "/debug/slb/url-analysis"
				}
			]
		}
	]
}