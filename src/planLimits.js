// src/planLimits.js
// SINGLE SOURCE OF TRUTH for all Free vs Golden plan limits.
// Change limits HERE ONLY. Never hardcode these numbers anywhere else.

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    nameMn: 'Үнэгүй',
    priceMnt: 0,
    maxDocuments: 5,
    maxPagesPerDoc: 5,
    templates: ['blank', 'letter'],
    pdfExport: false,
    pngExport: true,
    pngRequiresAd: true,
    documentHeader: false,
    fullAppearance: false,
    watermark: true,
    maxAdUnlocksPerDay: 5,
  },
  golden: {
    id: 'golden',
    name: 'Golden',
    nameMn: 'Алтан',
    priceMnt: 9900,
    maxDocuments: 100,
    maxPagesPerDoc: 50,
    templates: ['blank', 'letter', 'diary', 'essay', 'poem'],
    pdfExport: true,
    pngExport: true,
    pngRequiresAd: false,
    documentHeader: true,
    fullAppearance: true,
    watermark: false,
    maxAdUnlocksPerDay: 0,
  },
};

export const DEFAULT_PLAN = 'free';

export function getPlan(planId) {
  return PLANS[planId] || PLANS[DEFAULT_PLAN];
}

export function isTemplateAllowed(planId, templateId) {
  return getPlan(planId).templates.includes(templateId);
}

export function canAddDocument(planId, currentCount) {
  return currentCount < getPlan(planId).maxDocuments;
}

export function canAddPage(planId, currentPageCount) {
  return currentPageCount < getPlan(planId).maxPagesPerDoc;
}

export const UPGRADE_MESSAGE_MN =
  'Та Үнэгүй багцын хязгаарт хүрлээ. Алтан багц руу шилжиж 100 баримт хадгалах, бүх загвар, PDF экспорт, баримтын толгой болон зар сурталчилгаагүй орчныг нээнэ үү.';
export const UPGRADE_MESSAGE_EN =
  'You reached the Free limit. Upgrade to Golden for 100 documents, all templates, PDF export, document headers, and an ad-free experience.';
