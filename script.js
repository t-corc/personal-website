const year = document.querySelector("#year");
const form = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const successMessage = document.querySelector("#success-message");

if (year) {
  year.textContent = new Date().getFullYear();
}

function setStatus(message) {
  if (formStatus) formStatus.textContent = message;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const submitButton = form.querySelector("button[type='submit']");
  const endpoint = form.dataset.endpoint || form.action;
  const payload = Object.fromEntries(new FormData(form).entries());

  submitButton.disabled = true;
  setStatus("Sending.");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Contact request failed");
    }

    form.hidden = true;
    successMessage.hidden = false;
    setStatus("");
  } catch (error) {
    setStatus(error.message || "Please email directly for now.");
    submitButton.disabled = false;
  }
});
