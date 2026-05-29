// ===================== SLV PG — SYSTEM-WIDE DATA EXPORTER =====================

function escapeXML(val) {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function showExportOptionsModal() {
  showModal('Export Web Application Level Data', `
    <style>
      .export-option-card {
        padding: 16px;
        background: var(--bg3);
        border: 1px solid var(--border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        gap: 14px;
        align-items: center;
        margin-bottom: 12px;
      }
      .export-option-card:hover {
        border-color: var(--primary) !important;
        transform: translateY(-2px);
        background: rgba(124, 58, 237, 0.05);
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.12);
      }
      .export-option-card:last-child {
        margin-bottom: 0;
      }
    </style>
    <div style="text-align:center;padding:10px 0 15px">
      <div style="width:68px;height:68px;background:rgba(124,58,237,.12);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;color:var(--primary);margin:0 auto 16px;box-shadow: 0 4px 12px rgba(124,58,237,0.15)">
        <i class="fas fa-file-export"></i>
      </div>
      <h3 style="font-size:18px;margin-bottom:8px;font-family:'Poppins',sans-serif">Select Export Report Format</h3>
      <p style="color:var(--text3);font-size:13.5px;max-width:400px;margin:0 auto 24px;line-height:1.5">
        Compile and download all database tables, financial records, room occupancies, reviews, and site visits from the PG management system.
      </p>
      
      <div style="max-width:420px;margin:0 auto;text-align:left">
        <!-- Option 1: Premium HTML Executive Report -->
        <div class="export-option-card" onclick="exportApplicationDataHTML()">
          <div style="width:44px;height:44px;background:rgba(16,185,129,0.15);color:var(--success);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
            <i class="fas fa-file-invoice-dollar"></i>
          </div>
          <div style="flex:1">
            <strong style="font-size:14px;color:var(--text)">Comprehensive Executive HTML Report</strong>
            <p style="font-size:11.5px;color:var(--text3);margin-top:2px">A beautiful, printable single-page dashboard of rooms, tenants, financials, expenses, and visits.</p>
          </div>
        </div>
        
        <!-- Option 2: JSON Database Backup -->
        <div class="export-option-card" onclick="exportApplicationDataJSON()">
          <div style="width:44px;height:44px;background:rgba(59,130,246,0.15);color:var(--info);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
            <i class="fas fa-database"></i>
          </div>
          <div style="flex:1">
            <strong style="font-size:14px;color:var(--text)">Full Database Backup (JSON)</strong>
            <p style="font-size:11.5px;color:var(--text3);margin-top:2px">Complete relational tables in a single JSON file. Ideal for secure offsite backups and restoration.</p>
          </div>
        </div>

        <!-- Option 3: Premium Multi-Sheet Excel Workbook -->
        <div class="export-option-card" onclick="exportApplicationDataExcel()">
          <div style="width:44px;height:44px;background:rgba(245,158,11,0.15);color:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">
            <i class="fas fa-file-excel"></i>
          </div>
          <div style="flex:1">
            <strong style="font-size:14px;color:var(--text)">Multi-Sheet Excel Workbook (.xls)</strong>
            <p style="font-size:11.5px;color:var(--text3);margin-top:2px">All database tables compiled into separate worksheet tabs inside a single Excel workbook file.</p>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  `, false);
}

function exportApplicationDataJSON() {
  const data = {
    exportDate: new Date().toISOString(),
    appName: "Tarak Ram PG (Sri Lakshmi Venkateswara Women's PG)",
    tables: {
      users: DB.get('users') || [],
      rooms: DB.get('rooms') || [],
      tenants: DB.get('tenants') || [],
      payments: DB.get('payments') || [],
      notifications: DB.get('notifications') || [],
      documents: DB.get('documents') || [],
      reviews: DB.get('reviews') || [],
      visits: DB.get('visits') || [],
      expenses: DB.get('expenses') || []
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tarakram_pg_full_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  closeModal();
  showToast('Database JSON backup downloaded successfully!', 'success');
}

function exportApplicationDataExcel() {
  const rooms = getRoomOccupancy();
  const tenants = DB.get('tenants') || [];
  const payments = DB.get('payments') || [];
  const expenses = DB.get('expenses') || [];
  const visits = DB.get('visits') || [];
  const reviews = DB.get('reviews') || [];
  
  const totalBeds = rooms.reduce((s,r)=>s+r.beds,0);
  const occupiedBeds = rooms.reduce((s,r)=>s+r.occupied,0);
  const vacantBeds = totalBeds - occupiedBeds;
  const totalRentAmount = tenants.reduce((s,t)=>s+t.rent,0);
  
  const currentMonth = new Date().toISOString().slice(0,7);
  const mPayments = payments.filter(p=>p.month===currentMonth);
  const collectedThisMonth = mPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const pendingThisMonth = mPayments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.amount,0);
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  const totalPaidEver = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const netEarnings = totalPaidEver - totalExpenses;

  // XML Header & Styles
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Tarak Ram PG Executive System</Author>
  <LastAuthor>Admin</LastAuthor>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#1F2937"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#7C3AED" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="16" ss:Color="#7C3AED" ss:Bold="1"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Label">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#374151"/>
  </Style>
  <Style ss:ID="Value">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11"/>
  </Style>
  <Style ss:ID="Amount">
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="11" ss:Color="#1F2937"/>
   <NumberFormat ss:Format="&quot;₹&quot;#,##0"/>
  </Style>
 </Styles>
`;

  // WORKSHEET 1: Executive Summary Dashboard
  xml += ` <Worksheet ss:Name="Executive Summary">
  <Table>
   <Row ss:Height="30">
    <Cell ss:MergeAcross="2" ss:StyleID="Title"><Data ss:Type="String">TARAK RAM PG SYSTEM EXECUTIVE SUMMARY</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row>
    <Cell ss:StyleID="Label"><Data ss:Type="String">Metric Description</Data></Cell>
    <Cell ss:StyleID="Label"><Data ss:Type="String">Value</Data></Cell>
    <Cell ss:StyleID="Label"><Data ss:Type="String">Status/Subtext</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Active PG Residents</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="Number">${tenants.filter(t=>t.status==='active').length}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Active occupied beds</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Occupancy Rate</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">${Math.round(occupiedBeds/totalBeds*100)}%</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">${occupiedBeds} occupied / ${vacantBeds} vacant beds</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Total Room Capacity</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="Number">${totalBeds}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Total beds mapped in PG floor plan</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Expected Monthly Billings</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${totalRentAmount}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Standard rent roster cycle value</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Collections (${currentMonth})</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${collectedThisMonth}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Dues successfully collected</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Outstanding Dues (${currentMonth})</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${pendingThisMonth}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">${mPayments.filter(p=>p.status==='pending').length} tenants pending payment</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Cumulative Collected Rent (All Time)</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${totalPaidEver}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Total historic revenue</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Cumulative Operational Expenses</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${totalExpenses}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Total operational outflows</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Cumulative Net Cash Margin</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${netEarnings}</Data></Cell>
    <Cell ss:StyleID="Value"><Data ss:Type="String">Roster balance margin</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

  // WORKSHEET 2: Tenants Register
  xml += ` <Worksheet ss:Name="Residents">
  <Table>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tenant ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mobile</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Room ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Bed No</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Occupation</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Company/Institution</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Monthly Rent</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Security Deposit</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Join Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>
`;
  tenants.forEach(t => {
    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXML(t.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.mobile)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.roomId.replace('R',''))}</Data></Cell>
    <Cell><Data ss:Type="Number">${t.bedNo}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.occupation)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.company)}</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${t.rent}</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${t.deposit}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(formatDate(t.joinDate))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(t.status)}</Data></Cell>
   </Row>
