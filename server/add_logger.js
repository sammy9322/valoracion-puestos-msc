const fs = require('fs');
const file = '/Users/macbookpro/.gemini/antigravity-ide/scratch/valoracion-puestos-msc/server/src/services/aiAgentService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "console.error('[AI Service] Failed to parse LLM JSON:', e);",
  "console.error('[AI Service] Failed to parse LLM JSON:', e);\n      const fs = require('fs'); fs.writeFileSync('llm_error_log.txt', 'Error: ' + e.message + '\\n\\nRAW JSON:\\n' + raw);"
);

code = code.replace(
  "console.warn('[AI Service] Error en LLM, cayendo a rule-based:', error.message);",
  "console.warn('[AI Service] Error en LLM, cayendo a rule-based:', error.message);\n            const fs = require('fs'); fs.writeFileSync('llm_crash_log.txt', 'Error en LLM:\\n' + error.message + '\\n\\nStack:\\n' + error.stack);"
);

fs.writeFileSync(file, code);
