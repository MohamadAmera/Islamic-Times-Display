import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { usePrayerContext } from '@/context/PrayerContext';
import { useVerifyAdmin, useUpdatePrayerData, useGetPrayerData } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, Save, Loader2, Plus, Trash2, Upload, FileJson } from 'lucide-react';
import type { PrayerData } from '@workspace/api-client-react';

export default function Admin() {
  const { language } = usePrayerContext();
  const isAr = language === 'ar';
  const { toast } = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleJsonUpload = (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: isAr ? 'يجب أن يكون الملف بصيغة JSON' : 'File must be a .json file', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.prayers || !Array.isArray(parsed.prayers)) {
          throw new Error('Invalid format: missing prayers array');
        }
        setFormData(parsed as PrayerData);
        toast({ title: isAr ? 'تم بنجاح ✓' : 'File Loaded ✓', description: isAr ? 'تم تحميل الملف. راجع البيانات ثم اضغط حفظ.' : 'File loaded. Review data then click Save.' });
      } catch (err: any) {
        toast({ title: isAr ? 'خطأ في الملف' : 'Invalid JSON', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleJsonUpload(file);
  };
  
  const { data: initialData, refetch } = useGetPrayerData();
  const verifyMutation = useVerifyAdmin();
  const updateMutation = useUpdatePrayerData();

  const [formData, setFormData] = useState<PrayerData | null>(null);

  useEffect(() => {
    if (initialData) {
      // Deep copy to avoid mutating cache directly
      setFormData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyMutation.mutateAsync({ data: { password } });
      if (res.success) {
        setIsAuthenticated(true);
        toast({ title: "Success", description: "Logged in successfully." });
      } else {
        toast({ title: "Error", description: "Invalid password", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Login failed", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    try {
      const res = await updateMutation.mutateAsync({
        data: {
          adminPassword: password,
          mosque: formData.mosque,
          prayers: formData.prayers,
          news: formData.news,
          azkar: formData.azkar
        }
      });
      if (res.success) {
        toast({ title: "Success", description: "Data updated successfully." });
        refetch();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Update failed", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center w-full">
          <form onSubmit={handleLogin} className="glass-card p-8 rounded-3xl w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold font-display">{isAr ? 'لوحة الإدارة' : 'Admin Dashboard'}</h2>
              <p className="text-muted-foreground mt-2">{isAr ? 'أدخل كلمة المرور للمتابعة' : 'Enter password to continue'}</p>
            </div>
            
            <div className="space-y-4">
              <Input 
                type="password" 
                placeholder={isAr ? 'كلمة المرور' : 'Password'} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
                {verifyMutation.isPending ? <Loader2 className="animate-spin" /> : (isAr ? 'دخول' : 'Login')}
              </Button>
            </div>
          </form>
        </div>
      </Layout>
    );
  }

  if (!formData) return <Layout><Loader2 className="animate-spin mx-auto mt-20" /></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full pb-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-primary">{isAr ? 'إدارة البيانات' : 'Manage Data'}</h1>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            {isAr ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
        </div>

        {/* JSON Upload Section */}
        <div
          className={`mb-8 border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/60 bg-white/5'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleJsonUpload(f); e.target.value = ''; }}
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <FileJson className="text-primary w-7 h-7" />
            </div>
            <div>
              <p className="font-semibold text-lg">{isAr ? 'ارفع ملف JSON' : 'Upload JSON File'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? 'اسحب وأفلت الملف هنا أو انقر للاختيار' : 'Drag & drop your JSON file here, or click to browse'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="pointer-events-none mt-1" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <Upload className="w-4 h-4 mr-2" />
              {isAr ? 'اختر ملفاً' : 'Choose File'}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Mosque Info */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">{isAr ? 'معلومات المسجد' : 'Mosque Info'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Name (EN)</label>
                <Input value={formData.mosque.name} onChange={e => setFormData({...formData, mosque: {...formData.mosque, name: e.target.value}})} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Name (AR)</label>
                <Input dir="rtl" value={formData.mosque.nameAr} onChange={e => setFormData({...formData, mosque: {...formData.mosque, nameAr: e.target.value}})} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Address (EN)</label>
                <Input value={formData.mosque.address} onChange={e => setFormData({...formData, mosque: {...formData.mosque, address: e.target.value}})} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Address (AR)</label>
                <Input dir="rtl" value={formData.mosque.addressAr} onChange={e => setFormData({...formData, mosque: {...formData.mosque, addressAr: e.target.value}})} />
              </div>
            </div>
          </section>

          {/* Prayer Times */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">{isAr ? 'أوقات الصلاة' : 'Prayer Times'}</h2>
            <div className="space-y-4">
              {formData.prayers.map((prayer, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-background/50 p-4 rounded-xl border border-white/5">
                  <div className="w-32 font-semibold">{prayer.name}</div>
                  <Input 
                    type="time" 
                    className="w-40" 
                    value={prayer.time}
                    onChange={e => {
                      const newPrayers = [...formData.prayers];
                      newPrayers[idx].time = e.target.value;
                      setFormData({...formData, prayers: newPrayers});
                    }}
                  />
                  <div className="flex-1"></div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-primary"
                      checked={prayer.enabled}
                      onChange={e => {
                        const newPrayers = [...formData.prayers];
                        newPrayers[idx].enabled = e.target.checked;
                        setFormData({...formData, prayers: newPrayers});
                      }}
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* News */}
          <section className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{isAr ? 'الأخبار' : 'News'}</h2>
              <Button size="sm" variant="outline" onClick={() => {
                setFormData({
                  ...formData, 
                  news: [...formData.news, { id: Date.now().toString(), text: '', textAr: '' }]
                })
              }}>
                <Plus className="w-4 h-4 mr-1" /> Add News
              </Button>
            </div>
            <div className="space-y-4">
              {formData.news.map((item, idx) => (
                <div key={item.id} className="flex flex-col md:flex-row gap-4 bg-background/50 p-4 rounded-xl border border-white/5 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/20"
                    onClick={() => {
                      const newNews = formData.news.filter((_, i) => i !== idx);
                      setFormData({...formData, news: newNews});
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 pr-8">
                    <Input placeholder="Text (EN)" className="mb-2" value={item.text} onChange={e => {
                      const newNews = [...formData.news];
                      newNews[idx].text = e.target.value;
                      setFormData({...formData, news: newNews});
                    }} />
                    <Input placeholder="Text (AR)" dir="rtl" value={item.textAr} onChange={e => {
                      const newNews = [...formData.news];
                      newNews[idx].textAr = e.target.value;
                      setFormData({...formData, news: newNews});
                    }} />
                  </div>
                </div>
              ))}
              {formData.news.length === 0 && <p className="text-muted-foreground text-sm italic">No news items.</p>}
            </div>
          </section>

          {/* Azkar */}
          <section className="glass-panel p-6 rounded-2xl">
             <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{isAr ? 'الأذكار' : 'Azkar'}</h2>
              <Button size="sm" variant="outline" onClick={() => {
                setFormData({
                  ...formData, 
                  azkar: [...formData.azkar, { id: Date.now().toString(), text: '', textAr: '', source: '', sourceAr: '' }]
                })
              }}>
                <Plus className="w-4 h-4 mr-1" /> Add Azkar
              </Button>
            </div>
            <div className="space-y-4">
              {formData.azkar.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/50 p-4 rounded-xl border border-white/5 relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/20 z-10"
                    onClick={() => {
                      const newAzkar = formData.azkar.filter((_, i) => i !== idx);
                      setFormData({...formData, azkar: newAzkar});
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div className="space-y-2">
                    <Input placeholder="Text (EN)" value={item.text} onChange={e => {
                      const arr = [...formData.azkar]; arr[idx].text = e.target.value; setFormData({...formData, azkar: arr});
                    }} />
                    <Input placeholder="Source (EN)" value={item.source} onChange={e => {
                      const arr = [...formData.azkar]; arr[idx].source = e.target.value; setFormData({...formData, azkar: arr});
                    }} />
                  </div>
                  <div className="space-y-2 pr-8">
                    <Input placeholder="Text (AR)" dir="rtl" value={item.textAr} onChange={e => {
                      const arr = [...formData.azkar]; arr[idx].textAr = e.target.value; setFormData({...formData, azkar: arr});
                    }} />
                    <Input placeholder="Source (AR)" dir="rtl" value={item.sourceAr} onChange={e => {
                      const arr = [...formData.azkar]; arr[idx].sourceAr = e.target.value; setFormData({...formData, azkar: arr});
                    }} />
                  </div>
                </div>
              ))}
              {formData.azkar.length === 0 && <p className="text-muted-foreground text-sm italic">No azkar items.</p>}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