`;
  });
  xml += `  </Table>
 </Worksheet>
`;

  // WORKSHEET 3: Rooms Mapping
  xml += ` <Worksheet ss:Name="Rooms Allocation">
  <Table>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Room ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Room Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Floor</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Beds Capacity</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Occupied Beds</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Vacant Beds</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Room Type</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Monthly Rent / Bed</Data></Cell>
   </Row>
`;
  rooms.forEach(r => {
    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXML(r.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.number)}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.floor}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.beds}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.occupied || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.beds - (r.occupied || 0)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.type)}</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${r.rent}</Data></Cell>
   </Row>
`;
  });
  xml += `  </Table>
 </Worksheet>
`;

  // WORKSHEET 4: Payments Register
  xml += ` <Worksheet ss:Name="Rent Register">
  <Table>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Payment ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tenant ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tenant Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Room No</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Month</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Amount</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Paid On</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Payment Mode</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Transaction ID</Data></Cell>
   </Row>
`;
  payments.forEach(p => {
    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXML(p.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.tenantId)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.tenantName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.roomId.replace('R',''))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.month)}</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${p.amount}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.paidOn ? formatDate(p.paidOn) : '—')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.paymentMode || '—')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.txnId || '—')}</Data></Cell>
   </Row>
`;
  });
  xml += `  </Table>
 </Worksheet>
