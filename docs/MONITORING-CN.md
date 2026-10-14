# 监控指标速查

本说明依据本仓库源码。仪表盘记录本地采集或主动导入的 Claude Code、Cursor 和 Codex 活动；数据缺失、采集延迟或筛选范围都会影响数值。它不是服务商的账单或额度中心。

## 主监控页

| 指标 | 含义与限制 |
| --- | --- |
| 总会话 / 活跃会话 | 数据库内的会话总数 / 状态为 `active` 的会话数，受提供方与机器数据范围筛选影响。 |
| 活跃 Agent | `working` 或 `waiting` 状态的 Agent。等待输入或审批也属于活跃，不代表一直消耗 token。 |
| 活跃 Subagent | 当前加载的活跃主 Agent 所属会话中，`working` 状态的子 Agent。前端请求有数量上限，不宜当作无限制的全库总数。 |
| 今日事件 / 总事件 | 采集的生命周期、工具等事件条数；今日按浏览器时区划分。一次任务可能产生多条事件，不等于 API 请求数。 |
| 预估总费用 | 采集的 token 用量按本地模型定价规则计算，包含适用的缓存、模式和工具费用。不是实际扣款、订阅余额或剩余额度；定价、套餐和缺失数据都会造成差异。 |
| 最近活动 | 最近采集到的事件，可进入会话查看工具与对话上下文。 |

主页面每 10 秒补拉数据；相关 WebSocket 消息触发最多每 2 秒一次的合并刷新。新事件直接插入最近活动列表。离线时保留的旧数值不代表实时状态。

## 系统健康页

| 卡片 / 指标 | 含义与限制 |
| --- | --- |
| Runtime | 本地监控服务器运行时间、进程内存和主机资源。CPU `1/5/15m` 是 `os.loadavg()` 返回的负载均值，不是 CPU 使用百分比。RSS 是进程驻留内存；V8 Heap 是 JavaScript 堆；主机内存是整机口径。 |
| Storage | 本地数据库大小、记录分布及最近 5/15/60 分钟事件数量。不是云存储配额，也不是磁盘写入吞吐率。 |
| Cache Hit | 本地 transcript 解析缓存的 `hits / (hits + misses)`，不是模型提示词缓存命中率。 |
| Success Rate | Agent 的 `completed / (completed + error)`；没有已结束 Agent 时实现返回 100%。这不能证明任务答案正确。 |
| Error Rate | 出现会话错误、Agent 错误或指定错误事件的会话占全部会话的比例，与成功率的分母不同。 |
| Health Score | 自定义综合分：`0.4 × Success Rate + 0.25 × Cache Hit + 0.25 × (100 − Error Rate) + 0.1 × (100 − Heap%)`，限制在 0–100。不是服务商官方健康状态。 |
| Token Usage | 根据已采集的 usage 数据聚合。该健康卡只显示输入＋输出 token 最大的前六个模型，占比在这六个模型内部计算；缓存读取在提示信息中另列。 |
| Concurrency | 根据已记录的会话活动区间统计并发。不是系统进程数；无活动时图表的最小标尺也不代表确实有一个会话运行。 |
| Tool Usage | 已记录事件中的工具调用统计，不是所有终端命令或所有网络请求。 |
| Subagent Effectiveness | 按子 Agent 类型统计完成、错误和成功率；表示生命周期结果，不评价输出质量。 |
| Compact / Saved | 上下文压缩次数；Saved 实际汇总 `token_usage` 的 baseline 字段，不能解释为省下的费用、退款或精确释放的上下文长度。 |
| Integration / Platform | 本地 hook、实时连接及运行平台信息，帮助排查采集链路；连接成功不保证全部历史已采集。 |

健康页每 30 秒请求系统信息与工作流统计。分析页每 15 秒刷新。不同卡片的采样时点、筛选口径可能不同。

## 数据从哪里来

- 生命周期和工具活动：提供方 hooks、本地 transcript/rollout 发现与导入，写入本地数据库后通过 API 和 WebSocket 提供给页面。
- Token：Claude transcript 的 usage 会按消息 ID 归并；Codex 从 `token_count` 事件的累计 usage 快照重建。缺失的源记录不能视作零消耗。
- 费用：使用本地定价表从已采集用量计算；部分工具执行时间存在估算。订阅套餐、优惠与实际账单需到相应服务商核对。
- 系统指标：Node.js 进程、操作系统、SQLite 和本地 transcript 缓存。

## 页面外观

进入 **设置 → 外观**，选择深色、浅色或跟随系统；字号支持 90%、100%、110%、125%。选择立即生效并保存在当前浏览器，跨标签页同步，不改变监控数据。

## 实现参考

- [Dashboard.tsx](../client/src/pages/Dashboard.tsx)：卡片、计算与刷新周期。
- [stats.js](../server/routes/stats.js) 和 [db.js](../server/db.js)：会话、Agent、事件统计。
- [workflows.js](../server/routes/workflows.js)：成功率、错误率、并发与压缩指标。
- [pricing.js](../server/routes/pricing.js)：费用计算。
- [settings.js](../server/routes/settings.js)：系统与缓存指标。
- [codex-ingest.js](../server/lib/codex-ingest.js)：Codex token 快照。
- [transcript-cache.js](../server/lib/transcript-cache.js)：转录解析与缓存。
