const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve the static frontend folder (parent of server folder)
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`\n🖥️ SLV PG Frontend running at http://localhost:${PORT}\n`);
});
