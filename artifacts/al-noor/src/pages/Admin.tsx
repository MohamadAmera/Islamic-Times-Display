import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { usePrayerContext } from '@/context/PrayerContext';
import { useVerifyAdmin, useUpdatePrayerData, useGetPrayerData } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, Save, Loader2, Plus, Trash2, Upload, FileJson, CheckCircle2 } from 'lucide-react';
import type { PrayerData } from '@workspace/api-client-react';

export default function Admin() {
  const { language } = usePrayerContext();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminAuth') === 'true');
  const [password, setPassword] = useState(() => sessionStorage.getItem('adminPwd') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const { data: initialData, refetch } = useGetPrayerData();
  const verifyMutation = useVerifyAdmin();
  const updateMutation = useUpdatePrayerData();
  const [formData, setFormData] = useState<PrayerData | null>(null);

  useEffect(() => {
    if (initialData) setFormData(JSON.parse(JSON.stringify(initialData)));
  }, [initialData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyMutation.mutateAsync({ data: { password } });
      if (res.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminPwd', password);
        toast({ title: isAr ? 'تم الدخول ✓' : 'Logged in ✓' });
      } else {
        toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'كلمة مرور خاطئة' : 'Wrong password', variant: 'destructive' });
      }
    } catch {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'فشل تسجيل الدخول' : 'Login failed', variant: 'destructive' });
    }
  };

  // ── Diyanet / JSON upload ────────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'يجب أن يكون الملف بصيغة JSON' : 'File must be .json', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // ── Detect Diyanet format ──
      if (parsed.times && parsed.prayer_names) {
        const res = await fetch('/api/admin/diyanet-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: password, data: parsed }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Upload failed');
        setUploadDone(true);
        refetch();
        toast({ title: isAr ? 'تم الرفع بنجاح ✓' : 'Uploaded Successfully ✓', description: json.message });

      // ── Detect our own format ──
      } else if (parsed.prayers && Array.isArray(parsed.prayers)) {
        setFormData(parsed as PrayerData);
        toast({ title: isAr ? 'تم تحميل الملف ✓' : 'File Loaded ✓', description: isAr ? 'راجع البيانات ثم اضغط حفظ' : 'Review data then click Save' });

      } else {
        throw new Error(isAr ? 'تنسيق الملف غير معروف' : 'Unknown file format');
      }
    } catch (err: any) {
      toast({ title: isAr ? 'خطأ في الملف' : 'File Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  // ── Save form data ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData) return;
    try {
      const res = await updateMutation.mutateAsync({
        data: { adminPassword: password, mosque: formData.mosque, prayers: formData.prayers, news: formData.news, azkar: formData.azkar }
      });
      if (res.success) {
        toast({ title: isAr ? 'تم الحفظ ✓' : 'Saved ✓' });
        refetch();
      }
    } catch (err: any) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // ── Login page ───────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center w-full">
          <form onSubmit={handleLogin} className="glass-card p-8 rounded-3xl w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold">{isAr ? 'لوحة الإدارة' : 'Admin Dashboard'}</h2>
              <p className="text-muted-foreground mt-2">{isAr ? 'أدخل كلمة المرور للمتابعة' : 'Enter password to continue'}</p>
            </div>
            <div className="space-y-4">
              <Input type="password" placeholder={isAr ? 'كلمة المرور' : 'Password'}
                value={password} onChange={e => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
                {verifyMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                {isAr ? 'دخول' : 'Login'}
              </Button>
            </div>
          </form>
        </div>
      </Layout>
    );
  }

  // ── Admin dashboard ──────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">{isAr ? 'إدارة البيانات' : 'Manage Data'}</h1>
          {formData && (
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              {isAr ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          )}
        </div>

        {/* ── Diyanet / JSON Upload Zone ── */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {isAr ? 'رفع ملف أوقات الصلاة (JSON)' : 'Upload Prayer Times File (JSON)'}
          </h2>
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer select-none
              ${isDragging ? 'border-primary bg-primary/15 scale-[1.01]' : 'border-primary/40 hover:border-primary hover:bg-primary/5 bg-white/5'}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".json" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }} />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg font-semibold">{isAr ? 'جاري رفع الملف...' : 'Uploading...'}</p>
              </div>
            ) : uploadDone ? (
              <div className="flex flex-col items-center gap-3 text-green-400">
                <CheckCircle2 className="w-12 h-12" />
                <p className="text-lg font-semibold">{isAr ? 'تم رفع الأوقات بنجاح!' : 'Prayer times uploaded!'}</p>
                <p className="text-sm text-muted-foreground">{isAr ? 'انقر لرفع ملف آخر' : 'Click to upload another file'}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <FileJson className="text-primary w-8 h-8" />
                </div>
                <div>
                  <p className="text-xl font-bold">{isAr ? 'اسحب ملف JSON هنا' : 'Drag your JSON file here'}</p>
                  <p className="text-muted-foreground mt-1">
                    {isAr ? 'أو انقر لاختيار الملف من جهازك' : 'or click anywhere to browse'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center mt-1">
                  <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full font-mono">Diyanet</span>
                  <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full font-mono">Al-Noor format</span>
                </div>
                <Button variant="outline" size="sm" className="pointer-events-none mt-2">
                  <Upload className="w-4 h-4 mr-2" />
                  {isAr ? 'اختر ملفاً' : 'Choose File'}
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {isAr
              ? 'يدعم تنسيق Diyanet (مع حقل times) وتنسيق Al-Noor (مع حقل prayers)'
              : 'Supports Diyanet format (with "times" field) and Al-Noor format (with "prayers" field)'}
          </p>
        </section>

        {/* ── Manual editing sections ── */}
        {!formData && (
          <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="animate-spin w-5 h-5" />
            <span>{isAr ? 'جاري تحميل البيانات...' : 'Loading data...'}</span>
          </div>
        )}
        {formData && <div className="space-y-8">

          {/* Mosque Info */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">{isAr ? 'معلومات المسجد' : 'Mosque Info'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Name (EN)', field: 'name', dir: 'ltr' },
                { label: 'Name (AR)', field: 'nameAr', dir: 'rtl' },
                { label: 'Address (EN)', field: 'address', dir: 'ltr' },
                { label: 'Address (AR)', field: 'addressAr', dir: 'rtl' },
              ].map(({ label, field, dir }) => (
                <div key={field}>
                  <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
                  <Input dir={dir} value={(formData.mosque as any)[field]}
                    onChange={e => setFormData({ ...formData, mosque: { ...formData.mosque, [field]: e.target.value } })} />
                </div>
              ))}
            </div>
          </section>

          {/* Prayer Times */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">{isAr ? 'أوقات الصلاة' : 'Prayer Times'}</h2>
            <div className="space-y-3">
              {formData.prayers.map((prayer, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-background/50 p-4 rounded-xl border border-white/5">
                  <div className="w-28 font-semibold">{isAr ? prayer.nameAr : prayer.name}</div>
                  <Input type="time" className="w-36" value={prayer.time}
                    onChange={e => {
                      const p = [...formData.prayers]; p[idx] = { ...p[idx], time: e.target.value };
                      setFormData({ ...formData, prayers: p });
                    }} />
                  <div className="flex-1" />
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" className="w-4 h-4 accent-primary" checked={prayer.enabled}
                      onChange={e => {
                        const p = [...formData.prayers]; p[idx] = { ...p[idx], enabled: e.target.checked };
                        setFormData({ ...formData, prayers: p });
                      }} />
                    {isAr ? 'مفعّل' : 'Enabled'}
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* News */}
          <section className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{isAr ? 'الأخبار' : 'News'}</h2>
              <Button size="sm" variant="outline"
                onClick={() => setFormData({ ...formData, news: [...formData.news, { id: Date.now().toString(), text: '', textAr: '' }] })}>
                <Plus className="w-4 h-4 mr-1" /> {isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            <div className="space-y-4">
              {formData.news.map((item, idx) => (
                <div key={item.id} className="relative flex flex-col md:flex-row gap-3 bg-background/50 p-4 rounded-xl border border-white/5 pr-12">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/20"
                    onClick={() => setFormData({ ...formData, news: formData.news.filter((_, i) => i !== idx) })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Text (EN)" value={item.text}
                      onChange={e => { const n = [...formData.news]; n[idx] = { ...n[idx], text: e.target.value }; setFormData({ ...formData, news: n }); }} />
                    <Input placeholder="نص (AR)" dir="rtl" value={item.textAr}
                      onChange={e => { const n = [...formData.news]; n[idx] = { ...n[idx], textAr: e.target.value }; setFormData({ ...formData, news: n }); }} />
                  </div>
                </div>
              ))}
              {formData.news.length === 0 && <p className="text-muted-foreground text-sm italic">{isAr ? 'لا توجد أخبار' : 'No news items.'}</p>}
            </div>
          </section>

          {/* Azkar */}
          <section className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{isAr ? 'الأذكار' : 'Azkar'}</h2>
              <Button size="sm" variant="outline"
                onClick={() => setFormData({ ...formData, azkar: [...formData.azkar, { id: Date.now().toString(), text: '', textAr: '', source: '', sourceAr: '' }] })}>
                <Plus className="w-4 h-4 mr-1" /> {isAr ? 'إضافة' : 'Add'}
              </Button>
            </div>
            <div className="space-y-4">
              {formData.azkar.map((item, idx) => (
                <div key={item.id} className="relative grid grid-cols-1 md:grid-cols-2 gap-3 bg-background/50 p-4 rounded-xl border border-white/5 pr-12">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/20 z-10"
                    onClick={() => setFormData({ ...formData, azkar: formData.azkar.filter((_, i) => i !== idx) })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="space-y-2">
                    <Input placeholder="Text (EN)" value={item.text} onChange={e => { const a = [...formData.azkar]; a[idx] = { ...a[idx], text: e.target.value }; setFormData({ ...formData, azkar: a }); }} />
                    <Input placeholder="Source (EN)" value={item.source} onChange={e => { const a = [...formData.azkar]; a[idx] = { ...a[idx], source: e.target.value }; setFormData({ ...formData, azkar: a }); }} />
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="نص (AR)" dir="rtl" value={item.textAr} onChange={e => { const a = [...formData.azkar]; a[idx] = { ...a[idx], textAr: e.target.value }; setFormData({ ...formData, azkar: a }); }} />
                    <Input placeholder="المصدر (AR)" dir="rtl" value={item.sourceAr} onChange={e => { const a = [...formData.azkar]; a[idx] = { ...a[idx], sourceAr: e.target.value }; setFormData({ ...formData, azkar: a }); }} />
                  </div>
                </div>
              ))}
              {formData.azkar.length === 0 && <p className="text-muted-foreground text-sm italic">{isAr ? 'لا توجد أذكار' : 'No azkar items.'}</p>}
            </div>
          </section>

        </div>}
      </div>
    </Layout>
  );
}
