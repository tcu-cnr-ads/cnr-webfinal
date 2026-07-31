/* The Construction Update — front-end behaviour
   No dependencies. Everything degrades gracefully without JS. */

(function () {
  "use strict";

  var BASE = document.documentElement.getAttribute("data-base") || "";

  /* ---- Mark the current section in the nav ---- */
  function markCurrentNav() {
    var path = window.location.pathname;
    document.querySelectorAll(".mainnav a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.indexOf("#") > -1) return;
      var isHome = href === BASE + "/" || href === "/";
      if (isHome ? path === BASE + "/" || path === "/" || path === BASE + "/index.html"
                 : href.length > 1 && path.indexOf(href) === 0) {
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---- Send the header search box to the results page ---- */
  function wireSearchForms() {
    document.querySelectorAll("form.search").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = form.querySelector("input[name=q]").value.trim();
        if (!q) return;
        window.location.href = BASE + "/search/?q=" + encodeURIComponent(q);
      });
    });
  }

  /* ---- Results page ---- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cardHtml(post) {
    var thumb = post.image
      ? '<a class="thumb" href="' + post.url + '"><img src="' + escapeHtml(post.image) +
        '" alt="" loading="lazy"></a>'
      : "";
    return (
      '<article class="card' + (post.image ? "" : " no-thumb") + '">' +
      thumb +
      '<div class="card-body">' +
      '<a class="label" data-cat="' + escapeHtml(post.category) + '" href="' +
      BASE + "/search/label/" + encodeURIComponent(post.category) + '/">' + escapeHtml(post.category) + "</a>" +
      '<h3><a href="' + post.url + '">' + escapeHtml(post.title) + "</a></h3>" +
      "<p>" + escapeHtml(post.excerpt || "") + "</p>" +
      '<p class="byline">By ' + escapeHtml(post.author) + " &middot; " + escapeHtml(post.dateDisplay) + "</p>" +
      "</div></article>"
    );
  }

  function runSearchPage() {
    var box = document.getElementById("results");
    if (!box) return;

    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim();
    var heading = document.getElementById("search-heading");
    var input = document.querySelector("#search-page-form input[name=q]");
    if (input) input.value = q;

    if (!q) {
      box.innerHTML = '<p class="notice">Type a keyword above to search the archive.</p>';
      return;
    }
    if (heading) heading.textContent = 'Results for "' + q + '"';
    box.innerHTML = '<p class="notice">Searching…</p>';

    fetch(BASE + "/search-index.json")
      .then(function (r) { return r.json(); })
      .then(function (posts) {
        var terms = q.toLowerCase().split(/\s+/);
        var hits = posts
          .map(function (p) {
            var hay = (p.title + " " + p.excerpt + " " + p.category + " " + (p.tags || []).join(" ")).toLowerCase();
            var score = 0;
            terms.forEach(function (t) {
              if (p.title.toLowerCase().indexOf(t) > -1) score += 3;
              if (hay.indexOf(t) > -1) score += 1;
            });
            return { post: p, score: score };
          })
          .filter(function (h) { return h.score > 0; })
          .sort(function (a, b) { return b.score - a.score; });

        if (!hits.length) {
          box.innerHTML = '<p class="notice">No stories match “' + escapeHtml(q) +
            '”. Try a shorter keyword, or browse the sections above.</p>';
          return;
        }
        box.innerHTML = hits.map(function (h) { return cardHtml(h.post); }).join("");
      })
      .catch(function () {
        box.innerHTML = '<p class="notice">Search is unavailable right now. Browse the sections above instead.</p>';
      });
  }

  /* ---- Share links on articles ---- */
  function wireShare() {
    var copy = document.querySelector("[data-copy-link]");
    if (!copy) return;
    copy.addEventListener("click", function (e) {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.href).then(function () {
        var original = copy.textContent;
        copy.textContent = "Link copied";
        setTimeout(function () { copy.textContent = original; }, 1800);
      });
    });
  }

  /* ---- Footer year ---- */
  function setYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  markCurrentNav();
  wireSearchForms();
  runSearchPage();
  wireShare();
  setYear();
})();
