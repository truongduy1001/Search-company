import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
      contents: `Bạn là một chuyên gia phân tích dữ liệu doanh nghiệp Việt Nam. 
      Nhiệm vụ: Truy xuất danh sách ĐẦY ĐỦ VÀ CHÍNH XÁC TUYỆT ĐỐI từ nguồn https://masothue.com cho truy vấn: "${query}".

      YÊU CẦU BẮT BUỘC:
      1. NGUỒN DỮ LIỆU: Sử dụng dữ liệu từ masothue.com làm nguồn chính.
      2. LIỆT KÊ ĐẦY ĐỦ: Khi tra cứu Mã số thuế (ví dụ: 1200253539), bạn PHẢI liệt kê:
         - Công ty chính (MST 10 số).
         - TẤT CẢ các chi nhánh, văn phòng đại diện, địa điểm kinh doanh (MST-001, MST-002...).
      3. TRẠNG THÁI: Phải ghi rõ trạng thái "Đang hoạt động" hoặc "Ngừng hoạt động" cho từng đơn vị.
      4. TÊN CHÍNH XÁC: Tên doanh nghiệp/chi nhánh phải đúng từng chữ như trên masothue.com. Không được tự ý thêm bớt hay nhầm lẫn tên ngân hàng nếu không có trong tên chính thức của MST đó.
      5. THÔNG TIN CẦN LẤY: Mã số thuế, Tên đầy đủ, Địa chỉ, Người đại diện, Số điện thoại, Ngày hoạt động, Trạng thái, Cơ quan quản lý.

      Trả về mảng JSON các đối tượng: taxId, name, address, representative, phone, dateOfOperation, status, managedBy, businessType, isBranch, parentTaxId.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
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
      contents: `Tra cứu chi tiết thông tin doanh nghiệp Việt Nam có mã số thuế: ${taxId} từ nguồn https://tracuunnt.gdt.gov.vn.
      Yêu cầu độ chính xác tuyệt đối cho: Tên chính thức, Địa chỉ trụ sở, Người đại diện pháp luật (đúng từng chữ), Số điện thoại, Ngày hoạt động, Trạng thái, Cơ quan thuế quản lý.
      Trả về đối tượng JSON: taxId, name, address, representative, phone, dateOfOperation, status, managedBy, businessType, isBranch, parentTaxId.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } // Increased for maximum accuracy
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
