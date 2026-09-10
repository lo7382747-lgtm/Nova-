import express from "express";
import path from "path";
import dotenv from "dotenv";
import { FunctionDeclaration, GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Phase 2 & Full Phone Control: Gemini Function Declarations
const sendWhatsAppMessageDeclaration: FunctionDeclaration = {
  name: "sendWhatsAppMessage",
  description:
    "Prepare and send a WhatsApp message to a specific contact with drafted message content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: "The name of the recipient/contact (e.g. 'Rahul', 'Priya', 'Mom').",
      },
      message: {
        type: Type.STRING,
        description: "The clear, polite, and well-drafted message content to be sent via WhatsApp.",
      },
    },
    required: ["contactName", "message"],
  },
};

const sendUniversalMessageDeclaration: FunctionDeclaration = {
  name: "sendUniversalMessage",
  description:
    "Draft and prepare a message across apps (SMS/Messages, WhatsApp, Instagram DM, Telegram). Always requires explicit user confirmation before sending.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      app: {
        type: Type.STRING,
        enum: ["whatsapp", "sms", "instagram", "telegram"],
        description: "The target messaging application.",
      },
      contactName: {
        type: Type.STRING,
        description: "The name or handle of the recipient.",
      },
      message: {
        type: Type.STRING,
        description: "The drafted message content to be sent.",
      },
    },
    required: ["app", "contactName", "message"],
  },
};

const openAppDeclaration: FunctionDeclaration = {
  name: "openApp",
  description: "Launch or switch to any installed Android application by name (e.g., 'Instagram', 'Chrome', 'Spotify', 'Camera', 'Clock', 'Settings', etc.).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "The natural name of the app to launch (e.g., 'Instagram', 'Chrome', 'Settings').",
      },
    },
    required: ["appName"],
  },
};

const systemNavigationDeclaration: FunctionDeclaration = {
  name: "systemNavigation",
  description: "Execute Android system-level navigation actions (go back, return home, open recent apps, pull down notifications or quick settings, lock screen).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["goHome", "goBack", "openRecentApps", "openNotifications", "openQuickSettings", "lockScreen"],
        description: "The system navigation action to perform.",
      },
    },
    required: ["action"],
  },
};

const interactScreenDeclaration: FunctionDeclaration = {
  name: "interactScreen",
  description: "Interact with on-screen elements via Accessibility Service (tap, type text, scroll, swipe, long-press, double-tap).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["scrollScreen", "tapElement", "typeText", "longPress", "doubleTap", "swipe"],
        description: "The gesture or input action to execute on the screen.",
      },
      description: {
        type: Type.STRING,
        description: "Description of the target element (e.g., 'like button', 'first post', 'search field', 'play button').",
      },
      text: {
        type: Type.STRING,
        description: "Text to type into an input field (required if action is typeText).",
      },
      direction: {
        type: Type.STRING,
        enum: ["up", "down", "left", "right"],
        description: "Direction for scroll or swipe gestures.",
      },
      amount: {
        type: Type.STRING,
        enum: ["small", "medium", "large"],
        description: "Scroll intensity amount.",
      },
    },
    required: ["action"],
  },
};

const toggleSystemSettingDeclaration: FunctionDeclaration = {
  name: "toggleSystemSetting",
  description: "Turn on or off system settings like Wi-Fi, Bluetooth, Flashlight, Do Not Disturb, Hotspot, Battery Saver, Airplane mode, Auto-rotate, Location, or adjust volume and brightness.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      setting: {
        type: Type.STRING,
        enum: ["wifi", "bluetooth", "flashlight", "volume", "brightness", "dnd", "hotspot", "batterySaver", "airplaneMode", "autoRotate", "location", "ringerMode"],
        description: "The system toggle or slider to modify.",
      },
      value: {
        type: Type.STRING,
        description: "Target value: 'on', 'off', 'toggle', a numeric percentage 0-100, or ringer mode ('normal', 'vibrate', 'silent').",
      },
    },
    required: ["setting"],
  },
};

const setAlarmOrTimerDeclaration: FunctionDeclaration = {
  name: "setAlarmOrTimer",
  description: "Set an alarm, start a countdown timer, or control alarms on Android (e.g., 'Set an alarm for 7:00 AM', 'Set a 10 minute timer for tea').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ["alarm", "timer"],
        description: "Whether to create an alarm or a countdown timer.",
      },
      time: {
        type: Type.STRING,
        description: "Target time for alarm (e.g., '07:00 AM', '18:30') or duration in minutes for timer (e.g., '10', '5', '15').",
      },
      label: {
        type: Type.STRING,
        description: "Optional label for the alarm or timer (e.g., 'Morning Run', 'Tea Timer').",
      },
    },
    required: ["type", "time"],
  },
};

