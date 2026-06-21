/* CountQC — mobile QC counting & statistics
 * Pure vanilla JS, persisted to localStorage. No build step. */
(function () {
  "use strict";

  var STORE_KEY = "countqc.v1";

  /* ---------- State ---------- */
  var state = {
    specName: "",
    values: [],   // array of numbers, in entry order
    lsl: "",
    usl: ""
  };

  /* ---------- Element refs ---------- */
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    specName: $("specName"),
    repName: $("repName"),
    bigCount: $("bigCount"),
    qsAvg: $("qsAvg"), qsMin: $("qsMin"), qsMax: $("qsMax"),
    entryForm: $("entryForm"),
    entryInput: $("entryInput"),
    valuesList: $("valuesList"),
    undoBtn: $("undoBtn"),
    clearBtn: $("clearBtn"),
    // summary
    summaryTitle: $("summaryTitle"),
    sumCount: $("sumCount"), sumAvg: $("sumAvg"), sumMin: $("sumMin"),
    sumMax: $("sumMax"), sumRange: $("sumRange"), sumStd: $("sumStd"),
    lslInput: $("lslInput"), uslInput: $("uslInput"),
    pctUnder: $("pctUnder"), pctIn: $("pctIn"), pctOver: $("pctOver"),
    underCount: $("underCount"), inCount: $("inCount"), overCount: $("overCount"),
    barUnder: $("barUnder"), barIn: $("barIn"), barOver: $("barOver"),
    allValuesList: $("allValuesList"),
    exportBtn: $("exportBtn"),
    // nav
    pageEntry: $("pageEntry"), pageSummary: $("pageSummary"),
    tabEntry: $("tabEntry"), tabSummary: $("tabSummary")
  };

  /* ---------- Persistence ---------- */
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.values)) {
        state.specName = parsed.specName || "";
        state.values = parsed.values.filter(function (n) { return typeof n === "number" && isFinite(n); });
        state.lsl = parsed.lsl || "";
        state.usl = parsed.usl || "";
      }
    } catch (e) { /* ignore */ }
  }

  /* ---------- Number formatting ---------- */
  function fmt(n) {
    if (n === null || n === undefined || !isFinite(n)) return "–";
    // Trim to at most 4 decimals, drop trailing zeros.
    var r = Math.round(n * 10000) / 10000;
    return String(r);
  }

  /* ---------- Stats ---------- */
  function stats(arr) {
    var n = arr.length;
    if (n === 0) return { n: 0 };
    var sum = 0, min = Infinity, max = -Infinity;
    for (var i = 0; i < n; i++) {
      var v = arr[i];
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    var avg = sum / n;
    var sq = 0;
    for (var j = 0; j < n; j++) { var d = arr[j] - avg; sq += d * d; }
    // Sample standard deviation (n-1); falls back to 0 when n === 1.
    var std = n > 1 ? Math.sqrt(sq / (n - 1)) : 0;
    return { n: n, sum: sum, avg: avg, min: min, max: max, range: max - min, std: std };
  }

  /* ---------- Parse user input (one or many numbers) ---------- */
  function parseNumbers(text) {
    if (!text) return [];
    var tokens = text.split(/[\s,;]+/);
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i].trim();
      if (t === "") continue;
      var v = Number(t);
      if (isFinite(v)) out.push(v);
    }
    return out;
  }

  /* ---------- Render: entry page ---------- */
  function renderEntry() {
    var s = stats(state.values);
    els.bigCount.textContent = state.values.length;
    els.qsAvg.textContent = s.n ? fmt(s.avg) : "–";
    els.qsMin.textContent = s.n ? fmt(s.min) : "–";
    els.qsMax.textContent = s.n ? fmt(s.max) : "–";

    els.repName.textContent = state.specName.trim() || "New record";

    // chips, most recent first
    els.valuesList.innerHTML = "";
    for (var i = state.values.length - 1; i >= 0; i--) {
      var li = document.createElement("li");
      var idx = document.createElement("span");
      idx.className = "idx";
      idx.textContent = "#" + (i + 1);
      var val = document.createElement("span");
      val.textContent = fmt(state.values[i]);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "×";
      rm.setAttribute("aria-label", "Remove value");
      rm.dataset.index = String(i);
      li.appendChild(idx);
      li.appendChild(val);
      li.appendChild(rm);
      els.valuesList.appendChild(li);
    }
  }

  /* ---------- Render: summary page ---------- */
  function renderSummary() {
    var s = stats(state.values);
    els.summaryTitle.textContent = state.specName.trim()
      ? "Summary — " + state.specName.trim()
      : "Summary";

    els.sumCount.textContent = s.n || 0;
    els.sumAvg.textContent = s.n ? fmt(s.avg) : "–";
    els.sumMin.textContent = s.n ? fmt(s.min) : "–";
    els.sumMax.textContent = s.n ? fmt(s.max) : "–";
    els.sumRange.textContent = s.n ? fmt(s.range) : "–";
    els.sumStd.textContent = s.n ? fmt(s.std) : "–";

    renderSpec(s);
    renderAllValues();
  }

  function renderSpec(s) {
    var lsl = state.lsl === "" ? null : Number(state.lsl);
    var usl = state.usl === "" ? null : Number(state.usl);
    if (lsl !== null && !isFinite(lsl)) lsl = null;
    if (usl !== null && !isFinite(usl)) usl = null;

    var n = state.values.length;
    var under = 0, over = 0;
    if (n > 0 && (lsl !== null || usl !== null)) {
      for (var i = 0; i < n; i++) {
        var v = state.values[i];
        if (lsl !== null && v < lsl) under++;
        else if (usl !== null && v > usl) over++;
      }
    }
    var inSpec = n - under - over;
    var haveSpec = n > 0 && (lsl !== null || usl !== null);

    function pct(c) { return haveSpec ? (Math.round((c / n) * 1000) / 10) + "%" : "–"; }

    els.pctUnder.textContent = pct(under);
    els.pctIn.textContent = pct(inSpec);
    els.pctOver.textContent = pct(over);
    els.underCount.textContent = haveSpec ? under + " of " + n : "";
    els.inCount.textContent = haveSpec ? inSpec + " of " + n : "";
    els.overCount.textContent = haveSpec ? over + " of " + n : "";

    if (haveSpec) {
      els.barUnder.style.width = (under / n * 100) + "%";
      els.barIn.style.width = (inSpec / n * 100) + "%";
      els.barOver.style.width = (over / n * 100) + "%";
    } else {
      els.barUnder.style.width = els.barIn.style.width = els.barOver.style.width = "0%";
    }
  }

  function renderAllValues() {
    var lsl = state.lsl === "" ? null : Number(state.lsl);
    var usl = state.usl === "" ? null : Number(state.usl);
    if (lsl !== null && !isFinite(lsl)) lsl = null;
    if (usl !== null && !isFinite(usl)) usl = null;

    els.allValuesList.innerHTML = "";
    if (state.values.length === 0) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No values yet. Add some on the Enter tab.";
      els.allValuesList.appendChild(empty);
      return;
    }
    for (var i = 0; i < state.values.length; i++) {
      var v = state.values[i];
      var li = document.createElement("li");
      var status = "";
      var tag = "";
      if (lsl !== null && v < lsl) { status = "is-under"; tag = "UNDER"; }
      else if (usl !== null && v > usl) { status = "is-over"; tag = "OVER"; }
      if (status) li.className = status;

      var left = document.createElement("span");
      left.className = "vidx";
      left.textContent = "Rep " + (i + 1);
      var right = document.createElement("span");
      right.textContent = fmt(v);
      li.appendChild(left);
      if (tag) {
        var t = document.createElement("span");
        t.className = "tag";
        t.textContent = tag;
        right.textContent = fmt(v) + "  ";
        right.appendChild(t);
      }
      li.appendChild(right);
      els.allValuesList.appendChild(li);
    }
  }

  function renderAll() {
    renderEntry();
    renderSummary();
  }

  /* ---------- Actions ---------- */
  function addFromInput() {
    var nums = parseNumbers(els.entryInput.value);
    if (nums.length === 0) { els.entryInput.value = ""; return; }
    for (var i = 0; i < nums.length; i++) state.values.push(nums[i]);
    els.entryInput.value = "";
    save();
    renderAll();
    els.entryInput.focus();
  }

  function removeAt(index) {
    if (index >= 0 && index < state.values.length) {
      state.values.splice(index, 1);
      save();
      renderAll();
    }
  }

  function undoLast() {
    if (state.values.length) {
      state.values.pop();
      save();
      renderAll();
    }
  }

  function clearAll() {
    if (state.values.length === 0) return;
    if (window.confirm("Clear all " + state.values.length + " replications?")) {
      state.values = [];
      save();
      renderAll();
    }
  }

  function exportCSV() {
    var lines = ["replication,value"];
    for (var i = 0; i < state.values.length; i++) {
      lines.push((i + 1) + "," + state.values[i]);
    }
    var s = stats(state.values);
    lines.push("");
    lines.push("specification," + (state.specName.replace(/,/g, " ") || ""));
    lines.push("count," + (s.n || 0));
    lines.push("average," + (s.n ? s.avg : ""));
    lines.push("min," + (s.n ? s.min : ""));
    lines.push("max," + (s.n ? s.max : ""));
    lines.push("range," + (s.n ? s.range : ""));
    lines.push("std_dev," + (s.n ? s.std : ""));
    lines.push("LSL," + state.lsl);
    lines.push("USL," + state.usl);

    var blob = new Blob([lines.join("\n")], { type: "text/csv" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var name = (state.specName.trim() || "countqc").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    a.href = url;
    a.download = name + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- Navigation ---------- */
  function showPage(which) {
    var entry = which === "entry";
    els.pageEntry.classList.toggle("hidden", !entry);
    els.pageSummary.classList.toggle("hidden", entry);
    els.tabEntry.classList.toggle("is-active", entry);
    els.tabSummary.classList.toggle("is-active", !entry);
    if (entry) {
      els.entryInput.focus();
    } else {
      renderSummary();
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Wire up events ---------- */
  function init() {
    load();

    els.specName.value = state.specName;
    els.lslInput.value = state.lsl;
    els.uslInput.value = state.usl;

    els.entryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addFromInput();
    });

    els.valuesList.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-index]");
      if (btn) removeAt(parseInt(btn.dataset.index, 10));
    });

    els.undoBtn.addEventListener("click", undoLast);
    els.clearBtn.addEventListener("click", clearAll);
    els.exportBtn.addEventListener("click", exportCSV);

    els.specName.addEventListener("input", function () {
      state.specName = els.specName.value;
      save();
      els.repName.textContent = state.specName.trim() || "New record";
    });

    els.lslInput.addEventListener("input", function () {
      state.lsl = els.lslInput.value.trim();
      save();
      renderSummary();
    });
    els.uslInput.addEventListener("input", function () {
      state.usl = els.uslInput.value.trim();
      save();
      renderSummary();
    });

    els.tabEntry.addEventListener("click", function () { showPage("entry"); });
    els.tabSummary.addEventListener("click", function () { showPage("summary"); });

    renderAll();
  }

  /* ---------- Service worker (offline / installable) ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* ignore */ });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
