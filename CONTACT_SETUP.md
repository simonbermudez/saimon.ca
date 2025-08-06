# Contact Form Configuration Guide

Your contact form is now ready to work! Here are the setup options:

## Option 1: Formspree (Recommended - Free tier available)

1. Go to [https://formspree.io/](https://formspree.io/)
2. Sign up for a free account
3. Create a new form and get your Form ID
4. Add this script to your HTML `<head>` section:

```html
<script>
  window.FORMSPREE_ID = 'YOUR_FORM_ID_HERE'; // Replace with your actual form ID
</script>
```

**Pros:** Easy setup, spam protection, free tier available
**Cons:** Limited submissions on free plan

## Option 2: Netlify Forms (If hosting on Netlify)

Your form is already configured for Netlify! Just:
1. Deploy your site to Netlify
2. The form will automatically work
3. Check your Netlify dashboard for submissions

**Pros:** Unlimited forms if hosting on Netlify, built-in spam protection
**Cons:** Only works on Netlify hosting

## Option 3: EmailJS (Client-side email service)

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Create an account and set up your email service
3. Create an email template
4. Add these scripts to your HTML `<head>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script>
  emailjs.init('YOUR_PUBLIC_KEY'); // Replace with your public key
  window.EMAILJS_CONFIG = {
    serviceID: 'YOUR_SERVICE_ID',
    templateID: 'YOUR_TEMPLATE_ID',
    publicKey: 'YOUR_PUBLIC_KEY'
  };
</script>
```

**Pros:** No server required, customizable templates
**Cons:** Client-side only, API keys visible

## Option 4: Custom Backend API

If you want to create your own backend:

1. Set up a server with Node.js, Python, PHP, etc.
2. Create an endpoint at `/api/contact`
3. Handle POST requests with JSON data: `{name, email, message}`
4. Send emails using your preferred email service (SendGrid, AWS SES, etc.)

## Current Form Features

✅ **Form validation** (required fields, email format)
✅ **Error handling** with user-friendly messages
✅ **Loading states** (button shows "Sending..." during submission)
✅ **Success/error notifications**
✅ **Accessibility** (proper labels, ARIA attributes)
✅ **Responsive design**

## Testing

To test your form:
1. Choose one of the setup options above
2. Configure the service
3. Submit a test message
4. Check that you receive the email/notification

## Need Help?

If you need assistance setting up any of these services, let me know which option you'd prefer and I can provide more detailed instructions!
