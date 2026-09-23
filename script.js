const rowsBody = document.getElementById("rowsBody");
const addRowBtn = document.getElementById("addRowBtn");
const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");
const sheetTitle = document.getElementById("sheetTitle");
const savedSheets = document.getElementById("savedSheets");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const clearStorageBtn = document.getElementById("clearStorageBtn");

const STORAGE_KEY = "expenseSheets";

const ROW_COUNT = 5;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function parseMoney(value) {
  if (typeof value === "number") {
    return value;
  }
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = parseFloat(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function attachCurrencyFormatting(input) {
  input.addEventListener("focus", () => {
    const val = parseMoney(input.value);
    input.value = val !== 0 || String(input.value).trim() !== "" ? String(val) : "";
  });
  input.addEventListener("blur", () => {
    if (String(input.value).trim() !== "") {
      input.value = formatCurrency(parseMoney(input.value));
    }
  });
}

function parsePercent(value) {
  const parsed = parseFloat(String(value).replace(/[%\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value) {
  return String(parseFloat(value.toFixed(2))) + "%";
}

function attachPercentFormatting(input) {
  input.addEventListener("focus", () => {
    const val = parsePercent(input.value);
    input.value = val !== 0 || String(input.value).trim() !== "" ? String(val) : "";
  });
  input.addEventListener("blur", () => {
    if (String(input.value).trim() !== "") {
      input.value = formatPercent(parsePercent(input.value));
    }
  });
}

function formatCurrencyInputs() {
  document
    .querySelectorAll(".num-input, .discount-input, .bal-trans-amt-input")
    .forEach((input) => {
      if (String(input.value).trim() !== "") {
        input.value = formatCurrency(parseMoney(input.value));
      }
    });
}

function formatPercentInputs() {
  document
    .querySelectorAll(".apr-input, .promo-input, .bal-trans-pct-input")
    .forEach((input) => {
      if (String(input.value).trim() !== "") {
        input.value = formatPercent(parsePercent(input.value));
      }
    });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const parts = value.split("-");
  return parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : value;
}

function computeTotal() {
  const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
  let total = 0;

  rows.forEach((row) => {
    const amount = parseMoney(row.querySelector(".num-input").value);
    const discount = parseMoney(row.querySelector(".discount-input").value);
    total += amount - discount;
  });

  return total;
}

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    "" +
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes())
  );
}

function pdfFileName() {
  const name = (sheetTitle.value.trim() || "Expense Report")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/ +/g, "_");
  return name + "_" + getTimestamp() + ".pdf";
}

function renderTotal() {
  const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
  let amountSum = 0;
  let discountSum = 0;
  let balTransAmtSum = 0;
  rows.forEach((row) => {
    const amount = parseMoney(row.querySelector(".num-input").value);
    const discount = parseMoney(row.querySelector(".discount-input").value);
    const btAmt = parseMoney(row.querySelector(".bal-trans-amt-input").value);
    amountSum += amount;
    discountSum += discount;
    balTransAmtSum += btAmt;
  });
  document.getElementById("amountSum").textContent = formatCurrency(amountSum);
  document.getElementById("discountSum").textContent = formatCurrency(discountSum);
  document
    .getElementById("balTransAmtSum")
    .textContent = formatCurrency(balTransAmtSum);
}

function renumber() {
  Array.from(rowsBody.querySelectorAll("tr[data-index]")).forEach((tr, i) => {
    tr.dataset.index = i;
    tr.querySelector(".num-col").textContent = i + 1;
  });
}

function updateBtAmt(tr) {
  const balance = parseMoney(tr.querySelector(".num-input").value);
  const btPct = parsePercent(tr.querySelector(".bal-trans-pct-input").value);
  const btAmtInput = tr.querySelector(".bal-trans-amt-input");
  btAmtInput.value = formatCurrency(balance * (btPct / 100));
}

function createRow(index) {
  const tr = document.createElement("tr");
  tr.dataset.index = index;

  const tdNumber = document.createElement("td");
  tdNumber.className = "num-col";
  tdNumber.textContent = index + 1;

  const tdCard = document.createElement("td");
  tdCard.className = "card-col";
  const cardInput = document.createElement("input");
  cardInput.type = "text";
  cardInput.className = "card-input";
  cardInput.placeholder = "Credit Card";
  tdCard.appendChild(cardInput);

  const tdNum = document.createElement("td");
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.className = "num-input";
  input.placeholder = "0";
  input.addEventListener("input", () => {
    updateBtAmt(tr);
    renderTotal();
  });
  attachCurrencyFormatting(input);
  tdNum.appendChild(input);

  const tdApr = document.createElement("td");
  tdApr.className = "apr-col";
  const aprInput = document.createElement("input");
  aprInput.type = "text";
  aprInput.inputMode = "decimal";
  aprInput.className = "apr-input";
  aprInput.placeholder = "0%";
  attachPercentFormatting(aprInput);
  tdApr.appendChild(aprInput);

  const tdPromo = document.createElement("td");
  tdPromo.className = "promo-col";
  const promoInput = document.createElement("input");
  promoInput.type = "text";
  promoInput.inputMode = "decimal";
  promoInput.className = "promo-input";
  promoInput.placeholder = "0%";
  attachPercentFormatting(promoInput);
  tdPromo.appendChild(promoInput);

  const tdPromoEnd = document.createElement("td");
  tdPromoEnd.className = "promo-end-col";
  const promoEndInput = document.createElement("input");
  promoEndInput.type = "date";
  promoEndInput.className = "promo-end-input";
  const promoEndToday = new Date();
  promoEndInput.value = [
    promoEndToday.getFullYear(),
    String(promoEndToday.getMonth() + 1).padStart(2, "0"),
    String(promoEndToday.getDate()).padStart(2, "0")
  ].join("-");
  tdPromoEnd.appendChild(promoEndInput);

  const tdBtPct = document.createElement("td");
  tdBtPct.className = "bal-trans-pct-col";
  const btPctInput = document.createElement("input");
  btPctInput.type = "text";
  btPctInput.inputMode = "decimal";
  btPctInput.className = "bal-trans-pct-input";
  btPctInput.placeholder = "0%";
  btPctInput.addEventListener("input", () => {
    updateBtAmt(tr);
    renderTotal();
  });
  attachPercentFormatting(btPctInput);
  tdBtPct.appendChild(btPctInput);

  const tdBtAmt = document.createElement("td");
  tdBtAmt.className = "bal-trans-amt-col";
  const btAmtInput = document.createElement("input");
  btAmtInput.type = "text";
  btAmtInput.inputMode = "decimal";
  btAmtInput.className = "bal-trans-amt-input";
  btAmtInput.value = "0";
  btAmtInput.readOnly = true;
  btAmtInput.title = "Auto-calculated: Balance x Bal Trans %";
  attachCurrencyFormatting(btAmtInput);
  tdBtAmt.appendChild(btAmtInput);

  const tdDiscount = document.createElement("td");
  tdDiscount.className = "discount-col";
  const discountInput = document.createElement("input");
  discountInput.type = "text";
  discountInput.inputMode = "decimal";
  discountInput.className = "discount-input";
  discountInput.value = "0";
  discountInput.addEventListener("input", renderTotal);
  attachCurrencyFormatting(discountInput);
  tdDiscount.appendChild(discountInput);

  const tdNote = document.createElement("td");
  tdNote.className = "note-col";
  const noteInput = document.createElement("textarea");
  noteInput.className = "note-input";
  noteInput.rows = "1";
  noteInput.addEventListener("input", () => {
    noteInput.style.height = "auto";
    noteInput.style.height = noteInput.scrollHeight + "px";
  });
  tdNote.appendChild(noteInput);

  const tdDate = document.createElement("td");
  tdDate.className = "date-col";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "date-input";
  const today = new Date();
  dateInput.value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
  tdDate.appendChild(dateInput);

  const tdBtn = document.createElement("td");
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "-";
  removeBtn.title = "Remove Row";
  removeBtn.addEventListener("click", () => {
    tr.remove();
    renumber();
    renderTotal();
  });
  tdBtn.appendChild(removeBtn);

  tr.appendChild(tdNumber);
  tr.appendChild(tdCard);
  tr.appendChild(tdNum);
  tr.appendChild(tdApr);
  tr.appendChild(tdPromo);
  tr.appendChild(tdPromoEnd);
  tr.appendChild(tdBtPct);
  tr.appendChild(tdBtAmt);
  tr.appendChild(tdDiscount);
  tr.appendChild(tdDate);
  tr.appendChild(tdNote);
  tr.appendChild(tdBtn);
  rowsBody.appendChild(tr);
}

function resetRows() {
  rowsBody.innerHTML = "";
  for (let i = 0; i < ROW_COUNT; i++) {
    createRow(i);
  }
}

addRowBtn.addEventListener("click", () => {
  createRow(rowsBody.children.length);
  renderTotal();
});

clearBtn.addEventListener("click", () => {
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
});

const sortableThs = Array.from(document.querySelectorAll(".sheet th[data-sort]"));

let sortDirection = {};

function rowValue(row, key) {
  if (key === "index") {
    return parseInt(row.dataset.index, 10);
  }
  if (key === "card") {
    return row.querySelector(".card-input").value.trim().toLowerCase();
  }
  if (key === "apr") {
    return parsePercent(row.querySelector(".apr-input").value);
  }
  if (key === "promo") {
    return parsePercent(row.querySelector(".promo-input").value);
  }
  if (key === "promoEnd") {
    return row.querySelector(".promo-end-input").value || "";
  }
  if (key === "balTransPct") {
    return parsePercent(row.querySelector(".bal-trans-pct-input").value);
  }
  if (key === "balTransAmt") {
    return parseMoney(row.querySelector(".bal-trans-amt-input").value);
  }
  if (key === "discount") {
    return parseMoney(row.querySelector(".discount-input").value);
  }
  if (key === "amount") {
    const amount = parseMoney(row.querySelector(".num-input").value);
    const discount = parseMoney(row.querySelector(".discount-input").value);
    return amount - discount;
  }
  if (key === "note") {
    return row.querySelector(".note-input").value.trim().toLowerCase();
  }
  return row.querySelector(".date-input").value || "";
}

function updateSortIndicators() {
  sortableThs.forEach((th) => {
    const dir = sortDirection[th.dataset.sort];
    th.classList.remove("sorted-asc", "sorted-desc");
    if (dir) {
      th.classList.add(dir === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

sortableThs.forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    const nextDir = sortDirection[key] === "asc" ? "desc" : "asc";
    sortDirection = {};
    sortDirection[key] = nextDir;

    const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
    rows.sort((a, b) => {
      const va = rowValue(a, key);
      const vb = rowValue(b, key);
      const cmp =
        typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return nextDir === "asc" ? cmp : -cmp;
    });
    rows.forEach((row) => rowsBody.appendChild(row));
    renumber();
    renderTotal();
    updateSortIndicators();
  });
});

printBtn.addEventListener("click", () => {
  const rows = Array.from(rowsBody.querySelectorAll("tr[data-index]"));
  const data = rows
    .filter((row) => row.querySelector(".num-input").value.trim() !== "")
    .map((row, i) => {
      const raw = row.querySelector(".num-input").value;
      const card = row.querySelector(".card-input").value.trim();
      const apr = row.querySelector(".apr-input").value.trim();
      const promo = row.querySelector(".promo-input").value.trim();
      const promoEnd = row.querySelector(".promo-end-input").value;
      const btPct = row.querySelector(".bal-trans-pct-input").value.trim();
      const btAmt = parseMoney(row.querySelector(".bal-trans-amt-input").value);
      const amount = raw === "" ? 0 : parseMoney(raw);
      const discount = parseMoney(row.querySelector(".discount-input").value);
      const note = row.querySelector(".note-input").value.trim();
      const date = row.querySelector(".date-input").value;
      return {
        index: i + 1,
        card,
        apr,
        promo,
        promoEnd,
        btPct,
        btAmt,
        amount,
        discount,
        note,
        date
      };
    });

  const doc = new jspdf.jsPDF();
  const LEFT = 20;
  const RIGHT = 192;
  const COLS = [20, 60, 78, 92, 108, 126, 138, 156, 174, 192];

  const drawVerticals = (xs, fromY, toY) => {
    xs.forEach((x) => doc.line(x, fromY, x, toY));
  };

  const fmtPct = (v) => (v === "" ? "-" : formatPercent(parsePercent(v)));

  const drawHeader = (y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Credit Card", 40, y, { align: "center" });
    doc.text("Balance", 69, y, { align: "center" });
    doc.text("APR", 85, y, { align: "center" });
    doc.text("Pro", 100, y, { align: "center" });
    doc.text("Pro End", 117, y, { align: "center" });
    doc.text("BT %", 132, y, { align: "center" });
    doc.text("BT Amt", 147, y, { align: "center" });
    doc.text("Min Pay", 165, y, { align: "center" });
    doc.text("Due Date", 183, y, { align: "center" });
    doc.setFont("helvetica", "normal");
  };

  doc.setFontSize(18);
  doc.text(sheetTitle.value.trim() || "Expense Report", 105, 16, {
    align: "center"
  });
  doc.setFontSize(11);

  drawHeader(30);
  doc.line(LEFT, 26, RIGHT, 26);
  doc.line(LEFT, 32, RIGHT, 32);
  drawVerticals(COLS, 26, 32);
  let rowTop = 32;

  const drawRow = (row, y) => {
    doc.text(row.card || "-", 22, y);
    doc.text(formatCurrency(row.amount), 76, y, { align: "right" });
    doc.text(fmtPct(row.apr), 90, y, { align: "right" });
    doc.text(fmtPct(row.promo), 106, y, { align: "right" });
    doc.text(formatDate(row.promoEnd), 124, y, { align: "right" });
    doc.text(fmtPct(row.btPct), 136, y, { align: "right" });
    doc.text(formatCurrency(row.btAmt), 154, y, { align: "right" });
    doc.text(formatCurrency(row.discount), 172, y, { align: "right" });
    doc.text(formatDate(row.date), 190, y, { align: "right" });
  };

  data.forEach((row) => {
    doc.setFontSize(8);
    let y = rowTop + 8;
    if (y + 4 > 268) {
      doc.line(LEFT, rowTop, RIGHT, rowTop);
      doc.addPage();
      drawHeader(22);
      doc.line(LEFT, 18, RIGHT, 18);
      doc.line(LEFT, 24, RIGHT, 24);
      drawVerticals(COLS, 18, 24);
      rowTop = 24;
      y = rowTop + 8;
    }
    drawRow(row, y);
    const bottom = y + 6;
    doc.line(LEFT, bottom, RIGHT, bottom);
    drawVerticals(COLS, rowTop, bottom);
    rowTop = bottom;
  });

  const amountSum = data.reduce((sum, row) => sum + row.amount, 0);
  const discountSum = data.reduce((sum, row) => sum + row.discount, 0);
  const btAmtSum = data.reduce((sum, row) => sum + row.btAmt, 0);
  let totalY = rowTop + 10;
  if (totalY > 278) {
    doc.addPage();
    totalY = 24;
  }
  doc.line(LEFT, totalY - 4, RIGHT, totalY - 4);
  drawVerticals(COLS, rowTop, totalY - 4);
  doc.setFont("symbol", "normal");
  doc.text("S", 40, totalY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(amountSum), 76, totalY, { align: "right" });
  doc.text(formatCurrency(btAmtSum), 154, totalY, { align: "right" });
  doc.text(formatCurrency(discountSum), 172, totalY, { align: "right" });
  doc.line(LEFT, totalY + 2, RIGHT, totalY + 2);
  drawVerticals(COLS, totalY - 4, totalY + 2);

  doc.save(pdfFileName());
});

resetRows();
renderTotal();

const now = new Date();
sheetTitle.placeholder = "Sheet Name";

function getSavedSheets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function readRowsFromDom() {
  return Array.from(rowsBody.querySelectorAll("tr[data-index]")).map((row) => ({
    card: row.querySelector(".card-input").value,
    amount: row.querySelector(".num-input").value,
    apr: row.querySelector(".apr-input").value,
    promo: row.querySelector(".promo-input").value,
    promoEnd: row.querySelector(".promo-end-input").value,
    balTransPct: row.querySelector(".bal-trans-pct-input").value,
    balTransAmt: row.querySelector(".bal-trans-amt-input").value,
    discount: row.querySelector(".discount-input").value,
    note: row.querySelector(".note-input").value,
    date: row.querySelector(".date-input").value
  }));
}

function updateSavedSheetsList(selectedIndex) {
  const sheets = getSavedSheets();
  savedSheets.innerHTML = '<option value="">Load a saved sheet...</option>';
  sheets.forEach((sheet, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = sheet.name;
    if (i === selectedIndex) {
      opt.selected = true;
    }
    savedSheets.appendChild(opt);
  });
}

function normalizeSheets(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .filter((s) => s && typeof s === "object" && s.name)
    .map((s) => ({
      name: String(s.name),
      title: typeof s.title === "string" ? s.title : String(s.name),
      rows: Array.isArray(s.rows) ? s.rows : [],
      savedAt: s.savedAt || new Date().toISOString()
    }));
}

exportBtn.addEventListener("click", () => {
  const sheets = getSavedSheets();
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    "" +
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes());
  const blob = new Blob([JSON.stringify(sheets, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "TrackCreditCardBal_" + stamp + ".json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => {
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
  importFile.click();
});

importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = normalizeSheets(JSON.parse(reader.result));
      if (imported.length === 0) {
        alert("No saved sheets found in the file.");
        return;
      }
      const sheets = getSavedSheets();
      let added = 0;
      let updated = 0;
      imported.forEach((sheet) => {
        const idx = sheets.findIndex((s) => s.name === sheet.name);
        if (idx >= 0) {
          sheets[idx] = sheet;
          updated++;
        } else {
          sheets.push(sheet);
          added++;
        }
});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
      updateSavedSheetsList();
      alert(
        "Imported from " +
          file.name +
          ": " +
          added +
          " added, " +
          updated +
          " updated."
      );
    } catch (error) {
      alert("Invalid file. Could not import.");
    }
  };
  reader.readAsText(file);
  importFile.value = "";
});

