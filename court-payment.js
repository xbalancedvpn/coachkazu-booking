/* Coach Kazu: admin-only court payment reference, kept outside coaching income. */
(function () {
  'use strict';
  var db = window.coachKazuDb;
  if (!db) return;
  var records = new Map();
  var activeId = null, paymentId = null, completionId = null;
  var loading = false, pending = false, refreshTimer = null;
  function byId(id) { return document.getElementById(id); }
  function peso(v) { return '₱' + (Number(v) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function notify(message) {
    var toast = byId('toast');
    if (!toast) { window.alert(message); return; }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3100);
  }
  function dataFromRecord(b) {
    return { paid: b?.court_paid_by_coach===true, amount: Number(b?.court_paid_amount||0), charge: b?.court_charge_client===true };
  }
  function courtAmount(record) {
    if (!record) return 0;
    var court = dataFromRecord(record);
    return court.paid && court.charge ? court.amount : 0;
  }
  function totalBill(record) {
    return Number(record.total_amount || 0) + courtAmount(record);
  }
  function cardBookingId(card) {
    var id = card.getAttribute('id') || '';
    if (id.indexOf('booking-card-') === 0) return id.slice('booking-card-'.length);
    if (id.indexOf('payment-followup-') === 0) return id.slice('payment-followup-'.length);
    var btn = card.querySelector('[data-completed-tip], [data-confirmation], [data-followup-payment]');
    return btn ? (btn.dataset.completedTip || btn.dataset.confirmation || btn.dataset.followupPayment) : null;
  }
  function renderCards() {
    document.querySelectorAll('.booking-card, .payment-followup-card, .completed-session-card').forEach(function (card) {
      var id = cardBookingId(card);
      var record = records.get(String(id));
      if (!id || !record) return;
      var court = dataFromRecord(record);
      var actions = card.querySelector('.card-actions');
      if (!actions) return;
      var btn = actions.querySelector('[data-kazu-court-edit]');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mini kazu-court-action';
        btn.dataset.kazuCourtEdit = String(id);
        actions.appendChild(btn);
      }
      btn.textContent = court.paid ? 'Edit Court Payment' : '+ Court Payment';
      var info = card.querySelector('.kazu-court-strip');
      if (!court.paid) { if (info) info.remove(); return; }
      if (!info) {
        info = document.createElement('div');
        info.className = 'kazu-court-strip';
        actions.parentElement.insertBefore(info, actions);
      }
      info.replaceChildren();
      var name = document.createElement('strong');
      name.textContent = 'COURT PAYMENT • ' + peso(court.amount) + ' paid by Coach';
      var detail = document.createElement('small');
      detail.textContent = court.charge
        ? 'Include court in client bill · TOTAL AMOUNT DUE: ' + peso(totalBill(record))
        : 'Not charged to client · Coaching bill remains ' + peso(record.total_amount);
      var foot = document.createElement('small');
      foot.textContent = 'Court amount is excluded from coaching income, tips and profit.';
      info.append(name, detail, foot);
    });
  }
  async function refresh() {
    if (loading) { pending = true; return; }
    loading = true;
    try {
      var reply = await db.from('bookings').select('id,total_amount,court_paid_by_coach,court_paid_amount,court_charge_client').eq('status', 'confirmed').limit(400);
      if (reply.error) throw reply.error;
      records.clear();
      (reply.data || []).forEach(function (record) { records.set(String(record.id), record); });
      renderCards();
      updateBills();
    } catch (err) {
      console.warn('Court Payment: could not refresh records', err);
    } finally {
      loading = false;
      if (pending) { pending = false; refresh(); }
    }
  }
  function queueRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 250);
  }
  function makeDialog() {
    if (byId('kazuCourtPaymentDialog')) return;
    var dialog = document.createElement('dialog');
    dialog.id = 'kazuCourtPaymentDialog';
    dialog.className = 'kazu-court-dialog';
    dialog.innerHTML = [
      '<form id="kazuCourtForm" class="dialog-card">',
      '<button class="x" id="kazuCourtClose" type="button" aria-label="Close">×</button>',
      '<span class="eyebrow">ADMIN ONLY • COLLECTION</span>',
      '<h2>Court Payment</h2>',
      '<div id="kazuCourtBookingMeta" class="confirm-meta"></div>',
      '<label class="kazu-court-toggle"><span>Paid by Coach Kazu?<small>Optional court rental record</small></span><input id="kazuCourtPaid" type="checkbox"></label>',
      '<div id="kazuCourtFields">',
      '<label>Actual court amount paid (₱)<input id="kazuCourtAmount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="e.g. 310.00"></label>',
      '<label class="kazu-court-toggle"><span>Include in client total amount due?<small>Uncheck if Coach will not charge the client</small></span><input id="kazuCourtCharge" type="checkbox" checked></label>',
      '</div>',
      '<div class="kazu-court-bill" id="kazuCourtPreview" aria-live="polite"></div>',
      '<p class="kazu-court-help">Court payment is a pass-through reference only. It is never added to coaching income, TIP, or total profit.</p>',
      '<div class="dialog-actions"><button id="kazuCourtCancel" class="ghost" type="button">Cancel</button><button id="kazuCourtSave" class="primary" type="submit">Save Court Payment</button></div>',
      '</form>'
    ].join('');
    document.body.appendChild(dialog);
    byId('kazuCourtClose').addEventListener('click', function () { dialog.close(); });
    byId('kazuCourtCancel').addEventListener('click', function () { dialog.close(); });
    ['kazuCourtPaid', 'kazuCourtAmount', 'kazuCourtCharge'].forEach(function (id) {
      byId(id).addEventListener('input', updatePreview);
      byId(id).addEventListener('change', updatePreview);
    });
    byId('kazuCourtForm').addEventListener('submit', saveCourt);
  }
  function updatePreview() {
    var record = records.get(String(activeId));
    if (!record) return;
    var paid = byId('kazuCourtPaid').checked;
    byId('kazuCourtFields').hidden = !paid;
    var amount = Number(byId('kazuCourtAmount').value || 0);
    var charge = paid && byId('kazuCourtCharge').checked;
    var due = Number(record.total_amount || 0) + (charge && amount > 0 ? amount : 0);
    byId('kazuCourtPreview').innerHTML = '<span>COACHING FEE ' + peso(record.total_amount) +
      '</span><span>COURT CHARGE ' + peso(charge ? amount : 0) +
      '</span><strong>CLIENT TOTAL AMOUNT DUE ' + peso(due) + '</strong>';
  }
  async function openEditor(id) {
    var record = records.get(String(id));
    if (!record) { await refresh(); record = records.get(String(id)); }
    if (!record) { notify('Booking not found.'); return; }
    makeDialog();
    activeId = String(id);
    var court = dataFromRecord(record);
    byId('kazuCourtPaid').checked = court.paid;
    byId('kazuCourtAmount').value = court.paid ? String(court.amount) : '';
    byId('kazuCourtCharge').checked = court.paid ? court.charge : true;
    byId('kazuCourtBookingMeta').textContent = 'Coaching fee: ' + peso(record.total_amount);
    updatePreview();
    byId('kazuCourtPaymentDialog').showModal();
  }
  async function saveCourt(event) {
    event.preventDefault();
    var record = records.get(String(activeId));
    if (!record) return;
    var paid = byId('kazuCourtPaid').checked;
    var amount = paid ? Number(byId('kazuCourtAmount').value) : 0;
    if (paid && (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001)) {
      notify('Enter the exact court amount paid, to 2 decimal places.');
      return;
    }
    var court = { paid: paid, amount: paid ? Math.round(amount * 100) / 100 : 0, charge: paid && byId('kazuCourtCharge').checked };
    var button = byId('kazuCourtSave');
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      var history = await db.from('booking_payments').select('court_amount').eq('booking_id', activeId);
      if (history.error) throw history.error;
      var received = (history.data || []).reduce(function (sum, p) { return sum + Number(p.court_amount || 0); }, 0);
      if (received > (court.paid && court.charge ? court.amount : 0) + .001) {
        throw new Error('Court payment already collected: ' + peso(received) + '. Court charge cannot be lowered below the collected amount.');
      }
      var reply = await db.from('bookings').update({ court_paid_by_coach: court.paid, court_paid_amount: court.amount, court_charge_client: court.charge }).eq('id', activeId).select('id,court_paid_by_coach,court_paid_amount,court_charge_client').single();
      if (reply.error) throw reply.error;
      Object.assign(record, reply.data);
      byId('kazuCourtPaymentDialog').close();
      renderCards();
      updateBills();
      notify('Court payment saved to this booking.');
      window.dispatchEvent(new CustomEvent('coach:data-changed', { detail: { type: 'court-payment', bookingId: activeId } }));
    } catch (error) {
      notify(error.message || 'Could not save court amount.');
    } finally {
      button.disabled = false;
      button.textContent = 'Save Court Payment';
    }
  }
  function updateBill(targetId, id) {
    var target = byId(targetId), record = records.get(String(id));
    if (!target) return;
    if (!record) { target.hidden = true; return; }
    var court = dataFromRecord(record);
    if (!court.paid) { target.hidden = true; return; }
    var bill = totalBill(record);
    target.hidden = false;
    target.replaceChildren();
    var heading = document.createElement('strong');
    heading.textContent = 'CLIENT TOTAL AMOUNT DUE • ' + peso(bill);
    var breakdown = document.createElement('small');
    breakdown.textContent = 'Coaching ' + peso(record.total_amount) + ' + Court ' + peso(courtAmount(record));
    var foot = document.createElement('small');
    foot.textContent = court.charge
      ? 'Court collection is recorded separately from coaching income and TIP.'
      : 'Not charged to the client. No court amount is added to income.';
    target.append(heading, breakdown, foot);
  }
  function ensureBill(dialogId, summaryId, mountSelector) {
    var dialog = byId(dialogId);
    if (!dialog) return;
    var location = dialog.querySelector(mountSelector);
    if (!location) return;
    var banner = byId(summaryId);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = summaryId;
      banner.className = 'kazu-court-bill kazu-court-live-bill';
      banner.hidden = true;
      location.parentElement.insertBefore(banner, location);
    }
    new MutationObserver(updateBills).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }
  function updateBills() {
    if (byId('paymentDialog') && byId('paymentDialog').open) updateBill('kazuCourtPaymentBill', paymentId);
    if (byId('postSessionDialog') && byId('postSessionDialog').open) updateBill('kazuCourtCompletionBill', completionId);
  }
  document.addEventListener('click', function (event) {
    var edit = event.target.closest('[data-kazu-court-edit]');
    if (edit) {
      event.preventDefault();
      openEditor(edit.dataset.kazuCourtEdit);
      return;
    }
    var button = event.target.closest('[data-payment], [data-add-tip], [data-followup-payment], [data-completed-tip], [data-complete]');
    if (!button) return;
    var data = button.dataset;
    if (data.complete) completionId = data.complete;
    else paymentId = data.payment || data.addTip || data.followupPayment || data.completedTip;
    setTimeout(updateBills, 40);
  }, true);
  ensureBill('paymentDialog', 'kazuCourtPaymentBill', '.payment-stats');
  ensureBill('postSessionDialog', 'kazuCourtCompletionBill', '.post-session-summary');
  ['todayBookings', 'bookings', 'pastSessionsList', 'paymentFollowupList', 'completedSessionsList'].forEach(function (id) {
    var container = byId(id);
    if (container) new MutationObserver(queueRefresh).observe(container, { childList: true });
  });
  window.addEventListener('coach:admin-ready', queueRefresh);
  if (byId('adminView') && !byId('adminView').classList.contains('hidden')) queueRefresh();
})();
