/**
 * Combined GAS: sheet grid (mode=sheet) + vote counts (default GET) + vote POST
 *
 * Deploy as Web App (Anyone). Then in .env.local:
 *   GAS_WEB_APP_URL=<exec url>
 *   GAS_SHEET_GET_QUERY=mode=sheet
 *   GAS_VOTE_API_URL=<same exec url>
 */

const FORM_SPREADSHEET_ID = "1z-u7Q_4O4k_E0KnHEH-6e4yaeRk5JOgjo_KC-Sm1CrY";
const VOTE_SHEET_NAME = "投票紀錄"; // photoNo | voterId | timestamp
// voterId: bare LINE Login sub (e.g. "Uxxxx…") or "google:…" for Google Login.
// GAS stores the string as-is; do not strip provider prefixes on Google IDs.

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getFormSheet_() {
  var ss = SpreadsheetApp.openById(FORM_SPREADSHEET_ID);
  return ss.getSheets()[0];
}

/** Next.js fetch-grid expects 2D array (row 0 = headers). */
function handleSheetGrid_() {
  var sheet = getFormSheet_();
  var values = sheet.getDataRange().getValues();
  var grid = values.map(function (row) {
    return row.map(function (cell) {
      return cell === null || cell === undefined ? "" : String(cell);
    });
  });
  return json_(grid);
}

function getVoteSheet_() {
  var ss = SpreadsheetApp.openById(FORM_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(VOTE_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(VOTE_SHEET_NAME);
    sheet.appendRow(["photoNo", "voterId", "timestamp"]);
  }
  return sheet;
}

/** GET vote totals: { status, data: { photoNo: count } } */
function handleVoteCounts_() {
  var sheet = getVoteSheet_();
  var rows = sheet.getDataRange().getValues();
  var counts = {};
  for (var i = 1; i < rows.length; i++) {
    var photoNo = String(rows[i][0] || "").trim();
    if (!photoNo) continue;
    counts[photoNo] = (counts[photoNo] || 0) + 1;
  }
  return json_({ status: "success", data: counts });
}

/** POST body: { photoNo, voterId }
 *  voterId is an opaque string: bare LINE sub, or "google:sub" for Google.
 */
function handleVoteSubmit_(body) {
  var photoNo = String(body.photoNo || "").trim();
  var voterId = String(body.voterId || "").trim();
  if (!photoNo || !voterId) {
    return json_({ status: "error", message: "缺少 photoNo 或 voterId" });
  }
  var sheet = getVoteSheet_();
  sheet.appendRow([photoNo, voterId, new Date()]);
  return json_({
    status: "success",
    message: "已成功投票給 " + photoNo,
  });
}

function doGet(e) {
  try {
    var mode = String((e && e.parameter && e.parameter.mode) || "").trim();
    if (mode === "sheet") {
      return handleSheetGrid_();
    }
    // default: vote counts (backward compatible with current deployment)
    return handleVoteCounts_();
  } catch (err) {
    return json_({ status: "error", message: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var body = e.postData ? JSON.parse(e.postData.contents) : {};
    return handleVoteSubmit_(body);
  } catch (err) {
    return json_({ status: "error", message: String(err.message || err) });
  }
}
