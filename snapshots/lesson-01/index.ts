import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import noteRoutes from './routes/notes.js';
import authRouter from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(noteRoutes);
app.use(authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      if (isProduction) {
        console.log(
          JSON.stringify({
            event: 'server_start',
            port: PORT,
            env: process.env.NODE_ENV,
          }),
        );
      } else {
      }
      console.log(`[dev] Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });
