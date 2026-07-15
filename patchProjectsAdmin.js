import fs from 'fs';

const appPath = 'src/App.jsx';
let code = fs.readFileSync(appPath, 'utf8');

// 1. Update initial state
code = code.replace(
  "const [projectsData, setProjectsData] = useState({ residential: [], commercial: [], gallery: [] });",
  "const [projectsData, setProjectsData] = useState({ residential: [], commercial: [], gallery: [], hiddenHardcoded: [] });"
);

// 2. Update setProjectsData in fetchProjectsData
const oldSetProjectsData = `        setProjectsData({
          residential: data.residential || [],
          commercial: data.commercial || [],
          gallery: data.gallery || []
        });`;
const newSetProjectsData = `        setProjectsData({
          residential: data.residential || [],
          commercial: data.commercial || [],
          gallery: data.gallery || [],
          hiddenHardcoded: data.hiddenHardcoded || []
        });`;
code = code.replace(oldSetProjectsData, newSetProjectsData);

// 3. Add handleToggleHardcodedVisibility
const toggleFunction = `
  const handleToggleHardcodedVisibility = async (projectId, isHidden) => {
    setProjectsSaveStatus('saving');
    try {
      let newHidden = [...(projectsData.hiddenHardcoded || [])];
      if (isHidden) {
        newHidden = newHidden.filter(id => id !== projectId);
      } else {
        newHidden.push(projectId);
      }
      const newData = { ...projectsData, hiddenHardcoded: newHidden };
      await setDoc(doc(db, 'siteSettings', 'projectsData'), newData, { merge: true });
      setProjectsData(newData);
      setProjectsSaveStatus('saved');
      setTimeout(() => setProjectsSaveStatus(null), 2000);
    } catch (err) {
      console.error(err);
      setProjectsSaveStatus('error');
    }
  };

  const handleDeleteProject =`;
code = code.replace("  const handleDeleteProject =", toggleFunction);

// 4. Update the render logic map
// Find: {(projectsData[category] || []).map((project) => (
// Replace with a logic that builds the combined array and maps it
const oldMap = "{(projectsData[category] || []).map((project) => (";
const newMap = `{(() => {
                        const hardcoded = (HARDCODED_PROJECTS[category] || []).map(p => ({
                          ...p,
                          isHardcoded: true,
                          isHidden: projectsData.hiddenHardcoded?.includes(p.id)
                        }));
                        const combined = [...hardcoded, ...(projectsData[category] || [])];
                        return combined;
                      })().map((project) => (`;
code = code.replace(oldMap, newMap); // wait, it appears twice since there are two categories! Actually, it iterates over ['residential', 'commercial'].map((category) => ...
// so oldMap only appears ONCE inside that map!

// 5. Update delete button with toggle
// Find the button block
const oldButton = `<button onClick={() => handleDeleteProject(category, project.id)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-sm" title="Delete Project">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>`;
const newButton = `{project.isHardcoded ? (
                            <button onClick={() => handleToggleHardcodedVisibility(project.id, project.isHidden)} className={\`absolute top-2 right-2 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-sm \${project.isHidden ? 'bg-green-600' : 'bg-gray-600'}\`} title={project.isHidden ? "Show Project" : "Hide Project"}>
                              <span className="material-symbols-outlined text-[14px]">{project.isHidden ? 'visibility' : 'visibility_off'}</span>
                            </button>
                          ) : (
                            <button onClick={() => handleDeleteProject(category, project.id)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-sm" title="Delete Project">
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          )}`;

code = code.replace(oldButton, newButton);

// 6. Disable edit for hardcoded projects
const oldEditButton = `<button onClick={() => setEditingProject(project)} className="w-full py-2 border border-outline-variant hover:border-primary hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-colors">
                            Edit Project
                          </button>`;
const newEditButton = `{project.isHardcoded ? (
                            <div className="w-full py-2 border border-outline-variant text-[10px] font-bold uppercase tracking-widest text-center text-on-surface-variant/50">
                              Hardcoded Project
                            </div>
                          ) : (
                            <button onClick={() => setEditingProject(project)} className="w-full py-2 border border-outline-variant hover:border-primary hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-colors">
                              Edit Project
                            </button>
                          )}`;
code = code.replace(oldEditButton, newEditButton);

// Add visual cue for hidden
const oldDivClass = `className="border border-outline-variant bg-surface-container-lowest p-4 relative group flex flex-col"`;
const newDivClass = `className={\`border border-outline-variant bg-surface-container-lowest p-4 relative group flex flex-col \${project.isHidden ? 'opacity-40 grayscale' : ''}\`}`;
code = code.replace(oldDivClass, newDivClass);


fs.writeFileSync(appPath, code, 'utf8');
console.log("Projects admin updated!");
