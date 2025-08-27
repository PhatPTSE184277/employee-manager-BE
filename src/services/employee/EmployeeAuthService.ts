import { db } from '../../utils/firebase';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface Employee {
    id?: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    address?: string;
    username?: string;
    password?: string;
    isAccountSetup: boolean;
    verificationToken?: string;
    assignedTasks: string[];
    createdAt: number;
    updatedAt: number;
}

const setupAccount = async (
    token: string,
    username: string,
    password: string
) => {
    try {
        const employeeQuery = await db
            .collection('users')
            .where('verificationToken', '==', token)
            .where('role', '==', 'employee')
            .get();

        if (employeeQuery.empty) {
            throw new Error('Invalid or expired verification token');
        }

        const employeeDoc = employeeQuery.docs[0];
        const employeeData = employeeDoc.data();

        if (employeeData?.isAccountSetup) {
            throw new Error('Account already setup');
        }

        const usernameQuery = await db
            .collection('users')
            .where('username', '==', username)
            .get();

        if (!usernameQuery.empty) {
            throw new Error('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection('users').doc(employeeDoc.id).update({
            username,
            password: hashedPassword,
            isAccountSetup: true,
            isVerified: true,
            verificationToken: null,
            updatedAt: Date.now()
        });

        return { success: true, message: 'Account setup successfully' };
    } catch (error: any) {
        throw error;
    }
};

const login = async (username: string, password: string) => {
    const usernameQuery = await db
        .collection('users')
        .where('username', '==', username)
        .where('role', '==', 'employee')
        .get();

    if (usernameQuery.empty) {
        throw new Error('Invalid username or password');
    }

    const employeeDoc = usernameQuery.docs[0];
    const employeeData = employeeDoc.data();

    if (!employeeData.isAccountSetup) {
        throw new Error(
            'Account not setup yet. Please check your email for setup link.'
        );
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        employeeData.password
    );
    if (!isPasswordValid) {
        throw new Error('Invalid username or password');
    }

    const token = jwt.sign(
        {
            userId: employeeDoc.id,
            username: employeeData.username,
            role: employeeData.role,
            email: employeeData.email,
            name: employeeData.name
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
    );

    return {
        success: true,
        token,
        user: {
            id: employeeDoc.id,
            name: employeeData.name,
            email: employeeData.email,
            username: employeeData.username,
            role: employeeData.role,
            phoneNumber: employeeData.phoneNumber
        }
    };
};

export const employeeAuthService = {
    setupAccount,
    login
};
