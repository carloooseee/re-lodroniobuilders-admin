import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db, app } from './firebase';
import { initializeApp, getApps } from 'firebase/app';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, onSnapshot, orderBy, updateDoc, deleteField, deleteDoc, addDoc } from 'firebase/firestore';

// ─── Paragraph helpers ───────────────────────────────────────────────────────
// Strips <p> tags so the textarea shows clean plain text.
const htmlToPlainText = (html = '') => {
  // Replace closing </p> with a double newline (paragraph break), strip all other tags.
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
};

// Wraps each non-empty paragraph (split by blank lines) back into <p> tags.
const plainTextToHtml = (text = '') => {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('\n');
};

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

const DEFAULT_POLICY_ACCORDION = [
  {
    id: 1,
    title: "Scope of Employee Relations",
    icon: "shield",
    content: `<p>The following policies govern the working relationship between R.E. Lodronio Builders Inc. and its employees. These standards apply to all workers deployed across company projects and sites.</p>\n<p>Covered areas include: personal conduct, dress code, corrective action, disciplinary capabilities and grievance policy, time and attendance, non-retaliation policy, leave policy, and work day policy.</p>`
  },
  {
    id: 2,
    title: "Casual / Temporary Employment",
    icon: "person",
    content: `<p>Casual employees are workers who do not have a regular or systematic hour of work, or an expectation of continuing work. A typical casual employee is employed on a daily basis when the need arises.</p>\n<p>Casual employees assigned to a particular job site will be notified by the employer, including the estimated time of completion of the project and the timeline of which the employee is expected to work.</p>\n<p>Worker contracts shall be co-terminus with the client contract. Once assigned to a particular job site, the worker's contract will be based on the actual scope of work that needs to be done within the start and completion of the project. The work contract may vary from three months to five months, extendable month on month if needed.</p>\n<p>The employer, upon signing of the worker's contract, shall explain in detail the scope of works expected from the worker and the estimated turnaround time for the worker to finish his assigned task.</p>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Payment of salaries:</strong>\n  <p>Employees shall be paid on a weekly basis (every Saturday of each month). The basic salary of the worker shall be indicated and discussed accordingly. The salary will be based solely on the attendance submitted by the timekeeper and verified by the immediate manager.</p>\n  <p class="mt-1 italic text-sm">Sample computation of basic salary: daily rate × number of days for one work week = Saturday pay-out.</p>\n</div>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Overtime:</strong>\n  <p>Overtime shall be advised by the project site once the need arises and shall be authorized by the engineer and need approval of Ar. Roco Lodronio.</p>\n  <p class="mt-1 italic text-sm">Sample computation: daily rate ÷ 8 hours = per hour rate × number of hours OT rendered.</p>\n</div>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Holiday work:</strong>\n  <p>Holiday work shall be advised to the worker prior to the schedule by the company manager or the immediate supervisor in the job site. Only the regular holiday is entitled for holiday pay.</p>\n  <ul class="list-disc pl-5 mt-2 space-y-1">\n    <li><strong>Special non-working holiday:</strong> additional 30% of the basic salary.</li>\n    <li><strong>Rest day:</strong> additional 50% of the basic salary.</li>\n    <li><strong>Regular holiday pay:</strong> 100% or times 2 of the basic salary.</li>\n  </ul>\n</div>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Night differential:</strong>\n  <p>Workers assigned to the night shift (10:00pm–6:00am) shall be entitled to a night differential.</p>\n  <p class="mt-1 italic text-sm">Calculation: Hourly rate × 10% × 8 hours.</p>\n</div>`
  },
  {
    id: 3,
    title: "Disciplinary Process",
    icon: "description",
    content: `<p>Common cases and complaints include, but are not limited to: behavioral (disrespect to authorities, client or people in the workplace), attendance and punctuality (excessive tardiness, absences, undertime), and violation of dress code policy (improper attire in the workplace).</p>\n<p>All policies and regulations shall be discussed with workers before onboarding, either by one-on-one discussion or by group. All cases shall be discussed within the company officers and legal advisor.</p>\n<p>Turnaround time for this process shall be fifteen (15) working days upon receipt of complaint. The worker shall be advised in case there will be an extension to come up with a decision.</p>\n<div class="pt-2">\n  <strong class="text-primary block mb-2">Disciplining employees escalation:</strong>\n  <div class="bg-surface p-4 border border-outline-variant/20 rounded font-serif italic text-center space-y-1">\n    <p>1st offense — verbal warning;</p>\n    <p>2nd offense — issuance of notice to explain (written warning);</p>\n    <p>3rd offense — issuance of NTE (for suspension);</p>\n    <p>4th offense — immediate termination of contract.</p>\n  </div>\n</div>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Dress code policy:</strong>\n  <p>The employer shall provide workers with three (3) long sleeves shirts. The uniform shall be free of charge provided that the worker will finish his three-month contract at a minimum. Failure to finish the contract would mean deductions of the uniform cost from the worker's final pay.</p>\n  <p>The company is not responsible for any loss or damage of worker's uniforms. Request for additional or replacement shall be for the account of the worker; payment can be in cash or salary deduction.</p>\n</div>`
  },
  {
    id: 4,
    title: "Attendance and Punctuality",
    icon: "schedule",
    content: `<p>Attendance and punctuality cases include the following violations in the corrective action matrix: unauthorized absences / AWOL; failure to call the manager or the HR officer during expected working hours; tardiness (30 minutes late in work schedule will be considered as violation of this policy); and unauthorized undertime once the employee leaves from the job site before the end of duty.</p>\n<p>Workers shall be advised of his absence prior to his work schedule or within the day of absence. The project site in-charge (site engineer/foreman) shall directly report this to the HR or admin officer on the exact day itself. A verbal warning shall be done to call attention of the worker and shall be considered as first offense.</p>\n<p>In case the worker returns to work under unauthorized absence / AWOL, the engineer/foreman has the authority to not accept the worker; however, a notice to explain with written explanation should be provided by the worker for evaluation by the company officers.</p>\n<p><strong>Documentation:</strong> signed and acknowledged notice to explain; written explanation by the worker; medical document, if any; signed notice of decision. This process shall be strictly implemented; the immediate supervisor and HR/admin officer consultant shall facilitate this process.</p>\n<div class="pt-2">\n  <strong class="text-primary block mb-2">Escalation process:</strong>\n  <div class="bg-surface p-4 border border-outline-variant/20 rounded font-serif italic text-center space-y-1">\n    <p>1st process — verbal warning;</p>\n    <p>2nd process — issuance of notice to explain;</p>\n    <p>3rd process — issuance of notice to explain with admin hearing schedule.</p>\n  </div>\n</div>`
  },
  {
    id: 5,
    title: "Workday policies",
    icon: "calendar_today",
    content: `<p>The worker shall be advised of his work schedule prior to deployment. Any changes shall be coordinated by the admin officer or immediate supervisor to the worker; therefore, updated contact information is needed.</p>\n<p>Work hours are from <strong>8:00AM–5:00PM</strong> with fifteen (15) minutes morning break from <strong>10:00AM–10:15AM</strong>, afternoon break from <strong>3:00PM–3:15PM</strong>, and one (1) hour lunch break from <strong>12:00NN–1:00PM</strong>, Monday to Saturday. Sunday is rest day.</p>\n<p>Changes in work schedule shall be communicated by the immediate supervisor to the worker. The worker shall adhere to the schedule; otherwise, the worker shall provide a valid explanation.</p>`
  },
  {
    id: 6,
    title: "Work Standby Procedure",
    icon: "autorenew",
    content: `<p>The worker shall be assigned and will be advised of his schedule prior to deployment. However, there will be instances that the worker will be pulled out from his designated job site to be transferred to another job site as need arises. The immediate supervisor shall communicate the changes and timeline to the worker accordingly.</p>\n<p>Any permanent change in the work schedule shall be communicated with the worker and indicated in his work contract.</p>`
  },
  {
    id: 7,
    title: "Involuntary Termination Procedure",
    icon: "warning",
    content: `<p>Major offenses include, but are not limited to: gross habitual negligence of duty, serious misconduct, and abandonment of work.</p>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Gross habitual negligence of duty:</strong>\n  <p>The worker shall be briefed of his job description upon signing the work contract and deployment; any clarification shall be discussed with the immediate supervisor. Failure to do so with proper investigation and process shall be subject to termination of employment.</p>\n</div>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Serious misconduct:</strong>\n  <p>The worker is expected to perform his duty at the job site with proper conduct and respect to co-workers. Any unruly act or misbehavior in the workplace with proper investigation and process shall be subject to termination of employment.</p>\n</div>`
  },
  {
    id: 8,
    title: "Return to Work, Job Abandonment, and Separation",
    icon: "undo",
    content: `<p>Workers returning after absence must follow proper notification and documentation procedures. Unauthorized absence or failure to report for work without valid notice may be considered job abandonment, subject to termination procedures.</p>\n<p>Upon separation, all company property — including uniforms, tools, and equipment — must be returned. Final pay will be released according to company policy and applicable labor regulations, after any lawful deductions.</p>`
  },
  {
    id: 9,
    title: "Bonus, 13th Month Pay and Other Incentives",
    icon: "redeem",
    content: `<div class="pt-2">\n  <strong class="text-primary block mb-1">Bonus and incentives:</strong>\n  <p>Any bonus or extra incentive is solely the prerogative of the employer. This is not in any way mandatory.</p>\n</div>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">13th month pay:</strong>\n  <p>Workers who have rendered services for one (1) whole month during the calendar year shall be entitled to a 13th month pay, subject to computation based on actual attendance. Any worker who is still employed and actively working in a particular project on December 23 or before shall be entitled to a 13th month pay. Overtime pay and other additional income are not included in the computation.</p>\n</div>`
  },
  {
    id: 10,
    title: "Grievance Management Procedure",
    icon: "chat_bubble_outline",
    content: `<p>Grievances are complaints and problems encountered in the workplace. The complaints may be raised on any incident, discrimination, harassment, bullying or any indirect acts not personally directed to the complainant. All concerns shall be directed to the immediate supervisor or any HR/admin officer in the office.</p>\n<p>Complaints, problems and other concerns not raised or coordinated in the office or proper authority shall not be valid and will not be entertained.</p>\n<div class="pt-2">\n  <strong class="text-primary block mb-1">Non-retaliation:</strong>\n  <p>No retaliatory action may be taken against any worker for reporting suspected violations in good faith. Any allegations of retaliation should be reported immediately to the immediate supervisor or HR/admin officer.</p>\n</div>`
  }
];

const secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(app.options, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Members state
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Settings state
  const [homeImages, setHomeImages] = useState({});
  const [urlInputs, setUrlInputs] = useState({});       // { key: draftUrlString }
  const [saveStatus, setSaveStatus] = useState({});     // { key: 'saving' | 'saved' | 'error' }

  const [contactContent, setContactContent] = useState({});
  const [contactInputs, setContactInputs] = useState({});
  const [contactSaveStatus, setContactSaveStatus] = useState(null);

  const [homeLinks, setHomeLinks] = useState({
    interiorLink: 'https://www.canva.com/design/DAHCMP8YuQ4/ns4gpTaWhngEH-_kbo6pmg/view?utm_content=DAHCMP8YuQ4&utm_campaign=designshare&utm_medium=link&utm_source=viewer',
    exteriorLink: 'https://www.canva.com/design/DAHB8G8LzEw/jDs9cAsiaYO-PZRkk2z2Bw/view?utm_content=DAHB8G8LzEw&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h8330579d52'
  });
  const [homeLinkInputs, setHomeLinkInputs] = useState({
    interiorLink: 'https://www.canva.com/design/DAHCMP8YuQ4/ns4gpTaWhngEH-_kbo6pmg/view?utm_content=DAHCMP8YuQ4&utm_campaign=designshare&utm_medium=link&utm_source=viewer',
    exteriorLink: 'https://www.canva.com/design/DAHB8G8LzEw/jDs9cAsiaYO-PZRkk2z2Bw/view?utm_content=DAHB8G8LzEw&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h8330579d52'
  });
  const [homeLinkSaveStatus, setHomeLinkSaveStatus] = useState(null);

  const [policyContent, setPolicyContent] = useState({ accordionData: [] });
  const [policyInputs, setPolicyInputs] = useState({ accordionData: [] });
  const [policySaveStatus, setPolicySaveStatus] = useState(null);

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
      fetchTextContent();
      return () => unsubscribe();
    } else {
      setMessages([]);
      setSelectedMessage(null);
      setHomeImages({});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && currentTab === 'members' && userData?.role === 'admin') {
      const unsubMembers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const m = [];
        snapshot.forEach(doc => m.push({ id: doc.id, ...doc.data() }));
        setMembers(m);
      });
      const unsubPending = onSnapshot(collection(db, 'pending_users'), (snapshot) => {
        const p = [];
        snapshot.forEach(doc => p.push({ id: doc.id, ...doc.data() }));
        setPendingMembers(p);
      });
      return () => {
        unsubMembers();
        unsubPending();
      };
    }
  }, [isAuthenticated, currentTab, userData]);

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

  const fetchTextContent = async () => {
    try {
      const contactSnap = await getDoc(doc(db, 'siteSettings', 'contactContent'));
      if (contactSnap.exists()) {
        setContactContent(contactSnap.data());
        setContactInputs(contactSnap.data());
      }
      const homeLinksSnap = await getDoc(doc(db, 'siteSettings', 'homeLinks'));
      if (homeLinksSnap.exists()) {
        const data = homeLinksSnap.data();
        setHomeLinks(prev => ({
          interiorLink: data.interiorLink || prev.interiorLink,
          exteriorLink: data.exteriorLink || prev.exteriorLink
        }));
        setHomeLinkInputs(prev => ({
          interiorLink: data.interiorLink || prev.interiorLink,
          exteriorLink: data.exteriorLink || prev.exteriorLink
        }));
      }
      const policySnap = await getDoc(doc(db, 'siteSettings', 'policyContent'));
      if (policySnap.exists()) {
        const data = policySnap.data();
        if (!data.accordionData || data.accordionData.length === 0) {
          data.accordionData = DEFAULT_POLICY_ACCORDION;
        }
        setPolicyContent(data);
        // Convert stored HTML content to plain text for the textarea
        setPolicyInputs({
          ...data,
          accordionData: (data.accordionData || []).map(item => ({
            ...item,
            content: htmlToPlainText(item.content)
          }))
        });
      } else {
        setPolicyContent({ accordionData: DEFAULT_POLICY_ACCORDION });
        setPolicyInputs({
          accordionData: DEFAULT_POLICY_ACCORDION.map(item => ({
            ...item,
            content: htmlToPlainText(item.content)
          }))
        });
      }
    } catch (err) {
      console.error('Error fetching text content:', err);
    }
  };

  const handleSaveHomeLinks = async () => {
    setHomeLinkSaveStatus('saving');
    try {
      await setDoc(doc(db, 'siteSettings', 'homeLinks'), homeLinkInputs, { merge: true });
      setHomeLinks(homeLinkInputs);
      setHomeLinkSaveStatus('saved');
      setTimeout(() => setHomeLinkSaveStatus(null), 2000);
    } catch (err) {
      console.error('Save home links error:', err);
      setHomeLinkSaveStatus('error');
    }
  };

  const handleSaveContact = async () => {
    setContactSaveStatus('saving');
    try {
      await setDoc(doc(db, 'siteSettings', 'contactContent'), contactInputs, { merge: true });
      setContactContent(contactInputs);
      setContactSaveStatus('saved');
      setTimeout(() => setContactSaveStatus(null), 2000);
    } catch (err) {
      console.error('Save contact error:', err);
      setContactSaveStatus('error');
    }
  };

  const handleSavePolicy = async () => {
    setPolicySaveStatus('saving');
    try {
      // Convert plain-text paragraphs back to <p> HTML before saving to Firestore
      const dataToSave = {
        ...policyInputs,
        accordionData: (policyInputs.accordionData || []).map(item => ({
          ...item,
          content: plainTextToHtml(item.content)
        }))
      };
      await setDoc(doc(db, 'siteSettings', 'policyContent'), dataToSave, { merge: true });
      setPolicyContent(dataToSave);
      setPolicySaveStatus('saved');
      setTimeout(() => setPolicySaveStatus(null), 2000);
    } catch (err) {
      console.error('Save policy error:', err);
      setPolicySaveStatus('error');
    }
  };

  const handleAddPolicyAccordionItem = () => {
    setPolicyInputs(prev => ({
      ...prev,
      accordionData: [...(prev.accordionData || []), { id: Date.now(), title: '', icon: 'shield', content: '' }]
    }));
  };

  const handleRemovePolicyAccordionItem = (idToRemove) => {
    setPolicyInputs(prev => ({
      ...prev,
      accordionData: (prev.accordionData || []).filter(item => item.id !== idToRemove)
    }));
  };

  const handleUpdatePolicyAccordionItem = (idToUpdate, field, value) => {
    setPolicyInputs(prev => ({
      ...prev,
      accordionData: (prev.accordionData || []).map(item =>
        item.id === idToUpdate ? { ...item, [field]: value } : item
      )
    }));
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
      await addDoc(collection(db, 'pending_users'), {
        firstName,
        lastName,
        email,
        role,
        department,
        createdAt: new Date().toISOString()
      });

      // Clear form and show success message (we will repurpose `error` for a success message temporarily, or add a success state if needed, but let's just alert for now or set error to green. Let's add an alert).
      alert('Registration submitted! Please wait for admin approval.');
      setAuthMode('login');
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('');
      setDepartment('hr');
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

  const handleApproveMember = async (pendingMember) => {
    try {
      // Create user account via secondary app so the admin is not signed out.
      // Generate a random secure temp password — user will set their own password via email.
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, pendingMember.email, tempPassword);

      // Send set password email so the new user can set their own password
      await sendPasswordResetEmail(secondaryAuth, pendingMember.email);

      // Save to users collection
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: pendingMember.firstName,
        lastName: pendingMember.lastName,
        email: pendingMember.email,
        role: pendingMember.role,
        department: pendingMember.department,
        status: 'active',
        createdAt: pendingMember.createdAt,
        approvedAt: new Date().toISOString()
      });

      // Delete from pending_users
      await deleteDoc(doc(db, 'pending_users', pendingMember.id));

      // Sign the newly created account out of the secondary instance to avoid
      // a lingering authenticated session on every approval.
      await signOut(secondaryAuth);

      alert(`User ${pendingMember.email} approved and set password email sent.`);
    } catch (err) {
      console.error("Error approving member:", err);
      alert("Error approving member: " + err.message);
    }
  };

  const handleRejectMember = async (pendingMember) => {
    if (window.confirm(`Are you sure you want to reject ${pendingMember.email}?`)) {
      try {
        await deleteDoc(doc(db, 'pending_users', pendingMember.id));
        alert('Member rejected.');
      } catch (err) {
        console.error("Error rejecting member:", err);
        alert("Error rejecting member: " + err.message);
      }
    }
  };

  const handleUpdateMemberField = async (memberId, field, value) => {
    try {
      await updateDoc(doc(db, 'users', memberId), { [field]: value });
      if (field === 'role' || field === 'department') {
        alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully.`);
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      alert(`Error updating ${field}: ` + err.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
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

  const getMailtoLink = (original) => {
    if (!original) return '';
    const dateStr = original.createdAt 
      ? new Date(original.createdAt.seconds ? original.createdAt.seconds * 1000 : (typeof original.createdAt === 'string' ? original.createdAt : original.createdAt)).toLocaleString() 
      : '';

    const body = `Dear ${original.name || 'Client'},\n\n\n\n--\nWarm regards,\nR.E. Lodronio Builders Inc.\nFormerly REL Builders and Design | Hebrews 3:4\n[Logo: https://relodroniobuilders.com/src/assets/email.png]\nNo. 2 M. Santos Avenue, Santos Village Phase 3, Las Piñas City\n\n-----------------------------\nOriginal Message:\nFrom: ${original.name} <${original.email}>\nDate: ${dateStr}\nSubject: ${original.subject || 'Inquiry'}\n\n${original.message}`;

    return `mailto:${original.email}?subject=Re: ${encodeURIComponent(original.subject || '')}&body=${encodeURIComponent(body)}`;
  };

  const filteredMessages = messages.filter(msg => {
    const status = msg.status || 'new';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      (msg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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

                {/* Role Dropdown */}
                <div>
                  <label htmlFor="role">Role</label>
                  <select className="input-field select-field" id="role" name="role" required value={role} onChange={(e) => setRole(e.target.value)}>
                    <option disabled value=""></option>
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
                    <option value="architecture">Architecture</option>
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
              className={`pb-1 transition-colors ${currentTab === 'messages'
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
                }`}
            >Messages</button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`pb-1 transition-colors ${currentTab === 'settings'
                ? 'text-primary border-b border-primary'
                : 'text-on-surface-variant hover:text-primary'
                }`}
            >Settings</button>
            {userData?.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('members')}
                className={`pb-1 transition-colors ${currentTab === 'members'
                  ? 'text-primary border-b border-primary'
                  : 'text-on-surface-variant hover:text-primary'
                  }`}
              >Members</button>
            )}
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

            {/* Text Content Sections */}
            <hr className="border-outline-variant mb-12" />
            <div className="mb-16">
              <h2 className="text-5xl serif-title leading-tight mb-8">Text Content</h2>

              {/* Contact Page Text */}
              <div className="mb-12 bg-surface-container-lowest border border-outline-variant p-8">
                <h3 className="text-[14px] font-bold tracking-[0.2em] uppercase text-on-surface-variant mb-6 border-b border-outline-variant pb-4">Contact Page</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Intro Description</label>
                    <textarea
                      value={contactInputs.introDesc || ''}
                      onChange={e => setContactInputs(prev => ({ ...prev, introDesc: e.target.value }))}
                      className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none focus:border-primary transition-colors min-h-[80px]"
                      placeholder="Reach out directly for estimates..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Company Info (Title | Subtitle)</label>
                    <input type="text" value={contactInputs.companyName || ''} onChange={e => setContactInputs(prev => ({ ...prev, companyName: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none mb-2" placeholder="Company Name" />
                    <input type="text" value={contactInputs.companySubtitle || ''} onChange={e => setContactInputs(prev => ({ ...prev, companySubtitle: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none" placeholder="Company Subtitle" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Contact Person (Name | Role)</label>
                    <input type="text" value={contactInputs.contactPersonName || ''} onChange={e => setContactInputs(prev => ({ ...prev, contactPersonName: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none mb-2" placeholder="Person Name" />
                    <input type="text" value={contactInputs.contactPersonRole || ''} onChange={e => setContactInputs(prev => ({ ...prev, contactPersonRole: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none" placeholder="Person Role" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Office Address</label>
                    <input type="text" value={contactInputs.addressLine1 || ''} onChange={e => setContactInputs(prev => ({ ...prev, addressLine1: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none mb-2" placeholder="Address Line 1" />
                    <input type="text" value={contactInputs.addressLine2 || ''} onChange={e => setContactInputs(prev => ({ ...prev, addressLine2: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none" placeholder="Address Line 2" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Emails (Comma separated)</label>
                    <input type="text" value={contactInputs.emails || ''} onChange={e => setContactInputs(prev => ({ ...prev, emails: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none" placeholder="email1@test.com, email2@test.com" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Phones (Comma separated)</label>
                    <input type="text" value={contactInputs.phones || ''} onChange={e => setContactInputs(prev => ({ ...prev, phones: e.target.value }))} className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none" placeholder="Phone 1, Phone 2" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={handleSaveContact} disabled={contactSaveStatus === 'saving'} className="bg-primary text-white py-2 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-opacity-90 disabled:opacity-50">
                    {contactSaveStatus === 'saving' ? 'Saving...' : contactSaveStatus === 'saved' ? 'Saved!' : 'Save Contact Info'}
                  </button>
                </div>
              </div>

              {/* Home Page Links */}
              <div className="mb-12 bg-surface-container-lowest border border-outline-variant p-8">
                <h3 className="text-[14px] font-bold tracking-[0.2em] uppercase text-on-surface-variant mb-6 border-b border-outline-variant pb-4">Home Page Links</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Interior Designs Hyperlink</label>
                    <input
                      type="url"
                      value={homeLinkInputs.interiorLink || ''}
                      onChange={e => setHomeLinkInputs(prev => ({ ...prev, interiorLink: e.target.value }))}
                      className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none focus:border-primary transition-colors font-mono"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Exterior Designs Hyperlink</label>
                    <input
                      type="url"
                      value={homeLinkInputs.exteriorLink || ''}
                      onChange={e => setHomeLinkInputs(prev => ({ ...prev, exteriorLink: e.target.value }))}
                      className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none focus:border-primary transition-colors font-mono"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={handleSaveHomeLinks} disabled={homeLinkSaveStatus === 'saving'} className="bg-primary text-white py-2 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-opacity-90 disabled:opacity-50">
                    {homeLinkSaveStatus === 'saving' ? 'Saving...' : homeLinkSaveStatus === 'saved' ? 'Saved!' : 'Save Home Links'}
                  </button>
                </div>
              </div>

              {/* Policy Page Text */}
              <div className="mb-12 bg-surface-container-lowest border border-outline-variant p-8">
                <h3 className="text-[14px] font-bold tracking-[0.2em] uppercase text-on-surface-variant mb-6 border-b border-outline-variant pb-4">Policy Page</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Hero Description</label>
                    <textarea
                      value={policyInputs.heroDesc || ''}
                      onChange={e => setPolicyInputs(prev => ({ ...prev, heroDesc: e.target.value }))}
                      className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none focus:border-primary transition-colors min-h-[80px]"
                      placeholder="These policies define..."
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Manual Intro Description</label>
                    <textarea
                      value={policyInputs.manualDesc || ''}
                      onChange={e => setPolicyInputs(prev => ({ ...prev, manualDesc: e.target.value }))}
                      className="border border-outline-variant bg-surface px-3 py-2 text-[11px] outline-none focus:border-primary transition-colors min-h-[80px]"
                      placeholder="Select a section below..."
                    />
                  </div>
                </div>

                <div className="mb-4 flex justify-between items-center">
                  <label className="text-[12px] font-bold tracking-widest uppercase text-on-surface-variant">Accordion Sections</label>
                  <button onClick={handleAddPolicyAccordionItem} className="bg-surface-container-highest text-primary py-1.5 px-4 text-[9px] font-bold tracking-widest uppercase border border-outline-variant hover:border-primary">
                    + Add Section
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {(policyInputs.accordionData || []).map((item, index) => (
                    <div key={item.id} className="border border-outline-variant p-4 bg-surface relative group">
                      <button onClick={() => handleRemovePolicyAccordionItem(item.id)} className="absolute top-2 right-2 text-on-surface-variant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove section">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>

                      <div className="flex gap-4 mb-3">
                        <div className="w-1/3 flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase text-on-surface-variant">Title</label>
                          <input type="text" value={item.title} onChange={e => handleUpdatePolicyAccordionItem(item.id, 'title', e.target.value)} className="border border-outline-variant bg-surface px-2 py-1.5 text-[11px] outline-none w-full" />
                        </div>
                        <div className="w-1/4 flex flex-col gap-1">
                          <label className="text-[9px] font-bold uppercase text-on-surface-variant">Icon (Material Icon)</label>
                          <input type="text" value={item.icon} onChange={e => handleUpdatePolicyAccordionItem(item.id, 'icon', e.target.value)} className="border border-outline-variant bg-surface px-2 py-1.5 text-[11px] outline-none w-full" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold uppercase text-on-surface-variant">Content — plain text, separate paragraphs with a blank line</label>
                        <textarea value={item.content} onChange={e => handleUpdatePolicyAccordionItem(item.id, 'content', e.target.value)} className="border border-outline-variant bg-surface px-2 py-1.5 text-[11px] outline-none w-full min-h-[100px] whitespace-pre-wrap font-mono" placeholder="Type your paragraph here.

Add a blank line to start a new paragraph." />
                      </div>
                    </div>
                  ))}
                  {(!policyInputs.accordionData || policyInputs.accordionData.length === 0) && (
                    <div className="text-center p-4 border border-outline-variant text-on-surface-variant text-sm">No sections added yet.</div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button onClick={handleSavePolicy} disabled={policySaveStatus === 'saving'} className="bg-primary text-white py-2 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-opacity-90 disabled:opacity-50">
                    {policySaveStatus === 'saving' ? 'Saving...' : policySaveStatus === 'saved' ? 'Saved!' : 'Save Policy Info'}
                  </button>
                </div>
              </div>

            </div>
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
                          onClick={() => { setSelectedMessage(msg); setUpdateError(''); setIsConfirmingDelete(false); }}
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
                            <span className={`inline-block px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm ${(!msg.status || msg.status === 'new') ? 'bg-blue-100 text-blue-800' :
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
                                {selectedMessage.phone && (
                                  <p className="text-xs text-on-surface-variant">Phone: {selectedMessage.phone}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-on-surface-variant mb-2">
                              {selectedMessage.createdAt && new Date(selectedMessage.createdAt.seconds ? selectedMessage.createdAt.seconds * 1000 : (typeof selectedMessage.createdAt === 'string' ? selectedMessage.createdAt : selectedMessage.createdAt)).toLocaleString()}
                            </p>
                            <span className={`inline-block px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm ${(!selectedMessage.status || selectedMessage.status === 'new') ? 'bg-blue-100 text-blue-800' :
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
                        {isConfirmingDelete ? (
                          <>
                            <div className="flex-grow flex items-center gap-2 text-red-600 font-sans text-xs font-semibold">
                              <span className="material-symbols-outlined text-[18px]">warning</span>
                              Are you sure you want to permanently delete this message?
                            </div>
                            <button
                              onClick={() => setIsConfirmingDelete(false)}
                              className="border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary px-5 py-3 text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                setIsConfirmingDelete(false);
                                handleDeleteMessage(selectedMessage.id);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              Confirm Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <a
                              href={getMailtoLink(selectedMessage)}
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
                              onClick={() => setIsConfirmingDelete(true)}
                              className="border border-outline-variant hover:border-red-500 hover:text-red-500 text-on-surface-variant px-5 py-3 text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'members' && userData?.role === 'admin' && (
          <div className="space-y-16">
            <div>
              <h2 className="text-3xl font-medium tracking-tight mb-8">Pending Members</h2>
              <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-outline-variant">
                    <tr>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Name</th>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Email</th>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Role / Dept</th>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {pendingMembers.length === 0 ? (
                      <tr><td colSpan="4" className="p-4 text-center text-on-surface-variant">No pending members.</td></tr>
                    ) : (
                      pendingMembers.map(member => (
                        <tr key={member.id} className="hover:bg-surface transition-colors">
                          <td className="p-4">{member.firstName} {member.lastName}</td>
                          <td className="p-4">{member.email}</td>
                          <td className="p-4 capitalize">{member.role} / {member.department}</td>
                          <td className="p-4 flex gap-4">
                            <button onClick={() => handleApproveMember(member)} className="text-primary underline text-sm hover:text-opacity-70">Approve</button>
                            <button onClick={() => handleRejectMember(member)} className="text-red-700 underline text-sm hover:text-opacity-70">Reject</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-medium tracking-tight mb-8">Active Members</h2>
              <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-outline-variant">
                    <tr>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Name</th>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Email</th>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Role</th>
                      <th className="p-4 font-semibold text-on-surface-variant uppercase tracking-widest text-[10px]">Dept</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {members.length === 0 ? (
                      <tr><td colSpan="4" className="p-4 text-center text-on-surface-variant">No active members.</td></tr>
                    ) : (
                      members.map(member => (
                        <tr key={member.id} className="hover:bg-surface transition-colors">
                          <td className="p-4 flex gap-2">
                            <input
                              type="text"
                              className="bg-transparent border border-outline-variant p-1 rounded text-sm w-24"
                              defaultValue={member.firstName || ''}
                              onBlur={(e) => {
                                if (e.target.value !== member.firstName) {
                                  handleUpdateMemberField(member.id, 'firstName', e.target.value);
                                }
                              }}
                              placeholder="First Name"
                            />
                            <input
                              type="text"
                              className="bg-transparent border border-outline-variant p-1 rounded text-sm w-24"
                              defaultValue={member.lastName || ''}
                              onBlur={(e) => {
                                if (e.target.value !== member.lastName) {
                                  handleUpdateMemberField(member.id, 'lastName', e.target.value);
                                }
                              }}
                              placeholder="Last Name"
                            />
                          </td>
                          <td className="p-4">{member.email}</td>
                          <td className="p-4">
                            <select
                              className="bg-transparent border border-outline-variant p-1 rounded text-sm"
                              value={member.role || ''}
                              onChange={(e) => handleUpdateMemberField(member.id, 'role', e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                              <option value="user">User</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <select
                              className="bg-transparent border border-outline-variant p-1 rounded text-sm capitalize"
                              value={member.department || ''}
                              onChange={(e) => handleUpdateMemberField(member.id, 'department', e.target.value)}
                            >
                              <option value="hr">Human Resources</option>
                              <option value="finance">Finance</option>
                              <option value="operations">Operations</option>
                              <option value="engineering">Engineering</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
