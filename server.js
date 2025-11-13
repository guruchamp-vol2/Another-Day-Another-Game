import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 10000;

// Correct content-types for wasm/wasm-like or hdr/png/glb
app.use((req, res, next) => {
  const type = mime.getType(req.path);
  if (type) res.type(type);
  next();
});

// Serve static files
app.use(express.static(__dirname, { extensions: ['html'] }));

// Single-page fallback for module imports and deep links
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`NEON HAVOC server running on port ${port}`);
});
