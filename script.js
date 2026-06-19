const thread = document.querySelector("#chat-thread");
const nameInput = document.querySelector("#visitor-name");
const nameSubmit = document.querySelector("#name-submit");
const skipChat = document.querySelector("#skip-chat");
const profile = document.querySelector("#profile");
const year = document.querySelector("#year");

const topics = {
  about: {
    label: "About",
    response:
      "I’m an Account Executive based in Madrid. I care about the commercial craft: understanding a business, earning trust, negotiating well, and finding the move that creates growth. Building software is the second half of the same instinct — noticing friction and doing something useful about it.",
    link: ["Read the full profile", "#profile-about"],
  },
  projects: {
    label: "Projects",
    response:
      "Most of my software begins as an internal itch. My latest build is a prospecting copilot that scores Italian companies, explains why they rank, flags compliance gaps, and drafts evidence-based outreach for human approval.",
    projects: [
      ["Prospecting Copilot", "Prioritization, explainable scoring and outreach drafts"],
      ["Workflow automation", "Research, reporting and CRM utilities"],
      ["Current experiments", "New builds being prepared for publication"],
    ],
    link: ["See selected work", "#profile-work"],
  },
  play: {
    label: "Play",
    response:
      "A portfolio should reward curiosity. I made you a five-round geography challenge: three clues, four countries, and no diplomatic consequences for a wrong answer.",
    link: ["Play the geography game", "#profile-play"],
  },
  experience: {
    label: "Experience",
    response:
      "At Amazon, I’ve owned growth across a €50M+ European portfolio and delivered +209% year-over-year revenue growth. Before that, I worked in program management at Amazon and Microsoft, where I built data-led operating mechanisms and commercial pipeline.",
    link: ["View experience", "#profile-experience"],
  },
  contact: {
    label: "Contact",
    response:
      "I’m interested in ambitious commercial roles, practical automation, and people who value initiative over job-title boundaries.",
    link: ["Start a conversation", "mailto:tommasocorciulo02@icloud.com"],
  },
};

let visitorName = "there";
let answeredTopics = new Set();

const geographyQuestions = [
  {
    answer: "Portugal",
    clues: ["Europe’s western edge", "The Douro meets the Atlantic here", "Pastéis de nata"],
    options: ["Portugal", "Croatia", "Belgium", "Ireland"],
    fact: "Portugal is the westernmost country in mainland Europe.",
  },
  {
    answer: "Kenya",
    clues: ["Crossed by the equator", "Home to the Great Rift Valley", "Capital: Nairobi"],
    options: ["Ghana", "Kenya", "Namibia", "Ethiopia"],
    fact: "Kenya contains 13 terrestrial ecoregions, from glaciers to coral reefs.",
  },
  {
    answer: "Japan",
    clues: ["An archipelago of thousands of islands", "Mount Fuji", "The Shinkansen"],
    options: ["South Korea", "Philippines", "Japan", "Indonesia"],
    fact: "Japan’s four largest islands account for about 98% of its land area.",
  },
  {
    answer: "Argentina",
    clues: ["The Andes form its western border", "Patagonia", "Birthplace of tango"],
    options: ["Chile", "Uruguay", "Peru", "Argentina"],
    fact: "Argentina stretches over 3,600 km from north to south.",
  },
  {
    answer: "Iceland",
    clues: ["Sits on two tectonic plates", "More than 100 volcanoes", "Capital: Reykjavík"],
    options: ["Finland", "Iceland", "Estonia", "Norway"],
    fact: "Iceland is one of the few places where the Mid-Atlantic Ridge rises above sea level.",
  },
  {
    answer: "Morocco",
    clues: ["The Atlas Mountains", "Coasts on two major bodies of water", "Capital: Rabat"],
    options: ["Jordan", "Tunisia", "Morocco", "Egypt"],
    fact: "Morocco faces both the Atlantic Ocean and the Mediterranean Sea.",
  },
  {
    answer: "New Zealand",
    clues: ["Two main islands in the South Pacific", "The Southern Alps", "Capital: Wellington"],
    options: ["Fiji", "Australia", "New Zealand", "Samoa"],
    fact: "New Zealand was the last major habitable landmass settled by humans.",
  },
  {
    answer: "Vietnam",
    clues: ["An S-shaped coastline", "The Mekong Delta", "Capital: Hanoi"],
    options: ["Thailand", "Vietnam", "Cambodia", "Malaysia"],
    fact: "Vietnam’s coastline runs for more than 3,200 km.",
  },
];

