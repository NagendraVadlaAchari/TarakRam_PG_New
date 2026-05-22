// ===================== DOCUMENTS MODULE =====================
function renderDocumentsPage(){
  const user = getCurrentUser();
  const docs = DB.get('documents')||[];
  const tenants = DB.get('tenants')||[];

  if(user.role==='tenant'){
    const myDocs = docs.filter(d=>d.tenantId===user.tenantId);
    return renderTenantDocs(myDocs, user.tenantId);
  }

  const grouped = {};
  tenants.filter(t=>t.status==='active').forEach(t=>{
    grouped[t.id]={tenant:t, docs: docs.filter(d=>d.tenantId===t.id)};
  });

  return `
  <div class="page-header">
    <h1><i class="fas fa-folder-open" style="color:var(--accent)"></i> Documents</h1>
    <p>${docs.length} documents · ${docs.filter(d=>d.verified).length} verified</p>
  </div>
  <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat-card purple"><div class="stat-icon purple"><i class="fas fa-file-alt"></i></div><div class="stat-value">${docs.length}</div><div class="stat-label">Total Docs</div></div>
    <div class="stat-card green"><div class="stat-icon green"><i class="fas fa-check-double"></i></div><div class="stat-value">${docs.filter(d=>d.verified).length}</div><div class="stat-label">Verified</div></div>
    <div class="stat-card amber"><div class="stat-icon amber"><i class="fas fa-clock"></i></div><div class="stat-value">${docs.filter(d=>!d.verified).length}</div><div class="stat-label">Pending Verify</div></div>
    <div class="stat-card pink"><div class="stat-icon pink"><i class="fas fa-users"></i></div><div class="stat-value">${Object.keys(grouped).length}</div><div class="stat-label">Tenants</div></div>
  </div>

  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span class="card-title" style="margin-bottom:0"><i class="fas fa-file-archive"></i> Documents by Tenant</span>
      <button class="btn btn-primary btn-sm" onclick="showUploadModal()"><i class="fas fa-upload"></i> Upload Document</button>
    </div>
    ${Object.values(grouped).map(({tenant,docs:tDocs})=>`
      <div style="margin-bottom:16px;padding:14px;background:var(--bg3);border-radius:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div class="tenant-avatar" style="width:36px;height:36px;font-size:14px">${tenant.name[0]}</div>
          <div style="flex:1"><strong>${tenant.name}</strong> <span style="font-size:12px;color:var(--text3)">· ${tenant.id} · Room ${tenant.roomId.replace('R','')}</span></div>
          <span class="badge ${tDocs.length?'badge-success':'badge-danger'}">${tDocs.length} doc(s)</span>
        </div>
        ${tDocs.length===0?`<p style="font-size:13px;color:var(--text3)"><i class="fas fa-exclamation-triangle"></i> No documents uploaded</p>`:
        tDocs.map(d=>`
          <div class="doc-item">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="doc-icon">${docIcon(d.type)}</div>
              <div>
                <div style="font-size:13px;font-weight:600">${d.type}</div>
                <div style="font-size:11px;color:var(--text3)">${d.fileName} · ${formatDate(d.uploadDate)}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <a href="javascript:void(0)" onclick="viewDocument('${d.id}', '${d.fileName}', '${d.type}')" class="btn btn-primary btn-sm" style="padding:4px 8px; border-radius:4px;" title="View"><i class="fas fa-eye"></i> View</a>
              <span class="badge ${d.verified?'badge-success':'badge-warning'}">${d.verified?'Verified':'Pending'}</span>
              ${!d.verified?`<button class="btn btn-success btn-sm" onclick="verifyDoc('${d.id}')"><i class="fas fa-check"></i></button>`:''}
              <button class="btn btn-danger btn-sm" onclick="deleteDoc('${d.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </div>`).join('')}
        <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="showUploadModal('${tenant.id}')"><i class="fas fa-upload"></i> Upload for ${tenant.name.split(' ')[0]}</button>
      </div>`).join('')}
  </div>`;
}

