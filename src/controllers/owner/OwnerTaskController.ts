import { db } from '../../utils/firebase';

interface CreateTaskData {
    title: string;
    description?: string;
    assignedTo: string;
    assignedBy: string;
    dueDate: string;
    priority?: 'low' | 'medium' | 'high';
}

const createTask = async (req: any, res: any) => {
    try {
        const { title, description, assignedTo, dueDate, priority } = req.body;

        if (!title || !assignedTo || !dueDate) {
            return res.status(400).json({
                error: 'Missing required fields: title, assignedTo, dueDate'
            });
        }

        const taskData = {
            title,
            description: description || '',
            assignedTo,
            assignedBy: req.user?.userId || '',
            dueDate,
            priority: priority || 'medium',
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const docRef = await db.collection('tasks').add(taskData);
        res.status(200).json({ success: true, taskId: docRef.id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const getTasks = async (req: any, res: any) => {
    try {
        const { assignedTo, status, page = 1, pageSize = 10 } = req.query;

        let query: FirebaseFirestore.Query = db.collection('tasks');

        if (assignedTo) {
            query = query.where('assignedTo', '==', assignedTo);
        }
        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        const allTasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        const total = allTasks.length;
        const start =
            (parseInt(page as string) - 1) * parseInt(pageSize as string);
        const end = start + parseInt(pageSize as string);
        const tasks = allTasks.slice(start, end);

        res.status(200).json({
            data: tasks,
            total,
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const getTask = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({ error: 'taskId required' });
        }

        const doc = await db.collection('tasks').doc(taskId).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const updateTask = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;
        const updateData = req.body;

        if (!taskId) {
            return res.status(400).json({ error: 'taskId required' });
        }

        const docRef = db.collection('tasks').doc(taskId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await docRef.update({
            ...updateData,
            updatedAt: Date.now()
        });

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const deleteTask = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({ error: 'taskId required' });
        }

        const docRef = db.collection('tasks').doc(taskId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await docRef.delete();
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const updateTaskStatus = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        if (!taskId || !status) {
            return res
                .status(400)
                .json({ error: 'taskId and status required' });
        }

        const docRef = db.collection('tasks').doc(taskId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await docRef.update({
            status,
            updatedAt: Date.now()
        });

        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const ownerTaskController = {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    updateTaskStatus
};
