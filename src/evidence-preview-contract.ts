export interface EvidenceSource {
  id: string;
  href: string;
  available: boolean;
  title: string | null;
  publisher: string;
  summary: string;
  original_url: string | null;
  review_status: string;
  reviewed_at: string;
  review_scope: string;
  review_locator: string;
  access: string;
  rights: { label: string; value: string }[];
  limitations: string[];
}
export interface EvidencePreview {
  owner_id: string;
  owner_href: string;
  corpus_version: string;
  claim: string;
  classification: string;
  qualification: string;
  locator: string;
  locator_scope: "finding";
  sources: EvidenceSource[];
}
