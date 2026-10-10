# 发布适配：本地标注平台

这是项目现有平台的适配说明，非跨 Agent 核心依赖。base_url、product_dir、record_id 必须配置/发现，不硬编码 localhost 或目录。没有该平台则 LocalPublisher 写 results.md、experiment.json 和本地视频；用户要求平台而不可用时另记 publish_pending。

## 新方法首次导入

商品目录 replica-experiments.json 是数组，追加例如：

```json
[{"id":"runA_story","title":"剧情改编 A","videoNumber":1,"metadata":"runs/runA/methods/A/v1/experiment.json"}]
```

metadata 至少含 id/title/method/prompt/model/config/inputs/output/status/workflow。output.file 相对于**商品根目录**，不是 experiment.json；写前换算。input 相对基准也记录。已有文件不可覆盖；原有数组条目保留，新 id 防冲突。同商品不同参考用正确 videoNumber/record_id；不凭 UI 当前显示推断已发布。

`replica.py publish-import` 可在短独占锁下读取最新数组、原子追加新条目，验证 metadata/final 在商品目录内且可解码。同 id 同内容幂等返回，冲突拒绝。不支持服务端数据库的全局并发锁；多人外部写同一 manifest 时优先用平台 API 协调。它不写用户评价或旧 comments。

若异常退出留下 `.replica-import.lock`，先确认没有在途发布进程且 manifest 可读，再记录恢复事件并清除这个过期锁；不要盲目清锁绕过并发控制。提交的 state.json 与这个短期发布锁不同，不可删除提交状态来重生成。

## 版本与评价 API

先 GET `/api/items?dataset=all` 找真实 record_id；响应 items[].versions/reviews。初次导入方法 ID `import-{id}`、V1 `import-{id}-v1`，完整作用域仍含 record_id。

新方法或迭代：POST `/api/records/{recordId}/versions`，新方法 body 含 methodName；迭代含 parentVersionId；都需 title/changeNote/metadata。创建迭代保留 parentSnapshot，生成字段清空，随后填写本版实际请求/产物。

修正元数据：PUT `/api/records/{recordId}/versions/{versionId}`，携带最新 revision/title/changeNote/metadata。409 就重新读取并合并，不覆盖。修改导入记录会冻结平台侧元数据来源，生成中只做评价不应冻结来源。

用户评价：PUT `/api/records/{recordId}/reviews/{method|version}/{targetId}`，带 revision、comment、tags、rating、verdict；只能按用户实际表达保存。助手观察放 workflow.actual_review。平台 data/replica-versions.json 包含独立版本、评价、历史和父快照；原 comments 保留。

验收 GET `/media/version/{recordId}/{versionId}` 的 Range bytes=0-1023 返回 206，并与本地字节匹配；浏览器确认正确商品、参考及方法列、视频可播放，刷新后记录存在。若无 UI 工具只能记录 API 验收，不宣称目视通过。迁移需携带整个商品目录和平台 data，不能只复制网页代码。
