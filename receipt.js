(function (root) {
  'use strict';
  const activities = ['Search', 'Summarize', 'Generate', 'Revise', 'Other'];
  function amount(v, name, integer = false) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || (integer && !Number.isSafeInteger(v))) throw new Error(name + ' must be a nonnegative ' + (integer ? 'integer' : 'number'));
    return v;
  }
  function calculate(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.requests) || !Array.isArray(data.events) || !data.payment) throw new Error('Expected version 1 with requests, events and payment.');
    if (!['subscription', 'metered'].includes(data.payment.mode)) throw new Error('Unknown payment mode.');
    const fixed = data.payment.fixed_monthly_usd == null ? null : amount(data.payment.fixed_monthly_usd, 'Monthly fee');
    const paid = data.payment.additional_paid_usd == null ? null : amount(data.payment.additional_paid_usd, 'Additional payment');
    const requestIds = new Set();
    data.requests.forEach(r => {
      if (!r || typeof r.id !== 'string' || !r.id || typeof r.text !== 'string' || requestIds.has(r.id)) throw new Error('Each request needs a unique id and text.');
      requestIds.add(r.id);
    });
    const seen = new Set();
    const rows = data.events.map(e => {
      if (!e || typeof e.id !== 'string' || !e.id || seen.has(e.id)) throw new Error('Each event needs a unique id; duplicate events would double-count usage.');
      seen.add(e.id);
      if (!requestIds.has(e.request_id)) throw new Error('Event ' + e.id + ' has no matching request.');
      if (!activities.includes(e.activity)) throw new Error('Event ' + e.id + ' has an unknown activity.');
      if (!['model', 'tool'].includes(e.kind)) throw new Error('Event kind must be model or tool.');
      if (typeof e.label !== 'string') throw new Error('Event label must be text.');
      if (!['trace', 'manual', 'inferred'].includes(e.attribution)) throw new Error('Attribution must be trace, manual or inferred.');
      let input = null, cached = null, output = null, tokens = null, tokenCost = null;
      if (e.kind === 'model' && e.usage != null) {
        input = amount(e.usage.input_tokens, 'Input tokens', true);
        cached = amount(e.usage.cached_input_tokens, 'Cached input tokens', true);
        output = amount(e.usage.output_tokens, 'Output tokens', true);
        if (cached > input) throw new Error('Cached input must be included in, and no greater than, input tokens.');
        tokens = input + output;
        if (!Number.isSafeInteger(tokens)) throw new Error('Token count exceeds supported range.');
        if (e.rates != null) {
          tokenCost = ((input - cached) * amount(e.rates.input_per_million, 'Input rate') + cached * amount(e.rates.cached_per_million, 'Cached rate') + output * amount(e.rates.output_per_million, 'Output rate')) / 1e6;
        }
      }
      if (e.kind === 'tool' && e.usage != null) throw new Error('Tool tokens must be recorded as a separate model event, not duplicated on a tool event.');
      const providerCost = e.provider_cost_usd == null ? null : amount(e.provider_cost_usd, 'Provider cost');
      const cost = providerCost == null ? tokenCost : providerCost;
      return {...e, input, cached, output, tokens, cost, costSource: providerCost != null ? 'Provider-reported' : tokenCost != null ? 'Rate estimate' : 'Unknown'};
    });
    function sum(list) {
      return {tokens: list.reduce((n,e)=>n+(e.tokens ?? 0),0), cost: list.reduce((n,e)=>n+(e.cost ?? 0),0), unknownTokens: list.filter(e=>e.kind==='model' && e.tokens==null).length, unknownCost: list.filter(e=>e.cost==null).length, calls:list.length};
    }
    const total = sum(rows);
    return {rows, total, payment:{mode:data.payment.mode,fixed,paid}, requests:data.requests.map(r=>({...r,...sum(rows.filter(e=>e.request_id===r.id))})), groups:activities.map(activity=>({activity,...sum(rows.filter(e=>e.activity===activity))})).filter(g=>g.calls)};
  }
  const api = {calculate, activities};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Receipt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
