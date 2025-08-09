# Financial Calculation Tests

This test suite ensures the accuracy and consistency of financial calculations in the FinanceSim application.

## Running Tests

```bash
# Run tests once
npm run test:run

# Run tests in watch mode (re-runs on file changes)
npm test

# Run tests with UI
npm run test:ui
```

## Test Coverage

### Annual Expenses Calculation
- ✅ State average rent and groceries
- ✅ Custom rent and groceries
- ✅ Missing state data handling
- ✅ Custom values override state averages

### Tax Calculation
- ✅ Federal tax brackets (2025)
- ✅ State tax variations (CA vs TX)
- ✅ FICA taxes (Social Security + Medicare)
- ✅ 401k pre-tax contributions
- ✅ High income scenarios
- ✅ Social Security wage base cap

### Net Worth Calculation
- ✅ Multiple account types
- ✅ Investment accounts (traditional + Roth IRA)
- ✅ Debt subtraction
- ✅ Negative net worth scenarios

### Monthly Budget Calculation
- ✅ Income after taxes and deductions
- ✅ Monthly expense breakdown
- ✅ Investment contributions
- ✅ Net cash flow calculation

### Regression Tests
- ✅ Dashboard vs Expenses page consistency
- ✅ Custom rent handling
- ✅ Custom grocery handling

## Test Data

The tests use realistic scenarios:

**California Resident (High Income)**
- Salary: $100,000
- State: California (high rent, state tax)
- 401k: 10% traditional + 5% Roth
- IRA: $6,000 traditional
- Assets: $90,000 total
- Debt: $5,000

**Texas Resident (Moderate Income)**  
- Salary: $80,000
- State: Texas (no state tax)
- Custom rent: $1,200/month
- Custom groceries: $100/week
- IRA: $6,500 Roth
- Assets: $33,000 total
- Debt: $15,000

## Adding New Tests

When adding new financial features:

1. **Add calculation function to `src/utils/calculationUtils.ts`**
2. **Create test cases in `src/test/calculations.test.ts`**
3. **Include edge cases and regression tests**
4. **Verify tests pass before merging**

### Example Test Structure

```typescript
describe('New Feature Calculation', () => {
  it('should handle normal case', () => {
    const result = newCalculation(normalData);
    expect(result).toBe(expectedValue);
  });

  it('should handle edge case', () => {
    const result = newCalculation(edgeCaseData);
    expect(result).toBe(expectedEdgeValue);
  });
});
```

## Preventing Regressions

These tests specifically prevent:

1. **Dashboard vs Expenses page discrepancies**
2. **Custom value override failures**
3. **Tax calculation errors**
4. **Net worth calculation mistakes**
5. **State data handling issues**

Run tests before any calculation changes:

```bash
npm run test:run
```

If tests fail, fix the code, don't change the tests (unless requirements changed).

## Test Philosophy

- **Each calculation has multiple test cases**
- **Edge cases are explicitly tested**
- **Real-world scenarios are used**
- **Regression tests prevent known issues**
- **Tests run fast (under 10ms each)**

This ensures calculation accuracy and prevents the "oops I broke the math" scenario!
