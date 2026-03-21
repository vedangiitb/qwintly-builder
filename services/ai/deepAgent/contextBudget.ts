import { CollectedContext } from "../../../types/context.types.js";
import { CodeIndex } from "../../../types/index/codeIndex.js";
import { PlanTask } from "../../../types/updatePlan.types.js";
import { safeStringify, truncateString } from "./serialization.js";

export type PromptBudgets = {
  contextChars: number;
  planChars: number;
  codeIndexChars: number;
  maxStringChars: number;
  maxArrayItems: number;
};

const DEFAULT_BUDGETS: PromptBudgets = {
  contextChars: 4000,
  planChars: 2000,
  codeIndexChars: 8000,
  maxStringChars: 300,
  maxArrayItems: 50,
};

const budgetValue = (value: unknown, budgets: PromptBudgets): unknown => {
  if (typeof value === "string") return truncateString(value, budgets.maxStringChars);
  if (Array.isArray(value)) {
    const limited = value.slice(0, budgets.maxArrayItems).map((item) => budgetValue(item, budgets));
    if (value.length > budgets.maxArrayItems) {
      limited.push(`...(truncated ${value.length - budgets.maxArrayItems} items)`);
    }
    return limited;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      out[key] = budgetValue(val, budgets);
    }
    return out;
  }
  return value;
};

const aggressiveBudgetValue = (value: unknown): unknown => {
  if (typeof value === "string") return truncateString(value, 120);
  if (Array.isArray(value)) {
    const limited = value.slice(0, 20).map(aggressiveBudgetValue);
    if (value.length > 20) {
      limited.push(`...(truncated ${value.length - 20} items)`);
    }
    return limited;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      out[key] = aggressiveBudgetValue(val);
    }
    return out;
  }
  return value;
};

const budgetToCharLimit = <T>(
  value: T,
  maxChars: number,
  budgets: PromptBudgets,
): T => {
  let budgeted = budgetValue(value, budgets) as T;
  if (safeStringify(budgeted).length <= maxChars) return budgeted;

  budgeted = aggressiveBudgetValue(value) as T;
  if (safeStringify(budgeted).length <= maxChars) return budgeted;

  if (Array.isArray(value)) return [] as T;
  if (value && typeof value === "object") return {} as T;
  if (typeof value === "string") return truncateString(value, maxChars) as T;
  return budgeted;
};

const extractKeywords = (planTasks: PlanTask[]) => {
  const keywords = new Set<string>();
  const collect = (text: string) => {
    const matches = text.toLowerCase().match(/[a-z0-9_./-]{3,}/g);
    if (!matches) return;
    for (const match of matches) keywords.add(match);
  };

  for (const task of planTasks) {
    if (task.description) collect(task.description);
    if (task.intent) collect(task.intent);
    if (task.task_type) collect(task.task_type);
  }

  return Array.from(keywords);
};

const filterEntriesByKeywords = (
  entries: CodeIndex["projectIndex"]["folderTree"],
  planTasks: PlanTask[],
) => {
  const keywords = extractKeywords(planTasks);
  if (keywords.length === 0) return null;

  const keywordList = keywords.slice(0, 50);
  const matches: typeof entries = [];

  for (const entry of entries) {
    const haystack = `${entry.path ?? ""} ${entry.name ?? ""} ${
      entry.summary ?? ""
    }`.toLowerCase();
    for (const keyword of keywordList) {
      if (haystack.includes(keyword)) {
        matches.push(entry);
        break;
      }
    }
  }

  return matches.length >= 8 ? matches : null;
};

const budgetCodeIndex = (
  index: CodeIndex,
  budgets: PromptBudgets,
  planTasks: PlanTask[],
  dropLegend: boolean,
): CodeIndex => {
  const base = budgetValue(index, budgets) as CodeIndex;
  const baseEntries = base.projectIndex?.folderTree ?? [];
  const filteredEntries = filterEntriesByKeywords(baseEntries, planTasks);
  const entries = filteredEntries ?? baseEntries;

  const build = (limit: number, includeLegend: boolean): CodeIndex => {
    const trimmedEntries = entries.slice(0, limit).map((entry) => ({
      name: entry.name,
      path: entry.path,
      ext: entry.ext,
      kind: entry.kind,
      isDir: entry.isDir,
      depth: entry.depth,
      route: entry.route,
      summary: entry.summary ? truncateString(entry.summary, 200) : entry.summary,
      tags: entry.tags,
    }));

    return {
      projectIndex: {
        folderTree: trimmedEntries,
        legend: includeLegend
          ? base.projectIndex.legend
          : ({} as CodeIndex["projectIndex"]["legend"]),
      },
      projectConfig: base.projectConfig,
      projectConventions: base.projectConventions,
    };
  };

  const candidates: Array<[number, boolean]> = dropLegend
    ? [
        [200, false],
        [100, false],
        [50, false],
        [20, false],
        [0, false],
      ]
    : [
        [200, true],
        [100, true],
        [50, true],
        [50, false],
        [20, false],
        [0, false],
      ];

  for (const [limit, includeLegend] of candidates) {
    const candidate = build(limit, includeLegend);
    if (safeStringify(candidate).length <= budgets.codeIndexChars) return candidate;
  }

  return build(0, false);
};

export const buildBudgetedPromptInputs = (
  collectedContext: CollectedContext,
  planTasks: PlanTask[],
  codeIndex: CodeIndex,
  overrides: Partial<PromptBudgets> = {},
) => {
  const budgets = { ...DEFAULT_BUDGETS, ...overrides };
  const shouldReduceIndexBudget = planTasks.length <= 2;
  const adjustedBudgets = shouldReduceIndexBudget
    ? {
        ...budgets,
        codeIndexChars: Math.max(1, Math.floor(budgets.codeIndexChars * 0.7)),
      }
    : budgets;
  return {
    context: budgetToCharLimit(collectedContext, adjustedBudgets.contextChars, adjustedBudgets),
    planTasks: budgetToCharLimit(planTasks, adjustedBudgets.planChars, adjustedBudgets),
    codeIndex: budgetCodeIndex(codeIndex, adjustedBudgets, planTasks, shouldReduceIndexBudget),
  };
};