function renderTenantDocs(docs, tenantId){
  return `
  <div class="page-header"><h1><i class="fas fa-folder-open" style="color:var(--accent)"></i> My Documents</h1></div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span class="card-title" style="margin-bottom:0">Uploaded Documents</span>
      <button class="btn btn-primary btn-sm" onclick="showUploadModal('${tenantId}')"><i class="fas fa-upload"></i> Upload New</button>
    </div>
    ${docs.length===0?`<div class="empty-state"><i class="fas fa-file-upload"></i><p>No documents uploaded yet. Upload your ID proof and photo.</p></div>`:
    docs.map(d=>`
      <div class="doc-item">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="doc-icon">${docIcon(d.type)}</div>
          <div>
            <div style="font-size:14px;font-weight:600">${d.type}</div>
            <div style="font-size:12px;color:var(--text3)">${d.fileName} · Uploaded ${formatDate(d.uploadDate)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <a href="javascript:void(0)" onclick="viewDocument('${d.id}', '${d.fileName}', '${d.type}')" class="btn btn-primary btn-sm" style="padding:4px 8px; border-radius:4px;" title="View"><i class="fas fa-eye"></i> View</a>
          <span class="badge ${d.verified?'badge-success':'badge-warning'}">${d.verified?'✓ Verified':'⏳ Pending'}</span>
        </div>
      </div>`).join('')}
  </div>
  <div class="card" style="margin-top:16px">
    <div class="card-title"><i class="fas fa-info-circle"></i> Required Documents</div>
    ${['Aadhar Card / Voter ID / Passport (any 1)','Recent Passport Size Photo','Address Proof (if different from ID)','Employment/College ID Card'].map((req,i)=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(61,45,122,.3)">
        <div style="width:26px;height:26px;border-radius:50%;background:${i<docs.length?'rgba(16,185,129,.2)':'rgba(245,158,11,.2)'};display:flex;align-items:center;justify-content:center;font-size:12px;color:${i<docs.length?'var(--success)':'var(--accent)'}">${i<docs.length?'✓':'!'}</div>
        <span style="font-size:13px;color:var(--text2)">${req}</span>
      </div>`).join('')}
  </div>`;
}

function docIcon(type){
  const map={Photo:'📷','Aadhar Card':'🪪',Passport:'📘','Voter ID':'🗳️',DL:'🚗',PAN:'💳'};
  return map[type]||'📄';
}

function showUploadModal(tenantId=''){
  const tenants = (DB.get('tenants')||[]).filter(t=>t.status==='active');
  showModal('Upload Document',`
    <div class="form-group"><label class="form-label">Tenant *</label>
      <select class="form-control" id="ud-tenant">
        ${tenants.map(t=>`<option value="${t.id}" ${t.id===tenantId?'selected':''}>${t.name} (${t.id})</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Document Type *</label>
        <select class="form-control" id="ud-type">
          <option>Aadhar Card</option><option>Passport</option><option>Voter ID</option><option>DL</option><option>PAN Card</option><option>Photo</option><option>College ID</option><option>Employment ID</option><option>Other</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">File Name *</label><input class="form-control" id="ud-file" placeholder="e.g. aadhar_front.pdf" /></div>
    </div>
    <div class="form-group">
      <label class="form-label">Upload File</label>
      <div style="border:2px dashed var(--border);border-radius:10px;padding:24px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="document.getElementById('file-input').click()">
        <i class="fas fa-cloud-upload-alt" style="font-size:28px;color:var(--primary-light);display:block;margin-bottom:8px"></i>
        <p style="font-size:13px;color:var(--text2)">Click to select file (PDF, JPG, PNG)</p>
        <p style="font-size:11px;color:var(--text3);margin-top:4px">Max 5MB</p>
        <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none" onchange="handleFileSelect(this)" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveDoc()"><i class="fas fa-upload"></i> Upload</button>
    </div>`,false);
}

let currentUploadData = null;
function handleFileSelect(input){
  const file = input.files[0];
  if(!file) return;
  document.getElementById('ud-file').value = file.name;
  const reader = new FileReader();
  reader.onload = function(e){
    currentUploadData = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveDoc(){
  const tenantId=document.getElementById('ud-tenant').value;
  const type=document.getElementById('ud-type').value;
  const fileName=document.getElementById('ud-file').value.trim();
  if(!tenantId||!fileName){ showToast('Fill all required fields','error'); return; }
  const tenant=(DB.get('tenants')||[]).find(t=>t.id===tenantId);
  const docs=DB.get('documents')||[];
  const docId=genId('D');
  docs.push({id:docId,tenantId,tenantName:tenant.name,type,fileName,uploadDate:new Date().toISOString().slice(0,10),verified:false});
  DB.set('documents',docs);
  
  if(currentUploadData){
    const fileStore = DB.get('document_files')||{};
    fileStore[docId] = currentUploadData;
    DB.set('document_files', fileStore);
    currentUploadData = null;
  }
  
  closeModal();
  showToast('Document uploaded!','success');
  navigateTo('documents');
}

function verifyDoc(id){
  const docs=DB.get('documents')||[];
  const d=docs.find(d=>d.id===id);
  if(d) d.verified=true;
  DB.set('documents',docs);
  showToast('Document verified!','success');
  navigateTo('documents');
}

function deleteDoc(id){
  if(!confirm('Delete this document?')) return;
  const docs=(DB.get('documents')||[]).filter(d=>d.id!==id);
  DB.set('documents',docs);
  showToast('Document deleted','warning');
  navigateTo('documents');
}

function viewDocument(docId, fileName, type){
  let icon = 'fa-file-alt';
  const isImg = fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg');
  const isPdf = fileName.endsWith('.pdf');
  if(isImg) icon = 'fa-file-image';
  else if(isPdf) icon = 'fa-file-pdf';

  const fileStore = DB.get('document_files')||{};
  const fileData = fileStore[docId];

  let previewHtml = `<div style="margin-top:20px;padding:16px;background:var(--bg3);border-radius:8px;border:1px dashed var(--border)">
         <p style="font-size:12px;color:var(--text2)"><em>No file content available. Please re-upload the document.</em></p>
      </div>`;

  if(fileData){
    if(isImg){
      previewHtml = `<div style="margin-top:20px;text-align:center;"><img src="${fileData}" style="max-width:100%;max-height:400px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.2)"/></div>`;
    } else if(isPdf){
      previewHtml = `<div style="margin-top:20px;height:400px"><iframe src="${fileData}" style="width:100%;height:100%;border:none;border-radius:8px"></iframe></div>`;
    }
  }

  showModal('Document Viewer', `
    <div style="text-align:center;padding:20px;padding-bottom:0">
      ${!fileData?`<i class="fas ${icon}" style="font-size:64px;color:var(--primary);margin-bottom:16px;"></i>`:''}
      <h3 style="font-size:16px;margin-bottom:8px">${fileName}</h3>
      <p style="font-size:13px;color:var(--text3)">Type: ${type}</p>
    </div>
    ${previewHtml}
    <div class="modal-footer" style="margin-top:20px">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `, false);
}
