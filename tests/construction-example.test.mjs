import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const records = JSON.parse(fs.readFileSync('data/corpus/example.json', 'utf8'));
const data = records.find(r => r.id === 'example-construction-contract-ledger').data;
const close = id => data.examples.find(e => e.id === id);

test('construction worked closes reproduce the ledger, contract balances and cash', () => {
  const balances = {};
  const seen = new Set();
  for (const period of ['opening', '2026-07', '2026-08']) {
    for (const line of data.journals.filter(j => j.period === period)) {
      assert.ok(!seen.has(line.id), `duplicate journal ${line.id}`); seen.add(line.id);
      assert.ok(line.evidence_id);
      balances[line.debit] = (balances[line.debit] || 0) + line.amount;
      balances[line.credit] = (balances[line.credit] || 0) - line.amount;
    }
    assert.equal(Object.values(balances).reduce((a,b) => a+b, 0), 0);
    if (period === 'opening') continue;
    const result = close(period === '2026-07' ? 'construction-close-one' : 'construction-close-two').result;
    for (const account of ['cash','ar','contract_asset']) assert.equal(balances[account] || 0, result[account]);
    for (const account of ['ap','payroll_payable','contract_liability']) assert.equal(-balances[account] || 0, result[account]);
    assert.equal(-balances.revenue, result.cumulative_revenue);
    assert.equal(balances.job_cost, result.cumulative_cost);
    assert.equal(-balances.revenue - balances.job_cost, result.cumulative_profit);
    assert.equal(result.assets, result.cash + result.ar + result.contract_asset);
    assert.equal(result.liabilities, result.ap + result.payroll_payable + result.contract_liability);
    assert.equal(result.assets, result.liabilities + result.capital_and_profit);
  }
});

test('construction exceptions retain their numerical and scope boundaries', () => {
  const uninstalled = close('construction-uninstalled');
  const i = uninstalled.input, r = uninstalled.result;
  assert.equal(r.progress, i.other_cost_incurred / i.other_expected_cost);
  assert.equal(r.revenue, i.equipment_cost + r.progress * (i.price - i.equipment_cost));
  assert.equal(r.profit, r.revenue - r.cost);
  assert.equal(r.overstatement, r.naive_revenue - r.revenue);
  assert.ok(uninstalled.conditions.some(c => c.includes('third party')));
  const loss = close('construction-loss');
  assert.equal(loss.result.expected_total_loss, loss.input.estimated_total_cost - loss.input.price);
  assert.equal(loss.result.normal_loss, loss.input.cost_incurred - loss.result.revenue);
  assert.equal(loss.result.additional_provision, loss.result.expected_total_loss - loss.result.normal_loss);
  assert.ok(loss.conditions.some(c => c.includes('605-35')));
  const second = close('construction-close-two');
  assert.equal(second.result.current_revenue, second.result.cumulative_revenue - second.input.prior_revenue);
  assert.equal(close('construction-reopened').result.executed_entries, 0);
});
