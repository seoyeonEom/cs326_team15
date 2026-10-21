const form = document.querySelector("#activity-form");
const list = document.querySelector("#activities");
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

const buildItem = (activity) => {
  const item = document.createElement("li");
  const date = document.createElement("strong");
  date.textContent = activity.date;
  item.append(
    date,
    ` — ${activity.method}, ${activity.distance} ${activity.unit} — ` +
      `${activity.emissions} kg CO2`,
  );
  return item;
};

if (form && list && message) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const activity = Object.fromEntries(new FormData(form));
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = "";

    try {
      const saved = await fetchJSON("/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activity),
      });
      form.reset();
      message.textContent = "Activity saved successfully.";
      try {
        await refreshBreakdown();
      } catch (error) {
        message.textContent =
          `Activity saved, but the breakdown could not be refreshed: ${error.message}`;
      }
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
  if (goal.achieved) item.classList.add("achieved");
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
const methodFilter = document.querySelector("#method-filter");
const totalEmissions = document.querySelector("#total-emissions");
const activityCount = document.querySelector("#activity-count");

const refreshBreakdown = async () => {
  const method = methodFilter.value;
  const query = method ? `?method=${encodeURIComponent(method)}` : "";

  const breakdown = await fetchJSON(`/activities/breakdown${query}`);

  totalEmissions.textContent = `${breakdown.totalEmissions} kg CO₂`;
  activityCount.textContent = breakdown.activityCount;

  list.replaceChildren();

  breakdown.activities.forEach((activity) => {
    list.append(buildItem(activity));
  });
};

if (methodFilter && totalEmissions && activityCount && list && message) {
  methodFilter.addEventListener("change", async () => {
    try {
      await refreshBreakdown();
      message.textContent = "";
    } catch (error) {
      message.textContent = `Could not load breakdown. ${error.message}`;
    }
  });

  refreshBreakdown().catch((error) => {
    message.textContent = `Could not load breakdown. ${error.message}`;
  });
}

