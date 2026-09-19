import { CoordinatorTask } from '../models/CoordinatorTask.js';
import { Incident } from '../models/Incident.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Get all tasks with optional incident filter
// @route   GET /api/tasks
// @access  Protected (Coordinator/Admin)
export const getTasks = async (req, res, next) => {
  try {
    const { incidentId, status } = req.query;
    const filter = {};
    if (incidentId) filter.incident = incidentId;
    if (status && status !== 'ALL') filter.status = status;

    const tasks = await CoordinatorTask.find(filter)
      .sort({ createdAt: -1 })
      .populate('incident', 'incidentType description location status')
      .populate('assignedTo', 'name email role organization')
      .populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coordinator task
// @route   POST /api/tasks
// @access  Protected (Coordinator/Admin)
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, incidentId, assignedToId, assignedToName, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.',
      });
    }

    const task = await CoordinatorTask.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'Medium',
      incident: incidentId || null,
      assignedTo: assignedToId || null,
      assignedToName: assignedToName || (assignedToId ? 'Assigned' : 'Unassigned'),
      createdBy: req.user._id,
      createdByName: req.user.name,
      deadline: deadline || null,
      status: assignedToId ? 'ASSIGNED' : 'PENDING',
    });

    if (incidentId) {
      const inc = await Incident.findById(incidentId);
      if (inc) {
        inc.timeline.push({
          eventType: 'TASK_CREATED',
          description: `Task created: "${task.title}" (Assigned: ${task.assignedToName})`,
          timestamp: new Date(),
          performedBy: req.user.name,
          performedByRole: req.user.role,
        });
        await inc.save();
      }
    }

    await AuditLog.create({
      action: 'TASK_CREATED',
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      targetType: 'CoordinatorTask',
      targetId: task._id,
      details: { title: task.title, priority: task.priority, incidentId },
    });

    res.status(201).json({
      success: true,
      message: 'Coordinator task created successfully.',
      task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status or assignment
// @route   PATCH /api/tasks/:id
// @access  Protected (Coordinator/Admin)
export const updateTask = async (req, res, next) => {
  try {
    const { status, assignedToId, assignedToName, description, priority, deadline } = req.body;
    let task = await CoordinatorTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const prevStatus = task.status;

    if (status) task.status = status;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (assignedToId !== undefined) {
      task.assignedTo = assignedToId;
      task.assignedToName = assignedToName || 'Assigned';
    }

    await task.save();

    await AuditLog.create({
      action: 'TASK_UPDATED',
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      targetType: 'CoordinatorTask',
      targetId: task._id,
      details: { previousStatus: prevStatus, newStatus: task.status },
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};
