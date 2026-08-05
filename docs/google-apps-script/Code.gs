/**
 * 2026 樹屋競賽 — Google Apps Script Web App API
 *
 * 試算表結構：
 * 1. 「報名回覆」工作表（表單回覆）
 *    欄位：報名編號 | 組別 | 中英文設計理念說明 | 檔案雲端連結
 * 2. 「評審帳號」工作表
 *    欄位：judgeId | judgeName | accessCode
 * 3. 「評分紀錄」工作表
 *    欄位：timestamp | judgeId | entryId | category | scoresJson | commentsJson
 *
 * 部署：部署 → 新增部署 → 網頁應用程式
 *   執行身分：我
 *   誰可以存取：任何人
 */

const SHEET_ENTRIES = "報名回覆";
const SHEET_JUDGES = "評審帳號";
const SHEET_SCORES = "評分紀錄";
const ADMIN_JUDGE_ID = "ADMIN";
const ADMIN_ACCESS_CODE = "admin";

/** 表單回覆試算表（僅讀取，不寫入） */
const FORM_SPREADSHEET_ID = "1z-u7Q_4O4k_E0KnHEH-6e4yaeRk5JOgjo_KC-Sm1CrY";
/** 評分紀錄試算表（可選；未設定則使用 GAS 綁定試算表中的「評分紀錄」分頁） */
const SCORES_SPREADSHEET_ID = ""; // 例如另一份試算表 ID

function getFormSpreadsheet_() {
  return SpreadsheetApp.openById(FORM_SPREADSHEET_ID);
}

function getScoresSpreadsheet_() {
  if (SCORES_SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SCORES_SPREADSHEET_ID);
  }
  return getFormSpreadsheet_();
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSheet_(name, mode) {
  mode = mode || "form";
  var ss = mode === "scores" ? getScoresSpreadsheet_() : getFormSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet && mode !== "scores") {
    var sheets = ss.getSheets();
    sheet = sheets[0];
  }
  if (!sheet) throw new Error("找不到工作表：" + name);
  return sheet;
}

function headerMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach(function (h, i) {
    if (h) map[String(h).trim()] = i;
  });
  return map;
}

function parseDriveLinks_(cell) {
  if (!cell) return [];
  return String(cell)
    .split(/[\n,;|]+/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

function drivePreviewFiles_(links, category) {
  var isYouth = String(category).indexOf("少兒") >= 0;
  var isPro = String(category).indexOf("專業") >= 0;
  return links
    .map(function (link, idx) {
      var idMatch =
        link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (!idMatch) return null;
      var fileId = idMatch[1];
      var type = isYouth ? "image" : isPro ? "pdf" : "pdf";
      var previewUrl =
        type === "pdf"
          ? "https://drive.google.com/file/d/" + fileId + "/preview"
          : "https://drive.google.com/uc?export=view&id=" + fileId;
      return {
        fileId: fileId,
        type: type,
        previewUrl: previewUrl,
        name: "page-" + String(idx + 1).padStart(2, "0"),
      };
    })
    .filter(Boolean);
}

function getReviewedSet_(judgeId) {
  var sheet = getSheet_(SHEET_SCORES, "scores");
  var data = sheet.getDataRange().getValues();
  var set = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === judgeId) {
      set[String(data[i][2])] = true;
    }
  }
  return set;
}

function getScoreCountsByEntry_() {
  var sheet = getSheet_(SHEET_SCORES, "scores");
  var data = sheet.getDataRange().getValues();
  var counts = {};
  for (var i = 1; i < data.length; i++) {
    var judgeId = String(data[i][1]);
    if (judgeId === ADMIN_JUDGE_ID) continue;
    var entryId = String(data[i][2]);
    counts[entryId] = (counts[entryId] || 0) + 1;
  }
  return counts;
}

function isAdminJudge_(judgeId) {
  return String(judgeId) === ADMIN_JUDGE_ID;
}

function handleValidateJudge_(code) {
  if (String(code) === ADMIN_ACCESS_CODE) {
    return json_({
      ok: true,
      judgeId: ADMIN_JUDGE_ID,
      judgeName: "管理者",
      role: "admin",
    });
  }

  var sheet = getSheet_(SHEET_JUDGES);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === String(code)) {
      return json_({
        ok: true,
        judgeId: String(rows[i][0]),
        judgeName: String(rows[i][1]),
        role: "judge",
      });
    }
  }
  return json_({ ok: false, error: "通行碼無效" });
}

