import { AIEvaluationResult } from './server/src/services/contextualAnalyzer';
import { getFactorPoints } from './server/src/config/factorTables';

function testValidate() {
  const suggestion = {
    dificultad: 4,
    dificultad_just: "Test justification long enough",
    dificultad_cita_documental: "doc quote",
    dificultad_cita_entrevista: "interview quote",
    dificultad_fuente: "mixta",
    dificultad_contradiccion: false
  };

  const baseline = {
    dificultad: 3
  };

  const factor = 'dificultad';
  const citaDocumental = suggestion[`${factor}_cita_documental`] || '';
  const citaEntrevista = suggestion[`${factor}_cita_entrevista`] || '';
  
  const baselineFactorGrade = baseline ? Number((baseline as any)[factor]) : 1;
  const isGradeRaised = Number(suggestion[factor]) > baselineFactorGrade;
  const hasExplicitFlag = (suggestion[`${factor}_contradiccion`] === true || suggestion[`${factor}_contradiccion`] === 'true');
  
  const contradiccion = !!(citaEntrevista && citaDocumental && (isGradeRaised || hasExplicitFlag));

  console.log({
    baselineFactorGrade,
    isGradeRaised,
    hasExplicitFlag,
    citaEntrevista,
    citaDocumental,
    contradiccion
  });
}

testValidate();
