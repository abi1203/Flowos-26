/**
 * Rule Engine - Evaluates conditions with full operator support
 * Supports: ==, !=, <, >, <=, >=, &&, ||, contains(), startsWith(), endsWith()
 */

/**
 * Pre-process condition string to replace custom string functions
 * with JS equivalents before evaluation.
 */
const preprocessCondition = (condition) => {
  if (!condition) return condition;

  // contains(field, "value")  →  String(field).includes("value")
  let processed = condition.replace(
    /contains\s*\(\s*([^,]+?)\s*,\s*(['"][^'"]*['"])\s*\)/g,
    'String($1).includes($2)'
  );

  // startsWith(field, "value")  →  String(field).startsWith("value")
  processed = processed.replace(
    /startsWith\s*\(\s*([^,]+?)\s*,\s*(['"][^'"]*['"])\s*\)/g,
    'String($1).startsWith($2)'
  );

  // endsWith(field, "value")  →  String(field).endsWith("value")
  processed = processed.replace(
    /endsWith\s*\(\s*([^,]+?)\s*,\s*(['"][^'"]*['"])\s*\)/g,
    'String($1).endsWith($2)'
  );

  return processed;
};

/**
 * Safely evaluate a condition expression against input context
 */
const evaluateCondition = (condition, context) => {
  if (!condition || condition.trim() === '' || condition.trim().toUpperCase() === 'DEFAULT') {
    return true;
  }

  try {
    const processed = preprocessCondition(condition);
    const keys = Object.keys(context);
    const values = Object.values(context);

    const fn = new Function(...keys, `
      'use strict';
      try {
        return Boolean(${processed});
      } catch(e) {
        return false;
      }
    `);

    return fn(...values);
  } catch (error) {
    console.error(`Rule evaluation error for condition "${condition}":`, error.message);
    return false;
  }
};

/**
 * Evaluate all rules and return results for ALL rules (for logging),
 * plus the first matching rule.
 * Returns: { matchedRule, evaluatedRules[] }
 */
const evaluateRules = (rules, context) => {
  if (!rules || rules.length === 0) return { matchedRule: null, evaluatedRules: [] };

  const sorted = [...rules].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return 1;
    if (!a.isDefault && b.isDefault) return -1;
    return a.priority - b.priority;
  });

  const evaluatedRules = [];
  let matchedRule = null;

  for (const rule of sorted) {
    const result = evaluateCondition(rule.condition, context);
    evaluatedRules.push({
      ruleId:    rule._id,
      ruleName:  rule.name,
      condition: rule.condition,
      result,
    });
    if (result && !matchedRule) {
      matchedRule = rule;
      // Don't break — evaluate ALL rules for the log
    }
  }

  return { matchedRule, evaluatedRules };
};

module.exports = { evaluateCondition, evaluateRules, preprocessCondition };
