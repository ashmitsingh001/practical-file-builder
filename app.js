    // ========== 0. UI ENGINE (REPLACING NATIVE POPUPS) ==========
    const UI = {
      toast(msg, type = 'success') {
        let container = document.querySelector('.ui-toast-container');
        if (!container) {
          container = document.createElement('div');
          container.className = 'ui-toast-container';
          document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `ui-toast ${type}`;
        const icon = type === 'success' ? 'ph-check-circle' : (type === 'error' ? 'ph-x-circle' : 'ph-info');
        toast.innerHTML = `<i class="ph-bold ${icon}"></i> <span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(20px)';
          setTimeout(() => toast.remove(), 400);
        }, 3000);
      },

      confirm(msg, isDanger = false) {
        return new Promise(resolve => {
          const overlay = document.createElement('div');
          overlay.className = 'ui-dialog-overlay';
          overlay.innerHTML = `
            <div class="ui-dialog">
              <h3>Are you sure?</h3>
              <p>${msg}</p>
              <div class="ui-dialog-btns">
                <button class="ui-dialog-btn cancel">Cancel</button>
                <button class="ui-dialog-btn ${isDanger ? 'danger' : 'confirm'}">${isDanger ? 'Delete' : 'Confirm'}</button>
              </div>
            </div>
          `;
          document.body.appendChild(overlay);
          overlay.querySelector('.cancel').onclick = () => { overlay.remove(); resolve(false); };
          overlay.querySelector('.confirm, .danger').onclick = () => { overlay.remove(); resolve(true); };
        });
      }
    };

    // Replace native alert/confirm with our beautiful UI
    window._alert = window.alert;
    window.alert = (m) => UI.toast(m);

    // Handles the placeholder visibility
    function checkEmpty(el) {
      if (el.textContent.trim() === '') el.setAttribute('empty', '');
      else el.removeAttribute('empty');
    }

    // Attach listener globally for any contenteditable inputs
    document.addEventListener('input', e => {
      if (e.target.hasAttribute('contenteditable')) checkEmpty(e.target);
    });

    // Handle Plaintext pasting in non-Chrome browsers fallback just in case
    document.addEventListener("paste", function (e) {
      if (e.target.isContentEditable) {
        e.preventDefault();
        var text = (e.originalEvent || e).clipboardData.getData('text/plain');

        // Critical Windows paste fix: strip \r from \r\n to prevent double spacing when pasted natively
        text = text.replace(/\r\n/g, '\n');
        text = text.replace(/\r/g, '\n');

        document.execCommand('insertText', false, text);
      }
    });

    // ========== DRAG & DROP SIDEBAR SYSTEM ==========
    function refreshSidebar() {
      const thumbList = document.getElementById('thumb-list');
      if (thumbList) thumbList.innerHTML = '';

      const pages = document.querySelectorAll('.a4-page:not(template .a4-page)');

      pages.forEach((page, index) => {
        // assign a physical tracking ID for jump/move bindings if not present
        if (!page.id || page.id.startsWith('page-')) {
          const safeId = 'p-' + Math.random().toString(36).substr(2, 9);
          if (!page.id) page.id = safeId;
        }

        const headingDiv = page.querySelector('.program-heading');
        let title = headingDiv && headingDiv.textContent.trim() !== '' ? headingDiv.textContent : 'Untitled Page';

        const card = document.createElement('div');
        card.className = 'thumb-card';
        if (page.classList.contains('theory-page')) card.classList.add('theory-thumb');
        card.draggable = true;
        card.setAttribute('data-target', page.id);

        let badge = page.classList.contains('theory-page') ? '<span class="theory-badge">Theory</span>' : '';
        card.innerHTML = `
          <div class="thumb-page-num">${index + 1}</div>
          <div class="thumb-title">${title}</div>
          ${badge}
          <div class="thumb-delete" onclick="event.stopPropagation(); deletePageById('${page.id}')" title="Delete Page">✖</div>
        `;

        // Scroll instantly to map location
        card.onclick = () => {
          document.getElementById(page.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        // Drag Bindings
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        if (thumbList) thumbList.appendChild(card);
      });
    }

    let draggedThumb = null;
    function handleDragStart(e) {
      draggedThumb = this;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => this.style.opacity = '0.5', 0);
    }

    function handleDragOver(e) {
      if (e.preventDefault) e.preventDefault(); // allow dropping
      e.dataTransfer.dropEffect = 'move';
      this.classList.add('drag-over');
      return false;
    }

    function handleDragLeave(e) {
      this.classList.remove('drag-over');
    }

    function handleDrop(e) {
      if (e.stopPropagation) e.stopPropagation();
      this.classList.remove('drag-over');

      if (draggedThumb !== this) {
        const targetId = this.getAttribute('data-target');
        const draggedId = draggedThumb.getAttribute('data-target');

        const targetPage = document.getElementById(targetId);
        const draggedPage = document.getElementById(draggedId);
        const wrapper = document.getElementById('pages-wrapper');

        const allThumbs = Array.from(document.querySelectorAll('.thumb-card'));
        const draggedIndex = allThumbs.indexOf(draggedThumb);
        const targetIndex = allThumbs.indexOf(this);

        if (draggedIndex < targetIndex) {
          wrapper.insertBefore(draggedPage, targetPage.nextSibling); // Move Down
        } else {
          wrapper.insertBefore(draggedPage, targetPage); // Move Up
        }
      }
      return false;
    }

    function handleDragEnd(e) {
      this.style.opacity = '1';
      document.querySelectorAll('.thumb-card').forEach(col => col.classList.remove('drag-over'));
    }

    // --- SIDEBAR UTILS ---
    function toggleSidebar() {
      document.body.classList.toggle('sidebar-collapsed');
      const isCollapsed = document.body.classList.contains('sidebar-collapsed');
      localStorage.setItem('sidebar_collapsed', isCollapsed);

      // Recalculate 'fit' zoom if active
      const activeZoomBtn = document.querySelector('.zoom-btn.active');
      if (activeZoomBtn && activeZoomBtn.textContent === 'Fit') {
        setZoom('fit');
      }
    }

    // ========== AUTO-SAVE SYSTEM ==========
    function saveState() {
      const wrapper = document.getElementById('pages-wrapper');
      try {
        localStorage.setItem('practical_builder_data', wrapper.innerHTML);
      } catch (e) {
        console.error('Storage exceeded limit. Try adding fewer or smaller images.', e);
        // alert intentionally disabled from spamming multiple saves
      }
      refreshSidebar();
    }

    // ========== ZOOM ENGINE ==========
    let currentZoom = 1.0;

    function setZoom(val) {
      const zoomBtns = document.querySelectorAll('.zoom-btn');

      if (val === 'fit') {
        const isCollapsed = document.body.classList.contains('sidebar-collapsed');
        const sidebarWidth = isCollapsed ? 70 : 250;
        const availableWidth = window.innerWidth - sidebarWidth - 80; // 80 for breathing room
        const pageMinWidth = 810; // A4 width + margin safety
        const fitScale = Math.min(1.2, availableWidth / pageMinWidth);
        currentZoom = fitScale;
      } else {
        currentZoom = parseFloat(val);
      }

      // Constrain bounds for usability
      if (currentZoom < 0.25) currentZoom = 0.25;
      if (currentZoom > 2.0) currentZoom = 2.0;

      // Apply to Print Table
      const table = document.querySelector('.print-table');
      if (table) table.style.zoom = currentZoom;
      localStorage.setItem('doc_zoom', currentZoom);

      // Update UI buttons visually
      zoomBtns.forEach(btn => btn.classList.remove('active'));

      const setVal = val.toString();
      if (setVal === '0.75') zoomBtns[0].classList.add('active');
      if (setVal === '1' || setVal === '1.0') zoomBtns[1].classList.add('active');
      if (val === 'fit') zoomBtns[2].classList.add('active');
    }

    // Ctrl+Scroll & Trackpad Pinch Bindings
    document.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY > 0) setZoom(currentZoom - 0.05); // zoom out
        else setZoom(currentZoom + 0.05);            // zoom in
      }
    }, { passive: false });

    function changeTheme(themeValue) {
      if (themeValue === 'default') {
        document.body.removeAttribute('data-theme');
      } else {
        document.body.setAttribute('data-theme', themeValue);
      }
      localStorage.setItem('practical_builder_theme', themeValue);
    }

    // Watch the pages wrapper for any edits, text entries, or DOM changes to Auto-save!
    const observer = new MutationObserver(() => {
      saveState();
    });

    function initAutoSave() {
      observer.observe(document.getElementById('pages-wrapper'), {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        // Specifically monitor 'empty' attribute or source changes
        attributeFilter: ['src', 'style', 'empty']
      });
    }

    // ========== APP ACTIONS ==========

    // Clear all saved data
    async function clearAllData() {
      const ok = await UI.confirm("This will permanently delete ALL your local work. (Cloud saves are safe!)", true);
      if (ok) {
        localStorage.removeItem('practical_builder_data');
        document.getElementById('pages-wrapper').innerHTML = '';
        addPage();
        UI.toast("Workspace cleared.");
      }
    }

    // Add a new template page
    function addPage() {
      const template = document.getElementById('page-tpl');
      const clone = template.content.cloneNode(true);
      document.getElementById('pages-wrapper').appendChild(clone);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    function addTheoryPage() {
      const template = document.getElementById('theory-page-tpl');
      const clone = template.content.cloneNode(true);
      document.getElementById('pages-wrapper').appendChild(clone);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }

    function addTheoryBlock(btnElem, type) {
      const container = btnElem.closest('.content').querySelector('.theory-elements-container');
      const block = document.createElement('div');
      block.className = 'theory-block';
      block.draggable = true;

      let innerHTML = '';
      if (type === 'heading') {
        innerHTML = `<div class="program-heading" contenteditable="true" placeholder="Enter Heading (e.g. Program 1)" empty></div><div class="divider"></div>`;
      } else if (type === 'question') {
        innerHTML = `<div class="program-sub" contenteditable="true" placeholder="Enter Question (e.g. Q1. What is Java?)" empty></div>`;
      } else if (type === 'text') {
        innerHTML = `<div class="theory-body" contenteditable="plaintext-only" placeholder="Type answer text here..." oninput="checkEmpty(this)" empty></div>`;
      }

      block.innerHTML = `
        <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
        ${innerHTML}
        <button class="block-delete" onclick="this.parentElement.remove(); saveState();" title="Remove block">✖</button>
      `;

      // Internal Reordering Logic
      block.addEventListener('dragstart', (e) => {
        block.classList.add('dragging');
        e.dataTransfer.setData('text/plain', ''); // Workaround for Firefox
      });

      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
        saveState();
      });

      container.appendChild(block);

      // Auto-focus the new block
      const editable = block.querySelector('[contenteditable]');
      if (editable) editable.focus();

      saveState();
    }

    // Initialize all pages for drag support (Delegated)
    document.addEventListener('dragover', (e) => {
      const container = e.target.closest('.theory-elements-container');
      if (!container) return;
      e.preventDefault();

      const draggingBlock = document.querySelector('.dragging');
      if (!draggingBlock) return;

      const afterElement = getDragAfterElement(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(draggingBlock);
      } else {
        container.insertBefore(draggingBlock, afterElement);
      }
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.theory-block:not(.dragging)')];

      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Delete a page with confirmation
    async function deletePage(buttonElem) {
      const ok = await UI.confirm("Are you sure you want to delete this page?", true);
      if (ok) {
        buttonElem.parentElement.remove();
        saveState();
        UI.toast("Page deleted.");
      }
    }

    async function deletePageById(pageId) {
      const page = document.getElementById(pageId);
      if (page) {
        const ok = await UI.confirm("Are you sure you want to delete this page?", true);
        if (ok) {
          page.remove();
          saveState();
          UI.toast("Page deleted.");
        }
      }
    }

    // Load an image with auto-compression (prevents hitting LocalStorage 5MB limits)
    function loadImage(event, inputElem) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      const outputBlock = inputElem.closest('.output-block');

      let gallery = outputBlock.querySelector('.image-gallery');
      const textEditor = outputBlock.querySelector('.output-editor');
      const actionRow = outputBlock.querySelector('.img-actions');

      // Auto-upgrade legacy saved DOMs on the fly
      if (!gallery) {
        gallery = document.createElement('div');
        gallery.className = 'image-gallery';
        if (actionRow) outputBlock.insertBefore(gallery, actionRow);

        // Cleanup legacy img node
        const oldImg = outputBlock.querySelector('.custom-img');
        if (oldImg) oldImg.remove();
      }

      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          // Compress Image (Scale max width to 1200px)
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Output as JPEG at 80% quality
          const compressedData = canvas.toDataURL('image/jpeg', 0.80);

          const newImg = document.createElement('img');
          newImg.className = 'custom-img';
          newImg.src = compressedData;
          gallery.appendChild(newImg);

          actionRow.style.display = 'flex';
          textEditor.style.display = 'none'; // hide the text editor

          saveState(); // Ensure custom upload is forcefully saved
        };
        img.src = e.target.result;
      }
      reader.readAsDataURL(file);
      inputElem.value = ""; // Reset input so same file can be uploaded again if needed
    }

    // Remove the image and bring the text back
    function removeImage(btnElem) {
      const outputBlock = btnElem.closest('.output-block');

      const gallery = outputBlock.querySelector('.image-gallery');
      const textEditor = outputBlock.querySelector('.output-editor');
      const actionRow = outputBlock.querySelector('.img-actions');

      if (gallery) gallery.innerHTML = '';

      // Clean up legacy template issues just in case
      const oldImg = outputBlock.querySelector('img.custom-img');
      if (oldImg && !gallery) oldImg.remove();

      if (actionRow) actionRow.style.display = 'none';
      if (textEditor) textEditor.style.display = 'block';

      // Reset input value
      const fileInput = outputBlock.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    }

    // ========== DATA PERSISTENCE (IMPORT/EXPORT) ==========

    // Export current state as a JSON file
    function exportData() {
      const wrapper = document.getElementById('pages-wrapper');
      const theme = document.body.getAttribute('data-theme') || 'default';

      const backup = {
        timestamp: new Date().toISOString(),
        version: "2.0",
        theme: theme,
        content: wrapper.innerHTML
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "practical_backup_" + new Date().toLocaleDateString().replace(/\//g, '-') + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }

    // Handles file selection for import
    function importData(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          const data = JSON.parse(e.target.result);

          const ok = await UI.confirm("Importing this file will replace all your current programs. Continue?");
          if (ok) {
            if (Array.isArray(data)) {
              batchLoad(data);
            } else if (data.content) {
              document.getElementById('pages-wrapper').innerHTML = data.content;
              if (data.theme) changeTheme(data.theme);
            } else {
              throw new Error("Invalid format");
            }
            saveState();
            refreshSidebar();
            UI.toast("Data imported successfully!");
          }
        } catch (err) {
          UI.toast("Error importing file: " + err.message, "error");
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset input
    }

    // New helper to bulk-generate pages from a simple JSON list
    // Format: [ { "type": "theory", "blocks": [...] }, { "title": "Prog 1", "sub": "WAP to...", "code": "...", "output": "..." }, ... ]
    function batchLoad(programList) {
      const wrapper = document.getElementById('pages-wrapper');
      const progTemplate = document.getElementById('page-tpl');
      const theoryTemplate = document.getElementById('theory-page-tpl');

      programList.forEach(prog => {
        if (prog.type === 'theory') {
          // Special Case: Theory Page
          const clone = theoryTemplate.content.cloneNode(true);
          const page = clone.querySelector('.a4-page');
          const container = page.querySelector('.theory-elements-container');
          const btnMock = page.querySelector('.builder-btn'); // used as reference for addTheoryBlock

          if (prog.blocks && Array.isArray(prog.blocks)) {
            prog.blocks.forEach(block => {
              // We simulate the click/call to addTheoryBlock logic
              addTheoryBlockManual(container, block.type, block.content);
            });
          }
          wrapper.appendChild(clone);
        } else {
          // Standard Case: Program Page
          const clone = progTemplate.content.cloneNode(true);
          const page = clone.querySelector('.a4-page');

          if (prog.title) page.querySelector('.program-heading').textContent = prog.title;
          if (prog.sub) page.querySelector('.program-sub').textContent = prog.sub;
          if (prog.code) page.querySelector('.code-editor').textContent = prog.code;
          if (prog.output) page.querySelector('.output-editor').textContent = prog.output;

          // Clear placeholders
          page.querySelectorAll('[empty]').forEach(el => {
            if (el.textContent.trim() !== '') el.removeAttribute('empty');
          });

          wrapper.appendChild(clone);
        }
      });
    }

    // Secondary helper for automated theory loading
    function addTheoryBlockManual(container, type, content) {
      const block = document.createElement('div');
      block.className = 'theory-block';
      block.draggable = true;

      let innerHTML = '';
      if (type === 'heading') {
        innerHTML = `<div class="program-heading" contenteditable="true" placeholder="Enter Heading (e.g. Program 1)" empty>${content || ''}</div><div class="divider"></div>`;
      } else if (type === 'question') {
        innerHTML = `<div class="program-sub" contenteditable="true" placeholder="Enter Question (e.g. Q1. What is Java?)" empty>${content || ''}</div>`;
      } else if (type === 'text') {
        innerHTML = `<div class="theory-body" contenteditable="plaintext-only" placeholder="Type answer text here..." oninput="checkEmpty(this)" empty>${content || ''}</div>`;
      }

      block.innerHTML = `
        <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
        ${innerHTML}
        <button class="block-delete" onclick="this.parentElement.remove(); saveState();" title="Remove block">✖</button>
      `;

      // Internal Reordering Logic
      block.addEventListener('dragstart', (e) => {
        block.classList.add('dragging');
        e.dataTransfer.setData('text/plain', '');
      });
      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
        saveState();
      });

      container.appendChild(block);

      // Clear placeholder if content exists
      const editable = block.querySelector('[empty]');
      if (editable && editable.textContent.trim() !== '') editable.removeAttribute('empty');
    }

    // Initialize the app
    window.onload = function () {
      // 0. Recover Sidebar State
      if (localStorage.getItem('sidebar_collapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
      }

      // 1. Recover Theme
      let savedTheme = localStorage.getItem('practical_builder_theme');
      if (savedTheme) {
        document.getElementById('themeSelector').value = savedTheme;
        changeTheme(savedTheme);
      }

      // 2. Recover Data
      let savedData = localStorage.getItem('practical_builder_data');
      if (savedData && savedData.trim() !== '') {
        // Fix for browser double-spacing bugs (Chrome adds \n after <br> heavily)
        savedData = savedData.replace(/<br\s*\/?>\r?\n/gi, '<br>');
        savedData = savedData.replace(/<\/div>\r?\n/gi, '</div>');

        // Load saved state seamlessly
        document.getElementById('pages-wrapper').innerHTML = savedData;
      } else {
        addPage();
      }

      // Start watching for any text/image changes for auto-save!
      refreshSidebar();
      initAutoSave();

      // 3. Recover Zoom State
      let savedZoom = localStorage.getItem('doc_zoom');
      if (savedZoom) setZoom(parseFloat(savedZoom));
    }
  