function handleEntries_(judgeId) {
  var sheet = getSheet_(SHEET_ENTRIES);
  var map = headerMap_(sheet);
  var rows = sheet.getDataRange().getValues();
  var reviewed = getReviewedSet_(judgeId);
  var scoreCounts = getScoreCountsByEntry_();
  var entries = [];
  var isAdmin = isAdminJudge_(judgeId);

  for (var i = 1; i < rows.length; i++) {
    var entryId = String(rows[i][map["報名編號"]] || "").trim();
    if (!entryId) continue;
    var category = String(rows[i][map["組別"]] || "").trim();
    var item = {
      entryId: entryId,
      category: category,
      reviewed: isAdmin ? false : !!reviewed[entryId],
    };
    if (isAdmin) {
      item.scoreCount = scoreCounts[entryId] || 0;
    }
    entries.push(item);
  }

  var reviewedCount = isAdmin
    ? 0
    : entries.filter(function (e) {
        return e.reviewed;
      }).length;

  return json_({
    ok: true,
    entries: entries,
    progress: { reviewedCount: reviewedCount, total: entries.length },
  });
}

function handleEntry_(judgeId, entryId) {
  var sheet = getSheet_(SHEET_ENTRIES);
  var map = headerMap_(sheet);
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var id = String(rows[i][map["報名編號"]] || "").trim();
    if (id !== entryId) continue;

    var category = String(rows[i][map["組別"]] || "").trim();
    var designConcept = String(rows[i][map["中英文設計理念說明"]] || "");
    var links = parseDriveLinks_(rows[i][map["檔案雲端連結"]]);
    var files = drivePreviewFiles_(links, category);

    return json_({
      ok: true,
      entry: {
        entryId: id,
        category: category,
        designConcept: designConcept,
        files: files,
      },
    });
  }

  return json_({ ok: false, error: "找不到作品" });
}

function handleSubmitScore_(body) {
  var judgeId = body.judgeId;
  var entryId = body.entryId;
  if (!judgeId || !entryId) {
    return json_({ ok: false, error: "資料不完整" });
  }

  if (!SCORES_SPREADSHEET_ID) {
    return json_({
      ok: false,
      error: "請在 Code.gs 設定 SCORES_SPREADSHEET_ID（評分不可寫入表單試算表）",
    });
  }

  var isAdmin = isAdminJudge_(judgeId);
  var reviewed = getReviewedSet_(judgeId);
  if (!isAdmin && reviewed[entryId]) {
    return json_({ ok: false, error: "此作品已評分" });
  }

  var sheet = getSheet_(SHEET_SCORES, "scores");
  sheet.appendRow([
    new Date(),
    judgeId,
    entryId,
    body.category || "",
    JSON.stringify(body.scores || {}),
    JSON.stringify(body.comments || {}),
  ]);

  if (isAdmin) {
    var allEntries = JSON.parse(handleEntries_(judgeId).getContent()).entries || [];
    var idx = -1;
    for (var i = 0; i < allEntries.length; i++) {
      if (allEntries[i].entryId === entryId) {
        idx = i;
        break;
      }
    }
    var nextEntry =
      idx >= 0 && idx < allEntries.length - 1 ? allEntries[idx + 1] : null;
    return json_({
      ok: true,
      nextEntryId: nextEntry ? nextEntry.entryId : null,
    });
  }

  var entriesResp = JSON.parse(handleEntries_(judgeId).getContent());
  var next = (entriesResp.entries || []).find(function (e) {
    return !e.reviewed;
  });

  return json_({
    ok: true,
    nextEntryId: next ? next.entryId : null,
  });
}

function doGet(e) {
  try {
    var action = (e.parameter.action || "").trim();
    if (action === "validateJudge") {
      return handleValidateJudge_(e.parameter.code);
    }
    if (action === "entries") {
      return handleEntries_(e.parameter.judgeId);
    }
    if (action === "entry") {
      return handleEntry_(e.parameter.judgeId, e.parameter.entryId);
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var body = e.postData ? JSON.parse(e.postData.contents) : {};
    if (body.action === "submitScore") {
      return handleSubmitScore_(body);
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}
