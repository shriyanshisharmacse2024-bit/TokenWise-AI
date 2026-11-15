
const run = document.getElementById("run");

let history = [];

function getCode(task, language) {
    const t = task.toLowerCase();

    const solutions = {
        prime: {
            Java: `public class Main {
    public static void main(String[] args) {
        int n = 17;
        boolean prime = n > 1;

        for(int i = 2; i * i <= n; i++) {
            if(n % i == 0) {
                prime = false;
                break;
            }
        }

        System.out.println(prime ? "Prime" : "Not Prime");
    }
}`,
            Python: `n = 17
prime = n > 1

for i in range(2, int(n**0.5) + 1):
    if n % i == 0:
        prime = False
        break

print("Prime" if prime else "Not Prime")`
        },

        palindrome: {
            Java: `public class Main {
    public static void main(String[] args) {
        String s = "level";
        String rev = new StringBuilder(s).reverse().toString();

        System.out.println(s.equals(rev)
            ? "Palindrome" : "Not Palindrome");
    }
}`,
            Python: `s = "level"
print("Palindrome" if s == s[::-1] else "Not Palindrome")`
        },

        factorial: {
            Java: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        int fact = 1;

        for(int i = 1; i <= n; i++) {
            fact *= i;
        }

        System.out.println(fact);
    }
}`,
            Python: `n = 5
fact = 1

for i in range(1, n + 1):
    fact *= i

print(fact)`
        },

        fibonacci: {
            Java: `public class Main {
    public static void main(String[] args) {
        int a = 0, b = 1;

        for(int i = 0; i < 10; i++) {
            System.out.print(a + " ");
            int c = a + b;
            a = b;
            b = c;
        }
    }
}`,
            Python: `a, b = 0, 1

for i in range(10):
    print(a, end=" ")
    a, b = b, a + b`
        },

        even: {
            Java: `public class Main {
    public static void main(String[] args) {
        int n = 10;

        if(n % 2 == 0)
            System.out.println("Even");
        else
            System.out.println("Odd");
    }
}`,
            Python: `n = 10
print("Even" if n % 2 == 0 else "Odd")`
        },

        reverse: {
            Java: `public class Main {
    public static void main(String[] args) {
        String s = "Hello";
        String rev = new StringBuilder(s).reverse().toString();

        System.out.println(rev);
    }
}`,
            Python: `s = "Hello"
print(s[::-1])`
        },

        sum: {
            Java: `public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        int sum = 0;

        for(int x : arr) {
            sum += x;
        }

        System.out.println(sum);
    }
}`,
            Python: `arr = [1, 2, 3, 4, 5]
print(sum(arr))`
        }
    };

    if (t.includes("prime")) return solutions.prime[language];
    if (t.includes("palindrome")) return solutions.palindrome[language];
    if (t.includes("factorial")) return solutions.factorial[language];
    if (t.includes("fibonacci")) return solutions.fibonacci[language];

    if (t.includes("even") || t.includes("odd"))
        return solutions.even[language];

    if (t.includes("reverse"))
        return solutions.reverse[language];

    if (t.includes("sum") && t.includes("array"))
        return solutions.sum[language];

    return null;
}

function estimateTokens(text) {
    return Math.max(1, Math.ceil(text.length / 4));
}

run.addEventListener("click", function () {

    const task = document.getElementById("task").value.trim();
    const language = document.getElementById("language").value;

    const error = document.getElementById("error");

    if (!task) {
        error.textContent = "Please enter a coding task.";
        return;
    }

    error.textContent = "";

    const output = getCode(task, language);

    if (!output) {
        error.textContent =
            "Demo supports prime, palindrome, factorial, fibonacci, even/odd, reverse and array sum.";
        return;
    }

    document.getElementById("code").textContent = output;
    document.getElementById("mode").textContent = "DEMO MODE";

    const baselinePrompt =
        "Please act as an expert coding assistant and explain everything in detail. " +
        "Understand the complete programming problem and generate a solution. " + task;

    const optimizedPrompt =
        "Language: " + language + ". Task: " + task;

    const baseline = estimateTokens(baselinePrompt);
    const optimized = estimateTokens(optimizedPrompt);
    const saved = Math.max(0, baseline - optimized);

    document.getElementById("baseline").textContent = baseline;
    document.getElementById("optimized").textContent = optimized;
    document.getElementById("saved").textContent = saved;
    document.getElementById("used").textContent =
        optimized + estimateTokens(output);

    document.getElementById("percent").textContent =
        Math.round(saved / baseline * 100) + "% estimated reduction";

    document.getElementById("note").textContent =
        "Approximate demo estimates only. Not actual AI token usage.";

    history.unshift({
        task: task,
        language: language,
        code: output
    });

    showHistory();
});

function showHistory() {
    let section = document.getElementById("history");

    if (!section) {
        section = document.createElement("div");
        section.id = "history";
        section.style.cssText =
            "background:#111a2b;padding:20px;border-radius:12px;margin-top:20px;color:white;";
        document.querySelector(".metrics").after(section);
    }

    section.innerHTML = "<h3>Coding History</h3>";

    history.forEach((item, index) => {
        const row = document.createElement("div");
        row.style.cssText =
            "padding:12px;border-bottom:1px solid #34415c;";

        const title = document.createElement("strong");
        title.textContent = (index + 1) + ". " + item.task;

        const info = document.createElement("p");
        info.textContent = item.language;

        const button = document.createElement("button");
        button.textContent = "View Code";
        button.addEventListener("click", () => {
            document.getElementById("code").textContent = item.code;
        });

        row.append(title, info, button);
        section.appendChild(row);
    });
}

document.getElementById("copy").addEventListener("click", async function () {
    const code = document.getElementById("code").textContent;

    try {
        await navigator.clipboard.writeText(code);
        this.textContent = "Copied!";
        setTimeout(() => this.textContent = "Copy code", 1500);
    } catch {
        alert("Please copy the code manually.");
    }
});
