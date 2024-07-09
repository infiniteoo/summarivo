import withSession from "@/lib/session";

const handler = async (req, res) => {
  req.session.destroy();
  res.status(200).json({ message: "Tokens cleared" });
};

export default withSession(handler);
