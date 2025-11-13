const fs = require('fs');
const path = require('path');
const { defineConfig } = require('vite');

function headerIncludePlugin() {
  const partialPath = path.join(process.cwd(), 'src', 'partials', 'header.html');
  return {
    name: 'html-header-include',
    transformIndexHtml(html) {
      if (!fs.existsSync(partialPath)) return html;
      const header = fs.readFileSync(partialPath, 'utf8');
      return html.replace(/<!-- @@header -->/g, header);
    }
    ,
    configureServer(server) {
      // middleware to replace header marker in any served HTML (including files in public/)
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = req.url.split('?')[0];
          if (!url.endsWith('.html')) return next();

          const root = process.cwd();
          const partialPath = path.join(root, 'src', 'partials', 'header.html');

          // normalize url: strip leading slash so path.join works cross-platform
          const urlPath = url.startsWith('/') ? url.slice(1) : url;

          // candidate locations: public/<urlPath>, <urlPath> (relative to project root)
          const candidatePaths = [
            path.join(root, 'public', urlPath),
            path.join(root, urlPath)
          ];

          let filePath = null;
          for (const p of candidatePaths) {
            if (fs.existsSync(p)) { filePath = p; break; }
          }

          if (!filePath) return next();

          let html = await fs.promises.readFile(filePath, 'utf8');

          if (html.includes('<!-- @@header -->') && fs.existsSync(partialPath)) {
            const header = await fs.promises.readFile(partialPath, 'utf8');
            html = html.replace(/<!-- @@header -->/g, header);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (e) {
          next();
        }
      });
    }
  };
}

module.exports = defineConfig({
  plugins: [headerIncludePlugin()]
});
