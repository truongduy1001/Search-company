/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, User, Calendar, Info, Loader2, ArrowRight, ExternalLink, ShieldCheck, AlertCircle, Phone, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchCompany, getCompanyDetail, CompanyInfo } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedCompany(null);
    try {
      const data = await searchCompany(query);
      setResults(data);
      if (data.length === 0) {
        setError('Không tìm thấy kết quả phù hợp. Vui lòng thử lại với từ khóa khác.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (taxId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await getCompanyDetail(taxId);
      setSelectedCompany(detail);
    } catch (err) {
      setError('Không thể tải chi tiết thông tin doanh nghiệp.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClearCache = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('company_search_v2_')) {
        localStorage.removeItem(key);
      }
    });
    setResults([]);
    setSelectedCompany(null);
    setQuery('');
    setError('Đã xóa bộ nhớ đệm thành công.');
    setTimeout(() => setError(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setResults([]); setSelectedCompany(null); setQuery(''); }}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">Tra cứu Doanh nghiệp</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Dữ liệu thời gian thực</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Trang chủ</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Hướng dẫn</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Liên hệ</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Search Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Tìm kiếm thông tin <span className="text-indigo-600">Công ty</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Tra cứu thông tin chính xác về doanh nghiệp, hộ kinh doanh cá thể từ cơ sở dữ liệu quốc gia.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group">
            <div className="relative flex items-center">
              <div className="absolute left-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập mã số thuế, tên công ty hoặc tên người đại diện..."
                className="w-full pl-14 pr-32 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Tìm kiếm'}
              </button>
            </div>
          </form>

          {/* Quick Tips */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Info size={14} /> Ví dụ: 0101248108</span>
            <span className="flex items-center gap-1"><Info size={14} /> Ví dụ: Tập đoàn Viettel</span>
            <button 
              onClick={handleClearCache}
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} /> Xóa bộ nhớ đệm
            </button>
          </div>
        </section>

        {/* Content Area */}
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3"
              >
                <AlertCircle size={20} />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <Loader2 size={48} className="text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Đang truy xuất dữ liệu từ hệ thống...</p>
              </motion.div>
            )}

            {!loading && results.length > 0 && !selectedCompany && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="font-bold text-slate-700">Kết quả tìm kiếm ({results.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((company, idx) => (
                    <motion.div
                      key={company.taxId + idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSelectCompany(company.taxId)}
                      className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="text-indigo-600" size={20} />
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                          <Building2 size={24} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 uppercase">
                              {company.name}
                            </h4>
                            {company.isBranch && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded shrink-0">
                                CHI NHÁNH
                              </span>
                            )}
                          </div>
                          {company.status && (
                            <div className="flex items-center gap-1.5">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                company.status.toLowerCase().includes('đang hoạt động') ? "bg-emerald-500" : "bg-red-500"
                              )} />
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                company.status.toLowerCase().includes('đang hoạt động') ? "text-emerald-600" : "text-red-500"
                              )}>
                                {company.status}
                              </span>
                            </div>
                          )}
                          <p className="text-sm font-mono text-indigo-600 font-bold">MST: {company.taxId}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                            <User size={12} />
                            <span>Đại diện: {company.representative}</span>
                          </div>
                          <div className="flex items-start gap-1 text-xs text-slate-500">
                            <MapPin size={12} className="mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{company.address}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedCompany && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden"
              >
                {/* Detail Header */}
                <div className="bg-slate-900 p-8 md:p-12 text-white relative">
                  <button 
                    onClick={() => setSelectedCompany(null)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                  >
                    Đóng chi tiết
                  </button>
                  <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                      <Building2 size={40} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          selectedCompany.status?.toLowerCase().includes('đang hoạt động') ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                        )}>
                          {selectedCompany.status}
                        </span>
                        {selectedCompany.isBranch && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                            CHI NHÁNH
                          </span>
                        )}
                        <span className="text-slate-400 text-xs font-mono">Cập nhật: {new Date().toLocaleDateString('vi-VN')}</span>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight">
                        {selectedCompany.name}
                      </h2>
                      <p className="text-indigo-400 font-mono text-xl font-bold">Mã số thuế: {selectedCompany.taxId}</p>
                    </div>
                  </div>
                </div>

                {/* Detail Body */}
                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="md:col-span-2 space-y-10">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Người đại diện</p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-800 font-semibold">
                            <User size={18} className="text-indigo-500" />
                            <span>{selectedCompany.representative}</span>
                          </div>
                          {selectedCompany.phone && (
                            <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                              <Phone size={14} className="text-emerald-500" />
                              <a href={`tel:${selectedCompany.phone}`} className="hover:text-indigo-600 transition-colors">
                                {selectedCompany.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Ngày hoạt động</p>
                        <div className="flex items-center gap-2 text-slate-800 font-semibold">
                          <Calendar size={18} className="text-indigo-500" />
                          <span>{selectedCompany.dateOfOperation}</span>
                        </div>
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Địa chỉ trụ sở</p>
                        <div className="flex items-start gap-2 text-slate-800 font-semibold">
                          <MapPin size={18} className="text-indigo-500 mt-1 shrink-0" />
                          <span>{selectedCompany.address}</span>
                        </div>
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Cơ quan quản lý</p>
                        <div className="flex items-start gap-2 text-slate-800 font-semibold">
                          <ShieldCheck size={18} className="text-indigo-500 mt-1 shrink-0" />
                          <span>{selectedCompany.managedBy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Info size={18} className="text-indigo-600" />
                        Thông tin bổ sung
                      </h4>
                      <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span>Loại hình doanh nghiệp</span>
                          <span className="font-medium text-slate-900">{selectedCompany.businessType || 'Đang cập nhật'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span>Tình trạng pháp lý</span>
                          <span className="font-medium text-emerald-600">{selectedCompany.status}</span>
                        </div>
                        {selectedCompany.isBranch && selectedCompany.parentTaxId && (
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span>Công ty mẹ (MST)</span>
                            <span 
                              className="font-medium text-indigo-600 cursor-pointer hover:underline"
                              onClick={() => handleSelectCompany(selectedCompany.parentTaxId!)}
                            >
                              {selectedCompany.parentTaxId}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Nguồn dữ liệu</span>
                          <span className="flex items-center gap-1 text-indigo-600 font-medium cursor-pointer hover:underline">
                            Tổng cục Thuế <ExternalLink size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar / Actions */}
                  <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
                      <h4 className="font-bold mb-2">Hành động</h4>
                      <p className="text-indigo-100 text-xs mb-6">Bạn có thể in hoặc lưu lại thông tin doanh nghiệp này.</p>
                      <div className="space-y-3">
                        <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                          In thông tin
                        </button>
                        <button className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-400 transition-colors">
                          Tải PDF
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-6">
                      <h4 className="font-bold text-slate-900 mb-4">Lưu ý</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Thông tin trên chỉ mang tính chất tham khảo. Để có dữ liệu chính xác nhất cho các thủ tục pháp lý, vui lòng liên hệ trực tiếp với cơ quan thuế quản lý hoặc Cổng thông tin quốc gia về đăng ký doanh nghiệp.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {detailLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4"
              >
                <Loader2 size={48} className="text-indigo-600 animate-spin" />
                <p className="text-slate-900 font-bold">Đang tải chi tiết doanh nghiệp...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-50 grayscale">
            <Building2 size={24} />
            <span className="font-bold">Business Search Pro</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; 2026 Tra cứu Doanh nghiệp. Hệ thống sử dụng AI của DUY-IT để tổng hợp dữ liệu từ các nguồn công khai.
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#" className="hover:text-indigo-600 transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">API Doanh nghiệp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
