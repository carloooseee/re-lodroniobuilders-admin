import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, onSnapshot, orderBy, updateDoc, deleteField, deleteDoc } from 'firebase/firestore';

// ─── Image slot definitions (key, label, section) ───────────────────────────
const IMAGE_SLOTS = [
  { key: 'hero_0', label: 'Slide 1', section: 'Hero Slideshow' },
  { key: 'hero_1', label: 'Slide 2', section: 'Hero Slideshow' },
  { key: 'hero_2', label: 'Slide 3', section: 'Hero Slideshow' },
  { key: 'hero_3', label: 'Slide 4', section: 'Hero Slideshow' },
  { key: 'interior_0', label: 'Interior 1', section: 'Interiors' },
  { key: 'interior_1', label: 'Interior 2', section: 'Interiors' },
  { key: 'interior_2', label: 'Interior 3', section: 'Interiors' },
  { key: 'exterior_0', label: 'Exterior 1', section: 'Exteriors' },
  { key: 'exterior_1', label: 'Exterior 2', section: 'Exteriors' },
  { key: 'exterior_2', label: 'Exterior 3', section: 'Exteriors' },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [currentTab, setCurrentTab] = useState('messages'); // 'messages' | 'settings'
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateError, setUpdateError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Settings state
  const [homeImages, setHomeImages] = useState({});
  const [urlInputs, setUrlInputs] = useState({});       // { key: draftUrlString }
  const [saveStatus, setSaveStatus] = useState({});     // { key: 'saving' | 'saved' | 'error' }

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
      // Fetch home image URLs from Firestore
      fetchHomeImages();
      return () => unsubscribe();
    } else {
      setMessages([]);
      setSelectedMessage(null);
      setHomeImages({});
    }
  }, [isAuthenticated]);

  const fetchHomeImages = async () => {
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'homeImages'));
      if (snap.exists()) {
        const data = snap.data();
        setHomeImages(data);
        setUrlInputs(data); // pre-fill inputs with existing URLs
      }
    } catch (err) {
      console.error('Error fetching home images:', err);
    }
  };

  /**
   * Converts share-page URLs into direct embeddable image URLs.
   * Supports Google Drive and Dropbox share links.
   */
  const convertToDirectUrl = (rawUrl) => {
    const url = (rawUrl || '').trim();

    // Google Drive: https://drive.google.com/file/d/FILE_ID/view?...
    //           or: https://drive.google.com/open?id=FILE_ID
    const gDriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?\s]+)/);
    const gDriveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&\s]+)/);
    const fileId = (gDriveFileMatch && gDriveFileMatch[1]) || (gDriveOpenMatch && gDriveOpenMatch[1]);
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    }

    // Dropbox: https://www.dropbox.com/...?dl=0  →  ?dl=1 (direct download/image)
    if (url.includes('dropbox.com')) {
      return url.replace(/[?&]dl=0/, '').replace(/\?$/, '') + (url.includes('?') ? '&raw=1' : '?raw=1');
    }

    return url; // already a direct URL — pass through as-is
  };

  const handleSaveUrl = async (slotKey) => {
    const raw = (urlInputs[slotKey] || '').trim();
    const url = convertToDirectUrl(raw);
    // If conversion changed the URL, update the input to show what's being saved
    if (url !== raw) setUrlInputs(prev => ({ ...prev, [slotKey]: url }));
    setSaveStatus(prev => ({ ...prev, [slotKey]: 'saving' }));
    try {
      await setDoc(doc(db, 'siteSettings', 'homeImages'), { [slotKey]: url }, { merge: true });
      setHomeImages(prev => ({ ...prev, [slotKey]: url }));
      setSaveStatus(prev => ({ ...prev, [slotKey]: 'saved' }));
      // Clear the 'saved' badge after 2s
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slotKey]: null })), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus(prev => ({ ...prev, [slotKey]: 'error' }));
    }
  };
  
  const handleRemoveUrl = async (slotKey) => {
    setSaveStatus(prev => ({ ...prev, [slotKey]: 'saving' }));
    try {
      await setDoc(doc(db, 'siteSettings', 'homeImages'), {
        [slotKey]: deleteField()
      }, { merge: true });
      
      setHomeImages(prev => {
        const updated = { ...prev };
        delete updated[slotKey];
        return updated;
      });
      setUrlInputs(prev => ({ ...prev, [slotKey]: '' }));
      setSaveStatus(prev => ({ ...prev, [slotKey]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [slotKey]: null })), 2000);
    } catch (err) {
      console.error('Remove error:', err);
      setSaveStatus(prev => ({ ...prev, [slotKey]: 'error' }));
    }
  };

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

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to permanently delete this message?")) return;
    setUpdateError('');
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      setUpdateError(err.message || 'Failed to delete message. Check your Firestore Security Rules.');
    }
  };

  const filteredMessages = messages.filter(msg => {
    const status = msg.status || 'new';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesSearch = 
      !searchQuery ||
      (msg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
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
            <p className="text-[10px] tracking-[0.2em] text-on-surface-variant mt-1 uppercase">Admin • {currentTab === 'messages' ? 'Inbox' : 'Settings'}</p>
          </div>
        </div>
        <nav className="flex items-center gap-12">
          <div className="flex gap-8 text-[11px] font-semibold tracking-widest uppercase">
            <button
              onClick={() => setCurrentTab('messages')}
              className={`pb-1 transition-colors ${
                currentTab === 'messages'
                  ? 'text-primary border-b border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >Messages</button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`pb-1 transition-colors ${
                currentTab === 'settings'
                  ? 'text-primary border-b border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >Settings</button>
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
        {currentTab === 'settings' && (
          <div>
            {/* Settings Hero */}
            <div className="mb-16 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
              <div className="max-w-2xl">
                <p className="text-[11px] tracking-[0.3em] text-on-surface-variant uppercase mb-4">(Settings)</p>
                <h2 className="text-7xl serif-title leading-tight">Home Page<br /><span className="italic">Images.</span></h2>
                <p className="mt-8 text-sm text-on-surface-variant leading-relaxed">
                  Paste a publicly accessible image URL for each slot. Changes are reflected immediately on the live website. You can use any image host (e.g. Imgur, Cloudinary, Google Drive public link).
                </p>
              </div>
              
              <div className="bg-surface-container border border-outline-variant p-6 max-w-sm w-full flex flex-col gap-4">
                <div className="flex items-start gap-3 text-primary">
                  <span className="material-symbols-outlined text-2xl mt-0.5 text-blue-500">folder_shared</span>
                  <div>
                    <h4 className="font-serif text-lg leading-tight">Drive Image Folder</h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      Upload your image files to this folder, copy their share link, and paste them into the slots below.
                    </p>
                  </div>
                </div>
                <a
                  href="https://drive.google.com/drive/folders/164cL3RHsVZuxvzVrKG32uTlNyRnUPItm?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Open Upload Folder
                </a>
              </div>
            </div>
            <hr className="border-outline-variant mb-12" />

            {/* Group slots by section */}
            {['Hero Slideshow', 'Interiors', 'Exteriors'].map(section => (
              <div key={section} className="mb-16">
                <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase text-on-surface-variant mb-8 border-b border-outline-variant pb-4">
                  {section}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {IMAGE_SLOTS.filter(s => s.section === section).map(slot => {
                    const currentUrl = homeImages[slot.key];
                    const draftUrl = urlInputs[slot.key] ?? currentUrl ?? '';
                    const status = saveStatus[slot.key]; // 'saving' | 'saved' | 'error' | null
                    return (
                      <div key={slot.key} className="flex flex-col gap-3">
                        {/* Image Preview */}
                        <div
                          className="relative w-full aspect-[4/3] bg-surface-container border border-outline-variant overflow-hidden"
                          style={{ background: '#1a1a1a' }}
                        >
                          {currentUrl ? (
                            <img
                              src={currentUrl}
                              alt={slot.label}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant gap-2">
                              <span className="material-symbols-outlined text-3xl opacity-30">image</span>
                              <p className="text-[9px] tracking-widest uppercase opacity-40">No image set</p>
                            </div>
                          )}
                          {/* Saved overlay flash */}
                          {status === 'saved' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="material-symbols-outlined text-green-400 text-4xl">check_circle</span>
                            </div>
                          )}
                        </div>

                        {/* Slot label */}
                        <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">{slot.label}</p>

                        {/* URL input */}
                        <input
                          type="url"
                          placeholder="Paste image URL or Google Drive share link..."
                          value={draftUrl}
                          onChange={e => setUrlInputs(prev => ({ ...prev, [slot.key]: e.target.value }))}
                          className="w-full border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none focus:border-primary transition-colors font-mono"
                        />
                        <p className="text-[9px] text-on-surface-variant opacity-60 leading-relaxed -mt-1">
                          Google Drive &amp; Dropbox share links are auto-converted.
                        </p>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveUrl(slot.key)}
                            disabled={status === 'saving' || draftUrl === (homeImages[slot.key] ?? '')}
                            className="flex-grow border border-outline-variant bg-surface py-2.5 text-[9px] font-bold tracking-widest uppercase hover:border-primary hover:text-primary transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {status === 'saving' ? 'sync' : status === 'saved' ? 'check' : status === 'error' ? 'error' : 'save'}
                            </span>
                            {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved!' : status === 'error' ? 'Error' : 'Save'}
                          </button>
                          
                          {currentUrl && (
                            <button
                              onClick={() => handleRemoveUrl(slot.key)}
                              disabled={status === 'saving'}
                              className="border border-outline-variant bg-surface px-3 py-2.5 text-[9px] font-bold tracking-widest uppercase hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                              title="Remove custom image and restore default"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentTab === 'messages' && (
          <div>
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
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-block px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm ${
                          (!msg.status || msg.status === 'new') ? 'bg-blue-100 text-blue-800' :
                          msg.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' :
                          msg.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {msg.status || 'new'}
                        </span>
                        {msg.ticketId && (
                          <span className="text-[9px] font-mono text-on-surface-variant tracking-wider">{msg.ticketId}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RightColumn (Message Detail & Search Bar) */}
          <div className="col-span-7 flex flex-col gap-6">
            {/* Search Input on top of the view details section */}
            <div className="relative w-full bg-surface-container-lowest border border-outline-variant rounded-sm flex items-center px-4 py-3">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-3">search</span>
              <input
                type="text"
                placeholder="Search messages by name, email, subject, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[11px] font-sans text-primary placeholder:text-on-surface-variant/50"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-primary transition-colors ml-2"
                >
                  close
                </button>
              )}
            </div>

            <div className={`border border-outline-variant rounded-sm bg-surface-container-low flex-grow min-h-[500px] flex ${!selectedMessage ? 'items-center justify-center' : 'flex-col'}`}>
              {!selectedMessage ? (
                <p className="text-sm text-on-surface-variant">Select a message to view details</p>
              ) : (
                <>
                  <div className="p-8 border-b border-outline-variant bg-surface w-full">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-serif mb-1">{selectedMessage.subject}</h2>
                        {selectedMessage.ticketId && (
                          <p className="text-[10px] font-mono text-on-surface-variant tracking-widest mb-3">{selectedMessage.ticketId}</p>
                        )}
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
                      <strong>Action Error:</strong> {updateError}
                      <p className="mt-1 text-[10px] text-red-600 font-normal font-sans">This usually happens if your Firestore Security Rules block updates/deletes in the 'messages' collection.</p>
                    </div>
                  )}
                  <div className="p-6 border-t border-outline-variant bg-surface flex gap-4 w-full">
                     <a 
                       href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || '')}`}
                       className="flex-1 bg-primary text-white py-3 text-xs font-bold tracking-widest uppercase hover:bg-opacity-90 transition-colors text-center block"
                     >
                       Reply to {selectedMessage.name ? selectedMessage.name.split(' ')[0] : 'Sender'}
                     </a>
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
                     <button 
                       onClick={() => handleDeleteMessage(selectedMessage.id)}
                       className="border border-outline-variant hover:border-red-500 hover:text-red-500 text-on-surface-variant px-5 py-3 text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
                     >
                       <span className="material-symbols-outlined text-[16px]">delete</span>
                       Delete
                     </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
        )}
      </main>

      <footer className="border-t border-outline-variant px-12 py-10 flex justify-between items-center text-[11px] font-bold tracking-widest uppercase">
        <p>© 2026 RE Lodronio Builders Inc</p>
        <p>Building with purpose, since 2008</p>
      </footer>
    </div>
  );
}

export default App;
