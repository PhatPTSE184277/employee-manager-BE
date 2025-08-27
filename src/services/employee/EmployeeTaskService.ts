import { db } from '../../utils/firebase';

interface Task {
    id?: string;
    title: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
    status: 'pending' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate: number;
    createdAt: number;
    updatedAt: number;
    assignedByName?: string;
}

const getMyTasks = async (employeeId: string, status?: string) => {
    const employeeDoc = await db.collection('users').doc(employeeId).get();
    if (!employeeDoc.exists) {
        throw new Error('Employee not found');
    }

    const employeeData = employeeDoc.data();
    if (employeeData?.role !== 'employee') {
        throw new Error('User is not an employee');
    }

    let query: FirebaseFirestore.Query = db
        .collection('tasks')
        .where('assignedTo', '==', employeeId);

    if (status) {
        query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let tasks: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Task[];

    const tasksWithNames = await Promise.all(
        tasks.map(async (task: Task) => {
            const ownerDoc = await db
                .collection('users')
                .doc(task.assignedBy)
                .get();
            const ownerData = ownerDoc.data();
            return {
                ...task,
                assignedByName: ownerData?.name || 'Unknown'
            };
        })
    );

    tasksWithNames.sort((a: Task, b: Task) => b.createdAt - a.createdAt);

    return {
        employeeId,
        employeeName: employeeData.name,
        tasks: tasksWithNames
    };
};

const getMyTask = async (employeeId: string, taskId: string) => {
    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
        throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    if (taskData?.assignedTo !== employeeId) {
        throw new Error('You can only view tasks assigned to you');
    }

    const ownerDoc = await db
        .collection('users')
        .doc(taskData.assignedBy)
        .get();
    const ownerData = ownerDoc.data();

    return {
        id: taskDoc.id,
        ...taskData,
        assignedByName: ownerData?.name || 'Unknown'
    };
};

const updateTaskStatus = async (
    employeeId: string,
    taskId: string,
    status: 'pending' | 'in-progress' | 'completed'
) => {
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
        throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    if (taskData?.assignedTo !== employeeId) {
        throw new Error('You can only update tasks assigned to you');
    }

    const currentStatus = taskData.status;
    const validTransitions: { [key: string]: string[] } = {
        pending: ['in-progress'],
        'in-progress': ['completed', 'pending'],
        completed: ['in-progress']
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
        throw new Error(
            `Cannot change status from ${currentStatus} to ${status}`
        );
    }

    await db.collection('tasks').doc(taskId).update({
        status,
        updatedAt: Date.now()
    });

    return {
        success: true,
        message: 'Task status updated successfully',
        newStatus: status
    };
};

const getTaskStats = async (employeeId: string) => {
    const employeeDoc = await db.collection('users').doc(employeeId).get();
    if (!employeeDoc.exists) {
        throw new Error('Employee not found');
    }

    const snapshot = await db
        .collection('tasks')
        .where('assignedTo', '==', employeeId)
        .get();

    const tasks = snapshot.docs.map((doc) => doc.data());

    const stats = {
        total: tasks.length,
        pending: tasks.filter((task) => task.status === 'pending').length,
        inProgress: tasks.filter((task) => task.status === 'in-progress')
            .length,
        completed: tasks.filter((task) => task.status === 'completed').length,
        overdue: tasks.filter(
            (task) => task.dueDate < Date.now() && task.status !== 'completed'
        ).length
    };

    return stats;
};

export const employeeTaskService = {
    getMyTasks,
    getMyTask,
    updateTaskStatus,
    getTaskStats
};