`;

  // WORKSHEET 5: Operational Expenses
  xml += ` <Worksheet ss:Name="Expenses Log">
  <Table>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Expense ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Transaction ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Item Details</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Amount</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Payment Method</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Paid By</Data></Cell>
   </Row>
`;
  expenses.forEach(e => {
    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXML(e.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(e.txnId)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(formatDate(e.date))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(e.category)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(e.itemDetails)}</Data></Cell>
    <Cell ss:StyleID="Amount"><Data ss:Type="Number">${e.amount}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(e.paymentMethod)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(e.paidBy)}</Data></Cell>
   </Row>
`;
  });
  xml += `  </Table>
 </Worksheet>
`;

  // WORKSHEET 6: Site Visit bookings
  xml += ` <Worksheet ss:Name="Guest Visits">
  <Table>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Visit ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Visitor Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mobile</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Scheduled Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Timeslot</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Purpose</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Notes</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>
`;
  visits.forEach(v => {
    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXML(v.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(v.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(v.mobile)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(formatDate(v.date))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(v.time)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(v.purpose)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(v.notes)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(v.status)}</Data></Cell>
   </Row>
`;
  });
  xml += `  </Table>
 </Worksheet>
`;

  // WORKSHEET 7: Feedback & Reviews
  xml += ` <Worksheet ss:Name="Reviews">
  <Table>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Review ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Author Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mobile</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Rating</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Comment</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>
`;
  reviews.forEach(r => {
    xml += `   <Row>
    <Cell><Data ss:Type="String">${escapeXML(r.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.mobile)}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.rating}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.comment)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(formatDate(r.date))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.status)}</Data></Cell>
   </Row>
`;
  });
  xml += `  </Table>
 </Worksheet>
