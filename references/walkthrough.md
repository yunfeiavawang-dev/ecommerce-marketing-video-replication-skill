# 一次完整运行与续跑示例

这里只描述可替换路径，不绑定历史商品。示例输出上限先以实时能力为准。第一次使用同时读 SKILL.md 与 contracts.md。

1. 在商品目录建 runs/<run-id>，写 run.json 和 agent.md；保存商品图/参考清单与哈希。执行 probe、frames，实际查看帧并补台词理解，写 understanding.json。
2. 执行 xyq_adapter capabilities，解释模式限制，写 plan.json。例：全长 37.433333 秒且 30 fps 共 1123 帧，视频目视确认 17.266667 秒自然切点，可以规划 518/605 帧两段，请求 18/21 秒。若是跨品类改编 279 秒参考，可根据授权重写 24–30 秒完整故事而不分全片。
3. `replica.py validate-plan --plan <plan.json>`；人工核素材尺寸/时长/角色/配额/事实。按策略写各段 Prompt，不包含 PID。
4. 裁参考片段（仅视频参考策略需上传）：

```text
python3 <技能>/scripts/replica.py cut --input <参考> --start 0 --end 17.266667 --output <片段1.mp4> --mute
```

此命令按时间重新编码；严格切点必须再核帧/PTS。无视频时间轴策略不上传参考视频；首尾帧策略先生成并目检两张条件图。

5. 每个 job 建 request.json，把 plan 的 job 字段复制并重算 asset_root。加入 source=codex（其他宿主用真实值/省略）。保存 request 后执行：

```text
python3 <技能>/scripts/xyq_adapter.py submit --request <job/request.json> --job-dir <job>
python3 <技能>/scripts/xyq_adapter.py query --job-dir <job>
```

读取 state 后展示任务链接，隔 10–30 秒查询一次。无 ID 且不明状态先核查服务端；勿再 submit。多段按计划依赖与 max_inflight_jobs 调度；脚本不偷偷调度后台任务。

6. 下载后对每个实际 output_path 执行 verify。单段无需后期时保留原件，把最终交付副本与哈希记录下来；如果要裁切/拼接，则创建 parts.json（相对该 JSON 的路径）：

```json
{"fps":30,"audio_policy":"source","source_audio":"../../assets/reference.mp4",
 "parts":[{"file":"methods/A/v1/jobs/p1/downloads/generated.mp4","frames":518},
          {"file":"methods/A/v1/jobs/p2/downloads/generated.mp4","frames":605}]}
```

必须用实际下载文件名替换示例。原音适配才用 source；新剧情生成音频用 segments；用户要求无声才用 none。

```text
python3 <技能>/scripts/replica.py assemble --spec <parts.json> --output <final.mp4>
python3 <技能>/scripts/replica.py verify --input <final.mp4> --out <technical-qa.json>
```

segments 会先把每段音频裁到目标时长/转 PCM，再拼接后一次 AAC 编码，避免分段 AAC 编码延迟累积；音频不足拒绝静默补齐。source 复制音轨，是否哈希相同由独立包校验确认。工具不自动听音、不自动判商品与参考一致。

7. 实际看最终全片代表帧/接缝，核 SKU、台词和音轨政策，写 qa.json/experiment.json/events/results。技术正确但商品未替换则标 needs_revision，可交付实验预览并如实说明。
8. 平台首次导入写一条 entry.json，output.file 换算为商品根目录相对路径，然后 publish-import；迭代改走平台 API 带 parentVersionId，不能重新导入成无父关系的新方法。

```text
python3 <技能>/scripts/replica.py publish-import --product-dir <商品目录> --entry <entry.json>
```

执行后还需 GET/UI 读回验收。没有平台则直接交付本地结果。中断恢复从 state.json 和现有 IDs 继续，不重跑 prepare 覆盖档案。