clearStorageBtn.addEventListener("click", () => {
  const sheets = getSavedSheets();
  if (sheets.length === 0) {
    alert("No saved data to clear.");
    return;
  }
  const ok = confirm(
    "Clear all saved sheets from local storage? This cannot be undone."
  );
  if (!ok) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
  updateSavedSheetsList();
  alert("Local storage cleared.");
});

saveBtn.addEventListener("click", () => {
  const cleanTitle = sheetTitle.value.trim();
  const name = cleanTitle || "Expense Report";
  const sheets = getSavedSheets();
  const data = {
    name,
    title: cleanTitle,
    rows: readRowsFromDom(),
    savedAt: new Date().toISOString()
  };

  const existing = sheets.findIndex((s) => s.name === name);
  if (existing >= 0) {
    const ok = confirm(
      'A sheet named "' + name + '" already exists. Update it?'
    );
    if (!ok) {
      return;
    }
    sheets[existing] = data;
  } else {
    sheets.push(data);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  updateSavedSheetsList(sheets.findIndex((s) => s.name === name));
  alert("Sheet saved: " + name);
});

savedSheets.addEventListener("change", () => {
  const idx = Number(savedSheets.value);
  if (savedSheets.value === "") {
    return;
  }
  const sheets = getSavedSheets();
  const sheet = sheets[idx];
  if (!sheet) {
    return;
  }
  sheetTitle.value = sheet.title || "";

  if (!sheet.rows || sheet.rows.length === 0) {
    resetRows();
  } else {
    rowsBody.innerHTML = "";
    sheet.rows.forEach((r, i) => {
      createRow(i);
      const row = rowsBody.children[i];
      row.querySelector(".card-input").value = r.card || "";
      row.querySelector(".num-input").value = r.amount || "";
      row.querySelector(".apr-input").value = r.apr || "";
      row.querySelector(".promo-input").value = r.promo || "";
      row.querySelector(".promo-end-input").value = r.promoEnd || "";
      row.querySelector(".bal-trans-pct-input").value = r.balTransPct || "";
      row.querySelector(".bal-trans-amt-input").value = r.balTransAmt || "0";
      row.querySelector(".discount-input").value = r.discount || "0";
      row.querySelector(".note-input").value = r.note || "";
      row.querySelector(".date-input").value = r.date || "";
    });
    formatCurrencyInputs();
    formatPercentInputs();
  }
  renderTotal();
});

updateSavedSheetsList();

deleteBtn.addEventListener("click", () => {
  if (savedSheets.value === "") {
    alert("No saved sheet is selected to delete.");
    return;
  }
  const idx = Number(savedSheets.value);
  const sheets = getSavedSheets();
  const sheet = sheets[idx];
  if (!sheet) {
    return;
  }
  const ok = confirm(
    'Delete sheet "' + sheet.name + '"? This cannot be undone.'
  );
  if (!ok) {
    return;
  }
  sheets.splice(idx, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  sheetTitle.value = "";
  savedSheets.value = "";
  resetRows();
  renderTotal();
  updateSavedSheetsList();
  alert("Sheet deleted: " + sheet.name);
});