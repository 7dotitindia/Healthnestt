import { SITE_NAME, SITE_URL } from "./constants";

// Plain, safe email templates. Anything that came from a person (titles, notes, names) is escaped before it
// goes into HTML, so nobody can inject markup or links into an email we send.
export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const absolute = (path) => `${SITE_URL}${path}`;

const INDIGO = "#514dbc";

function button(href, label) {
  return `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:${INDIGO};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:999px">${esc(label)}</a></p>`;
}

function layout({ heading, bodyHtml, footer }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;background:#efefef;font-family:Arial,Helvetica,sans-serif;color:#181818">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <p style="margin:0 0 16px;font-weight:800;font-size:18px;color:${INDIGO}">${esc(SITE_NAME)}</p>
  <div style="background:#ffffff;border-radius:20px;padding:28px">
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600">${esc(heading)}</h1>
    ${bodyHtml}
  </div>
  <p style="margin:16px 4px 0;font-size:12px;line-height:1.5;color:#6f6f6f">${footer}</p>
</div></body></html>`;
}

const staffFooter = `You are receiving this because you have a ${esc(SITE_NAME)} staff account.`;

export function confirmSubscriptionEmail({ link }) {
  return {
    subject: `Confirm your ${SITE_NAME} subscription`,
    html: layout({
      heading: "Confirm your subscription",
      bodyHtml: `<p style="margin:0;color:#444;line-height:1.6">Thanks for signing up for the ${esc(SITE_NAME)} weekly email. Please confirm your address to start receiving it.</p>${button(link, "Confirm subscription")}<p style="margin:0;color:#6f6f6f;font-size:13px;line-height:1.5">This link works for 7 days. If you did not sign up, ignore this email and nothing will happen.</p>`,
      footer: `You are receiving this because someone entered this address on ${esc(SITE_NAME)}.`,
    }),
    text: `Confirm your ${SITE_NAME} subscription\n\nThanks for signing up for the weekly email. Confirm your address:\n${link}\n\nThis link works for 7 days. If you did not sign up, ignore this email.`,
  };
}

export function articleSubmittedEmail({ title, authorName, link }) {
  return {
    subject: `Ready for review: ${title}`,
    html: layout({
      heading: "An article is ready for review",
      bodyHtml: `<p style="margin:0;color:#444;line-height:1.6"><b>${esc(authorName)}</b> submitted <b>${esc(title)}</b>.</p>${button(link, "Open the review")}`,
      footer: staffFooter,
    }),
    text: `${authorName} submitted "${title}" for review.\n\nOpen it: ${link}`,
  };
}

export function changesRequestedEmail({ title, note, link }) {
  return {
    subject: `Changes requested: ${title}`,
    html: layout({
      heading: "Changes requested",
      bodyHtml: `<p style="margin:0 0 12px;color:#444;line-height:1.6">The editor asked for changes to <b>${esc(title)}</b>:</p><blockquote style="margin:0;padding:12px 16px;background:#f4f4f4;border-left:4px solid ${INDIGO};border-radius:8px;color:#181818;line-height:1.6;white-space:pre-wrap">${esc(note)}</blockquote>${button(link, "Open your article")}`,
      footer: staffFooter,
    }),
    text: `The editor asked for changes to "${title}":\n\n${note}\n\nOpen your article: ${link}`,
  };
}

export function articleApprovedEmail({ title, link }) {
  return {
    subject: `Approved: ${title}`,
    html: layout({
      heading: "Your article was approved",
      bodyHtml: `<p style="margin:0;color:#444;line-height:1.6"><b>${esc(title)}</b> was approved and will be published soon.</p>${button(link, "Open your article")}`,
      footer: staffFooter,
    }),
    text: `"${title}" was approved and will be published soon.\n\nOpen your article: ${link}`,
  };
}

export function articlePublishedEmail({ title, link }) {
  return {
    subject: `Published: ${title}`,
    html: layout({
      heading: "Your article is live",
      bodyHtml: `<p style="margin:0;color:#444;line-height:1.6"><b>${esc(title)}</b> is now published on ${esc(SITE_NAME)}.</p>${button(link, "View it on the site")}`,
      footer: staffFooter,
    }),
    text: `"${title}" is now published.\n\nView it: ${link}`,
  };
}

export function testEmail({ provider }) {
  return {
    subject: `${SITE_NAME} test email`,
    html: layout({
      heading: "Email is working",
      bodyHtml: `<p style="margin:0;color:#444;line-height:1.6">This is a test email from ${esc(SITE_NAME)}. Mode: <b>${esc(provider)}</b>.</p>`,
      footer: staffFooter,
    }),
    text: `This is a test email from ${SITE_NAME}. Mode: ${provider}.`,
  };
}