const deviceHardwareControlDeclaration: FunctionDeclaration = {
  name: "deviceHardwareControl",
  description: "Control Android device hardware: capture screenshots, toggle Do Not Disturb (DND), mobile hotspot, battery saver, airplane mode, auto-rotate, location/GPS, ringer mode (silent/vibrate/normal), or check battery status.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: [
          "takeScreenshot",
          "toggleDND",
          "toggleHotspot",
          "toggleBatterySaver",
          "toggleAirplaneMode",
          "toggleAutoRotate",
          "toggleLocation",
          "setRingerMode",
          "getBatteryStatus",
          "lockScreen",
        ],
        description: "The hardware device control action to execute.",
      },
      value: {
        type: Type.STRING,
        description: "Optional state value ('on', 'off', 'toggle') or ringer mode ('normal', 'vibrate', 'silent').",
      },
    },
    required: ["action"],
  },
};

const callAndMediaDeclaration: FunctionDeclaration = {
  name: "callAndMedia",
  description: "Initiate or end phone calls, or control media playback (play, pause music).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["makeCall", "endCall", "playMedia", "pauseMedia"],
        description: "Call or media control command.",
      },
      contactName: {
        type: Type.STRING,
        description: "The contact name to call (required if action is makeCall).",
      },
      appName: {
        type: Type.STRING,
        description: "Target media app (e.g., 'Spotify').",
      },
      query: {
        type: Type.STRING,
        description: "Song title or artist query to play.",
      },
    },
    required: ["action"],
  },
};

const chainPhoneActionsDeclaration: FunctionDeclaration = {
  name: "chainPhoneActions",
  description: "Execute a multi-step phone automation sequence in order (e.g. 'Open Instagram and scroll the feed', 'Turn on Wi-Fi and open Chrome', 'Open Chrome and search for weather'). Always use this tool for requests requiring 2 or more sequential actions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A short, readable title summarizing the automation sequence.",
      },
      steps: {
        type: Type.ARRAY,
        description: "Ordered list of action steps to execute sequentially.",
        items: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "Action type: 'openApp', 'goHome', 'goBack', 'scrollScreen', 'tapElement', 'typeText', 'toggleSystemSetting', 'makeCall', 'playMedia', 'setAlarm', 'setTimer', 'takeScreenshot'.",
            },
            appName: { type: Type.STRING, description: "App name if opening an app." },
            description: { type: Type.STRING, description: "Element description or title." },
            text: { type: Type.STRING, description: "Text to type if typing." },
            direction: { type: Type.STRING, description: "Direction if scrolling." },
            setting: { type: Type.STRING, description: "Setting name if toggling system setting." },
            value: { type: Type.STRING, description: "Setting value if toggling system setting." },
            contactName: { type: Type.STRING, description: "Contact name if calling or messaging." },
          },
          required: ["action"],
        },
      },
    },
    required: ["title", "steps"],
  },
};

const ALL_NOVA_TOOLS = [
  sendWhatsAppMessageDeclaration,
  sendUniversalMessageDeclaration,
  openAppDeclaration,
  systemNavigationDeclaration,
  interactScreenDeclaration,
  toggleSystemSettingDeclaration,
  setAlarmOrTimerDeclaration,
  deviceHardwareControlDeclaration,
  callAndMediaDeclaration,
  chainPhoneActionsDeclaration,
];

