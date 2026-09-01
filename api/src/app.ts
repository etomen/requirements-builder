import express from "express";
import cors from "cors";
import morgan from "morgan";
import "express-async-errors";
import mongoose from "mongoose";

import applicationRoutes from "./routes/application.routes";
import requirementRoutes from "./routes/requirement.routes";
import userRoutes from "./routes/user.routes";
import tagRoutes from "./routes/tag.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/requirements_builder";
mongoose.connect(MONGO_URI).then(() => {
  // eslint-disable-next-line no-console
  console.log("Connected to MongoDB");
}).catch(err => {
  // eslint-disable-next-line no-console
  console.error("Mongo connection error:", err);
});

app.use("/api/applications", applicationRoutes);
app.use("/api/requirements", requirementRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tags", tagRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // simple error handler
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
