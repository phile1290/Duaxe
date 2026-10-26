import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Save,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import {
  getStoredApiKey,
  saveStoredApiKey,
  testGeminiApiKey,
} from '../services/geminiClientService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [storedKey, setStoredKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getStoredApiKey();
      setStoredKey(existing);
      setApiKeyInput(existing);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredApiKey(apiKeyInput);
    const updated = getStoredApiKey();
    setStoredKey(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = () => {
    saveStoredApiKey('');
    setStoredKey('');
    setApiKeyInput('');
    setTestResult(null);
    setSaveSuccess(false);
  };

  const handleTest = async () => {
    const keyToTest = apiKeyInput.trim() || storedKey;
    if (!keyToTest) {
      setTestResult({ success: false, message: 'Vui lòng nhập khóa API trước khi kiểm tra!' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const result = await testGeminiApiKey(keyToTest);
    setTestResult(result);
    setIsTesting(false);
  };

  // Mask string for display
  const maskedKey = storedKey
    ? `${storedKey.substring(0, 7)}••••••••••••••••${storedKey.substring(storedKey.length - 4)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl text-white relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Cài Đặt Khóa Gemini API</h3>
            <p className="text-xs text-slate-300">
              Lưu trên trình duyệt web của bạn • Chỉ cần nhập 1 lần duy nhất
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          {storedKey ? (
            <div className="bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold">Đã lưu khóa API trên thiết bị này:</div>
                  <div className="font-mono text-[11px] text-emerald-400">{maskedKey}</div>
                </div>
              </div>
              <button
                onClick={handleDelete}
                title="Xóa khóa đã lưu"
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Chưa lưu khóa cá nhân. Ứng dụng đang sử dụng trực tiếp Model ổn định (gemini-2.5-flash) từ máy chủ hệ thống.</span>
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Nhập Gemini API Key (Bắt đầu bằng AIzaSy...):
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 pr-11 text-white text-sm font-mono focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons: Save & Test */}
          <div className="flex gap-2.5">
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>LƯU KHÓA API</span>
            </button>

            <button
              onClick={handleTest}
              disabled={isTesting}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Đang thử...</span>
                </>
              ) : (
                <span>Kiểm tra</span>
              )}
            </button>
          </div>
        </div>

        {/* Save confirmation */}
        {saveSuccess && (
          <div className="mb-4 bg-emerald-950/60 border border-emerald-500 p-2.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Đã lưu thành công! Bạn không cần nhập lại khóa trong các lần truy cập sau.</span>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Instructions & Help */}
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-slate-200">💡 Hướng dẫn nhận khóa API miễn phí:</div>
          <p className="leading-relaxed">
            1. Truy cập trang tạo khóa chính thức của Google:
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
          >
            <span>aistudio.google.com/app/apikey</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <p className="leading-relaxed text-[11px] text-slate-300">
            2. Đăng nhập tài khoản Google của bạn, bấm <strong>Create API key</strong>, sao chép khóa rồi dán vào ô bên trên và bấm <strong>LƯU KHÓA API</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
