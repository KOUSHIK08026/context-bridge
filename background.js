self.addEventListener('activate', () => console.log('Service worker active'));

const callGemini = async (apiKey, prompt, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const json = await response.json();
    if (json.error?.code === 503 || json.error?.code === 429) {
      await new Promise(r => setTimeout(r, (i + 1) * 3000));
      continue;
    }
    return json;
  }
  return { error: { message: "Gemini is busy. Try again in a moment." } };
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    const { transcript } = request;

    const prompt = `You are summarizing an AI chat conversation so the user can paste it into a NEW AI chatbot and continue seamlessly.

Summarize the ENTIRE conversation below. Do not skip any part of it. Include:

## Goal
What the user is trying to achieve overall.

## What Was Done
Everything that was discussed, decided, built, or resolved — in detail.

## Current State
Exactly where things stand right now.

## What's Next
What still needs to be done or what the user should ask next.

Be thorough. A new AI assistant must have full context from this summary alone.

FULL CONVERSATION:
${transcript}`;

    chrome.storage.sync.get("geminiApiKey", async (data) => {
      const apiKey = data.geminiApiKey;
      if (!apiKey) {
        sendResponse({ error: "No API key set. Click ⚙️ API Key to add one." });
        return;
      }
      try {
        const json = await callGemini(apiKey, prompt);
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        sendResponse({ result: text || json.error?.message || "No response from Gemini." });
      } catch (err) {
        sendResponse({ error: "API call failed: " + err.message });
      }
    });

    return true;
  }
});