import React, { useState } from 'react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  if (!isAuthenticated) {
    if (authMode === 'login') {
      return (
        <div className="bg-surface min-h-screen flex flex-col font-sans text-primary">
          {/* MainHeader */}
          <header className="w-full border-b border-outline-variant py-8 px-12">
            <div className="text-3xl tracking-tight cursor-pointer font-serif">
              RE Lodronio Builders Inc.
            </div>
          </header>

          {/* MainContent */}
          <main className="flex-grow flex items-center justify-center bg-surface flex-col">
            {/* LoginCard */}
            <section className="login-card bg-surface-container border border-outline-variant">
              {/* Card Heading */}
              <div className="mb-10">
                <h1 className="card-title font-serif mb-2">Admin access</h1>
                <p className="text-on-surface-variant text-sm">Log in to view contact tickets.</p>
              </div>

              {/* Login Form */}
              <form onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); }} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                  <input className="input-field" id="email" name="email" required type="email" />
                </div>
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
                  <input className="input-field" id="password" name="password" required type="password" />
                </div>
                {/* Submit Button */}
                <div className="pt-2">
                  <button className="w-full bg-primary text-white py-3 font-serif italic text-lg hover:bg-opacity-90 transition-colors" type="submit">
                    Log in
                  </button>
                </div>
              </form>

              {/* Card Footer Information */}
              <footer className="mt-6 text-center space-y-4">
                <p className="text-xs text-on-surface-variant">
                  Need an account? <button type="button" onClick={() => setAuthMode('signup')} className="underline hover:text-primary">Sign up</button>
                </p>
                <p className="text-[10px] leading-relaxed text-on-surface-variant text-left max-w-xs">
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
            <button type="button" onClick={() => setAuthMode('login')} className="text-sm underline text-on-surface-variant">Back to Login</button>
          </div>
        </div>
      );
    }
  }

  // DASHBOARD LAYOUT
  return (
    <div className="bg-surface min-h-screen flex flex-col text-primary">
      {/* MainHeader */}
      <header className="border-b border-outline-variant py-6 px-12 flex justify-between items-center bg-surface sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-sm">
            <span className="material-symbols-outlined text-white" style={{fontSize: "20px"}}>mail</span>
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight serif-title leading-none">RE Lodronio Builders Inc.</h1>
            <p className="text-[10px] tracking-[0.2em] text-on-surface-variant mt-1 uppercase">Admin • Inbox</p>
          </div>
        </div>
        <nav className="flex items-center gap-12">
          <div className="flex gap-8 text-[11px] font-semibold tracking-widest uppercase">
            <a className="text-primary border-b border-primary pb-1" href="#">Messages</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Settings</a>
          </div>
          <div className="flex items-center gap-6 border-l border-outline-variant pl-8">
            <div className="text-right">
              <p className="text-[11px] font-bold">Arch. Roco E. Lodronio</p>
              <p className="text-[9px] text-on-surface-variant tracking-widest uppercase">President</p>
            </div>
            <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-bold">RL</div>
            <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase ml-4 hover:text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Sign Out
            </button>
          </div>
        </nav>
      </header>
      
      <main className="flex-grow px-12 pt-12 pb-24">
        {/* InboxHero */}
        <div className="mb-16">
          <p className="text-[11px] tracking-[0.3em] text-on-surface-variant uppercase mb-4">(Inbox)</p>
          <div className="flex justify-between items-end">
            <div className="max-w-md">
              <h2 className="text-7xl serif-title leading-tight">Incoming<br /><span className="italic">conversations.</span></h2>
              <p className="mt-8 text-sm text-on-surface-variant leading-relaxed">
                Every message submitted from the contact form arrives here as a ticket. Review, reply, and update its status.
              </p>
            </div>
            {/* StatsGrid */}
            <div className="flex gap-16 pr-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  New
                </div>
                <span className="text-5xl serif-title">2</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  In Progress
                </div>
                <span className="text-5xl serif-title">2</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Resolved
                </div>
                <span className="text-5xl serif-title">1</span>
              </div>
            </div>
          </div>
        </div>
        <hr className="border-outline-variant mb-8" />
        
        {/* MainContentGrid */}
        <div className="grid grid-cols-12 gap-8">
          {/* LeftColumn (TicketList) */}
          <div className="col-span-5">
            <div className="flex gap-6 text-[10px] font-bold tracking-widest uppercase mb-8">
              <button className="border-b-2 border-primary pb-1">All <span className="text-on-surface-variant ml-1">(5)</span></button>
              <button className="text-on-surface-variant hover:text-primary">New <span className="ml-1">(2)</span></button>
              <button className="text-on-surface-variant hover:text-primary">In progress <span className="ml-1">(2)</span></button>
              <button className="text-on-surface-variant hover:text-primary">Resolved <span className="ml-1">(2)</span></button>
            </div>
            <div className="border border-outline-variant rounded-sm overflow-hidden bg-surface-container-lowest">
              <div className="bg-surface border-b border-outline-variant px-4 py-3">
                <p className="text-[9px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">5 Messages</p>
              </div>
              {/* Ticket Cards */}
              <div className="p-6 border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-on-surface-variant">RLB-2026-0814</span>
                  <span className="flex items-center gap-2 text-[10px] font-bold text-status-new">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-new"></span> New
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <h4 className="text-lg font-semibold">Maria Santos</h4>
                  <span className="text-[9px] text-on-surface-variant uppercase">Jul 4, 9:12 AM</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                  Site visit for two-storey residence — Good day. We are planning to build a two-storey residence in Santos Village Phase 3 and would like to request ...
                </p>
              </div>
              <div className="p-6 border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors bg-surface-container-lowest">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-on-surface-variant">RLB-2026-0183</span>
                  <span className="flex items-center gap-2 text-[10px] font-bold text-status-progress">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-progress"></span> In progress
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <h4 className="text-lg font-semibold">Jorge Villanueva</h4>
                  <span className="text-[9px] text-on-surface-variant uppercase">Jul 4, 4:44 PM</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                  Renovation of ancestral home — Hi, we're interested in restoring an ancestral home in Las Piñas. Can we schedule a consultation to discuss..
                </p>
              </div>
            </div>
          </div>
          
          {/* RightColumn (Message Detail) */}
          <div className="col-span-7">
            <div className="border border-outline-variant rounded-sm bg-surface-container-low h-full flex flex-col">
              <div className="px-8 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Ticket <span className="ml-2">RLB-2026-0180</span></span>
                <span className="flex items-center gap-2 text-[10px] font-bold text-status-progress uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-progress"></span> In progress
                </span>
              </div>
              <div className="bg-surface-container-lowest px-8 py-10 border-b border-outline-variant">
                <div className="grid grid-cols-2 gap-y-8">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Miguel Cruz</h3>
                    <a className="text-sm font-semibold underline decoration-1 underline-offset-4" href="mailto:m.cruz@studio-cruz.co">m.cruz@studio-cruz.co</a>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">Received</p>
                    <p className="text-lg font-semibold">Jun 30, 2:22 PM</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-lg font-semibold">Collaboration Inquiry</p>
                  </div>
                </div>
              </div>
              <div className="flex-grow p-8 bg-surface-container-lowest">
                <p className="text-[9px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-6">Message</p>
                <p className="text-base text-primary leading-relaxed max-w-2xl">
                  Our studio would like to explore a partnership for an upcoming commercial project in Alabang. When would be a good time to meet?
                </p>
              </div>
              <div className="p-6 bg-surface-container-low border-t border-outline-variant flex justify-between">
                <div className="flex gap-2">
                  <button className="px-6 py-2.5 border border-outline-variant bg-surface-container-lowest text-[10px] font-bold tracking-widest uppercase hover:bg-surface-container-low transition-colors">Mark New</button>
                  <button className="px-6 py-2.5 border border-outline-variant bg-surface-container-lowest text-[10px] font-bold tracking-widest uppercase hover:bg-surface-container-low transition-colors">In Progress</button>
                  <button className="px-8 py-2.5 bg-primary text-on-primary text-[10px] font-bold tracking-widest uppercase hover:bg-opacity-90 transition-colors">Resolve</button>
                </div>
                <div className="flex gap-2">
                  <button className="px-8 py-2.5 bg-primary text-on-primary text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-opacity-90 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">reply</span>
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-outline-variant px-12 py-10 flex justify-between items-center text-[11px] font-bold tracking-widest uppercase">
        <p>© 2026 RE Lodronio Builders Inc</p>
        <p>Building with purpose, since 2008</p>
      </footer>
    </div>
  );
}

export default App;
