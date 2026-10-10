# 开放适配接口 v1

核心 workflow 不直接依赖某个 Agent 品牌、模型 SDK、操作系统或固定端口。适配器可以是 CLI、API、MCP 或宿主原生工具；通过以下语义契约交换 JSON。Python 脚本是当前本地实现，不是必须采用的传输协议。

## Understanding

`capabilities()` → input_types、native_video、audio、max_duration、sampling_control、model_id。

`analyze({assets,segments,sampling,questions,product_facts})` → contracts 中的 understanding、证据时间戳、不确定项、实际模型、请求/响应标识。

Codex 实现：FFmpeg 取帧→宿主实际看图→结构化记录，音频另用可用 ASR/听音工具。API 实现：视频或帧＋音频上传→适配返回统一结构。原生视频 API 不公开采样率时写 `sampling_fps: null, sampling_control: provider_internal`，不能假装是 1 fps。无音频能力则补音频适配器或明确理解不完整。

## VideoGenerator

`capabilities(model,refresh)` → raw_snapshot、fetched_at、模型真实 key、modes、duration{min,max,step}、输入单个/总时长和数量、尺寸/FPS/大小、音频支持、比例/清晰度、并发限制（未知为 null）。

`submit(request,idempotency_key)` → provider_job_id（小云雀为 thread_id＋run_id）、web_url、status。request：model/mode/prompt/config、按角色排序的 assets、期望时长。服务支持幂等键则使用；不支持时本地状态只能防止本地重复，不能宣称跨进程/服务端 exactly-once。

`query(job_id)` → pending/running/succeeded/failed/unknown、error、artifacts。结束不等于成功。

`download(artifact,destination)` → 实际路径、大小、SHA256；校验存在且能解码。远程链接失效不创建新生成任务。

请求已发而没有结果时保留 `submission_unknown`，用服务任务列表/提交日志核实；只有确认未创建任务才能有限重试。模型列表存在 video_edit 但 CLI 没有对应参数路由时应标 unsupported_in_adapter，不能猜 generate-type 的数值。

## Media / Image / Audio（按需）

Media：probe、sample_frames、cut（frame/PTS）、assemble、mux、decode_validate。必须报告实际转换，不偷偷变速、改画幅或裁掉主体。

Image：generate/edit、所用模型、参考绑定、输出路径；用于首尾帧和角色图时先验收，再传视频生成。宿主原生 image_gen 只是一个实现，其他 API 可替换。

Audio：transcribe、synthesize、listen/align 按需；记录模型、语言、参数。转写、听审、口型同步是不同能力。声音仿制不属于本 skill 默认流程。

## Publisher

`publish({record_key,method,version,metadata,final_artifact})` → 平台稳定 ID、URL、revision、verified。

`readback(receipt)` → 元数据、媒体可访问性、评价隔离证明。评价应有 `(record,method,version)` 作用域、快照与并发版本控制。平台不存在则使用 LocalPublisher 写 manifests/results，不捏造平台链接。

## 接入检查

更换适配器先用假任务做 submit/query/download 映射回归，再做只读能力查询。需要真实付费生成验证时在用户已授权范围/预算内做一段，不为接入测试擅自多跑。能力声明、工具实际可达能力、端到端已验证能力分开记录。新服务认证仅在宿主配置，不放技能包。
