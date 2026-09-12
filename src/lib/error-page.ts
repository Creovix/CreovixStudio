export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>CreovixStudio</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        font: 15px/1.6 "IBM Plex Sans Arabic", Inter, system-ui, sans-serif;
        background: #0b0d12;
        color: #f4f4f6;
      }
      .card {
        max-width: 28rem;
        width: 100%;
        text-align: center;
        padding: 2rem 1.75rem;
        border-radius: 1.15rem;
        background: linear-gradient(155deg, rgba(255,255,255,.055), rgba(255,255,255,.02) 46%, rgba(255,255,255,.03));
        border: 1px solid rgba(255,255,255,.08);
        box-shadow: 0 20px 40px rgba(0,0,0,.6);
        backdrop-filter: blur(22px);
      }
      h1 { font-size: 1.2rem; margin: 0 0 .5rem; }
      p { color: #a1a2a9; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap; }
      a, button {
        padding: .55rem 1.15rem;
        border-radius: 999px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid transparent;
      }
      .primary { background: #7c3aed; color: #fff; }
      .secondary { background: rgba(255,255,255,.04); color: #f4f4f6; border-color: rgba(255,255,255,.12); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 data-ar="تعذر تحميل الصفحة" data-en="This page didn't load">تعذر تحميل الصفحة</h1>
      <p data-ar="حدث خطأ غير متوقع في تحميل الصفحة، يمكنك المحاولة مرة أخرى أو العودة للرئيسية." data-en="An unexpected error occurred while loading this page. You can try again or go back home.">حدث خطأ غير متوقع في تحميل الصفحة، يمكنك المحاولة مرة أخرى أو العودة للرئيسية.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()" data-ar="إعادة المحاولة" data-en="Try again">إعادة المحاولة</button>
        <a class="secondary" href="/" data-ar="العودة للرئيسية" data-en="Go home">العودة للرئيسية</a>
      </div>
    </div>
    <script>
      (function () {
        try {
          var ar = localStorage.getItem("creovix.lang") !== "en";
          document.documentElement.lang = ar ? "ar" : "en";
          document.documentElement.dir = ar ? "rtl" : "ltr";
          document.querySelectorAll("[data-ar]").forEach(function (el) {
            el.textContent = ar ? el.getAttribute("data-ar") : el.getAttribute("data-en");
          });
        } catch (e) {}
      })();
    </script>
  </body>
</html>`;
}
