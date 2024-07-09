// pages/api/check-auth.js

import withSession from "@/lib/session";

const handler = (req, res) => {
  const tokens = req.session.get("tokens");

  if (tokens) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(200).json({ authenticated: false });
  }
};

export default withSession(handler);
