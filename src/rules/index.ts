import { vagueInstruction } from './vague-instruction.js';
import { missingOutputFormat } from './missing-output-format.js';
import { missingTaskDefinition } from './missing-task-definition.js';
import { contradictoryDirectives } from './contradictory-directives.js';
import { undelimitedVariable } from './undelimited-variable.js';
import { promptInjectionRisk } from './prompt-injection-risk.js';
import { excessiveLength } from './excessive-length.js';
import { missingExamples } from './missing-examples.js';
import { undefinedVariable } from './undefined-variable.js';
import { repeatedInstructions } from './repeated-instructions.js';
import type { RuleDefinition } from '../types.js';

export const ALL_RULES: RuleDefinition[] = [
  vagueInstruction,
  missingOutputFormat,
  missingTaskDefinition,
  contradictoryDirectives,
  undelimitedVariable,
  promptInjectionRisk,
  excessiveLength,
  missingExamples,
  undefinedVariable,
  repeatedInstructions,
];
