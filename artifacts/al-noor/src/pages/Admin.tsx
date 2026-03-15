import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { usePrayerContext } from '@/context/PrayerContext';
import { useVerifyAdmin, useUpdatePrayerData, useGetPrayerData } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import type { PrayerData } from '@workspace/api-client-react';

export default function Admin() {
  const { language } = usePrayerContext();
  const isAr = language === 'ar';
  const { toast } = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
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
