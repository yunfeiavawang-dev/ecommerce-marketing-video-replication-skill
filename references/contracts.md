# 数据契约 v1

所有时间单位为秒，区间半开；帧索引从 0 开始。路径基准显式声明。null=未知/未产生，不等于空成功。各记录有 schema_version、created_at、updated_at。命令存 argv 数组，屏蔽认证参数和临时签名 URL；不能把凭据作为可复現配置。

## run.json 与理解结果

run：run_id、product_id（可选，不进入 Prompt）、product_name、asset_root、assets[{id,path,sha256,role,source}]、reference_id、用户原始要求、goal(strict/adapt)、target_count(1–3)、budget、host、adapters、status。

understanding：provider、model（不能得知时 unknown）、source_fps、sampling[{start,end,fps,width,height,frame_paths}]、observed_ranges、audio_method、transcript_source、shots[{start,end,scene,action,dialogue,evidence,product_visibility}]、structure{hook,conflict,bridge,proof,payoff,cta}、product_facts[{fact,evidence,confidence}]、reference_fingerprint{content_mode,hook_beats,narrative_beats,speech_required_segments,subtitle_required_segments,subtitle_owner,characters,speakers,bgm_profile,key_actions,duration_seconds,minimum_duration_ratio,sku_geometry}、uncertainties。推测与观测分开。

## plan.json（辅助脚本校验格式）

```json
{
  "schema_version": 1,
  "asset_root": "../../assets",
  "product_id": "optional-internal-id",
  "goal": "adapt",
  "max_inflight_jobs": 1,
  "capabilities": {"duration_min": 4, "duration_max": 30, "duration_step": 1},
  "strategies": [{
    "id": "A_story", "version_id": "v1", "parent_version_id": null,
    "method": "causal_rewrite", "rationale": "保留被排斥到被支持的情绪，商品直接帮助出席",
    "preserve": ["关系与情绪回报"], "change": ["对白与产品转场"],
    "audio_policy": "generated", "subtitle_policy": "packager", "subtitle_owner": "packager",
    "speech_required_segments": ["0-12", "12-24"], "subtitle_required_segments": ["0-12", "12-24"],
    "identity_reference_id": "character-sheet-a", "minimum_duration_ratio": 0.85,
    "acceptance": ["商品外观一致", "冲突与商品解决形成因果"],
    "jobs": [{
      "id": "segment-01", "depends_on": [], "model": "Seedance_2.5",
      "mode": "reference_generation", "duration": 24, "ratio": "9:16", "resolution": "720p",
      "prompt": "用图1中的黑色直筒裤拍完整的办公室穿搭故事……",
      "images": ["main01.jpg"], "videos": [], "audios": [],
      "target": {"start": 0, "end": 24}
    }]
  }]
}
```

示例的能力数字只是历史值，先查当前能力再填写。计划里的 job 加 `asset_root`（相对 request 文件重算）后可另存 request.json 交给 xyq_adapter。默认不得改变计划已指定模型；仅在用户允许工具替换时使用新适配器。

完整记录每个 job 的源片范围、目标范围/CFR目标帧数、上传顺序、素材角色、条件图生成的父依赖、期望声音、实际请求参数、能力快照位置。prepare 完成不代表已经提交。

## experiment.json / version

稳定键为 `(product_id,reference_id,method_id,version_id)`；不能只按 PID 混合多条参考。字段：

- id/title/method/status/model/prompt/config/inputs/output/workflow；兼容当前平台。
- parent_version_id、parent_snapshot、change_note、created_at、history。
- inputs.assets：相对路径、哈希、角色、来源；references 源范围与输入衍生步骤。
- output：原始下载列表、最终 file、duration、width/height、fps、frames、audio、sha256、size、transformations。
- workflow：decisions（证据、选择、备选、理由）、understanding、capabilities、jobs、postprocess、qa、publish_receipt。
- actual_review：助手观测；user_reviews 单独存，不擅自填写评分。

新迭代复制可复用的 Prompt/config/input，清空任务 ID、output、执行状态和旧验证结果，保存父快照。新产物必须新版本，元数据纠错才编辑原版并留 history。

## events.jsonl

每行 `{time,event,method_id,version_id,job_id,decision,evidence,artifacts,result}`。可记录 input_mismatch、capabilities_checked、sampling_changed、strategy_selected、split_selected、submitted、query_error、downloaded、audio_policy_selected、qa_failed、published。只写可复核判断与操作，不写隐含推理过程。

## 状态

prepared → submitting → submitted → running → downloaded → assembled → validated → published。

submission_unknown：提交结果不明，禁止重提；query_error：保留 ID 继续查询/核查；failed：有明确终止失败证据；needs_revision：文件有效但语义不达标。没有平台时 validated＋local-delivered 就是可交付结果，平台 requested-but-unavailable 则单记 publish_pending。
