import { db } from '../../utils/firebase';
import { sendWelcomeEmail } from '../../utils/sendWelcomeEmail';
import { v4 as uuidv4 } from 'uuid';

const validateEmployeeInfo = async (
    email: string,
    phoneNumber: string,
    excludeId?: string
) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }

    const phoneRegex = /^\d{9,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
    }

    let emailQuery = db.collection('users').where('email', '==', email);
    if (excludeId) emailQuery = emailQuery.where('__name__', '!=', excludeId);
    const emailSnap = await emailQuery.get();
    if (!emailSnap.empty) {
        throw new Error('Email already exists');
    }

    let phoneQuery = db
        .collection('users')
        .where('phoneNumber', '==', phoneNumber);
    if (excludeId) phoneQuery = phoneQuery.where('__name__', '!=', excludeId);
    const phoneSnap = await phoneQuery.get();
    if (!phoneSnap.empty) {
        throw new Error('Phone number already exists');
    }
};

interface GetAllEmployeesOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    department?: string;
    isVerified?: boolean;
}

const getAllEmployees = async (options: GetAllEmployeesOptions = {}) => {
    const {
        page = 1,
        pageSize = 10,
        search = '',
        department,
        isVerified
    } = options;

    let query: FirebaseFirestore.Query = db
        .collection('users')
        .where('role', '==', 'employee');

    if (department) {
        query = query.where('department', '==', department);
    }
    if (typeof isVerified === 'boolean') {
        query = query.where('isVerified', '==', isVerified);
    }

    const snapshot = await query.get();
    let employees = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    if (search) {
        const searchLower = search.toLowerCase();
        employees = employees.filter(
            (emp: any) =>
                emp.name?.toLowerCase().includes(searchLower) ||
                emp.email?.toLowerCase().includes(searchLower)
        );
    }

    const total = employees.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = employees.slice(start, end);

    return {
        data: paginated,
        total,
        page,
        pageSize
    };
};

const getEmployee = async (employeeId: string) => {
    const doc = await db.collection('users').doc(employeeId).get();

    if (!doc.exists) {
        throw new Error('Employee not found');
    }

    const data = doc.data();
    if (data?.role !== 'employee') {
        throw new Error('Not an employee');
    }

    return {
        id: doc.id,
        ...data
    };
};

const createEmployee = async (
    name: string,
    email: string,
    phoneNumber: string,
    role: string,
    address: string
) => {
    await validateEmployeeInfo(email, phoneNumber);

    const verificationToken = uuidv4();

    const userData = {
        name,
        email,
        phoneNumber,
        address,
        role,
        isVerified: false,
        verificationToken,
        workSchedule: [],
        assignedTasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    const docRef = await db.collection('users').add(userData);

    await sendWelcomeEmail(email, name, verificationToken);

    return { success: true, employeeId: docRef.id };
};

const updateEmployee = async (
    employeeId: string,
    updateData: {
        name?: string;
        email?: string;
        phoneNumber?: string;
        role?: string;
        address?: string;
    }
) => {
    const docRef = db.collection('users').doc(employeeId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Employee not found');
    const data = doc.data();
    if (data?.role !== 'employee') throw new Error('Not an employee');

    if (
        (updateData.email && updateData.email !== data.email) ||
        (updateData.phoneNumber && updateData.phoneNumber !== data.phoneNumber)
    ) {
        await validateEmployeeInfo(
            updateData.email || data.email,
            updateData.phoneNumber || data.phoneNumber,
            employeeId
        );
    }

    await docRef.update({
        ...updateData,
        updatedAt: Date.now()
    });

    return { success: true };
};

const deleteEmployee = async (employeeId: string) => {
    const docRef = db.collection('users').doc(employeeId);
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Employee not found');
    const data = doc.data();
    if (data?.role !== 'employee') throw new Error('Not an employee');
    await docRef.delete();
    return { success: true };
};

export const ownerEmployeeService = {
    getAllEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