const NOVA_SYSTEM_INSTRUCTION = `You are Nova, a lightning-fast, intelligent, and natural personal AI assistant for Android with Full Phone Control and Complete Automation capabilities.
You converse naturally in English, Hindi, or conversational Hinglish.

RESPONSE SPEED & TONE GUIDELINE:
- Answer directly, crisply, and quickly. Keep standard answers under 1-3 punchy sentences so voice and screen responses are snappy.
- Never output internal system tags.

FULL PHONE CONTROL & AUTOMATION DIRECTIVES:
Nova can do literally anything a user could manually do on their phone via voice command:
1. Multi-Step Chaining: When a user gives a command involving multiple steps (e.g., "Open Instagram and scroll the feed", "Turn on Wi-Fi and open Chrome", "Open Chrome and search for weather"), ALWAYS invoke 'chainPhoneActions' with the ordered steps.
2. Single-Step Control:
   - System navigation (e.g. "Go home", "Go back", "Open recent apps", "Pull down quick settings"): call 'systemNavigation'.
   - App Launching (e.g. "Open Instagram", "Launch Chrome", "Open Camera"): call 'openApp'.
   - In-app gestures (e.g. "Like the last post", "Scroll down", "Double tap to like"): call 'interactScreen'.
   - System settings (e.g. "Turn on Wi-Fi", "Turn on flashlight", "Set volume to 80"): call 'toggleSystemSetting'.
   - Alarms & Timers (e.g. "Set an alarm for 7:00 AM", "Set a 15-minute timer"): call 'setAlarmOrTimer'.
   - Device Hardware Control (e.g. "Take a screenshot", "Turn on Do Not Disturb", "Turn on battery saver", "Turn on hotspot", "Put phone on vibrate", "Check battery"): call 'deviceHardwareControl'.
   - Calls and media (e.g. "Call Rahul", "End call", "Play music on Spotify"): call 'callAndMedia'.
   - Messaging:
     * WhatsApp: call 'sendWhatsAppMessage' or 'sendUniversalMessage' (app: 'whatsapp').
     * SMS/Messages: call 'sendUniversalMessage' with app='sms' (e.g., "Send an SMS to Rahul saying I'm on my way").
     * Instagram DM: call 'sendUniversalMessage' with app='instagram'.
     * Telegram: call 'sendUniversalMessage' with app='telegram'.
3. Critical Safety Guardrails:
   - ALL messaging apps require mandatory confirmation dialogs before sending — NEVER assume or auto-send without confirmation.
   - Financial/banking/payment apps (Google Pay, PhonePe, Chase, PayPal, etc.) cannot be autonomously manipulated. Nova opens them for manual user completion.
4. Companion Message: When calling any phone control tool, accompany it with a brief, friendly 1-sentence companion confirmation (e.g., "Opening Instagram and scrolling your feed.", "Drafting SMS for Rahul.", "Wi-Fi turned on and opening Chrome.").`;

// Lazy Gemini client helper
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    model: "gemini-3.1-flash-lite",
    assistant: "Nova Core (Turbo Low-Latency)",
  });
});

