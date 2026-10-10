# 运行与迁移

## 条件

Agent 需要能读写素材并使用视觉理解能力或视频理解 API；需要至少一个已认证、有额度的视频生成工具，具备能力查询、提交、查询、下载。仅有模型名不能运行。本地工具使用 Python 3.9+ 标准库和 FFmpeg/FFprobe。没有 shell 的宿主可用等价媒体服务实现同一契约。认证复用宿主，不写入包、计划、日志或 Prompt。

把整个 product-video-replication 文件夹复制到宿主技能目录。Codex 默认 `$CODEX_HOME/skills/` 或 `~/.codex/skills/`；避免覆盖同名技能。无 skills 机制的 Agent 可把 SKILL.md 作为执行入口，并提供所引用文档/脚本的访问权限。`agents/openai.yaml` 不是跨宿主强依赖。

首次先看 help；以下路径均替换为实际绝对路径：

```text
python3 <技能目录>/scripts/replica.py --help
python3 <技能目录>/scripts/xyq_adapter.py capabilities --model Seedance_2.5 --out <运行目录>/capabilities.json
python3 <技能目录>/scripts/replica.py probe --input <参考.mp4> --out <运行目录>/probe.json
python3 <技能目录>/scripts/replica.py frames --input <参考.mp4> --out-dir <运行目录>/frames --fps 0.25
```

能力快照由 Agent 解释各模式限制；脚本不是所有供应商参数的万能校验器。抽帧后必须实际查看或发给理解 API，不可仅生成 JPEG 就称完成理解。指令参数以数组传递，不通过 shell 拼接不可信 Prompt。

示例请求：“用这个商品和参考视频生成一至三版，先判断严格复刻还是迁移营销机制，保存 Prompt、输入输出和决策，验收并交付。”固定模型或预算写入请求/run.json；CDance 的口头称呼须由适配器映射到服务端真实枚举，不能猜。

## 目录与恢复

优先用户选定目录，每商品每次运行独立归档：

```text
product/
  assets/
  runs/<run-id>/
    agent.md  run.json  plan.json  understanding.json
    capabilities.json  events.jsonl  results.md
    inputs/                      # 衍生片段、条件图、转写
    methods/<method-id>/<version-id>/
      experiment.json  prompt.txt  qa.json
      jobs/<segment-id>/          # request/state/attempts/downloads
      final.mp4
```

JSON 的路径基准必须明确；计划素材路径相对 plan.json 所指 asset_root。job request 的 asset_root 相对 request.json。保存时重新计算相对路径，不原样复制导致基准错乱。迁移整个商品目录后应解析成功；未复制的外部素材标 external_dependency，不能宣称离线自包含。新建业务目录有简短 agent.md，不遍历第三方缓存。

脚本负责确定性步骤；理解、Prompt 与视觉验收由宿主/适配模型完成。没有平台时仍交付本地视频与清单。替换工具看 adapters.md，不需要改策略、版本和 QA 语义。
