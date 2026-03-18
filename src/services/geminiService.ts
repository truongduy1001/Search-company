import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Robust API Key retrieval for both AI Studio and external deployments (Vercel/Netlify)
const API_KEY = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ 
  apiKey: API_KEY || "" 
});

export interface CompanyInfo {
  taxId: string;
  name: string;
  address: string;
  representative: string;
  phone?: string;
  dateOfOperation: string;
  status: string;
  managedBy: string;
  businessType?: string;
  lastUpdated?: string;
  isBranch?: boolean;
  parentTaxId?: string;
}

// Persistent cache using localStorage to speed up repeated lookups across sessions
const CACHE_PREFIX = 'company_search_v2_';

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (e) {
    console.error("Cache read error:", e);
  }
  return null;
}

function setToCache(key: string, data: any) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error("Cache write error:", e);
  }
}

export async function searchCompany(query: string): Promise<CompanyInfo[]> {
  const cacheKey = 'search_' + query.trim().toLowerCase();
  const cachedData = getFromCache<CompanyInfo[]>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Bạn là một chuyên gia tra cứu dữ liệu doanh nghiệp. 
      Nhiệm vụ: Tìm kiếm và trích xuất thông tin ĐẦY ĐỦ từ https://masothue.com cho truy vấn: "${query}".

      QUY TRÌNH BẮT BUỘC:
      1. Sử dụng Google Search để tìm các trang liên quan trên site:masothue.com cho mã số thuế hoặc tên công ty này.
      2. Liệt kê TẤT CẢ các chi nhánh (MST-001, MST-002...) và văn phòng đại diện được tìm thấy.
      3. Trích xuất chính xác: Tên, MST, Địa chỉ, Người đại diện, Trạng thái (Đang hoạt động/Ngừng hoạt động).
      4. KHÔNG tự ý suy diễn thông tin nếu không thấy trên masothue.com.

      Trả về mảng JSON: taxId, name, address, representative, phone, dateOfOperation, status, managedBy, businessType, isBranch, parentTaxId.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } // Tối ưu tốc độ cho Vercel
      },
    });

    const text = response.text || "[]";
    const data = JSON.parse(text);
    setToCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error searching company:", error);
    return [];
  }
}

export async function getCompanyDetail(taxId: string): Promise<CompanyInfo | null> {
  const cacheKey = 'detail_' + taxId;
  const cachedData = getFromCache<CompanyInfo>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Trích xuất chi tiết thông tin doanh nghiệp có MST: ${taxId} từ https://masothue.com.
      Yêu cầu: Tên chính xác, Địa chỉ, Người đại diện, Số điện thoại, Ngày hoạt động, Trạng thái hoạt động.
      Trả về đối tượng JSON: taxId, name, address, representative, phone, dateOfOperation, status, managedBy, businessType, isBranch, parentTaxId.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } // Tối ưu tốc độ cho Vercel
      },
    });

    const text = response.text || "null";
    const data = JSON.parse(text);
    if (data) {
      setToCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("Error getting company detail:", error);
    return null;
  }
}
