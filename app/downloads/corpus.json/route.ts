import { agentResources, publicResponse, rightsNotice } from "../../agent-interface";
import { authorityDecisionGuide, authorityLevels, corpusReviewedAt, corpusVersion, domainSchemaVersion } from "../../domain-model";
import { controlPatterns, sensitiveActions } from "../../governance-data";
import { ecosystemLayers } from "../../ecosystem-data";
import { domainRightsNotice, normalizeDomainRecord } from "../../domain-interface";
import { glossary, templates } from "../../reference-data";
import { processFamilies, workflowRecords } from "../../workflows-data";
import { benchmark, benchmarkCases, packs, platformRelease, releaseNotes } from "../../platform-data";
import { educationalContentContract } from "../../content-contract";
import { accountingAgentControlModel } from "../../control-model";
import { accountingAgentsCoverageMap } from "../../coverage-map";
import { accountingAgentsStartHere } from "../../start-here";
import { accountingAgentReviewerGuide } from "../../reviewer-guide";
import { accountingAgentsCoreCourse, coreCourseReadings } from "../../core-course";
import { bankReconciliationTutorial } from "../../bank-reconciliation-tutorial";

export async function GET(request: Request) {
  const body = JSON.stringify({
    schema_version: domainSchemaVersion,
    corpus_version: corpusVersion,
    corpus_reviewed_at: corpusReviewedAt,
    title: "Accounting Agents canonical public corpus",
    scope_note: "Complete educational coverage does not grant execution authority. Human-owned approvals, legal attestations, fiduciary authority, and certifications remain human-owned.",
    rights_notice: `${domainRightsNotice} ${rightsNotice}`,
    counts: {
      process_families: processFamilies.length,
      workflows: workflowRecords.length,
      workflow_briefs: workflowRecords.filter((workflow) => workflow.brief).length,
      authority_levels: authorityLevels.length,
      authority_decision_guides: 1,
      reviewer_guides: 1,
      reviewer_packet_fields: accountingAgentReviewerGuide.minimum_reviewer_packet.length,
      reviewer_calibration_cases: accountingAgentReviewerGuide.calibration_exercise.length,
      reviewer_program_states: accountingAgentReviewerGuide.review_program_scaffold.review_states.length,
      sensitive_actions: sensitiveActions.length,
      control_patterns: controlPatterns.length,
      templates: templates.length,
      glossary_terms: glossary.length,
      source_records: agentResources.length,
      source_relationship_profiles: agentResources.filter((resource) => resource.relationship_profile).length,
      workflow_packs: packs.length,
      benchmark_cases: benchmarkCases.length,
      ecosystem_layers: ecosystemLayers.length,
      control_model_elements: accountingAgentControlModel.elements.length,
      control_model_scenarios: accountingAgentControlModel.scenarios.length,
      coverage_states: accountingAgentsCoverageMap.state_definitions.length,
      coverage_family_boundaries: accountingAgentsCoverageMap.family_coverage.length,
      orientation_lessons: 1,
      orientation_questions: accountingAgentsStartHere.knowledge_check.length,
      orientation_audience_paths: accountingAgentsStartHere.audience_paths.length,
      core_courses: 1,
      core_course_modules: accountingAgentsCoreCourse.modules.length,
      core_course_readings: coreCourseReadings.length,
      core_course_audience_lenses: accountingAgentsCoreCourse.audience_lenses.length,
      core_course_questions: accountingAgentsCoreCourse.knowledge_check.length,
      tutorials: 1,
      tutorial_steps: bankReconciliationTutorial.guided_steps.length,
      tutorial_evidence_records: bankReconciliationTutorial.evidence_register.length,
      tutorial_questions: bankReconciliationTutorial.knowledge_check.length,
    },
    process_families: processFamilies.map((record) => normalizeDomainRecord(record, "process-family")),
    workflows: workflowRecords.map((record) => normalizeDomainRecord(record, "workflow")),
    authority_levels: authorityLevels.map((record) => normalizeDomainRecord(record, "authority-level")),
    authority_decision_guide: authorityDecisionGuide,
    reviewer_guide: accountingAgentReviewerGuide,
    sensitive_actions: sensitiveActions.map((record) => normalizeDomainRecord(record, "sensitive-action")),
    control_patterns: controlPatterns.map((record) => normalizeDomainRecord(record, "control-pattern")),
    templates: templates.map((record) => normalizeDomainRecord(record, "template")),
    glossary: glossary.map((record) => normalizeDomainRecord(record, "glossary")),
    sources: agentResources,
    platform_release: platformRelease,
    workflow_packs: packs,
    benchmark,
    ecosystem_layers: ecosystemLayers,
    release_notes: releaseNotes,
    content_contract: educationalContentContract,
    control_model: accountingAgentControlModel,
    coverage_map: accountingAgentsCoverageMap,
    start_here: accountingAgentsStartHere,
    core_course: accountingAgentsCoreCourse,
    bank_reconciliation_tutorial: bankReconciliationTutorial,
  }, null, 2);

  return publicResponse(request, body, "application/json; charset=utf-8", {
    headers: {
      "Content-Disposition": "inline; filename=accounting-agents-corpus.json",
      "Content-Language": "en",
    },
  });
}

export const HEAD = GET;
