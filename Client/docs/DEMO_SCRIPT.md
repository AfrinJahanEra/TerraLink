# TerraLink 5–7 Minute Demo Script

The story: a resident reports a problem at a real Dhaka water body, a manager checks the evidence, and the team turns it into costed field work.

## Before the demo
- Use a laptop browser. Start signed out. You will sign in as the User first and as the Project Manager later (sign out between them).
- Open the account menu and choose **Reset demo data** first, so the report numbers start at RPT-003.
- Have one real photo ready on the device (a picture of a lake bank, waste, or any outdoor scene) so the upload step shows real evidence.
- Optional: add EmailJS and Google OAuth variables if you want the notification steps to send for real.
- Roles are chosen at sign-in and are not verified. Say so if asked.

## 1. Explore the water bodies — 40 seconds (signed out)
Say: “Anyone can see the five water bodies we monitor, drawn from their mapped outlines on real satellite imagery.”
- Open `/explore`. Point at the outlines, the status colours, and the diamond report markers.
- Search for “Dhanmondi”, select it, and read the panel: mapped area, boundary source, and “Water-area change: Not yet measured”.
- Say plainly that the boundary comes from OpenStreetMap and is not surveyed.

## 2. Report a problem — 70 seconds (User)
Say: “Reports come from signed-in users, so every report has an owner a reviewer can ask for detail.”
- Select **Report a problem here**. Point out the sign-in gate, choose **Log in as a user**, and note that you return to the form.
- Show that a staff role sees an explanation instead of the form, and that a user cannot open the dashboard.
- Press **Submit report** with the form empty to show the validation messages.
- Add the photo, choose Waste dumping, type a short description, and confirm the pin sits on the lake (try **Use my location** or tap the map).
- Submit and read out the report ID and the **Pending review** status.

## 3. See it on the map — 30 seconds
- Select **Go to my reports** to follow the status, then **See it on the map**. The new diamond marker appears with the photo, date and status. The public view shows “Reporter”, not the person’s name.
- Open the pond page and show the report in the water body’s list.

## 4. Verify the evidence — 60 seconds (Project Manager)
Say: “A report is evidence, not a finding. A manager checks it and the decision is recorded.”
- Sign out, then sign in as Project Manager and open **Community reports**.
- Open the new report, read the photo, location, reporter and review history.
- Try **Reject** without a reason to show the required note, then **Start review**, then **Verify** with a note.
- Sign back in as the User and show the new status and the reviewer’s note under **My reports**.

## 5. Measure the water — 70 seconds
Say: “Imagery is real and dated. TerraLink measures the water inside the outline, and says so when the data cannot support a number.”
- Open **Satellite comparison** for the same lake (Hatirjheel works well in the dry season). The first run for a pair takes about half a minute; run it once before the demo so it is cached.
- Read the real acquisition dates and scene IDs, then swipe between the two images with the water mask on.
- Read the measured area for each date, the change, and the verdict. If it says “No measurable change”, explain that the difference is inside the pixel-size uncertainty and ESA’s independent classification agrees.
- Show the data-quality panel: usable pixels, scene cloud cover, seasonal gap, the 1 hectare limit. Open Gol Talab to show **Not reliable**.
- **Save to site record**, then open **Site review** to show the saved measurement and the manager decision panel.

## 6. Assign, work, cost and verify — 120 seconds
Say: “The report becomes accountable work, and only a manager can close it.”
- From the verified report select **Create field task**. The form is prefilled and keeps the link to the report. Assign Rahim Uddin and set an estimate.
- Sign out and sign in as Field Coordinator (there is no role switcher): **Start work**, **Add expense** (it shows as pending and is not counted), then **Submit completion evidence** with an after-photo and a summary. Point out the coordinator cannot close the task.
- Sign out and sign in as Project Manager: the banner says one task waits for verification. Open it, compare the **before** (report) and **after** photos, approve the pending expense and watch the approved cost update.
- Try **Return for more work** without a note to show the required reason, then return it with a note. Resubmit as the coordinator, then **Approve and complete** with the outcome **Resolved**.
- Show the report, now marked Resolved with “Action taken”, and the user’s **My reports** page showing the same.

## 7. Bangla assistant and report — 60 seconds
- Select the same lake and ask “কোন রিপোর্ট যাচাই বাকি?” and “কোন কাজ বাকি?”. Show the source chips.
- Open **Reports**, generate the preview, and show the satellite imagery, community reports table, tasks, cost variance, limitations and sources. Click **Download PDF** to save it, then **Send**: pick a person from the list and click their **Send** button to email them the summary table with the PDF attached.

## 8. Close — 20 seconds
- Open **Community reports** and a report's history to show who submitted, reviewed and verified it.
- Finish with the honest boundary: real imagery, real outlines, real uploaded evidence; sample tasks, costs and classifications; water-area change not yet measured (next step: NDWI from Sentinel-2).

## Roles in 60 seconds (optional)
- Sign in as Field Coordinator: six pages only, no budget, and only your own tasks. Open the account menu, then **My role and access**.
- Open `/budget` by hand to show the "not part of your role" page instead of data.
- Sign in as Project Manager to show a task with the Assign and Approve controls. There is no Start or Submit button: the assignee does the work, so nobody approves their own submission.

## Edge cases to show if asked
- Gol Talab (0.6 ha) shows **Insufficient data**: it is under the one hectare minimum for 10 m imagery, so field photos are the right evidence.
- A pin outside every outline is saved as a location-based report with no water body attached.
- A rejected report disappears from the public map but stays in the review queue.
- A comparison with dates that are months apart in the seasonal cycle, or with no scene in the window, shows a warning or offers the nearest scene instead of a number.
- Missing keys, rejected OAuth, or provider quota errors produce Failed log entries and never crash the app.
