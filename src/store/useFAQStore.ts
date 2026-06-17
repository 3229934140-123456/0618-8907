import { create } from 'zustand';
import { FAQ, TicketType } from '../types';
import { storage } from '../services/storage';

const SYNONYM_DICT: Record<string, string[]> = {
  '密码': ['密码', 'password', 'passwd', 'pwd', '登录', '登录', '认证', '解锁'],
  'vpn': ['vpn', '虚拟专用网络', '远程连接', '连不上', '连接超时'],
  '打印机': ['打印机', '打印', 'print', '缺纸', '卡纸', '无法打印'],
  '蓝屏': ['蓝屏', 'blue screen', '死机', '崩溃', '重启', '开不了机'],
  '网络': ['网络', 'wifi', 'Wi-Fi', '无线网络', '断网', '上不了网', '无法访问'],
  '邮件': ['邮件', 'email', 'outlook', '收发', '收不到', '发不出'],
  'office': ['office', '激活', 'word', 'excel', 'ppt', '安装'],
  '权限': ['权限', '访问', '申请', '开通', 'role', '角色'],
  '电脑': ['电脑', '计算机', 'pc', '主机', '台式机', '笔记本'],
  '系统': ['系统', 'system', 'windows', 'win', '操作系统'],
  '浏览器': ['浏览器', 'chrome', '谷歌', '崩溃', '闪退', '打不开'],
  '账号': ['账号', '帐户', '账号', '锁定', '禁用', '激活'],
};

const extractChineseKeywords = (text: string): string[] => {
  const keywords: string[] = [];
  
  const chinesePattern = /[\u4e00-\u9fa5]+/g;
  const matches = text.match(chinesePattern);
  if (matches) {
    keywords.push(...matches);
  }
  
  const englishPattern = /[a-zA-Z]+/g;
  const englishMatches = text.match(englishPattern);
  if (englishMatches) {
    keywords.push(...englishMatches.map(w => w.toLowerCase()));
  }
  
  const shortWords = text.split(/[\s，。；：、！？,.!?;:]+/).filter(w => w.length >= 2);
  keywords.push(...shortWords);
  
  for (const [key, synonyms] of Object.entries(SYNONYM_DICT)) {
    if (synonyms.some(syn => text.toLowerCase().includes(syn.toLowerCase()))) {
      keywords.push(key);
      keywords.push(...synonyms);
    }
  }
  
  return [...new Set(keywords)];
};

const calculateMatchScore = (faq: FAQ, keywords: string[]): number => {
  let score = 0;
  const faqText = `${faq.title} ${faq.content} ${faq.tags.join(' ')}`.toLowerCase();
  
  keywords.forEach(keyword => {
    const kw = keyword.toLowerCase();
    
    if (kw.length >= 2 && faqText.includes(kw)) {
      if (faq.title.toLowerCase().includes(kw)) {
        score += 3;
      }
      
      if (faq.tags.some(tag => tag.toLowerCase().includes(kw))) {
        score += 2;
      }
      
      if (faq.content.toLowerCase().includes(kw)) {
        score += 1;
      }
      
      for (const [key, synonyms] of Object.entries(SYNONYM_DICT)) {
        if (synonyms.some(s => s.toLowerCase() === kw || kw.includes(s.toLowerCase()))) {
          if (synonyms.some(s => faqText.includes(s.toLowerCase()))) {
            score += 2;
          }
        }
      }
    }
  });
  
  return score;
};

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
        const keywords = extractChineseKeywords(filters.keyword);
        faqs = faqs.map(faq => ({
          faq,
          score: calculateMatchScore(faq, keywords)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.faq);
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
    const text = `${title} ${description}`;
    const keywords = extractChineseKeywords(text);
    
    const scored = faqs.map(faq => ({
      faq,
      score: calculateMatchScore(faq, keywords)
    }));

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
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
