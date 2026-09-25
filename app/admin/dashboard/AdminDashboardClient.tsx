'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const CATS = [
  { label: 'Corporate',       fee: 'Rs. 30,000' },
  { label: 'Executive',       fee: 'Rs. 5,000'  },
  { label: 'Associate',       fee: 'Rs. 2,000'  },
  { label: 'Overseas',        fee: 'USD 100'    },
  { label: 'Women',           fee: 'Rs. 3,000'  },
  { label: 'Student',         fee: 'Free'       },
  { label: 'Honorary Member', fee: 'Free'       },
];

const CAT_COLOR: Record<string,string> = {
  Corporate:'#2563eb', Executive:'#7c3aed', Associate:'#ea580c',
  Overseas:'#0891b2', Women:'#db2777', Student:'#ca8a04', 'Honorary Member':'#16a34a',
};

const EMPTY: Record<string,string> = {
  membershipNo:'', firstName:'', lastName:'', fatherName:'', address:'',
  district:'', phoneNo:'', emailAddress:'', cnicNo:'', ntnNumber:'',
  membershipCategory:'Corporate', membershipFee:'Rs. 30,000',
  businessName:'', businessType:'', status:'active',
  joinedAt: new Date().toISOString().slice(0,10),
};

interface Member {
  _id:string; membershipNo:string; firstName:string; lastName:string; fatherName?:string;
  address:string; district:string; phoneNo:string; emailAddress?:string; cnicNo:string;
  ntnNumber?:string; membershipCategory:string; membershipFee:string;
  businessName?:string; businessType?:string; photo?:string; status:string; joinedAt:string;
}

/* ── icons ── */
const Leaf = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
const Plus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ChevDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const Search = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const Trash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const LogOut = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const Upload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const Users = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const Spinner = () => <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4"/><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity=".75"/></svg>;

