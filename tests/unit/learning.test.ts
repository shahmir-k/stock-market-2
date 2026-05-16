// Learning Center content + helpers. Verifies that all 30 PRD §28 terms
// exist, are categorized, are well-formed, and don't reference unknown
// related-term slugs.

import { describe, expect, it } from 'vitest';

import { LEARNING_TERMS } from '@/content/learningTerms';
import {
  LEARNING_CATEGORIES_META,
  getRelatedTerms,
  getTermBySlug,
  getTermsByCategory,
  searchTerms,
} from '@/lib/learning';

describe('LEARNING_TERMS content', () => {
  it('U-LRN-007: has all 30 terms required by PRD §28', () => {
    expect(LEARNING_TERMS.length).toBe(30);
  });

  it('every term has non-empty body fields', () => {
    for (const term of LEARNING_TERMS) {
      expect(term.slug, 'slug').toBeTruthy();
      expect(term.title, `${term.slug} title`).toBeTruthy();
      expect(term.category, `${term.slug} category`).toBeTruthy();
      expect(term.shortDefinition, `${term.slug} shortDefinition`).toBeTruthy();
      expect(term.simpleDefinition, `${term.slug} simpleDefinition`).toBeTruthy();
      expect(term.inSimulator, `${term.slug} inSimulator`).toBeTruthy();
      expect(term.whyItMatters, `${term.slug} whyItMatters`).toBeTruthy();
      expect(term.example, `${term.slug} example`).toBeTruthy();
    }
  });

  it('U-LRN-008: no relatedSlugs reference unknown slugs', () => {
    const allSlugs = new Set(LEARNING_TERMS.map((t) => t.slug));
    for (const term of LEARNING_TERMS) {
      for (const related of term.relatedSlugs ?? []) {
        expect(
          allSlugs.has(related),
          `${term.slug} references unknown related slug "${related}"`,
        ).toBe(true);
      }
    }
  });

  it('all slugs are unique', () => {
    const slugs = LEARNING_TERMS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has all 6 categories from PRD §9.7', () => {
    expect(LEARNING_CATEGORIES_META.length).toBe(6);
    for (const cat of LEARNING_CATEGORIES_META) {
      // Every category has at least one term
      const inCat = LEARNING_TERMS.filter((t) => t.category === cat.category);
      expect(inCat.length, `${cat.label} has at least one term`).toBeGreaterThan(0);
    }
  });
});

describe('getTermBySlug', () => {
  it('U-LRN-001: returns the term for a known slug', () => {
    const term = getTermBySlug('average-cost');
    expect(term).not.toBeNull();
    expect(term?.title).toMatch(/average cost/i);
  });

  it('U-LRN-002: returns null for an unknown slug', () => {
    expect(getTermBySlug('not-a-real-term')).toBeNull();
  });
});

describe('getTermsByCategory', () => {
  it('U-LRN-003: returns a non-empty array for each defined category', () => {
    for (const cat of LEARNING_CATEGORIES_META) {
      const terms = getTermsByCategory(cat.category);
      expect(terms.length).toBeGreaterThan(0);
      expect(terms.every((t) => t.category === cat.category)).toBe(true);
    }
  });
});

describe('searchTerms', () => {
  it('U-LRN-004: matches by title (case-insensitive)', () => {
    const r = searchTerms('average');
    expect(r.some((t) => t.title.toLowerCase().includes('average'))).toBe(true);
  });

  it('U-LRN-005: empty query returns all terms', () => {
    expect(searchTerms('').length).toBe(LEARNING_TERMS.length);
  });

  it('returns empty array for a query that matches nothing', () => {
    expect(searchTerms('zzz-no-match-zzz')).toEqual([]);
  });
});

describe('getRelatedTerms', () => {
  it('U-LRN-006: resolves relatedSlugs to full LearningTerm records', () => {
    // Pick a term that has relatedSlugs
    const termWithRelated = LEARNING_TERMS.find(
      (t) => (t.relatedSlugs ?? []).length > 0,
    );
    expect(termWithRelated, 'fixture needs a term with relatedSlugs').toBeDefined();
    const related = getRelatedTerms(termWithRelated!);
    expect(related.length).toBe(termWithRelated!.relatedSlugs!.length);
    for (const r of related) {
      expect(r.slug).toBeTruthy();
      expect(r.title).toBeTruthy();
    }
  });
});
