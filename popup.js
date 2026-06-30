let summaryText = "";

const SUPPORTED = [
  { match: "chatgpt.com", label: "ChatGPT" },
  { match: "chat.openai.com", label: "ChatGPT" },
  { match: "claude.ai", label: "Claude" },
  { match: "gemini.google.com", label: "Gemini" }
];

function extractFunc() {
  const host = window.location.hostname;
  let messages = [];

  if (host.includes("chatgpt.com") || host.includes("chat.openai.com")) {
    document.querySelectorAll('[data-message-author-role]').forEach(node => {
      const role = node.getAttribute('data-message-author-role');
      const text = node.textContent.trim();
      if (text) messages.push({ role, text });
    });

  } else if (host.includes("claude.ai")) {
    const userNodes = document.querySelectorAll('[data-testid="user-message"]');
    userNodes.forEach(userNode => {
      const userText = userNode.textContent.trim();
      if (userText) messages.push({ role: 'user', text: userText });

      const container = userNode.closest('[class*="content-visibility"]');
      const assistantContainer = container?.nextElementSibling;
      if (assistantContainer) {
        const assistantText = assistantContainer.textContent.trim();
        const cleaned = assistantText.replace(/^Claude responded:\s*/i, '').trim();
        if (cleaned) messages.push({ role: 'assistant', text: cleaned });
      }
    });

  } else if (host.includes("gemini.google.com")) {
    document.querySelectorAll('user-query, model-response').forEach(node => {
      const role = node.tagName.toLowerCase() === 'user-query' ? 'user' : 'assistant';
      const text = node.textContent.trim();
      if (text) messages.push({ role, text });
    });
  }

  if (messages.length === 0) return { error: "No conversation found." };

  const transcript = messages
    .map(m => `[${m.role.toUpperCase()}]:\n${m.text}`)
    .join("\n\n=====\n\n");

  return { transcript, count: messages.length };
}

// Detect platform on load
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || "";
  const platform = SUPPORTED.find(s => url.includes(s.match));

  if (!platform) {
    document.getElementById("siteStatus").textContent = "Open ChatGPT, Claude, or Gemini first.";
    document.getElementById("summarizeBtn").disabled = true;
    return;
  }

  document.getElementById("statusDot").classList.add("green");
  document.getElementById("siteStatus").textContent = `${platform.label} detected — click to summarize`;
});

// Summarize button
document.getElementById("summarizeBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || "";
    const platform = SUPPORTED.find(s => url.includes(s.match));

    if (!platform) {
      alert("Open ChatGPT, Claude, or Gemini first.");
      return;
    }

    document.getElementById("loader").style.display = "block";
    document.getElementById("resultBox").style.display = "none";
    document.getElementById("copyBtn").style.display = "none";
    document.getElementById("toast").style.display = "none";
    document.getElementById("summarizeBtn").disabled = true;
    document.getElementById("siteStatus").textContent = "Scrolling to load all messages...";

    // Step 1 — scroll to top
    chrome.scripting.executeScript(
      { target: { tabId: tabs[0].id }, func: () => { window.scrollTo({ top: 0, behavior: 'instant' }); } },
      () => {
        document.getElementById("siteStatus").textContent = "Loading messages...";

        // Step 2 — wait 2s then extract
        setTimeout(() => {
          chrome.scripting.executeScript(
            { target: { tabId: tabs[0].id }, func: extractFunc },
            (results) => {
              if (chrome.runtime.lastError || !results?.[0]?.result) {
                document.getElementById("loader").style.display = "none";
                document.getElementById("summarizeBtn").disabled = false;
                document.getElementById("siteStatus").textContent = "Could not read page. Refresh and try again.";
                return;
              }

              const data = results[0].result;

              if (data.error) {
                document.getElementById("loader").style.display = "none";
                document.getElementById("summarizeBtn").disabled = false;
                document.getElementById("siteStatus").textContent = data.error;
                return;
              }

              document.getElementById("siteStatus").textContent = `${platform.label} · ${data.count} messages — summarizing...`;

              // Step 3 — send to Gemini
              chrome.runtime.sendMessage(
                { action: "summarize", transcript: data.transcript },
                (response) => {
                  document.getElementById("loader").style.display = "none";
                  document.getElementById("summarizeBtn").disabled = false;

                  if (response.error) {
                    document.getElementById("resultBox").style.display = "block";
                    document.getElementById("resultBox").textContent = "Error: " + response.error;
                    return;
                  }

                  summaryText = response.result;
                  document.getElementById("siteStatus").textContent = `${platform.label} · ${data.count} messages summarized`;
                  const box = document.getElementById("resultBox");
                  box.style.display = "block";
                  box.innerHTML = marked.parse(summaryText);
                  document.getElementById("copyBtn").style.display = "block";
                }
              );
            }
          );
        }, 2000);
      }
    );
  });
});

// Copy with feedback
document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(summaryText).then(() => {
    const btn = document.getElementById("copyBtn");
    const toast = document.getElementById("toast");
    btn.textContent = "✅ Copied!";
    btn.classList.add("copied");
    toast.style.display = "block";
    setTimeout(() => {
      btn.textContent = "📋 Copy to Clipboard";
      btn.classList.remove("copied");
      toast.style.display = "none";
    }, 2000);
  });
});

// API Key
document.getElementById("apiKeyBtn").addEventListener("click", () => {
  const key = prompt("Paste your Gemini API key:");
  if (key) {
    chrome.storage.sync.set({ geminiApiKey: key }, () => alert("API key saved!"));
  }
});