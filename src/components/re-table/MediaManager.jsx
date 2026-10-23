import React, { useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

// Built-in sample images matching the reference screenshot
export const DEFAULT_CHECKLIST_MEDIA = [
  {
    id: 'media_passport',
    title: 'Passport Sample',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380" fill="none"><rect width="300" height="380" rx="12" fill="%237F1D1D"/><rect x="15" y="15" width="270" height="350" rx="8" fill="%23881337" stroke="%23B45309" stroke-width="2"/><text x="150" y="70" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="%23FDE047" text-anchor="middle">PASSPORT</text><circle cx="150" cy="180" r="45" fill="none" stroke="%23FDE047" stroke-width="3"/><polygon points="150,150 156,168 174,168 159,179 165,197 150,186 135,197 141,179 126,168 144,168" fill="%23FDE047"/><text x="150" y="270" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23FDE047" text-anchor="middle">SAMPLE</text></svg>`,
  },
  {
    id: 'media_photo',
    title: 'Photo Requirement',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380" fill="none"><rect width="300" height="380" rx="8" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><text x="150" y="30" font-family="sans-serif" font-size="11" fill="%2364748B" text-anchor="middle">33mm</text><line x1="50" y1="40" x2="250" y2="40" stroke="%2394A3B8" stroke-width="1"/><circle cx="150" cy="140" r="45" fill="%23FED7AA"/><path d="M100 240 C100 190 200 190 200 240 Z" fill="%230284C7"/><text x="270" y="180" font-family="sans-serif" font-size="11" fill="%2364748B">48mm</text><line x1="260" y1="50" x2="260" y2="310" stroke="%2394A3B8" stroke-width="1"/></svg>`,
  },
  {
    id: 'media_bank',
    title: 'Bank Statement',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380" fill="none"><rect width="300" height="380" rx="8" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><rect x="15" y="15" width="100" height="15" rx="3" fill="%230284C7"/><rect x="220" y="15" width="60" height="60" rx="4" fill="%231E293B"/><rect x="15" y="55" width="180" height="8" rx="2" fill="%23E2E8F0"/><rect x="15" y="70" width="140" height="8" rx="2" fill="%23E2E8F0"/><line x1="15" y1="95" x2="285" y2="95" stroke="%23CBD5E1" stroke-width="1"/><rect x="15" y="110" width="270" height="15" fill="%23F1F5F9"/><rect x="15" y="135" width="270" height="15" fill="%23FFFFFF"/><rect x="15" y="160" width="270" height="15" fill="%23F1F5F9"/><rect x="15" y="185" width="270" height="15" fill="%23FFFFFF"/></svg>`,
  },
  {
    id: 'media_ticket',
    title: 'Flight Ticket',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380" fill="none"><rect width="300" height="380" rx="8" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><rect x="10" y="30" width="280" height="120" rx="8" fill="%230284C7"/><text x="30" y="65" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23FFFFFF">Flight Ticket</text><rect x="10" y="170" width="280" height="80" rx="4" fill="%23F8FAFC" stroke="%23E2E8F0"/><text x="30" y="200" font-family="monospace" font-size="11" fill="%23475569">CONFIRMED ROUNDTRIP</text><text x="30" y="225" font-family="monospace" font-size="11" fill="%23475569">DAC &gt;&gt; PEK / CAN</text></svg>`,
  },
  {
    id: 'media_hotel',
    title: 'Hotel Booking',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380" fill="none"><rect width="300" height="380" rx="8" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><rect x="15" y="20" width="120" height="16" rx="4" fill="%23475569"/><rect x="15" y="55" width="270" height="10" rx="2" fill="%23E2E8F0"/><rect x="15" y="75" width="200" height="10" rx="2" fill="%23E2E8F0"/><rect x="15" y="110" width="270" height="60" rx="6" fill="%23F8FAFC" stroke="%23E2E8F0"/><text x="30" y="145" font-family="sans-serif" font-size="12" font-weight="bold" fill="%231E293B">Hotel Voucher Confirmed</text></svg>`,
  },
];

export function MediaManager({ mediaList = DEFAULT_CHECKLIST_MEDIA, onChange }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const isImg = file.type.startsWith('image/');
      if (!isImg) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const newMedia = {
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          url: event.target.result,
        };
        onChange?.([...mediaList, newMedia]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveMedia = (id) => {
    onChange?.(mediaList.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Upload Dropzone matching the screenshot */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-sky-200 hover:border-sky-300 rounded-xl bg-sky-50/20 hover:bg-sky-50/40 p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-sky-100 flex items-center justify-center text-[#0066FF] mb-2">
          <UploadCloud className="w-5 h-5 stroke-[2.2]" />
        </div>
        <p className="text-sm font-semibold text-slate-800">
          Click to upload images <span className="font-normal text-slate-500">or drag and drop</span>
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Supports: JPG, PNG, WEBP (Max 5MB each)
        </p>
      </div>

      {/* Thumbnails Row matching the screenshot */}
      {mediaList.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1">
          {mediaList.map((item) => (
            <div key={item.id} className="w-28 shrink-0 flex flex-col items-center group">
              <div className="relative w-full h-24 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-2xs group-hover:border-slate-300 transition-all">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMedia(item.id);
                  }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-800/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                  title="Remove image"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
              <span className="text-xs text-slate-600 font-medium mt-1.5 text-center truncate w-full" title={item.title}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaManager;
