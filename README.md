# CheckMan

<p align="center">
  <img src="./public/og-landscape.png" alt="CheckMan - 旅行の準備を、みんなで。" width="960" />
</p>

<p align="center">
  旅行条件から必要な持ち物を提案し、家族や同行者と準備状況を整理できる旅行準備アプリです。
</p>

<p align="center">
  <a href="https://capture-exact-mirror.lovable.app/">デモを試す</a> ·
  <a href="./docs/packing-list-generation.md">推薦ロジックの設計</a> ·
  <a href="./docs/routing.md">ルーティング規約</a>
</p>

[![Quality checks](https://github.com/Kotapoyo/checkman/actions/workflows/quality.yml/badge.svg)](https://github.com/Kotapoyo/checkman/actions/workflows/quality.yml)

## このアプリについて

旅行前の「何を持っていけばよいか分からない」「家族の誰が何を準備するか曖昧」という課題を解決するために制作しました。

目的地、日程、季節、交通手段、旅行目的、アクティビティ、同行者を入力すると、条件に合う初期持ち物リストを生成します。生成後は、優先度・担当者・収納先・準備状況を一つの画面で管理できます。

## 主な機能

- 5ステップの入力フローによる旅行情報の登録
- 旅行条件に合わせた初期持ち物リストの自動生成
- 同じ持ち物が複数条件に一致した場合の重複排除
- 旅行日数に応じた衣類数量の自動設定
- 子ども向け持ち物の担当者自動割り当て
- 優先度、収納先、担当者、準備状況による整理
- 買い物リストと旅行スケジュールの管理
- LocalStorageを利用した端末内へのデータ保存
- スマートフォンを中心にしたレスポンシブUI

## 推薦ロジック

このアプリの推薦機能は、外部AI APIを利用しないルールベース方式です。JSON形式の持ち物マスタから旅行条件に一致する候補を集め、入力値の検証、重複排除、数量計算、担当者設定を行います。

ルールベースを選んだ理由は、通信環境や外部サービスに依存せず、必需品を予測可能な形で提案するためです。機械学習を利用しているように見せるのではなく、現在の実装範囲と設計判断を明確にしています。

```text
旅行条件
   ↓
持ち物マスタから条件別候補を抽出
   ↓
データ検証 → 重複排除 → 数量・担当者の設定
   ↓
チェックリストとして保存
```

詳しい構成と判断理由は[技術・構成書](./docs/packing-list-generation.md)に記載しています。

## 技術スタック

| 分類           | 使用技術                                       |
| -------------- | ---------------------------------------------- |
| UI             | React 19、TypeScript、Tailwind CSS 4、Radix UI |
| フレームワーク | TanStack Start、TanStack Router                |
| ビルド         | Vite                                           |
| データ検証     | TypeScript、独自型ガード                       |
| データ保存     | LocalStorage、JSON                             |
| 品質管理       | ESLint、Prettier、Vitest、GitHub Actions       |
| ホスティング   | Lovable（Cloudflare互換ビルド）                 |

## ディレクトリ構成

```text
.
├─ docs/                  # 設計資料、技術メモ
├─ public/                # OGP画像、アイコン、Web Manifest
├─ src/
│  ├─ components/        # 共通UIコンポーネント
│  ├─ data/              # 条件別の持ち物マスタ
│  ├─ lib/               # 型、状態管理、既存機能との接続
│  ├─ routes/            # ファイルベースルーティング
│  ├─ services/          # 持ち物リスト生成処理
│  └─ utils/             # データ検証、重複排除
└─ .github/workflows/    # 自動品質チェック
```

## ローカルでの実行

Node.jsとnpmが利用できる環境で、次のコマンドを実行します。

```bash
git clone https://github.com/Kotapoyo/checkman.git
cd checkman
npm ci
npm run dev
```

## 品質チェック

```bash
npm run lint       # コード規約
npm run typecheck  # TypeScriptの型検査
npm run test:run   # 推薦ロジックの自動テスト
npm run build      # 本番ビルド
```

GitHub Actionsでも、PushとPull Requestのたびに同じ品質チェックを実行します。

## 今後の改善

- 気象情報APIと連携した、出発直前の候補調整
- 持ち物マスタと推薦条件の拡充
- 旅行データの共有・共同編集
- E2Eテストによる主要操作フローの検証

## 制作・設計上のポイント

- 外部API障害の影響を受けない、決定的な推薦処理
- 壊れたマスタデータを無視して処理を継続する防御的な入力検証
- 既存LocalStorageデータとの互換性を保った段階的な機能追加
- UIからドメインロジックを分離し、単体テスト可能な構成
