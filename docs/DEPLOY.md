# Deploy FleetDesk: GitHub, Supabase, Vercel (all free)

Takes about 20 minutes the first time. Do the parts in order.

## Part 1. Put the code on GitHub

1. Create a free account at github.com. Click **New repository**. Name it `fleetdesk`, choose **Public**, and do **not** tick "Add a README".
2. Open the project folder in VS Code, open the terminal (Terminal menu, New Terminal) and run these one at a time. Replace `YOUR-USERNAME`.

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git init
git add .
git commit -m "FleetDesk: booking and operations platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fleetdesk.git
git push -u origin main
```

3. Refresh the GitHub page. You should see the files. `.env.local` and `node_modules` are not uploaded (they are ignored on purpose).
4. Open the **Actions** tab. The CI workflow runs your lint, type check, tests, build and browser tests. A green tick means everything passes on a clean machine. (If it is red, open it and read the failing step; send me the message and I will fix it.)

## Part 2. Create the free database (Supabase)

1. Go to supabase.com, sign in with GitHub, click **New project**.
2. Name: `fleetdesk`. **Database password:** use only letters and numbers (for example `Fleet2026Desk9Rental`). Symbols such as `@` or `#` break the connection string. Save it somewhere.
3. **Region:** choose **East US (North Virginia)**. Vercel's functions run in Washington DC by default, so this keeps the site fast.
4. Wait about 2 minutes until the project is ready.
5. Click **Connect** (top of the page). Choose **Transaction pooler**. Copy the string. It looks like:

```
postgresql://postgres.abcdefghijkl:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

6. Replace `[YOUR-PASSWORD]` with your password (remove the square brackets too). This whole string is your `DATABASE_URL`.

You do not need to create any tables. FleetDesk creates its tables and loads the demo data by itself the first time it runs.

## Part 3. Deploy on Vercel

1. Go to vercel.com, sign in with GitHub, click **Add New, Project**, and import `fleetdesk`.
2. Leave the framework as **Next.js**. Open **Environment Variables** and add:

| Name                   | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`         | the Supabase string from Part 2                                        |
| `AUTH_SECRET`          | any long random text, at least 32 characters                           |
| `NEXT_PUBLIC_SITE_URL` | `https://fleetdesk.vercel.app` for now (you will correct it in step 5) |

3. Click **Deploy**. Wait about 2 minutes.
4. Click the preview image to open your live site. **First check:** add `/api/health` to the address. You should see:

```json
{ "ok": true, "database": "postgres", "vehicles": 12 }
```

5. In Vercel open **Settings, Domains** and copy your real address (for example `fleetdesk-yourname.vercel.app`). Put it into `NEXT_PUBLIC_SITE_URL` (Settings, Environment Variables), then **Deployments, the three dots, Redeploy**. This makes the link previews (when you share on LinkedIn or WhatsApp) use the right address.
6. In Supabase, open **Table Editor**. You will see `vehicles`, `bookings` and `settings`. After you make a booking on the live site, a new row appears in `bookings`. That is the proof the data is saved.

Every time you push to GitHub, Vercel redeploys automatically.

## Part 4. Test the live site (5 minutes) before you send it to anyone

1. Home page loads, cars show.
2. Fleet, filter by SUV, open a car, pick dates 2 months from now, book it, pay with `4242 4242 4242 4242`. You land on a confirmation with a reference like `FD-1170`.
3. Try the same dates again. It must say they are taken.
4. `/login`, click **Fill in demo login**, sign in. The Overview shows numbers and charts.
5. Bookings: your booking is at the top. Search for your name.
6. Refresh the page and open it on your phone. The booking is still there (it is saved in Supabase).
7. Settings, **Reset demo data**. Everything returns to the sample data.

## If something goes wrong

| What you see                                                     | What to do                                                                                                                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/health` says `"ok":false`                                  | `DATABASE_URL` is wrong. Check it is the **Transaction pooler** string (port **6543**), the password is correct with no brackets, and the password has no symbols. Fix it in Vercel, then Redeploy. |
| Pages show an error after the site was unused for a week or more | Free Supabase projects pause when unused. Open the Supabase dashboard and click **Restore project**.                                                                                                |
| `/api/health` is ok but the dashboard charts look empty          | The sample dates are old. Sign in, Settings, **Reset demo data**.                                                                                                                                   |
| Vercel build fails                                               | Open the build log. In **Settings, General**, set **Node.js Version** to 22.x and redeploy.                                                                                                         |
| Login says wrong password                                        | Use the demo login from the login page, or the `OWNER_EMAIL` and `OWNER_PASSWORD` you set in Vercel.                                                                                                |
| Changes you make in code don't appear                            | Push to GitHub (`git add .`, `git commit -m "message"`, `git push`) and wait for Vercel to redeploy.                                                                                                |
