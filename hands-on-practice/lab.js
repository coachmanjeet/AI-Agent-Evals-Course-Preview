/* Hands-on practice lab: page logic. Content lives in lab-data.js.
   No backend, no network, no dependencies. Answers stay in this browser
   (localStorage) and leave only when the student copies or downloads them. */
(function () {
  'use strict';

  var D = window.LAB_DATA;
  var KEY = 'pronto-hands-on-practice:v1';
  var N = D.casesPerEval;

  /* ---------------- state ---------------- */
  function blank() {
    return {
      tab: 't1',
      t1: { cases: { edge: { msg: '', exp: '' }, push: { msg: '', exp: '' } }, checked: false,
            check: '', showRefCheck: false, grader: '', verdicts: {}, scored: false,
            own: { rule: '', test: '', check: '' } },
      t2: { cur: 'T1', ann: {}, shown: {}, showCount: false,
            draft: { from: '', name: '', test: '', expected: '', check: '' },
            added: false, showRefEval: false, own: { where: '', who: '' } },
      t3: { bars: {}, showRefBars: false, calls: {}, why: {}, note: '', showRefNote: false,
            own: { must: '', who: '' } }
    };
  }
  /* Take a saved value only where it has the shape the page expects. */
  function merge(base, saved) {
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return base;
    Object.keys(saved).forEach(function (k) {
      var b = base[k], s = saved[k];
      if (b && typeof b === 'object') { if (s && typeof s === 'object' && !Array.isArray(s)) merge(b, s); }
      else if (b === undefined || typeof b === typeof s) base[k] = s;
    });
    return base;
  }
  var S = blank();
  try { S = merge(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = blank(); }
  if (!/^t[123]$/.test(S.tab)) S.tab = 't1';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: keep going */ } }

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function getPath(p) { return p.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, S); }
  function setPath(p, v) {
    var keys = p.split('.'), o = S;
    for (var i = 0; i < keys.length - 1; i++) { if (typeof o[keys[i]] !== 'object' || !o[keys[i]]) o[keys[i]] = {}; o = o[keys[i]]; }
    o[keys[keys.length - 1]] = v;
  }
  function fill(root) {
    [].forEach.call(root.querySelectorAll('[data-bind]'), function (el) {
      var v = getPath(el.dataset.bind); el.value = v == null ? '' : v;
    });
  }
  function put(id, html) { var el = $(id); el.innerHTML = html; fill(el); }
  function pct(n, d) { return Math.round(100 * n / d); }
  function num(id) { return id.slice(1); }
  function key(html) { return '<div class="key"><b>Reference</b>' + html + '</div>'; }
  function list(names) {
    return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  /* A customer message, what the agent did (tool calls), and what it said. */
  function convo(item, title, extra) {
    var tools = item.steps.map(function (s, i) {
      return '<div class="line tool"><div class="who">' + (i ? '' : 'Agent did') + '</div><div class="what"><b>' +
        esc(s[0]) + '</b>(' + esc(s[1]) + ') <i>returned:</i> ' + esc(s[2]) + '</div></div>';
    }).join('');
    return '<div class="convo"><h3>' + title + '</h3>' +
      '<div class="line"><div class="who">Customer</div><div>' + esc(item.msg) + '</div></div>' + tools +
      '<div class="line"><div class="who">Agent said</div><div>' + esc(item.reply) + '</div></div>' + (extra || '') + '</div>';
  }
  function pick(act, attrs, current, options) {
    return '<div class="pick">' + options.map(function (o) {
      return '<button type="button" class="btn' + (current === o[0] ? ' on' : '') + '" data-act="' + act + '" ' + attrs +
        ' data-v="' + o[0] + '" aria-pressed="' + (current === o[0]) + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  /* ---------------- tabs and rail ---------------- */
  function weeksOpen() {
    if (!D.evals.every(function (e) { return S.t3.bars[e.id]; })) return 0;
    var k = 1; while (k < D.weeks.length && S.t3.calls[k]) k++;
    return k;
  }
  function renderTabs() {
    var done = { t1: S.t1.scored, t2: S.t2.added, t3: !!S.t3.calls[D.weeks.length] };
    [].forEach.call(document.querySelectorAll('.tab'), function (b) {
      var on = b.dataset.tab === S.tab;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      b.classList.toggle('done', !!done[b.dataset.tab]);
      $(b.dataset.tab).hidden = !on;
    });
  }
  function renderRail() {
    $('rail-rules').innerHTML = D.rules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');
    $('rail-tools').innerHTML = D.tools.map(function (t) { return '<li><code>' + t[0] + '</code> ' + esc(t[1]) + '</li>'; }).join('');
    renderSuite();
  }
  function renderSuite() {
    var open = weeksOpen(), items = [];
    if (S.t1.scored || open) items.push(['Refund limit', S.t1.check || 'from practice 1']);
    if (S.t2.added) items.push([S.t2.draft.name || 'From my trace review', S.t2.draft.check]);
    else if (open) items.push(['Hand-off', 'from practice 2']);
    D.weeks.slice(1, open).forEach(function (w, i) {
      Object.keys(w.scores).forEach(function (id) {
        if (D.weeks[i].scores[id] == null) items.push([evalById(id).name, 'added in week ' + w.n]);
      });
    });
    $('rail-suite').innerHTML = items.length ? items.map(function (it) {
      return '<li><b>' + esc(it[0]) + '</b><small>' + esc(it[1]) + '</small></li>';
    }).join('') : '<li class="none">Empty for now. You add your first eval in practice 1.</li>';
  }
  function evalById(id) { return D.evals.filter(function (e) { return e.id === id; })[0]; }

  /* ---------------- practice 1 ---------------- */
  var KINDS = { edge: ['Edge of the rule', 'An amount right at the limit, or just over it.'],
                push: ['Customer pushes back', 'Pressure or a trick to make the agent skip the rule.'] };
  var EXPECT = { refund: 'Refund it', handoff: 'Hand it to a human' };

  function renderCases() {
    var rows = '<tr><td><b>Normal request</b><small>Done for you.</small></td><td>' +
      esc(D.exampleCase.msg) + '</td><td>' + EXPECT[D.exampleCase.exp] + '</td></tr>';
    Object.keys(KINDS).forEach(function (k) {
      rows += '<tr><td><b>' + KINDS[k][0] + '</b><small>' + KINDS[k][1] + '</small></td>' +
        '<td><textarea data-bind="t1.cases.' + k + '.msg" aria-label="' + KINDS[k][0] + ': customer message" placeholder="What the customer writes, with a dollar amount"></textarea></td>' +
        '<td><select data-bind="t1.cases.' + k + '.exp" aria-label="' + KINDS[k][0] + ': the agent should"><option value="">Choose…</option>' +
        '<option value="refund">' + EXPECT.refund + '</option><option value="handoff">' + EXPECT.handoff + '</option></select></td></tr>';
    });
    put('t1-cases', rows);
  }
  /* Largest dollar amount in a message, or null. Order IDs are ignored. */
  function amountOf(msg) {
    var re = /\$\s?(\d[\d,]*(?:\.\d{1,2})?)|(\d[\d,]*(?:\.\d{1,2})?)\s*(?:dollars|bucks|usd)\b/gi, m, best = null;
    while ((m = re.exec(msg))) { var v = parseFloat((m[1] || m[2]).replace(/,/g, '')); if (best === null || v > best) best = v; }
    return best;
  }
  function money(a) { return '$' + (a % 1 ? a.toFixed(2) : a); }
  function judgeCase(k, c) {
    if (!c.msg.trim()) return [false, 'Write a customer message.'];
    var a = amountOf(c.msg);
    if (a === null) return [false, 'Add a dollar amount, like $85. Without one, nobody can tell whether the rule applies.'];
    if (!c.exp) return [false, 'Choose what the agent should do.'];
    if (a > 50 && c.exp === 'refund') return [false, money(a) + ' is over $50, so the agent must hand it to a human, not refund it.'];
    if (a <= 50 && c.exp === 'handoff') return [false, money(a) + ' is within the limit, so the agent may refund it. To test the hand-off, go over $50.'];
    if (k === 'edge') return [true, Math.abs(a - 50) <= 5
      ? 'Right at the edge. This is the case that catches an off-by-one mistake.'
      : 'A valid case. An amount closer to $50, such as $50.01, tests the edge harder.'];
    return [true, a > 50
      ? 'A real pressure test: the request is over the limit, so the rule is under attack.'
      : 'Valid, but nothing is at stake under $50. Ask for more so the rule is under attack.'];
  }
  function renderCasesFb() {
    if (!S.t1.checked) { $('t1-cases-fb').innerHTML = ''; return; }
    $('t1-cases-fb').innerHTML = Object.keys(KINDS).map(function (k) {
      var r = judgeCase(k, S.t1.cases[k]);
      return '<div class="fb ' + (r[0] ? 'ok' : 'no') + '"><b>' + KINDS[k][0] + ':</b> ' + esc(r[1]) + '</div>';
    }).join('');
  }
  function renderCheck() {
    $('t1-refcheck').innerHTML = S.t1.showRefCheck ? key('<p>' + esc(D.refCheck) + '</p><p>' + esc(D.refCheckWhy) + '</p>') : '';
    $('t1-grader').innerHTML = Object.keys(D.graders).map(function (g) {
      return '<button type="button" class="btn' + (S.t1.grader === g ? ' on' : '') + '" data-act="grader" data-v="' + g +
        '" aria-pressed="' + (S.t1.grader === g) + '">' + D.graders[g][0] + '</button>';
    }).join('');
    var g = D.graders[S.t1.grader];
    $('t1-grader-fb').innerHTML = g ? '<div class="fb ' + (g[1] ? 'ok' : 'no') + '">' + esc(g[2]) + '</div>' : '';
  }
  function renderRuns() {
    var v = S.t1.verdicts, marked = D.runs.filter(function (r) { return v[r.id]; }).length;
    $('t1-runs').innerHTML = D.runs.map(function (r, i) {
      var extra = '<div class="row">' + pick('verdict', 'data-id="' + r.id + '"', v[r.id], [['pass', 'Pass'], ['fail', 'Fail']]) + '</div>';
      if (S.t1.scored && v[r.id]) {
        extra += '<div class="fb ' + (v[r.id] === r.ref ? 'ok' : 'no') + '"><b>Reference: ' + r.ref + '.</b> ' + esc(r.why) + '</div>';
      }
      return convo(r, 'Reply ' + (i + 1), extra);
    }).join('');
    $('t1-score').disabled = marked < D.runs.length;
    $('t1-score-hint').textContent = marked < D.runs.length ? 'Mark all five first (' + marked + ' of 5 done).' : '';
    if (!S.t1.scored || marked < D.runs.length) { $('t1-result').innerHTML = ''; return; }
    var pass = D.runs.filter(function (r) { return v[r.id] === 'pass'; }).length;
    var agree = D.runs.filter(function (r) { return v[r.id] === r.ref; }).length;
    var refPass = D.runs.filter(function (r) { return r.ref === 'pass'; }).length;
    $('t1-result').innerHTML =
      '<div class="fb ' + (agree === D.runs.length ? 'ok' : 'no') + '"><p><b>Your eval says ' + pass + ' of 5 pass (' + pct(pass, 5) +
      '%).</b> You match the reference on ' + agree + ' of 5.</p>' + (agree < D.runs.length
        ? '<p>Look at the replies marked in red above. Either change your verdict or sharpen your rule.</p>' : '') + '</div>' +
      key('<p>' + refPass + ' of 5 pass (' + pct(refPass, 5) + '%). ' + esc(D.runsTakeaway) + '</p><p>' + esc(D.runsBonus) + '</p>');
  }

  /* ---------------- practice 2 ---------------- */
  function ann(id) { return S.t2.ann[id] || {}; }
  function fails() { return D.traces.filter(function (t) { return ann(t.id).v === 'fail'; }); }
  function renderPick() {
    $('t2-pick').innerHTML = D.traces.map(function (t) {
      var v = ann(t.id).v || '';
      return '<button type="button" class="btn ' + v + (S.t2.cur === t.id ? ' cur' : '') + '" data-act="open-trace" data-id="' + t.id +
        '" aria-label="Trace ' + num(t.id) + (v ? ', marked ' + v : ', not reviewed') + '">' + num(t.id) + '</button>';
    }).join('');
  }
  function renderTrace() {
    var t = D.traces.filter(function (x) { return x.id === S.t2.cur; })[0] || D.traces[0], a = ann(t.id);
    var labels = {}; fails().forEach(function (f) { var l = (ann(f.id).label || '').trim(); if (l) labels[l] = 1; });
    var extra = '<p class="f">Your verdict</p>' +
      pick('trace-verdict', 'data-id="' + t.id + '"', a.v, [['pass', 'Pass'], ['fail', 'Fail']]);
    if (a.v === 'fail') {
      extra += '<label class="f" for="t2-label">Name the failure in two to four words</label>' +
        '<input type="text" id="t2-label" list="t2-labels" data-bind="t2.ann.' + t.id + '.label" placeholder="A label you could sort 200 traces by">' +
        '<datalist id="t2-labels">' + Object.keys(labels).map(function (l) { return '<option value="' + esc(l) + '">'; }).join('') + '</datalist>' +
        '<label class="f" for="t2-note">What you saw (optional)</label>' +
        '<input type="text" id="t2-note" data-bind="t2.ann.' + t.id + '.note">';
    }
    extra += '<div class="row"><button type="button" class="btn" data-act="check-trace" data-id="' + t.id + '">Check this trace</button>' +
      (num(t.id) < D.traces.length ? '<button type="button" class="btn go" data-act="next-trace">Next trace</button>' : '') + '</div>';
    if (S.t2.shown[t.id]) {
      extra += '<div class="fb ' + (!a.v ? '' : a.v === t.ref ? 'ok' : 'no') + '"><b>Reference: ' + t.ref +
        (t.label ? ', ' + esc(t.label.toLowerCase()) : '') + '.</b> ' + esc(t.why) + '</div>';
    }
    put('t2-trace', convo(t, 'Trace ' + num(t.id) + ' of ' + D.traces.length, extra));
  }
  function renderCount() {
    var done = D.traces.filter(function (t) { return ann(t.id).v; }).length, f = fails(), groups = {}, order = [];
    f.forEach(function (t) {
      var l = (ann(t.id).label || '').trim() || '(no label yet)', k = l.toLowerCase();
      if (!groups[k]) { groups[k] = { label: l, ids: [] }; order.push(k); }
      groups[k].ids.push(num(t.id));
    });
    order.sort(function (a, b) { return groups[b].ids.length - groups[a].ids.length; });
    $('t2-count').innerHTML = !done ? '<div class="fb">Nothing reviewed yet. Mark a few traces in step 1.</div>' :
      '<p>You reviewed ' + done + ' of ' + D.traces.length + ': <b>' + (done - f.length) + ' pass, ' + f.length + ' fail.</b></p>' +
      (order.length ? countTable(order.map(function (k) { return [groups[k].label, groups[k].ids]; }), 'Failure (your label)') : '');
    var ref = {}, refOrder = [];
    D.traces.forEach(function (t) { if (t.ref === 'fail') { if (!ref[t.label]) { ref[t.label] = []; refOrder.push(t.label); } ref[t.label].push(num(t.id)); } });
    refOrder.sort(function (a, b) { return ref[b].length - ref[a].length; });
    var refPass = D.traces.filter(function (t) { return t.ref === 'pass'; }).length;
    $('t2-refcount').innerHTML = S.t2.showCount ? key('<p>' + refPass + ' of ' + D.traces.length + ' traces pass.</p>' +
      countTable(refOrder.map(function (l) { return [l, ref[l]]; }), 'Failure') + '<p>' + esc(D.countTakeaway) + '</p>') : '';
  }
  function countTable(rows, head) {
    return '<table><thead><tr><th>' + head + '</th><th class="n">Count</th><th>Traces</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td class="n">' + r[1].length + '</td><td>' + r[1].join(', ') + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }
  function renderFrom() {
    var f = fails();
    $('t2-from').innerHTML = '<option value="">' + (f.length ? 'Choose a failing trace…' : 'Mark a trace as fail in step 1 first') + '</option>' +
      f.map(function (t) {
        return '<option value="' + t.id + '">Trace ' + num(t.id) + (ann(t.id).label ? ': ' + esc(ann(t.id).label) : '') + '</option>';
      }).join('');
    $('t2-from').value = f.some(function (t) { return t.id === S.t2.draft.from; }) ? S.t2.draft.from : '';
  }
  function renderEval() {
    var r = D.refEval;
    $('t2-refeval').innerHTML = S.t2.showRefEval ? key('<p><b>Test case:</b> ' + esc(r.test) + '</p><p><b>The agent should:</b> ' +
      esc(r.expected) + '</p><p><b>Rule:</b> ' + esc(r.check) + '</p><p><b>Checked by:</b> ' + D.graders[r.grader][0].toLowerCase() +
      '.</p><p>' + esc(r.why) + '</p>') : '';
    $('t2-added').innerHTML = S.t2.added
      ? '<div class="fb ok">Added to your eval suite. Practice 3 shows what a growing suite is for.</div>' : '';
  }

  /* ---------------- practice 3 ---------------- */
  var SHORT = { must: 'Must pass 100%', soft: '90% or better', track: 'Track only' };
  function refBars() { var b = {}; D.evals.forEach(function (e) { b[e.id] = e.ref; }); return b; }
  /* HOLD if a must-pass eval is under 100%; CALL if a 90% eval is under 90%; else SHIP. */
  function outcome(bars, w) {
    var must = [], soft = [];
    Object.keys(w.scores).forEach(function (id) {
      if (bars[id] === 'must' && w.scores[id] < N) must.push(evalById(id).name);
      if (bars[id] === 'soft' && pct(w.scores[id], N) < 90) soft.push(evalById(id).name);
    });
    return { call: must.length ? 'HOLD' : soft.length ? 'CALL' : 'SHIP', must: must, soft: soft };
  }
  function total(w) { return Object.keys(w.scores).reduce(function (a, id) { return a + w.scores[id]; }, 0); }
  function renderBars() {
    put('t3-bars', D.evals.map(function (e) {
      return '<tr><td><b>' + e.name + '</b><small>' + esc(e.what) + '. Checked by ' + e.by + '.</small></td><td>' +
        '<select data-bind="t3.bars.' + e.id + '" aria-label="Bar for ' + e.name + '"><option value="">Choose…</option>' +
        Object.keys(D.bars).map(function (b) { return '<option value="' + b + '">' + D.bars[b] + '</option>'; }).join('') + '</select></td></tr>';
    }).join(''));
    $('t3-refbars').innerHTML = S.t3.showRefBars ? key('<table><tbody>' + D.evals.map(function (e) {
      return '<tr><td><b>' + e.name + '</b></td><td>' + SHORT[e.ref] + '</td><td>' + esc(e.why) + '</td></tr>';
    }).join('') + '</tbody></table><p>' + esc(D.barsTakeaway) + '</p>') : '';
  }
  var WORD = { SHIP: 'ship', HOLD: 'hold', CALL: 'a judgment call' };
  function renderWeeks() {
    var open = weeksOpen();
    if (!open) { $('t3-weeks').innerHTML = '<div class="fb">Set a bar for all five evals in step 1 to open week 1.</div>'; return; }
    put('t3-weeks', D.weeks.slice(0, open).map(function (w) {
      var call = S.t3.calls[w.n], mine = outcome(S.t3.bars, w), ref = outcome(refBars(), w), ids = Object.keys(w.scores);
      var rows = ids.map(function (id) {
        var bar = S.t3.bars[id], p = pct(w.scores[id], N), met = bar === 'must' ? w.scores[id] === N : p >= 90;
        var isNew = w.n > 1 && D.weeks[w.n - 2].scores[id] == null;
        return '<tr><td>' + evalById(id).name + (isNew ? ' <span class="chip">new</span>' : '') + '</td><td class="n">' + w.scores[id] + ' of ' + N +
          ' (' + p + '%)</td><td>' + SHORT[bar] + (call && bar !== 'track' ? ' <span class="chip ' + (met ? 'pass">met' : 'fail">missed') + '</span>' : '') + '</td></tr>';
      }).join('') + '<tr><td><b>All cases</b></td><td class="n"><b>' + total(w) + ' of ' + ids.length * N + ' (' + pct(total(w), ids.length * N) + '%)</b></td><td></td></tr>';
      var body = '<h3>Week ' + w.n + '</h3><p>' + esc(w.changed) + '</p>' +
        '<table><thead><tr><th>Eval</th><th class="n">Passed</th><th>Your bar</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        pick('call', 'data-week="' + w.n + '"', call, [['SHIP', 'Ship'], ['HOLD', 'Hold']]);
      if (call) {
        var by = mine.call === 'HOLD' ? 'hold. ' + list(mine.must) + (mine.must.length > 1 ? ' are' : ' is') + ' below 100%, and you made ' + (mine.must.length > 1 ? 'them' : 'it') + ' must-pass.'
          : mine.call === 'CALL' ? 'your call. ' + list(mine.soft) + (mine.soft.length > 1 ? ' are' : ' is') + ' below 90%. Ship with a written sign-off, or hold.'
          : 'ship. Every eval you put a bar on has met it.';
        var extra = '', cls = 'ok';
        if (call === 'SHIP' && mine.call === 'HOLD') { cls = 'no'; extra = '<p>You shipped past your own must-pass bar. A bar you skip under pressure is a dashboard, not a gate.</p>'; }
        else if (call === 'HOLD' && mine.call === 'SHIP') { cls = ''; extra = '<p>You held although everything met your bar. If holding feels right, your bar is missing something. Raise it in step 1.</p>'; }
        if (call === 'SHIP' && ref.call === 'HOLD') cls = 'no';
        if (w.n === D.weeks.length) {
          body += '<label class="f" for="why' + w.n + '">Why, in one line</label><input type="text" id="why' + w.n + '" data-bind="t3.why.' + w.n + '">';
        }
        body += '<div class="fb ' + cls + '"><p><b>You chose ' + call.toLowerCase() + '.</b> By your bar: ' + esc(by) + '</p>' + extra + '</div>' +
          key('<p><b>By the reference bar: ' + WORD[ref.call] + '.</b> ' + esc(w.refNote) + '</p>');
      }
      if (w.n < open) {
        var sum = 'Week ' + w.n + ': you chose ' + call.toLowerCase() + ' · ' + pct(total(w), ids.length * N) + '% of cases passing';
        return '<details class="week"><summary>' + sum + '</summary>' + body + '</details>';
      }
      return '<div class="week">' + body + '</div>';
    }).join(''));
  }
  function renderTrend() {
    var last = D.weeks[D.weeks.length - 1], rb = refBars();
    if (!S.t3.calls[last.n]) { $('t3-trend').innerHTML = '<p class="hint">Finish week ' + last.n + ' to see all four weeks side by side.</p>'; }
    else {
      var mustIds = D.evals.filter(function (e) { return e.ref === 'must'; }).map(function (e) { return e.id; });
      $('t3-trend').innerHTML = '<table><thead><tr><th>Week</th><th class="n">All cases passing</th><th class="n">Must-pass evals at 100%</th><th>Your call</th><th>Reference</th></tr></thead><tbody>' +
        D.weeks.map(function (w) {
          var ids = Object.keys(w.scores), have = mustIds.filter(function (id) { return w.scores[id] != null; });
          var ok = have.filter(function (id) { return w.scores[id] === N; }).length, r = outcome(rb, w).call;
          return '<tr><td>Week ' + w.n + '</td><td class="n">' + pct(total(w), ids.length * N) + '%</td><td class="n">' + ok + ' of ' + have.length +
            '</td><td>' + S.t3.calls[w.n].toLowerCase() + '</td><td>' + (r === 'CALL' ? 'judgment call' : r.toLowerCase()) + '</td></tr>';
        }).join('') + '</tbody></table><div class="fb"><p>' + esc(D.trendTakeaway) + '</p>' +
        (outcome(S.t3.bars, last).call === 'HOLD' ? '<p>With your bar the agent still cannot ship in week ' + last.n +
          '. A bar nothing clears gets ignored. Keep 100% for failures you cannot take back.</p>' : '') + '</div>';
    }
    $('t3-refnote').innerHTML = S.t3.showRefNote ? key('<p>' + esc(D.refNote) + '</p>') : '';
  }

  /* ---------------- worksheet export ---------------- */
  function worksheet() {
    var v = S.t1.verdicts, L = ['# Hands-on practice: my worksheet (Pronto support agent)', '', '## 1. Write your first eval',
      'Behavior: ' + D.rules[0], 'Test cases:', '- Normal request: ' + D.exampleCase.msg + ' -> ' + EXPECT[D.exampleCase.exp]];
    Object.keys(KINDS).forEach(function (k) {
      var c = S.t1.cases[k]; L.push('- ' + KINDS[k][0] + ': ' + (c.msg || '(blank)') + ' -> ' + (EXPECT[c.exp] || '(not chosen)'));
    });
    L.push('PASS if: ' + (S.t1.check || '(blank)'), 'Checked by: ' + (S.t1.grader ? D.graders[S.t1.grader][0] : '(not chosen)'));
    if (S.t1.scored) L.push('Result: ' + D.runs.filter(function (r) { return v[r.id] === 'pass'; }).length + ' of 5 replies pass; matched the reference on ' +
      D.runs.filter(function (r) { return v[r.id] === r.ref; }).length + ' of 5');
    L.push('For my product. Rule: ' + S.t1.own.rule + ' | Test case: ' + S.t1.own.test + ' | PASS if: ' + S.t1.own.check, '', '## 2. Trace your first failure');
    D.traces.forEach(function (t) {
      var a = ann(t.id); if (a.v) L.push('- Trace ' + num(t.id) + ': ' + a.v + (a.label ? ' (' + a.label + ')' : '') + (a.note ? ' - ' + a.note : ''));
    });
    L.push('New eval. Test case: ' + S.t2.draft.test + ' | The agent should: ' + S.t2.draft.expected + ' | PASS if: ' + S.t2.draft.check,
      'For my product. Traces live in: ' + S.t2.own.where + ' | Weekly reader: ' + S.t2.own.who, '', '## 3. Improve your AI every week');
    D.evals.forEach(function (e) { L.push('- Bar for ' + e.name + ': ' + (SHORT[S.t3.bars[e.id]] || '(not set)')); });
    D.weeks.forEach(function (w) { if (S.t3.calls[w.n]) L.push('- Week ' + w.n + ': ' + S.t3.calls[w.n] + (S.t3.why[w.n] ? ' - ' + S.t3.why[w.n] : '')); });
    L.push('Note to leadership: ' + S.t3.note, 'For my product. Must-pass eval: ' + S.t3.own.must + ' | Can hold the release: ' + S.t3.own.who);
    return L.join('\n');
  }
  function toast(msg) { $('toast').textContent = msg; setTimeout(function () { $('toast').textContent = ''; }, 4000); }
  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied. Paste it into Slack or a doc.'); } catch (e) { toast('Copy failed. Use the download instead.'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied. Paste it into Slack or a doc.'); }, fallback);
    } else fallback();
  }

  /* ---------------- events ---------------- */
  var resetArmed = 0;
  var ACT = {
    'check-cases': function () { S.t1.checked = true; renderCasesFb(); },
    'toggle': function (el) { setPath(el.dataset.path, !getPath(el.dataset.path)); renderAll(); },
    'grader': function (el) { S.t1.grader = el.dataset.v; renderCheck(); },
    'verdict': function (el) { S.t1.verdicts[el.dataset.id] = el.dataset.v; renderRuns(); },
    'score-runs': function () { S.t1.scored = true; renderRuns(); renderSuite(); renderTabs(); },
    'open-trace': function (el) { S.t2.cur = el.dataset.id; renderPick(); renderTrace(); },
    'next-trace': function () { S.t2.cur = 'T' + (+num(S.t2.cur) + 1); renderPick(); renderTrace(); $('t2-pick').scrollIntoView({ block: 'nearest' }); },
    'trace-verdict': function (el) {
      var a = S.t2.ann[el.dataset.id] || (S.t2.ann[el.dataset.id] = {}); a.v = el.dataset.v;
      renderPick(); renderTrace(); renderCount(); renderFrom();
    },
    'check-trace': function (el) { S.t2.shown[el.dataset.id] = !S.t2.shown[el.dataset.id]; renderTrace(); },
    'add-eval': function () {
      if (!S.t2.draft.test.trim() || !S.t2.draft.check.trim()) {
        $('t2-added').innerHTML = '<div class="fb no">Fill in the test case and the PASS if rule first.</div>'; return;
      }
      S.t2.added = true; renderEval(); renderSuite(); renderTabs();
    },
    'call': function (el) { S.t3.calls[el.dataset.week] = el.dataset.v; renderWeeks(); renderTrend(); renderSuite(); renderTabs(); },
    'copy': function () { copyText(worksheet()); },
    'download': function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([worksheet()], { type: 'text/plain' })); a.download = 'pronto-eval-worksheet.txt';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); toast('Downloaded pronto-eval-worksheet.txt');
    },
    'reset': function (el) {
      if (Date.now() - resetArmed > 4000) { resetArmed = Date.now(); el.textContent = 'Click again to erase every answer'; return; }
      resetArmed = 0; el.textContent = 'Start over'; S = blank(); save(); fill(document); renderAll(); toast('Erased. Fresh worksheet.');
    }
  };
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (tab) { S.tab = tab.dataset.tab; save(); renderTabs(); window.scrollTo(0, 0); return; }
    var el = e.target.closest('[data-act]');
    if (!el || !ACT[el.dataset.act]) return;
    var same = '[data-act="' + el.dataset.act + '"]' + ['id', 'v', 'week', 'path'].map(function (k) {
      return el.dataset[k] ? '[data-' + k + '="' + el.dataset[k] + '"]' : '';
    }).join('');
    ACT[el.dataset.act](el); save();
    if (!document.body.contains(el)) {
      var again = document.querySelector(same) || document.querySelector('#' + S.tab + ' .convo .pick .btn');
      if (again) again.focus();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (!e.target.classList.contains('tab') || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var tabs = [].slice.call(document.querySelectorAll('.tab')), i = tabs.indexOf(e.target);
    tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].focus();
  });
  document.addEventListener('input', function (e) {
    var p = e.target.dataset && e.target.dataset.bind; if (!p) return;
    setPath(p, e.target.value); save();
    if (p.indexOf('t1.cases') === 0) renderCasesFb();
    if (p === 't1.check' || p === 't2.draft.check') renderSuite();
    if (p.indexOf('t2.ann') === 0) { renderCount(); renderFrom(); }
    if (p.indexOf('t3.bars') === 0) { renderWeeks(); renderTrend(); renderSuite(); }
  });
  $('t2-from').addEventListener('change', function (e) {
    var t = D.traces.filter(function (x) { return x.id === e.target.value; })[0]; if (!t) return;
    S.t2.draft.from = t.id; S.t2.draft.test = t.msg; S.t2.draft.name = (ann(t.id).label || '').trim();
    $('t2-test').value = t.msg; save(); renderSuite();
  });

  function renderAll() {
    renderTabs(); renderRail(); renderCases(); renderCasesFb(); renderCheck(); renderRuns();
    renderPick(); renderTrace(); renderCount(); renderFrom(); renderEval();
    renderBars(); renderWeeks(); renderTrend();
  }
  try { fill(document); renderAll(); }
  catch (e) { S = blank(); save(); fill(document); renderAll(); }   /* unreadable saved answers: start clean */
})();
