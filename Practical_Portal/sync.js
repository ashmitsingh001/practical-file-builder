/**
 * ☁️ Java Practical Portal - Sync System
 * This script connects the local builder to a PHP/MySQL Cloud Backend.
 * Automatically injected into index.html (Main Builder)
 */

(function () {
    const PORTAL_PATH = "Practical_Portal/";
    let currentVersionId = null;

    // --- 1. ACCESS CONTROL ---
    async function checkAuth() {
        const res = await fetch(`${PORTAL_PATH}auth.php?action=check`);
        const user = await res.json();
        if (user.status !== "logged_in") {
            window.location.href = `${PORTAL_PATH}index.html`;
        }
        return user;
    }

    // --- 2. UI INJECTION ---
    function injectUI(username) {
        const hook = document.getElementById("cloud-portal-hook");
        if (!hook) return;

        // 2A. In-Navbar Components (Pill & Tools)
        hook.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 20px;" title="Connected to Cloud">
                <i class="ph-fill ph-circle" style="font-size: 8px; color: #22c55e; animation: pulse 2s infinite;"></i>
                <span style="font-size: 10px; font-weight: 800; color: #22c55e; text-transform: uppercase; letter-spacing: 0.5px;">Live</span>
            </div>

            <button class="btn" style="background: #2563eb; padding: 8px 15px; font-size: 11px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);" onclick="showProjectSaveModal()">
                <i class="ph-bold ph-plus-circle"></i> Save Project
            </button>
            <button class="btn" style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); padding: 8px 15px; font-size: 11px; display: flex; align-items: center; gap: 6px;" onclick="showProjectManager()">
                <i class="ph-bold ph-folder-open"></i> My Projects
            </button>
            
            <button class="btn" id="settingsBtn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; padding: 8px; font-size: 18px; display: flex; align-items: center; justify-content: center;" onclick="toggleSettingsPanel(event)">
                <i class="ph-fill ph-gear"></i>
            </button>
        `;

        // 2B. Build Global Modal (Breakout from Navbar)
        if (!document.getElementById('settingsPanel')) {
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = `
                <!-- Centered Settings Modal (Hidden by Default) -->
                <div id="settingsOverlay" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 999999; cursor: pointer;" onclick="toggleSettingsPanel()"></div>
                
                <div id="settingsPanel" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 320px; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; box-shadow: 0 25px 60px rgba(0,0,0,0.9); padding: 25px; z-index: 1000000; text-align: left; font-family: 'Inter', sans-serif;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                        <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Settings Portal</span>
                        <i class="ph-bold ph-x" style="color: #94a3b8; cursor: pointer; font-size: 18px;" onclick="toggleSettingsPanel()"></i>
                    </div>

                    <!-- User Section -->
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <i class="ph-fill ph-user-circle" style="font-size: 44px; color: #3b82f6;"></i>
                        <div>
                            <div style="color: #64748b; font-size: 9px; text-transform: uppercase; font-weight: 800;">Student Participant</div>
                            <div style="color: #f8fafc; font-size: 18px; font-weight: 700;">${username}</div>
                        </div>
                    </div>

                    <!-- Local Data Section -->
                    <div style="margin-bottom: 20px;">
                        <div style="color: #475569; font-size: 9px; text-transform: uppercase; font-weight: 800; margin-bottom: 10px;">💾 Backup & Sync</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <button onclick="exportData()" style="background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 10px; border-radius: 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <i class="ph-bold ph-download-simple"></i> Backup
                            </button>
                            <button onclick="document.getElementById('importInput').click()" style="background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 10px; border-radius: 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <i class="ph-bold ph-upload-simple"></i> Import
                            </button>
                        </div>
                        <input type="file" id="importInput" style="display:none" accept=".json" onchange="importData(event)">
                    </div>

                    <!-- System Section -->
                    <div style="margin-bottom: 20px;">
                        <div style="color: #475569; font-size: 9px; text-transform: uppercase; font-weight: 800; margin-bottom: 10px;">⚠️ Maintenance</div>
                        <button onclick="clearAllData()" style="width: 100%; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 10px; border-radius: 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="ph-bold ph-trash"></i> Reset All Data
                        </button>
                    </div>
                    
                    <a href="${PORTAL_PATH}auth.php?action=logout" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #ef4444; color: white; text-decoration: none; padding: 12px; border-radius: 8px; font-size: 12px; font-weight: 700; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
                        <i class="ph-bold ph-sign-out"></i> Logout Account
                    </a>
                </div>
            `;
            document.body.appendChild(modalContainer);
        }

        if (!document.getElementById('sync-styles')) {
            const style = document.createElement('style');
            style.id = 'sync-styles';
            style.innerHTML = `@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }`;
            document.head.appendChild(style);
        }
    }

    // --- 2.1 MODAL LOGIC ---
    window.toggleSettingsPanel = (e) => {
        if (e) e.stopPropagation();
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('settingsOverlay');
        if (!panel || !overlay) return;

        const isHidden = panel.style.display === 'none' || panel.style.display === '';
        
        panel.style.display = isHidden ? 'block' : 'none';
        overlay.style.display = isHidden ? 'block' : 'none';
    };

    // --- 3. MODAL GENERATOR ---

    // --- 3. MODAL GENERATOR ---

    // --- 3. MODAL GENERATOR ---
    function createModal(title, content) {
        const overlay = document.createElement("div");
        overlay.id = "portal-modal-overlay";
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.85);
            z-index: 99999; display: flex; align-items: center; justify-content: center;
            font-family: 'Inter', sans-serif;
        `;
        overlay.innerHTML = `
            <div style="background: #1e293b; padding: 30px; border-radius: 12px; width: 400px; color: white; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <h2 style="margin:0 0 15px 0;">${title}</h2>
                <div id="modal-body">${content}</div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn" onclick="document.getElementById('portal-modal-overlay').remove()" style="background: #334155; flex: 1;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    window.newProject = async () => {
        const ok = await UI.confirm("Are you sure you want to start a New Project?\n\nThis will clear your current local workspace. Make sure you have Saved to Cloud first!");
        if (!ok) return;
        
        // Reset everything
        if (typeof clearAllData === 'function') {
            clearAllData();
            setTimeout(() => location.reload(), 100);
        } else {
            localStorage.clear();
            location.reload();
        }
    };

    window.showProjectSaveModal = () => {
        const defaultName = `Project_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
        createModal("Cloud Save: Save Project", `
            <div style="text-align: left;">
                <label style="font-size: 12px; color: #94a3b8; display: block; margin-bottom: 5px;">Project Name</label>
                <input type="text" id="newProjectName" value="${defaultName}" style="width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 8px; box-sizing: border-box; font-size: 14px; outline: none; border: 1px solid #3b82f6;">
                <button class="btn" style="width:100%; margin-top:20px; background: #10b981; padding: 12px; font-size: 14px;" onclick="cloudSave()">
                    <i class="ph-bold ph-cloud-arrow-up"></i> Sync to Cloud
                </button>
                <p style="font-size: 10px; color: #64748b; margin-top: 10px; line-height: 1.4;">Tip: Using descriptive names (e.g., "Practical Lab 1") helps you stay organized.</p>
            </div>
        `);
    };

    window.cloudSave = async () => {
        const vNameInput = document.getElementById("newProjectName");
        if (!vNameInput) return;
        const vName = vNameInput.value;
        const wrapper = document.getElementById("pages-wrapper");
        const theme = document.body.getAttribute('data-theme') || 'default';
        const zoom = localStorage.getItem('doc_zoom') || 1.0;

        const formData = new FormData();
        formData.append("version_name", vName);
        formData.append("html_content", wrapper.innerHTML);
        formData.append("theme", theme);
        formData.append("zoom", zoom);

        console.log("📤 Sending data to Cloud:", { vName, theme, zoom });
        const res = await fetch(`${PORTAL_PATH}api.php?action=save`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        console.log("📥 Server Response:", data);
        
        if (data.status === 'success') {
            UI.toast(data.message || "Project saved to cloud!");
        } else {
            UI.toast(data.message || "Sync failed", "error");
        }
        
        const overlay = document.getElementById('portal-modal-overlay');
        if (overlay) overlay.remove();
    };

    window.showProjectManager = async () => {
        try {
            const res = await fetch(`${PORTAL_PATH}api.php?action=list`);
            const data = await res.json();

            let listHtml = `<div style="max-height: 350px; overflow-y: auto; padding-right: 5px;">`;
            if (!data.versions || data.versions.length === 0) {
                listHtml += `<div style="padding: 40px 20px; text-align: center; color: #64748b;">
                    <i class="ph ph-folder-dotted" style="font-size: 48px; opacity: 0.3;"></i>
                    <p style="margin-top: 10px;">No Cloud Projects found.</p>
                </div>`;
            } else {
                data.versions.forEach(v => {
                    listHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(15,22,42,0.5); margin-bottom: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); gap: 15px; transition: all 0.2s;">
                        <div style="text-align: left; flex: 1;">
                            <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">${v.version_name}</div>
                            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                                <i class="ph-bold ph-calendar"></i> ${v.updated_at}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn" style="background: #3b82f6; padding: 6px 12px; font-size: 11px;" onclick="loadProject(${v.id})" title="Load into Workspace">Load</button>
                            <button class="btn" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; padding: 6px 12px; font-size: 11px;" onclick="deleteProject(${v.id})" title="Delete from Cloud">Del</button>
                        </div>
                    </div>`;
                });
            }
            listHtml += `</div>
                <button class="btn" style="width: 100%; margin-top: 15px; background: #0ea5e9; padding: 12px; font-size: 13px;" onclick="newProject()">
                    <i class="ph-bold ph-plus-circle"></i> Create New Project
                </button>
            `;
            createModal("My Project Manager", listHtml);
        } catch (e) {
            console.error("Project List Error:", e);
            UI.toast("Could not load project list.", "error");
        }
    };

    window.loadProject = async (id) => {
        const ok = await UI.confirm("This project will replace your current workspace. Make sure you've saved local changes first.\n\nContinue Loading?");
        if (!ok) return;
        
        try {
            const res = await fetch(`${PORTAL_PATH}api.php?action=load&id=${id}`);
            const result = await res.json();
            const data = result.data;

            // Apply Data
            if (data && data.html_content) {
                document.getElementById('pages-wrapper').innerHTML = data.html_content;
                
                // Apply Theme
                if (data.theme === 'default') document.body.removeAttribute('data-theme');
                else document.body.setAttribute('data-theme', data.theme);
                if (document.getElementById('themeSelector')) {
                    document.getElementById('themeSelector').value = data.theme;
                }

                // Apply Zoom
                if (data.zoom) {
                    document.querySelector('.print-table').style.zoom = data.zoom;
                    localStorage.setItem('doc_zoom', data.zoom);
                }

                // Trigger updates
                if (typeof refreshSidebar === 'function') refreshSidebar();
                
                const overlay = document.getElementById('portal-modal-overlay');
                if (overlay) overlay.remove();
                
                UI.toast("Project loaded successfully!");
            } else {
                UI.toast("Failed to load project content", "error");
            }
        } catch (e) {
            console.error("Load Error:", e);
            UI.toast("Error connecting to cloud", "error");
        }
    };

    window.deleteProject = async (id) => {
        const ok = await UI.confirm("Delete this project from your cloud storage? This cannot be undone.", true);
        if (!ok) return;
        
        try {
            const res = await fetch(`${PORTAL_PATH}api.php?action=delete&id=${id}`);
            const data = await res.json();
            
            if (data.status === 'success') {
                UI.toast(data.message || "Project deleted.");
                showProjectManager(); // Refresh list
            } else {
                UI.toast(data.message || "Delete failed", "error");
            }
        } catch (e) {
            UI.toast("Error deleting project", "error");
        }
    };

    // --- 5. INITIALIZE ---
    async function init() {
        const user = await checkAuth();
        injectUI(user.username);
        
        // Intercept standard SaveState to notify it's only local now
        const originalSave = window.saveState;
        window.saveState = function() {
            originalSave();
            console.log("💾 Local auto-save completed. Use 'Cloud Save' for permanent backup.");
        };
    }

    init();
})();
