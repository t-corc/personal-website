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

if (year) year.textContent = new Date().getFullYear();
revealProfileFromHash();
