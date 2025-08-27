import { employeeTaskService } from '../../services/employee/EmployeeTaskService';

const getMyTasks = async (req: any, res: any) => {
    try {
        const employeeId = req.user?.userId;
        const { status } = req.query;

        if (!employeeId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await employeeTaskService.getMyTasks(employeeId, status);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

const getMyTask = async (req: any, res: any) => {
    try {
        const employeeId = req.user?.userId;
        const { taskId } = req.params;

        if (!employeeId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!taskId) {
            return res.status(400).json({ error: 'taskId required' });
        }

        const result = await employeeTaskService.getMyTask(employeeId, taskId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

const updateTaskStatus = async (req: any, res: any) => {
    try {
        const employeeId = req.user?.userId;
        const { taskId } = req.params;
        const { status } = req.body;

        if (!employeeId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!taskId || !status) {
            return res.status(400).json({
                error: 'Missing required fields: taskId, status'
            });
        }

        const validStatuses = ['pending', 'in-progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be: pending, in-progress, or completed'
            });
        }

        const result = await employeeTaskService.updateTaskStatus(
            employeeId,
            taskId,
            status
        );
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

const getTaskStats = async (req: any, res: any) => {
    try {
        const employeeId = req.user?.userId;

        if (!employeeId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await employeeTaskService.getTaskStats(employeeId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

export const employeeTaskController = {
    getMyTasks,
    getMyTask,
    updateTaskStatus,
    getTaskStats
};
