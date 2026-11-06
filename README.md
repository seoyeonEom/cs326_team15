# cs326_team15

## Team Member

| Name                  | GitHub Username                                |
| :-------------------- | :--------------------------------------------- |
| Seoyeon Eom           | [@seoyeonEom](https://github.com/seoyeonEom)   |
| Agustin Pemberton     | [@ampemb](https://github.com/ampemb)           |
| Sally Vakhtangishvili | [@Salikuna](https://github.com/Salikuna)       |
| Willow Taylor         | [@RaineWillow](https://github.com/RaineWillow) |

## Working Agreement

- **Communication Cadence:** Primary communication will occur on WhatsApp, with team members agreeing to respond on the same day (within 12 hours) on weekdays and within 2 hours on sprint milestone due dates.
- **Meeting Schedule:** We will hold a weekly sync meeting (virtual or in-person) to review sprint progress, allocate tasks, and resolve blockers.
- **Definition of "Done" for PRs:** All work must be done on separate feature branches. A PR is considered done only after resolving conflicts and receiving at least 1 approving peer review before merging to `main`.

* **Decision Making & Conflict Resolution:** Technical or design disagreements will be discussed during sync meetings by evaluating pros, cons, and project scope. If consensus cannot be reached, the decision will be made by a team majority vote.

## Project Domain

Our project is a gamified carbon footprint tracker that helps university students monitor and reduce their daily environmental impact. Using open APIs to track carbon intensity over time, the application provides interactive daily tracking and visual impact graphs. By turning emissions data into actionable goals, the platform fosters sustainable campus habits and active climate awareness beyond the classroom.

## Getting Started

Follow these steps to run the application locally.

**Prerequisites:** **Node.js** and **npm**. If needed, install the LTS version from [nodejs.org](https://nodejs.org/).

1. Clone the repository

   ```bash
   git clone https://github.com/seoyeonEom/cs326_team15.git
   cd cs326_team15
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start MongoDB from the dev container

   ```bash
   dc-up mongo
   ```

   The server connects to `mongodb://dev:devpassword@mongo:27017/devdb?authSource=admin` by default. To use a different MongoDB (for example a local install at `mongodb://localhost:27017/devdb`), set `MONGODB_URI` before starting the server. If MongoDB is not reachable, the server exits after five seconds with a message saying so.

4. Start the Express server from the project root

   ```bash
   npm start
   ```

5. Access the application
   - **Home page:** [http://localhost:3000](http://localhost:3000)
   - **Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - **Transportation Activities:** [http://localhost:3000/activities](http://localhost:3000/activities)
   - **Weekly Goals:** [http://localhost:3000/goals](http://localhost:3000/goals)

## Sprint 2 Features

### 1. Transportation Activity Logging

Students can record a transportation activity and see its estimated carbon emissions.

**How to use:**

1. Visit http://localhost:3000/activities.
2. Choose a date and transportation method (`walking`, `cycling`, `bus`, or `car`).
3. Enter a positive distance and select `km` or `mi`.
4. Click **Save activity**.
5. View the saved activity and emissions estimate in **Saved Activities**. Reload the page to see the saved records again.

**Validation and persistence:** The service validates user input and calculates estimated emissions. Activities are saved in data/activities.json, and invalid requests return a 400 response with an error message.

**Emissions calculation:** Estimated emissions are calculated based on transportation method and distance, using illustrative emission factors.

### 2. Transportation Emissions Breakdown

Students can filter their transportation activities by method and view a summary of their estimated carbon emissions.

**How to use:**

1. Visit [http://localhost:3000/activities](http://localhost:3000/activities).
2. Select a transportation method (`walking`, `cycling`, `bus`, or `car`) from the filter, or choose `All` to view every activity.
3. View the filtered activities in **Saved Activities**.
4. Check the total estimated emissions and activity count for the selected method.
5. Add a new activity to see the breakdown update.

**Filtering and aggregation:** The service retrieves saved activities from `data/activities.json` and filters them by transportation method. It calculates the total estimated emissions and activity count for the selected records.

**Data persistence:** This feature uses existing transportation activity records and does not require a separate data file.

### 3. Weekly Goal Setting

Students can set weekly transportation goals and track their progress based on recorded activities.

**How to use:**

1. Visit [http://localhost:3000/goals](http://localhost:3000/goals).
2. Choose a date within the target week.
3. Select a transportation method (`walking`, `cycling`, `bus`, or `car`).
4. Enter a target number of days between 1 and 7.
5. Click **Save goal**.
6. View the saved goal, completed days, and achievement status. Reload the page to see updated progress based on saved activities.

**Validation and persistence:** The service validates user input and prevents duplicate goals for the same week and transportation method. Goals are saved in `data/goals.json`. Invalid requests return a 400 response, and duplicate goals return a 409 response.

**Progress calculation:** The service reads transportation activities from `data/activities.json` and counts the number of unique days with matching activities during the selected Monday–Sunday week. Multiple activities on the same day count as one completed day. A goal is marked as achieved when completed days meet or exceed the target.

## Sprint 3 Features

### 1. MongoDB Persistence

Replaced JSON file storage with MongoDB using Mongoose. Transportation activities and weekly goals are now stored in separate collections with support for individual CRUD operations.

**How to use:**

1. Run `dc-up mongo` and `npm start`.
2. Visit http://localhost:3000/activities or http://localhost:3000/goals and create a record.
3. Restart the server and reload the page to confirm the data persists.
4. Run `mongo-dev` and use `db.activities.find()` or `db.goals.find()` to inspect saved records.

**Data persistence:** Mongoose repositories handle database operations instead of reading and rewriting JSON files. MongoDB ObjectIds are converted to client-facing `id` values through DTOs.

**Routes that hit MongoDB:** every `/activities` and `/goals` route goes through a Mongoose repository. Single records are reached by their MongoDB id:

- `GET /activities/:id`, `PUT /activities/:id`, `DELETE /activities/:id`
- `GET /goals/:id`

An id that is not a valid ObjectId gets a 400 before the database is queried; a valid id with no record gets a 404.

**Client-facing ids:** none of our views or client-side scripts used an array position as an id. Sprint 2 already gave each record a UUID, and no page displayed or sent an id. So nothing had to change from an array index to the real id. The first client-facing id is the new **Delete** button (see HTMX below), which uses the MongoDB `_id`, exposed as `id` by the DTO.

### 2. Jest Unit Tests

Added Jest tests for service-layer business rules, including input validation, emissions calculations, and weekly goal progress.

**How to use:**

1. Run `npm test` from the project root.
2. Verify that all tests pass without MongoDB running.

**Testing approach:** Tests in `__tests__/activitiesService.test.js` and `__tests__/goalsService.test.js` use `jest.unstable_mockModule()` to mock repositories and test services independently of the database.

### 3. HTMX Partial Updates

The transportation filter on the activities page now uses HTMX instead of a hand-written `fetch` call and manual DOM updates. Each saved activity also has a **Delete** button that uses HTMX.

**How to use:**

1. Visit http://localhost:3000/activities and save a few activities.
2. Change **Filter by transportation method**. Only the totals and the activity list change: the address bar stays the same, and the Network tab shows one `GET /activities/breakdown?method=...` request.
3. Click **Delete** on an activity and confirm. That row disappears and the totals update, again without a page reload.
4. To see the partial the server sends: `curl -s -H 'HX-Request: true' "http://localhost:3000/activities/breakdown?method=bus"`

**How it works:**

- `views/activities.ejs` loads htmx 2.0.11. The filter `<select>` has `hx-get="/activities/breakdown"`, `hx-target="#breakdown-results"` and `hx-trigger="change, activities-changed from:body"`.
- `GET /activities/breakdown` checks the `HX-Request` header. HTMX gets the HTML fragment in `views/partials/breakdown.ejs` (totals and list, no `<html>` or `<body>`). Any other client still gets the JSON from Sprint 2. The same partial renders the list when the page first loads, so there is no fetch on load.
- Each **Delete** button has `hx-delete="/activities/<id>"`, `hx-target="closest li"` and `hx-swap="outerHTML"`. The server answers an HTMX delete with an empty `200` (HTMX does not swap a `204`), so the row is removed. It also sends an `HX-Trigger: activities-changed` header, and the filter re-fetches its partial so the totals stay correct.
- Saving an activity still posts JSON from `public/app.js`. After a successful save, it fires the same `activities-changed` event to refresh the breakdown. The old `refreshBreakdown` / `buildItem` code is gone.

### 4. Tailwind CSS

## System Diagram

![Sprint 3 System Architecture](docs/sprint3_diagram.svg)

## Design Decisions

### Sprint 2

**Seoyeon Eom**: For Transportation Activity Logging, I decided to keep input validation and carbon emission calculations in the service layer rather than the controller. An alternative would have been to handle these operations directly in the controller, which would have been simpler for a small application. However, separating the business logic from HTTP request handling makes the code easier to maintain and reuse. For example, if we add other ways to log activities in future sprints, we can reuse the same validation and calculation logic without duplicating it in different controllers. Although this approach requires more files and a slightly more complex structure, I think it is a better choice for our project's future development.

**Sally Vakhtangishvili:** For the Transportation Emissions Breakdown feature, I chose to implement filtering and emissions aggregation in the service layer rather than calculating these values directly in the frontend. An alternative would have been to retrieve all activities and use browser-side JavaScript to filter and sum their emissions. While that approach would have avoided creating a new API endpoint, keeping the calculations in the service layer ensures that the same business logic can be reused by other parts of the application, including the dashboard. It also allows the backend to validate the transportation method consistently and return a clear error for invalid requests. This introduces an additional endpoint but makes the functionality easier to maintain and extend.

**Willow Taylor:** Part of why I chose the date input is because Firefox doesn't support week inputs and shows a plain text box, so you'd have to type it by hand. And you'd still have to parse the string anyways, and there are a bunch of edge cases around New Year and a few other things, so the other option is best for my peace of mind. Also, snapping to monday means that you always get the same goals if you pick days in the same week. The rule successfully applies to any client, not only the form I cobbled together from looking a other commits. Dates are UTC midnight universally because of the potential difference between the server and client timezones. Checking whether an activity falls in a goal's week is a string comparison, so it's kind of simple.

### Sprint 3

**Seoyeon Eom**: I chose to replace JSON-based storage with Mongoose repositories using individual CRUD operations. An alternative was to keep the existing approach, which required fewer code changes but risked overwriting concurrent updates and becoming inefficient as data grows. Mongoose allows us to update individual records and use stable ObjectIds. Although this required changes to our services and DTOs, as well as additional database setup, I think it was worth the effort to make data storage more reliable.

**Willow Taylor**:the delete returns an empty 200 plus an HX-Trigger header, and the filter re-fetches. that’s two requests, but it keeps Unit 14’s delete pattern and reuses the same refresh the save form triggers. an alternative might be that the delete returns the whole re-rendered breakdown in one request. the cost, of course is that the delete button has to send the current filter, and the record controller has to know how to render the breakdown.