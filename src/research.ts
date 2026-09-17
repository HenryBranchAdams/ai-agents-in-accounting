import questionData from '../data/coverage/research-questions.json';
import profileData from '../data/coverage/subsector-profiles.json';
import screeningData from '../data/coverage/subsector-screening.json';
import leafData from '../data/coverage/industry-exception-reviews.json';
import criteriaData from '../data/coverage/research-criteria.json';
import relationshipData from '../data/coverage/classification-relationships.json';
import sourceReviews from '../data/reviews/source-reviews.json';
import editorialReviews from '../data/reviews/editorial-reviews.json';

export const researchQuestions=questionData.questions;
export const researchCriteria=criteriaData;
export const researchProfiles=profileData.profiles;
export const researchScreening=screeningData;
export const researchLeaves=leafData.reviews;
export const classificationRelationships=relationshipData;
const cellsByKey=new Map(screeningData.cells.map(c=>[`${c.industry_code}:${c.family_id}`,c]));
export const researchCell=(industry:string,family:string)=>cellsByKey.get(`${industry}:${family}`)||null;
const namedPartialQuestions=researchQuestions.filter(q=>q.assessment_status==='partial').length;
const namedEvidenceGaps=researchQuestions.filter(q=>q.assessment_status==='evidence-gap').length;
export const researchSummary={
  ...criteriaData.population,
  named_research_questions:researchQuestions.length,
  named_partial_questions:namedPartialQuestions,
  named_evidence_gaps:namedEvidenceGaps,
  subsector_profiles:researchProfiles.length,
  applicability_counts:Object.fromEntries(Object.keys(criteriaData.applicability).map(status=>[status,screeningData.cells.filter(c=>c.applicability===status).length])),
  leaf_outcomes:leafData.counts,
  inherited_source_reviews:sourceReviews.reviews.length,
  inherited_editorial_reviews:editorialReviews.reviews.length,
  source_access_levels:Object.fromEntries(['substantive-excerpt','abstract-or-landing','attempted-unresolved'].map(level=>[level,sourceReviews.reviews.filter(r=>r.review_level===level).length])),
  whole_scope_sufficiency:criteriaData.sufficiency,
};
export function researchView(industry='',family='') {
  const leaf=researchLeaves.find(l=>l.industry_code===industry)||null;
  const profile=researchProfiles.find(p=>p.code===(leaf?.subsector_code||industry))||null;
  const cells=profile?screeningData.cells.filter(c=>c.industry_code===profile.code&&(!family||c.family_id===family)):[];
  const namedIds=new Set(cells.flatMap(c=>c.named_question_ids));
  const questions=researchQuestions.filter(q=>(!family||q.family_ids.includes(family))&&(!profile||namedIds.has(q.id)));
  return {schema_version:'1.0.0',question_set_version:questionData.question_set_version,screening_version:screeningData.screening_version,summary:researchSummary,profile,
    screening_scope:leaf?'Parent subsector context only; no automatic leaf applicability or accounting adequacy.':'Exact subsector profile; entity-specific facts still required.',screening:cells,
    leaf_reviews:leaf?[leaf]:profile?researchLeaves.filter(l=>l.subsector_code===profile.code):[],
    named_questions:questions,criteria:criteriaData,
    broader_family_questions_note:'The selected named questions do not exhaust any family. All conditional screening questions and specific leaf exceptions remain in the declared worklist.',
    downloads:{questions:'/downloads/research-questions.json',screening:'/downloads/subsector-screening.json',profiles:'/downloads/subsector-profiles.json',leaves:'/downloads/industry-exception-reviews.json',criteria:'/downloads/research-criteria.json',relationships:'/downloads/classification-relationships.json'},
  };
}
