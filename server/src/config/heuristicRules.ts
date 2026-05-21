export const HEURISTIC_RULES = {
  verbs: {
    strategic: ['dirigir', 'planificar', 'diseñar', 'establecer', 'definir'],
    tactical: ['coordinar', 'analizar', 'evaluar', 'supervisar', 'gestionar'],
    operative: ['ejecutar', 'tramitar', 'registrar', 'operar', 'apoyar'],
  },
  areaWeights: {
    direccion: 1.2,
    tecnica: 1.0,
    administrativa: 0.9,
    operativa: 0.8,
  },
  uncertaintyKeywords: [
    'probablemente',
    'podría',
    'parece ser',
    'posiblemente',
    'tal vez',
    'estimo que',
    'aproximadamente'
  ]
};