const geoRound = document.querySelector("#geo-round");
const geoScore = document.querySelector("#geo-score");
const geoStreak = document.querySelector("#geo-streak");
const geoClues = document.querySelector("#geo-clues");
const geoOptions = document.querySelector("#geo-options");
const geoFeedback = document.querySelector("#geo-feedback");
const geoStage = document.querySelector("#geo-game-stage");
const geoResult = document.querySelector("#geo-game-result");
const geoResultMark = document.querySelector("#geo-result-mark");
const geoResultTitle = document.querySelector("#geo-result-title");
const geoResultCopy = document.querySelector("#geo-result-copy");
const geoRestart = document.querySelector("#geo-restart");

let gameQuestions = [];
let gameRound = 0;
let gameScore = 0;
let gameStreak = 0;

function createMessage(side, content, extraClass = "") {
  const article = document.createElement("article");
  article.className = `message from-${side} ${extraClass}`.trim();

  if (side === "tommaso") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "T";
    article.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = side === "visitor" ? "bubble visitor-bubble" : "bubble";

  if (typeof content === "string") {
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    bubble.appendChild(paragraph);
  } else {
    bubble.appendChild(content);
  }

  article.appendChild(bubble);
  thread.appendChild(article);
  article.scrollIntoView({ behavior: "smooth", block: "end" });
  return article;
}

function createChoices() {
  const choices = document.createElement("div");
  choices.className = "choice-bubble";

  Object.entries(topics).forEach(([key, topic]) => {
    if (answeredTopics.has(key)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.topic = key;
    button.textContent = topic.label;
    choices.appendChild(button);
  });

  return choices;
}

function askNext() {
  if (answeredTopics.size === Object.keys(topics).length) {
    window.setTimeout(() => {
      createMessage(
        "tommaso",
        `That’s the short version, ${visitorName}. The rest is below — and the work will keep evolving.`,
      );
      window.setTimeout(() => revealProfile("#profile-about"), 650);
    }, 400);
    return;
  }

  window.setTimeout(() => {
    createMessage("visitor", createChoices(), "choice-message");
  }, 350);
}

function submitName() {
  const value = nameInput.value.trim();
  visitorName = value || "there";
  nameInput.disabled = true;
  nameSubmit.disabled = true;

  window.setTimeout(() => {
    createMessage(
      "tommaso",
      `Nice to meet you, ${visitorName}. You can steer from here. What are you curious about?`,
    );
    askNext();
  }, 300);
}

function answerTopic(button) {
  const key = button.dataset.topic;
  const topic = topics[key];
  if (!topic || answeredTopics.has(key)) return;

  answeredTopics.add(key);
  const choiceContainer = button.parentElement;
  choiceContainer.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
  });
  button.classList.add("selected");

  window.setTimeout(() => {
    const content = document.createElement("div");
    content.className = "response-card";

    const text = document.createElement("p");
    text.textContent = topic.response;
    content.appendChild(text);

    if (topic.projects) {
      const list = document.createElement("div");
      list.className = "project-chat-list";
      topic.projects.forEach(([title, description]) => {
        const item = document.createElement("div");
        const strong = document.createElement("strong");
        const small = document.createElement("small");
        strong.textContent = title;
        small.textContent = description;
        item.append(strong, small);
        list.appendChild(item);
      });
      content.appendChild(list);
    }

    const link = document.createElement("a");
    link.href = topic.link[1];
    link.textContent = `${topic.link[0]} ↗`;
    if (topic.link[1].startsWith("#")) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        revealProfile(topic.link[1]);
      });
    }
    content.appendChild(link);

    createMessage("tommaso", content);
    askNext();
  }, 350);
}

