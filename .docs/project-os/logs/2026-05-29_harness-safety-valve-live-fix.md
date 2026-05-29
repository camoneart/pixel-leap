---
type: validation
title: 安全弁フック live 修正 — exit 0 バグの発見と修正、実走ブロック実証
date: 2026-05-29
status: completed
related_plan: ~/.claude/.docs/plans/2026-05-29-live-verification-pixel-leap.md
related_log: .docs/logs/local/2026-05-29_live-verification-harness-3changes.md
scope: 検証対象2 (fail-closed 安全弁フック) の live 実走確認と root-cause 修正
note: |
  この log 自体が「Macro 層は .docs/project-os/logs/ のみ書込可」フックの allow パス live テストを兼ねる
  (phase=macro 下で本ファイルが Write tool 経由で生成できた = allow 経路が稼働している証拠)
---

# 安全弁フック live 修正ログ

擬似入力テスト (検証対象2のロジック確認) では GREEN だったが、**実走では書込を
止められない**ことを live プローブで発見し、root cause を特定して修正、再プローブで
完全ブロックを実証するまでの記録。

## 発見した issue 一覧

| ID | 重大度 | 内容 | 状態 |
|---|---|---|---|
| Finding A | High | 2フックが PreToolUse でなく PostToolUse に登録されていた (実行後では止められない) | 修正済 (camone, settings.json) |
| Finding D | High | deny 分岐が exit 0 + JSON で表現。Claude Code は PreToolUse を exit 2 でしか止めない | 修正済 (本セッション, hooks) |
| Finding B | Low | restrict-macro-writes.sh のヘッダコメントが HARNESS_MODE 表記のまま (実装は phase.yaml) | 未対応 (報告のみ) |
| Finding C | Med | 汎用 logging 標準パス (.docs/logs/local) と Macro 許可パス (.docs/project-os/logs) の不一致 | 設計判断待ち |

## root cause (Finding D) の詳細

- 壊れていたフック: deny したい分岐で `exit 0` のまま JSON (`{"continue":false,"permissionDecision":"deny",...}`) を出力していた
- Claude Code の契約: PreToolUse フックがツールを止めるのは **exit 2 + stderr** のとき。exit 0 は「通せ」の意味
- 結果: フックは発火し JSON の continue:false でターンは止まるが、ツール (Write) は実行されファイルは作られる = 「メッセージは出るのに書込は通る」
- 正常に効いている既存フック (hook_pre_plans_redirect / hook_pre_hardcode_hygiene_check) は block 時に exit 2 を使っており、これが正しい作法

## 修正内容 (本セッション)

両フックの deny 分岐を `cat <<EOF ... EOF; exit 0` から `echo "<reason>" >&2; exit 2` へ変更:

- block-team-in-macro.sh (team-* 直接呼出の block 分岐)
- restrict-macro-writes.sh (許可外 path 書込の block 分岐)

allow 分岐 (`{"continue": true}` + exit 0) は無変更。I/O 契約は非破壊 (フックが元々
意図していた block 挙動を成立させるだけの純粋なバグ修正)。

## 検証結果 (すべて GREEN)

擬似入力:
- block-team-in-macro deny (macro + team-implementer) → exit 2 + stderr 理由
- restrict-macro-writes deny (macro + src/x.ts) → exit 2 + stderr 理由
- restrict-macro-writes allow (macro + tickets/*.md) → exit 0
- block-team-in-macro allow (micro) → exit 0
- bash -n 構文チェック 両方 OK

live 実走 (Write tool 経由, phase=macro):
- 修正前: 許可外 path への Write → `File created successfully` + 継続停止 (ファイル作られる = ブロック失敗)
- 修正後: 許可外 path への Write → `PreToolUse:Write hook error` でブロック、**ファイルは作られない** (fail-closed 本物稼働)
- 許可 path (.docs/project-os/logs/) への Write → 成功 (本ファイルがその実証)

## 学び

擬似入力テストは「スクリプトが deny を出すか」までしか見ない。「その出し方で Claude が
実際に止まるか」は live 実走でしか分からない。動く (メッセージは出る) ≠ 最善 (実際に
止まる)。live 検証の価値が実証された。

## 残タスク

1. Finding B: ヘッダコメントの HARNESS_MODE 表記を phase.yaml ベースに修正 (Low, 任意)
2. Finding C: Macro 層のログ置き場を .docs/project-os/logs に寄せるか、フック許可に
   .docs/logs/local を加えるかの設計判断
3. 検証対象3 (権限ゲート ask プロンプト) の camone 目視確認
4. plan frontmatter の status 更新 (~/.claude 側、camone が実施)
