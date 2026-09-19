import express from 'express';
import { getTasks, createTask, updateTask } from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('coordinator', 'admin'));

router.route('/').get(getTasks).post(createTask);
router.route('/:id').patch(updateTask);

export default router;
