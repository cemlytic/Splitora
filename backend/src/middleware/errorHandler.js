export const errorHandler = (err, req, res, next) => {
  if (err.isAppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err.name === "ZodError") {
    const firstIssue = err.issues?.[0];
    const message = firstIssue
      ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
      : "Invalid request data";
    return res.status(400).json({ message });
  }

  console.error("[Unhandled error]", err);
  return res.status(500).json({ message: "Internal server error" });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