function Field({ label, id, value, onChange, placeholder, required, type='text' }:
  { label:string; id:string; value:string; onChange:(v:string)=>void; placeholder?:string; required?:boolean; type?:string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
      <input id={id} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"/>
    </div>
  );
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [members,       setMembers]       = useState<Member[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [tSearch,       setTSearch]       = useState('');
  const [tCat,          setTCat]          = useState('All');
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState({...EMPTY});
  const [photoFile,     setPhotoFile]     = useState<File|null>(null);
  const [photoPreview,  setPhotoPreview]  = useState('');
  const [formErr,       setFormErr]       = useState('');
  const [formOk,        setFormOk]        = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [deletingId,    setDeletingId]    = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/members');
      if (r.status === 401) { router.push('/admin/login'); return; }
      setMembers(await r.json());
    } catch { /**/ } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const total    = members.length;
  const catCount = CATS.reduce<Record<string,number>>((a,c) => { a[c.label]=members.filter(m=>m.membershipCategory===c.label).length; return a; }, {});

  const rows = members.filter(m => {
    const ok = tCat==='All' || m.membershipCategory===tCat;
    const t  = tSearch.toLowerCase();
    return ok && (!t || `${m.firstName} ${m.lastName}`.toLowerCase().includes(t) || m.membershipNo.toLowerCase().includes(t) || m.cnicNo.includes(t) || m.district.toLowerCase().includes(t));
  });

  const reset = () => { setForm({...EMPTY}); setPhotoFile(null); setPhotoPreview(''); setFormErr(''); setFormOk(''); if(fileRef.current) fileRef.current.value=''; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr(''); setFormOk(''); setSubmitting(true);
    try {
      let photoUrl = '';
      if (photoFile) {
        const fd = new FormData(); fd.append('photo', photoFile);
        const ur = await fetch('/api/upload',{method:'POST',body:fd}); const ud=await ur.json();
        if (!ur.ok) { setFormErr(ud.error??'Photo upload failed.'); setSubmitting(false); return; }
        photoUrl = ud.url;
      }
      const r = await fetch('/api/admin/members',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,photo:photoUrl||undefined,joinedAt:form.joinedAt?new Date(form.joinedAt).toISOString():new Date().toISOString()})});
      const d = await r.json();
      if (!r.ok) setFormErr(d.error??'Failed to add member.');
      else { setFormOk(`"${form.firstName} ${form.lastName}" added.`); reset(); await load(); setTimeout(()=>document.getElementById('tbl')?.scrollIntoView({behavior:'smooth',block:'start'}),300); }
    } catch { setFormErr('Something went wrong.'); } finally { setSubmitting(false); }
  };

  const del = async (id:string, name:string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try { const r=await fetch(`/api/members/${id}`,{method:'DELETE'}); if(!r.ok){const d=await r.json();alert(d.error??'Failed.');} else setMembers(p=>p.filter(m=>m._id!==id)); }
    catch { alert('Failed.'); } finally { setDeletingId(null); }
  };

  const logout = async () => { await fetch('/api/auth/logout',{method:'POST'}); router.push('/admin/login'); };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-800 flex items-center justify-center text-white"><Leaf /></div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">CFA Pakistan</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/directory" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 px-3 py-1.5 rounded-md hover:bg-green-50 transition-colors font-medium">
              <Users /> Directory
            </Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">
              <LogOut /><span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-6">

        {/* PAGE TITLE */}
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage CFA Pakistan membership records</p>
        </div>

        {/* STATS */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="col-span-2 bg-green-800 text-white rounded-xl p-4">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-green-200 mt-1 font-medium">Total Members</p>
            </div>
            {CATS.map(c => (
              <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                <p className="text-xl font-bold text-gray-900">{catCount[c.label]??0}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium leading-tight">{c.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ADD MEMBER */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => { setShowForm(v=>!v); if(!showForm) setTimeout(()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),60); }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-green-800 text-white flex items-center justify-center"><Plus /></div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Add New Member</p>
                <p className="text-xs text-gray-400">Register a new CFA Pakistan member</p>
              </div>
            </div>
            <span className={`text-gray-400 transition-transform duration-200 ${showForm ? 'rotate-180' : ''}`}><ChevDown /></span>
          </button>

          {showForm && (
            <div ref={formRef} className="border-t border-gray-100 p-6">
              {formErr && <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"><svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>{formErr}</div>}
              {formOk  && <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 font-semibold"><svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 20 20" fill="#16a34a"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>{formOk}</div>}

              <form onSubmit={handleSubmit} noValidate>
                {/* photo */}
                <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
                    {photoPreview
                      ? <img src={photoPreview} alt="" className="w-full h-full object-cover"/>
                      : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    }
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f){setPhotoFile(f);setPhotoPreview(URL.createObjectURL(f));}}} className="hidden" id="ph"/>
                    <label htmlFor="ph" className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                      <Upload /> Choose Photo
                    </label>
                    <p className="text-[11px] text-gray-400 mt-1.5">JPEG, PNG, WebP · Max 5 MB · Optional</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Membership No *" id="mn" value={form.membershipNo} onChange={v=>setForm(p=>({...p,membershipNo:v}))} placeholder="CFA-001" required/>
                  <Field label="First Name *"     id="fn" value={form.firstName}   onChange={v=>setForm(p=>({...p,firstName:v}))}   placeholder="First name" required/>
                  <Field label="Last Name *"      id="ln" value={form.lastName}    onChange={v=>setForm(p=>({...p,lastName:v}))}    placeholder="Last name"  required/>
                  <Field label="Father's Name"    id="fa" value={form.fatherName}  onChange={v=>setForm(p=>({...p,fatherName:v}))}  placeholder="Father's name"/>
                  <Field label="CNIC *"           id="cn" value={form.cnicNo}      onChange={v=>setForm(p=>({...p,cnicNo:v}))}      placeholder="35201-1234567-1" required/>
                  <Field label="Phone *"          id="ph2"value={form.phoneNo}     onChange={v=>setForm(p=>({...p,phoneNo:v}))}     placeholder="03XX-XXXXXXX" required/>
                  <Field label="Email"            id="em" value={form.emailAddress}onChange={v=>setForm(p=>({...p,emailAddress:v}))}placeholder="email@example.com" type="email"/>
                  <Field label="NTN"              id="nt" value={form.ntnNumber}   onChange={v=>setForm(p=>({...p,ntnNumber:v}))}   placeholder="NTN number"/>
                  <div>
                    <label htmlFor="mc" className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Category *</label>
                    <select id="mc" value={form.membershipCategory} onChange={e=>{const c=e.target.value;setForm(p=>({...p,membershipCategory:c,membershipFee:CATS.find(x=>x.label===c)?.fee??''}));}} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                      {CATS.map(c=><option key={c.label} value={c.label}>{c.label} — {c.fee}</option>)}
                    </select>
                  </div>
                  <Field label="Fee *"      id="mf" value={form.membershipFee} onChange={v=>setForm(p=>({...p,membershipFee:v}))} placeholder="Rs. 5,000" required/>
                  <Field label="District *" id="di" value={form.district}      onChange={v=>setForm(p=>({...p,district:v}))}      placeholder="e.g. Lahore" required/>
                  <Field label="Business"   id="bn" value={form.businessName}  onChange={v=>setForm(p=>({...p,businessName:v}))}  placeholder="Company name"/>
                  <Field label="Biz. Type"  id="bt" value={form.businessType}  onChange={v=>setForm(p=>({...p,businessType:v}))}  placeholder="Import/Export"/>
                  <div>
                    <label htmlFor="st" className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Status</label>
                    <select id="st" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                      <option value="active">Active</option><option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <Field label="Joined Date" id="jd" value={form.joinedAt} onChange={v=>setForm(p=>({...p,joinedAt:v}))} type="date"/>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label htmlFor="ad" className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Address *</label>
                    <textarea id="ad" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} rows={2} placeholder="Full address" required className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white"/>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 pt-4 border-t border-gray-100">
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-60" style={{background:'#166534'}}>
                    {submitting ? <><Spinner /> Adding…</> : <><Plus /> Add Member</>}
                  </button>
                  <button type="button" onClick={reset} className="px-5 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* TABLE */}
        <section id="tbl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-gray-900">All Members <span className="text-gray-400 font-normal">({rows.length})</span></h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><Search /></div>
                <input type="text" value={tSearch} onChange={e=>setTSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-44 bg-white"/>
              </div>
              <select value={tCat} onChange={e=>setTCat(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                <option value="All">All Categories</option>
                {CATS.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2.5 py-16 text-gray-400 text-sm"><Spinner /> Loading…</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-30"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <p className="text-sm font-medium text-gray-500">No members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Member</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">Category</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">No.</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">CNIC</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">District</th>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden xl:table-cell">Joined</th>
                      <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map(m => {
                      const src = m.photo ? (m.photo.startsWith('http') ? m.photo : `/${m.photo.replace(/^\//, '')}`) : null;
                      const acc = CAT_COLOR[m.membershipCategory] ?? '#4b5563';
                      const ini = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
                      return (
                        <tr key={m._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{background: acc}}>
                                {src ? <Image src={src} alt="" fill className="object-cover" sizes="32px"/> : <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">{ini}</div>}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-[130px]">{m.firstName} {m.lastName}</p>
                                <p className="text-[11px] text-gray-400 sm:hidden">{m.membershipCategory}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{background:`${acc}18`,color:acc}}>{m.membershipCategory}</span>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell">
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{m.membershipNo}</span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400 font-mono hidden lg:table-cell">{m.cnicNo}</td>
                          <td className="px-5 py-3 text-xs text-gray-400 hidden lg:table-cell">{m.district}</td>
                          <td className="px-5 py-3 text-xs text-gray-400 hidden xl:table-cell">{new Date(m.joinedAt).toLocaleDateString('en-PK',{year:'numeric',month:'short',day:'numeric'})}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => del(m._id,`${m.firstName} ${m.lastName}`)}
                              disabled={deletingId===m._id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                            >
                              {deletingId===m._id ? <Spinner/> : <Trash/>}
                              <span className="hidden sm:inline">{deletingId===m._id?'…':'Delete'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {!loading && rows.length > 0 && (
            <p className="text-xs text-gray-400 mt-2.5 text-right">{rows.length} of {total} members</p>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-10 py-5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} Chamber of Food and Agriculture Pakistan</span>
          <Link href="/directory" className="text-green-700 hover:text-green-900 font-semibold transition-colors">View Directory →</Link>
        </div>
      </footer>
    </div>
  );
}
