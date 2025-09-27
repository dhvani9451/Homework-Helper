import os, re
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import sympy as sp
from dotenv import load_dotenv

# Load secret key from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Detect math expressions quickly
def is_math(text):
    return bool(re.search(r'[\+\-\*/=]', text))

def solve_math(expr):
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

    # Math handling
    if mode == "math" or (mode == "auto" and is_math(question)):
        sym_ans = solve_math(question)
        if sym_ans:
            return jsonify({"answer": sym_ans})
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
        return jsonify({"answer": resp.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
