function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "submitChore") return responseJSON(submitChore(data));
    if (data.action === "approveChore") return responseJSON(approveChore(data));
    if (data.action === "rejectChore") return responseJSON(rejectChore(data));
    if (data.action === "addBonus") return responseJSON(addBonus(data));
    if (data.action === "addChore") return responseJSON(addChore(data));
    if (data.action === "editChore") return responseJSON(editChore(data));
    if (data.action === "updateUserMultiplier") return responseJSON(updateUserMultiplier(data));
    return responseJSON({ status: "error", message: "Invalid post action" });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  if (e.parameter.action === "getData") {
    return responseJSON(getData());
  }
  return ContentService.createTextOutput("Invalid request");
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------
// WEBHOOK HELPERS
// ---------------------------------------------------------

function getConfig(key) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuration");
  if (!sheet) return "";
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1] ? String(data[i][1]).trim() : "";
    }
  }
  return "";
}

function triggerWebhook(urlKey, payload) {
  const url = getConfig(urlKey);
  if (!url) return;
  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    console.error("Webhook error for " + urlKey + ": " + err.toString());
  }
}

// ---------------------------------------------------------
// ACTION FUNCTIONS
// ---------------------------------------------------------

function submitChore(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  const txId = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([txId, data.userId, data.choreTitle, data.value, "Pending", timestamp]);
  
  triggerWebhook("WEBHOOK_CHORE_SUBMITTED", {
    event: "chore_submitted",
    transactionId: txId,
    userId: data.userId,
    userName: data.userName,
    choreTitle: data.choreTitle,
    value: data.value,
    timestamp: timestamp
  });
  
  return { status: "success", transactionId: txId };
}

function approveChore(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName("Transactions");
  const userSheet = ss.getSheetByName("Users");
  
  const txData = txSheet.getDataRange().getValues();
  for (let i = 1; i < txData.length; i++) {
    if (String(txData[i][0]) === String(data.txId)) {
      txSheet.getRange(i + 1, 5).setValue("Approved");
      break;
    }
  }
  
  const userData = userSheet.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) {
    if (String(userData[i][0]) === String(data.userId)) {
      const currentBalance = parseFloat(userData[i][3]) || 0;
      userSheet.getRange(i + 1, 4).setValue(currentBalance + parseFloat(data.value));
      break;
    }
  }
  
  triggerWebhook("WEBHOOK_CHORE_APPROVED", {
    event: "chore_approved",
    transactionId: data.txId,
    userId: data.userId,
    value: data.value,
    timestamp: new Date().toISOString()
  });
  
  return { status: "success" };
}

function rejectChore(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName("Transactions");
  
  const txData = txSheet.getDataRange().getValues();
  for (let i = 1; i < txData.length; i++) {
    if (String(txData[i][0]) === String(data.txId)) {
      txSheet.getRange(i + 1, 5).setValue("Rejected");
      break;
    }
  }
  
  triggerWebhook("WEBHOOK_CHORE_REJECTED", {
    event: "chore_rejected",
    transactionId: data.txId,
    userId: data.userId,
    value: data.value,
    timestamp: new Date().toISOString()
  });
  
  return { status: "success" };
}

function addBonus(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const txSheet = ss.getSheetByName("Transactions");
  const userSheet = ss.getSheetByName("Users");
  const txId = Utilities.getUuid();
  
  txSheet.appendRow([txId, data.userId, "Bonus/Deduction: " + data.reason, data.amount, "Approved", new Date().toISOString()]);
  
  const userData = userSheet.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) {
    if (String(userData[i][0]) === String(data.userId)) {
      const currentBalance = parseFloat(userData[i][3]) || 0;
      userSheet.getRange(i + 1, 4).setValue(currentBalance + parseFloat(data.amount));
      break;
    }
  }
  return { status: "success" };
}

function addChore(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Chores");
  const choreId = Utilities.getUuid();
  
  sheet.appendRow([choreId, data.title, data.value, data.icon, data.cadence, data.useMultiplier, data.assignedKids]);
  return { status: "success" };
}

function editChore(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Chores");
  const choreData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < choreData.length; i++) {
    if (String(choreData[i][0]) === String(data.choreId)) {
      sheet.getRange(i + 1, 2).setValue(data.title);
      sheet.getRange(i + 1, 3).setValue(data.value);
      sheet.getRange(i + 1, 4).setValue(data.icon);
      sheet.getRange(i + 1, 5).setValue(data.cadence);
      sheet.getRange(i + 1, 6).setValue(data.useMultiplier);
      sheet.getRange(i + 1, 7).setValue(data.assignedKids);
      break;
    }
  }
  return { status: "success" };
}

function updateUserMultiplier(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const userData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < userData.length; i++) {
    if (String(userData[i][0]) === String(data.userId)) {
      sheet.getRange(i + 1, 5).setValue(data.multiplier); 
      break;
    }
  }
  return { status: "success" };
}

// ---------------------------------------------------------
// DATA FETCHING HELPERS
// ---------------------------------------------------------

function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get users and replace plaintext Pin with hashed Pin before returning
  let userData = sheetToObjects(ss.getSheetByName("Users"));
  userData = userData.map(u => {
    u.Pin = hashPin(u.Pin); 
    return u;
  });

  return {
    users: userData,
    chores: sheetToObjects(ss.getSheetByName("Chores")),
    transactions: sheetToObjects(ss.getSheetByName("Transactions"))
  };
}

// Generates a SHA-256 hex string from the plaintext PIN
function hashPin(pinStr) {
  if (!pinStr) return "";
  const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(pinStr), Utilities.Charset.UTF_8);
  let hexString = '';
  for (let i = 0; i < signature.length; i++) {
    let byte = signature[i];
    if (byte < 0) byte += 256;
    let hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    hexString += hex;
  }
  return hexString;
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}