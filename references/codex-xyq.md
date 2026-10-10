# Codex ＋小云雀当前实现

理解使用当前宿主对话模型实际看抽帧，不是 Seedance 理解，也不是凭空调用某个视频 API。无法获得精确模型枚举时记 unknown。用宿主文件/图像工具查看脚本输出；口播、剧情另补音频理解。无需依赖另外一个 skill 的存在才能执行本包。

## 模型发现

通过 PATH 找 `pippit-tool-cli`，也可给脚本 `--cli` 指定实际可执行文件。先 `--help`、`model list`、`model describe MODEL_KEY`；后者直接返回 JSON，没有必要加未支持的 --output-json。需要时按当前 help 用 --refresh。宿主已登录则复用；认证过期按工具指引处理，不能从私有文件抽取 token。

2026-09-23 的只读探测：Seedance_2.5 输出 4–30 秒、步长 1；输入视频单条及总量约 30.2 秒，部分模仿视频入口 30 秒；素材 FPS 24–60、最小像素面积 409600、最短边 300。参考生成 type=0；首尾帧 type=1。首尾帧当前模式推荐 adaptive 比例。**这些是快照，不是永久默认值**，必须重新查询并按更严格的实际入口限制处理。

CLI 1.0.32 可提交参考生成/首尾帧。历史 video_edit 在 1.0.18/1.0.32 遇到 duration=-1/正数之间冲突，未完成成功调用。本脚本因此只实现已验证的两种模式；其他模式在工具路由验证前不编造参数。未来修复后可增适配与回归，不能把过去失败当模型永久禁用。

## 调用

```text
python3 <技能>/scripts/xyq_adapter.py capabilities --model Seedance_2.5 --out <运行>/capabilities.json
python3 <技能>/scripts/xyq_adapter.py submit --request <job>/request.json --job-dir <job>
python3 <技能>/scripts/xyq_adapter.py query --job-dir <job>
```

request 遵循 contracts 的单个 job，加 `asset_root`、可选 `product_id` 和 `source`。当前宿主 source=codex；其他宿主填真实来源或省略。能力与输入预检由 Agent 完成；脚本只校验基础字段/模式/路径和防重状态，不承诺检测所有服务端校验。

底层 argv：generate-video --prompt TEXT --model KEY --duration N --ratio R --resolution Q --generate-type 0/1，按顺序重复 --image/--video/--audio。CLI 自行上传本地素材；用户授权本次生成即含这些必要上传，不扩大到无关文件。

提交返回 thread_id、run_id、web_thread_link；立即记录和展示链接。查询 query-result --thread-id ID --run-id ID --download-dir JOB/downloads。`completed=true` 必须同时无 error_message、videos[].output_path 实际存在、技术验收通过，才成功。

脚本每次 query 一次，宿主等待约 10–30 秒再查；避免阻塞超过 60 秒影响更新。它不自动无限循环，不因错误重生成。下载目录每 job 独立，不能把任意旧 MP4 当本次结果。

## 替换

改理解模型：用 Understanding API 返回同结构，保存其真实采样/模型信息；计划策略无需改变。改视频生成：以新的 CLI/API 实现 submit/query/download 和能力限制，将同一 request 映射为新服务字段。模型、音频或模式能力不同导致策略变化时建立新版本并说明。
