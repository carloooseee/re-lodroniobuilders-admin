import React, { useState } from 'react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  if (!isAuthenticated) {
    if (authMode === 'login') {
      return (
        <div className="bg-white min-h-screen flex flex-col font-sans text-black">
          {/* MainHeader */}
          <header className="w-full border-b border-black py-8 px-12">
            <div className="text-3xl tracking-tight cursor-pointer font-serif">
              RE Lodronio Builders Inc.
            </div>
          </header>

          {/* MainContent */}
          <main className="flex-grow flex items-center justify-center bg-white flex-col">
            {/* LoginCard */}
            <section className="login-card bg-[#efedea] border border-[#d1d1cf]">
              {/* Card Heading */}
              <div className="mb-10">
                <h1 className="card-title font-serif mb-2">Admin access</h1>
                <p className="text-gray-600 text-sm">Log in to view contact tickets.</p>
              </div>

              {/* Login Form */}
              <form onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                  <input className="w-full border border-[#d1d1cf] bg-white p-2 text-sm focus:ring-0 focus:border-black outline-none transition-colors h-10" id="email" name="email" required type="email" />
                </div>
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
                  <input className="w-full border border-[#d1d1cf] bg-white p-2 text-sm focus:ring-0 focus:border-black outline-none transition-colors h-10" id="password" name="password" required type="password" />
                </div>
                {/* Submit Button */}
                <div className="pt-2">
                  <button className="w-full bg-black text-white py-3 font-serif italic text-lg hover:bg-zinc-800 transition-colors" type="submit">
                    Log in
                  </button>
                </div>
              </form>

              {/* Card Footer Information */}
              <footer className="mt-6 text-center space-y-4">
                <p className="text-xs text-gray-600">
                  Need an account? <button type="button" onClick={() => setAuthMode('signup')} className="underline hover:text-black">Sign up</button>
                </p>
                <p className="text-[10px] leading-relaxed text-gray-500 text-left max-w-xs">
                  Note: New accounts have no admin access until granted. Contact the site owner to be added as an admin.
                </p>
              </footer>
            </section>
          </main>
        </div>
      );
    } else {
      return (
        <div className="bg-surface text-primary min-h-screen flex flex-col font-sans">
          {/* MainHeader */}
          <header className="w-full border-b border-outline-variant bg-surface">
            <div className="flex justify-between items-center h-24 px-margin-desktop max-w-container-max mx-auto">
              <div className="text-3xl tracking-tight cursor-pointer font-serif">
                RE Lodronio Builders Inc.
              </div>
            </div>
          </header>

          {/* MainContent */}
          <main className="flex-grow flex items-center justify-center py-20 px-4">
            {/* SignUpCard */}
            <section className="form-card">
              <header className="mb-10">
                <h1 className="text-5xl mb-2 font-serif">Sign up</h1>
                <p className="text-on-surface-variant text-lg">Fill in details</p>
              </header>
              <form onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }} className="space-y-6">
                {/* Row for First & Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name">First Name</label>
                    <input className="input-field" id="first-name" name="first-name" required type="text" />
                  </div>
                  <div>
                    <label htmlFor="last-name">Last Name</label>
                    <input className="input-field" id="last-name" name="last-name" required type="text" />
                  </div>
                </div>
                {/* Email address */}
                <div>
                  <label htmlFor="email">Email address</label>
                  <input className="input-field" id="email" name="email" required type="email" />
                </div>
                {/* Password */}
                <div>
                  <label htmlFor="password">Password</label>
                  <input className="input-field" id="password" name="password" required type="password" />
                </div>
                {/* Role Dropdown */}
                <div>
                  <label htmlFor="role">Role</label>
                  <select className="input-field select-field" id="role" name="role" defaultValue="">
                    <option disabled value=""></option>
                    <option value="admin">Administrator</option>
                    <option value="manager">Project Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                {/* Department Dropdown */}
                <div>
                  <label htmlFor="department">Department</label>
                  <select className="input-field select-field" id="department" name="department" defaultValue="hr">
                    <option value="hr">Human Resources</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                    <option value="engineering">Engineering</option>
                  </select>
                </div>
                {/* Submit Button */}
                <div className="pt-4">
                  <button className="w-full bg-primary text-white py-4 text-lg hover:bg-opacity-90 transition-opacity uppercase tracking-widest font-light" type="submit">
                    Sign up
                  </button>
                </div>
              </form>
            </section>
          </main>
          
          <div className="text-center pb-8">
            <button type="button" onClick={() => setAuthMode('login')} className="text-sm underline text-gray-500">Back to Login</button>
          </div>
        </div>
      );
    }
  }

  // DASHBOARD LAYOUT
  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* MainHeader */}
      <header className="border-b border-brand-border py-6 px-12 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black flex items-center justify-center rounded-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight serif-title leading-none">RE Lodronio Builders Inc.</h1>
            <p className="text-[10px] tracking-[0.2em] text-gray-500 mt-1 uppercase">Admin • Inbox</p>
          </div>
        </div>
        <nav className="flex items-center gap-12">
          <div className="flex gap-8 text-[11px] font-semibold tracking-widest uppercase">
            <a className="text-black border-b border-black pb-1" href="#">Messages</a>
            <a className="text-gray-400 hover:text-black transition-colors" href="#">Settings</a>
          </div>
          <div className="flex items-center gap-6 border-l border-brand-border pl-8">
            <div className="text-right">
              <p className="text-[11px] font-bold">Arch. Roco E. Lodronio</p>
              <p className="text-[9px] text-gray-400 tracking-widest uppercase">President</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">RL</div>
            <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase ml-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              Sign Out
            </button>
          </div>
        </nav>
      </header>
      
      <main className="flex-grow px-12 pt-12 pb-24">
        {/* InboxHero */}
        <div className="mb-16">
          <p className="text-[11px] tracking-[0.3em] text-gray-400 uppercase mb-4">(Inbox)</p>
          <div className="flex justify-between items-end">
            <div className="max-w-md">
              <h2 className="text-7xl serif-title leading-tight">Incoming<br /><span className="italic">conversations.</span></h2>
              <p className="mt-8 text-sm text-gray-500 leading-relaxed">
                Every message submitted from the contact form arrives here as a ticket. Review, reply, and update its status.
              </p>
            </div>
            {/* StatsGrid */}
            <div className="flex gap-16 pr-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  New
                </div>
                <span className="text-5xl serif-title">2</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  In Progress
                </div>
                <span className="text-5xl serif-title">2</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  Resolved
                </div>
                <span className="text-5xl serif-title">1</span>
              </div>
            </div>
          </div>
        </div>
        <hr className="border-brand-border mb-8" />
        
        {/* MainContentGrid */}
        <div className="grid grid-cols-12 gap-8">
          {/* LeftColumn (TicketList) */}
          <div className="col-span-5">
            <div className="flex gap-6 text-[10px] font-bold tracking-widest uppercase mb-8">
              <button className="border-b-2 border-black pb-1">All <span className="text-gray-400 ml-1">(5)</span></button>
              <button className="text-gray-400 hover:text-black">New <span className="ml-1">(2)</span></button>
              <button className="text-gray-400 hover:text-black">In progress <span className="ml-1">(2)</span></button>
              <button className="text-gray-400 hover:text-black">Resolved <span className="ml-1">(2)</span></button>
            </div>
            <div className="border border-brand-border rounded-sm overflow-hidden bg-white">
              <div className="bg-gray-50 border-b border-brand-border px-4 py-3">
                <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">5 Messages</p>
              </div>
              {/* Ticket Cards */}
              <div className="p-6 border-b border-brand-border hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-gray-400">RLB-2026-0814</span>
                  <span className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-black"></span> New
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <h4 className="text-lg font-semibold">Maria Santos</h4>
                  <span className="text-[9px] text-gray-400 uppercase">Jul 4, 9:12 AM</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                  Site visit for two-storey residence — Good day. We are planning to build a two-storey residence in Santos Village Phase 3 and would like to request ...
                </p>
              </div>
              <div className="p-6 border-b border-brand-border hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-gray-400">RLB-2026-0183</span>
                  <span className="flex items-center gap-2 text-[10px] font-bold text-orange-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> In progress
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <h4 className="text-lg font-semibold">Jorge Villanueva</h4>
                  <span className="text-[9px] text-gray-400 uppercase">Jul 4, 4:44 PM</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                  Renovation of ancestral home — Hi, we're interested in restoring an ancestral home in Las Piñas. Can we schedule a consultation to discuss..
                </p>
              </div>
            </div>
          </div>
          
          {/* RightColumn (Message Detail) */}
          <div className="col-span-7">
            <div className="border border-brand-border rounded-sm bg-gray-50 h-full flex flex-col">
              <div className="px-8 py-4 border-b border-brand-border flex justify-between items-center bg-white">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Ticket <span className="ml-2">RLB-2026-0180</span></span>
                <span className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> In progress
                </span>
              </div>
              <div className="bg-white px-8 py-10 border-b border-brand-border">
                <div className="grid grid-cols-2 gap-y-8">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Miguel Cruz</h3>
                    <a className="text-sm font-semibold underline decoration-1 underline-offset-4" href="mailto:m.cruz@studio-cruz.co">m.cruz@studio-cruz.co</a>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">Received</p>
                    <p className="text-lg font-semibold">Jun 30, 2:22 PM</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-lg font-semibold">Collaboration Inquiry</p>
                  </div>
                </div>
              </div>
              <div className="flex-grow p-8 bg-white">
                <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-6">Message</p>
                <p className="text-base text-gray-800 leading-relaxed max-w-2xl">
                  Our studio would like to explore a partnership for an upcoming commercial project in Alabang. When would be a good time to meet?
                </p>
              </div>
              <div className="p-6 bg-gray-50 border-t border-brand-border flex justify-between">
                <div className="flex gap-2">
                  <button className="px-6 py-2.5 border border-brand-border bg-white text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition-colors">Mark New</button>
                  <button className="px-6 py-2.5 border border-brand-border bg-white text-[10px] font-bold tracking-widest uppercase hover:bg-gray-50 transition-colors">In Progress</button>
                  <button className="px-8 py-2.5 bg-black text-white text-[10px] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">Resolve</button>
                </div>
                <div className="flex gap-2">
                  <button className="px-8 py-2.5 bg-black text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-brand-border px-12 py-10 flex justify-between items-center text-[11px] font-bold tracking-widest uppercase">
        <p>© 2026 RE Lodronio Builders Inc</p>
        <p>Building with purpose, since 2008</p>
      </footer>
    </div>
  );
}

export default App;