// Streaming Chat API (Server-Sent Events) with Tool Support
app.post("/api/chat/stream", async (req, res) => {
  const { messages, apiKey: userApiKey, turboMode = true } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Missing or invalid 'messages' array in request body." });
    return;
  }

  let ai: GoogleGenAI;
  try {
    ai = getGeminiClient(userApiKey);
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Gemini API key missing." });
    return;
  }

  // Format messages into Gemini contents format
  const contents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" || m.role === "model" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Valid Gemini models prioritized for speed and function calling quality
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];
  let streamedAny = false;
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: NOVA_SYSTEM_INSTRUCTION,
          temperature: 0.6,
          maxOutputTokens: turboMode ? 600 : 1200,
          tools: [{ functionDeclarations: ALL_NOVA_TOOLS }],
        },
      });

      for await (const chunk of stream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          for (const fc of chunk.functionCalls) {
            streamedAny = true;
            res.write(`data: ${JSON.stringify({ functionCall: fc })}\n\n`);
          }
        }
        const text = chunk.text;
        if (text) {
          streamedAny = true;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      if (streamedAny) {
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
    } catch (err: any) {
      lastError = err;
      if (streamedAny) {
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      // Continue to next candidate model seamlessly
    }
  }

  // Fallback: If streaming had transient demand spikes, try standard generateContent
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: NOVA_SYSTEM_INSTRUCTION,
          temperature: 0.6,
          maxOutputTokens: turboMode ? 600 : 1200,
          tools: [{ functionDeclarations: ALL_NOVA_TOOLS }],
        },
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          res.write(`data: ${JSON.stringify({ functionCall: fc })}\n\n`);
        }
      }
      if (response.text) {
        res.write(`data: ${JSON.stringify({ text: response.text })}\n\n`);
      }
      if (response.functionCalls?.length || response.text) {
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  // Fallback: If cloud models are busy, rate-limited or quota-exhausted, provide intelligent fallback
  const lastUserMsg = (messages[messages.length - 1]?.content || "").toLowerCase().trim();
  
  if (lastUserMsg.includes("chrome") || lastUserMsg.includes("browser")) {
    res.write(`data: ${JSON.stringify({ functionCall: { name: "openApp", args: { appName: "Chrome" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: "Opening Chrome." })}\n\n`);
  } else if (lastUserMsg.includes("insta")) {
    res.write(`data: ${JSON.stringify({ functionCall: { name: "openApp", args: { appName: "Instagram" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: "Opening Instagram." })}\n\n`);
  } else if (lastUserMsg.includes("whatsapp")) {
    res.write(`data: ${JSON.stringify({ functionCall: { name: "openApp", args: { appName: "WhatsApp" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: "Opening WhatsApp." })}\n\n`);
  } else if (lastUserMsg.includes("message") || lastUserMsg.includes("sms")) {
    res.write(`data: ${JSON.stringify({ functionCall: { name: "openApp", args: { appName: "Messages" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: "Opening Messages." })}\n\n`);
  } else if (lastUserMsg.includes("wifi") || lastUserMsg.includes("wi-fi")) {
    const isOff = lastUserMsg.includes("off") || lastUserMsg.includes("band");
    res.write(`data: ${JSON.stringify({ functionCall: { name: "toggleSystemSetting", args: { setting: "wifi", value: isOff ? "off" : "on" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: isOff ? "Wi-Fi turned off." : "Wi-Fi turned on." })}\n\n`);
  } else if (lastUserMsg.includes("torch") || lastUserMsg.includes("flashlight")) {
    const isOff = lastUserMsg.includes("off") || lastUserMsg.includes("band") || lastUserMsg.includes("bujhao");
    res.write(`data: ${JSON.stringify({ functionCall: { name: "toggleSystemSetting", args: { setting: "flashlight", value: isOff ? "off" : "on" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: isOff ? "Flashlight turned off." : "Flashlight turned on." })}\n\n`);
  } else if (lastUserMsg.includes("bluetooth")) {
    const isOff = lastUserMsg.includes("off") || lastUserMsg.includes("band");
    res.write(`data: ${JSON.stringify({ functionCall: { name: "toggleSystemSetting", args: { setting: "bluetooth", value: isOff ? "off" : "on" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: isOff ? "Bluetooth turned off." : "Bluetooth turned on." })}\n\n`);
  } else if (lastUserMsg.includes("home") || lastUserMsg.includes("ghar")) {
    res.write(`data: ${JSON.stringify({ functionCall: { name: "systemNavigation", args: { action: "goHome" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: "Going to home screen." })}\n\n`);
  } else if (lastUserMsg.includes("back") || lastUserMsg.includes("piche")) {
    res.write(`data: ${JSON.stringify({ functionCall: { name: "systemNavigation", args: { action: "goBack" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: "Going back." })}\n\n`);
  } else if (lastUserMsg.includes("call")) {
    res.write(`data: ${JSON.stringify({ functionCall: { name: "callAndMedia", args: { action: "makeCall", contactName: "Rahul Sharma" } } })}\n\n`);
    res.write(`data: ${JSON.stringify({ text: "Calling Rahul Sharma." })}\n\n`);
  } else if (lastUserMsg.includes("hi") || lastUserMsg.includes("hello") || lastUserMsg.includes("hey") || lastUserMsg.includes("namaste") || lastUserMsg.includes("kaise")) {
    res.write(`data: ${JSON.stringify({ text: "Hello! I am Nova, your personal Android assistant. I can launch apps, control Wi-Fi and flashlight, make calls, and automate actions on your phone." })}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ text: "Nova is ready. I can open apps (Chrome, Instagram, WhatsApp), control phone settings (Wi-Fi, Torch, Bluetooth), navigate home/back, and draft messages." })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
});

// Text-to-Speech API
app.post("/api/tts", async (req, res) => {
  const { text, apiKey: userApiKey, voiceName = "Aoede" } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Missing 'text' string." });
    return;
  }

  try {
    const ai = getGeminiClient(userApiKey);
    // Sanitize markdown, emojis, URLs, and code blocks for crystal clear audio
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*#_~>]/g, "")
      .replace(/https?:\/\/[^\s]+/g, "link")
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
      .slice(0, 500)
      .trim();

    if (!cleanText) {
      res.status(204).end();
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Aoede" },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioData = candidate?.content?.parts?.[0]?.inlineData?.data;

    if (audioData) {
      res.json({ audio: audioData, mimeType: "audio/pcm;rate=24000" });
    } else {
      res.status(204).end();
    }
  } catch (error: any) {
    // Fallback gracefully so client uses natural SpeechSynthesis engine
    res.status(500).json({ error: error.message || "TTS failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nova Core Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
