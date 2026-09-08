const fileInput = document.querySelector("#cv");
const fileTitle = document.querySelector("#file-title");
const fileError = document.querySelector("#file-error");
const uploadZone = document.querySelector("#upload-zone");
const form = document.querySelector("#application");
const status = document.querySelector("#form-status");
const allowedExtensions = ["pdf", "doc", "docx"];
const maxFileSize = 10 * 1024 * 1024;

document.querySelector("#year").textContent = new Date().getFullYear();

function validateFile() {
  const file = fileInput.files[0];
  fileError.textContent = "";
  fileInput.setCustomValidity("");

  if (!file) {
    fileTitle.textContent = "Drop your CV here";
    return true;
  }

  const extension = file.name.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    fileInput.setCustomValidity("Please attach a PDF, DOC or DOCX file.");
    fileError.textContent = "Please attach a PDF, DOC or DOCX file.";
    fileTitle.textContent = "Choose a different file";
    return false;
  }

  if (file.size > maxFileSize) {
    fileInput.setCustomValidity("Please keep the file under 10 MB.");
    fileError.textContent = "Please keep the file under 10 MB.";
    fileTitle.textContent = "Choose a smaller file";
    return false;
  }

  fileTitle.textContent = file.name;
  return true;
}

fileInput.addEventListener("change", validateFile);
["dragenter", "dragover"].forEach((eventName) => uploadZone.addEventListener(eventName, () => uploadZone.classList.add("is-dragging")));
["dragleave", "drop"].forEach((eventName) => uploadZone.addEventListener(eventName, () => uploadZone.classList.remove("is-dragging")));

form.addEventListener("submit", (event) => {
  if (!validateFile() || !form.checkValidity()) {
    event.preventDefault();
    status.textContent = "Please complete the required fields.";
    form.reportValidity();
    return;
  }

  status.textContent = "Sending application…";
  form.querySelector("button").disabled = true;
});
