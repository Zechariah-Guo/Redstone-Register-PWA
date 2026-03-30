from flask import Flask
from flask import render_template
from flask import request
from markupsafe import escape
import database_manager as dbHandler

app = Flask(__name__)


@app.route("/index.html", methods=["GET"])
@app.route("/", methods=["POST", "GET"])
def index():
    raw_search_query = request.args.get("q", "")
    safe_search_query = str(escape(raw_search_query)).strip()[:80]
    search_query = safe_search_query or None

    return render_template(
        "/index.html",
        content=dbHandler.list_components(search_text=search_query),
        search_query=safe_search_query,
    )


@app.route("/faq.html", methods=["GET"])
def faq():
    return render_template("/faq.html")


@app.route("/about.html", methods=["GET"])
def about():
    return render_template("about.html")


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
