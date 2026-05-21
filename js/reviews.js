// ===================== REVIEWS MODULE =====================
function renderReviewsPage(){
  const user = getCurrentUser();
  const reviews = DB.get('reviews')||[];
  const approved = reviews.filter(r=>r.status==='approved');
  const pending = reviews.filter(r=>r.status==='pending');

  return `
  <div class="page-header">
    <h1><i class="fas fa-star" style="color:var(--accent)"></i> Reviews</h1>
    <p>${approved.length} approved · ${pending.length} pending approval</p>
  </div>

  ${user.role==='admin' && pending.length ? `
  <div class="card" style="margin-bottom:20px;border-color:rgba(245,158,11,.3)">
    <div class="card-title"><i class="fas fa-clock" style="color:var(--accent)"></i> Pending Approval (${pending.length})</div>
    ${pending.map(r=>`
      <div class="review-card" style="border-color:rgba(245,158,11,.3)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${r.name[0]}</div>
              <div><strong>${r.name}</strong><div style="font-size:11px;color:var(--text3)">${r.mobile} · ${formatDate(r.date)}</div></div>
            </div>
          </div>
          <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        </div>
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px;font-style:italic">"${r.comment}"</p>
        <div style="display:flex;gap:8px">
          <button class="btn btn-success btn-sm" onclick="approveReview('${r.id}')"><i class="fas fa-check"></i> Approve</button>
          <button class="btn btn-danger btn-sm" onclick="rejectReview('${r.id}')"><i class="fas fa-times"></i> Reject</button>
        </div>
      </div>`).join('')}
  </div>`:'' }

  <div class="grid-2">
    <div>
      <div class="card">
        <div class="card-title"><i class="fas fa-star" style="color:var(--accent)"></i> Approved Reviews</div>
        ${approved.length===0?'<div class="empty-state"><i class="fas fa-star"></i><p>No reviews yet</p></div>':
        approved.map(r=>`
          <div class="review-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:34px;height:34px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px">${r.name[0]}</div>
                <div><strong style="font-size:13px">${r.name}</strong><div style="font-size:11px;color:var(--text3)">${formatDate(r.date)}</div></div>
              </div>
              <div class="stars" style="font-size:12px">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
            <p style="font-size:13px;color:var(--text2);font-style:italic">"${r.comment}"</p>
            ${user.role==='admin'?`<button class="btn btn-danger btn-sm" style="margin-top:8px" onclick="rejectReview('${r.id}')"><i class="fas fa-trash"></i> Remove</button>`:''}
          </div>`).join('')}
      </div>
    </div>

    <div>
      <div class="card">
        <div class="card-title"><i class="fas fa-chart-bar"></i> Rating Summary</div>
        ${[5,4,3,2,1].map(star=>{
          const count = approved.filter(r=>r.rating===star).length;
          const pct = approved.length ? Math.round(count/approved.length*100) : 0;
          return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:13px;color:var(--text2);width:12px">${star}</span>
            <span style="color:var(--accent)">★</span>
            <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%;background:var(--accent)"></div></div>
            <span style="font-size:12px;color:var(--text3);width:30px">${count}</span>
          </div>`;
        }).join('')}
        <div style="margin-top:16px;text-align:center;padding:16px;background:var(--bg3);border-radius:10px">
          <div style="font-size:42px;font-weight:700;color:var(--accent)">${approved.length?(approved.reduce((s,r)=>s+r.rating,0)/approved.length).toFixed(1):'—'}</div>
          <div class="stars" style="font-size:18px;margin:6px 0">${approved.length?'★'.repeat(Math.round(approved.reduce((s,r)=>s+r.rating,0)/approved.length)):''}</div>
          <div style="font-size:12px;color:var(--text3)">${approved.length} review(s)</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-title"><i class="fas fa-pen"></i> Write a Review</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Your Name *</label><input class="form-control" id="rev-name" placeholder="Full name" value="${getCurrentUser().name!=='Guest'?getCurrentUser().name:''}" /></div>
          <div class="form-group"><label class="form-label">Mobile *</label><input class="form-control" id="rev-mobile" type="tel" maxlength="10" placeholder="Mobile number" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">Rating *</label>
          <div style="display:flex;gap:6px" id="star-picker">
            ${[1,2,3,4,5].map(s=>`<span style="font-size:28px;cursor:pointer;color:var(--text3);transition:color .2s" onclick="setRating(${s})" onmouseover="hoverRating(${s})" onmouseout="resetRating()" id="star-${s}">★</span>`).join('')}
          </div>
          <input type="hidden" id="rev-rating" value="0" />
        </div>
        <div class="form-group"><label class="form-label">Your Review *</label><textarea class="form-control" id="rev-comment" rows="4" placeholder="Share your experience at SLV PG..."></textarea></div>
        <button class="btn btn-primary" onclick="submitReview()"><i class="fas fa-paper-plane"></i> Submit Review</button>
        <p style="font-size:11px;color:var(--text3);margin-top:8px"><i class="fas fa-info-circle"></i> Reviews are published after admin approval.</p>
      </div>
    </div>
  </div>`;
}

let selectedRating = 0;
function setRating(n){
  selectedRating = n;
  document.getElementById('rev-rating').value = n;
  for(let i=1;i<=5;i++) document.getElementById(`star-${i}`).style.color = i<=n?'var(--accent)':'var(--text3)';
}
function hoverRating(n){ for(let i=1;i<=5;i++) document.getElementById(`star-${i}`).style.color = i<=n?'var(--accent)':'var(--text3)'; }
function resetRating(){ setRating(selectedRating); }

function submitReview(){
  const name=document.getElementById('rev-name').value.trim();
  const mobile=document.getElementById('rev-mobile').value.trim();
  const rating=parseInt(document.getElementById('rev-rating').value);
  const comment=document.getElementById('rev-comment').value.trim();
  if(!name){ showToast('Enter your name','error'); return; }
  if(!/^[6-9]\d{9}$/.test(mobile)){ showToast('Enter valid mobile','error'); return; }
  if(!rating){ showToast('Select a rating','error'); return; }
  if(comment.length<10){ showToast('Write a detailed review (min 10 chars)','error'); return; }
  const reviews=DB.get('reviews')||[];
  reviews.push({id:genId('Rev'),name,mobile,rating,comment,date:new Date().toISOString().slice(0,10),status:'pending'});
  DB.set('reviews',reviews);
  addNotification({to:'admin',type:'review',title:'New Review Pending',message:`${name} submitted a ${rating}-star review. Please review and approve.`});
  showToast('Review submitted! It will appear after admin approval.','success');
  navigateTo('reviews');
}

function approveReview(id){
  const reviews=DB.get('reviews')||[];
  const r=reviews.find(r=>r.id===id);
  if(r) r.status='approved';
  DB.set('reviews',reviews);
  showToast('Review approved!','success');
  navigateTo('reviews');
}

function rejectReview(id){
  if(!confirm('Remove this review?')) return;
  const reviews=(DB.get('reviews')||[]).filter(r=>r.id!==id);
  DB.set('reviews',reviews);
  showToast('Review removed','warning');
  navigateTo('reviews');
}
