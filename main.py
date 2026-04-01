import re  # For mass commenting out SQL Queries

from flask import Flask
from flask import render_template
from flask import request
from flask import redirect
from flask import url_for

import database_manager as dbHandler

app = Flask(__name__)


SEARCH_QUERY_PATTERN = re.compile(r"[^a-zA-Z0-9\s'\-]")

CSP_POLICY = (
    "default-src 'self'; "
    "base-uri 'self'; "
    "form-action 'self'; "
    "frame-ancestors 'none'; "
    "object-src 'none'; "
    "script-src 'self'; "
    "style-src 'self'; "
    "style-src-elem 'self'; "
    "font-src 'self'; "
    "img-src 'self'; "
    "connect-src 'self'; "
    "manifest-src 'self'; "
    "media-src 'self'; "
    "frame-src 'none'; "
    "worker-src 'self'"
)


def normalise_search_query(raw_value):
    if not raw_value:
        return ""

    trimmed = str(raw_value).strip()[:80]
    cleaned = SEARCH_QUERY_PATTERN.sub("", trimmed)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


@app.after_request
def apply_security_headers(response):
    response.headers["Content-Security-Policy"] = CSP_POLICY
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if request.path == "/static/js/serviceworker.js":
        response.headers["Service-Worker-Allowed"] = "/"

    if request.is_secure:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


@app.route("/", methods=["GET"])
def home():
    return render_template("home.html", page_name="home")


@app.route("/index.html", methods=["GET"])
def index_redirect():
    return redirect(url_for("catalogue"))


@app.route("/catalogue", methods=["GET"])
@app.route("/catalogue.html", methods=["GET"])
def catalogue():
    raw_search_query = request.args.get("q", "")
    safe_search_query = normalise_search_query(raw_search_query)
    search_query = safe_search_query or None

    return render_template(
        "catalogue.html",
        content=dbHandler.list_components(search_text=search_query),
        search_query=safe_search_query,
        page_name="catalogue",
    )


@app.route("/faq", methods=["GET"])
@app.route("/faq.html", methods=["GET"])
def faq_redirect():
    return redirect(url_for("about"))


@app.route("/about", methods=["GET"])
@app.route("/about.html", methods=["GET"])
def about():
    return render_template("about.html", page_name="about")


@app.route("/offline", methods=["GET"])
@app.route("/offline.html", methods=["GET"])
def offline():
    return render_template("offline.html", page_name="offline")


if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=5000)
