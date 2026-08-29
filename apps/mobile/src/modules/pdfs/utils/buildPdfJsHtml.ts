/**
 * In-app PDF HTML for WebView (pdf.js).
 * Android System WebView cannot render application/pdf URLs — it shows a blank page.
 */
export function buildPdfJsHtml(base64: string): string {
  const payload = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
  <style>
    html, body { margin: 0; padding: 0; background: #111; }
    #viewer { padding: 8px 0 24px; }
    canvas { display: block; width: 100%; height: auto; margin: 0 auto 10px; background: #fff; }
    #err { color: #f5c6c6; font: 16px sans-serif; padding: 24px; text-align: center; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <div id="viewer"></div>
  <script>
    (function () {
      function fail(msg) {
        var el = document.getElementById('viewer');
        el.innerHTML = '<p id="err">' + msg + '</p>';
      }
      try {
        if (typeof pdfjsLib === 'undefined') {
          fail('Could not load PDF engine. Check internet and retry.');
          return;
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        var raw = atob('${payload}');
        var bytes = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        pdfjsLib.getDocument({ data: bytes }).promise.then(function (pdf) {
          var max = Math.min(pdf.numPages, 80);
          function draw(n) {
            pdf.getPage(n).then(function (page) {
              var scale = 1.4;
              var viewport = page.getViewport({ scale: scale });
              var canvas = document.createElement('canvas');
              var ctx = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              document.getElementById('viewer').appendChild(canvas);
              return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
                if (n < max) draw(n + 1);
              });
            });
          }
          draw(1);
        }).catch(function () {
          fail('Could not render this PDF.');
        });
      } catch (e) {
        fail('Could not open this PDF.');
      }
    })();
  </script>
</body>
</html>`;
}
