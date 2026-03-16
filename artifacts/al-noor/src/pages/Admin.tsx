import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { usePrayerContext } from '@/context/PrayerContext';
import { useVerifyAdmin, useUpdatePrayerData, useGetPrayerData, useUploadHadiths } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, Save, Loader2, Plus, Trash2, Upload, FileJson, CheckCircle2, BookOpen } from 'lucide-react';
import type { PrayerData, HadithItem } from '@workspace/api-client-react';

export default function Admin() {
  const { language } = usePrayerContext();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminAuth') === 'true');
  const [password, setPassword] = useState(() => sessionStorage.getItem('adminPwd') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hadithFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  // ── Dedicated Hadith file upload state ──────────────────────────────────────
  const [hadithPreview, setHadithPreview] = useState<HadithItem[] | null>(null);
  const [hadithFileName, setHadithFileName] = useState<string>('');
  const [isHadithUploading, setIsHadithUploading] = useState(false);
  const [hadithUploadDone, setHadithUploadDone] = useState(false);

  const { data: initialData, refetch } = useGetPrayerData();
  const verifyMutation = useVerifyAdmin();
  const updateMutation = useUpdatePrayerData();
  const uploadHadithsMutation = useUploadHadiths();
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

      // ── Detect Hadith format: array of { hadith_ar, hadith_de } ──
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && ('hadith_ar' in parsed[0] || 'hadith_de' in parsed[0])) {
        const res = await fetch('/api/admin/hadith-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: password, hadiths: parsed }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Upload failed');
        setUploadDone(true);
        refetch();
        toast({ title: isAr ? 'تم رفع الأحاديث ✓' : 'Hadiths Uploaded ✓', description: json.message });

      // ── Detect Diyanet format ──
      } else if (parsed.times && parsed.prayer_names) {
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

  // ── Dedicated Hadith file parse (no immediate upload) ───────────────────────
  const handleHadithFileSelect = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'يجب أن يكون الملف بصيغة JSON' : 'File must be .json', variant: 'destructive' });
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error(isAr ? 'يجب أن يكون الملف مصفوفة JSON غير فارغة' : 'File must be a non-empty JSON array');
      const first = parsed[0];
      if (typeof first !== 'object' || first === null || !('hadith_ar' in first) || !('hadith_de' in first)) {
        throw new Error(isAr ? 'كل عنصر يجب أن يحتوي على hadith_ar وhadith_de' : 'Each item must have "hadith_ar" and "hadith_de" fields');
      }
      setHadithPreview(parsed as HadithItem[]);
      setHadithFileName(file.name);
      setHadithUploadDone(false);
    } catch (err: any) {
      toast({ title: isAr ? 'خطأ في الملف' : 'File Error', description: err.message, variant: 'destructive' });
      setHadithPreview(null);
    }
  };

  const handleHadithUpload = async () => {
    if (!hadithPreview || hadithPreview.length === 0) return;
    setIsHadithUploading(true);
    try {
      const result = await uploadHadithsMutation.mutateAsync({
        data: { adminPassword: password, hadiths: hadithPreview },
      });
      setHadithUploadDone(true);
      setHadithPreview(null);
      setHadithFileName('');
      refetch();
      toast({ title: isAr ? 'تم رفع الأحاديث ✓' : 'Hadiths Uploaded ✓', description: result.message });
    } catch (err: any) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsHadithUploading(false);
    }
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
                  <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full font-mono">Hadith JSON</span>
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
            <h2 className="text-xl font-bold mb-1">{isAr ? 'أوقات الصلاة والإقامة' : 'Prayer & Iqama Times'}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {isAr ? 'وقت الإقامة = وقت الأذان + الدقائق المحددة (0 = لا تُعرض إقامة)' : 'Iqama time = Adhan time + offset in minutes (0 = no iqama shown)'}
            </p>

            {/* Column headers */}
            <div className="hidden md:grid grid-cols-[7rem_1fr_1fr_1fr_auto] gap-4 px-4 mb-2 text-xs text-muted-foreground uppercase tracking-wider">
              <span>{isAr ? 'الصلاة' : 'Prayer'}</span>
              <span>{isAr ? 'وقت الأذان' : 'Adhan Time'}</span>
              <span>{isAr ? 'الإقامة (دقائق بعد الأذان)' : 'Iqama Offset (minutes after Adhan)'}</span>
              <span>{isAr ? 'وقت الإقامة' : 'Iqama Time'}</span>
              <span>{isAr ? 'مفعّل' : 'Enabled'}</span>
            </div>

            <div className="space-y-2">
              {formData.prayers.map((prayer, idx) => {
                const offset = prayer.iqamaOffset ?? 0;
                const noIqama = prayer.name.toLowerCase().includes('shuruk') || prayer.name.toLowerCase().includes('sunrise');
                const iqamaTime = offset > 0 ? (() => {
                  const [h, m] = prayer.time.split(':').map(Number);
                  const total = h * 60 + m + offset;
                  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
                })() : null;

                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[7rem_1fr_1fr_1fr_auto] items-center gap-3 bg-background/50 p-4 rounded-xl border border-white/5">
                    {/* Name */}
                    <div className="font-semibold text-sm">{isAr ? prayer.nameAr : prayer.name}</div>

                    {/* Adhan time */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground md:hidden">{isAr ? 'الأذان' : 'Adhan'}</label>
                      <Input type="time" className="w-full md:w-32" value={prayer.time}
                        onChange={e => {
                          const p = [...formData.prayers]; p[idx] = { ...p[idx], time: e.target.value };
                          setFormData({ ...formData, prayers: p });
                        }} />
                    </div>

                    {/* Iqama offset */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground md:hidden">{isAr ? 'الإقامة (دقائق)' : 'Iqama (min)'}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">+</span>
                        <Input
                          type="number" min={0} max={60} step={1}
                          className="w-20 text-center"
                          value={noIqama ? 0 : offset}
                          disabled={noIqama}
                          title={noIqama ? (isAr ? 'لا إقامة للشروق' : 'No iqama for Sunrise') : ''}
                          onChange={e => {
                            const p = [...formData.prayers];
                            p[idx] = { ...p[idx], iqamaOffset: Math.max(0, Math.min(60, parseInt(e.target.value) || 0)) };
                            setFormData({ ...formData, prayers: p });
                          }}
                        />
                        <span className="text-muted-foreground text-sm">{isAr ? 'دقيقة' : 'min'}</span>
                      </div>
                    </div>

                    {/* Computed iqama time (display only) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground md:hidden">{isAr ? 'وقت الإقامة' : 'Iqama Time'}</label>
                      <div className={`font-mono font-bold text-lg px-3 py-1.5 rounded-lg text-center w-full md:w-28 ${iqamaTime ? 'text-primary bg-primary/10 border border-primary/30' : 'text-muted-foreground/30 bg-transparent'}`}>
                        {iqamaTime ?? (noIqama ? '—' : '—')}
                      </div>
                    </div>

                    {/* Enabled toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" className="w-4 h-4 accent-primary" checked={prayer.enabled}
                        onChange={e => {
                          const p = [...formData.prayers]; p[idx] = { ...p[idx], enabled: e.target.checked };
                          setFormData({ ...formData, prayers: p });
                        }} />
                      <span className="whitespace-nowrap">{isAr ? 'مفعّل' : 'On'}</span>
                    </label>
                  </div>
                );
              })}
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

          {/* Hadiths */}
          <section className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {isAr ? 'الأحاديث النبوية' : 'Prophetic Hadiths'}
              </h2>
              <Button size="sm" variant="outline"
                onClick={() => setFormData({ ...formData, azkar: [...formData.azkar, { hadith_ar: '', hadith_de: '' }] })}>
                <Plus className="w-4 h-4 mr-1" /> {isAr ? 'إضافة يدوياً' : 'Add Manually'}
              </Button>
            </div>

            {/* ── Dedicated Hadith JSON Upload ── */}
            <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <p className="text-sm font-semibold text-primary mb-3">
                {isAr ? 'رفع ملف الأحاديث (JSON)' : 'Upload Hadith File (JSON)'}
              </p>
              <input
                ref={hadithFileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleHadithFileSelect(f); e.target.value = ''; }}
              />

              {!hadithPreview && !hadithUploadDone && (
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => hadithFileInputRef.current?.click()}>
                    <FileJson className="w-4 h-4 mr-2" />
                    {isAr ? 'اختر ملف JSON' : 'Choose JSON File'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {isAr ? 'الصيغة: [{hadith_ar:"...", hadith_de:"..."}]' : 'Format: [{hadith_ar:"...", hadith_de:"..."}]'}
                  </span>
                </div>
              )}

              {hadithPreview && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                      <FileJson className="w-4 h-4 text-primary" />
                      <span className="text-sm font-mono text-primary/80">{hadithFileName}</span>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {isAr ? `✓ ${hadithPreview.length} حديث جاهز للرفع` : `✓ ${hadithPreview.length} hadith${hadithPreview.length !== 1 ? 's' : ''} ready to upload`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 max-h-28 overflow-y-auto space-y-1">
                    {hadithPreview.slice(0, 3).map((h, i) => (
                      <div key={i} className="truncate">
                        <span className="text-primary/60 font-mono">{i + 1}.</span> {h.hadith_ar.slice(0, 60)}…
                      </div>
                    ))}
                    {hadithPreview.length > 3 && (
                      <div className="text-muted-foreground/60 italic">
                        {isAr ? `+ ${hadithPreview.length - 3} أحاديث أخرى` : `+ ${hadithPreview.length - 3} more`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleHadithUpload} disabled={isHadithUploading}>
                      {isHadithUploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {isAr ? 'رفع الأحاديث' : 'Upload Hadiths'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setHadithPreview(null); setHadithFileName(''); }}>
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              )}

              {hadithUploadDone && !hadithPreview && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">{isAr ? 'تم رفع الأحاديث بنجاح!' : 'Hadiths uploaded successfully!'}</span>
                  <Button size="sm" variant="ghost" className="ml-2 text-xs" onClick={() => { setHadithUploadDone(false); hadithFileInputRef.current?.click(); }}>
                    {isAr ? 'رفع ملف آخر' : 'Upload another'}
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              {isAr ? 'أو أضف / عدّل الأحاديث يدوياً أدناه ثم اضغط "حفظ التغييرات"' : 'Or add/edit hadiths manually below then click "Save Changes"'}
            </p>
            <div className="space-y-4">
              {formData.azkar.map((item, idx) => (
                <div key={idx} className="relative flex flex-col gap-3 bg-background/50 p-4 rounded-xl border border-white/5 pr-12">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">{isAr ? `حديث ${idx + 1}` : `Hadith ${idx + 1}`}</span>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive hover:bg-destructive/20 z-10"
                      onClick={() => setFormData({ ...formData, azkar: formData.azkar.filter((_, i) => i !== idx) })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">النص العربي (hadith_ar)</label>
                    <textarea
                      dir="rtl"
                      rows={3}
                      className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="أدخل نص الحديث بالعربية..."
                      value={item.hadith_ar}
                      onChange={e => { const a = [...formData.azkar]; a[idx] = { ...a[idx], hadith_ar: e.target.value }; setFormData({ ...formData, azkar: a }); }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Deutsche Übersetzung (hadith_de)</label>
                    <textarea
                      dir="ltr"
                      rows={3}
                      className="w-full rounded-lg bg-background border border-white/10 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Deutsche Übersetzung des Hadith..."
                      value={item.hadith_de}
                      onChange={e => { const a = [...formData.azkar]; a[idx] = { ...a[idx], hadith_de: e.target.value }; setFormData({ ...formData, azkar: a }); }}
                    />
                  </div>
                </div>
              ))}
              {formData.azkar.length === 0 && (
                <p className="text-muted-foreground text-sm italic">{isAr ? 'لا توجد أحاديث. أضف حديثاً أو ارفع ملف JSON.' : 'No hadiths. Add one or upload a JSON file.'}</p>
              )}
            </div>
          </section>

        </div>}
      </div>
    </Layout>
  );
}
