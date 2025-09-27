import os
import re

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import sympy as sp
from dotenv import load_dotenv

# Markdown -> HTML (sanitized)
from markdown import markdown
import bleach

load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Allow a safe subset of HTML produced from Markdown
ALLOWED_TAGS = bleach.sanitizer.ALLOWED_TAGS.union({
    "p", "pre", "code", "h1", "h2", "h3", "h4", "h5",
    "ul", "ol", "li", "strong", "em", "blockquote", "hr", "br"
})
ALLOWED_ATTRS = {
    "code": ["class"]
}

def is_math(text: str) -> bool:
    return bool(re.search(r'[+\-*/=]', text))

def solve_math(expr: str):
    try:
        if "=" in expr:
            lhs, rhs = expr.split("=", 1)
            eq = sp.sympify(lhs) - sp.sympify(rhs)
            sol = sp.solve(eq)
            return f"Solution: {sol}"
        else:
            return f"Result: {sp.sympify(expr)}"
    except Exception:
        return None

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json(force=True)
    question = (data.get("question") or "").strip()
    mode = data.get("mode", "auto")

    if not question:
        return jsonify({"error": "No question provided"}), 400

    # Try quick math path
    if mode == "math" or (mode == "auto" and is_math(question)):
        sym_ans = solve_math(question)
        if sym_ans:
            html = bleach.clean(markdown(sym_ans), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)
            return jsonify({"answer_html": html})

        prompt = f"Solve step by step: {question}"
    elif mode == "summary":
        prompt = f"Summarize clearly: {question}"
    else:
        prompt = f"You are a helpful tutor. Explain clearly: {question}"

    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        md = resp.text or ""
        html = bleach.clean(markdown(md), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)
        return jsonify({"answer_html": html})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # In production Render uses gunicorn; debug=True only for local dev
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
