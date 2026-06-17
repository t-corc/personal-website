const revealPrompts = ["Find out more", "What's this?", "What the helly is this"];

const quests = [
  {
    id: "frecuencia-friday",
    window: "Viernes noche",
    timing: "20:00-22:00",
    activity: "Bar Frecuencia",
    explanation: "A stylish bar option for drinks, conversation, and a polished start to the evening.",
    vibe: "Fancy casual",
  },
  {
    id: "ten-euro-challenge",
    window: "Viernes noche",
    timing: "20:00-22:00",
    activity: "10€ Challenge",
    explanation:
      "Each person gets 10€ to make the night memorable through tiny purchases, strange detours, snacks, or improvised missions.",
    vibe: "Polished chaos",
  },
  {
    id: "fenomeno",
    window: "Viernes noche",
    timing: "20:00-21:30",
    activity: "Fénomeno",
    explanation: "A refined bar option: good for a drink that feels intentional without becoming too formal.",
    vibe: "Fancy",
  },
  {
    id: "open-air-cinema",
    window: "Viernes noche",
    timing: "TBD",
    activity: "Open-air cinema in Sol",
    explanation: "Outdoor movie plan, pending exact film and time confirmation. Summery and easy if the schedule works.",
    vibe: "Low pressure",
  },
  {
    id: "world-tour",
    window: "Viernes noche",
    timing: "20:15-22:30",
    activity: "World Tour",
    explanation: "Visit international shops, buy mystery snacks or drinks with labels you cannot read, then review them seriously.",
    vibe: "Random side quest",
  },
  {
    id: "recoletos-friday",
    window: "Viernes noche",
    timing: "21:00-late",
    activity: "Recoletos Jazz",
    explanation: "A more elegant music/drinks option, better if the mood is classy and relaxed.",
    vibe: "Classy",
  },
  {
    id: "retiro-golden-hour",
    window: "Sábado tarde",
    timing: "18:30-20:00",
    activity: "Retiro golden-hour walk",
    explanation: "A relaxed walk through Retiro once the heat starts dropping. Pretty, easy, and low pressure.",
    vibe: "Easy, pretty",
  },
  {
    id: "casa-campo",
    window: "Sábado tarde",
    timing: "18:30-20:15",
    activity: "Casa de Campo sunset walk",
    explanation: "A spacious sunset walk around Lago. Feels like briefly escaping the city.",
    vibe: "Spacious, relaxed",
  },
  {
    id: "founders-afternoon",
    window: "Sábado tarde",
    timing: "17:30-19:30",
    activity: "Founders Afternoon",
    explanation: "Spend two hours inventing the most useless startup possible, naming it, pitching it, and fake-launching it.",
    vibe: "Random side quest",
  },
  {
    id: "balloon-museum",
    window: "Sábado tarde",
    timing: "18:00-20:00",
    activity: "Balloon Museum: Euphoria - Art is in the Air",
    explanation: "Interactive inflatable-art exhibition: colorful, strange, playful, and easy to react to together.",
    vibe: "Playful",
  },
  {
    id: "thyssen",
    window: "Sábado noche",
    timing: "21:00-23:00",
    activity: "Noches Thyssen",
    explanation: "Saturday night museum visit at the Thyssen. Cultural, stylish, and not too serious.",
    vibe: "Best overall",
  },
  {
    id: "las-letras",
    window: "Sábado noche",
    timing: "21:30-late",
    activity: "Las Letras drink",
    explanation: "A drink around Las Letras after or instead of another plan. Central, pretty, flexible.",
    vibe: "Easy extension",
  },
  {
    id: "snake-bar",
    window: "Sábado noche",
    timing: "20:30-22:00",
    activity: "Snake Bar",
    explanation: "Polished cocktail bar option with a more dressed-up feeling.",
    vibe: "Fancy",
  },
  {
    id: "guiri-101",
    window: "Sábado noche",
    timing: "21:30-23:30",
    activity: "Guiri 101",
    explanation: "Visit touristy Madrid speaking only English and acting like exaggerated visitors. Silly, theatrical, and chaotic.",
    vibe: "Chaotic",
  },
  {
    id: "frecuencia-saturday",
    window: "Sábado noche",
    timing: "21:00-22:30",
    activity: "Bar Frecuencia",
    explanation: "Stylish drinks and music-forward atmosphere. Good if you want something cool but not too stiff.",
    vibe: "Cool",
  },
  {
    id: "founders-night",
    window: "Sábado noche",
    timing: "21:00-23:30",
    activity: "Founders Night",
    explanation: "Night version of the useless startup challenge: invent it, pitch it, fake-launch it, post like it matters.",
    vibe: "Funny compatibility test",
  },
  {
    id: "recoletos-saturday",
    window: "Sábado noche",
    timing: "21:00-late",
    activity: "Recoletos Jazz",
    explanation: "Elegant music/drinks option. The most classic, cinematic choice.",
    vibe: "Elegant",
  },
];

