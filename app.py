
import os
import re
import json
import urllib.request
from flask import Flask, render_template, request, jsonify

app = Flask(
    __name__,
    template_folder="index.html",
    static_folder="index.html"
)


def estimate_tokens(text):
    return max(1, round(len(text) / 4))


def compact_task(task):
    task = re.sub(r"\s+", " ", task).strip()
    return task[:1200]


def demo_response(task, language):
    task = task.lower()

    if "prime" in task:
        if language == "Java":
            return """public class Main {
    static boolean isPrime(int n) {
        if (n <= 1) return false;

        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        int number = 17;
        System.out.println(
            isPrime(number) ? "Prime" : "Not Prime"
        );
    }
}"""

        return """def is_prime(n):
    if n <= 1:
        return False

    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False

    return True

print(is_prime(17))"""

    if "palindrome" in task:
        if language == "Java":
            return """public class Main {
    public static void main(String[] args) {
        String text = "level";
        String reversed =
            new StringBuilder(text).reverse().toString();

        System.out.println(
            text.equals(reversed)
            ? "Palindrome"
            : "Not palindrome"
        );
    }
}"""

        return """text = "level"
print("Palindrome" if text == text[::-1] else "Not palindrome")"""

    return "// Demo mode: Try prime or palindrome task."


def call_llm(task, language):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    endpoint = os.getenv(
        "OPENAI_BASE_URL",
        "https://api.openai.com/v1/chat/completions"
    )

    compact = compact_task(task)

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are TokenWise AI. Generate concise, correct code only."
            },
            {
                "role": "user",
                "content": f"Language: {language}\nTask: {compact}"
            }
        ],
        "temperature": 0.2
    }

    data = json.dumps(payload).encode()

    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )

    with urllib.request.urlopen(req, timeout=45) as response:
        result = json.loads(response.read().decode())

    return result["choices"][0]["message"]["content"]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    body = request.get_json(force=True)

    task = body.get("task", "").strip()
    language = body.get("language", "Java")

    if not task:
        return jsonify({"error": "Please enter a coding task."}), 400

    compact = compact_task(task)

    baseline_prompt = (
        "Please act as an expert software developer. "
        "Understand the coding request and provide a complete solution. "
        + task
    )

    optimized_prompt = (
        f"Language: {language}\n"
        f"Task: {compact}\n"
        "Return minimal correct code."
    )

    baseline = estimate_tokens(baseline_prompt)
    optimized = estimate_tokens(optimized_prompt)

    try:
        answer = call_llm(task, language)
        mode = "Live AI"
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502

    if answer is None:
        answer = demo_response(task, language)
        mode = "Demo mode"

    used = optimized + estimate_tokens(answer)
    saved = max(0, baseline - optimized)

    percent = round(saved / baseline * 100)

    return jsonify({
        "code": answer,
        "mode": mode,
        "baseline": baseline,
        "optimized": optimized,
        "used": used,
        "saved": saved,
        "percent": percent,
        "note": "Token counts are approximate estimates, not exact billing totals."
    })


if __name__ == "__main__":
    app.run(debug=True)
