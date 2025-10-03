'use client';
import { useEffect, useMemo, useState } from 'react';

const EQUIP = [
  { key: 'projector', label: 'プロジェクタ', icon: '📽️' },
  { key: 'tvconf', label: 'TV会議システム', icon: '📺' },
  { key: 'whiteboard', label: 'ホワイトボード', icon: '📋' },
] as const;

type Candidate = { room: { id: string; name: string; capacity: number; equipment: string[] }; score: number };

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  const [duration, setDuration] = useState(60);
  const [attendees, setAttendees] = useState(6);
  // ISO(UTC) をAPIに送る実値
  const [startFrom, setStartFrom] = useState<string>('');
  // UI表示用のローカル日時 (YYYY-MM-DDTHH:mm)
  const [startLocal, setStartLocal] = useState<string>('');
  const [reqEquip, setReqEquip] = useState<string[]>(['projector']);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [reservations, setReservations] = useState<any[]>([]);

  const canSearch = useMemo(() => !!startFrom && duration>=15 && attendees>=1, [startFrom, duration, attendees]);

  const toggleEquip = (key: string) => {
    setReqEquip(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev, key]);
  };

  // 15分丸め（最も近い15分へ）
  const roundTo15 = (d: Date): Date => {
    const minutes = d.getMinutes();
    const rounded = Math.round(minutes / 15) * 15;
    const out = new Date(d);
    out.setSeconds(0, 0);
    out.setMinutes(rounded);
    return out;
  };

  // 初期値: 現在時刻を15分丸めして設定（初回表示時のみ）
  useEffect(() => {
    if (!startLocal && !startFrom) {
      const now = new Date();
      const rounded = roundTo15(now);
      setStartLocal(toLocalInput(rounded));
      setStartFrom(rounded.toISOString());
    }
  }, [startLocal, startFrom]);

  // 'YYYY-MM-DDTHH:mm' -> Date(ローカル)
  const parseLocalInput = (s: string): Date | null => {
    if (!s) return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return null;
    const [, yy, mm, dd, hh, mi] = m;
    return new Date(Number(yy), Number(mm)-1, Number(dd), Number(hh), Number(mi), 0, 0);
  };

  // Date -> 'YYYY-MM-DDTHH:mm'（ローカル）
  const toLocalInput = (d: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth()+1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${mi}`;
  };

  // onChange: ローカル入力を受け取り、15分丸めしてUI/ISOを更新
  const onChangeStartLocal = (value: string) => {
    setMessage('');
    setCandidates([]);
    const parsed = parseLocalInput(value);
    if (!parsed) {
      setStartLocal(value);
      setStartFrom('');
      return;
    }
    const rounded = roundTo15(parsed);
    setStartLocal(toLocalInput(rounded));
    setStartFrom(rounded.toISOString());
  };

  const search = async () => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch(`${apiBase}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: duration, attendees, requiredEquipment: reqEquip, startFrom })
      });
      const json = await res.json();
      setCandidates(json.candidates ?? []);
    } catch (e) {
      setMessage('検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const reserve = async (roomId: string, title: string) => {
    setLoading(true); setMessage('');
    try {
      const start = new Date(startFrom);
      const end = new Date(start.getTime() + duration*60000);
      const res = await fetch(`${apiBase}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, title, start: start.toISOString(), end: end.toISOString(), attendees })
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error || `予約に失敗しました (${res.status})`);
      }
      setMessage('予約が作成されました');
      await Promise.all([search(), fetchReservations()]);
    } catch (e:any) {
      setMessage(e.message || '予約に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await fetch(`${apiBase}/api/reservations`);
      const json = await res.json();
      setReservations(json.reservations ?? []);
    } catch {
      // noop
    }
  };

  const cancelReservation = async (id: string) => {
    setLoading(true); setMessage('');
    try {
      const res = await fetch(`${apiBase}/api/reservations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('取消に失敗しました');
      await Promise.all([fetchReservations(), search()]);
    } catch (e:any) {
      setMessage(e.message || '取消に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <main className="relative z-10 p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            会議室予約システム
          </h1>
          <p className="text-gray-600 text-lg">最適な会議室を見つけて、簡単に予約しましょう</p>
        </div>

        {/* Search Form */}
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-lg">📅</span>
                開始日時（15分単位）
              </label>
              <input 
                type="datetime-local" 
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300" 
                value={startLocal} 
                onChange={e=>onChangeStartLocal(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                所要時間 (分)
              </label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300" 
                value={duration} 
                min={15} 
                step={15} 
                max={120} 
                onChange={e=>setDuration(parseInt(e.target.value||'0'))} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-lg">👥</span>
                参加人数
              </label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300" 
                value={attendees} 
                min={1} 
                onChange={e=>setAttendees(parseInt(e.target.value||'0'))} 
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-lg">🔧</span>
                必須設備
              </label>
              <div className="flex flex-wrap gap-3">
                {EQUIP.map(eq => (
                  <label key={eq.key} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={reqEquip.includes(eq.key)} 
                        onChange={()=>toggleEquip(eq.key)} 
                      />
                      <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 ${
                        reqEquip.includes(eq.key) 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent' 
                          : 'bg-white/50 border-white/30 group-hover:border-blue-300'
                      }`}>
                        {reqEquip.includes(eq.key) && (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {eq.icon} {eq.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              disabled={!canSearch || loading} 
              onClick={search} 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none transition-all duration-300 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  検索中...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  候補を検索
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-4 shadow-lg">
            <p className={`text-sm text-center ${message.includes('失敗') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          </div>
        )}

        {/* Candidates */}
        <div className="space-y-4">
          {loading && (
            <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-8 shadow-lg text-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          )}
          
          {(!loading && candidates.length===0) && (
            <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-8 shadow-lg text-center">
              <p className="text-gray-500 text-lg">候補はありません</p>
            </div>
          )}
          
          <div className="grid gap-4">
            {candidates.map((c, index) => (
              <div 
                key={c.room.id} 
                className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {c.room.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-800">{c.room.name}</h3>
                        <p className="text-gray-600">定員: {c.room.capacity}人</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {c.room.equipment.map((eq, i) => {
                        const equipInfo = EQUIP.find(e => e.key === eq);
                        return (
                          <span key={i} className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-lg">
                            {equipInfo?.icon} {equipInfo?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button 
                    onClick={()=>reserve(c.room.id, `Meeting @ ${c.room.name}`)} 
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <span>📅</span>
                    予約する
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservations */}
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              予約一覧
            </h2>
            <button 
              onClick={fetchReservations} 
              className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl text-gray-700 hover:bg-white/70 transition-all duration-300 flex items-center gap-2"
            >
              <span>🔄</span>
              再読み込み
            </button>
          </div>
          
          {reservations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-gray-500 text-lg">予約はありません</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reservations.map((r, index) => (
                <div 
                  key={r.id} 
                  className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gray-800">{r.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📅 {new Date(r.start).toLocaleString('ja-JP')} - {new Date(r.end).toLocaleString('ja-JP')}</p>
                        <p>🏢 部屋ID: {r.roomId} | 👥 人数: {r.attendees}</p>
                      </div>
                    </div>
                    <button 
                      onClick={()=>cancelReservation(r.id)} 
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                      <span>❌</span>
                      取消
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}