const windowGrid = document.querySelector("#window-grid");
const activityGrid = document.querySelector("#activity-grid");
const selectionCard = document.querySelector("#selection-card");
const form = document.querySelector("#roky-form");
const confirmation = document.querySelector("#confirmation");
const confirmationCopy = document.querySelector("#confirmation-copy");
const emailFallback = document.querySelector("#email-fallback");
const selectedWindowField = document.querySelector("#selected-window-field");
const selectedPlanField = document.querySelector("#selected-plan-field");
const selectedVibeField = document.querySelector("#selected-vibe-field");
const signalField = document.querySelector("#signal-field");
const whatsappNumber = "+39 329 663 9771";

let selectedWindow = "";
let selectedQuestIds = new Set();
let flippedQuestIds = new Set();

function getWindows() {
  return [...new Set(quests.map((quest) => quest.window))];
}

function getWindowTiming(windowName) {
  const entries = quests.filter((quest) => quest.window === windowName);
  return [...new Set(entries.map((quest) => quest.timing))].join(" / ");
}

function getSelectedQuests() {
  return quests.filter((quest) => selectedQuestIds.has(quest.id));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function getNextWeekdayDate(targetDay) {
  const date = new Date();
  const distance = (targetDay + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + distance);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseTime(value) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getDefaultMinutes(windowName) {
  if (windowName === "Sábado tarde") return [18 * 60, 20 * 60];
  if (windowName === "Sábado noche") return [21 * 60, 23 * 60];
  return [20 * 60, 22 * 60];
}

function getCalendarRange(selectedQuests) {
  const targetDay = selectedWindow.startsWith("Viernes") ? 5 : 6;
  const baseDate = getNextWeekdayDate(targetDay);
  const parsedStarts = selectedQuests.map((quest) => parseTime(quest.timing)).filter((time) => time !== null);
  const defaultRange = getDefaultMinutes(selectedWindow);
  const startMinutes = parsedStarts.length ? Math.min(...parsedStarts) : defaultRange[0];
  const endMinutes = selectedQuests.reduce((latest, quest) => {
    const [, endValue = ""] = quest.timing.split("-");
    const parsedEnd = parseTime(endValue);
    const parsedStart = parseTime(quest.timing);
    if (parsedEnd !== null) return Math.max(latest, parsedEnd);
    if (parsedStart !== null) return Math.max(latest, parsedStart + 120);
    return latest;
  }, defaultRange[1]);

  const startsAt = new Date(baseDate);
  startsAt.setMinutes(startMinutes);
  const endsAt = new Date(baseDate);
  endsAt.setMinutes(Math.max(endMinutes, startMinutes + 60));
  return [startsAt, endsAt];
}

function formatCalendarDate(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function formatUtcDate(date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function escapeCalendarText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function createCalendarFile(selectedQuests, formData) {
  const [startsAt, endsAt] = getCalendarRange(selectedQuests);
  const questLines = selectedQuests.map((quest) => `${quest.timing} - ${quest.activity} (${quest.vibe})`);
  const description = [
    "Project Roky preferences:",
    ...questLines,
    "",
    `Note: ${formData.get("Note") || "-"}`,
    `WhatsApp: ${whatsappNumber}`,
  ].join("\n");
  const uid = `project-roky-${Date.now()}@tommasocorciulo.com`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tommaso Corciulo//Project Roky//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatUtcDate(new Date())}`,
    `DTSTART:${formatCalendarDate(startsAt)}`,
    `DTEND:${formatCalendarDate(endsAt)}`,
    `SUMMARY:${escapeCalendarText(`Project Roky: ${selectedWindow}`)}`,
    "LOCATION:Madrid",
    `DESCRIPTION:${escapeCalendarText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function createChoiceButton(className, attributes, content) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  Object.entries(attributes).forEach(([key, value]) => {
    button.dataset[key] = value;
  });
  button.innerHTML = content;
  return button;
}

function renderWindows() {
  getWindows().forEach((windowName, index) => {
    const count = quests.filter((quest) => quest.window === windowName).length;
    const button = createChoiceButton(
      "window-option",
      { window: windowName },
      `<span>0${index + 1}</span><strong>${windowName}</strong><small>${getWindowTiming(windowName)}</small><em>${count} quests</em>`,
    );
    windowGrid.appendChild(button);
  });
}

function renderLockedState() {
  activityGrid.classList.add("is-locked");
  activityGrid.replaceChildren();
  const locked = document.createElement("div");
  locked.className = "locked-state";
  locked.innerHTML = "<span>Not yet</span><p>Choose when you are free and the list will behave.</p>";
  activityGrid.appendChild(locked);
}

function renderQuests() {
  if (!selectedWindow) {
    renderLockedState();
    return;
  }

  activityGrid.classList.remove("is-locked");
  activityGrid.replaceChildren();

  quests
    .filter((quest) => quest.window === selectedWindow)
    .forEach((quest, index) => {
      const isSelected = selectedQuestIds.has(quest.id) ? " is-selected" : "";
      const isFlipped = flippedQuestIds.has(quest.id) ? " is-flipped" : "";
      const prompt = revealPrompts[Math.min(index, revealPrompts.length - 1)];
      const card = createChoiceButton(
        `activity-option${isSelected}${isFlipped}`,
        { questId: quest.id },
        `
          <span class="quest-time">${quest.timing}</span>
          <div class="quest-card-inner">
            <div class="quest-face quest-front">
              <strong>${quest.activity}</strong>
              <small>${quest.vibe}</small>
              <span class="reveal-prompt">${prompt}</span>
            </div>
            <div class="quest-face quest-back">
              <p>${quest.explanation}</p>
              <small>${quest.vibe}</small>
              <span class="reveal-prompt">Back to title</span>
            </div>
          </div>
          <span class="select-mark">${selectedQuestIds.has(quest.id) ? "Marked" : "Tap anywhere to mark"}</span>
        `,
      );
      activityGrid.appendChild(card);
    });
}

function updateSelection() {
  const selectedQuests = getSelectedQuests();
  document.querySelectorAll(".window-option").forEach((button) => {
    const isSelected = button.dataset.window === selectedWindow;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  document.querySelectorAll(".activity-option").forEach((button) => {
    const isSelected = selectedQuestIds.has(button.dataset.questId);
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-flipped", flippedQuestIds.has(button.dataset.questId));
    button.setAttribute("aria-pressed", String(isSelected));
  });

  selectedWindowField.value = selectedWindow;
  selectedPlanField.value = selectedQuests.map((quest) => `${quest.timing} - ${quest.activity}`).join("; ");
  selectedVibeField.value = selectedQuests.map((quest) => quest.vibe).join("; ");
  signalField.value = selectedQuests
    .map((quest) => `${quest.window}, ${quest.timing} - ${quest.activity} (${quest.vibe})`)
    .join("\n");

  if (!selectedWindow) {
    selectionCard.innerHTML = "<p>No quests selected yet.</p>";
    return;
  }

  if (selectedQuests.length === 0) {
    selectionCard.innerHTML = `
      <span>Current window</span>
      <strong>${selectedWindow}</strong>
      <p>Now mark every idea that survives first contact.</p>
    `;
    return;
  }

  const questList = selectedQuests
    .map((quest) => `<li><b>${quest.timing}</b><span>${quest.activity}</span><em>${quest.vibe}</em></li>`)
    .join("");
  selectionCard.innerHTML = `
    <span>Current signal</span>
    <strong>${selectedWindow}</strong>
    <ul>${questList}</ul>
  `;
}

function saveSignal(formData) {
  const selectedQuests = getSelectedQuests();
  const calendarFile = createCalendarFile(selectedQuests, formData);
  const records = JSON.parse(window.localStorage.getItem("projectRokySignals") || "[]");
  const record = {
    createdAt: new Date().toISOString(),
    name: formData.get("Name") || "",
    note: formData.get("Note") || "",
    window: selectedWindowField.value,
    quests: selectedPlanField.value,
    vibes: selectedVibeField.value,
    signal: signalField.value,
    calendarFile,
    whatsappNumber,
  };
  records.unshift(record);
  window.localStorage.setItem("projectRokySignals", JSON.stringify(records.slice(0, 25)));
  window.localStorage.setItem("projectRokyLatestSignal", JSON.stringify(record));
}

function updateFallbackLink(formData) {
  const subject = encodeURIComponent("Project Roky signal");
  const body = encodeURIComponent(
    [
      "Project Roky signal",
      "",
      `Name: ${formData.get("Name") || "Mystery guest"}`,
      `Window: ${selectedWindowField.value}`,
      `Quests: ${selectedPlanField.value}`,
      `Vibes: ${selectedVibeField.value}`,
      `Note: ${formData.get("Note") || "-"}`,
    ].join("\n"),
  );
  emailFallback.href = `mailto:tommasocorciulo02@icloud.com?subject=${subject}&body=${body}`;
}

function handleSubmit(event) {
  if (selectedQuestIds.size === 0) {
    event.preventDefault();
    selectionCard.classList.add("needs-selection");
    selectionCard.innerHTML = "<p>Pick a window and mark at least one quest first.</p>";
    return;
  }

  const formData = new FormData(form);
  const selectedQuests = getSelectedQuests();
  saveSignal(formData);
  updateFallbackLink(formData);
  form.classList.add("has-submitted");
  confirmation.hidden = false;
  confirmationCopy.textContent = `${selectedWindow}. ${selectedQuests.length} quest${selectedQuests.length === 1 ? "" : "s"} marked. Strong signal.`;
  window.setTimeout(() => {
    confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 120);
}

windowGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-window]");
  if (!button) return;
  selectedWindow = button.dataset.window;
  selectedQuestIds = new Set();
  flippedQuestIds = new Set();
  selectionCard.classList.remove("needs-selection");
  renderQuests();
  updateSelection();
});

activityGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quest-id]");
  if (!button) return;

  const questId = button.dataset.questId;
  if (event.target.closest(".reveal-prompt")) {
    if (flippedQuestIds.has(questId)) {
      flippedQuestIds.delete(questId);
    } else {
      flippedQuestIds.add(questId);
    }
  } else if (selectedQuestIds.has(questId)) {
    selectedQuestIds.delete(questId);
  } else {
    selectedQuestIds.add(questId);
  }

  selectionCard.classList.remove("needs-selection");
  renderQuests();
  updateSelection();
});

form?.addEventListener("submit", handleSubmit);

renderWindows();
renderQuests();
updateSelection();
