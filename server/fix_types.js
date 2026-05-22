const fs = require('fs');

const parserFile = '/Users/macbookpro/.gemini/antigravity-ide/scratch/valoracion-puestos-msc/server/src/services/interviewParser.ts';
let parserCode = fs.readFileSync(parserFile, 'utf8');
parserCode = parserCode.replace("import { InterviewContext } from './aiAgentService';", "export interface InterviewContext {\n  entrevistado: string;\n  puesto: string;\n  fecha_entrevista: string;\n  factores: Array<any>;\n  alertas: string[];\n}");
fs.writeFileSync(parserFile, parserCode);

const agentFile = '/Users/macbookpro/.gemini/antigravity-ide/scratch/valoracion-puestos-msc/server/src/services/aiAgentService.ts';
let agentCode = fs.readFileSync(agentFile, 'utf8');
// remove the any implicit typing error
agentCode = agentCode.replace("export { POINTS_MAP, CONTINUOUS_MAX, FactorKeywordDetail } from './contextualAnalyzer';", "export { POINTS_MAP, CONTINUOUS_MAX, FactorKeywordDetail } from './contextualAnalyzer';\nexport type { InterviewContext };");
fs.writeFileSync(agentFile, agentCode);