`;

  xml += `</Workbook>`;

  const blob = new Blob([xml], {type: 'application/vnd.ms-excel'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tarakram_pg_executive_database_${new Date().toISOString().slice(0,10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
  closeModal();
  showToast('Excel Multi-Sheet Workbook downloaded successfully!', 'success');
}

function exportApplicationDataHTML() {
  const tenants = DB.get('tenants') || [];
  const rooms = getRoomOccupancy();
  const payments = DB.get('payments') || [];
  const expenses = DB.get('expenses') || [];
  const visits = DB.get('visits') || [];
  const reviews = DB.get('reviews') || [];
  
  const totalBeds = rooms.reduce((s,r)=>s+r.beds,0);
  const occupiedBeds = rooms.reduce((s,r)=>s+r.occupied,0);
  const vacantBeds = totalBeds - occupiedBeds;
  const totalRentAmount = tenants.reduce((s,t)=>s+t.rent,0);
  
  const currentMonth = new Date().toISOString().slice(0,7);
  const mPayments = payments.filter(p=>p.month===currentMonth);
  const collectedThisMonth = mPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const pendingThisMonth = mPayments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.amount,0);
  
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  const totalPaidEver = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const netEarnings = totalPaidEver - totalExpenses;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tarak Ram PG - System Executive Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
    :root {
      --primary: #7c3aed;
      --secondary: #ec4899;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --info: #3b82f6;
      --bg: #0b0f19;
      --card: #151c2c;
      --border: rgba(255, 255, 255, 0.08);
      --text: #f3f4f6;
      --text2: #9ca3af;
      --text3: #6b7280;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(236, 72, 153, 0.15));
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logo-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
    }
    
    .logo-text h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #fff, #e0e0e0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .logo-text p {
      font-size: 12px;
      color: var(--text3);
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 600;
    }
    
    .header-meta {
      text-align: right;
    }
    
    .header-meta h2 {
      font-size: 14px;
      color: var(--text2);
      font-weight: 500;
    }
    
    .header-meta p {
      font-size: 12px;
      color: var(--text3);
      margin-top: 4px;
    }
    
    .actions-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 30px;
      justify-content: flex-end;
    }
    
    .btn {
      padding: 10px 18px;
      border-radius: 10px;
      border: 1px solid var(--border);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--card);
      color: var(--text);
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      background: rgba(255, 255, 255, 0.05);
      transform: translateY(-1px);
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border: none;
    }
    
    .btn-primary:hover {
      opacity: 0.9;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 35px;
    }
    
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
    }
    
    .stat-card.purple::after { background: var(--primary); }
    .stat-card.green::after { background: var(--success); }
    .stat-card.pink::after { background: var(--secondary); }
    .stat-card.amber::after { background: var(--warning); }
    .stat-card.blue::after { background: var(--info); }
    
    .stat-label {
      font-size: 12.5px;
      color: var(--text2);
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .stat-val {
      font-family: 'Poppins', sans-serif;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .stat-sub {
      font-size: 11px;
      color: var(--text3);
    }
    
    .section-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 30px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 12px;
    }
    
    .section-title {
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-title i {
      color: var(--primary);
    }
    
    .search-input {
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      width: 220px;
      outline: none;
    }
    
    .search-input:focus {
      border-color: var(--primary);
    }
    
    .table-wrap {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    
    th {
      color: var(--text2);
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.01);
    }
    
    td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      color: var(--text);
    }
    
    tr:hover {
      background: rgba(255,255,255,0.01);
    }
    
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .badge-purple { background: rgba(124, 58, 237, 0.15); color: #c084fc; }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    
    .stars {
      color: var(--warning);
      letter-spacing: 2px;
    }
    
    .footer-note {
      text-align: center;
      padding: 20px 0 40px;
      color: var(--text3);
      font-size: 12px;
      border-top: 1px solid var(--border);
      margin-top: 40px;
    }

    @media print {
      body {
        background: #fff !important;
        color: #000 !important;
        padding: 0;
      }
      :root {
        --bg: #fff;
        --card: #fff;
        --text: #000;
        --text2: #333;
        --text3: #666;
        --border: #ddd;
      }
      .actions-bar, .search-input {
        display: none !important;
      }
      .section-card, header, .stat-card {
        border: 1px solid #ccc !important;
        background: #fff !important;
        box-shadow: none !important;
        page-break-inside: avoid;
      }
      th {
        background: #eee !important;
        border-bottom: 2px solid #ccc !important;
      }
      td {
        border-bottom: 1px solid #ddd !important;
      }
      .logo-icon {
        background: #333 !important;
        -webkit-print-color-adjust: exact;
      }
      .logo-text h1 {
        -webkit-text-fill-color: initial !important;
        color: #000 !important;
      }
      .stat-card.purple::after, .stat-card.green::after, .stat-card.pink::after, .stat-card.amber::after, .stat-card.blue::after {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-container">
        <div class="logo-icon"><i class="fas fa-home"></i></div>
        <div class="logo-text">
          <h1>Tarak Ram PG (Sri Lakshmi Venkateswara PG)</h1>
          <p>Comprehensive Executive System Report</p>
        </div>
      </div>
      <div class="header-meta">
        <h2>Report Generated On</h2>
        <p style="font-size:14px; font-weight:600; color:var(--text2)">${new Date().toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
        <p>Application Database Sync: Supabase Live Connect</p>
      </div>
    </header>
    
    <div class="actions-bar">
      <button class="btn" onclick="window.print()"><i class="fas fa-print"></i> Print Report / Save PDF</button>
      <button class="btn btn-primary" onclick="window.close()"><i class="fas fa-times"></i> Close Report</button>
    </div>
    
    <!-- STATS OVERVIEW -->
    <div class="stats-grid">
      <div class="stat-card purple">
        <span class="stat-label">Active Residents</span>
        <span class="stat-val">${tenants.filter(t=>t.status==='active').length}</span>
        <span class="stat-sub">${tenants.filter(t=>t.status!=='active').length} previous checked out</span>
      </div>
      <div class="stat-card green">
        <span class="stat-label">Occupancy Rate</span>
        <span class="stat-val">${Math.round(occupiedBeds/totalBeds*100)}%</span>
        <span class="stat-sub">${occupiedBeds} occupied / ${vacantBeds} beds vacant</span>
      </div>
      <div class="stat-card pink">
        <span class="stat-label">Monthly Billing (Expected)</span>
        <span class="stat-val">₹${totalRentAmount.toLocaleString()}</span>
        <span class="stat-sub">AC: ₹8,000 · Non-AC: ₹6,000 base</span>
      </div>
      <div class="stat-card amber">
        <span class="stat-label">Collections (${currentMonth})</span>
        <span class="stat-val">₹${collectedThisMonth.toLocaleString()}</span>
        <span class="stat-sub">Pending due: ₹${pendingThisMonth.toLocaleString()} (${mPayments.filter(p=>p.status==='pending').length} tenants)</span>
      </div>
      <div class="stat-card blue">
        <span class="stat-label">Cumulative Net Cashflow</span>
        <span class="stat-val" style="color: ${netEarnings >= 0 ? 'var(--success)' : 'var(--danger)'}">₹${netEarnings.toLocaleString()}</span>
        <span class="stat-sub">Total Collected: ₹${totalPaidEver.toLocaleString()} | Expenses: ₹${totalExpenses.toLocaleString()}</span>
      </div>
    </div>
    
    <!-- ROOMS & OCCUPANCY -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-building"></i> Rooms and Bed Allocation</h3>
        <input type="text" class="search-input" onkeyup="filterTable('rooms-table', this)" placeholder="Search rooms...">
      </div>
      <div class="table-wrap">
        <table id="rooms-table">
          <thead>
            <tr>
              <th>Room No</th>
              <th>Floor</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Room Type</th>
              <th>Rate / Bed</th>
              <th>Active Members</th>
            </tr>
          </thead>
          <tbody>
            ${rooms.map(r => {
              const cls = r.occupied===0?'badge-success':r.occupied===r.beds?'badge-danger':'badge-warning';
              const text = r.occupied===0?'Vacant':r.occupied===r.beds?'Fully Occupied':`${r.occupied}/${r.beds} Beds Occupied`;
              const mNames = (r.members || []).map(m => m.Tenant_Name).join(', ') || '—';
              return `
              <tr>
                <td><strong>Room ${r.number}</strong></td>
                <td>Floor ${r.floor}</td>
                <td>${r.beds} Beds</td>
                <td><span class="badge ${cls}">${text}</span></td>
                <td><span class="badge badge-purple">${r.type}</span></td>
                <td>₹${r.rent.toLocaleString()}/mo</td>
                <td style="color:var(--text2); font-size:12.5px">${mNames}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- TENANTS REGISTER -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-users"></i> PG Resident Register</h3>
        <input type="text" class="search-input" onkeyup="filterTable('tenants-table', this)" placeholder="Search tenants...">
      </div>
      <div class="table-wrap">
        <table id="tenants-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant Name</th>
              <th>Mobile</th>
              <th>Room Alloc</th>
              <th>Join Date</th>
              <th>Monthly Rent</th>
              <th>Security Deposit</th>
              <th>Occupation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tenants.map(t => `
            <tr>
              <td><span class="badge badge-purple">${t.id}</span></td>
              <td><strong>${t.name}</strong></td>
              <td>${t.mobile}</td>
              <td>Room ${t.roomId.replace('R','')} · Bed ${t.bedNo}</td>
              <td>${formatDate(t.joinDate)}</td>
              <td>₹${t.rent.toLocaleString()}</td>
              <td>₹${t.deposit.toLocaleString()}</td>
              <td>${t.occupation} · ${t.company}</td>
              <td><span class="badge ${t.status==='active'?'badge-success':'badge-danger'}">${t.status}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- RENT TRANSACTIONS -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-rupee-sign"></i> Rent Payments Register</h3>
        <input type="text" class="search-input" onkeyup="filterTable('payments-table', this)" placeholder="Search payments...">
      </div>
      <div class="table-wrap">
        <table id="payments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Month</th>
              <th>Resident Name</th>
              <th>Room No</th>
              <th>Expected Rent</th>
              <th>Status</th>
              <th>Paid On</th>
              <th>Payment Mode</th>
              <th>Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
            <tr>
              <td><span class="badge badge-purple">${p.id}</span></td>
              <td><strong>${p.month}</strong></td>
              <td>${p.tenantName}</td>
              <td>Room ${p.roomId.replace('R','')}</td>
              <td>₹${p.amount.toLocaleString()}</td>
              <td><span class="badge ${p.status==='paid'?'badge-success':'badge-danger'}">${p.status}</span></td>
              <td>${p.paidOn ? formatDate(p.paidOn) : '—'}</td>
              <td><span class="badge badge-info">${p.paymentMode || '—'}</span></td>
              <td style="font-family:monospace; color:var(--text2)">${p.txnId || '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- EXPENSES RECORD -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-wallet"></i> Operational Expenses</h3>
        <input type="text" class="search-input" onkeyup="filterTable('expenses-table', this)" placeholder="Search expenses...">
      </div>
      <div class="table-wrap">
        <table id="expenses-table">
          <thead>
            <tr>
              <th>TXN ID</th>
              <th>Date</th>
              <th>Category</th>
              <th>Item Details</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Paid By</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(e => `
            <tr>
              <td style="font-family:monospace"><strong>${e.txnId}</strong></td>
              <td>${formatDate(e.date)}</td>
              <td><span class="badge badge-purple">${e.category}</span></td>
              <td>${e.itemDetails}</td>
              <td style="color:var(--danger); font-weight:600">₹${e.amount.toLocaleString()}</td>
              <td><span class="badge badge-info">${e.paymentMethod}</span></td>
              <td>${e.paidBy}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- SITE VISITS -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-calendar-check"></i> Scheduled Guest Site Visits</h3>
        <input type="text" class="search-input" onkeyup="filterTable('visits-table', this)" placeholder="Search visits...">
      </div>
      <div class="table-wrap">
        <table id="visits-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Visitor Name</th>
              <th>Mobile</th>
              <th>Scheduled Date</th>
              <th>Timeslot</th>
              <th>Purpose</th>
              <th>Notes / Requirements</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${visits.map(v => `
            <tr>
              <td><span class="badge badge-purple">${v.id}</span></td>
              <td><strong>${v.name}</strong></td>
              <td>${v.mobile}</td>
              <td>${formatDate(v.date)}</td>
              <td><i class="far fa-clock" style="color:var(--primary)"></i> ${v.time}</td>
              <td>${v.purpose || '—'}</td>
              <td style="color:var(--text2); font-style:italic">"${v.notes || '—'}"</td>
              <td><span class="badge ${v.status==='confirmed'?'badge-success':v.status==='pending'?'badge-warning':'badge-danger'}">&nbsp;${v.status}&nbsp;</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- CUSTOMER REVIEWS -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-star"></i> Resident Feedback &amp; Reviews</h3>
        <input type="text" class="search-input" onkeyup="filterTable('reviews-table', this)" placeholder="Search reviews...">
      </div>
      <div class="table-wrap">
        <table id="reviews-table">
          <thead>
            <tr>
              <th>Rating</th>
              <th>Author Name</th>
              <th>Mobile</th>
              <th>Comments</th>
              <th>Date</th>
              <th>Moderation Status</th>
            </tr>
          </thead>
          <tbody>
            ${reviews.map(r => `
            <tr>
              <td><span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></td>
              <td><strong>${r.name}</strong></td>
              <td>${r.mobile}</td>
              <td style="font-style:italic">"${r.comment}"</td>
              <td>${formatDate(r.date)}</td>
              <td><span class="badge ${r.status==='approved'?'badge-success':'badge-warning'}">${r.status}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="footer-note">
      <p>© ${new Date().getFullYear()} Tarak Ram PG. All rights reserved. System data secured via Supabase Live Sync.</p>
      <p style="margin-top:5px; color:var(--text3)">Generated by Tarak Ram PG Executive Engine. Save this page locally as offline backup dashboard.</p>
    </div>
  </div>
  
  <script>
    function filterTable(tableId, inputEl) {
      const filter = inputEl.value.toUpperCase();
      const table = document.getElementById(tableId);
      const rows = table.getElementsByTagName("tr");
      
      for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].getElementsByTagName("td");
        let found = false;
        for (let j = 0; j < cells.length; j++) {
          if (cells[j]) {
            const txtValue = cells[j].textContent || cells[j].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
              found = true;
              break;
            }
          }
        }
        rows[i].style.display = found ? "" : "none";
      }
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tarakram_pg_executive_system_report_${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
  closeModal();
  showToast('Executive system HTML report generated successfully!', 'success');
}
