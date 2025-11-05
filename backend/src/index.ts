import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import uploadRoutes from './routes/upload';
import scheduleRoutes from './routes/schedule';
import instructorRoutes from './routes/instructor';
import offDayRoutes from './routes/offDay';
import courseRoutes from './routes/course';
import schoolHolidayRoutes from './routes/schoolHoliday';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api', scheduleRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/off-days', offDayRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', schoolHolidayRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
