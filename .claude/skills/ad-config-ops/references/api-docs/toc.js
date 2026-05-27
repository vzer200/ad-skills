module.exports ={
	"swagger": "2.0",
	"toc": [
		{
			"text": "API文档"
		},
		{
			"text": "基础",
			"kids": [
				{
					"text": "令牌管理",
					"path": "/token.yaml"
				},
				{
					"text": "版本信息",
					"path": "/version.yaml"
				},
				{
					"text": "配置导出",
					"path": "/export.yaml"
				},
				{
					"text": "配置导入",
					"path": "/import.yaml"
				},
				{
					"text": "批处理接口",
					"path": "/batch.yaml"
				},
				{
					"text": "任务查询",
					"path": "/last-event.yaml"
				},
				{
					"text": "场景状态信息",
					"path": "/scenario.yaml"
				},
				{
					"text": "控制台登录",
					"path": "/login.yaml"
				},
				{
					"text": "控制台登出",
					"path": "/logout.yaml"
				},
				{
					"text": "报表控制台登出",
					"path": "/report-logout.yaml"
				},
				{
					"text": "异步查询",
					"path": "/search.yaml"
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
							"text": "HTTP虚拟服务",
							"path": "/slb/virtual-service/http.yaml"
						},
						{
							"text": "TCP-L7虚拟服务",
							"path": "/slb/virtual-service/tcp-proxy.yaml"
						},
						{
							"text": "TCP虚拟服务",
							"path": "/slb/virtual-service/tcp-forward.yaml"
						},
						{
							"text": "UDP虚拟服务",
							"path": "/slb/virtual-service/udp-forward.yaml"
						},
						{
							"text": "UDP-L7虚拟服务",
							"path": "/slb/virtual-service/udp-proxy.yaml"
						},
						{
							"text": "SSL虚拟服务",
							"path": "/slb/virtual-service/ssl-offload.yaml"
						},
						{
							"text": "HTTPS虚拟服务",
							"path": "/slb/virtual-service/ssl-offload-https.yaml"
						},
						{
							"text": "DNS虚拟服务",
							"path": "/slb/virtual-service/dns.yaml"
						},
						{
							"text": "FTP虚拟服务",
							"path": "/slb/virtual-service/ftp.yaml"
						},
						{
							"text": "RADIUS虚拟服务",
							"path": "/slb/virtual-service/radius.yaml"
						},
						{
							"text": "SIP-TCP虚拟服务",
							"path": "/slb/virtual-service/sip-tcp.yaml"
						},
						{
							"text": "SIP-UDP虚拟服务",
							"path": "/slb/virtual-service/sip-udp.yaml"
						},
						{
							"text": "8583虚拟服务",
							"path": "/slb/virtual-service/8583.yaml"
						},
						{
							"text": "L3虚拟服务",
							"path": "/slb/virtual-service/ip.yaml"
						},
						{
							"text": "Any虚拟服务",
							"path": "/slb/virtual-service/any.yaml"
						}
					]
				},
				{
					"text": "SNAT地址集",
					"path": "/slb/snat-pool.yaml"
				},
				{
					"text": "虚拟IP",
					"path": "/slb/virtual-ip.yaml"
				},
				{
					"text": "节点池",
					"kids": [
						{
							"text": "节点池",
							"path": "/slb/pool.yaml"
						},
						{
							"text": "节点",
							"path": "/slb/node.yaml"
						}
					]
				},
				{
					"text": "业务健康检查",
					"kids": [
						{
							"text": "查看业务健康检查",
							"path": "/slb/service-monitor/all.yaml"
						},
						{
							"text": "SIP",
							"path": "/slb/service-monitor/sip.yaml"
						},
						{
							"text": "ICMP",
							"path": "/slb/service-monitor/icmp.yaml"
						},
						{
							"text": "ICMPv6",
							"path": "/slb/service-monitor/icmpv6.yaml"
						},
						{
							"text": "TCP",
							"path": "/slb/service-monitor/connect-tcp.yaml"
						},
						{
							"text": "SSL",
							"path": "/slb/service-monitor/connect-ssl.yaml"
						},
						{
							"text": "UDP",
							"path": "/slb/service-monitor/connect-udp.yaml"
						},
						{
							"text": "HTTP",
							"path": "/slb/service-monitor/http.yaml"
						},
						{
							"text": "HTTPS",
							"path": "/slb/service-monitor/https.yaml"
						},
						{
							"text": "FTP",
							"path": "/slb/service-monitor/ftp.yaml"
						},
						{
							"text": "SNMP",
							"path": "/slb/service-monitor/snmp.yaml"
						},
						{
							"text": "DNS",
							"path": "/slb/service-monitor/dns.yaml"
						},
						{
							"text": "RADIUS",
							"path": "/slb/service-monitor/radius.yaml"
						},
						{
							"text": "LDAP",
							"path": "/slb/service-monitor/ldap.yaml"
						},
						{
							"text": "TCP半连接",
							"path": "/slb/service-monitor/tcp-half-open.yaml"
						},
						{
							"text": "TCP被动",
							"path": "/slb/service-monitor/passive-tcp.yaml"
						},
						{
							"text": "HTTP被动",
							"path": "/slb/service-monitor/passive-http.yaml"
						},
						{
							"text": "复合监视器",
							"path": "/slb/service-monitor/monitor-expression.yaml"
						},
						{
							"text": "外部应用监视器",
							"path": "/slb/service-monitor/external-monitor.yaml"
						},
						{
							"text": "ORACLE数据库",
							"path": "/slb/service-monitor/oracle-database.yaml"
						},
						{
							"text": "MSSQL数据库",
							"path": "/slb/service-monitor/mssql-database.yaml"
						},
						{
							"text": "MYSQL数据库",
							"path": "/slb/service-monitor/mysql-database.yaml"
						}
					]
				},
				{
					"text": "会话保持",
					"kids": [
						{
							"text": "查看会话保持",
							"path": "/slb/persist/all.yaml"
						},
						{
							"text": "Cookie插入",
							"path": "/slb/persist/cookie-insert.yaml"
						},
						{
							"text": "Cookie改写",
							"path": "/slb/persist/cookie-rewrite.yaml"
						},
						{
							"text": "Cookie被动",
							"path": "/slb/persist/cookie-study.yaml"
						},
						{
							"text": "SourceIP",
							"path": "/slb/persist/source-ip.yaml"
						},
						{
							"text": "SourceIP and SourcePort",
							"path": "/slb/persist/source-ip-port.yaml"
						},
						{
							"text": "HTTP请求被动",
							"path": "/slb/persist/http-request-study.yaml"
						},
						{
							"text": "HTTP应答被动",
							"path": "/slb/persist/http-response-study.yaml"
						},
						{
							"text": "SIP会话保持",
							"path": "/slb/persist/sip.yaml"
						},
						{
							"text": "RADIUS",
							"path": "/slb/persist/radius.yaml"
						},
						{
							"text": "SSL SessionID",
							"path": "/slb/persist/ssl-sessionid.yaml"
						}
					]
				},
				{
					"text": "业务主机",
					"path": "/slb/service-host.yaml"
				},
				{
					"text": "前置策略",
					"kids": [
						{
							"text": "查看前置策略",
							"path": "/slb/pre-rule/all.yaml"
						},
						{
							"text": "SIP前置策略",
							"path": "/slb/pre-rule/sip.yaml"
						},
						{
							"text": "8583前置策略",
							"path": "/slb/pre-rule/8583.yaml"
						},
						{
							"text": "L3前置策略",
							"path": "/slb/pre-rule/ip.yaml"
						},
						{
							"text": "Any前置策略",
							"path": "/slb/pre-rule/any.yaml"
						},
						{
							"text": "TCP前置策略",
							"path": "/slb/pre-rule/tcp-forward.yaml"
						},
						{
							"text": "TCP-L7前置策略",
							"path": "/slb/pre-rule/tcp-proxy.yaml"
						},
						{
							"text": "UDP前置策略",
							"path": "/slb/pre-rule/udp-forward.yaml"
						},
						{
							"text": "UDP-L7前置策略",
							"path": "/slb/pre-rule/udp-proxy.yaml"
						},
						{
							"text": "HTTP前置策略",
							"path": "/slb/pre-rule/http.yaml"
						},
						{
							"text": "HTTPS前置策略",
							"path": "/slb/pre-rule/ssl-offload-https.yaml"
						},
						{
							"text": "SSL前置策略",
							"path": "/slb/pre-rule/ssl-offload.yaml"
						},
						{
							"text": "RADIUS前置策略",
							"path": "/slb/pre-rule/radius.yaml"
						},
						{
							"text": "DNS前置策略",
							"path": "/slb/pre-rule/dns.yaml"
						},
						{
							"text": "FTP前置策略",
							"path": "/slb/pre-rule/ftp.yaml"
						}
					]
				},
				{
					"text": "SSL策略",
					"kids": [
						{
							"text": "SSL卸载策略",
							"path": "/slb/ssl-client.yaml"
						},
						{
							"text": "SSL加密策略",
							"path": "/slb/ssl-server.yaml"
						}
					]
				},
				{
					"text": "HTTP优化策略",
					"path": "/slb/http-profile.yaml"
				},
				{
					"text": "HTTP2策略",
					"path": "/slb/http2-profile.yaml"
				},
				{
					"text": "HTTP改写策略",
					"kids": [
						{
							"text": "查看HTTP改写策略",
							"path": "/slb/http-rewrite/all.yaml"
						},
						{
							"text": "请求改写",
							"path": "/slb/http-rewrite/request.yaml"
						},
						{
							"text": "应答改写",
							"path": "/slb/http-rewrite/response.yaml"
						}
					]
				},
				{
					"text": "TCP策略",
					"kids": [
						{
							"text": "查看TCP策略",
							"path": "/slb/tcp-profile/all.yaml"
						},
						{
							"text": "三层虚拟服务",
							"path": "/slb/tcp-profile/l3-forward.yaml"
						},
						{
							"text": "四层虚拟服务",
							"path": "/slb/tcp-profile/l4-forward.yaml"
						},
						{
							"text": "七层虚拟服务",
							"path": "/slb/tcp-profile/l7-proxy.yaml"
						}
					]
				},
				{
					"text": "HTTP防护策略",
					"path": "/slb/http-defence.yaml"
				},
				{
					"text": "QoS策略",
					"path": "/slb/qos-profile.yaml"
				},
				{
					"text": "访问控制策略",
					"kids": [
						{
							"text": "访问控制策略",
							"path": "/slb/access-control-profile.yaml"
						},
						{
							"text": "访问账号管理",
							"path": "/slb/user.yaml"
						}
					]
				},
				{
					"text": "iPro",
					"path": "/slb/ipro.yaml"
				},
				{
					"text": "UDP策略",
					"path": "/slb/udp-profile.yaml"
				},
				{
					"text": "SIP策略",
					"path": "/slb/sip-profile.yaml"
				},
				{
					"text": "SSLO安全服务链策略",
					"kids": [
						{
							"text": "安全资源池",
							"path": "/slb/security-pool.yaml"
						},
						{
							"text": "安全设备",
							"path": "/slb/security-node.yaml"
						},
						{
							"text": "服务链",
							"path": "/slb/service-chain.yaml"
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
							"path": "/lc/policy-route.yaml"
						},
						{
							"text": "出站高级配置",
							"path": "/lc/policy-route-advanced.yaml"
						},
						{
							"text": "时间计划",
							"path": "/lc/time-plan.yaml"
						}
					]
				},
				{
					"text": "DNS代理",
					"kids": [
						{
							"text": "DNS代理",
							"path": "/lc/dns-proxy.yaml"
						},
						{
							"text": "优先代理策略",
							"path": "/lc/dns-pre-rule.yaml"
						},
						{
							"text": "内网DNS记录",
							"kids": [
								{
									"text": "查看内网DNS记录",
									"path": "/lc/dns-intranet-record/all.yaml"
								},
								{
									"text": "A记录",
									"path": "/lc/dns-intranet-record/a.yaml"
								},
								{
									"text": "AAAA记录",
									"path": "/lc/dns-intranet-record/aaaa.yaml"
								},
								{
									"text": "MX记录",
									"path": "/lc/dns-intranet-record/mx.yaml"
								},
								{
									"text": "CNAME记录",
									"path": "/lc/dns-intranet-record/cname.yaml"
								},
								{
									"text": "TXT记录",
									"path": "/lc/dns-intranet-record/txt.yaml"
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
							"path": "/dns/dns-virtual-service/virtual-service.yaml"
						},
						{
							"text": "DNS策略",
							"path": "/dns/dns-virtual-service/dns-profile.yaml"
						}
					]
				},
				{
					"text": "GSLB",
					"kids": [
						{
							"text": "域名映射",
							"path": "/dns/gslb/domain-map.yaml"
						},
						{
							"text": "虚拟IP池",
							"path": "/dns/gslb/vip-pool.yaml"
						},
						{
							"text": "LDNS地址集",
							"path": "/dns/gslb/ldns-address-group.yaml"
						}
					]
				},
				{
					"text": "权威域",
					"kids": [
						{
							"text": "权威域",
							"path": "/dns/zone/zone.yaml"
						},
						{
							"text": "DNS记录",
							"kids": [
								{
									"text": "查看DNS记录",
									"path": "/dns/zone/dns-records/all.yaml"
								},
								{
									"text": "A记录",
									"path": "/dns/zone/dns-records/a.yaml"
								},
								{
									"text": "AAAA记录",
									"path": "/dns/zone/dns-records/aaaa.yaml"
								},
								{
									"text": "CAA记录",
									"path": "/dns/zone/dns-records/caa.yaml"
								},
								{
									"text": "CNAME记录",
									"path": "/dns/zone/dns-records/cname.yaml"
								},
								{
									"text": "MX记录",
									"path": "/dns/zone/dns-records/mx.yaml"
								},
								{
									"text": "NS记录",
									"path": "/dns/zone/dns-records/ns.yaml"
								},
								{
									"text": "PTR记录",
									"path": "/dns/zone/dns-records/ptr.yaml"
								},
								{
									"text": "DNAME记录",
									"path": "/dns/zone/dns-records/dname.yaml"
								},
								{
									"text": "DS记录",
									"path": "/dns/zone/dns-records/ds.yaml"
								},
								{
									"text": "HINFO记录",
									"path": "/dns/zone/dns-records/hinfo.yaml"
								},
								{
									"text": "NAPTR记录",
									"path": "/dns/zone/dns-records/naptr.yaml"
								},
								{
									"text": "SRV记录",
									"path": "/dns/zone/dns-records/srv.yaml"
								},
								{
									"text": "TXT记录",
									"path": "/dns/zone/dns-records/txt.yaml"
								}
							]
						},
						{
							"text": "DNSSEC密钥",
							"path": "/dns/zone/dnssec-key.yaml"
						},
						{
							"text": "TSIG密钥",
							"path": "/dns/zone/tsig-key.yaml"
						}
					]
				},
				{
					"text": "LDNS",
					"kids": [
						{
							"text": "基本配置",
							"path": "/dns/local-dns/setting.yaml"
						},
						{
							"text": "本地",
							"path": "/dns/local-dns/local-zone.yaml"
						},
						{
							"text": "转发",
							"path": "/dns/local-dns/forward-zone.yaml"
						},
						{
							"text": "RPZ防火墙",
							"path": "/dns/local-dns/response-policy-zones.yaml"
						}
					]
				},
				{
					"text": "数据中心",
					"path": "/dns/data-center.yaml"
				},
				{
					"text": "本地服务设备",
					"path": "/dns/local-device.yaml"
				},
				{
					"text": "全局配置还原",
					"path": "/dns/recovery-point.yaml"
				},
				{
					"text": "配置同步设置",
					"path": "/dns/config-synchronization.yaml"
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
							"text": "查看查看所有证书",
							"path": "/rc/ssl-certificate/all.yaml"
						},
						{
							"text": "自签名证书",
							"path": "/rc/ssl-certificate/self-signed.yaml"
						},
						{
							"text": "证书请求",
							"path": "/rc/ssl-certificate/certificate-request.yaml"
						},
						{
							"text": "证书导入",
							"path": "/rc/ssl-certificate/imported-certificate.yaml"
						},
						{
							"text": "证书",
							"path": "/rc/certificate-utility.yaml"
						},
						{
							"text": "CA证书",
							"path": "/rc/ca.yaml"
						},
						{
							"text": "CRL",
							"path": "/rc/crl.yaml"
						}
					]
				},
				{
					"text": "自定义内容",
					"path": "/rc/http-content.yaml"
				},
				{
					"text": "规则地址库",
					"kids": [
						{
							"text": "用户地址集",
							"path": "/rc/custom-address-group.yaml"
						},
						{
							"text": "ISP地址集",
							"path": "/rc/isp-address-group.yaml"
						},
						{
							"text": "域名集",
							"path": "/rc/domain-group.yaml"
						},
						{
							"text": "应用规则库",
							"path": "/rc/application-identification.yaml"
						},
						{
							"text": "地域地址集",
							"path": "/rc/zone-address-group.yaml"
						},
						{
							"text": "全球地址库",
							"path": "/rc/global-address-library.yaml"
						},
						{
							"text": "数据组",
							"path": "/rc/data-group.yaml"
						},
						{
							"text": "镜像管理",
							"path": "/rc/software-image.yaml"
						}
					]
				}
			]
		},
		{
			"text": "网络部署",
			"kids": [
				{
					"text": "链路IP配置",
					"kids": [
						{
							"text": "查看链路",
							"path": "/net/link/all.yaml"
						},
						{
							"text": "LAN",
							"path": "/net/link/lan.yaml"
						},
						{
							"text": "WAN",
							"path": "/net/link/wan.yaml"
						},
						{
							"text": "虚拟网线链路",
							"path": "/net/link/virtual-wire.yaml"
						},
						{
							"text": "PPPoE",
							"path": "/net/link/pppoe.yaml"
						},
						{
							"text": "端口聚合",
							"path": "/net/bond.yaml"
						},
						{
							"text": "端口桥接",
							"path": "/net/bridge.yaml"
						},
						{
							"text": "VLAN子接口",
							"path": "/net/vlan.yaml"
						},
						{
							"text": "虚拟网线",
							"path": "/net/virtual-wire.yaml"
						},
						{
							"text": "vxnet配置",
							"path": "/net/vxnet.yaml"
						},
						{
							"text": "macvlan配置",
							"path": "/net/macvlan.yaml"
						},
						{
							"text": "网口模式",
							"path": "/net/interface-mode.yaml"
						},
						{
							"text": "LLDP全局配置",
							"path": "/net/lldp.yaml"
						},
						{
							"text": "可用网络接口适配列表",
							"path": "/net/interface-mode.yaml"
						}
					]
				},
				{
					"text": "链路健康检查",
					"kids": [
						{
							"text": "查看链路健康检查",
							"path": "/net/link-monitor/all.yaml"
						},
						{
							"text": "ICMP",
							"path": "/net/link-monitor/icmp.yaml"
						},
						{
							"text": "ICMPv6",
							"path": "/net/link-monitor/icmpv6.yaml"
						},
						{
							"text": "CONNECT-TCP",
							"path": "/net/link-monitor/connect-tcp.yaml"
						}
					]
				},
				{
					"text": "地址转换",
					"kids": [
						{
							"text": "源地址转换",
							"path": "/net/snat.yaml"
						},
						{
							"text": "目的地址转换",
							"path": "/net/dnat.yaml"
						}
					]
				},
				{
					"text": "网络安全",
					"kids": [
						{
							"text": "ACL配置",
							"path": "/net/acl.yaml"
						},
						{
							"text": "内网DDoS防护",
							"path": "/net/ddos-defend-lan.yaml"
						},
						{
							"text": "外网DDoS防护",
							"path": "/net/ddos-defend-wan.yaml"
						},
						{
							"text": "ARP/ND防护",
							"path": "/net/arp.yaml"
						},
						{
							"text": "ARP广播设置",
							"path": "/net/arp-broadcast.yaml"
						},
						{
							"text": "ARP代理",
							"path": "/net/arp-proxy.yaml"
						}
					]
				},
				{
					"text": "静态路由",
					"kids": [
						{
							"text": "静态路由规则配置",
							"path": "/net/static-route.yaml"
						},
						{
							"text": "静态路由监视器",
							"path": "/net/static-route-monitor.yaml"
						}
					]
				},
				{
					"text": "netns配置",
					"path": "/net/netns.yaml"
				},
				{
					"text": "OSPF",
					"kids": [
						{
							"text": "全局配置",
							"path": "/net/ospf.yaml"
						},
						{
							"text": "接口配置",
							"path": "/net/ospf-interface.yaml"
						}
					]
				},
				{
					"text": "BGP",
					"path": "/net/bgp.yaml"
				},
				{
					"text": "OSPFv3",
					"kids": [
						{
							"text": "全局配置",
							"path": "/net/ospfv3.yaml"
						},
						{
							"text": "接口配置",
							"path": "/net/ospfv3-interface.yaml"
						}
					]
				},
				{
					"text": "RIP",
					"kids": [
						{
							"text": "全局配置",
							"path": "/net/rip.yaml"
						},
						{
							"text": "接口配置",
							"path": "/net/rip-interface.yaml"
						}
					]
				}
			]
		},
		{
			"text": "系统管理",
			"kids": [
				{
					"text": "通用配置",
					"kids": [
						{
							"text": "管理口配置",
							"path": "/sys/management.yaml"
						},
						{
							"text": "管理口白名单配置",
							"path": "/sys/whitelist.yaml"
						},
						{
							"text": "登录提示语",
							"path": "/sys/banner.yaml"
						},
						{
							"text": "日志模板配置",
							"path": "/sys/log-template.yaml"
						},
						{
							"text": "系统维护配置",
							"path": "/sys/maintenance-mode.yaml"
						},
						{
							"text": "WebUI配置",
							"path": "/sys/web-service.yaml"
						},
						{
							"text": "SSH配置",
							"path": "/sys/ssh-setting.yaml"
						},
						{
							"text": "项目配置",
							"path": "/sys/project.yaml"
						},
						{
							"text": "授权管理",
							"path": "/sys/licence.yaml"
						},
						{
							"text": "SMTP",
							"path": "/sys/smtp.yaml"
						},
						{
							"text": "日期/时间",
							"path": "/sys/time.yaml"
						},
						{
							"text": "NTP",
							"path": "/sys/ntp.yaml"
						},
						{
							"text": "HOSTS",
							"path": "/sys/host.yaml"
						},
						{
							"text": "网络参数",
							"path": "/sys/network-setting.yaml"
						}
					]
				},
				{
					"text": "用户管理",
					"kids": [
						{
							"text": "当前用户",
							"path": "/sys/current-user.yaml"
						},
						{
							"text": "系统用户",
							"path": "/sys/user.yaml"
						},
						{
							"text": "账户安全策略",
							"path": "/sys/passwd-policy.yaml"
						}
					]
				},
				{
					"text": "角色",
					"path": "/sys/role.yaml"
				},
				{
					"text": "权限",
					"path": "/sys/permission.yaml"
				},
				{
					"text": "外部认证",
					"path": "/sys/external-authentication.yaml"
				},
				{
					"text": "SNMP",
					"kids": [
						{
							"text": "SNMPv1v2c",
							"path": "/sys/snmp.yaml"
						},
						{
							"text": "SNMPv3",
							"path": "/sys/snmpv3.yaml"
						}
					]
				},
				{
					"text": "Traps",
					"path": "/sys/trap.yaml"
				},
				{
					"text": "邮件告警",
					"path": "/sys/alert-mail.yaml"
				},
				{
					"text": "RAS告警",
					"path": "/sys/alert-ras.yaml"
				},
				{
					"text": "SNMP Traps告警",
					"path": "/sys/alert-trap.yaml"
				},
				{
					"text": "RAS告警",
					"path": "/sys/alert-ras.yaml"
				},
				{
					"text": "Syslog设置",
					"path": "/sys/syslog.yaml"
				},
				{
					"text": "HTTP日志",
					"path": "/sys/http-log.yaml"
				},
				{
					"text": "DNS日志",
					"path": "/sys/dns-log.yaml"
				},
				{
					"text": "配置备份与恢复",
					"path": "/sys/backup-config.yaml"
				},
				{
					"text": "配置定时备份",
					"path": "/sys/backup-config-setting.yaml"
				},
				{
					"text": "分区管理",
					"path": "/sys/partition.yaml"
				},
				{
					"text": "自动更新",
					"path": "/sys/update.yaml"
				},
				{
					"text": "代理设置",
					"path": "/sys/proxy.yaml"
				},
				{
					"text": "隐私政策",
					"path": "/sys/privacy.yaml"
				},
				{
					"text": "报表设置",
					"path": "/sys/report-setting.yaml"
				},
				{
					"text": "报表定制",
					"path": "/sys/report-task.yaml"
				},
				{
					"text": "自动生成设置",
					"path": "/sys/report-mail.yaml"
				},
				{
					"text": "离线巡检场景设置",
					"path": "/sys/offline-check.yaml"
				}
			]
		},
		{
			"text": "高可用性",
			"kids": [
				{
					"text": "模式",
					"path": "/ha/mode.yaml"
				},
				{
					"text": "主备模式",
					"kids": [
						{
							"text": "创建双机",
							"path": "/ha/active-standby.yaml"
						},
						{
							"text": "加入双机",
							"path": "/ha/active-standby-join.yaml"
						}
					]
				},
				{
					"text": "高可用集群模式",
					"kids": [
						{
							"text": "创建集群",
							"path": "/ha/cluster.yaml"
						},
						{
							"text": "加入集群",
							"path": "/ha/cluster-join.yaml"
						},
						{
							"text": "成员管理",
							"path": "/ha/member.yaml"
						},
						{
							"text": "设备组管理",
							"path": "/ha/member-group.yaml"
						},
						{
							"text": "应用组管理",
							"path": "/ha/application-group.yaml"
						},
						{
							"text": "虚拟服务关联组",
							"path": "/ha/virtual-service-combination.yaml"
						},
						{
							"text": "SNAT关联组",
							"path": "/ha/snat-combination.yaml"
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
					"path": "/log/service-log.yaml"
				},
				{
					"text": "管理日志",
					"path": "/log/operation-log.yaml"
				},
				{
					"text": "SSL日志",
					"path": "/log/ssl-log.yaml"
				},
				{
					"text": "黑盒日志",
					"path": "/log/blackbox-log.yaml"
				}
			]
		},
		{
			"text": "状态与统计",
			"kids": [
				{
					"text": "HTTP改写策略统计数据",
					"path": "/stat/slb/http-rewrite.yaml"
				},
				{
					"text": "IP Anycast统计数据",
					"path": "/stat/slb/virtual-ip.yaml"
				},
				{
					"text": "节点状态与统计数据",
					"path": "/stat/slb/node.yaml"
				},
				{
					"text": "节点状态",
					"path": "/stat/slb/all-nodes-health.yaml"
				},
				{
					"text": "节点池状态与统计数据",
					"path": "/stat/slb/pool.yaml"
				},
				{
					"text": "业务主机状态与统计数据",
					"path": "/stat/slb/service-host.yaml"
				},
				{
					"text": "安全资源池状态与统计数据",
					"path": "/stat/slb/security-pool.yaml"
				},
				{
					"text": "安全设备状态与统计数据",
					"path": "/stat/slb/security-node.yaml"
				},
				{
					"text": "服务链状态数据",
					"path": "/stat/slb/service-chain.yaml"
				},
				{
					"text": "服务链状态数据",
					"path": "/stat/slb/service-chain.yaml"
				},
				{
					"text": "前置策略统计数据",
					"path": "/stat/slb/pre-rule.yaml"
				},
				{
					"text": "虚拟服务状态及统计数据",
					"path": "/stat/slb/virtual-service.yaml"
				},
				{
					"text": "DNS代理服务器状态",
					"path": "/stat/lc/dns-proxy.yaml"
				},
				{
					"text": "智能路由统计数据",
					"path": "/stat/lc/policy-route.yaml"
				},
				{
					"text": "数据中心统计数据",
					"path": "/stat/dns/data-center.yaml"
				},
				{
					"text": "域名统计数据",
					"path": "/stat/dns/domain.yaml"
				},
				{
					"text": "本地服务设备统计数据",
					"path": "/stat/dns/local-device.yaml"
				},
				{
					"text": "LDNS来源统计数据",
					"path": "/stat/dns/local-dns.yaml"
				},
				{
					"text": "DNS请求统计数据",
					"path": "/stat/dns/query.yaml"
				},
				{
					"text": "虚拟IP池统计数据",
					"path": "/stat/dns/vip-pool.yaml"
				},
				{
					"text": "域名映射统计数据",
					"path": "/stat/dns/domain-map.yaml"
				},
				{
					"text": "CRL状态",
					"path": "/stat/rc/crl.yaml"
				},
				{
					"text": "ACL统计数据",
					"path": "/stat/net/acl.yaml"
				},
				{
					"text": "BGP邻接关系表",
					"path": "/stat/net/bgp-neighbors.yaml"
				},
				{
					"text": "VLAN子接口状态",
					"path": "/stat/net/vxnet.yaml"
				},
				{
					"text": "端口聚合状态",
					"path": "/stat/net/bond.yaml"
				},
				{
					"text": "端口桥接状态",
					"path": "/stat/net/bridge.yaml"
				},
				{
					"text": "目的地址转换统计数据",
					"path": "/stat/net/dnat.yaml"
				},
				{
					"text": "动态路由表",
					"path": "/stat/net/dynamic-route.yaml"
				},
				{
					"text": "接口模式",
					"path": "/stat/net/interface-mode.yaml"
				},
				{
					"text": "LLDP邻居信息",
					"path": "/stat/net/lldp-neighbors.yaml"
				},
				{
					"text": "网络接口状态",
					"path": "/stat/net/interface.yaml"
				},
				{
					"text": "网络接口适配",
					"path": "/net/interface-adapter.yaml"
				},
				{
					"text": "LAN链路统计数据",
					"path": "/stat/net/link/lan.yaml"
				},
				{
					"text": "PPPoE链路状态",
					"path": "/stat/net/link/pppoe.yaml"
				},
				{
					"text": "WAN链路统计数据",
					"path": "/stat/net/link/wan.yaml"
				},
				{
					"text": "OSPF邻居关系表",
					"path": "/stat/net/ospf-neighbors.yaml"
				},
				{
					"text": "OSPFv3邻居关系表",
					"path": "/stat/net/ospfv3-neighbors.yaml"
				},
				{
					"text": "源地址转换统计数据",
					"path": "/stat/net/snat.yaml"
				},
				{
					"text": "静态路由统计数据",
					"path": "/stat/net/static-route.yaml"
				},
				{
					"text": "系统运行状态及统计数据",
					"path": "/stat/sys/system.yaml"
				},
				{
					"text": "双机状态",
					"path": "/stat/ha/active-standby.yaml"
				},
				{
					"text": "应用组状态",
					"path": "/stat/ha/application-group.yaml"
				},
				{
					"text": "集群成员状态与统计数据",
					"path": "/stat/ha/member.yaml"
				}
			]
		},
		{
			"text": "系统与调试操作",
			"kids": [
				{
					"text": "DNS映射规则测试",
					"path": "/debug/dns/dns-map.yaml"
				},
				{
					"text": "LDNS来源封锁",
					"path": "/debug/dns/local-dns/block.yaml"
				},
				{
					"text": "LDNS缺失记录查询",
					"path": "/debug/dns/local-dns/defect.yaml"
				},
				{
					"text": "双机主备切换",
					"path": "/debug/ha/active-standby.yaml"
				},
				{
					"text": "应用组主备切换",
					"path": "/debug/ha/application-group.yaml"
				},
				{
					"text": "集群主控主备切换",
					"path": "/debug/ha/cluster/master-controller.yaml"
				},
				{
					"text": "虚拟MAC地址生成工具",
					"path": "/debug/ha/virtual-mac.yaml"
				},
				{
					"text": "智能路由会话保持查询管理",
					"path": "/debug/lc/persist.yaml"
				},
				{
					"text": "重置智能路由统计数据",
					"path": "/debug/lc/policy-route.yaml"
				},
				{
					"text": "重置ACL统计数据",
					"path": "/debug/net/acl.yaml"
				},
				{
					"text": "主动ARP广播",
					"path": "/debug/net/arp-broadcast.yaml"
				},
				{
					"text": "批量ARP探测",
					"path": "/debug/net/arp.yaml"
				},
				{
					"text": "重置目的地址转换统计数据",
					"path": "/debug/net/dnat.yaml"
				},
				{
					"text": "PPPoE链路博号与挂断",
					"path": "/debug/net/link/pppoe.yaml"
				},
				{
					"text": "系统会话查询管理",
					"path": "/debug/net/session.yaml"
				},
				{
					"text": "重置源地址转换统计数据",
					"path": "/debug/net/snat.yaml"
				},
				{
					"text": "抓包工具",
					"path": "/debug/net/tcpdump.yaml"
				},
				{
					"text": "CRL手动更新",
					"path": "/debug/rc/crl.yaml"
				},
				{
					"text": "生成HTTP攻击与防护报告",
					"path": "/debug/slb/ddos.yaml"
				},
				{
					"text": "HTTP缓存缺失分析",
					"path": "/debug/slb/http-cache-analysis.yaml"
				},
				{
					"text": "HTTP缓存查询",
					"path": "/debug/slb/http-cache.yaml"
				},
				{
					"text": "重置HTTP改写策略统计数据",
					"path": "/debug/slb/http-rewrite.yaml"
				},
				{
					"text": "节点故障恢复",
					"path": "/debug/slb/node.yaml"
				},
				{
					"text": "应用负载会话保持管理",
					"path": "/debug/slb/persist.yaml"
				},
				{
					"text": "生成ipv6报表",
					"path": "/debug/slb/ipv6-report-export.yaml"
				},
				{
					"text": "邮件告警测试",
					"path": "/debug/sys/alert-mail.yaml"
				},
				{
					"text": "SNMP Traps告警测试",
					"path": "/debug/sys/alert-trap.yaml"
				},
				{
					"text": "短信告警",
					"path": "/debug/sys/alert-sms.yaml"
				},
				{
					"text": "关机/重启",
					"path": "/debug/sys/maintenance.yaml"
				},
				{
					"text": "NTP立即同步",
					"path": "/debug/sys/ntp.yaml"
				},
				{
					"text": "报表生成",
					"path": "/debug/sys/report-task.yaml"
				},
				{
					"text": "SMTP服务器测试",
					"path": "/debug/sys/smtp.yaml"
				},
				{
					"text": "自动更新",
					"path": "/debug/sys/update.yaml"
				},
				{
					"text": "分区切换",
					"path": "/debug/sys/partition.yaml"
				},
				{
					"text": "服务日志管理",
					"path": "/debug/log/service-log.yaml"
				},
				{
					"text": "数据中心配置立即同步",
					"path": "/debug/dns/config-synchronization.yaml"
				},
				{
					"text": "DNS规则测试",
					"path": "/debug/dns/dns-map.yaml"
				},
				{
					"text": "系统升级",
					"path": "/debug/sys/upgrade.yaml"
				},
				{
					"text": "OPENSTACK发送告警信息",
					"path": "/debug/net/netns-alarm.yaml"
				},
				{
					"text": "OPENSTACK配置一致性操作",
					"path": "/debug/net/netns-check.yaml"
				},
				{
					"text": "虚拟服务url分析",
					"path": "/debug/slb/url-analysis.yaml"
				},
				{
					"text": "网口信息重置",
					"path": "/debug/net/interface-reset.yaml"
				},
				{
					"text": "后台维护密码管理",
					"path": "/debug/sys/maintenance-passwd.yaml"
				},
				{
					"text": "系统回滚",
					"path": "/debug/sys/rollback.yaml"
				},
				{
					"text": "IPv6状态",
					"kids": [
						{
							"text": "时延",
							"path": "/stat/slb/rtt.yaml"
						}
					]
				},
				{
					"text": "离线巡检",
					"path": "/debug/sys/offline-check.yaml"
				}
			]
		},
		{
			"text": "cgi文档",
			"kids": [
				{
					"text": "文件资源",
					"path": "/cgi/file-resource.yaml"
				},
				{
					"text": "提示信息",
					"path": "/cgi/notice.yaml"
				}
			]
		}
	]
}