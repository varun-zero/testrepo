"use client";

import { useState } from "react";
import { QrCode, Copy, Check, Upload, CreditCard, Sparkles, CheckCircle2 } from "lucide-react";

interface Props {
  fee: number;
  upiId: string | null;
  qrCodeUrl?: string | null | undefined;
  transactionIdValue?: string;
  onTransactionIdChange?: (val: string) => void;
}

export default function DynamicRegistrationFormPayment({
  fee,
  upiId,
  qrCodeUrl,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [zoomQr, setZoomQr] = useState(false);

  const hasUpi = Boolean(upiId);
  const hasQr = Boolean(qrCodeUrl);
  const paymentConfigured = hasUpi || hasQr;

  const copyUpi = () => {
    if (!upiId) return;
    navigator.clipboard
      .writeText(upiId)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
      .finally(() => setTimeout(() => setCopied(false), 2000));
  };

  const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_SCREENSHOT_BYTES) {
        setFileName("");
        setScreenshotPreview(null);
        e.target.value = "";
        alert("Screenshot must be under 5MB. Please choose a smaller image.");
        return;
      }
      setFileName(file.name);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setScreenshotPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setScreenshotPreview(null);
      }
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 my-4 sm:my-6 font-sans">
      {/* 1. Payment QR Code & Transfer Block */}
      <div className="bg-gradient-to-b from-purple-950/40 via-black/70 to-purple-950/30 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-5 sm:p-8 shadow-[0_0_50px_rgba(147,51,234,0.2)]">
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b border-purple-500/25">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/25 border border-purple-400/40 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide">Payment Details</h3>
              <p className="text-xs text-purple-200/70">Scan QR Code or copy UPI ID to complete payment</p>
            </div>
          </div>
          {fee > 0 && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold text-sm sm:text-base shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Registration Fee: ₹{fee}
            </div>
          )}
        </div>

        {paymentConfigured ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
          {/* Left: Scannable QR Code Image */}
          {hasQr && (
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-purple-950/25 border border-purple-500/35 rounded-2xl shadow-inner group relative">
            <div
              onClick={() => setZoomQr(true)}
              className="relative cursor-pointer overflow-hidden rounded-2xl bg-white p-2.5 shadow-[0_0_30px_rgba(168,85,247,0.4)] border border-purple-400/30 transition-transform duration-300 group-hover:scale-[1.03] max-w-[220px] sm:max-w-none w-full flex justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl ?? ""}
                alt="Payment QR Code"
                className="w-40 h-40 sm:w-48 sm:h-48 object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                <span className="text-[11px] font-extrabold bg-black/85 text-white px-3 py-1.5 rounded-full shadow-lg border border-purple-400/30">
                  🔍 Click to Enlarge
                </span>
              </div>
            </div>
            <p className="text-[11px] text-purple-200/90 font-bold mt-3 text-center flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" /> Scan with GPay, PhonePe, Paytm, or BHIM
            </p>
          </div>
          )}

          {/* Right: UPI Copy & Payment Steps */}
          {hasUpi && (
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-200/80 block">
                UPI ID for Direct Transfer
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white/[0.07] border border-purple-400/35 rounded-xl p-2.5 focus-within:border-purple-400 transition-all shadow-inner">
                <span className="font-mono text-xs sm:text-sm md:text-base text-purple-100 font-black px-2 flex-1 break-all sm:truncate">
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={copyUpi}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-300/40 text-white text-xs font-extrabold transition-all shadow-md whitespace-nowrap active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy UPI
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-purple-950/30 border border-purple-500/25 rounded-xl p-3.5 text-xs text-white/80 space-y-2">
              <p className="font-extrabold text-purple-200">Steps to finish registration:</p>
              <ol className="list-decimal list-inside space-y-1 text-white/70 leading-relaxed font-medium">
                <li>Scan QR Code or transfer <strong className="text-pink-300 font-extrabold">₹{fee}</strong> to UPI ID above.</li>
                <li>Copy the <strong>Transaction ID / UTR Number</strong> from your payment receipt.</li>
                <li>Take a clear screenshot of successful payment.</li>
                <li>Upload screenshot & enter Transaction ID below.</li>
              </ol>
            </div>
          </div>
          )}
        </div>
        ) : (
          <div className="bg-amber-950/30 border border-amber-400/40 rounded-xl p-5 text-center space-y-2">
            <p className="text-sm font-extrabold text-amber-200">Payment details not yet configured</p>
            <p className="text-xs text-white/70">
              The organizers have not published payment instructions for this event. Please complete your
              registration and our team will contact you with payment steps.
            </p>
          </div>
        )}
      </div>

      {/* 2. Payment Verification Form Fields (Transaction ID & Payment Screenshot) */}
      <div className="bg-purple-950/20 backdrop-blur-md border border-purple-500/35 rounded-2xl p-5 sm:p-8 space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
            Payment Verification Proof
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Transaction ID */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-bold text-purple-200/90 uppercase tracking-wider block">
              Transaction ID / UTR No. <span className="text-pink-400 font-bold">*</span>
            </label>
            <input
              required
              type="text"
              name="transactionId"
              placeholder="e.g. 328409182390 or T2408191530"
              className="w-full bg-white/[0.07] hover:bg-white/[0.1] focus:bg-white/[0.14] border border-white/20 focus:border-purple-400 text-white placeholder-white/45 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500/40 font-mono transition-all shadow-inner"
            />
            <p className="text-[10px] sm:text-[11px] text-purple-200/60 font-medium">
              Enter the 12-digit UTR or Transaction reference number.
            </p>
          </div>

          {/* Payment Screenshot Upload Dropzone */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-bold text-purple-200/90 uppercase tracking-wider block">
              Payment Screenshot Image <span className="text-pink-400 font-bold">*</span>
            </label>

            <div className="relative group">
              <input
                required
                type="file"
                name="paymentScreenshot"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full bg-white/[0.07] border-2 border-dashed border-purple-400/40 group-hover:border-purple-400 rounded-xl p-3 sm:p-4 transition-all text-center flex flex-col items-center justify-center min-h-[95px] sm:min-h-[110px] shadow-inner">
                {screenshotPreview ? (
                  <div className="flex items-center gap-3 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshotPreview} alt="Screenshot Preview" className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-purple-400/50 flex-shrink-0 shadow-md" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{fileName}</p>
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Image Selected (Click to change)</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300 mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-white/90">
                      Click or drag screenshot here <span className="text-pink-300 font-extrabold">(PNG, JPG, max 5MB)</span>
                    </p>
                    {fileName && <p className="text-[10px] sm:text-[11px] text-purple-200 mt-1 font-mono truncate max-w-full">{fileName}</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal Zoom */}
      {zoomQr && qrCodeUrl && (
        <div
          onClick={() => setZoomQr(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white p-5 rounded-3xl max-w-xs sm:max-w-sm w-full text-center shadow-[0_0_50px_rgba(168,85,247,0.5)] border border-purple-300/40 space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeUrl} alt="Payment QR Code Large" className="w-full max-h-72 sm:max-h-80 object-contain mx-auto rounded-2xl" />
            <p className="text-xs text-zinc-800 font-black">Scan with any UPI app to pay ₹{fee}</p>
            <button
              type="button"
              onClick={() => setZoomQr(false)}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-black shadow-lg transition-transform active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
