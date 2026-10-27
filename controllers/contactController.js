const { sendContactMessageToAdmin } = require("../emailService/emailService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public "Contact us" form (also used by the footer newsletter sign-up).
// Delivers the message to the team inbox; replying goes straight to the sender.
const handleContactMessage = async (req, res) => {
  const { fullName, email, phone, message, website } = req.body || {};

  // Spam trap: the "website" field is hidden from people, so only bots fill it.
  if (website) {
    return res.status(200).json({ msg: "Thanks! Your message has been sent." });
  }

  if ([fullName, email, message].some((v) => typeof v !== "string" || !v.trim())) {
    return res.status(400).json({ msg: "Please fill in your name, email and message." });
  }
  if (email.length > 200 || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ msg: "Please provide a valid email address." });
  }
  if (fullName.length > 100 || message.length > 5000 || String(phone || "").length > 30) {
    return res.status(400).json({ msg: "Your message is too long. Please shorten it and try again." });
  }

  const sent = await sendContactMessageToAdmin({
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone ? String(phone).trim() : "",
    message: message.trim(),
  });

  if (!sent) {
    return res
      .status(500)
      .json({ msg: "We couldn't send your message right now. Please email us directly." });
  }

  res.status(200).json({ msg: "Thanks! Your message has been sent." });
};

module.exports = { handleContactMessage };
