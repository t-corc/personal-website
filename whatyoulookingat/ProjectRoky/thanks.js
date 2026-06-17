const calendarDownload = document.querySelector("#calendar-download");

function createCalendarDownload() {
  if (!calendarDownload) return;

  const latestSignal = JSON.parse(window.localStorage.getItem("projectRokyLatestSignal") || "null");
  if (!latestSignal?.calendarFile) {
    calendarDownload.classList.add("is-disabled");
    calendarDownload.removeAttribute("href");
    calendarDownload.textContent = "Calendar file unavailable";
    return;
  }

  const file = new Blob([latestSignal.calendarFile], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(file);
  calendarDownload.href = url;
  calendarDownload.download = "project-roky.ics";
}

createCalendarDownload();
