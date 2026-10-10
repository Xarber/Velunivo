"""Serve the web export with Expo Router SPA fallback; no dependencies."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import os
EXPORT_DIRECTORY=Path(__file__).resolve().parents[1]/'dist'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(EXPORT_DIRECTORY), **kwargs)
    def end_headers(self):
        if urlparse(self.path).path in ['/sw.js','/index.html','/manifest.webmanifest']:
            self.send_header('Cache-Control','no-cache')
        super().end_headers()
    def guess_type(self, path):
        if path.endswith('.webmanifest'): return 'application/manifest+json'
        return super().guess_type(path)
    def do_GET(self):
        requested=Path(self.translate_path(urlparse(self.path).path))
        if not requested.exists() and not Path(urlparse(self.path).path).suffix:
            self.path='/index.html'
        super().do_GET()
ThreadingHTTPServer(('127.0.0.1', int(os.getenv('WEB_PORT','8082'))), Handler).serve_forever()
