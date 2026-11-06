const form = document.querySelector("#activity-form");
const message = document.querySelector("#message");

const timedFetch = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(5000) });

const fetchJSON = async (url, options = {}) => {
  let response;

  try {
    response = await timedFetch(url, options);
  } catch (error) {
    throw new Error(
      error.name === "TimeoutError"
        ? "The server did not answer within five seconds."
        : "Could not reach the server.",
    );
  }

  let body = {};

  try {
    body = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(body.error || `The server answered ${response.status}.`);
  }

  return body;
};

const announceActivitiesChanged = () =>
  document.body.dispatchEvent(new Event("activities-changed"));

if (form && message) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activity = Object.fromEntries(new FormData(form));
    const button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    message.textContent = "";

    try {
      await fetchJSON("/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activity),
      });

      form.reset();
      message.textContent = "Activity saved successfully.";
      announceActivitiesChanged();
    } catch (error) {
      message.textContent = `Your activity was not saved. ${error.message}`;
    } finally {
      button.disabled = false;
    }
  });
}

const goalForm = document.querySelector("#goal-form");
const goalList = document.querySelector("#goals");

const buildGoalItem = (goal) => {
  const item = document.createElement("li");

  item.className =
    "rounded-xl border p-4 text-sm leading-6 " +
    (goal.achieved
      ? "border-emerald-300 bg-emerald-50"
      : "border-slate-200 bg-white");

  const week = document.createElement("strong");
  week.textContent = `${goal.weekStart} to ${goal.weekEnd}`;

  item.append(
    week,
    ` — ${goal.method} — ${goal.completedDays}/${goal.targetDays} days` +
      (goal.achieved ? " — goal met" : ""),
  );

  return item;
};

if (goalForm && goalList && message) {
  goalForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const goal = Object.fromEntries(new FormData(goalForm));
    const button = goalForm.querySelector('button[type="submit"]');

    button.disabled = true;
    message.textContent = "";

    try {
      const saved = await fetchJSON("/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });

      goalList.append(buildGoalItem(saved));
      message.textContent = "Goal saved successfully.";
      goalForm.reset();
    } catch (error) {
      message.textContent = `Your goal was not saved. ${error.message}`;
    } finally {
      button.disabled = false;
    }
  });
}

const htmxErrorText = (xhr) => {
  const fallback = `The server answered ${xhr.status}.`;

  try {
    return JSON.parse(xhr.responseText).error || fallback;
  } catch {
    return fallback;
  }
};

const methodFilter = document.querySelector("#method-filter");

if (methodFilter && message) {
  methodFilter.addEventListener("change", () => {
    message.textContent = "";
  });
}

if (message) {
  document.body.addEventListener("htmx:afterRequest", (event) => {
    if (
      event.detail.successful &&
      event.detail.requestConfig.verb === "delete"
    ) {
      message.textContent = "Activity deleted.";
    }
  });

  document.body.addEventListener("htmx:responseError", (event) => {
    message.textContent = `That didn't work. ${htmxErrorText(event.detail.xhr)}`;
  });

  document.body.addEventListener("htmx:sendError", () => {
    message.textContent = "Could not reach the server.";
  });

  document.body.addEventListener("htmx:timeout", () => {
    message.textContent = "The server did not answer within five seconds.";
  });
}
