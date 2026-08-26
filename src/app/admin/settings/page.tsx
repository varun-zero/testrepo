"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Scope = "business" | "technical";

const SCOPE_INFO: Record<Scope, { label: string; desc: string; fields: { key: string; label: string; type?: string; hint?: string }[] }> = {
  business: {
    label: "Business Settings",
    desc: "Operational settings (UPI ID, registration status, contact info)",
    fields: [
      { key: "upiId", label: "UPI ID", hint: "e.g. admin@vcet" },
      { key: "qrCodeUrl", label: "Payment QR Code Image URL", hint: "Image URL or /path/to/qr.png served from this site" },
      { key: "registrationOpen", label: "Registration Open", type: "boolean" },
      { key: "contactEmail", label: "Contact Email", type: "email" },
      { key: "contactPhone", label: "Contact Phone" },
    ],
  },
  technical: {
    label: "Technical Settings",
    desc: "System-level configuration (developer access only)",
    fields: [
      { key: "maintenanceMode", label: "Maintenance Mode", type: "boolean" },
      { key: "debugLogging", label: "Debug Logging", type: "boolean" },
    ],
  },
};

function SettingsSection({ scope }: { scope: Scope }) {
  const meta = SCOPE_INFO[scope];
  const [data, setData] = useState<Record<string, unknown>>({});
  const [raw, setRaw] = useState("{}");
  const [rawMode, setRawMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/settings/${scope}`);
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        if (res.status === 403) { setForbidden(true); setLoading(false); return; }
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message || "Failed");
        setData(json.data ?? {});
        setRaw(JSON.stringify(json.data ?? {}, null, 2));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [scope]);

  const setValue = (key: string, val: unknown) => setData((d) => ({ ...d, [key]: val }));

  const save = async () => {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const payload = rawMode ? JSON.parse(raw) : data;
      const res = await fetch(`/api/admin/settings/${scope}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Failed");
      setData(json.data ?? {});
      setRaw(JSON.stringify(json.data ?? {}, null, 2));
      setMsg("Saved");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-white/[0.06]">
        <h3 className="text-white font-semibold">{meta.label}</h3>
        <p className="text-white/40 text-sm mt-0.5">{meta.desc}</p>
      </div>
      <div className="p-5 space-y-4">
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">{error}</div>}
        {msg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-sm">{msg}</div>}
        {forbidden ? (
          <div className="flex items-center gap-2 text-white/30 text-sm py-4">
            <Info className="w-4 h-4" />
            You do not have permission to manage these settings.
          </div>
        ) : loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
        ) : (
          <>
            <div className="flex justify-end">
              <button onClick={() => setRawMode((r) => !r)} className="text-xs text-white/30 hover:text-white/60 px-2 py-1 rounded hover:bg-white/[0.04] transition-all">
                {rawMode ? "Form view" : "JSON view"}
              </button>
            </div>
            {rawMode ? (
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                spellCheck={false}
                className="w-full h-56 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-white font-mono text-sm outline-none focus:border-violet-500/50 transition-all"
              />
            ) : (
              <div className="space-y-3">
                {meta.fields.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-white/40 block mb-1.5">{f.label}</label>
                    {f.type === "boolean" ? (
                      <button
                        type="button"
                        onClick={() => setValue(f.key, !data[f.key])}
                        className={cn("w-9 h-5 rounded-full transition-colors relative", data[f.key] ? "bg-violet-500" : "bg-white/10")}
                      >
                        <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all", data[f.key] ? "left-4" : "left-0.5")} />
                      </button>
                    ) : (
                      <input
                        type={f.type || "text"}
                        value={(data[f.key] as string) || ""}
                        onChange={(e) => setValue(f.key, e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition-all"
                        placeholder={f.hint}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <SettingsSection scope="business" />
      <SettingsSection scope="technical" />
    </div>
  );
}
