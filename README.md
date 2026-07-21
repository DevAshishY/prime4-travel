# Prime4Travels — Tempo Traveller Booking in Kanpur

A static marketing site with a dynamic **Quick Enquiry Form**. Submissions are
emailed to `prime4travels@gmail.com` using [FormSubmit.co](https://formsubmit.co)
— no backend server or SMTP setup required. It's plain HTML/CSS/JS and deploys to
any static host (e.g. Vercel) with zero configuration.

## One-time activation (important)

The **first** time someone submits the enquiry form, FormSubmit sends a
confirmation email to `prime4travels@gmail.com`. Open that email and click the
activation link **once**. After that, every enquiry is delivered automatically.

To change the destination email, edit `FORMSUBMIT_ENDPOINT` at the top of
`script.js`, then re-activate with a test submission.

## Running locally

Just open `index.html` in a browser, or serve the folder statically:

```bash
npx serve .
```

The form posts directly to FormSubmit.co, so it works from any host (including
`localhost`) once activated.

## Vehicle background photo

Place your vehicle background photo as `images/vehicle.jpg`.

- File name: `vehicle.jpg` (lowercase)
- Optimal size: ~1400x800 (aspect ~16:9)
- Compress for web (JPEG quality 70-80%) to keep pages fast

The hero uses this local image first and falls back to an Unsplash photo if it
isn't present.
