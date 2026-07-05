import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, onSnapshot, orderBy, updateDoc } from 'firebase/firestore';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateError, setUpdateError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('hr');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Fetch user data from firestore
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      } else {
        setIsAuthenticated(false);
        setUserData(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = [];
        querySnapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgs);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
      setSelectedMessage(null);
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email,
        role,
        department,
        createdAt: new Date().toISOString()
      });
      
      setUserData({ firstName, lastName, email, role, department });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedMessage) return;
    setUpdateError('');
    try {
      await updateDoc(doc(db, 'messages', selectedMessage.id), { status });
      setSelectedMessage(prev => ({ ...prev, status }));
    } catch (err) {
      console.error("Error updating status:", err);
      setUpdateError(err.message || 'Failed to update status. Check your Firestore Security Rules.');
    }
  };

  const handleReplyEmail = () => {
    if (!selectedMessage) return;
    
    const recipient = selectedMessage.email;
    const subject = encodeURIComponent(`Re: ${selectedMessage.subject || 'Inquiry'}`);
    
    const dateStr = selectedMessage.createdAt 
      ? new Date(selectedMessage.createdAt.seconds ? selectedMessage.createdAt.seconds * 1000 : (typeof selectedMessage.createdAt === 'string' ? selectedMessage.createdAt : selectedMessage.createdAt)).toLocaleString()
      : 'N/A';

    const bodyTemplate = `Hi ${selectedMessage.name ? selectedMessage.name.split(' ')[0] : 'there'},\n\n\n\n---\nOriginal Message:\nFrom: ${selectedMessage.name || ''} <${selectedMessage.email || ''}>\nDate: ${dateStr}\nSubject: ${selectedMessage.subject || ''}\n\n${selectedMessage.message || ''}`;
    
    const body = encodeURIComponent(bodyTemplate);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  const filteredMessages = messages.filter(msg => {
    if (statusFilter === 'all') return true;
    const status = msg.status || 'new';
    return status === statusFilter;
  });

  if (isAuthLoading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center font-sans text-primary">
        <p className="text-on-surface-variant text-lg">Loading...</p>
      </div>
    );
  }

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
              <form onSubmit={handleLogin} className="space-y-6">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                  <input className="input-field" id="email" name="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
                  <input className="input-field" id="password" name="password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {/* Submit Button */}
                <div className="pt-2">
                  <button className="w-full bg-primary text-white py-3 font-serif italic text-lg hover:bg-opacity-90 transition-colors" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log in'}
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
              <form onSubmit={handleSignup} className="space-y-6">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {/* Row for First & Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name">First Name</label>
                    <input className="input-field" id="first-name" name="first-name" required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="last-name">Last Name</label>
                    <input className="input-field" id="last-name" name="last-name" required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                {/* Email address */}
                <div>
                  <label htmlFor="email">Email address</label>
                  <input className="input-field" id="email" name="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {/* Password */}
                <div>
                  <label htmlFor="password">Password</label>
                  <input className="input-field" id="password" name="password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {/* Role Dropdown */}
                <div>
                  <label htmlFor="role">Role</label>
                  <select className="input-field select-field" id="role" name="role" required value={role} onChange={(e) => setRole(e.target.value)}>
                    <option disabled value=""></option>
                    <option value="admin">Administrator</option>
                    <option value="manager">Project Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                {/* Department Dropdown */}
                <div>
                  <label htmlFor="department">Department</label>
                  <select className="input-field select-field" id="department" name="department" required value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="hr">Human Resources</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                    <option value="engineering">Engineering</option>
                    <option value="information-technology">Information Technology</option>
                  </select>
                </div>
                {/* Submit Button */}
                <div className="pt-4">
                  <button className="w-full bg-primary text-white py-4 text-lg hover:bg-opacity-90 transition-opacity uppercase tracking-widest font-light" type="submit" disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign up'}
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
            <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>mail</span>
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
              <p className="text-[11px] font-bold">{userData ? `${userData.firstName} ${userData.lastName}` : 'Admin User'}</p>
              <p className="text-[9px] text-on-surface-variant tracking-widest uppercase">{userData ? userData.role : 'Administrator'}</p>
            </div>
            <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-bold">
              {userData ? `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase() : 'AU'}
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase ml-4 hover:text-on-surface-variant transition-colors">
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
                <span className="text-5xl serif-title">{messages.filter(m => m.status === 'new' || !m.status).length}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  In Progress
                </div>
                <span className="text-5xl serif-title">{messages.filter(m => m.status === 'in progress').length}</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase mb-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Resolved
                </div>
                <span className="text-5xl serif-title">{messages.filter(m => m.status === 'resolved').length}</span>
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
              <button 
                onClick={() => setStatusFilter('all')}
                className={`pb-1 transition-all ${statusFilter === 'all' ? 'border-b-2 border-primary font-black' : 'text-on-surface-variant hover:text-primary'}`}
              >
                All <span className="ml-1">({messages.length})</span>
              </button>
              <button 
                onClick={() => setStatusFilter('new')}
                className={`pb-1 transition-all ${statusFilter === 'new' ? 'border-b-2 border-primary font-black' : 'text-on-surface-variant hover:text-primary'}`}
              >
                New <span className="ml-1">({messages.filter(m => m.status === 'new' || !m.status).length})</span>
              </button>
              <button 
                onClick={() => setStatusFilter('in progress')}
                className={`pb-1 transition-all ${statusFilter === 'in progress' ? 'border-b-2 border-primary font-black' : 'text-on-surface-variant hover:text-primary'}`}
              >
                In progress <span className="ml-1">({messages.filter(m => m.status === 'in progress').length})</span>
              </button>
              <button 
                onClick={() => setStatusFilter('resolved')}
                className={`pb-1 transition-all ${statusFilter === 'resolved' ? 'border-b-2 border-primary font-black' : 'text-on-surface-variant hover:text-primary'}`}
              >
                Resolved <span className="ml-1">({messages.filter(m => m.status === 'resolved').length})</span>
              </button>
            </div>
            <div className="border border-outline-variant rounded-sm overflow-hidden bg-surface-container-lowest">
              <div className="bg-surface border-b border-outline-variant px-4 py-3 flex justify-between items-center">
                <p className="text-[9px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">{filteredMessages.length} Messages</p>
                {statusFilter !== 'all' && (
                  <span className="text-[8px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{statusFilter}</span>
                )}
              </div>
              {/* Ticket Cards */}
              <div className="divide-y divide-outline-variant min-h-[300px] max-h-[600px] overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <div className="p-10 text-center text-on-surface-variant flex items-center justify-center h-full">
                    <p className="text-sm">No messages in this folder.</p>
                  </div>
                ) : (
                  filteredMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      onClick={() => { setSelectedMessage(msg); setUpdateError(''); }}
                      className={`p-5 cursor-pointer transition-colors ${selectedMessage?.id === msg.id ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-sm truncate pr-4">{msg.name}</h3>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                          {msg.createdAt && new Date(msg.createdAt.seconds ? msg.createdAt.seconds * 1000 : (typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt)).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold mb-1 truncate">{msg.subject}</p>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{msg.message}</p>
                      <div className="mt-3">
                        <span className={`inline-block px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm ${
                          (!msg.status || msg.status === 'new') ? 'bg-blue-100 text-blue-800' :
                          msg.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                          msg.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {msg.status || 'new'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RightColumn (Message Detail) */}
          <div className="col-span-7">
            <div className={`border border-outline-variant rounded-sm bg-surface-container-low h-full min-h-[500px] flex ${!selectedMessage ? 'items-center justify-center' : 'flex-col'}`}>
              {!selectedMessage ? (
                <p className="text-sm text-on-surface-variant">Select a message to view details</p>
              ) : (
                <>
                  <div className="p-8 border-b border-outline-variant bg-surface w-full">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-serif mb-2">{selectedMessage.subject}</h2>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-surface-container-highest rounded-full flex items-center justify-center text-xs font-bold">
                            {selectedMessage.name ? selectedMessage.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{selectedMessage.name}</p>
                            <p className="text-xs text-on-surface-variant">{selectedMessage.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-surface-variant mb-2">
                          {selectedMessage.createdAt && new Date(selectedMessage.createdAt.seconds ? selectedMessage.createdAt.seconds * 1000 : (typeof selectedMessage.createdAt === 'string' ? selectedMessage.createdAt : selectedMessage.createdAt)).toLocaleString()}
                        </p>
                        <span className={`inline-block px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm ${
                          (!selectedMessage.status || selectedMessage.status === 'new') ? 'bg-blue-100 text-blue-800' :
                          selectedMessage.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                          selectedMessage.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedMessage.status || 'new'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 flex-grow bg-surface-container-lowest w-full text-left">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                  {updateError && (
                    <div className="mx-8 my-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm font-semibold text-left">
                      <strong>Update Error:</strong> {updateError}
                      <p className="mt-1 text-[10px] text-red-600 font-normal">This usually happens if your Firestore Security Rules block writes to the 'messages' collection.</p>
                    </div>
                  )}
                  <div className="p-6 border-t border-outline-variant bg-surface flex gap-4 w-full">
                     <button 
                       onClick={handleReplyEmail}
                       className="flex-1 bg-primary text-white py-3 text-xs font-bold tracking-widest uppercase hover:bg-opacity-90 transition-colors"
                     >
                       Reply to {selectedMessage.name ? selectedMessage.name.split(' ')[0] : 'Sender'}
                     </button>
                     <select 
                       className="border border-outline-variant bg-surface px-4 py-3 text-xs font-bold tracking-widest uppercase outline-none focus:border-primary"
                       value={selectedMessage.status || ''}
                       onChange={(e) => handleUpdateStatus(e.target.value)}
                     >
                       <option value="" disabled>Update Status</option>
                       <option value="new">Mark New</option>
                       <option value="in progress">Mark In Progress</option>
                       <option value="resolved">Mark Resolved</option>
                     </select>
                  </div>
                </>
              )}
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
