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
    assignedToName?: string;
}

interface GetAllTasksOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
}

const createTask = async (
    title: string,
    description: string,
    assignedTo: string,
    priority: 'low' | 'medium' | 'high',
    dueDate: number,
    ownerId: string
) => {
    const employeeDoc = await db.collection('users').doc(assignedTo).get();
    if (!employeeDoc.exists) {
        throw new Error('Assigned employee not found');
    }

    const employeeData = employeeDoc.data();
    if (employeeData?.role !== 'employee') {
        throw new Error('Can only assign tasks to employees');
    }

    if (dueDate <= Date.now()) {
        throw new Error('Due date must be in the future');
    }

    const taskData: Task = {
        title,
        description,
        assignedTo,
        assignedBy: ownerId,
        status: 'pending',
        priority,
        dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    const docRef = await db.collection('tasks').add(taskData);

    const currentEmployee = employeeDoc.data();
    const assignedTasks = currentEmployee?.assignedTasks || [];
    assignedTasks.push(docRef.id);

    await db.collection('users').doc(assignedTo).update({
        assignedTasks,
        updatedAt: Date.now()
    });

    return { success: true, taskId: docRef.id };
};

const getAllTasks = async (options: GetAllTasksOptions = {}) => {
    const {
        page = 1,
        pageSize = 10,
        search = '',
        status,
        priority,
        assignedTo
    } = options;

    let query: FirebaseFirestore.Query = db.collection('tasks');

    if (status) {
        query = query.where('status', '==', status);
    }
    if (priority) {
        query = query.where('priority', '==', priority);
    }
    if (assignedTo) {
        query = query.where('assignedTo', '==', assignedTo);
    }

    const snapshot = await query.get();
    let tasks: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Task[];

    if (search) {
        const searchLower = search.toLowerCase();
        tasks = tasks.filter(
            (task: Task) =>
                task.title?.toLowerCase().includes(searchLower) ||
                task.description?.toLowerCase().includes(searchLower)
        );
    }

    const tasksWithNames = await Promise.all(
        tasks.map(async (task: Task) => {
            const employeeDoc = await db
                .collection('users')
                .doc(task.assignedTo)
                .get();
            const employeeData = employeeDoc.data();
            return {
                ...task,
                assignedToName: employeeData?.name || 'Unknown'
            };
        })
    );

    tasksWithNames.sort((a: Task, b: Task) => b.createdAt - a.createdAt);

    const total = tasksWithNames.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = tasksWithNames.slice(start, end);

    return {
        data: paginated,
        total,
        page,
        pageSize
    };
};

const getTask = async (taskId: string) => {
    const doc = await db.collection('tasks').doc(taskId).get();

    if (!doc.exists) {
        throw new Error('Task not found');
    }

    const taskData = doc.data();

    const employeeDoc = await db
        .collection('users')
        .doc(taskData?.assignedTo)
        .get();
    const employeeData = employeeDoc.data();

    return {
        id: doc.id,
        ...taskData,
        assignedToName: employeeData?.name || 'Unknown'
    };
};

const updateTask = async (
    taskId: string,
    updateData: {
        title?: string;
        description?: string;
        assignedTo?: string;
        status?: 'pending' | 'in-progress' | 'completed';
        priority?: 'low' | 'medium' | 'high';
        dueDate?: number;
    }
) => {
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
        throw new Error('Task not found');
    }

    const currentTask = taskDoc.data();

    if (
        updateData.assignedTo &&
        updateData.assignedTo !== currentTask?.assignedTo
    ) {
        const newEmployeeDoc = await db
            .collection('users')
            .doc(updateData.assignedTo)
            .get();
        if (!newEmployeeDoc.exists) {
            throw new Error('New assigned employee not found');
        }

        const newEmployeeData = newEmployeeDoc.data();
        if (newEmployeeData?.role !== 'employee') {
            throw new Error('Can only assign tasks to employees');
        }

        const oldEmployeeDoc = await db
            .collection('users')
            .doc(currentTask?.assignedTo)
            .get();
        if (oldEmployeeDoc.exists) {
            const oldEmployeeData = oldEmployeeDoc.data();
            const oldAssignedTasks = oldEmployeeData?.assignedTasks || [];
            const updatedOldTasks = oldAssignedTasks.filter(
                (id: string) => id !== taskId
            );

            await db.collection('users').doc(currentTask?.assignedTo).update({
                assignedTasks: updatedOldTasks,
                updatedAt: Date.now()
            });
        }

        const newAssignedTasks = newEmployeeData?.assignedTasks || [];
        newAssignedTasks.push(taskId);

        await db.collection('users').doc(updateData.assignedTo).update({
            assignedTasks: newAssignedTasks,
            updatedAt: Date.now()
        });
    }

    if (updateData.dueDate && updateData.dueDate <= Date.now()) {
        throw new Error('Due date must be in the future');
    }

    await db
        .collection('tasks')
        .doc(taskId)
        .update({
            ...updateData,
            updatedAt: Date.now()
        });

    return { success: true };
};

const deleteTask = async (taskId: string) => {
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
        throw new Error('Task not found');
    }

    const taskData = taskDoc.data();

    const employeeDoc = await db
        .collection('users')
        .doc(taskData?.assignedTo)
        .get();
    if (employeeDoc.exists) {
        const employeeData = employeeDoc.data();
        const assignedTasks = employeeData?.assignedTasks || [];
        const updatedTasks = assignedTasks.filter(
            (id: string) => id !== taskId
        );

        await db.collection('users').doc(taskData?.assignedTo).update({
            assignedTasks: updatedTasks,
            updatedAt: Date.now()
        });
    }

    await db.collection('tasks').doc(taskId).delete();

    return { success: true };
};

const getTasksByEmployee = async (employeeId: string) => {
    const employeeDoc = await db.collection('users').doc(employeeId).get();
    if (!employeeDoc.exists) {
        throw new Error('Employee not found');
    }

    const employeeData = employeeDoc.data();
    if (employeeData?.role !== 'employee') {
        throw new Error('User is not an employee');
    }

    const snapshot = await db
        .collection('tasks')
        .where('assignedTo', '==', employeeId)
        .get();

    const tasks: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Task[];

    tasks.sort((a: Task, b: Task) => b.createdAt - a.createdAt);

    return {
        employeeId,
        employeeName: employeeData?.name,
        tasks
    };
};

export const ownerTaskService = {
    createTask,
    getAllTasks,
    getTask,
    updateTask,
    deleteTask,
    getTasksByEmployee
};
