# Google 表單資料（GAS Web App 唯讀）

## 設定

在 `.env.local`：

```env
GAS_WEB_APP_URL=https://script.google.com/macros/s/xxxx/exec
ADMIN_ACCESS_CODE=admin
```

重啟 `npm run dev` 後，用 **admin** 登入。

## 資料格式

GAS `doGet` 回傳 **JSON 二維陣列**：第 0 列為標題，其後每一列為一筆報名。

目前表單欄位對應（匿名審查，不向前端暴露姓名/Email/電話）：

| 試算表欄位 | 前台用途 |
|-----------|---------|
| 報名編號（若無） | 自動產生 `TH-2026-0001` |
| 組別（若無） | 預設 `少兒組`（可改 `DEFAULT_ENTRY_CATEGORY`） |
| 作品名稱 + 作品理念 | 右側「設計理念說明」 |
| 圖片雲端網址 | 左側預覽 |

## 診斷

http://localhost:3000/api/review/sheet-probe

## 評分儲存

評分寫入本機 `data/review-scores.jsonl`，**不會**透過此 GAS 修改 Google 試算表。
