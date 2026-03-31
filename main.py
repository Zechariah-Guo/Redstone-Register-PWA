import re

from flask import Flask
from flask import render_template
from flask import request
from flask import redirect
from flask import url_for

import database_manager as dbHandler

app = Flask(__name__)


SEARCH_QUERY_PATTERN = re.compile(r"[^a-zA-Z0-9\s'\-]")


def normalise_search_query(raw_value):
    if not raw_value:
        return ""

    trimmed = str(raw_value).strip()[:80]
    cleaned = SEARCH_QUERY_PATTERN.sub("", trimmed)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


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


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
