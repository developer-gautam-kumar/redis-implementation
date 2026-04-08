import 'dotenv/config';
import { app } from "./src/app.js";
import connectDB from "./src/config/db.js";

// Connect MongoDB then start server
connectDB().then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
  });
});