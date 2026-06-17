import { create } from 'zustand';
import { FAQ, TicketType } from '../types';
import { storage } from '../services/storage';

interface FAQState {
  faqs: FAQ[];
  loading: boolean;
  fetchFAQs: (filters?: { type?: TicketType; keyword?: string }) => void;
  getFAQ: (id: string) => FAQ | undefined;
  getRecommendedFAQs: (title: string, description: string) => FAQ[];
  likeFAQ: (id: string) => number | undefined;
  incrementViewCount: (id: string) => void;
}

export const useFAQStore = create<FAQState>((set, get) => ({
  faqs: [],
  loading: false,

  fetchFAQs: (filters) => {
    set({ loading: true });
    let faqs = storage.getFAQs();

    if (filters) {
      if (filters.type) {
        faqs = faqs.filter(f => f.type === filters.type);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        faqs = faqs.filter(f =>
          f.title.toLowerCase().includes(keyword) ||
          f.content.toLowerCase().includes(keyword) ||
          f.tags.some(tag => tag.toLowerCase().includes(keyword))
        );
      }
    }

    set({ faqs, loading: false });
  },

  getFAQ: (id) => {
    const faq = storage.getFAQs().find(f => f.id === id);
    if (faq) {
      get().incrementViewCount(id);
    }
    return faq;
  },

  getRecommendedFAQs: (title, description) => {
    const faqs = storage.getFAQs();
    const keywords = [...title.split(' '), ...description.split(' ')];
    
    const scored = faqs.map(faq => {
      let score = 0;
      const text = `${faq.title} ${faq.content} ${faq.tags.join(' ')}`.toLowerCase();
      keywords.forEach(keyword => {
        if (keyword.length > 2 && text.includes(keyword.toLowerCase())) {
          score++;
        }
      });
      return { faq, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.faq);
  },

  likeFAQ: (id) => {
    const faqs = storage.getFAQs();
    const faq = faqs.find(f => f.id === id);
    if (faq) {
      const updated = { ...faq, likeCount: faq.likeCount + 1, updatedAt: new Date().toISOString() };
      storage.updateFAQ(updated);
      get().fetchFAQs();
      return updated.likeCount;
    }
    return undefined;
  },

  incrementViewCount: (id) => {
    const faqs = storage.getFAQs();
    const faq = faqs.find(f => f.id === id);
    if (faq) {
      const updated = { ...faq, viewCount: faq.viewCount + 1 };
      storage.updateFAQ(updated);
    }
  },
}));