function revealProfile(target = "#profile-about") {
  profile.hidden = false;
  profile.classList.add("is-revealed");
  skipChat.textContent = "Profile opened";
  skipChat.disabled = true;

  window.setTimeout(() => {
    document.querySelector(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 80);
}

function revealProfileFromHash() {
  const target = window.location.hash;
  if (!target.startsWith("#profile-")) return;
  revealProfile(target);
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function startGeographyGame() {
  gameQuestions = shuffle(geographyQuestions).slice(0, 5);
  gameRound = 0;
  gameScore = 0;
  gameStreak = 0;
  geoStage.hidden = false;
  geoResult.hidden = true;
  showGeographyQuestion();
}

function showGeographyQuestion() {
  const question = gameQuestions[gameRound];
  geoRound.textContent = gameRound + 1;
  geoScore.textContent = gameScore;
  geoStreak.textContent = gameStreak;
  geoFeedback.textContent = "";
  geoFeedback.className = "geo-feedback";
  geoClues.replaceChildren();
  geoOptions.replaceChildren();

  question.clues.forEach((clue, index) => {
    const item = document.createElement("li");
    item.innerHTML = `<span>0${index + 1}</span><p>${clue}</p>`;
    geoClues.appendChild(item);
  });

  shuffle(question.options).forEach((country, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.country = country;
    button.innerHTML = `<span>${String.fromCharCode(65 + index)}</span>${country}`;
    geoOptions.appendChild(button);
  });
}

function answerGeographyQuestion(button) {
  const question = gameQuestions[gameRound];
  const isCorrect = button.dataset.country === question.answer;
  const buttons = geoOptions.querySelectorAll("button");

  buttons.forEach((option) => {
    option.disabled = true;
    if (option.dataset.country === question.answer) option.classList.add("is-correct");
  });

  if (isCorrect) {
    gameScore += 1;
    gameStreak += 1;
    geoFeedback.textContent = `Correct. ${question.fact}`;
    geoFeedback.classList.add("is-correct");
  } else {
    gameStreak = 0;
    button.classList.add("is-wrong");
    geoFeedback.textContent = `${question.answer}. ${question.fact}`;
    geoFeedback.classList.add("is-wrong");
  }

  geoScore.textContent = gameScore;
  geoStreak.textContent = gameStreak;

  window.setTimeout(() => {
    gameRound += 1;
    if (gameRound < gameQuestions.length) {
      showGeographyQuestion();
    } else {
      finishGeographyGame();
    }
  }, 1900);
}

function finishGeographyGame() {
  const results = [
    ["A brave expedition.", "The borders got blurry. Fortunately, the replay button has no visa requirements."],
    ["Promising navigator.", "A few wrong turns, but you would probably make it back before dark."],
    ["Well travelled.", "Strong geographic instincts. You can be trusted with the window seat."],
    ["Human atlas.", "Five out of five. Suspiciously good, but international acclaim is yours."],
  ];
  const resultIndex = gameScore === 5 ? 3 : gameScore >= 4 ? 2 : gameScore >= 2 ? 1 : 0;

  geoStage.hidden = true;
  geoResult.hidden = false;
  geoResultMark.textContent = `${gameScore}/5`;
  geoResultTitle.textContent = results[resultIndex][0];
  geoResultCopy.textContent = results[resultIndex][1];
}

nameSubmit?.addEventListener("click", submitName);
nameInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitName();
});

thread?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-topic]");
  if (button) answerTopic(button);
});

skipChat?.addEventListener("click", () => revealProfile());
window.addEventListener("hashchange", revealProfileFromHash);
geoOptions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-country]");
  if (button && !button.disabled) answerGeographyQuestion(button);
});
geoRestart?.addEventListener("click", startGeographyGame);

if (year) year.textContent = new Date().getFullYear();
revealProfileFromHash();
if (geoOptions) startGeographyGame();
