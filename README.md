# Product Video Replication Skill

通用商品视频复刻 Skill（V1.2.1）。它根据商品图文和参考视频，完成素材核对、参考理解、适配判断、复刻策略选择、视频生成、后期、验收和版本归档。

本仓库只包含通用版，不包含千意专用版或合规版。Skill 的入口是 [`SKILL.md`](SKILL.md)，执行规范、适配器、验证和示例位于 `references/`，确定性脚本位于 `scripts/`。

## 适用范围

- 严格复刻、参考生成、时间轴重建、首尾帧条件图和跨品类剧情改编
- 普通口播、商品展示、情景剧及混合视频
- Codex 视觉理解与可替换的视频生成、音频、后期和发布适配器

## 本地校验

```bash
python3 scripts/test_workflow.py
python3 scripts/replica.py validate-plan --help
```

Skill 本身是 Agent 执行规范和工具包，不是脱离模型、媒体服务和授权即可独立生成视频的 Web 应用。
